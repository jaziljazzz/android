-- skipQ — Migration 0006: customer-side queue join
--
-- 1. Auto-provision a public.users row when an auth identity is created
-- 2. queue_join() RPC: atomic insert of queue_entry + queue_entry_services
-- 3. RLS for customers to insert via the app (defense in depth even though
--    the RPC is security definer)

-- ---------------------------------------------------------------------------
-- 1. auth.users → public.users mirror
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
begin
  v_phone := new.phone;
  if v_phone is not null and v_phone <> '' then
    if left(v_phone, 1) <> '+' then
      v_phone := '+' || v_phone;
    end if;
    insert into public.users (id, phone)
    values (new.id, v_phone)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- 2. queue_join() RPC
-- ---------------------------------------------------------------------------
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
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'queue_join: not authenticated' using errcode = '42501';
  end if;
  if array_length(p_service_ids, 1) is null then
    raise exception 'queue_join: at least one service required' using errcode = '22023';
  end if;

  -- Validate salon
  select status into v_status from public.salons where id = p_salon_id;
  if v_status is null then
    raise exception 'queue_join: salon not found' using errcode = '22023';
  end if;
  if v_status <> 'active' then
    raise exception 'queue_join: salon is not active' using errcode = '22023';
  end if;

  -- Validate services + sum durations + sum prices in one shot
  select coalesce(sum(default_duration), 0), coalesce(sum(price), 0)
    into v_naive_duration, v_total_price
  from public.services
  where id = any(p_service_ids)
    and salon_id = p_salon_id
    and active;

  if v_naive_duration = 0 then
    raise exception 'queue_join: no valid services selected for this salon' using errcode = '22023';
  end if;

  -- Reject the join if the customer already has an active entry at this salon
  if exists (
    select 1 from public.queue_entries
    where user_id = v_user_id
      and salon_id = p_salon_id
      and status in ('waiting', 'arrived', 'serving')
  ) then
    raise exception 'queue_join: you already have an active queue entry at this salon'
      using errcode = '22023';
  end if;

  -- Position + ETA (simple v1 — count active × avg duration)
  select count(*) into v_active_count
  from public.queue_entries
  where salon_id = p_salon_id
    and status in ('waiting', 'arrived', 'serving');

  v_position := v_active_count + 1;
  -- 0.9 combo discount (matches algorithm package COMBO_MULTIPLIERS.defaultUnseen)
  v_eta := greatest(1, round((v_active_count * 25) + (v_naive_duration * 0.9)));

  -- "New customer" = no prior queue entry for this salon with this user's phone
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

  -- Upsert customers_salons to mark attribution
  insert into public.customers_salons (salon_id, user_id, phone, first_visit_at, last_visit_at, acquired_via, attribution_window_ends_at)
  values (p_salon_id, v_user_id, v_phone, now(), now(), 'skipq', now() + interval '90 days')
  on conflict (salon_id, phone) do update
    set last_visit_at = excluded.last_visit_at,
        total_visits = public.customers_salons.total_visits + 1;

  return query select v_entry_id, v_position, v_eta;
end;
$$;

revoke execute on function public.queue_join(uuid, uuid[], uuid) from public;
grant execute on function public.queue_join(uuid, uuid[], uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Customer-side INSERT policies (defense in depth — RPC is the main path)
-- ---------------------------------------------------------------------------
create policy "queue_entries_customer_insert" on public.queue_entries
  for insert
  with check (
    user_id = auth.uid()
    and source = 'app'
    and exists (
      select 1 from public.salons where id = salon_id and status = 'active'
    )
  );

create policy "queue_entry_services_customer_insert" on public.queue_entry_services
  for insert
  with check (
    exists (
      select 1 from public.queue_entries qe
      where qe.id = queue_entry_id and qe.user_id = auth.uid()
    )
  );

create policy "users_self_insert" on public.users
  for insert with check (auth.uid() = id);
