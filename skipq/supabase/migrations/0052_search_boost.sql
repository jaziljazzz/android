-- skipQ — Migration 0052: search-boost (pay-per-click) ads
--
-- Salon owner buys a click-pack via Razorpay. Each pack credits N
-- impressions; nearby_salons applies a small rank bonus while credits
-- remain. Tap events come from the customer client via a new RPC that
-- atomically decrements the counter and logs the click.

alter table public.salons
  add column if not exists search_boost_credits int not null default 0;

alter table public.payments
  drop constraint if exists payments_purpose_check;

alter table public.payments
  add constraint payments_purpose_check
  check (purpose in ('queue', 'featured', 'pro', 'plus', 'boost'));

create or replace function public.apply_boost_purchase(p_payment_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay record;
  v_clicks int;
  v_total int;
begin
  select id, salon_id, status, purpose, metadata into v_pay
  from public.payments where id = p_payment_id;
  if v_pay.id is null then raise exception 'apply_boost_purchase: payment not found' using errcode = '22023'; end if;
  if v_pay.purpose <> 'boost' then raise exception 'apply_boost_purchase: wrong purpose' using errcode = '22023'; end if;
  if v_pay.status <> 'paid' then raise exception 'apply_boost_purchase: payment not paid' using errcode = '22023'; end if;
  v_clicks := coalesce((v_pay.metadata ->> 'clicks')::int, 0);
  if v_clicks <= 0 then raise exception 'apply_boost_purchase: invalid click pack' using errcode = '22023'; end if;
  update public.salons
    set search_boost_credits = search_boost_credits + v_clicks
    where id = v_pay.salon_id
    returning search_boost_credits into v_total;
  return v_total;
end;
$$;

revoke execute on function public.apply_boost_purchase(uuid) from public;

create or replace function public.record_boost_click(p_salon_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining int;
begin
  update public.salons
    set search_boost_credits = greatest(0, search_boost_credits - 1)
    where id = p_salon_id and search_boost_credits > 0
    returning search_boost_credits into v_remaining;
  return v_remaining is not null;
end;
$$;

grant execute on function public.record_boost_click(uuid) to anon, authenticated;

-- nearby_salons gets a small rank bonus for salons with credits
create or replace function public.nearby_salons(
  p_lat double precision,
  p_lng double precision,
  p_radius_km int default 5
)
returns table (
  id uuid,
  name text,
  tagline text,
  area text,
  city text,
  type text,
  rating numeric,
  review_count int,
  featured_until timestamptz,
  cover_image text,
  hours jsonb,
  distance_km numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id, s.name, s.tagline, s.area, s.city, s.type, s.rating, s.review_count,
    s.featured_until, s.cover_image, s.hours,
    round(
      (ST_Distance(s.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000)::numeric,
      2
    ) as distance_km
  from public.salons s
  where s.status = 'active'
    and s.location is not null
    and ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_km * 1000)
  order by
    (s.featured_until is not null and s.featured_until > now()) desc,
    (s.search_boost_credits > 0) desc,
    distance_km asc;
$$;

grant execute on function public.nearby_salons(double precision, double precision, int)
  to anon, authenticated;
