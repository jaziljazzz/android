-- skipQ — Migration 0022: salon photo storage bucket
--
-- Public bucket so customer mobile + listing can render salon images
-- without signed URLs. Salons (any partner_user linked to the salon)
-- can write under `<salon_id>/...`.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('salon-photos', 'salon-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "salon_photos_partner_write" on storage.objects
  for insert with check (
    bucket_id = 'salon-photos'
    and exists (
      select 1 from public.partner_users pu
      where pu.auth_user_id = auth.uid()
        and pu.salon_id::text = (storage.foldername(name))[1]
    )
  );

create policy "salon_photos_partner_update" on storage.objects
  for update using (
    bucket_id = 'salon-photos'
    and exists (
      select 1 from public.partner_users pu
      where pu.auth_user_id = auth.uid()
        and pu.salon_id::text = (storage.foldername(name))[1]
    )
  );

create policy "salon_photos_partner_delete" on storage.objects
  for delete using (
    bucket_id = 'salon-photos'
    and exists (
      select 1 from public.partner_users pu
      where pu.auth_user_id = auth.uid()
        and pu.salon_id::text = (storage.foldername(name))[1]
    )
  );

create policy "salon_photos_public_read" on storage.objects
  for select using (bucket_id = 'salon-photos');
