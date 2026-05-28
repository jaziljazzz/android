-- skipQ — Migration 0034: walk-in customer phone lookup
--
-- Receptionist types a phone → we pre-fill the name and surface
-- "Returning customer · 5 visits". Scoped to the caller's salon.

create or replace function public.lookup_walk_in_customer(p_phone text)
returns table (
  phone text,
  name text,
  total_visits int,
  total_spend numeric,
  last_visit_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_salon_id uuid := public.current_partner_salon_id();
  v_role text := public.current_partner_role();
  v_phone text;
  v_phones text[];
begin
  if v_salon_id is null or v_role not in ('owner', 'receptionist') then
    return;
  end if;

  v_phone := regexp_replace(coalesce(p_phone, ''), '\s+', '', 'g');
  if length(v_phone) < 6 then
    return;
  end if;

  v_phones := array_remove(array[
    v_phone,
    regexp_replace(v_phone, '^\+91', ''),
    case when v_phone like '+%' then null else '+91' || regexp_replace(v_phone, '^0', '') end
  ], null);

  return query
  select
    cs.phone,
    coalesce(u.name, (
      select coalesce(qe.guest_name, '')
      from public.queue_entries qe
      where qe.salon_id = cs.salon_id
        and (qe.guest_phone = any(v_phones) or qe.user_id = cs.user_id)
        and qe.guest_name is not null
      order by qe.joined_at desc
      limit 1
    )) as name,
    cs.total_visits,
    cs.total_spend,
    cs.last_visit_at
  from public.customers_salons cs
  left join public.users u on u.id = cs.user_id
  where cs.salon_id = v_salon_id
    and cs.phone = any(v_phones)
  order by cs.total_visits desc
  limit 1;
end;
$$;

grant execute on function public.lookup_walk_in_customer(text) to authenticated;
