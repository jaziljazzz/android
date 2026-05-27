-- skipQ — seed data for local development.
-- Populates a single test salon in Edapally, Kochi with stylists, services,
-- and a couple of in-progress queue entries.

insert into public.salons (id, name, tagline, type, address, area, city, state, location, status, hours)
values (
  '00000000-0000-0000-0000-000000000001',
  'Studio Lumière',
  'Premium Unisex Salon',
  'unisex',
  '1st Floor, Lulu Mall, Edapally',
  'Edapally',
  'Kochi',
  'Kerala',
  st_setsrid(st_makepoint(76.3076, 10.0270), 4326)::geography,
  'active',
  '{"mon":{"open":"09:00","close":"21:00"},"tue":{"open":"09:00","close":"21:00"},"wed":{"open":"09:00","close":"21:00"},"thu":{"open":"09:00","close":"21:00"},"fri":{"open":"09:00","close":"21:00"},"sat":{"open":"09:00","close":"22:00"},"sun":{"open":"10:00","close":"20:00"}}'::jsonb
);

insert into public.stylists (id, salon_id, name, role, specialty, gender_serves)
values
  ('00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000001',
   'Arjun M', 'Senior', 'Men''s cuts', array['male']),
  ('00000000-0000-0000-0000-000000000102',
   '00000000-0000-0000-0000-000000000001',
   'Priya K', 'Master', 'Hair colour', array['female', 'all']);

insert into public.services (id, salon_id, name, category, price, default_duration, gender)
values
  ('00000000-0000-0000-0000-000000000201',
   '00000000-0000-0000-0000-000000000001',
   'Haircut', 'hair', 350, 30, 'all'),
  ('00000000-0000-0000-0000-000000000202',
   '00000000-0000-0000-0000-000000000001',
   'Beard trim', 'beard', 150, 15, 'male'),
  ('00000000-0000-0000-0000-000000000203',
   '00000000-0000-0000-0000-000000000001',
   'Hair colour', 'colour', 1500, 90, 'all');
