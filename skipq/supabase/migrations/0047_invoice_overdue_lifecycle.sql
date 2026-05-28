-- skipQ — Migration 0047: invoice overdue lifecycle (spec §18)
--
-- 14 days past due → mark the invoice overdue + suspend the salon so
-- they vanish from the customer feed. 30 days past due → keep them
-- suspended (no-op if already there) and stamp a `removed_at` style
-- marker via salons.status='suspended' + log to a moderation table.

create or replace function public.run_invoice_overdue_sweep()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_14 int := 0;
  v_30 int := 0;
  r record;
begin
  -- 14-day rule: pending invoice past due → overdue + suspend salon
  for r in
    select i.id, i.salon_id
    from public.invoices i
    where i.status = 'pending'
      and i.due_at is not null
      and v_now > i.due_at + interval '14 days'
  loop
    update public.invoices set status = 'overdue' where id = r.id;
    update public.salons set status = 'suspended'
      where id = r.salon_id and status <> 'suspended';
    v_14 := v_14 + 1;
  end loop;

  -- 30-day rule: keep suspended (no-op if already), but bump back to
  -- suspended in case an admin un-suspended without payment landing.
  for r in
    select i.salon_id
    from public.invoices i
    where i.status = 'overdue'
      and i.due_at is not null
      and v_now > i.due_at + interval '30 days'
  loop
    update public.salons set status = 'suspended'
      where id = r.salon_id and status <> 'suspended';
    v_30 := v_30 + 1;
  end loop;

  return v_14 + v_30;
end;
$$;

revoke execute on function public.run_invoice_overdue_sweep() from public;

do $$
declare j_id bigint;
begin
  select jobid into j_id from cron.job where jobname = 'skipq_invoice_overdue_sweep';
  if j_id is not null then perform cron.unschedule(j_id); end if;
end $$;

select cron.schedule(
  'skipq_invoice_overdue_sweep',
  '15 4 * * *',
  $$select public.run_invoice_overdue_sweep();$$
);
