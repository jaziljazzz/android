-- skipQ — Migration 0035: 5-min heads-up push before customer's turn
--
-- Every two minutes a cron job sweeps for waiting queue entries whose
-- original ETA puts them within five minutes of the chair. Sends a
-- OneSignal push and logs to notifications_log so we never ping the
-- same entry twice.

create or replace function public.notify_imminent_queues()
returns int
language plpgsql
security definer
set search_path = public, net, vault
as $$
declare
  v_app_id text;
  v_api_key text;
  r record;
  v_payload jsonb;
  v_count int := 0;
begin
  begin
    select decrypted_secret into v_app_id
      from vault.decrypted_secrets where name = 'onesignal_app_id';
    select decrypted_secret into v_api_key
      from vault.decrypted_secrets where name = 'onesignal_api_key';
  exception when others then
    v_app_id := null;
    v_api_key := null;
  end;

  for r in
    select
      qe.id,
      qe.user_id,
      qe.salon_id,
      s.name as salon_name
    from public.queue_entries qe
    join public.salons s on s.id = qe.salon_id
    where qe.status = 'waiting'
      and qe.user_id is not null
      and qe.estimated_wait_min is not null
      and qe.joined_at + (qe.estimated_wait_min - 5) * interval '1 minute' <= now()
      and qe.joined_at + (qe.estimated_wait_min + 1) * interval '1 minute' >  now()
      and not exists (
        select 1 from public.notifications_log nl
        where nl.queue_entry_id = qe.id
          and nl.template = 'queue_heads_up'
      )
  loop
    if v_app_id is not null and v_api_key is not null then
      v_payload := jsonb_build_object(
        'app_id', v_app_id,
        'include_aliases', jsonb_build_object('external_id', jsonb_build_array(r.user_id::text)),
        'target_channel', 'push',
        'headings', jsonb_build_object('en', 'You''re up in ~5 min'),
        'contents', jsonb_build_object('en', 'Head toward ' || r.salon_name || ' now to catch your slot.'),
        'data', jsonb_build_object(
          'queue_entry_id', r.id::text,
          'salon_id', r.salon_id::text,
          'kind', 'heads_up'
        )
      );
      perform net.http_post(
        url := 'https://onesignal.com/api/v1/notifications',
        body := v_payload,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Key ' || v_api_key
        )
      );
    end if;

    insert into public.notifications_log (user_id, queue_entry_id, channel, content, template, delivered)
    values (
      r.user_id,
      r.id,
      'push',
      'Head toward ' || r.salon_name || ' now to catch your slot.',
      'queue_heads_up',
      v_app_id is not null
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke execute on function public.notify_imminent_queues() from public;

do $$
declare j_id bigint;
begin
  select jobid into j_id from cron.job where jobname = 'skipq_imminent_pings';
  if j_id is not null then perform cron.unschedule(j_id); end if;
end $$;

select cron.schedule(
  'skipq_imminent_pings',
  '*/2 * * * *',
  $$select public.notify_imminent_queues();$$
);
