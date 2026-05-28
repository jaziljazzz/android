-- skipQ — Migration 0021: Referral program (spec §9.2 V2)
--
-- Adds a short shareable code per user (8 chars, base32-ish). The existing
-- users.referred_by column captures who invited whom. apply_referral_code()
-- RPC sets referred_by on the calling user; my_referral_stats() returns
-- the account-screen widget data.

alter table public.users add column if not exists referral_code text unique;

create or replace function public.gen_referral_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out text := '';
  i int;
begin
  for i in 1..8 loop
    out := out || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return out;
end;
$$;

create or replace function public.ensure_referral_code_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_tries int := 0;
begin
  if new.referral_code is null then
    loop
      v_code := public.gen_referral_code();
      v_tries := v_tries + 1;
      exit when not exists (select 1 from public.users where referral_code = v_code) or v_tries > 5;
    end loop;
    new.referral_code := v_code;
  end if;
  return new;
end;
$$;

drop trigger if exists users_assign_referral_code on public.users;
create trigger users_assign_referral_code
  before insert on public.users
  for each row execute function public.ensure_referral_code_for_new_user();

-- Backfill existing rows one at a time so unique conflicts can retry
do $$
declare
  r record;
  v_code text;
  v_tries int;
begin
  for r in select id from public.users where referral_code is null loop
    v_tries := 0;
    loop
      v_code := public.gen_referral_code();
      v_tries := v_tries + 1;
      exit when not exists (select 1 from public.users where referral_code = v_code) or v_tries > 5;
    end loop;
    update public.users set referral_code = v_code where id = r.id;
  end loop;
end $$;

create or replace function public.apply_referral_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_referrer_id uuid;
begin
  if v_uid is null then raise exception 'apply_referral_code: not authenticated'; end if;
  if exists (select 1 from public.users where id = v_uid and referred_by is not null) then
    return false;
  end if;
  select id into v_referrer_id from public.users
    where upper(referral_code) = upper(trim(p_code)) and id <> v_uid;
  if v_referrer_id is null then raise exception 'apply_referral_code: invalid code'; end if;
  update public.users set referred_by = v_referrer_id where id = v_uid;
  return true;
end;
$$;

revoke execute on function public.apply_referral_code(text) from public;
grant execute on function public.apply_referral_code(text) to authenticated;

create or replace function public.my_referral_stats()
returns table(my_code text, referred_count int)
language sql
security definer
set search_path = public
as $$
  select
    (select referral_code from public.users where id = auth.uid()),
    (select count(*)::int from public.users where referred_by = auth.uid());
$$;

grant execute on function public.my_referral_stats() to authenticated;
