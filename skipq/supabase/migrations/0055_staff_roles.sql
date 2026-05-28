-- skipQ — Migration 0055: staff invitation + per-stylist analytics
--
-- 1) invite_partner_staff() lets the salon OWNER add a partner_users
--    row in advance (auth_user_id null). When the person signs up with
--    the same email the existing link_partner_user() RPC claims it.
-- 2) revoke_partner_staff() removes a partner_users row (owner only,
--    excluding self).
-- 3) my_stylist_analytics() returns the calling stylist's own KPIs
--    over the past N days. Used by /dashboard/my-analytics.

create or replace function public.invite_partner_staff(
  p_email text,
  p_name text,
  p_role text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_salon uuid;
  v_owner_role text;
  v_pu_id uuid;
  v_email text := lower(trim(p_email));
begin
  if auth.uid() is null then
    raise exception 'invite_partner_staff: not authenticated' using errcode = '42501';
  end if;
  if v_email = '' or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invite_partner_staff: enter a valid email' using errcode = '22023';
  end if;
  if p_role not in ('owner', 'receptionist', 'stylist') then
    raise exception 'invite_partner_staff: role must be owner / receptionist / stylist' using errcode = '22023';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'invite_partner_staff: enter a name' using errcode = '22023';
  end if;

  select salon_id, role into v_owner_salon, v_owner_role
    from public.partner_users
    where auth_user_id = auth.uid();
  if v_owner_salon is null or v_owner_role <> 'owner' then
    raise exception 'invite_partner_staff: salon owner only' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.partner_users
    where salon_id = v_owner_salon and lower(email) = v_email
  ) then
    raise exception 'invite_partner_staff: email already on this salon' using errcode = '23505';
  end if;

  insert into public.partner_users (salon_id, name, role, email, phone)
  values (v_owner_salon, trim(p_name), p_role, v_email, '+91' || (10000000 + floor(random() * 90000000))::text)
  returning id into v_pu_id;

  -- If a public.users row already exists for this email, link it via
  -- a stub stylist row so the dashboard treats them as connected.
  if p_role = 'stylist' then
    insert into public.stylists (salon_id, partner_user_id, name, role, status, gender_serves)
    values (v_owner_salon, v_pu_id, trim(p_name), 'Junior', 'available', array['all']);
  end if;

  return v_pu_id;
end;
$$;

grant execute on function public.invite_partner_staff(text, text, text) to authenticated;

create or replace function public.revoke_partner_staff(p_pu_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_salon uuid;
  v_owner_role text;
  v_target_salon uuid;
  v_target_auth uuid;
begin
  if auth.uid() is null then
    raise exception 'revoke_partner_staff: not authenticated' using errcode = '42501';
  end if;
  select salon_id, role into v_owner_salon, v_owner_role
    from public.partner_users where auth_user_id = auth.uid();
  if v_owner_role <> 'owner' then
    raise exception 'revoke_partner_staff: owner only' using errcode = '42501';
  end if;
  select salon_id, auth_user_id into v_target_salon, v_target_auth
    from public.partner_users where id = p_pu_id;
  if v_target_salon <> v_owner_salon then
    raise exception 'revoke_partner_staff: not your team member' using errcode = '42501';
  end if;
  if v_target_auth = auth.uid() then
    raise exception 'revoke_partner_staff: cannot remove yourself' using errcode = '22023';
  end if;
  delete from public.partner_users where id = p_pu_id;
  return true;
end;
$$;

grant execute on function public.revoke_partner_staff(uuid) to authenticated;

create or replace function public.team_for_owner()
returns table (
  id uuid,
  name text,
  email text,
  role text,
  linked boolean,
  last_login_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pu.id, pu.name, pu.email, pu.role,
    (pu.auth_user_id is not null) as linked,
    pu.last_login_at
  from public.partner_users pu
  where pu.salon_id = public.current_partner_salon_id()
  order by case pu.role
    when 'owner' then 1
    when 'receptionist' then 2
    when 'stylist' then 3 else 4 end,
    pu.name;
$$;

grant execute on function public.team_for_owner() to authenticated;

create or replace function public.my_stylist_analytics(p_days int default 30)
returns table (
  services_completed int,
  avg_minutes int,
  rating numeric,
  total_revenue numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select s.id, s.salon_id
    from public.stylists s
    join public.partner_users pu on pu.id = s.partner_user_id
    where pu.auth_user_id = auth.uid()
    limit 1
  ),
  bookings as (
    select qe.id, qe.total_price, qe.started_at, qe.completed_at
    from public.queue_entries qe, me
    where qe.stylist_id = me.id
      and qe.status = 'completed'
      and qe.completed_at >= now() - (p_days || ' days')::interval
  )
  select
    count(*)::int as services_completed,
    coalesce(round(avg(extract(epoch from (completed_at - started_at)) / 60.0))::int, 0) as avg_minutes,
    (select rating from public.stylists where id = (select id from me))::numeric as rating,
    coalesce(sum(total_price), 0)::numeric as total_revenue
  from bookings;
$$;

grant execute on function public.my_stylist_analytics(int) to authenticated;

create or replace function public.my_stylist_profile()
returns table (
  id uuid,
  name text,
  role text,
  specialty text,
  photo text,
  rating numeric,
  total_services int
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name, s.role, s.specialty, s.photo, s.rating, s.total_services
  from public.stylists s
  join public.partner_users pu on pu.id = s.partner_user_id
  where pu.auth_user_id = auth.uid()
  limit 1;
$$;

grant execute on function public.my_stylist_profile() to authenticated;

-- RLS so a stylist can update their own stylists row (name + photo + specialty only)
create or replace function public.update_my_stylist_profile(
  p_name text,
  p_specialty text,
  p_photo text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stylist_id uuid;
begin
  if auth.uid() is null then
    raise exception 'update_my_stylist_profile: not authenticated' using errcode = '42501';
  end if;
  select s.id into v_stylist_id
    from public.stylists s
    join public.partner_users pu on pu.id = s.partner_user_id
    where pu.auth_user_id = auth.uid()
    limit 1;
  if v_stylist_id is null then
    raise exception 'update_my_stylist_profile: no stylist row for caller' using errcode = '42501';
  end if;
  update public.stylists
    set name = coalesce(nullif(trim(p_name), ''), name),
        specialty = nullif(trim(coalesce(p_specialty, '')), ''),
        photo = nullif(trim(coalesce(p_photo, '')), '')
    where id = v_stylist_id;
  return true;
end;
$$;

grant execute on function public.update_my_stylist_profile(text, text, text) to authenticated;
