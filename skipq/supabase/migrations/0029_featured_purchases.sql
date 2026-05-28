-- skipQ — Migration 0029: featured-listing purchase rail
--
-- Re-uses the payments table for featured-listing buys by introducing
-- a purpose column. apply_featured_purchase() extends the salon's
-- featured_until window by the weeks count recorded in metadata.

alter table public.payments
  add column if not exists purpose text not null default 'queue'
    check (purpose in ('queue', 'featured')),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_payments_purpose on public.payments (purpose);

create or replace function public.apply_featured_purchase(p_payment_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay record;
  v_weeks int;
  v_new_until timestamptz;
begin
  select id, salon_id, status, purpose, metadata
    into v_pay
  from public.payments
  where id = p_payment_id;

  if v_pay.id is null then
    raise exception 'apply_featured_purchase: payment not found' using errcode = '22023';
  end if;
  if v_pay.purpose <> 'featured' then
    raise exception 'apply_featured_purchase: payment is not a featured purchase' using errcode = '22023';
  end if;
  if v_pay.status <> 'paid' then
    raise exception 'apply_featured_purchase: payment not paid' using errcode = '22023';
  end if;

  v_weeks := coalesce((v_pay.metadata ->> 'weeks')::int, 0);
  if v_weeks <= 0 then
    raise exception 'apply_featured_purchase: invalid weeks count' using errcode = '22023';
  end if;

  update public.salons s
    set featured_until = greatest(coalesce(s.featured_until, now()), now())
                         + (v_weeks || ' weeks')::interval
    where s.id = v_pay.salon_id
    returning s.featured_until into v_new_until;

  return v_new_until;
end;
$$;

revoke execute on function public.apply_featured_purchase(uuid) from public;
