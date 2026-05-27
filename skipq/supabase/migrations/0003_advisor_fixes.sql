-- skipQ — Migration 0003: Address Supabase advisor warnings
--
-- 1) set_updated_at had a mutable search_path; pin it.
-- 2) Helper functions used inside RLS policies were callable via
--    PostgREST RPC by the default PUBLIC grant. Strip that — the
--    planner inlines them during policy evaluation so policies still
--    work without explicit EXECUTE.

alter function public.set_updated_at() set search_path = public;

revoke execute on function public.current_partner_salon_id() from public;
revoke execute on function public.current_partner_role()     from public;
revoke execute on function public.current_stylist_id()       from public;
