-- skipQ — Migration 0004: bridge auth.users → partner_users
--
-- The spec models partner_users.id as an independent UUID (so a single
-- partner row can outlive an auth identity rotation), but RLS needs a
-- direct link to auth.uid(). We add auth_user_id and route every
-- helper function + policy through it. Phone remains the lookup key
-- used by `link_partner_user()` for first-time provisioning.

alter table public.partner_users
  add column auth_user_id uuid unique references auth.users(id) on delete set null;

create index idx_partner_users_auth_user_id
  on public.partner_users (auth_user_id)
  where auth_user_id is not null;

-- Rewire helper functions to match by auth_user_id.

create or replace function public.current_partner_salon_id()
returns uuid language sql stable security definer set search_path = public as $$
  select salon_id from public.partner_users where auth_user_id = auth.uid();
$$;

create or replace function public.current_partner_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.partner_users where auth_user_id = auth.uid();
$$;

create or replace function public.current_stylist_id()
returns uuid language sql stable security definer set search_path = public as $$
  select s.id
  from public.stylists s
  join public.partner_users p on p.id = s.partner_user_id
  where p.auth_user_id = auth.uid();
$$;

-- partner_users self-policy must now match auth_user_id, not id.
drop policy if exists "partner_users_self_read" on public.partner_users;
create policy "partner_users_self_read" on public.partner_users
  for select using (auth_user_id = auth.uid());

-- One-shot self-linkage: the calling user claims a partner_users row
-- whose phone matches their auth identity's phone. Returns the linked
-- row, or null if no match. Idempotent (safe to call twice).
create or replace function public.link_partner_user()
returns public.partner_users
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_phone text;
  pu public.partner_users;
begin
  if auth.uid() is null then
    raise exception 'link_partner_user: not authenticated';
  end if;

  select phone into caller_phone from auth.users where id = auth.uid();
  if caller_phone is null then
    raise exception 'link_partner_user: auth identity has no phone';
  end if;

  -- Normalise to E.164 with leading '+'.
  if left(caller_phone, 1) <> '+' then
    caller_phone := '+' || caller_phone;
  end if;

  update public.partner_users
     set auth_user_id = auth.uid(),
         last_login_at = now()
   where phone = caller_phone
     and (auth_user_id is null or auth_user_id = auth.uid())
   returning * into pu;

  return pu;
end;
$$;

-- Only signed-in users should be able to call this. Strip default PUBLIC.
revoke execute on function public.link_partner_user() from public;
grant execute on function public.link_partner_user() to authenticated;
