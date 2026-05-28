-- skipQ — Migration 0049: deposit-required flag (replaces hard block, spec §18)
--
-- After 3 no-shows in 30 days the user is flagged `needs_deposit`.
-- queue_join still works, but the booking enters 'waiting_deposit'
-- status and won't move until they pay. The existing
-- create-payment-order flow handles the actual ₹ charge. A completed
-- visit clears the flag.

alter table public.queue_entries
  drop constraint if exists queue_entries_status_check;

alter table public.queue_entries
  add constraint queue_entries_status_check check (
    status in ('waiting','arrived','serving','completed','no_show','cancelled','waiting_deposit')
  );

alter table public.users
  add column if not exists needs_deposit boolean not null default false;

-- Re-flip needs_deposit whenever a user crosses the 3-no-show threshold.
create or replace function public.refresh_no_show_flag(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.users
    set needs_deposit = (
      select count(*) >= 3
      from public.queue_entries
      where user_id = p_user_id
        and status = 'no_show'
        and cancelled_at >= now() - interval '30 days'
    )
    where id = p_user_id;
$$;

create or replace function public.handle_queue_entry_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'no_show' and new.user_id is not null then
    perform public.refresh_no_show_flag(new.user_id);
  elsif new.status = 'completed' and new.user_id is not null then
    update public.users set needs_deposit = false where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists queue_refresh_deposit_flag on public.queue_entries;
create trigger queue_refresh_deposit_flag
  after update of status on public.queue_entries
  for each row
  when (old.status is distinct from new.status)
  execute function public.handle_queue_entry_status_change();

-- queue_join: stop hard-blocking. Instead the entry enters
-- waiting_deposit; the customer's UI surfaces the Razorpay prompt.
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
  v_needs_deposit boolean;
  v_entry_status text;
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
  where salon_id = p_salon_id and status in ('waiting','arrived','serving','waiting_deposit');

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
      and status in ('waiting','arrived','serving','waiting_deposit')
  ) then
    raise exception 'queue_join: you already have an active queue entry at this salon'
      using errcode = '22023';
  end if;

  select coalesce(needs_deposit, false) into v_needs_deposit
    from public.users where id = v_user_id;

  v_entry_status := case when v_needs_deposit then 'waiting_deposit' else 'waiting' end;

  insert into public.queue_entries (
    salon_id, user_id, preferred_stylist_id, position,
    status, joined_at, estimated_wait_min, is_new_customer, source, total_price
  ) values (
    p_salon_id, v_user_id, p_preferred_stylist_id, v_position,
    v_entry_status, now(), v_eta, v_is_new, 'app', v_total_price
  ) returning id into v_entry_id;

  insert into public.queue_entry_services (queue_entry_id, service_id, price_at_time, duration_at_time)
  select v_entry_id, s.id, s.price, s.default_duration
  from public.services s
  where s.salon_id = p_salon_id and s.id = any(p_service_ids) and s.active = true;

  return query select v_entry_id, v_position, v_eta;
end;
$$;

grant execute on function public.queue_join(uuid, uuid[], uuid) to authenticated;

-- Surface deposit status to the customer mobile.
create or replace function public.my_deposit_status()
returns table(needs_deposit boolean, no_show_count int)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((select needs_deposit from public.users where id = auth.uid()), false),
    coalesce((select count(*)::int from public.queue_entries
       where user_id = auth.uid()
         and status = 'no_show'
         and cancelled_at >= now() - interval '30 days'), 0);
$$;

grant execute on function public.my_deposit_status() to authenticated;
