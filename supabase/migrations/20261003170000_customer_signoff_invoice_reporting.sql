-- Stage 4: customer sign-off -> invoice -> service report
-- Privileged mutation logic stays in private; only authenticated wrappers are exposed.

create or replace function private.customer_sign_off_job(p_job_id uuid, p_notes text)
returns public.sign_offs language plpgsql security definer set search_path='' as $function$
declare v_user_id uuid:=(select auth.uid()); v_customer public.customers; v_job public.jobs; v_sign_off public.sign_offs; v_signer_name text;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  select c.* into v_customer from public.customers c where c.user_id=v_user_id limit 1;
  if v_customer.id is null then raise exception 'CUSTOMER_PROFILE_REQUIRED' using errcode='42501'; end if;
  select j.* into v_job from public.jobs j join public.service_requests r on r.id=j.request_id and r.organization_id=j.organization_id where j.id=p_job_id and r.customer_id=v_customer.id;
  if v_job.id is null then raise exception 'JOB_NOT_FOUND_OR_FORBIDDEN' using errcode='42501'; end if;
  if v_job.status<>'completed' then raise exception 'JOB_NOT_COMPLETED' using errcode='P0001'; end if;
  if exists(select 1 from public.sign_offs so where so.job_id=v_job.id) then raise exception 'SIGN_OFF_ALREADY_SUBMITTED' using errcode='23505'; end if;
  v_signer_name:=nullif(btrim(coalesce(v_customer.name,'')), '');
  if v_signer_name is null then raise exception 'CUSTOMER_NAME_REQUIRED' using errcode='22023'; end if;
  update public.jobs set status='awaiting_signoff',updated_at=now() where id=v_job.id;
  insert into public.sign_offs(organization_id,job_id,customer_id,signed_at,signer_name,signature_reference,notes) values(v_job.organization_id,v_job.id,v_customer.id,now(),v_signer_name,'customer-approval',nullif(btrim(coalesce(p_notes,'')),'')) returning * into v_sign_off;
  update public.jobs set status='signed_off',updated_at=now() where id=v_job.id;
  insert into public.audit_events(organization_id,actor_id,entity_type,entity_id,action,metadata) values(v_job.organization_id,v_user_id,'sign_off',v_sign_off.id,'job.customer_signed_off',jsonb_build_object('job_id',v_job.id,'customer_id',v_customer.id));
  return v_sign_off;
end;
$function$;

create or replace function public.customer_sign_off_job(p_job_id uuid,p_notes text) returns public.sign_offs language plpgsql security invoker set search_path='' as $function$ begin return private.customer_sign_off_job(p_job_id,p_notes); end; $function$;
revoke execute on function public.customer_sign_off_job(uuid,text) from public,anon;
grant execute on function public.customer_sign_off_job(uuid,text) to authenticated;

-- Reconcile the already approved Stage 3 test job with the documented state machine.
update public.jobs set status='awaiting_signoff',updated_at=now() where id='20cf9c15-d262-4351-af33-70ed1e2820af' and status='completed' and exists(select 1 from public.sign_offs so where so.job_id=public.jobs.id);
update public.jobs set status='signed_off',updated_at=now() where id='20cf9c15-d262-4351-af33-70ed1e2820af' and status='awaiting_signoff' and exists(select 1 from public.sign_offs so where so.job_id=public.jobs.id);

