-- skipQ — Migration 0054: public queue-count RPC for the customer web
--
-- queue_entries are RLS-locked to the customer + partner + admin, so
-- anonymous (logged-out) visitors can't COUNT them directly. This
-- security-definer RPC exposes only the integer so the unauthenticated
-- customer browsing surface shows the right number.

create or replace function public.salon_active_count(p_salon_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.queue_entries
  where salon_id = p_salon_id
    and status in ('waiting', 'arrived', 'serving', 'waiting_deposit');
$$;

grant execute on function public.salon_active_count(uuid) to anon, authenticated;
