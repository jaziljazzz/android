-- skipQ — Migration 0041: chain (multi-branch) support
--
-- A salon chain is a group of sister salons under one owner. The owner
-- gets aggregate views across every branch without having to switch
-- accounts. salons.chain_id is the foreign key; chains are created by
-- the platform admin and salons opt in by being assigned a chain_id.

create table if not exists public.chains (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table public.salons
  add column if not exists chain_id uuid references public.chains(id) on delete set null;

create index if not exists idx_salons_chain on public.salons (chain_id) where chain_id is not null;

alter table public.chains enable row level security;

create policy "chains_owner_read" on public.chains
  for select using (owner_user_id = auth.uid() or public.is_admin());

create policy "chains_admin_write" on public.chains
  for all using (public.is_admin()) with check (public.is_admin());

-- Returns every salon id the caller can act on:
--   1. The salon their partner_users row points at (their home salon)
--   2. Every sibling salon in the same chain when the caller owns the chain
create or replace function public.my_chain_salon_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  with home as (
    select pu.salon_id, pu.role, s.chain_id, c.owner_user_id as chain_owner
    from public.partner_users pu
    left join public.salons s on s.id = pu.salon_id
    left join public.chains c on c.id = s.chain_id
    where pu.auth_user_id = auth.uid()
  ),
  ids as (
    select salon_id as id from home where salon_id is not null
    union
    select s.id
    from public.salons s, home
    where s.chain_id is not null
      and s.chain_id = home.chain_id
      and home.role = 'owner'
      and home.chain_owner = auth.uid()
  )
  select coalesce(array_agg(distinct id), array[]::uuid[]) from ids;
$$;

grant execute on function public.my_chain_salon_ids() to authenticated;

-- Aggregate snapshot the /dashboard/branches page renders.
create or replace function public.my_chain_branch_summary()
returns table (
  salon_id uuid,
  salon_name text,
  area text,
  active_now int,
  served_today int,
  revenue_today numeric,
  is_home boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with my_ids as (select unnest(public.my_chain_salon_ids()) as id),
       home as (select salon_id from public.partner_users where auth_user_id = auth.uid())
  select
    s.id as salon_id,
    s.name as salon_name,
    s.area,
    (select count(*)::int from public.queue_entries q
       where q.salon_id = s.id and q.status in ('waiting','arrived','serving')) as active_now,
    (select count(*)::int from public.queue_entries q
       where q.salon_id = s.id and q.status = 'completed'
         and q.joined_at >= date_trunc('day', now() at time zone 'Asia/Kolkata')) as served_today,
    coalesce((select sum(total_price) from public.queue_entries q
       where q.salon_id = s.id and q.status = 'completed'
         and q.joined_at >= date_trunc('day', now() at time zone 'Asia/Kolkata')), 0)::numeric as revenue_today,
    (s.id = (select salon_id from home)) as is_home
  from public.salons s
  join my_ids on my_ids.id = s.id
  order by is_home desc, s.name;
$$;

grant execute on function public.my_chain_branch_summary() to authenticated;
