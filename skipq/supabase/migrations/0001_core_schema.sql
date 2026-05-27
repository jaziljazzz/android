-- skipQ — Migration 0001: Core schema
-- Tables, indexes, and enum-equivalent CHECK constraints from spec §11.
-- RLS policies are applied in a separate migration so this file stays
-- focused on shape and can be reasoned about independently.

-- Extensions ----------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- Helper: updated_at trigger ------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- users (customers)
-- ============================================================================
create table public.users (
  id              uuid primary key default uuid_generate_v4(),
  phone           text unique not null,
  name            text,
  email           text,
  profile_photo   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_active_at  timestamptz,
  device_token    text,
  referred_by     uuid references public.users(id),
  total_visits    int not null default 0,
  total_spend     numeric(10,2) not null default 0,
  preferences     jsonb not null default '{}'::jsonb
);

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- ============================================================================
-- salons
-- ============================================================================
create table public.salons (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  tagline         text,
  type            text check (type in ('mens', 'ladies', 'unisex')),
  address         text not null,
  area            text,
  city            text not null,
  state           text not null,
  location        geography(point, 4326),
  phone           text,
  email           text,
  cover_image     text,
  photos          text[] not null default '{}',
  hours           jsonb not null default '{}'::jsonb,
  status          text not null default 'pending'
                    check (status in ('pending', 'active', 'suspended')),
  joined_at       timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  owner_user_id   uuid,            -- forward ref; FK added after partner_users
  upi_id          text,
  gst_number      text,
  commission_rate numeric(4,2) not null default 0,
  featured_until  timestamptz,
  rating          numeric(2,1) not null default 0,
  review_count    int not null default 0
);

create trigger salons_set_updated_at
before update on public.salons
for each row execute function public.set_updated_at();

-- ============================================================================
-- partner_users (salon owners, receptionists, stylists)
-- ============================================================================
create table public.partner_users (
  id              uuid primary key default uuid_generate_v4(),
  salon_id        uuid not null references public.salons(id) on delete cascade,
  phone           text unique not null,
  name            text not null,
  role            text not null
                    check (role in ('owner', 'receptionist', 'stylist')),
  email           text,
  password_hash   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_login_at   timestamptz
);

create trigger partner_users_set_updated_at
before update on public.partner_users
for each row execute function public.set_updated_at();

-- Close the salons.owner_user_id forward reference.
alter table public.salons
  add constraint salons_owner_user_id_fkey
  foreign key (owner_user_id) references public.partner_users(id);

