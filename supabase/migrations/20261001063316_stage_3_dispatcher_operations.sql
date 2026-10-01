-- Stage 3: dispatcher operations and technician assignment

drop policy if exists jobs_update on public.jobs;

create policy jobs_dispatcher_update
on public.jobs
for update
to authenticated
using (
  (select private.user_has_org_role(
    jobs.organization_id,
    array['dispatcher','admin']::public.app_role[]
  ))
)
with check (
  (select private.user_has_org_role(
    jobs.organization_id,
    array['dispatcher','admin']::public.app_role[]
  ))
);

create policy assignments_insert
on public.assignments
for insert
to authenticated
with check (
  assigned_by = (select auth.uid())
  and (select private.user_has_org_role(
    (select j.organization_id from public.jobs j where j.id = assignments.job_id),
    array['dispatcher','admin']::public.app_role[]
  ))
  and exists (
    select 1
    from public.organization_memberships m
    join public.jobs j on j.organization_id = m.organization_id
    where j.id = assignments.job_id
      and m.user_id = assignments.technician_id
      and m.role = 'technician'
      and m.status = 'active'
  )
);

create policy assignments_update
on public.assignments
for update
to authenticated
using (
  (select private.user_has_org_role(
    (select j.organization_id from public.jobs j where j.id = assignments.job_id),
    array['dispatcher','admin']::public.app_role[]
  ))
  and assignments.unassigned_at is null
)
with check (
  (select private.user_has_org_role(
    (select j.organization_id from public.jobs j where j.id = assignments.job_id),
    array['dispatcher','admin']::public.app_role[]
  ))
  and assignments.unassigned_at is not null
);

create or replace function public.guard_assignment_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.job_id <> new.job_id
     or old.technician_id <> new.technician_id
     or old.assigned_by <> new.assigned_by
     or old.assigned_at <> new.assigned_at then
    raise exception 'ASSIGNMENT_HISTORY_IMMUTABLE';
  end if;

  if old.unassigned_at is not null then
    raise exception 'ASSIGNMENT_ALREADY_CLOSED';
  end if;

  if new.unassigned_at is null then
    raise exception 'ASSIGNMENT_CLOSE_REQUIRED';
  end if;

  return new;
end;
$$;

drop trigger if exists assignment_history_guard on public.assignments;
create trigger assignment_history_guard
before update on public.assignments
for each row
execute function public.guard_assignment_history();

create or replace function public.guard_job_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'requested' and new.status in ('assigned', 'cancelled'))
      or (old.status = 'assigned' and new.status in ('requested', 'in_progress', 'cancelled'))
      or (old.status = 'in_progress' and new.status = 'completed')
      or (old.status = 'completed' and new.status = 'awaiting_signoff')
      or (old.status = 'awaiting_signoff' and new.status = 'signed_off')
      or (old.status = 'signed_off' and new.status = 'invoiced')
    ) then
      raise exception 'INVALID_JOB_STATUS_TRANSITION'
        using detail = format('Cannot move job from %s to %s.', old.status, new.status);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists job_status_transition_guard on public.jobs;
create trigger job_status_transition_guard
before update on public.jobs
for each row
execute function public.guard_job_status_transition();

create or replace function public.create_job_for_request(p_request_id uuid)
returns public.jobs
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_request public.service_requests;
  v_job public.jobs;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select r.* into v_request
  from public.service_requests r
  where r.id = p_request_id;

  if v_request.id is null then
    raise exception 'REQUEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not (select private.user_has_org_role(
    v_request.organization_id,
    array['dispatcher','admin']::public.app_role[]
  )) then
    raise exception 'DISPATCHER_REQUIRED' using errcode = '42501';
  end if;

  select j.* into v_job
  from public.jobs j
  where j.request_id = p_request_id
  order by j.created_at
  limit 1;

  if v_job.id is not null then
    return v_job;
  end if;

  insert into public.jobs (organization_id, request_id, status)
  values (v_request.organization_id, v_request.id, 'requested')
  returning * into v_job;

  update public.service_requests
  set status = 'accepted', updated_at = now()
  where id = v_request.id;

  insert into public.audit_events (
    organization_id, actor_id, entity_type, entity_id, action, metadata
  )
  values (
    v_request.organization_id, v_user_id, 'job', v_job.id,
    'job.created_from_request',
    jsonb_build_object('request_id', v_request.id)
  );

  return v_job;
