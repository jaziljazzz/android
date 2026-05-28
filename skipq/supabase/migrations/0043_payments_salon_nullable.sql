-- skipQ — Migration 0043: allow salon_id NULL on payments for Plus
--
-- Plus subscription payments aren't tied to a salon — they're paid to
-- SkipQ. Relax the constraint so the existing payments table can hold
-- consumer subscription rows alongside queue + featured + pro rows.

alter table public.payments
  alter column salon_id drop not null;