-- ============================================================================
-- stylists
-- ============================================================================
create table public.stylists (
  id               uuid primary key default uuid_generate_v4(),
  salon_id         uuid not null references public.salons(id) on delete cascade,
  partner_user_id  uuid references public.partner_users(id),
  name             text not null,
  role             text,
  specialty        text,
  photo            text,
  status           text not null default 'available'
                     check (status in ('available', 'busy', 'break', 'off')),
  gender_serves    text[] not null default '{all}',
  rating           numeric(2,1) not null default 0,
  total_services   int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger stylists_set_updated_at
before update on public.stylists
for each row execute function public.set_updated_at();

-- ============================================================================
-- services (per salon)
-- ============================================================================
create table public.services (
  id               uuid primary key default uuid_generate_v4(),
  salon_id         uuid not null references public.salons(id) on delete cascade,
  name             text not null,
  category         text check (category in ('hair', 'beard', 'colour', 'facial')),
  price            numeric(10,2) not null,
  default_duration int not null,
  gender           text check (gender in ('male', 'female', 'all')),
  active           boolean not null default true,
  display_order    int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

-- ============================================================================
-- queue_entries
-- ============================================================================
create table public.queue_entries (
  id                    uuid primary key default uuid_generate_v4(),
  salon_id              uuid not null references public.salons(id) on delete cascade,
  user_id               uuid references public.users(id),
  guest_phone           text,
  guest_name            text,
  stylist_id            uuid references public.stylists(id),
  preferred_stylist_id  uuid references public.stylists(id),
  position              int not null,
  status                text not null
                          check (status in ('waiting', 'arrived', 'serving',
                                            'completed', 'no_show', 'cancelled')),
  joined_at             timestamptz not null default now(),
  arrived_at            timestamptz,
  started_at            timestamptz,
  completed_at          timestamptz,
  cancelled_at          timestamptz,
  estimated_wait_min    int,
  actual_wait_min       int,
  is_new_customer       boolean,
  source                text not null
                          check (source in ('app', 'whatsapp', 'walk_in_manual')),
  total_price           numeric(10,2),
  notes                 text,
  updated_at            timestamptz not null default now(),
  constraint queue_entries_has_identity check (user_id is not null or guest_phone is not null)
);

create trigger queue_entries_set_updated_at
before update on public.queue_entries
for each row execute function public.set_updated_at();

-- ============================================================================
-- queue_entry_services
-- ============================================================================
create table public.queue_entry_services (
  id                uuid primary key default uuid_generate_v4(),
  queue_entry_id    uuid not null references public.queue_entries(id) on delete cascade,
  service_id        uuid not null references public.services(id),
  price_at_time     numeric(10,2) not null,
  duration_at_time  int not null
);

-- ============================================================================
-- service_timings (the algorithm's learning data)
-- ============================================================================
create table public.service_timings (
  id                     uuid primary key default uuid_generate_v4(),
  salon_id               uuid not null references public.salons(id) on delete cascade,
  stylist_id             uuid not null references public.stylists(id) on delete cascade,
  queue_entry_id         uuid references public.queue_entries(id) on delete set null,
  service_signature      text not null,
  total_duration_seconds int not null check (total_duration_seconds > 0),
  recorded_at            timestamptz not null default now(),
  day_of_week            int check (day_of_week between 0 and 6),
  hour_of_day            int check (hour_of_day between 0 and 23)
);

-- ============================================================================
-- customers_salons (defines "new" vs "existing" per salon)
-- ============================================================================
create table public.customers_salons (
  id                          uuid primary key default uuid_generate_v4(),
  salon_id                    uuid not null references public.salons(id) on delete cascade,
  user_id                     uuid references public.users(id) on delete set null,
  phone                       text not null,
  first_visit_at              timestamptz not null,
  last_visit_at               timestamptz,
  total_visits                int not null default 1,
  total_spend                 numeric(10,2) not null default 0,
  acquired_via                text check (acquired_via in ('skipq', 'walk_in', 'salon_existing')),
  attribution_window_ends_at  timestamptz,
  unique (salon_id, phone)
);

-- ============================================================================
-- style_records
-- ============================================================================
create table public.style_records (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  queue_entry_id  uuid not null references public.queue_entries(id) on delete cascade,
  salon_id        uuid references public.salons(id),
  stylist_id      uuid references public.stylists(id),
  service_summary text,
  stylist_notes   text,
  customer_notes  text,
  photos          text[] not null default '{}',
  rating          int check (rating between 1 and 5),
  created_at      timestamptz not null default now()
);

-- ============================================================================
-- invoices
-- ============================================================================
create table public.invoices (
  id                   uuid primary key default uuid_generate_v4(),
  salon_id             uuid not null references public.salons(id) on delete cascade,
  period_start         date not null,
  period_end           date not null,
  new_customer_count   int not null default 0,
  lead_fee_amount      numeric(10,2) not null default 0,
  commission_amount    numeric(10,2) not null default 0,
  ad_amount            numeric(10,2) not null default 0,
  total_amount         numeric(10,2) not null,
  status               text not null default 'pending'
                         check (status in ('pending', 'paid', 'disputed', 'overdue')),
  issued_at            timestamptz not null default now(),
  due_at               timestamptz,
  paid_at              timestamptz,
  razorpay_link        text,
  razorpay_payment_id  text,
  constraint invoices_period_valid check (period_end >= period_start)
);

-- ============================================================================
-- payments (customer payments via app)
-- ============================================================================
create table public.payments (
  id                   uuid primary key default uuid_generate_v4(),
  queue_entry_id       uuid references public.queue_entries(id) on delete set null,
  user_id              uuid references public.users(id),
  salon_id             uuid not null references public.salons(id) on delete cascade,
  amount               numeric(10,2) not null check (amount > 0),
  commission           numeric(10,2),
  salon_payout         numeric(10,2),
  razorpay_order_id    text,
  razorpay_payment_id  text,
  status               text not null default 'pending'
                         check (status in ('pending', 'paid', 'refunded')),
  created_at           timestamptz not null default now(),
  paid_at              timestamptz,
  settled_at           timestamptz
);

-- ============================================================================
-- reviews
-- ============================================================================
create table public.reviews (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.users(id) on delete set null,
  salon_id        uuid not null references public.salons(id) on delete cascade,
  stylist_id      uuid references public.stylists(id) on delete set null,
  queue_entry_id  uuid references public.queue_entries(id) on delete set null,
  rating          int not null check (rating between 1 and 5),
  text            text,
  created_at      timestamptz not null default now()
);

-- ============================================================================
-- notifications_log
-- ============================================================================
create table public.notifications_log (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.users(id) on delete set null,
  queue_entry_id  uuid references public.queue_entries(id) on delete set null,
  channel         text not null check (channel in ('whatsapp', 'sms', 'push')),
  template        text,
  content         text,
  sent_at         timestamptz not null default now(),
  delivered       boolean,
  read            boolean
);

-- ============================================================================
-- Indexes (essential for performance — see spec §11)
-- ============================================================================
create index idx_salons_location on public.salons using gist (location);
create index idx_salons_status on public.salons (status) where status = 'active';
create index idx_salons_city_area on public.salons (city, area);

create index idx_partner_users_salon on public.partner_users (salon_id);
create index idx_stylists_salon on public.stylists (salon_id);
create index idx_services_salon on public.services (salon_id) where active;

create index idx_queue_entries_salon_status on public.queue_entries (salon_id, status);
create index idx_queue_entries_user on public.queue_entries (user_id) where user_id is not null;
create index idx_queue_entries_stylist_active
  on public.queue_entries (stylist_id, position)
  where status in ('waiting', 'arrived', 'serving');

create index idx_queue_entry_services_entry on public.queue_entry_services (queue_entry_id);

create index idx_service_timings_stylist_service
  on public.service_timings (stylist_id, service_signature, recorded_at desc);

create index idx_customers_salons_phone on public.customers_salons (salon_id, phone);
create index idx_customers_salons_user on public.customers_salons (user_id) where user_id is not null;

create index idx_invoices_salon_status on public.invoices (salon_id, status);
create index idx_payments_salon_status on public.payments (salon_id, status);
create index idx_reviews_salon on public.reviews (salon_id);
create index idx_notifications_log_user on public.notifications_log (user_id) where user_id is not null;
