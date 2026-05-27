-- skipQ — Migration 0002: Row Level Security
--
-- RLS principles from spec §14:
--   - Users can only read/update their own profile
--   - Partner users only see queue entries for their salon
--   - Stylists only see their own queue (not other stylists' customers)
--   - Public can read active salons; partner_users data is private
--
-- Auth model: Supabase Auth stores phone-OTP identities. We assume:
--   - public.users.id == auth.uid() for customer users
--   - public.partner_users has its own row whose id == auth.uid() once
--     the partner authenticates via phone OTP.
--
-- Helper: which salon does the calling partner belong to?

create or replace function public.current_partner_salon_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select salon_id from public.partner_users where id = auth.uid();
$$;

create or replace function public.current_partner_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.partner_users where id = auth.uid();
$$;

create or replace function public.current_stylist_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.stylists where partner_user_id = auth.uid();
$$;

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================
alter table public.users               enable row level security;
alter table public.salons              enable row level security;
alter table public.partner_users       enable row level security;
alter table public.stylists            enable row level security;
alter table public.services            enable row level security;
alter table public.queue_entries       enable row level security;
alter table public.queue_entry_services enable row level security;
alter table public.service_timings     enable row level security;
alter table public.customers_salons    enable row level security;
alter table public.style_records       enable row level security;
alter table public.invoices            enable row level security;
alter table public.payments            enable row level security;
alter table public.reviews             enable row level security;
alter table public.notifications_log   enable row level security;

-- ============================================================================
-- users — owner-only
-- ============================================================================
create policy "users_self_select" on public.users
  for select using (auth.uid() = id);

create policy "users_self_update" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Insert handled by signup trigger / edge function with service role.

-- ============================================================================
-- salons — public can read active; partners can update their own
-- ============================================================================
create policy "salons_public_read_active" on public.salons
  for select using (status = 'active');

create policy "salons_partner_read_own" on public.salons
  for select using (id = public.current_partner_salon_id());

create policy "salons_partner_update_own" on public.salons
  for update
  using (id = public.current_partner_salon_id()
         and public.current_partner_role() in ('owner'))
  with check (id = public.current_partner_salon_id());

-- ============================================================================
-- partner_users — only visible to their own salon's owners; self always
-- ============================================================================
create policy "partner_users_self_read" on public.partner_users
  for select using (id = auth.uid());

create policy "partner_users_owner_read" on public.partner_users
  for select using (
    salon_id = public.current_partner_salon_id()
    and public.current_partner_role() = 'owner'
  );

create policy "partner_users_owner_write" on public.partner_users
  for all
  using (salon_id = public.current_partner_salon_id()
         and public.current_partner_role() = 'owner')
  with check (salon_id = public.current_partner_salon_id());

-- ============================================================================
-- stylists — public reads for active salons; partners manage their own
-- ============================================================================
create policy "stylists_public_read" on public.stylists
  for select using (
    exists (select 1 from public.salons s where s.id = salon_id and s.status = 'active')
  );

create policy "stylists_partner_manage" on public.stylists
  for all
  using (salon_id = public.current_partner_salon_id())
  with check (salon_id = public.current_partner_salon_id());

-- ============================================================================
-- services — public reads for active salons; partners manage their own
-- ============================================================================
create policy "services_public_read" on public.services
  for select using (
    active and exists (
      select 1 from public.salons s where s.id = salon_id and s.status = 'active'
    )
  );

create policy "services_partner_manage" on public.services
  for all
  using (salon_id = public.current_partner_salon_id())
  with check (salon_id = public.current_partner_salon_id());

-- ============================================================================
-- queue_entries
--   - Customer reads/updates their own entries
--   - Partners see entries for their salon
--   - Stylists see only their own queue
-- ============================================================================
create policy "queue_entries_customer_read" on public.queue_entries
  for select using (user_id = auth.uid());

create policy "queue_entries_customer_cancel" on public.queue_entries
  for update
  using (user_id = auth.uid() and status in ('waiting', 'arrived'))
  with check (user_id = auth.uid());

create policy "queue_entries_partner_read" on public.queue_entries
  for select using (
    salon_id = public.current_partner_salon_id()
    and (
      public.current_partner_role() in ('owner', 'receptionist')
      or stylist_id = public.current_stylist_id()
    )
  );

create policy "queue_entries_partner_update" on public.queue_entries
  for update
  using (
    salon_id = public.current_partner_salon_id()
    and (
      public.current_partner_role() in ('owner', 'receptionist')
      or stylist_id = public.current_stylist_id()
    )
  )
  with check (salon_id = public.current_partner_salon_id());

create policy "queue_entries_partner_insert" on public.queue_entries
  for insert
  with check (
    salon_id = public.current_partner_salon_id()
    and public.current_partner_role() in ('owner', 'receptionist')
  );

-- ============================================================================
-- queue_entry_services — same access as parent queue entry
-- ============================================================================
create policy "queue_entry_services_read" on public.queue_entry_services
  for select using (
    exists (
      select 1 from public.queue_entries qe
      where qe.id = queue_entry_id
        and (qe.user_id = auth.uid()
             or (qe.salon_id = public.current_partner_salon_id()
                 and (public.current_partner_role() in ('owner', 'receptionist')
                      or qe.stylist_id = public.current_stylist_id())))
    )
  );

-- ============================================================================
-- service_timings — partners only, scoped to their salon
-- ============================================================================
create policy "service_timings_partner_read" on public.service_timings
  for select using (salon_id = public.current_partner_salon_id());

-- ============================================================================
-- customers_salons — salon-scoped; partners only
-- ============================================================================
create policy "customers_salons_partner_read" on public.customers_salons
  for select using (
    salon_id = public.current_partner_salon_id()
    and public.current_partner_role() in ('owner', 'receptionist')
  );

-- ============================================================================
-- style_records — owned by the customer; stylist who served can read
-- ============================================================================
create policy "style_records_owner_all" on public.style_records
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "style_records_stylist_read" on public.style_records
  for select using (stylist_id = public.current_stylist_id());

-- ============================================================================
-- invoices — salon owners only
-- ============================================================================
create policy "invoices_owner_read" on public.invoices
  for select using (
    salon_id = public.current_partner_salon_id()
    and public.current_partner_role() = 'owner'
  );

-- ============================================================================
-- payments — customer reads own; salon owner reads salon's
-- ============================================================================
create policy "payments_customer_read" on public.payments
  for select using (user_id = auth.uid());

create policy "payments_owner_read" on public.payments
  for select using (
    salon_id = public.current_partner_salon_id()
    and public.current_partner_role() = 'owner'
  );

-- ============================================================================
-- reviews — public read; customer writes own
-- ============================================================================
create policy "reviews_public_read" on public.reviews
  for select using (true);

create policy "reviews_owner_write" on public.reviews
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- notifications_log — customer reads own; partners read salon-scoped
-- ============================================================================
create policy "notifications_log_customer_read" on public.notifications_log
  for select using (user_id = auth.uid());

create policy "notifications_log_partner_read" on public.notifications_log
  for select using (
    exists (
      select 1 from public.queue_entries qe
      where qe.id = queue_entry_id
        and qe.salon_id = public.current_partner_salon_id()
    )
  );
