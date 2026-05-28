-- skipQ — Migration 0039: customer data export (spec §14)
--
-- Returns a single jsonb blob with everything tied to the caller:
-- profile, queue history, reviews, style records, referral state.
-- The customer mobile account screen surfaces it through the OS
-- Share sheet so users can save / email it to themselves.

create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_out jsonb;
begin
  if v_uid is null then
    raise exception 'export_my_data: not authenticated' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'exported_at', now(),
    'user', (
      select to_jsonb(u) - 'preferences'
      from public.users u where u.id = v_uid
    ),
    'bookings', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', qe.id,
        'salon_name', s.name,
        'status', qe.status,
        'joined_at', qe.joined_at,
        'completed_at', qe.completed_at,
        'total_price', qe.total_price,
        'services', (
          select coalesce(jsonb_agg(sv.name), '[]'::jsonb)
          from public.queue_entry_services qes
          join public.services sv on sv.id = qes.service_id
          where qes.queue_entry_id = qe.id
        )
      ) order by qe.joined_at desc), '[]'::jsonb)
      from public.queue_entries qe
      join public.salons s on s.id = qe.salon_id
      where qe.user_id = v_uid
    ),
    'reviews', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'salon_name', s.name,
        'rating', r.rating,
        'text', r.text,
        'created_at', r.created_at
      ) order by r.created_at desc), '[]'::jsonb)
      from public.reviews r
      join public.salons s on s.id = r.salon_id
      where r.user_id = v_uid
    ),
    'style_records', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'salon_name', s.name,
        'service_summary', sr.service_summary,
        'stylist_notes', sr.stylist_notes,
        'customer_notes', sr.customer_notes,
        'photos', sr.photos,
        'rating', sr.rating,
        'created_at', sr.created_at
      ) order by sr.created_at desc), '[]'::jsonb)
      from public.style_records sr
      left join public.salons s on s.id = sr.salon_id
      where sr.user_id = v_uid
    ),
    'favourites', (
      select coalesce(jsonb_agg(s.name), '[]'::jsonb)
      from public.favourites f
      join public.salons s on s.id = f.salon_id
      where f.user_id = v_uid
    ),
    'referral', (
      select jsonb_build_object(
        'my_code', u.referral_code,
        'referred_by_user', ru.referral_code,
        'referred_count', (select count(*)::int from public.users r where r.referred_by = v_uid)
      )
      from public.users u
      left join public.users ru on ru.id = u.referred_by
      where u.id = v_uid
    )
  ) into v_out;

  return v_out;
end;
$$;

grant execute on function public.export_my_data() to authenticated;
