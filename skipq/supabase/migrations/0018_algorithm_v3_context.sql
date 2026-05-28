-- skipQ — Migration 0018: Algorithm v3 — context-aware multipliers
--
-- Stacks on top of v2 (learned per-stylist durations). Per spec §10 v3:
--   - Day of week: Saturday +8%
--   - Time of day: ≥ 16:00 (4 PM) +5% fatigue
--   - Customer complexity: new customer +12% (consultation time)
--   - Queue load: ≥5 in queue -4% (stylists rush)
--
-- All factors evaluated in IST. Conservative multipliers; applied on top of
-- whatever v2 returned. Pure SQL — no client changes needed.

create or replace function public.apply_v3_context(
  p_base_minutes numeric,
  p_is_new_customer boolean,
  p_queue_depth int
)
returns numeric
language sql
immutable
as $$
  with factors as (
    select
      case when extract(dow from now() at time zone 'Asia/Kolkata') = 6 then 1.08 else 1.0 end as day_factor,
      case when extract(hour from now() at time zone 'Asia/Kolkata') >= 16 then 1.05 else 1.0 end as time_factor,
      case when coalesce(p_is_new_customer, false) then 1.12 else 1.0 end as new_factor,
      case when coalesce(p_queue_depth, 0) >= 5 then 0.96 else 1.0 end as load_factor
  )
  select round(p_base_minutes * day_factor * time_factor * new_factor * load_factor, 1)
  from factors;
$$;

grant execute on function public.apply_v3_context(numeric, boolean, int) to authenticated;
