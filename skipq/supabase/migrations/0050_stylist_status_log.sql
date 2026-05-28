-- skipQ — Migration 0050: stylist status log (algorithm v3 piece)
--
-- Records every stylist status transition so the wait-time algorithm
-- can subtract break minutes and account for late returns. Powered by
-- an after-update trigger on stylists. The salon_live_eta RPC now
-- accounts for the open break time when a stylist is currently away.

create table if not exists public.stylist_status_log (
  id          uuid primary key default uuid_generate_v4(),
  stylist_id  uuid not null references public.stylists(id) on delete cascade,
  salon_id    uuid not null references public.salons(id) on delete cascade,
  status      text not null,
  changed_at  timestamptz not null default now()
);

create index if not exists idx_stylist_log_stylist on public.stylist_status_log (stylist_id, changed_at desc);

create or replace function public.log_stylist_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.stylist_status_log (stylist_id, salon_id, status)
    values (new.id, new.salon_id, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists stylists_status_log on public.stylists;
create trigger stylists_status_log
  after update of status on public.stylists
  for each row execute function public.log_stylist_status_change();

create or replace function public.stylist_break_minutes_today(p_stylist_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  with day_start as (
    select date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata' as t
  ),
  segments as (
    select
      changed_at,
      status,
      lead(changed_at, 1, now()) over (partition by stylist_id order by changed_at) as next_at
    from public.stylist_status_log, day_start
    where stylist_id = p_stylist_id
      and changed_at >= day_start.t
  )
  select coalesce(
    round(sum(
      extract(epoch from (segments.next_at - segments.changed_at)) / 60.0
    ))::int,
    0
  )
  from segments
  where status in ('break', 'off');
$$;

grant execute on function public.stylist_break_minutes_today(uuid) to authenticated;

-- Live ETA now adds an extra buffer when the salon has active stylists
-- currently on break / off — assume they're 50% likely to come back
-- within their average break-to-active gap.
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
      and qe.status in ('waiting','arrived','serving','waiting_deposit')
  ),
  base as (
    select coalesce(sum(
      case
        when status = 'serving' and started_at is not null then
          greatest(0, duration_min - extract(epoch from (now() - started_at))::int / 60)
        else duration_min
      end
    ), 0)::int as mins
    from active
  ),
  break_pad as (
    select least(15,
      coalesce((
        select round(avg(public.stylist_break_minutes_today(st.id)))::int
        from public.stylists st
        where st.salon_id = p_salon_id and st.status in ('break','off')
      ), 0)
    ) as pad
  )
  select base.mins + break_pad.pad
  from base, break_pad;
$$;

grant execute on function public.salon_live_eta(uuid) to anon, authenticated;
