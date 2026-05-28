-- skipQ — Migration 0014: salon_daily_analytics() RPC
-- Aggregates today's queue activity into a single row the partner dashboard
-- can render without composing six queries client-side.

create or replace function public.salon_daily_analytics()
returns table(
  served_today int,
  walk_aways_today int,
  avg_wait_min_today numeric,
  avg_rating numeric,
  review_count int,
  peak_hour int,
  active_now int
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
    (select count(*) from today_entries where status in ('waiting', 'arrived', 'serving'))::int;
$$;

revoke execute on function public.salon_daily_analytics() from public;
grant execute on function public.salon_daily_analytics() to authenticated;