create or replace function private.create_invoice_for_job(p_job_id uuid,p_labor_charge_cents bigint,p_tax_rate_bps integer)
returns public.invoices language plpgsql security definer set search_path='' as $function$
declare v_user_id uuid:=(select auth.uid()); v_job public.jobs; v_invoice public.invoices; v_subtotal bigint:=0; v_tax bigint:=0; v_number text;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if p_labor_charge_cents<0 then raise exception 'INVALID_LABOR_CHARGE' using errcode='22023'; end if;
  if p_tax_rate_bps<0 or p_tax_rate_bps>10000 then raise exception 'INVALID_TAX_RATE' using errcode='22023'; end if;
  select j.* into v_job from public.jobs j where j.id=p_job_id;
  if v_job.id is null then raise exception 'JOB_NOT_FOUND' using errcode='P0002'; end if;
  if not(select private.user_has_org_role(v_job.organization_id,array['dispatcher','admin']::public.app_role[])) then raise exception 'DISPATCHER_REQUIRED' using errcode='42501'; end if;
  if v_job.status<>'signed_off' then raise exception 'JOB_NOT_SIGNED_OFF' using errcode='P0001'; end if;
  if not exists(select 1 from public.sign_offs so where so.job_id=v_job.id) then raise exception 'CUSTOMER_SIGNOFF_REQUIRED' using errcode='P0001'; end if;
  select i.* into v_invoice from public.invoices i where i.job_id=v_job.id;
  if v_invoice.id is not null then return v_invoice; end if;
  v_number:='INV-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into public.invoices(job_id,number,status,subtotal_cents,tax_cents,total_cents,currency) values(v_job.id,v_number,'draft',0,0,0,'INR') returning * into v_invoice;
  insert into public.invoice_lines(invoice_id,description,quantity,unit_price_cents) select v_invoice.id,pu.part_name,pu.quantity,pu.unit_price_snapshot_cents from public.part_usages pu where pu.job_id=v_job.id order by pu.created_at;
  if p_labor_charge_cents>0 then insert into public.invoice_lines(invoice_id,description,quantity,unit_price_cents) values(v_invoice.id,'Field service labor',1,p_labor_charge_cents); end if;
  select coalesce(sum(line_total_cents),0)::bigint into v_subtotal from public.invoice_lines where invoice_id=v_invoice.id;
  v_tax:=round(v_subtotal*p_tax_rate_bps/10000.0)::bigint;
  update public.invoices set subtotal_cents=v_subtotal,tax_cents=v_tax,total_cents=v_subtotal+v_tax,updated_at=now() where id=v_invoice.id returning * into v_invoice;
  insert into public.audit_events(organization_id,actor_id,entity_type,entity_id,action,metadata) values(v_job.organization_id,v_user_id,'invoice',v_invoice.id,'invoice.created',jsonb_build_object('job_id',v_job.id,'subtotal_cents',v_subtotal,'tax_cents',v_tax,'total_cents',v_subtotal+v_tax));
  return v_invoice;
end;
$function$;

create or replace function public.create_invoice_for_job(p_job_id uuid,p_labor_charge_cents bigint,p_tax_rate_bps integer) returns public.invoices language plpgsql security invoker set search_path='' as $function$ begin return private.create_invoice_for_job(p_job_id,p_labor_charge_cents,p_tax_rate_bps); end; $function$;

create or replace function private.issue_invoice(p_invoice_id uuid)
returns public.invoices language plpgsql security definer set search_path='' as $function$
declare v_user_id uuid:=(select auth.uid()); v_invoice public.invoices; v_job public.jobs;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  select i.* into v_invoice from public.invoices i where i.id=p_invoice_id;
  if v_invoice.id is null then raise exception 'INVOICE_NOT_FOUND' using errcode='P0002'; end if;
  select j.* into v_job from public.jobs j where j.id=v_invoice.job_id;
  if not(select private.user_has_org_role(v_job.organization_id,array['dispatcher','admin']::public.app_role[])) then raise exception 'DISPATCHER_REQUIRED' using errcode='42501'; end if;
  if v_invoice.status<>'draft' then raise exception 'INVOICE_NOT_DRAFT' using errcode='P0001'; end if;
  if v_job.status<>'signed_off' then raise exception 'JOB_NOT_SIGNED_OFF' using errcode='P0001'; end if;
  update public.invoices set status='issued',issued_at=now(),updated_at=now() where id=v_invoice.id returning * into v_invoice;
  update public.jobs set status='invoiced',updated_at=now() where id=v_job.id;
  insert into public.audit_events(organization_id,actor_id,entity_type,entity_id,action,metadata) values(v_job.organization_id,v_user_id,'invoice',v_invoice.id,'invoice.issued',jsonb_build_object('job_id',v_job.id,'number',v_invoice.number));
  return v_invoice;
