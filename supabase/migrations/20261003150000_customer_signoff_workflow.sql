create or replace function public.get_customer_job_completion(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_customer public.customers;
  v_job public.jobs;
  v_technician_name text;
  v_sign_off public.sign_offs;
  v_work_logs jsonb;
  v_parts jsonb;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select c.* into v_customer
  from public.customers c
  where c.user_id = v_user_id;

  if v_customer.id is null then
    raise exception 'CUSTOMER_PROFILE_REQUIRED' using errcode = '42501';
  end if;

  select j.* into v_job
  from public.jobs j
  join public.service_requests r on r.id = j.request_id and r.organization_id = j.organization_id
  where j.request_id = p_request_id
    and r.customer_id = v_customer.id
  order by j.created_at desc
  limit 1;

  if v_job.id is null then
    return jsonb_build_object('job', null, 'technician_name', null, 'work_logs', '[]'::jsonb, 'parts', '[]'::jsonb, 'sign_off', null);
  end if;

  select p.full_name into v_technician_name
  from public.assignments a
  left join public.profiles p on p.id = a.technician_id
  where a.job_id = v_job.id
    and a.unassigned_at is null
  order by a.assigned_at desc
  limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', w.id,
    'note', w.note,
    'started_at', w.started_at,
    'ended_at', w.ended_at,
    'created_at', w.created_at
  ) order by w.created_at asc), '[]'::jsonb)
  into v_work_logs
  from public.work_logs w
  where w.job_id = v_job.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', pu.id,
    'part_name', pu.part_name,
    'quantity', pu.quantity,
    'unit_price_snapshot_cents', pu.unit_price_snapshot_cents,
    'created_at', pu.created_at
  ) order by pu.created_at asc), '[]'::jsonb)
  into v_parts
  from public.part_usages pu
  where pu.job_id = v_job.id;

  select so.* into v_sign_off
  from public.sign_offs so
  where so.job_id = v_job.id
    and so.customer_id = v_customer.id
  limit 1;

  return jsonb_build_object(
    'job', jsonb_build_object(
      'id', v_job.id,
      'status', v_job.status,
      'started_at', v_job.started_at,
      'completed_at', v_job.completed_at,
      'completion_notes', v_job.completion_notes
    ),
    'technician_name', v_technician_name,
    'work_logs', v_work_logs,
    'parts', v_parts,
    'sign_off', case when v_sign_off.id is null then null else jsonb_build_object(
      'id', v_sign_off.id,
      'signed_at', v_sign_off.signed_at,
      'signer_name', v_sign_off.signer_name,
      'notes', v_sign_off.notes
    ) end
  );
end;
$function$;

create or replace function public.customer_sign_off_job(p_job_id uuid, p_notes text)
returns public.sign_offs
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_customer public.customers;
  v_job public.jobs;
  v_sign_off public.sign_offs;
  v_signer_name text;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select c.* into v_customer
  from public.customers c
  where c.user_id = v_user_id;

  if v_customer.id is null then
    raise exception 'CUSTOMER_PROFILE_REQUIRED' using errcode = '42501';
  end if;

  select j.* into v_job
  from public.jobs j
  join public.service_requests r on r.id = j.request_id and r.organization_id = j.organization_id
  where j.id = p_job_id
    and r.customer_id = v_customer.id;

  if v_job.id is null then
    raise exception 'JOB_NOT_FOUND_OR_FORBIDDEN' using errcode = '42501';
  end if;

  if v_job.status <> 'completed' then
    raise exception 'JOB_NOT_COMPLETED' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.sign_offs so where so.job_id = v_job.id) then
    raise exception 'SIGN_OFF_ALREADY_SUBMITTED' using errcode = '23505';
  end if;

  v_signer_name := nullif(btrim(coalesce(v_customer.name, '')), '');
  if v_signer_name is null then
    raise exception 'CUSTOMER_NAME_REQUIRED' using errcode = '22023';
  end if;

  insert into public.sign_offs (
    organization_id,
    job_id,
    customer_id,
    signed_at,
    signer_name,
    signature_reference,
    notes
  )
  values (
    v_job.organization_id,
    v_job.id,
    v_customer.id,
    now(),
    v_signer_name,
    'customer-approval',
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning * into v_sign_off;

  insert into public.audit_events (organization_id, actor_id, entity_type, entity_id, action, metadata)
  values (
    v_job.organization_id,
    v_user_id,
    'sign_off',
    v_sign_off.id,
    'job.customer_signed_off',
    jsonb_build_object('job_id', v_job.id, 'customer_id', v_customer.id)
  );

  return v_sign_off;
end;
$function$;

revoke execute on function public.get_customer_job_completion(uuid) from public, anon;
grant execute on function public.get_customer_job_completion(uuid) to authenticated;
revoke execute on function public.customer_sign_off_job(uuid, text) from public, anon;
grant execute on function public.customer_sign_off_job(uuid, text) to authenticated;
