-- skipQ — Migration 0051: my_last_visit() one-tap rebook
--
-- For a returning customer, surface the services + stylist from their
-- most recent completed visit at this salon so they can re-book in
-- one tap. Caller-only via RLS-safe joins on user_id = auth.uid().

create or replace function public.my_last_visit(p_salon_id uuid)
returns table (
  service_ids uuid[],
  stylist_id uuid,
  completed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with last_entry as (
    select id, stylist_id, completed_at
    from public.queue_entries
    where user_id = auth.uid()
      and salon_id = p_salon_id
      and status = 'completed'
    order by completed_at desc nulls last
    limit 1
  )
  select
    coalesce((
      select array_agg(qes.service_id order by qes.service_id)
      from public.queue_entry_services qes
      where qes.queue_entry_id = (select id from last_entry)
    ), array[]::uuid[]) as service_ids,
    (select stylist_id from last_entry) as stylist_id,
    (select completed_at from last_entry) as completed_at
  where exists (select 1 from last_entry);
$$;

grant execute on function public.my_last_visit(uuid) to authenticated;