end;
$function$;
create or replace function public.issue_invoice(p_invoice_id uuid) returns public.invoices language plpgsql security invoker set search_path='' as $function$ begin return private.issue_invoice(p_invoice_id); end; $function$;

create or replace function private.mark_invoice_paid(p_invoice_id uuid)
returns public.invoices language plpgsql security definer set search_path='' as $function$
declare v_user_id uuid:=(select auth.uid()); v_invoice public.invoices; v_job public.jobs;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  select i.* into v_invoice from public.invoices i where i.id=p_invoice_id;
  if v_invoice.id is null then raise exception 'INVOICE_NOT_FOUND' using errcode='P0002'; end if;
  select j.* into v_job from public.jobs j where j.id=v_invoice.job_id;
  if not(select private.user_has_org_role(v_job.organization_id,array['dispatcher','admin']::public.app_role[])) then raise exception 'DISPATCHER_REQUIRED' using errcode='42501'; end if;
  if v_invoice.status<>'issued' then raise exception 'INVOICE_NOT_ISSUED' using errcode='P0001'; end if;
  update public.invoices set status='paid',updated_at=now() where id=v_invoice.id returning * into v_invoice;
  insert into public.audit_events(organization_id,actor_id,entity_type,entity_id,action,metadata) values(v_job.organization_id,v_user_id,'invoice',v_invoice.id,'invoice.paid',jsonb_build_object('job_id',v_job.id,'number',v_invoice.number));
  return v_invoice;
end;
$function$;
create or replace function public.mark_invoice_paid(p_invoice_id uuid) returns public.invoices language plpgsql security invoker set search_path='' as $function$ begin return private.mark_invoice_paid(p_invoice_id); end; $function$;

revoke execute on function public.create_invoice_for_job(uuid,bigint,integer) from public,anon;
grant execute on function public.create_invoice_for_job(uuid,bigint,integer) to authenticated;
revoke execute on function public.issue_invoice(uuid) from public,anon;
grant execute on function public.issue_invoice(uuid) to authenticated;
revoke execute on function public.mark_invoice_paid(uuid) from public,anon;
grant execute on function public.mark_invoice_paid(uuid) to authenticated;

create or replace function public.get_customer_invoice(p_request_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $function$
declare v_job_id uuid; v_invoice public.invoices; v_lines jsonb;
begin
  select j.id into v_job_id from public.jobs j join public.service_requests r on r.id=j.request_id and r.organization_id=j.organization_id where r.id=p_request_id limit 1;
  if v_job_id is null then return null; end if;
  select i.* into v_invoice from public.invoices i where i.job_id=v_job_id and i.status in ('issued','paid');
  if v_invoice.id is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'description',l.description,'quantity',l.quantity,'unit_price_cents',l.unit_price_cents,'line_total_cents',l.line_total_cents) order by l.created_at),'[]'::jsonb) into v_lines from public.invoice_lines l where l.invoice_id=v_invoice.id;
  return jsonb_build_object('invoice',jsonb_build_object('id',v_invoice.id,'job_id',v_invoice.job_id,'number',v_invoice.number,'status',v_invoice.status,'subtotal_cents',v_invoice.subtotal_cents,'tax_cents',v_invoice.tax_cents,'total_cents',v_invoice.total_cents,'currency',v_invoice.currency,'issued_at',v_invoice.issued_at,'created_at',v_invoice.created_at),'lines',v_lines);
end;
$function$;
revoke execute on function public.get_customer_invoice(uuid) from public,anon;
grant execute on function public.get_customer_invoice(uuid) to authenticated;

