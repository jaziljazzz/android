-- skipQ — Migration 0015: saved favourites table + style-record / avatar storage
--
-- Adds:
--   - public.favourites (user_id, salon_id) for the heart icon on the home list
--   - storage buckets: 'style-records' (photos customers upload after a service)
--   - RLS for favourites: customers manage their own rows
--   - Storage policies: customer can read/write into a folder named by their auth.uid()

create table public.favourites (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  salon_id    uuid not null references public.salons(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, salon_id)
);

create index idx_favourites_user on public.favourites (user_id);

alter table public.favourites enable row level security;

create policy "favourites_self_all" on public.favourites
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage bucket for style record photos (private; signed URLs for read)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'style-records',
  'style-records',
  false,
  10485760, -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Storage policies: customer can upload + read inside a folder named auth.uid()
-- Path convention: {user_id}/{queue_entry_id}/{filename}
create policy "style_records_owner_read" on storage.objects
  for select using (
    bucket_id = 'style-records'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "style_records_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'style-records'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "style_records_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'style-records'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- style_records RLS — customer writes own; stylist who served reads
-- ---------------------------------------------------------------------------
create policy "style_records_owner_insert" on public.style_records
  for insert
  with check (user_id = auth.uid());

create policy "style_records_owner_update" on public.style_records
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
