-- skipQ — Migration 0005: allow partner-side inserts into service_timings
--
-- Migration 0002 only granted SELECT on service_timings. Partners need to
-- INSERT a row every time a service completes — that's the data the v2
-- algorithm learns from. Scope is the partner's own salon; stylist_id
-- must belong to that salon.

create policy "service_timings_partner_insert" on public.service_timings
  for insert
  with check (
    salon_id = public.current_partner_salon_id()
    and exists (
      select 1 from public.stylists s
      where s.id = stylist_id
        and s.salon_id = public.current_partner_salon_id()
    )
  );
