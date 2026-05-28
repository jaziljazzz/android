-- skipQ — Migration 0030: modify an in-flight queue entry (spec §18)
--
-- A customer can change services / stylist while their entry is still
-- 'waiting'. Once the receptionist marks them arrived/serving the
-- booking is locked.

create or replace function public.modify_queue_entry(
  p_entry_id uuid,
  p_service_ids uuid[],
  p_preferred_stylist_id uuid default null
)
returns table(
  queue_entry_id uuid,
  total_price numeric,
  total_duration_min int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_entry record;
  v_total_price numeric(10,2);
  v_total_duration int;
begin
  if v_uid is null then
    raise exception 'modify_queue_entry: not authenticated' using errcode = '42501';
  end if;
  if array_length(p_service_ids, 1) is null then
    raise exception 'modify_queue_entry: at least one service required' using errcode = '22023';
  end if;

  select id, salon_id, status, user_id
    into v_entry
  from public.queue_entries
  where id = p_entry_id;

  if v_entry.id is null then
    raise exception 'modify_queue_entry: not found' using errcode = '22023';
  end if;
  if v_entry.user_id <> v_uid then
    raise exception 'modify_queue_entry: forbidden' using errcode = '42501';
  end if;
  if v_entry.status <> 'waiting' then
    raise exception 'modify_queue_entry: booking already %, cannot modify', v_entry.status
      using errcode = '22023';
  end if;

  -- Confirm all services belong to this salon and are active
  if (
    select count(*)
    from public.services s
    where s.salon_id = v_entry.salon_id
      and s.id = any(p_service_ids)
      and s.active = true
  ) <> coalesce(array_length(p_service_ids, 1), 0) then
    raise exception 'modify_queue_entry: invalid service for this salon' using errcode = '22023';
  end if;

  select coalesce(sum(price), 0), coalesce(sum(default_duration), 0)
    into v_total_price, v_total_duration
  from public.services
  where salon_id = v_entry.salon_id and id = any(p_service_ids) and active = true;

  delete from public.queue_entry_services where queue_entry_id = p_entry_id;
  insert into public.queue_entry_services (queue_entry_id, service_id, price_at_time, duration_at_time)
  select p_entry_id, s.id, s.price, s.default_duration
  from public.services s
  where s.salon_id = v_entry.salon_id and s.id = any(p_service_ids) and s.active = true;

  update public.queue_entries
    set total_price = v_total_price,
        preferred_stylist_id = p_preferred_stylist_id,
        notes = case when notes is null or notes = '' then 'Booking modified by customer'
                     else notes end
    where id = p_entry_id;

  return query select p_entry_id, v_total_price, v_total_duration;
end;
$$;

grant execute on function public.modify_queue_entry(uuid, uuid[], uuid) to authenticated;
