
-- 1) Mirror request_attachments (stage='before'/'after') into maintenance_requests.before_photo_url/after_photo_url

create or replace function public.sync_request_photo_columns()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only act when we have a request and a file_url
  if new.request_id is null or new.file_url is null then
    return new;
  end if;

  -- Map by stage: 'before' -> before_photo_url, 'after' -> after_photo_url
  if new.stage = 'before' then
    update public.maintenance_requests
      set before_photo_url = coalesce(before_photo_url, new.file_url),
          updated_at = now()
    where id = new.request_id;
  elsif new.stage = 'after' then
    update public.maintenance_requests
      set after_photo_url = coalesce(after_photo_url, new.file_url),
          updated_at = now()
    where id = new.request_id;
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'tr_sync_request_photo_columns'
  ) then
    create trigger tr_sync_request_photo_columns
    after insert or update of stage, file_url on public.request_attachments
    for each row
    when (new.stage in ('before','after') and new.file_url is not null)
    execute function public.sync_request_photo_columns();
  end if;
end $$;


-- 2) Always log workflow transitions into request_workflow_transitions on insert/status change

create or replace function public.log_request_status_transition()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.request_workflow_transitions (
      request_id, from_status, to_status, changed_by, notes, metadata, changed_at
    ) values (
      new.id, null, new.status, auth.uid(), null,
      jsonb_build_object('source','trigger'), now()
    );

  elsif tg_op = 'UPDATE' and (new.status is distinct from old.status) then
    insert into public.request_workflow_transitions (
      request_id, from_status, to_status, changed_by, notes, metadata, changed_at
    ) values (
      new.id, old.status, new.status, auth.uid(), null,
      jsonb_build_object('source','trigger'), now()
    );
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'tr_log_request_status_transition'
  ) then
    create trigger tr_log_request_status_transition
    before insert or update of status on public.maintenance_requests
    for each row
    execute function public.log_request_status_transition();
  end if;
end $$;

