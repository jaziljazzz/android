-- skipQ — Migration 0007: enable Supabase Realtime on queue_entries
--
-- Without this, postgres_changes subscriptions get no events. The
-- "supabase_realtime" publication is the wire from WAL → Realtime
-- broadcasts. Adding the table here means both the partner dashboard
-- and the customer Bookings tab can subscribe to live updates.

alter publication supabase_realtime add table public.queue_entries;
