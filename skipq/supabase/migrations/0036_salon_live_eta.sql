-- skipQ — Migration 0036: live ETA per salon for the home list
--
-- Sums the remaining default-duration time for every queue entry in
-- progress at this salon (waiting + arrived + serving). For the
-- currently-serving entry we subtract the time that has already elapsed.
-- Customer mobile renders the result through formatEta() so the spec
-- §10 5-minute rounding and 90+ cap still apply on the UI side.

create or replace function public.salon_live_eta(p_salon_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  with active as (
    select qe.id, qe.status, qe.started_at,
      coalesce(
        (select sum(s.default_duration)::int
           from public.queue_entry_services qes
           join public.services s on s.id = qes.service_id
           where qes.queue_entry_id = qe.id),
        0
      ) as duration_min
    from public.queue_entries qe
    where qe.salon_id = p_salon_id
      and qe.status in ('waiting','arrived','serving')
  )
  select coalesce(sum(
    case
      when status = 'serving' and started_at is not null then
        greatest(0, duration_min - extract(epoch from (now() - started_at))::int / 60)
      else
        duration_min
    end
  ), 0)::int
  from active;
$$;

grant execute on function public.salon_live_eta(uuid) to anon, authenticated;
