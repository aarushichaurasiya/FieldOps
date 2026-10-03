create or replace function private.guard_customer_service_request_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.user_is_customer(old.customer_id) then
    if new.organization_id is distinct from old.organization_id
       or new.customer_id is distinct from old.customer_id
       or new.site_id is distinct from old.site_id
       or new.status is distinct from old.status then
      raise exception 'CUSTOMER_REQUEST_FIELDS_LOCKED' using errcode = '42501';
    end if;
  elsif not private.user_has_org_role(
    old.organization_id,
    array['dispatcher','admin']::public.app_role[]
  )
  and new.status is distinct from old.status
  and coalesce(current_setting('fieldops.server_mutation', true), '') <> 'request_status'
  then
    raise exception 'REQUEST_STATUS_SERVER_CONTROLLED'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function private.set_request_status_server_mutation(p_request_id uuid, p_status public.request_status)
returns public.service_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.service_requests;
begin
  perform set_config('fieldops.server_mutation', 'request_status', true);
  update public.service_requests
  set status = p_status, updated_at = now()
  where id = p_request_id
  returning * into v_request;
  if v_request.id is null then
    raise exception 'REQUEST_NOT_FOUND' using errcode = 'P0002';
  end if;
  return v_request;
end;
$$;

revoke all on function private.set_request_status_server_mutation(uuid, public.request_status) from public, anon, authenticated;

create or replace function public.start_job_work(p_job_id uuid)
returns public.jobs
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_user_id uuid := (select auth.uid());
  v_job public.jobs;
  v_assignment public.assignments;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select j.* into v_job from public.jobs j where j.id = p_job_id;
  if v_job.id is null then raise exception 'JOB_NOT_FOUND' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.organization_memberships m where m.organization_id=v_job.organization_id and m.user_id=v_user_id and m.role='technician' and m.status='active') then raise exception 'TECHNICIAN_REQUIRED' using errcode = '42501'; end if;
  select a.* into v_assignment from public.assignments a where a.job_id=p_job_id and a.technician_id=v_user_id and a.unassigned_at is null order by a.assigned_at desc limit 1;
  if v_assignment.id is null then raise exception 'ACTIVE_ASSIGNMENT_REQUIRED' using errcode = '42501'; end if;
  if v_job.status <> 'assigned' then raise exception 'JOB_NOT_STARTABLE' using errcode = 'P0001'; end if;
  update public.jobs set status='in_progress', started_at=coalesce(started_at,now()), updated_at=now() where id=p_job_id returning * into v_job;
  perform private.set_request_status_server_mutation(v_job.request_id, 'in_progress'::public.request_status);
  insert into public.audit_events (organization_id,actor_id,entity_type,entity_id,action,metadata) values (v_job.organization_id,v_user_id,'job',p_job_id,'job.started',jsonb_build_object('technician_id',v_user_id));
  return v_job;
end;
$fn$;

create or replace function public.complete_job(p_job_id uuid, p_completion_notes text)
returns public.jobs
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_user_id uuid := (select auth.uid());
  v_job public.jobs;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select j.* into v_job from public.jobs j where j.id=p_job_id;
  if v_job.id is null then raise exception 'JOB_NOT_FOUND' using errcode='P0002'; end if;
  if not exists (select 1 from public.assignments a where a.job_id=p_job_id and a.technician_id=v_user_id and a.unassigned_at is null) then raise exception 'ACTIVE_ASSIGNMENT_REQUIRED' using errcode='42501'; end if;
  if v_job.status <> 'in_progress' then raise exception 'JOB_NOT_IN_PROGRESS' using errcode='P0001'; end if;
  if not exists (select 1 from public.work_logs w where w.job_id=p_job_id) then raise exception 'WORK_LOG_REQUIRED' using errcode='P0001'; end if;
  update public.jobs set status='completed',completed_at=now(),completion_notes=nullif(btrim(coalesce(p_completion_notes,'')),''),updated_at=now() where id=p_job_id returning * into v_job;
  perform private.set_request_status_server_mutation(v_job.request_id, 'completed'::public.request_status);
  insert into public.audit_events (organization_id,actor_id,entity_type,entity_id,action,metadata) values (v_job.organization_id,v_user_id,'job',p_job_id,'job.completed',jsonb_build_object('technician_id',v_user_id));
  return v_job;
end;
$fn$;

revoke all on function private.set_request_status_server_mutation(uuid, public.request_status) from public, anon, authenticated;
grant execute on function public.start_job_work(uuid) to authenticated;
grant execute on function public.complete_job(uuid,text) to authenticated;
