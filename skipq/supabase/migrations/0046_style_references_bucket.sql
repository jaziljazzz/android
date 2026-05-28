-- skipQ — Migration 0046: style reference photos (V4 stub for AI matching)
--
-- Customer uploads a "this is the haircut I want" photo. We store it
-- in a private bucket, give the stylist a signed URL when the queue
-- entry starts. Future ML embeddings can be computed off this same
-- bucket without changing the customer flow.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('style-references', 'style-references', false, 5242880,
          array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "style_refs_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'style-references'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "style_refs_owner_read" on storage.objects
  for select using (
    bucket_id = 'style-references'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "style_refs_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'style-references'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Returns the best-rated stylists near the customer, filtered by
-- specialty keyword. The customer can attach a reference photo + this
-- list to choose where to book. Future ML can rerank using embeddings.
create or replace function public.match_style_stylists(
  p_keyword text default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km int default 15,
  p_limit int default 12
)
returns table (
  stylist_id uuid,
  stylist_name text,
  role text,
  specialty text,
  photo text,
  rating numeric,
  salon_id uuid,
  salon_name text,
  area text,
  distance_km numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id as stylist_id,
    s.name as stylist_name,
    s.role,
    s.specialty,
    s.photo,
    s.rating,
    sa.id as salon_id,
    sa.name as salon_name,
    sa.area,
    case
      when p_lat is not null and p_lng is not null and sa.location is not null then
        round((ST_Distance(sa.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000)::numeric, 2)
      else null
    end as distance_km
  from public.stylists s
  join public.salons sa on sa.id = s.salon_id
  where sa.status = 'active'
    and s.status <> 'off'
    and (p_keyword is null or s.specialty ilike '%' || p_keyword || '%' or s.role ilike '%' || p_keyword || '%')
    and (
      p_lat is null or p_lng is null or sa.location is null
      or ST_DWithin(sa.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_km * 1000)
    )
  order by s.rating desc nulls last, s.total_services desc
  limit greatest(1, p_limit);
$$;

grant execute on function public.match_style_stylists(text, double precision, double precision, int, int)
  to anon, authenticated;
