-- Stage 2: customer request intake and authorization hardening

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
      raise exception 'CUSTOMER_REQUEST_FIELDS_LOCKED'
        using errcode = '42501';
    end if;
  elsif not private.user_has_org_role(
    old.organization_id,
    array['dispatcher','admin']::public.app_role[]
  ) and new.status is distinct from old.status then
    raise exception 'REQUEST_STATUS_SERVER_CONTROLLED'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_customer_service_request_update on public.service_requests;

create trigger guard_customer_service_request_update
before update on public.service_requests
for each row
execute function private.guard_customer_service_request_update();

drop policy if exists sites_select on public.sites;

create policy sites_select on public.sites
for select
to authenticated
using (
  (select private.user_is_customer(sites.customer_id))
  or
  (select private.user_has_org_role(
    sites.organization_id,
    array['dispatcher','technician','admin']::public.app_role[]
  ))
);

create or replace function public.create_service_request(
  p_customer_id uuid,
  p_site_id uuid,
  p_title text,
  p_description text,
  p_priority text
)
returns public.service_requests
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_customer public.customers;
  v_request public.service_requests;
begin
  if (select auth.uid()) is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select c.* into v_customer
  from public.customers c
  where c.id = p_customer_id;

  if v_customer.id is null then
    raise exception 'CUSTOMER_NOT_ACCESSIBLE' using errcode = '42501';
  end if;

  if p_site_id is not null and not exists (
    select 1
    from public.sites s
    where s.id = p_site_id
      and s.customer_id = p_customer_id
      and s.organization_id = v_customer.organization_id
  ) then
    raise exception 'SITE_NOT_ACCESSIBLE' using errcode = '42501';
  end if;

  insert into public.service_requests (
    organization_id,
    customer_id,
    site_id,
    title,
    description,
    priority
  )
  values (
    v_customer.organization_id,
    p_customer_id,
    p_site_id,
    btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''),
    p_priority::public.request_priority
  )
  returning * into v_request;

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
    (select auth.uid()),
    'service_request',
    v_request.id,
    'request.created',
    jsonb_build_object('priority', v_request.priority)
  );

  return v_request;
end;
$$;

create or replace function public.update_service_request(
  p_request_id uuid,
  p_title text,
  p_description text,
  p_priority text
)
returns public.service_requests
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_request public.service_requests;
begin
  if (select auth.uid()) is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  update public.service_requests
  set
    title = btrim(p_title),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    priority = p_priority::public.request_priority,
    updated_at = now()
  where id = p_request_id
  returning * into v_request;

  if v_request.id is null then
    raise exception 'REQUEST_NOT_ACCESSIBLE' using errcode = '42501';
  end if;

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
    (select auth.uid()),
    'service_request',
    v_request.id,
    'request.updated',
    jsonb_build_object('priority', v_request.priority)
  );

  return v_request;
end;
$$;

revoke execute on function public.create_service_request(uuid, uuid, text, text, text) from public, anon;
grant execute on function public.create_service_request(uuid, uuid, text, text, text) to authenticated;

revoke execute on function public.update_service_request(uuid, text, text, text) from public, anon;
grant execute on function public.update_service_request(uuid, text, text, text) to authenticated;
