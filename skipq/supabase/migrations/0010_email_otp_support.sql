-- skipQ — Migration 0010: email OTP support
--
-- The spec calls for phone OTP, but that needs a paid SMS provider. For dev
-- and early-stage launches we let users sign in with email OTP (free,
-- built into Supabase). This migration:
--   1. Makes phone nullable on public.users and public.partner_users
--   2. Updates handle_new_auth_user to insert by email when phone is missing
--   3. Updates link_partner_user to look up by email if phone match fails
--
-- Phone OTP can be re-enabled at any time by configuring a phone provider
-- in Supabase Auth; both lookups still work.

-- 1. Relax NOT NULL on phone columns
alter table public.users         alter column phone drop not null;
alter table public.partner_users alter column phone drop not null;

-- 2. Unique index on lower(email) for partner_users so the linker can match
create unique index if not exists partner_users_email_lower
  on public.partner_users (lower(email))
  where email is not null;

-- 3. Replace the new-auth-user trigger to handle phone OR email
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_email text;
begin
  v_phone := nullif(new.phone, '');
  v_email := nullif(new.email, '');

  if v_phone is not null and left(v_phone, 1) <> '+' then
    v_phone := '+' || v_phone;
  end if;

  if v_phone is null and v_email is null then
    return new; -- nothing to mirror
  end if;

  -- Insert by auth.users.id so the mirror row matches RLS auth.uid()
  insert into public.users (id, phone, email)
  values (new.id, v_phone, v_email)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 4. Replace link_partner_user to try email first, then phone
create or replace function public.link_partner_user()
returns public.partner_users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_email text;
  v_user_phone text;
  pu public.partner_users;
begin
  if auth.uid() is null then
    raise exception 'link_partner_user: not authenticated';
  end if;

  select email, phone into v_user_email, v_user_phone
    from auth.users where id = auth.uid();

  if v_user_phone is not null and left(v_user_phone, 1) <> '+' then
    v_user_phone := '+' || v_user_phone;
  end if;

  -- Try email match first (case-insensitive)
  if v_user_email is not null then
    update public.partner_users
       set auth_user_id = auth.uid(),
           last_login_at = now()
     where lower(email) = lower(v_user_email)
       and (auth_user_id is null or auth_user_id = auth.uid())
     returning * into pu;
    if pu.id is not null then
      return pu;
    end if;
  end if;

  -- Fall back to phone match
  if v_user_phone is not null then
    update public.partner_users
       set auth_user_id = auth.uid(),
           last_login_at = now()
     where phone = v_user_phone
       and (auth_user_id is null or auth_user_id = auth.uid())
     returning * into pu;
    if pu.id is not null then
      return pu;
    end if;
  end if;

  return null;
end;
$$;

revoke execute on function public.link_partner_user() from public;
grant execute on function public.link_partner_user() to authenticated;
