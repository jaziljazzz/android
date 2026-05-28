-- skipQ — Migration 0053: per-stylist combo learning (algo v2 piece)
--
-- Returns a learned average duration (seconds) for a given
-- (stylist_id, service_signature) pair when we have >= 5 samples,
-- otherwise null. Customer mobile can fall back to the static
-- comboMultiplier heuristic in @skipq/algorithm.

create or replace function public.stylist_combo_avg_seconds(
  p_stylist_id uuid,
  p_signature text,
  p_min_samples int default 5
)
returns int
language sql
stable
security definer
set search_path = public
as $$
  with samples as (
    select total_duration_seconds
    from public.service_timings
    where stylist_id = p_stylist_id
      and service_signature = p_signature
    order by recorded_at desc
    limit 30
  ),
  c as (select count(*)::int as n from samples)
  select case
    when (select n from c) >= p_min_samples then
      (select round(avg(total_duration_seconds))::int from samples)
    else null
  end;
$$;

grant execute on function public.stylist_combo_avg_seconds(uuid, text, int)
  to anon, authenticated;

-- Convenience: customer flow passes a sorted service id list (the way
-- @skipq/algorithm's serviceSignature builds it) and gets back the
-- expected minutes if there is enough learned data.
create or replace function public.stylist_combo_avg_minutes(
  p_stylist_id uuid,
  p_service_ids uuid[]
)
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_sig text;
  v_secs int;
begin
  if array_length(p_service_ids, 1) is null then return null; end if;
  -- Build the same signature shape as @skipq/algorithm's serviceSignature
  -- (lowercased UUIDs separated by '+', sorted ascending).
  select string_agg(lower(id::text), '+' order by id::text)
    into v_sig
  from unnest(p_service_ids) as id;
  v_secs := public.stylist_combo_avg_seconds(p_stylist_id, v_sig);
  if v_secs is null then return null; end if;
  return round(v_secs / 60.0)::int;
end;
$$;

grant execute on function public.stylist_combo_avg_minutes(uuid, uuid[])
  to anon, authenticated;
