create or replace function public.create_job_for_request(p_request_id uuid)
returns public.jobs
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_request public.service_requests;
  v_job public.jobs;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select r.*
    into v_request
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

  select j.*
    into v_job
  from public.jobs j
  where j.request_id = p_request_id
  order by j.created_at
  limit 1;

  if v_job.id is not null then
    return v_job;
  end if;

  insert into public.jobs (
    organization_id,
    request_id,
    status
  )
  values (
    v_request.organization_id,
    v_request.id,
    'requested'
  )
  returning * into v_job;

  update public.service_requests
  set status = 'accepted', updated_at = now()
  where id = v_request.id;

  insert into public.audit_events (
    organization_id,
    actor_id,
    entity_type,
    entity_id,
    action,
    metadata
  )
  values (
    v_request.organization_id,
    v_user_id,
    'job',
    v_job.id,
    'job.created_from_request',
    jsonb_build_object('request_id', v_request.id)
  );

  return v_job;
end;
$function$;

revoke execute on function public.create_job_for_request(uuid) from public;
grant execute on function public.create_job_for_request(uuid) to authenticated;
