create or replace function public.assign_job(p_job_id uuid, p_technician_id uuid)
returns public.assignments
language plpgsql
security definer
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

  select j.* into v_job
  from public.jobs j
  where j.id = p_job_id;

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
    raise exception 'JOB_NOT_ASSIGNABLE'
      using errcode = 'P0001',
            detail = format('Job status is %s.', v_job.status);
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

  update public.service_requests r
  set status = 'scheduled', updated_at = now()
  where r.id = v_job.request_id;

  insert into public.audit_events (
    organization_id, actor_id, entity_type, entity_id, action, metadata
  )
  values (
    v_job.organization_id,
    v_user_id,
    'job',
    p_job_id,
    'job.assigned',
    jsonb_build_object('technician_id', p_technician_id)
  );

  return v_assignment;
end;
$$;

revoke execute on function public.assign_job(uuid, uuid) from public;
revoke execute on function public.assign_job(uuid, uuid) from anon;
grant execute on function public.assign_job(uuid, uuid) to authenticated;
