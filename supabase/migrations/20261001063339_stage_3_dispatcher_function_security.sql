-- Stage 3: security hardening for dispatcher trigger functions

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
