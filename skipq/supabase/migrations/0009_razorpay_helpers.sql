-- skipQ — Migration 0009: Razorpay vault helper
--
-- Edge functions (create-payment-order, razorpay-webhook) read the
-- Razorpay key_id / key_secret / webhook_secret from Supabase Vault via
-- this RPC. service_role only.

create or replace function public.get_razorpay_creds()
returns jsonb
language sql
security definer
set search_path = public, vault
as $$
  select jsonb_build_object(
    'key_id',         (select decrypted_secret from vault.decrypted_secrets where name = 'razorpay_key_id'),
    'key_secret',     (select decrypted_secret from vault.decrypted_secrets where name = 'razorpay_key_secret'),
    'webhook_secret', (select decrypted_secret from vault.decrypted_secrets where name = 'razorpay_webhook_secret')
  );
$$;

revoke execute on function public.get_razorpay_creds() from public, anon, authenticated;
grant execute on function public.get_razorpay_creds() to service_role;

-- Placeholder webhook secret — replace with the real one shown in the
-- Razorpay dashboard once the webhook URL is configured.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'razorpay_webhook_secret') then
    perform vault.create_secret('PENDING_CONFIGURATION', 'razorpay_webhook_secret', 'Razorpay webhook signing secret');
  end if;
end $$;
