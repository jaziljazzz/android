-- skipQ — Migration 0033: 3-strike no-show abuse protection
--
-- Spec §18: after 3 no-shows in 30 days, block the user from joining
-- any salon's queue for 24h after the third no-show. Once the trailing
-- 30-day window thins out below 3, joins are allowed again.

create or replace function public.recent_no_show_count(p_user_id uuid, p_days int default 30)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.queue_entries
  where user_id = p_user_id
    and status = 'no_show'
    and cancelled_at >= now() - (p_days || ' days')::interval;
$$;

grant execute on function public.recent_no_show_count(uuid, int) to authenticated;

create or replace function public.queue_join(
  p_salon_id uuid,
  p_service_ids uuid[],
  p_preferred_stylist_id uuid default null
)
returns table(
  queue_entry_id uuid,
  queue_position int,
  estimated_wait_min int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_status text;
  v_naive_duration int;
  v_active_count int;
  v_position int;
  v_eta int;
  v_total_price numeric(10,2);
  v_entry_id uuid;
  v_is_new boolean;
  v_phone text;
  v_no_shows int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'queue_join: not authenticated' using errcode = '42501';
  end if;
  if array_length(p_service_ids, 1) is null then
    raise exception 'queue_join: at least one service required' using errcode = '22023';
  end if;

  -- 3-strike no-show block (spec §18)
  v_no_shows := public.recent_no_show_count(v_user_id, 30);
  if v_no_shows >= 3 then
    raise exception 'queue_join: you have % no-shows in the last 30 days. Bookings are paused for a day — contact support if this is wrong.', v_no_shows
      using errcode = '22023';
  end if;

  select status into v_status from public.salons where id = p_salon_id;
  if v_status is null then
    raise exception 'queue_join: salon not found' using errcode = '22023';
  end if;
  if v_status <> 'active' then
    raise exception 'queue_join: salon is not active' using errcode = '22023';
  end if;

  if not public.is_salon_open(p_salon_id, now()) then
    raise exception 'queue_join: salon is closed right now' using errcode = '22023';
  end if;

  select coalesce(sum(default_duration), 0)
    into v_naive_duration
  from public.services
  where salon_id = p_salon_id and id = any(p_service_ids) and active = true;

  if v_naive_duration = 0 then
    raise exception 'queue_join: no valid services selected for this salon' using errcode = '22023';
  end if;

  select count(*) into v_active_count
  from public.queue_entries
  where salon_id = p_salon_id and status in ('waiting','arrived','serving');

  v_position := v_active_count + 1;
  v_eta := v_naive_duration + v_active_count * 20;

  select coalesce(sum(price), 0) into v_total_price
  from public.services
  where salon_id = p_salon_id and id = any(p_service_ids) and active = true;

  select phone into v_phone from public.users where id = v_user_id;
  v_is_new := not exists (
    select 1 from public.customers_salons
    where salon_id = p_salon_id and phone = v_phone
  );

  if exists (
    select 1 from public.queue_entries
    where salon_id = p_salon_id
      and user_id = v_user_id
      and status in ('waiting','arrived','serving')
  ) then
    raise exception 'queue_join: you already have an active queue entry at this salon'
      using errcode = '22023';
  end if;

  insert into public.queue_entries (
    salon_id, user_id, preferred_stylist_id, position,
    status, joined_at, estimated_wait_min, is_new_customer, source, total_price
  ) values (
    p_salon_id, v_user_id, p_preferred_stylist_id, v_position,
    'waiting', now(), v_eta, v_is_new, 'app', v_total_price
  ) returning id into v_entry_id;

  insert into public.queue_entry_services (queue_entry_id, service_id, price_at_time, duration_at_time)
  select v_entry_id, s.id, s.price, s.default_duration
  from public.services s
  where s.salon_id = p_salon_id and s.id = any(p_service_ids) and s.active = true;

  return query select v_entry_id, v_position, v_eta;
end;
$$;

grant execute on function public.queue_join(uuid, uuid[], uuid) to authenticated;
