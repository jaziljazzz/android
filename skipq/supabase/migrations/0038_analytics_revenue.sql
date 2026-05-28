-- skipQ — Migration 0038: add revenue_today + new_customers_today to analytics
--
-- Extends salon_daily_analytics() so the partner home shows today's
-- earnings + how many new customers SkipQ brought in. Existing call
-- sites continue to work — we only added columns at the end.

drop function if exists public.salon_daily_analytics();

create or replace function public.salon_daily_analytics()
returns table(
  served_today int,
  walk_aways_today int,
  avg_wait_min_today numeric,
  avg_rating numeric,
  review_count int,
  peak_hour int,
  active_now int,
  revenue_today numeric,
  new_customers_today int
)
language sql
security definer
set search_path = public
as $$
  with my_salon as (
    select salon_id from public.partner_users where auth_user_id = auth.uid()
  ),
  today_entries as (
    select qe.*
    from public.queue_entries qe, my_salon
    where qe.salon_id = my_salon.salon_id
      and qe.joined_at >= date_trunc('day', now() at time zone 'Asia/Kolkata')
  ),
  hour_counts as (
    select extract(hour from joined_at at time zone 'Asia/Kolkata')::int as hr, count(*) as cnt
    from public.queue_entries qe, my_salon
    where qe.salon_id = my_salon.salon_id
      and qe.joined_at >= now() - interval '30 days'
    group by hr
    order by cnt desc
    limit 1
  )
  select
    (select count(*) from today_entries where status = 'completed')::int,
    (select count(*) from today_entries where status in ('no_show', 'cancelled'))::int,
    (select coalesce(avg(actual_wait_min), avg(estimated_wait_min)) from today_entries where status in ('completed', 'serving')),
    (select rating from public.salons s, my_salon where s.id = my_salon.salon_id),
    (select review_count from public.salons s, my_salon where s.id = my_salon.salon_id),
    (select hr from hour_counts),
    (select count(*) from today_entries where status in ('waiting', 'arrived', 'serving'))::int,
    (select coalesce(sum(total_price), 0)::numeric from today_entries where status = 'completed'),
    (select count(*) from today_entries where status = 'completed' and is_new_customer = true)::int;
$$;

revoke execute on function public.salon_daily_analytics() from public;
grant execute on function public.salon_daily_analytics() to authenticated;
