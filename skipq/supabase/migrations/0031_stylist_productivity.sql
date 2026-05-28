-- skipQ — Migration 0031: per-stylist productivity table
--
-- Returns one row per stylist on the caller's salon over the past
-- `p_days` days: services completed, avg duration, avg rating, and
-- revenue generated. Used by the Analytics page's productivity section.

create or replace function public.salon_stylist_productivity(p_days int default 30)
returns table (
  stylist_id uuid,
  stylist_name text,
  services_completed int,
  avg_minutes int,
  avg_rating numeric,
  rating_count int,
  revenue numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with my as (
    select public.current_partner_salon_id() as id
  ),
  bookings as (
    select
      qe.stylist_id,
      qe.id as entry_id,
      qe.total_price,
      qe.started_at,
      qe.completed_at
    from public.queue_entries qe
    join my on my.id = qe.salon_id
    where qe.status = 'completed'
      and qe.stylist_id is not null
      and qe.completed_at >= now() - (p_days || ' days')::interval
  )
  select
    s.id as stylist_id,
    s.name as stylist_name,
    count(b.entry_id)::int as services_completed,
    coalesce(
      round(avg(extract(epoch from (b.completed_at - b.started_at)) / 60.0))::int,
      0
    ) as avg_minutes,
    coalesce(
      (select round(avg(r.rating)::numeric, 1)
         from public.reviews r
         where r.stylist_id = s.id
           and r.created_at >= now() - (p_days || ' days')::interval),
      null
    ) as avg_rating,
    coalesce(
      (select count(*)::int from public.reviews r
         where r.stylist_id = s.id
           and r.created_at >= now() - (p_days || ' days')::interval),
      0
    ) as rating_count,
    coalesce(sum(b.total_price), 0)::numeric as revenue
  from public.stylists s
  join my on my.id = s.salon_id
  left join bookings b on b.stylist_id = s.id
  group by s.id, s.name
  order by services_completed desc, s.name;
$$;

grant execute on function public.salon_stylist_productivity(int) to authenticated;
