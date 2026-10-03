create or replace function public.start_job_work(p_job_id uuid)
returns public.jobs
language plpgsql
security definer
set search_path = ''
as $function$
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

  if not exists (
    select 1 from public.organization_memberships m
    where m.organization_id = v_job.organization_id
      and m.user_id = v_user_id
      and m.role = 'technician'
      and m.status = 'active'
  ) then
    raise exception 'TECHNICIAN_REQUIRED' using errcode = '42501';
  end if;

  select a.* into v_assignment
  from public.assignments a
  where a.job_id = p_job_id
    and a.technician_id = v_user_id
    and a.unassigned_at is null
  order by a.assigned_at desc
  limit 1;

  if v_assignment.id is null then
    raise exception 'ACTIVE_ASSIGNMENT_REQUIRED' using errcode = '42501';
  end if;

  if v_job.status <> 'assigned' then
    raise exception 'JOB_NOT_STARTABLE' using errcode = 'P0001';
  end if;

  update public.jobs
  set status = 'in_progress', started_at = coalesce(started_at, now()), updated_at = now()
  where id = p_job_id
  returning * into v_job;

  update public.service_requests
  set status = 'in_progress', updated_at = now()
  where id = v_job.request_id;

  insert into public.audit_events (organization_id, actor_id, entity_type, entity_id, action, metadata)
  values (v_job.organization_id, v_user_id, 'job', p_job_id, 'job.started', jsonb_build_object('technician_id', v_user_id));

  return v_job;
end;
$function$;

create or replace function public.add_work_log(p_job_id uuid, p_note text)
returns public.work_logs
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_job public.jobs;
  v_log public.work_logs;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select j.* into v_job from public.jobs j where j.id = p_job_id;
  if v_job.id is null then
    raise exception 'JOB_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.assignments a
    where a.job_id = p_job_id and a.technician_id = v_user_id and a.unassigned_at is null
  ) then
    raise exception 'ACTIVE_ASSIGNMENT_REQUIRED' using errcode = '42501';
  end if;

  if v_job.status <> 'in_progress' then
    raise exception 'JOB_NOT_IN_PROGRESS' using errcode = 'P0001';
  end if;

  insert into public.work_logs (job_id, technician_id, note, started_at, ended_at)
  values (p_job_id, v_user_id, nullif(btrim(coalesce(p_note, '')), ''), now(), now())
  returning * into v_log;

  insert into public.audit_events (organization_id, actor_id, entity_type, entity_id, action, metadata)
  values (v_job.organization_id, v_user_id, 'job', p_job_id, 'job.work_log_added', jsonb_build_object('work_log_id', v_log.id));

  return v_log;
end;
$function$;

create or replace function public.add_part_usage(
  p_job_id uuid,
  p_part_name text,
  p_quantity integer,
  p_unit_price_snapshot_cents bigint
)
returns public.part_usages
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_job public.jobs;
  v_part public.part_usages;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select j.* into v_job from public.jobs j where j.id = p_job_id;
  if v_job.id is null then
    raise exception 'JOB_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.assignments a
    where a.job_id = p_job_id and a.technician_id = v_user_id and a.unassigned_at is null
  ) then
    raise exception 'ACTIVE_ASSIGNMENT_REQUIRED' using errcode = '42501';
  end if;

  if v_job.status <> 'in_progress' then
    raise exception 'JOB_NOT_IN_PROGRESS' using errcode = 'P0001';
  end if;

  if nullif(btrim(coalesce(p_part_name, '')), '') is null or p_quantity <= 0 or p_unit_price_snapshot_cents < 0 then
    raise exception 'INVALID_PART' using errcode = '22023';
  end if;

  insert into public.part_usages (job_id, part_name, quantity, unit_price_snapshot_cents)
  values (p_job_id, btrim(p_part_name), p_quantity, p_unit_price_snapshot_cents)
  returning * into v_part;

  insert into public.audit_events (organization_id, actor_id, entity_type, entity_id, action, metadata)
  values (
    v_job.organization_id, v_user_id, 'job', p_job_id, 'job.part_added',
    jsonb_build_object('part_usage_id', v_part.id, 'part_name', v_part.part_name, 'quantity', v_part.quantity)
  );

  return v_part;
end;
$function$;

create or replace function public.complete_job(p_job_id uuid, p_completion_notes text)
returns public.jobs
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_job public.jobs;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select j.* into v_job from public.jobs j where j.id = p_job_id;
  if v_job.id is null then
    raise exception 'JOB_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.assignments a
    where a.job_id = p_job_id and a.technician_id = v_user_id and a.unassigned_at is null
  ) then
    raise exception 'ACTIVE_ASSIGNMENT_REQUIRED' using errcode = '42501';
  end if;

  if v_job.status <> 'in_progress' then
    raise exception 'JOB_NOT_IN_PROGRESS' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.work_logs w where w.job_id = p_job_id) then
    raise exception 'WORK_LOG_REQUIRED' using errcode = 'P0001';
  end if;

  update public.jobs
  set status = 'completed', completed_at = now(), completion_notes = nullif(btrim(coalesce(p_completion_notes, '')), ''), updated_at = now()
  where id = p_job_id
  returning * into v_job;

  update public.service_requests
  set status = 'completed', updated_at = now()
  where id = v_job.request_id;

  insert into public.audit_events (organization_id, actor_id, entity_type, entity_id, action, metadata)
  values (v_job.organization_id, v_user_id, 'job', p_job_id, 'job.completed', jsonb_build_object('technician_id', v_user_id));

  return v_job;
end;
$function$;

revoke execute on function public.start_job_work(uuid) from public, anon;
grant execute on function public.start_job_work(uuid) to authenticated;
revoke execute on function public.add_work_log(uuid, text) from public, anon;
grant execute on function public.add_work_log(uuid, text) to authenticated;
revoke execute on function public.add_part_usage(uuid, text, integer, bigint) from public, anon;
grant execute on function public.add_part_usage(uuid, text, integer, bigint) to authenticated;
revoke execute on function public.complete_job(uuid, text) from public, anon;
grant execute on function public.complete_job(uuid, text) to authenticated;
