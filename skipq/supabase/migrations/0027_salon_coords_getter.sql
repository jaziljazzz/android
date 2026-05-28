-- skipQ — Migration 0027: read salon coords back for the partner editor

create or replace function public.salon_coords(p_salon_id uuid)
returns table(lat double precision, lng double precision)
language sql
stable
security definer
set search_path = public
as $$
  select
    ST_Y(location::geometry)::double precision as lat,
    ST_X(location::geometry)::double precision as lng
  from public.salons
  where id = p_salon_id
    and location is not null;
$$;

grant execute on function public.salon_coords(uuid) to authenticated;
