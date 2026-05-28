-- skipQ — Migration 0020: admin allowlist + broad SELECT/WRITE policies
--
-- Anyone whose auth.users.email is in the hardcoded allowlist (set in
-- is_admin()) gets read-everything plus the ability to onboard salons +
-- partners and toggle featured_until / status.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select lower(au.email) = any(array['jazilsameer@gmail.com'])
      from auth.users au where au.id = auth.uid()
    ),
    false
  );
$$;

grant execute on function public.is_admin() to authenticated;

create policy "admin_read_salons"          on public.salons          for select using (public.is_admin());
create policy "admin_read_partner_users"   on public.partner_users   for select using (public.is_admin());
create policy "admin_read_queue_entries"   on public.queue_entries   for select using (public.is_admin());
create policy "admin_read_customers"       on public.customers_salons for select using (public.is_admin());
create policy "admin_read_invoices"        on public.invoices         for select using (public.is_admin());
create policy "admin_read_payments"        on public.payments         for select using (public.is_admin());

create policy "admin_write_salons"         on public.salons         for all using (public.is_admin()) with check (public.is_admin());
create policy "admin_write_partner_users"  on public.partner_users  for all using (public.is_admin()) with check (public.is_admin());
