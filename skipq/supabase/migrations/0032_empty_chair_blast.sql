-- skipQ — Migration 0032: empty-chair blast notifications (paid V3)
--
-- Salon owner triggers a one-tap push to "warm" customers (anyone who
-- favourited the salon or visited in the last 60 days) telling them a
-- chair is free right now. Rate-limited to 1 per 6 hours to keep it
-- from feeling spammy.

create table if not exists public.empty_chair_blasts (
  id              uuid primary key default uuid_generate_v4(),
  salon_id        uuid not null references public.salons(id) on delete cascade,
  triggered_by    uuid references auth.users(id) on delete set null,
  message         text not null,
  recipient_count int not null default 0,
  sent_at         timestamptz not null default now()
);

create index if not exists idx_blasts_salon_sent on public.empty_chair_blasts (salon_id, sent_at desc);

alter table public.empty_chair_blasts enable row level security;

create policy "blasts_partner_read_own" on public.empty_chair_blasts
  for select using (salon_id = public.current_partner_salon_id());

create or replace function public.send_empty_chair_blast(p_message text)
returns table(blast_id uuid, recipient_count int)
language plpgsql
security definer
set search_path = public, net, vault
as $$
declare
  v_uid uuid := auth.uid();
  v_salon_id uuid;
  v_role text;
  v_salon_name text;
  v_recent timestamptz;
  v_recipients uuid[];
  v_count int;
  v_app_id text;
  v_api_key text;
  v_payload jsonb;
  v_blast_id uuid;
begin
  if v_uid is null then
    raise exception 'send_empty_chair_blast: not authenticated' using errcode = '42501';
  end if;
  if coalesce(trim(p_message), '') = '' then
    raise exception 'send_empty_chair_blast: message required' using errcode = '22023';
  end if;
  if length(p_message) > 160 then
    raise exception 'send_empty_chair_blast: message too long (max 160 chars)' using errcode = '22023';
  end if;

  select pu.salon_id, pu.role into v_salon_id, v_role
    from public.partner_users pu where pu.auth_user_id = v_uid;
  if v_salon_id is null then
    raise exception 'send_empty_chair_blast: no salon for caller' using errcode = '42501';
  end if;
  if v_role <> 'owner' then
    raise exception 'send_empty_chair_blast: owner only' using errcode = '42501';
  end if;

  -- Rate-limit: 1 blast per 6 hours per salon
  if exists (
    select 1 from public.empty_chair_blasts
    where salon_id = v_salon_id
      and sent_at > now() - interval '6 hours'
  ) then
    raise exception 'send_empty_chair_blast: try again in a few hours (1 blast / 6h)' using errcode = '22023';
  end if;

  select name into v_salon_name from public.salons where id = v_salon_id;
  v_recent := now() - interval '60 days';

  -- Warm audience: favourited the salon OR visited in last 60 days
  select array_agg(distinct user_id) into v_recipients from (
    select user_id from public.favourites
      where salon_id = v_salon_id and user_id is not null
    union
    select user_id from public.queue_entries
      where salon_id = v_salon_id
        and user_id is not null
        and joined_at >= v_recent
  ) src where user_id is not null;

  v_count := coalesce(array_length(v_recipients, 1), 0);

  insert into public.empty_chair_blasts (salon_id, triggered_by, message, recipient_count)
    values (v_salon_id, v_uid, p_message, v_count)
    returning id into v_blast_id;

  if v_count = 0 then
    return query select v_blast_id, v_count;
  end if;

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
    return query select v_blast_id, v_count;
  end if;

  v_payload := jsonb_build_object(
    'app_id', v_app_id,
    'include_aliases', jsonb_build_object(
      'external_id', to_jsonb(
        (select array_agg(uid::text) from unnest(v_recipients) as uid)
      )
    ),
    'target_channel', 'push',
    'headings', jsonb_build_object('en', 'No wait at ' || coalesce(v_salon_name, 'your favourite salon')),
    'contents', jsonb_build_object('en', p_message),
    'data', jsonb_build_object(
      'kind', 'empty_chair_blast',
      'salon_id', v_salon_id::text
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

  return query select v_blast_id, v_count;
end;
$$;

grant execute on function public.send_empty_chair_blast(text) to authenticated;
