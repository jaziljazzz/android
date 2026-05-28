-- skipQ — Migration 0025: distance-sorted salon discovery
--
-- nearby_salons() returns active salons within radius_km of the given
-- lat/lng, with distance_km computed via PostGIS. Used by the customer
-- mobile home screen once we have device coordinates.

create or replace function public.nearby_salons(
  p_lat double precision,
  p_lng double precision,
  p_radius_km int default 10
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
      (ST_Distance(
        s.location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
      ) / 1000)::numeric,
      2
    ) as distance_km
  from public.salons s
  where s.status = 'active'
    and s.location is not null
    and ST_DWithin(
      s.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    )
  order by
    (s.featured_until is not null and s.featured_until > now()) desc,
    distance_km asc;
$$;

grant execute on function public.nearby_salons(double precision, double precision, int) to anon, authenticated;
