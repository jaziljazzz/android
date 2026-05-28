-- skipQ — Migration 0008: push notifications via OneSignal
--
-- Fires when public.queue_entries.status changes. Sends a OneSignal push
-- to the customer (matched on external_id = auth.uid()) and logs the
-- attempt to notifications_log.
--
-- Secrets live in Supabase Vault, not this file. Set them once with:
--   select vault.create_secret('<app_id>',  'onesignal_app_id');
--   select vault.create_secret('<api_key>', 'onesignal_api_key');

create extension if not exists pg_net;

create or replace function public.notify_queue_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, net, vault
as $$
declare
  v_salon_name text;
  v_title text;
  v_body text;
  v_app_id text;
  v_api_key text;
  v_payload jsonb;
begin
  -- Only act on real status transitions for app-backed users
  if old.status is not distinct from new.status then
    return new;
  end if;
  if new.user_id is null then
    return new;
  end if;

  select name into v_salon_name from public.salons where id = new.salon_id;
  v_salon_name := coalesce(v_salon_name, 'the salon');

  -- Map transitions → user-facing copy
  if new.status = 'serving' then
    v_title := 'Your turn at ' || v_salon_name || '!';
    v_body := 'The stylist is ready for you. Head to the chair.';
  elsif new.status = 'cancelled' and old.status in ('waiting', 'arrived') then
    v_title := 'Your booking was cancelled';
    v_body := v_salon_name || ' cancelled your queue spot. Tap for details.';
  elsif new.status = 'no_show' then
    v_title := 'Marked as no-show';
    v_body := v_salon_name || ' didn''t see you arrive. You can rebook anytime.';
  elsif new.status = 'arrived' and old.status = 'waiting' then
    v_title := 'Checked in';
    v_body := 'You''re marked arrived at ' || v_salon_name || '. We''ll ping you when it''s your turn.';
  else
    return new;
  end if;

  -- Read creds from Vault
  begin
    select decrypted_secret into v_app_id
      from vault.decrypted_secrets where name = 'onesignal_app_id';
    select decrypted_secret into v_api_key
      from vault.decrypted_secrets where name = 'onesignal_api_key';
  exception when others then
    v_app_id := null;
    v_api_key := null;
  end;

  if v_app_id is null or v_api_key is null then
    -- Credentials not provisioned yet — log only, no network call
    insert into public.notifications_log (user_id, queue_entry_id, channel, content, template, delivered)
    values (new.user_id, new.id, 'push', v_body, 'queue_' || new.status, false);
    return new;
  end if;

  v_payload := jsonb_build_object(
    'app_id', v_app_id,
    'include_aliases', jsonb_build_object('external_id', jsonb_build_array(new.user_id::text)),
    'target_channel', 'push',
    'headings', jsonb_build_object('en', v_title),
    'contents', jsonb_build_object('en', v_body),
    'data', jsonb_build_object(
      'queue_entry_id', new.id::text,
      'salon_id', new.salon_id::text,
      'status', new.status
    )
  );

  perform net.http_post(
    url := 'https://onesignal.com/api/v1/notifications',
    body := v_payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Key ' || v_api_key
    )
  );

  insert into public.notifications_log (user_id, queue_entry_id, channel, content, template, delivered)
  values (new.user_id, new.id, 'push', v_body, 'queue_' || new.status, true);

  return new;
end;
$$;

revoke execute on function public.notify_queue_status_change() from public;

drop trigger if exists queue_status_notify on public.queue_entries;
create trigger queue_status_notify
  after update of status on public.queue_entries
  for each row
  when (old.status is distinct from new.status)
  execute function public.notify_queue_status_change();
