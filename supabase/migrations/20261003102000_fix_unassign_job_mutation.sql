create or replace function public.unassign_job(p_job_id uuid, p_assignment_id uuid)
returns public.assignments
language plpgsql
security definer
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

  if v_job.status <> 'assigned' then
    raise exception 'JOB_NOT_UNASSIGNABLE'
      using errcode = 'P0001',
            detail = format('Job status is %s.', v_job.status);
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

  update public.service_requests r
  set status = 'accepted', updated_at = now()
  where r.id = v_job.request_id;

  insert into public.audit_events (
    organization_id, actor_id, entity_type, entity_id, action, metadata
  )
  values (
    v_job.organization_id,
    v_user_id,
    'job',
    p_job_id,
    'job.unassigned',
    jsonb_build_object(
      'assignment_id', p_assignment_id,
      'technician_id', v_assignment.technician_id
    )
  );

  return v_assignment;
end;
$$;

revoke execute on function public.unassign_job(uuid, uuid) from public;
revoke execute on function public.unassign_job(uuid, uuid) from anon;
grant execute on function public.unassign_job(uuid, uuid) to authenticated;
