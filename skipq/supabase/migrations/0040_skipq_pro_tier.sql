-- skipQ — Migration 0040: skipQ Pro paid tier for salons (₹999/month)
--
-- Implemented as a stackable 30-day pass (same shape as featured
-- listings) so we can ship without wiring Razorpay Subscriptions.
-- salons.pro_until carries the expiry; is_pro_salon() returns true
-- whenever pro_until is in the future.

alter table public.salons
  add column if not exists pro_until timestamptz;

alter table public.payments
  drop constraint if exists payments_purpose_check;

alter table public.payments
  add constraint payments_purpose_check
  check (purpose in ('queue', 'featured', 'pro'));

create or replace function public.is_pro_salon(p_salon_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select pro_until > now() from public.salons where id = p_salon_id),
    false
  );
$$;

grant execute on function public.is_pro_salon(uuid) to authenticated;

create or replace function public.apply_pro_purchase(p_payment_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay record;
  v_months int;
  v_new_until timestamptz;
begin
  select id, salon_id, status, purpose, metadata
    into v_pay
  from public.payments
  where id = p_payment_id;

  if v_pay.id is null then
    raise exception 'apply_pro_purchase: payment not found' using errcode = '22023';
  end if;
  if v_pay.purpose <> 'pro' then
    raise exception 'apply_pro_purchase: payment is not a pro purchase' using errcode = '22023';
  end if;
  if v_pay.status <> 'paid' then
    raise exception 'apply_pro_purchase: payment not paid' using errcode = '22023';
  end if;

  v_months := coalesce((v_pay.metadata ->> 'months')::int, 1);
  if v_months <= 0 then v_months := 1; end if;

  update public.salons s
    set pro_until = greatest(coalesce(s.pro_until, now()), now())
                    + (v_months || ' months')::interval
    where s.id = v_pay.salon_id
    returning s.pro_until into v_new_until;

  return v_new_until;
end;
$$;

revoke execute on function public.apply_pro_purchase(uuid) from public;
