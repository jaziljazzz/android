-- skipQ — Migration 0037: live queue position for the bookings tab
--
-- The customer's queue_entries.position is a snapshot at join time and
-- never moves. This RPC returns the *current* position by counting
-- still-active entries that joined before them. The caller can only
-- look up entries that belong to them.

create or replace function public.my_queue_position(p_entry_id uuid)
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_salon_id uuid;
  v_joined_at timestamptz;
  v_status text;
  v_ahead int;
begin
  if v_uid is null then return null; end if;

  select salon_id, joined_at, status
    into v_salon_id, v_joined_at, v_status
  from public.queue_entries
  where id = p_entry_id and user_id = v_uid;

  if v_salon_id is null then return null; end if;
  if v_status not in ('waiting','arrived','serving') then return 0; end if;

  select count(*) into v_ahead
  from public.queue_entries
  where salon_id = v_salon_id
    and status in ('waiting','arrived','serving')
    and joined_at < v_joined_at;

  return v_ahead + 1;
end;
$$;

grant execute on function public.my_queue_position(uuid) to authenticated;
