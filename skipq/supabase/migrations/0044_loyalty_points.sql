-- skipQ — Migration 0044: loyalty points (V4 spec)
--
-- Earn 10 points per completed visit (1 per ₹100 spent, capped). Burn
-- on the customer's next checkout for a flat ₹ discount. Single ledger
-- with positive and negative entries keyed off queue_entry_id so we
-- can audit + revoke if a visit is disputed.

create table if not exists public.loyalty_ledger (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  queue_entry_id  uuid references public.queue_entries(id) on delete set null,
  delta           int not null,
  reason          text not null check (reason in ('earn_visit','burn_discount','adjust')),
  created_at      timestamptz not null default now()
);

create index if not exists idx_loyalty_user on public.loyalty_ledger (user_id, created_at desc);
create unique index if not exists uniq_loyalty_visit_earn
  on public.loyalty_ledger (queue_entry_id)
  where reason = 'earn_visit';

alter table public.loyalty_ledger enable row level security;

create policy "loyalty_owner_read" on public.loyalty_ledger
  for select using (user_id = auth.uid());

create or replace function public.my_loyalty_balance()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(delta), 0)::int
  from public.loyalty_ledger
  where user_id = auth.uid();
$$;

grant execute on function public.my_loyalty_balance() to authenticated;

-- Earn trigger: every time a queue_entry flips to completed, credit
-- 10 base points + 1 point per ₹100 of total_price (capped at 100).
create or replace function public.award_loyalty_on_complete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points int;
begin
  if old.status is not distinct from new.status then return new; end if;
  if new.status <> 'completed' then return new; end if;
  if new.user_id is null then return new; end if;

  v_points := 10 + least(100, floor(coalesce(new.total_price, 0) / 100))::int;

  insert into public.loyalty_ledger (user_id, queue_entry_id, delta, reason)
  values (new.user_id, new.id, v_points, 'earn_visit')
  on conflict (queue_entry_id) where reason = 'earn_visit' do nothing;

  return new;
end;
$$;

drop trigger if exists queue_award_loyalty on public.queue_entries;
create trigger queue_award_loyalty
  after update of status on public.queue_entries
  for each row
  when (old.status is distinct from new.status and new.status = 'completed')
  execute function public.award_loyalty_on_complete();

-- Burn: customer redeems N points at checkout for an equal ₹ discount.
-- 100 points = ₹100. Caller passes p_queue_entry_id (their booking)
-- and p_points; we cap at the smaller of their balance and the entry's
-- total_price.
create or replace function public.burn_loyalty_points(
  p_queue_entry_id uuid,
  p_points int
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_entry record;
  v_balance int;
  v_max int;
  v_burn int;
begin
  if v_uid is null then
    raise exception 'burn_loyalty_points: not authenticated' using errcode = '42501';
  end if;
  if p_points <= 0 then
    raise exception 'burn_loyalty_points: points must be positive' using errcode = '22023';
  end if;

  select id, user_id, status, total_price into v_entry
  from public.queue_entries where id = p_queue_entry_id;
  if v_entry.id is null or v_entry.user_id <> v_uid then
    raise exception 'burn_loyalty_points: not your booking' using errcode = '42501';
  end if;
  if v_entry.status not in ('waiting','arrived') then
    raise exception 'burn_loyalty_points: booking already %, cannot redeem', v_entry.status
      using errcode = '22023';
  end if;

  v_balance := public.my_loyalty_balance();
  v_max := least(v_balance, floor(coalesce(v_entry.total_price, 0))::int);
  v_burn := least(p_points, v_max);
  if v_burn <= 0 then
    raise exception 'burn_loyalty_points: nothing to redeem (balance=%, price=%)', v_balance, v_entry.total_price
      using errcode = '22023';
  end if;

  insert into public.loyalty_ledger (user_id, queue_entry_id, delta, reason)
  values (v_uid, v_entry.id, -v_burn, 'burn_discount');

  update public.queue_entries
    set total_price = greatest(0, total_price - v_burn),
        notes = trim(both ' ' from coalesce(notes, '') || ' · -₹' || v_burn || ' loyalty')
    where id = v_entry.id;

  return v_burn;
end;
$$;

grant execute on function public.burn_loyalty_points(uuid, int) to authenticated;