end;
$$;

create or replace function public.assign_job(
  p_job_id uuid,
  p_technician_id uuid
)
returns public.assignments
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_job public.jobs;
  v_membership public.organization_memberships;
  v_assignment public.assignments;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select j.* into v_job from public.jobs j where j.id = p_job_id;

  if v_job.id is null then
    raise exception 'JOB_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not (select private.user_has_org_role(
    v_job.organization_id,
    array['dispatcher','admin']::public.app_role[]
  )) then
    raise exception 'DISPATCHER_REQUIRED' using errcode = '42501';
  end if;

  if v_job.status not in ('requested','assigned') then
    raise exception 'JOB_NOT_ASSIGNABLE' using errcode = 'P0001';
  end if;

  select m.* into v_membership
  from public.organization_memberships m
  where m.organization_id = v_job.organization_id
    and m.user_id = p_technician_id
    and m.role = 'technician'
    and m.status = 'active'
  limit 1;

  if v_membership.id is null then
    raise exception 'TECHNICIAN_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  update public.assignments
  set unassigned_at = now()
  where job_id = p_job_id
    and unassigned_at is null;

  insert into public.assignments (job_id, technician_id, assigned_by)
  values (p_job_id, p_technician_id, v_user_id)
  returning * into v_assignment;

  update public.jobs
  set status = 'assigned', updated_at = now()
  where id = p_job_id;

  update public.service_requests
  set status = 'scheduled', updated_at = now()
  where id = v_job.request_id;

  insert into public.audit_events (
    organization_id, actor_id, entity_type, entity_id, action, metadata
  )
  values (
    v_job.organization_id, v_user_id, 'job', p_job_id, 'job.assigned',
    jsonb_build_object('technician_id', p_technician_id)
  );

  return v_assignment;
end;
$$;

create or replace function public.unassign_job(
  p_job_id uuid,
  p_assignment_id uuid
)
returns public.assignments
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_job public.jobs;
  v_assignment public.assignments;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select j.* into v_job from public.jobs j where j.id = p_job_id;

  if v_job.id is null then
    raise exception 'JOB_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not (select private.user_has_org_role(
    v_job.organization_id,
    array['dispatcher','admin']::public.app_role[]
  )) then
    raise exception 'DISPATCHER_REQUIRED' using errcode = '42501';
  end if;

  if v_job.status <> 'assigned' then
    raise exception 'JOB_NOT_UNASSIGNABLE' using errcode = 'P0001';
  end if;

  update public.assignments
  set unassigned_at = now()
  where id = p_assignment_id
    and job_id = p_job_id
    and unassigned_at is null
  returning * into v_assignment;

  if v_assignment.id is null then
    raise exception 'ASSIGNMENT_NOT_ACTIVE' using errcode = 'P0002';
  end if;

  update public.jobs
  set status = 'requested', updated_at = now()
  where id = p_job_id;

  update public.service_requests
  set status = 'accepted', updated_at = now()
  where id = v_job.request_id;

  insert into public.audit_events (
    organization_id, actor_id, entity_type, entity_id, action, metadata
  )
  values (
    v_job.organization_id, v_user_id, 'job', p_job_id, 'job.unassigned',
    jsonb_build_object(
      'assignment_id', p_assignment_id,
      'technician_id', v_assignment.technician_id
    )
  );

  return v_assignment;
end;
$$;

revoke execute on function public.create_job_for_request(uuid) from public, anon;
grant execute on function public.create_job_for_request(uuid) to authenticated;

revoke execute on function public.assign_job(uuid, uuid) from public, anon;
grant execute on function public.assign_job(uuid, uuid) to authenticated;

revoke execute on function public.unassign_job(uuid, uuid) from public, anon;
grant execute on function public.unassign_job(uuid, uuid) to authenticated;

create index if not exists assignments_job_active
on public.assignments (job_id, unassigned_at);

create index if not exists memberships_org_role_status
on public.organization_memberships (organization_id, role, status);
