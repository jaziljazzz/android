-- skipQ — Migration 0026: helper to set salons.location from lat/lng
--
-- salons.location is geography(point, 4326). Setting it via the JS
-- client requires building a WKT string and casting — wrap that in a
-- SECURITY DEFINER RPC so the owner just passes two floats.

create or replace function public.set_salon_location(
  p_salon_id uuid,
  p_lat double precision,
  p_lng double precision
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'set_salon_location: not authenticated' using errcode = '42501';
  end if;
  select role into v_role from public.partner_users
    where auth_user_id = auth.uid() and salon_id = p_salon_id;
  if v_role is null or v_role <> 'owner' then
    raise exception 'set_salon_location: forbidden' using errcode = '42501';
  end if;
  if p_lat is null or p_lng is null
     or p_lat < -90 or p_lat > 90
     or p_lng < -180 or p_lng > 180 then
    raise exception 'set_salon_location: invalid coordinates' using errcode = '22023';
  end if;
  update public.salons
    set location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    where id = p_salon_id;
  return true;
end;
$$;

grant execute on function public.set_salon_location(uuid, double precision, double precision) to authenticated;
