-- skipQ — Migration 0042: skipQ Plus consumer subscription (₹99/mo)
--
-- Same stackable 30-day-pass pattern as featured + Pro. users.plus_until
-- carries the expiry. is_plus_user() helper for UI gating. The
-- payments.purpose check is extended once more. Existing referral data
-- on users gets a sibling marker so we can credit the referrer when a
-- new Plus signup completes.

alter table public.users
  add column if not exists plus_until timestamptz;

alter table public.payments
  drop constraint if exists payments_purpose_check;

alter table public.payments
  add constraint payments_purpose_check
  check (purpose in ('queue', 'featured', 'pro', 'plus'));

create or replace function public.is_plus_user(p_user_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select plus_until > now()
       from public.users
       where id = coalesce(p_user_id, auth.uid())),
    false
  );
$$;

grant execute on function public.is_plus_user(uuid) to authenticated;

create or replace function public.apply_plus_purchase(p_payment_id uuid)
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
  select id, user_id, status, purpose, metadata
    into v_pay
  from public.payments
  where id = p_payment_id;

  if v_pay.id is null then
    raise exception 'apply_plus_purchase: payment not found' using errcode = '22023';
  end if;
  if v_pay.purpose <> 'plus' then
    raise exception 'apply_plus_purchase: payment is not a plus purchase' using errcode = '22023';
  end if;
  if v_pay.status <> 'paid' then
    raise exception 'apply_plus_purchase: payment not paid' using errcode = '22023';
  end if;

  v_months := coalesce((v_pay.metadata ->> 'months')::int, 1);
  if v_months <= 0 then v_months := 1; end if;

  update public.users u
    set plus_until = greatest(coalesce(u.plus_until, now()), now())
                     + (v_months || ' months')::interval
    where u.id = v_pay.user_id
    returning u.plus_until into v_new_until;

  return v_new_until;
end;
$$;

revoke execute on function public.apply_plus_purchase(uuid) from public;
