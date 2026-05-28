-- skipQ — Migration 0019: weekly lead-fee invoice generation
--
-- Spec §5 Layer 1: ₹50 per NEW customer SkipQ brings to a salon.
-- Spec §8 Flow 6: invoice runs Sunday 11 PM IST (we use 22:00 UTC = Mon
-- 03:30 IST for safety against daylight-savings drift).
--
-- pg_cron runs generate_weekly_invoices() every Monday at 03:30 IST.
-- Each salon with new customers in the previous week (Mon→Sun) gets one
-- public.invoices row with status='pending' and a 7-day due date.
-- Idempotent: skips if an invoice already exists for the (salon, period).

create or replace function public.generate_weekly_invoices()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_start date := (current_date - interval '7 days')::date;
  v_period_end   date := (current_date - interval '1 day')::date;
  v_inserted     int  := 0;
  v_lead_fee     numeric(10,2) := 50.00;
begin
  with new_customers as (
    select qe.salon_id, count(*) as cnt
    from public.queue_entries qe
    where qe.status = 'completed'
      and qe.is_new_customer = true
      and qe.completed_at >= v_period_start
      and qe.completed_at <  (v_period_end + interval '1 day')
    group by qe.salon_id
    having count(*) > 0
  )
  insert into public.invoices (
    salon_id, period_start, period_end, new_customer_count,
    lead_fee_amount, total_amount, status, due_at
  )
  select
    nc.salon_id, v_period_start, v_period_end, nc.cnt,
    nc.cnt * v_lead_fee, nc.cnt * v_lead_fee,
    'pending', now() + interval '7 days'
  from new_customers nc
  where not exists (
    select 1 from public.invoices i
    where i.salon_id = nc.salon_id
      and i.period_start = v_period_start
      and i.period_end = v_period_end
  );

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke execute on function public.generate_weekly_invoices() from public;

-- pg_cron schedule. Drop the existing one first if re-running.
do $$
declare j_id bigint;
begin
  select jobid into j_id from cron.job where jobname = 'skipq_weekly_invoices';
  if j_id is not null then perform cron.unschedule(j_id); end if;
end $$;

select cron.schedule(
  'skipq_weekly_invoices',
  '30 22 * * 0',
  $$select public.generate_weekly_invoices();$$
);
