-- skipQ — Migration 0024: automatic no-show detection
--
-- Spec §18: "Mark as no-show after 15 min past their slot". A customer
-- in 'waiting' status whose estimated_wait_min has expired by >15 min
-- is presumed not to be coming. 'arrived' entries are skipped because
-- the receptionist has physical confirmation the customer is there.

create or replace function public.mark_no_shows()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  with stale as (
    select id from public.queue_entries
    where status = 'waiting'
      and joined_at + (coalesce(estimated_wait_min, 30) + 15) * interval '1 minute' < now()
  ),
  updated as (
    update public.queue_entries qe
    set status = 'no_show',
        cancelled_at = now()
    from stale
    where qe.id = stale.id
    returning qe.id
  )
  select count(*)::int into v_count from updated;
  return coalesce(v_count, 0);
end;
$$;

revoke execute on function public.mark_no_shows() from public;

do $$
declare j_id bigint;
begin
  select jobid into j_id from cron.job where jobname = 'skipq_mark_no_shows';
  if j_id is not null then perform cron.unschedule(j_id); end if;
end $$;

select cron.schedule(
  'skipq_mark_no_shows',
  '*/2 * * * *',
  $$select public.mark_no_shows();$$
);
