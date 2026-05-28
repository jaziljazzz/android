-- skipQ — Migration 0012: current_partner_full() RPC
--
-- Returns the calling auth user's partner_users row + their salon's name +
-- area + city in one round-trip. Used by the partner layout to avoid two
-- nested RLS queries (which were intermittently returning null even when
-- the underlying rows were visible to the user — likely a Next.js / SSR
-- cookie propagation quirk).

create or replace function public.current_partner_full()
returns table(
  partner_id uuid,
  name text,
  role text,
  salon_id uuid,
  salon_name text,
  salon_area text,
  salon_city text
)
language sql
security definer
set search_path = public
as $$
  select
    pu.id, pu.name, pu.role,
    pu.salon_id, s.name, s.area, s.city
  from public.partner_users pu
  left join public.salons s on s.id = pu.salon_id
  where pu.auth_user_id = auth.uid();
$$;

revoke execute on function public.current_partner_full() from public;
grant execute on function public.current_partner_full() to authenticated;
