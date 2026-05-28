-- skipQ — Migration 0045: brand partnership marketplace (V4)
--
-- A brand (Gillette, Park Avenue, etc.) buys a sponsored banner that
-- shows above the customer home salon list. Active row(s) are scoped
-- by audience (everyone / plus_users / new_users) and a date window.
-- One active banner is rotated client-side.

create table if not exists public.brand_partnerships (
  id           uuid primary key default uuid_generate_v4(),
  brand_name   text not null,
  perk_text    text not null,
  cta_url      text,
  logo_url     text,
  audience     text not null default 'everyone'
                 check (audience in ('everyone','plus_users','new_users')),
  start_at     timestamptz not null default now(),
  end_at       timestamptz not null,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists idx_partnerships_window
  on public.brand_partnerships (active, start_at, end_at);

alter table public.brand_partnerships enable row level security;

create policy "brand_partnerships_public_read" on public.brand_partnerships
  for select using (
    active = true and start_at <= now() and end_at > now()
  );

create policy "brand_partnerships_admin_write" on public.brand_partnerships
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.current_partnership_for_me()
returns table (
  id uuid,
  brand_name text,
  perk_text text,
  cta_url text,
  logo_url text
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select
      auth.uid() as uid,
      public.is_plus_user(auth.uid()) as is_plus,
      not exists (
        select 1 from public.queue_entries qe
        where qe.user_id = auth.uid() and qe.status = 'completed'
      ) as is_new
  )
  select p.id, p.brand_name, p.perk_text, p.cta_url, p.logo_url
  from public.brand_partnerships p, me
  where p.active = true
    and p.start_at <= now()
    and p.end_at > now()
    and (
      p.audience = 'everyone'
      or (p.audience = 'plus_users' and me.is_plus)
      or (p.audience = 'new_users' and me.is_new)
    )
  order by p.start_at desc
  limit 1;
$$;

grant execute on function public.current_partnership_for_me() to anon, authenticated;