create or replace function public.get_job_service_report(p_job_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $function$
declare v_job public.jobs; v_request public.service_requests; v_customer public.customers; v_site public.sites; v_technician_name text; v_sign_off public.sign_offs; v_invoice public.invoices; v_work_logs jsonb; v_parts jsonb; v_lines jsonb;
begin
  select j.* into v_job from public.jobs j where j.id=p_job_id; if v_job.id is null then return null; end if;
  select r.* into v_request from public.service_requests r where r.id=v_job.request_id; if v_request.id is null then return null; end if;
  select c.* into v_customer from public.customers c where c.id=v_request.customer_id;
  select s.* into v_site from public.sites s where s.id=v_request.site_id;
  select p.full_name into v_technician_name from public.assignments a left join public.profiles p on p.id=a.technician_id where a.job_id=v_job.id order by a.assigned_at desc limit 1;
  select so.* into v_sign_off from public.sign_offs so where so.job_id=v_job.id limit 1;
  select i.* into v_invoice from public.invoices i where i.job_id=v_job.id limit 1;
  select coalesce(jsonb_agg(jsonb_build_object('id',w.id,'note',w.note,'started_at',w.started_at,'ended_at',w.ended_at,'created_at',w.created_at) order by w.created_at),'[]'::jsonb) into v_work_logs from public.work_logs w where w.job_id=v_job.id;
  select coalesce(jsonb_agg(jsonb_build_object('id',pu.id,'part_name',pu.part_name,'quantity',pu.quantity,'unit_price_snapshot_cents',pu.unit_price_snapshot_cents,'created_at',pu.created_at) order by pu.created_at),'[]'::jsonb) into v_parts from public.part_usages pu where pu.job_id=v_job.id;
  select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'description',l.description,'quantity',l.quantity,'unit_price_cents',l.unit_price_cents,'line_total_cents',l.line_total_cents) order by l.created_at),'[]'::jsonb) into v_lines from public.invoice_lines l where v_invoice.id is not null and l.invoice_id=v_invoice.id;
  return jsonb_build_object('job',jsonb_build_object('id',v_job.id,'status',v_job.status,'started_at',v_job.started_at,'completed_at',v_job.completed_at,'completion_notes',v_job.completion_notes),'request',jsonb_build_object('id',v_request.id,'title',v_request.title,'description',v_request.description,'priority',v_request.priority),'customer',jsonb_build_object('id',v_customer.id,'name',v_customer.name,'email',v_customer.email,'phone',v_customer.phone),'site',case when v_site.id is null then null else jsonb_build_object('id',v_site.id,'name',v_site.name,'address_line1',v_site.address_line1,'city',v_site.city,'state',v_site.state,'postal_code',v_site.postal_code,'country',v_site.country) end,'technician_name',v_technician_name,'work_logs',v_work_logs,'parts',v_parts,'sign_off',case when v_sign_off.id is null then null else jsonb_build_object('id',v_sign_off.id,'signed_at',v_sign_off.signed_at,'signer_name',v_sign_off.signer_name,'notes',v_sign_off.notes) end,'invoice',case when v_invoice.id is null then null else jsonb_build_object('id',v_invoice.id,'number',v_invoice.number,'status',v_invoice.status,'subtotal_cents',v_invoice.subtotal_cents,'tax_cents',v_invoice.tax_cents,'total_cents',v_invoice.total_cents,'currency',v_invoice.currency,'issued_at',v_invoice.issued_at) end,'invoice_lines',v_lines);
end;
$function$;
revoke execute on function public.get_job_service_report(uuid) from public,anon;
grant execute on function public.get_job_service_report(uuid) to authenticated;
create index if not exists invoice_lines_invoice_id_created_at on public.invoice_lines(invoice_id,created_at);
create index if not exists invoices_job_id_status on public.invoices(job_id,status);
