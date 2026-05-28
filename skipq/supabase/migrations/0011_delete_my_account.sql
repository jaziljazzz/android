-- skipQ — Migration 0011: customer-side account deletion
--
-- GDPR-style soft delete:
--   - Cancel any active queue entries so salons don't keep a phantom slot
--   - Anonymise the public.users mirror so historical queue records still
--     exist for the salon but personally identifiable data is wiped
--   - Remove the auth identity (signs the user out and prevents re-login)

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'delete_my_account: not authenticated';
  end if;

  update public.queue_entries
     set status = 'cancelled', cancelled_at = now()
   where user_id = v_uid
     and status in ('waiting', 'arrived');

  update public.users
     set name = null,
         email = null,
         phone = null,
         profile_photo = null,
         device_token = null,
         preferences = '{}'::jsonb
   where id = v_uid;

  delete from auth.users where id = v_uid;
end;
$$;

revoke execute on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
