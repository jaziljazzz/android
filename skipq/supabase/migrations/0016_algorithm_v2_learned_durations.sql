-- skipQ — Migration 0016: Algorithm v2 (per-stylist learned durations)
--
-- We've been collecting per-(stylist, signature) durations into
-- service_timings via the completeService partner action since day 1.
-- This migration starts consuming them: queue_join now uses the rolling
-- 30-sample average instead of the catalog default whenever ≥10 samples
-- exist for the exact combo. Matches spec §10 algorithm v2 + the
-- "<10 samples ⇒ no point estimate" CRITICAL constraint.

create or replace function public.stylist_learned_duration(
  p_stylist_id uuid,
  p_signature text
)
returns table(avg_seconds numeric, samples int)
language sql
security definer
set search_path = public
as $$
  with last_30 as (
    select total_duration_seconds
    from public.service_timings
    where stylist_id = p_stylist_id
      and service_signature = p_signature
    order by recorded_at desc
    limit 30
  )
  select avg(total_duration_seconds)::numeric, count(*)::int
  from last_30;
$$;

grant execute on function public.stylist_learned_duration(uuid, text) to authenticated;

-- queue_join now optionally uses learned durations.
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
  v_signature text;
  v_learned_seconds numeric;
  v_learned_samples int;
  v_combo_minutes numeric;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'queue_join: not authenticated' using errcode = '42501';
  end if;
  if array_length(p_service_ids, 1) is null then
    raise exception 'queue_join: at least one service required' using errcode = '22023';
  end if;

  select status into v_status from public.salons where id = p_salon_id;
  if v_status is null then
    raise exception 'queue_join: salon not found' using errcode = '22023';
  end if;
  if v_status <> 'active' then
    raise exception 'queue_join: salon is not active' using errcode = '22023';
  end if;

  select coalesce(sum(default_duration), 0), coalesce(sum(price), 0)
    into v_naive_duration, v_total_price
  from public.services
  where id = any(p_service_ids) and salon_id = p_salon_id and active;

  if v_naive_duration = 0 then
    raise exception 'queue_join: no valid services selected for this salon' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.queue_entries
    where user_id = v_user_id and salon_id = p_salon_id
      and status in ('waiting', 'arrived', 'serving')
  ) then
    raise exception 'queue_join: you already have an active queue entry at this salon'
      using errcode = '22023';
  end if;

  select count(*) into v_active_count
  from public.queue_entries
  where salon_id = p_salon_id
    and status in ('waiting', 'arrived', 'serving');

  v_position := v_active_count + 1;

  -- Compute signature, look up learned duration when a stylist was picked
  v_signature := array_to_string(
    (select array_agg(s::text order by s::text) from unnest(p_service_ids) s),
    '+'
  );

  if p_preferred_stylist_id is not null then
    select avg_seconds, samples
      into v_learned_seconds, v_learned_samples
      from public.stylist_learned_duration(p_preferred_stylist_id, v_signature);
  end if;

  if v_learned_samples is not null and v_learned_samples >= 10 then
    v_combo_minutes := v_learned_seconds / 60.0;
  else
    v_combo_minutes := v_naive_duration * 0.9;
  end if;

  v_eta := greatest(1, round((v_active_count * 25) + v_combo_minutes));

  select phone into v_phone from public.users where id = v_user_id;
  v_is_new := not exists (
    select 1 from public.customers_salons
    where salon_id = p_salon_id and phone = v_phone
  );

  insert into public.queue_entries (
    salon_id, user_id, preferred_stylist_id, stylist_id, position, status,
    source, estimated_wait_min, total_price, is_new_customer
  )
  values (
    p_salon_id, v_user_id, p_preferred_stylist_id, p_preferred_stylist_id,
    v_position, 'waiting', 'app', v_eta, v_total_price, v_is_new
  )
  returning id into v_entry_id;

  insert into public.queue_entry_services (queue_entry_id, service_id, price_at_time, duration_at_time)
  select v_entry_id, s.id, s.price, s.default_duration
  from public.services s
  where s.id = any(p_service_ids) and s.salon_id = p_salon_id;

  insert into public.customers_salons (salon_id, user_id, phone, first_visit_at, last_visit_at, acquired_via, attribution_window_ends_at)
  values (p_salon_id, v_user_id, v_phone, now(), now(), 'skipq', now() + interval '90 days')
  on conflict (salon_id, phone) do update
    set last_visit_at = excluded.last_visit_at,
        total_visits = public.customers_salons.total_visits + 1;

  return query select v_entry_id, v_position, v_eta;
end;
$$;
