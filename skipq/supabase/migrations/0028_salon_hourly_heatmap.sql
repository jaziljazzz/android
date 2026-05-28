-- skipQ — Migration 0028: hourly heatmap for the partner analytics page
--
-- Returns counts of completed queue entries bucketed by (day_of_week,
-- hour_of_day) over the last `p_days` days, in Asia/Kolkata.
-- 0 = Sunday, 6 = Saturday. Used to render a 7×24 demand heatmap.

create or replace function public.salon_hourly_heatmap(p_days int default 30)
returns table(day_of_week int, hour_of_day int, visits int)
language sql
stable
security definer
set search_path = public
as $$
  with my as (
    select public.current_partner_salon_id() as id
  )
  select
    extract(dow from (qe.joined_at at time zone 'Asia/Kolkata'))::int as day_of_week,
    extract(hour from (qe.joined_at at time zone 'Asia/Kolkata'))::int as hour_of_day,
    count(*)::int as visits
  from public.queue_entries qe, my
  where qe.salon_id = my.id
    and qe.status in ('completed', 'serving', 'arrived')
    and qe.joined_at >= now() - (p_days || ' days')::interval
  group by 1, 2
  order by 1, 2;
$$;

grant execute on function public.salon_hourly_heatmap(int) to authenticated;
