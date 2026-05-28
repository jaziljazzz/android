-- skipQ — Migration 0048: customer dispute / refund flow (spec §18)
--
-- A customer can flag a completed (or no_show) booking. Admin reviews
-- and resolves with refund or reject. Refund flips the payment row
-- (if any) to 'refunded'. Salon-side suspension after a high dispute
-- rate is deliberately not automated — admin call.

create table if not exists public.disputes (
  id              uuid primary key default uuid_generate_v4(),
  queue_entry_id  uuid not null references public.queue_entries(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  salon_id        uuid not null references public.salons(id) on delete cascade,
  reason          text not null,
  status          text not null default 'open'
                    check (status in ('open','refunded','rejected')),
  resolution      text,
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  resolved_by     uuid references auth.users(id) on delete set null,
  unique (queue_entry_id, user_id)
);

create index if not exists idx_disputes_status on public.disputes (status, created_at desc);
create index if not exists idx_disputes_salon on public.disputes (salon_id);

alter table public.disputes enable row level security;

create policy "disputes_owner_read" on public.disputes
  for select using (user_id = auth.uid() or public.is_admin());

create policy "disputes_admin_write" on public.disputes
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.file_dispute(
  p_queue_entry_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_entry record;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'file_dispute: not authenticated' using errcode = '42501';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'file_dispute: reason required' using errcode = '22023';
  end if;
  if length(p_reason) > 500 then
    raise exception 'file_dispute: reason too long' using errcode = '22023';
  end if;

  select id, user_id, salon_id, status, completed_at, cancelled_at into v_entry
  from public.queue_entries where id = p_queue_entry_id;

  if v_entry.id is null or v_entry.user_id <> v_uid then
    raise exception 'file_dispute: not your booking' using errcode = '42501';
  end if;
  if v_entry.status not in ('completed','no_show','cancelled') then
    raise exception 'file_dispute: booking is still active' using errcode = '22023';
  end if;

  -- 60-day window from completion / cancellation
  if coalesce(v_entry.completed_at, v_entry.cancelled_at, now()) < now() - interval '60 days' then
    raise exception 'file_dispute: booking too old (60-day window)' using errcode = '22023';
  end if;

  insert into public.disputes (queue_entry_id, user_id, salon_id, reason)
  values (p_queue_entry_id, v_uid, v_entry.salon_id, p_reason)
  on conflict (queue_entry_id, user_id) do update set reason = excluded.reason
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.file_dispute(uuid, text) to authenticated;

create or replace function public.resolve_dispute(
  p_dispute_id uuid,
  p_resolution text,
  p_refund boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_disp record;
begin
  if not public.is_admin() then
    raise exception 'resolve_dispute: admin only' using errcode = '42501';
  end if;
  select id, queue_entry_id from public.disputes where id = p_dispute_id into v_disp;
  if v_disp.id is null then
    raise exception 'resolve_dispute: not found' using errcode = '22023';
  end if;

  update public.disputes
    set status = case when p_refund then 'refunded' else 'rejected' end,
        resolution = p_resolution,
        resolved_at = now(),
        resolved_by = auth.uid()
    where id = p_dispute_id;

  if p_refund then
    update public.payments
      set status = 'refunded'
      where queue_entry_id = v_disp.queue_entry_id and status = 'paid';
  end if;

  return true;
end;
$$;

grant execute on function public.resolve_dispute(uuid, text, boolean) to authenticated;
