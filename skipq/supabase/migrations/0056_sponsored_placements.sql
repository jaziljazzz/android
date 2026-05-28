-- skipQ — Migration 0056: sponsored placements ad-server
--
-- A small ad-server table that powers brand banners across the customer
-- app: hero carousel, video roadblock, and product-strip rows. Each
-- placement is targeted by slot, city, and optional segment, and tracks
-- impressions / clicks so we can report CPM-style revenue to brands.
--
-- The earlier brand_partnerships (0045) is single-banner only. This is
-- the proper Flipkart-style inventory layer.

create extension if not exists "uuid-ossp";

create table if not exists public.sponsored_placements (
  id                  uuid primary key default uuid_generate_v4(),
  brand_name          text not null,
  brand_logo_url      text,
  campaign_name       text not null,
  slot                text not null check (slot in (
                        'home_hero','home_video','home_strip','salon_detail')),
  copy_eyebrow        text,
  copy_title          text not null,
  copy_subtitle       text,
  media_url           text not null,
  media_poster_url    text,
  media_type          text not null default 'image'
                        check (media_type in ('image','video')),
  bg_color            text default '#0b1f3a',
  fg_color            text default '#ffffff',
  accent_color        text default '#ffd400',
  cta_label           text default 'Learn more',
  cta_url             text,
  target_city         text,
  target_segment      text not null default 'all'
                        check (target_segment in (
                          'all','beard','colour','mens','ladies','plus','new')),
  starts_at           timestamptz not null default now(),
  ends_at             timestamptz not null default (now() + interval '90 days'),
  cpm_rupees          numeric(10,2) not null default 0,
  daily_budget_rupees numeric(10,2),
  impressions         int not null default 0,
  clicks              int not null default 0,
  rank                int not null default 0,
  active              boolean not null default true,
  created_at          timestamptz not null default now()
);

create index if not exists idx_placements_slot_active
  on public.sponsored_placements (slot, active, starts_at, ends_at, rank desc);

alter table public.sponsored_placements enable row level security;

drop policy if exists "placements_public_read" on public.sponsored_placements;
create policy "placements_public_read" on public.sponsored_placements
  for select using (
    active = true and starts_at <= now() and ends_at > now()
  );

drop policy if exists "placements_admin_write" on public.sponsored_placements;
create policy "placements_admin_write" on public.sponsored_placements
  for all using (public.is_admin()) with check (public.is_admin());

-- ── read RPC ─────────────────────────────────────────────────────────
create or replace function public.placements_for_slot(
  p_slot text,
  p_city text default null,
  p_limit int default 6
)
returns table (
  id uuid,
  brand_name text,
  brand_logo_url text,
  campaign_name text,
  copy_eyebrow text,
  copy_title text,
  copy_subtitle text,
  media_url text,
  media_poster_url text,
  media_type text,
  bg_color text,
  fg_color text,
  accent_color text,
  cta_label text,
  cta_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id, p.brand_name, p.brand_logo_url, p.campaign_name,
    p.copy_eyebrow, p.copy_title, p.copy_subtitle,
    p.media_url, p.media_poster_url, p.media_type,
    p.bg_color, p.fg_color, p.accent_color,
    p.cta_label, p.cta_url
  from public.sponsored_placements p
  where p.slot = p_slot
    and p.active = true
    and p.starts_at <= now()
    and p.ends_at > now()
    and (
      p.target_city is null
      or p_city is null
      or lower(p.target_city) = lower(p_city)
    )
  order by p.rank desc, p.created_at desc
  limit greatest(1, least(p_limit, 20));
$$;

grant execute on function public.placements_for_slot(text, text, int)
  to anon, authenticated;

-- ── event tracking RPC ───────────────────────────────────────────────
create or replace function public.track_placement_event(
  p_id uuid,
  p_event text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event not in ('impression', 'click') then
    raise exception 'track_placement_event: event must be impression or click'
      using errcode = '22023';
  end if;
  if p_event = 'impression' then
    update public.sponsored_placements
      set impressions = impressions + 1
      where id = p_id;
  else
    update public.sponsored_placements
      set clicks = clicks + 1
      where id = p_id;
  end if;
end;
$$;

grant execute on function public.track_placement_event(uuid, text)
  to anon, authenticated;

-- ── seed Gillette campaigns ──────────────────────────────────────────
delete from public.sponsored_placements where brand_name like 'Gillette%'
   or brand_name like 'King C%';

insert into public.sponsored_placements
  (slot, brand_name, campaign_name, copy_eyebrow, copy_title, copy_subtitle,
   media_url, media_poster_url, media_type,
   bg_color, fg_color, accent_color, cta_label, cta_url,
   rank, cpm_rupees, ends_at)
values
  -- HERO carousel (3 banners auto-rotate)
  ('home_hero', 'Gillette', 'GilletteLabs Heated Razor',
   'GILLETTE LABS',
   'The world''s first heated razor',
   'Soothing warmth in every stroke. Try it at any featured salon.',
   'https://picsum.photos/seed/gillette-labs-heated/1400/700', null, 'image',
   '#0a2a6b', '#ffffff', '#ffd400',
   'Find a salon', '/c/home',
   100, 250, now() + interval '60 days'),

  ('home_hero', 'King C. Gillette', 'King C Beard Collection',
   'KING C. GILLETTE',
   'The complete beard kit',
   'Wash. Oil. Balm. Now used in 200+ premium salons across India.',
   'https://picsum.photos/seed/king-c-beard-care/1400/700', null, 'image',
   '#101010', '#ffffff', '#c8a45c',
   'Book a beard service', '/c/home',
   90, 220, now() + interval '60 days'),

  ('home_hero', 'Gillette Aftershave', 'Free Aftershave Week',
   'GILLETTE × SKIPQ',
   'Free aftershave on any beard service',
   'This week only — claim at checkout. Available at all partner salons.',
   'https://picsum.photos/seed/gillette-aftershave-splash/1400/700', null, 'image',
   '#b91c1c', '#ffffff', '#ffd400',
   'Claim offer', '/c/home',
   80, 180, now() + interval '14 days'),

  -- VIDEO roadblock (mid-page)
  ('home_video', 'Gillette', 'Closest Shave Film',
   'SPONSORED · GILLETTE',
   'The closest shave you''ve ever felt',
   'Watch how the new ProGlide works — then book a Gillette-partner salon.',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
   'https://picsum.photos/seed/gillette-video-poster/1400/800', 'video',
   '#0b1f3a', '#ffffff', '#ffd400',
   'Find your salon', '/c/home',
   70, 300, now() + interval '30 days'),

  -- STRIP product cards (horizontal scroll)
  ('home_strip', 'Gillette Fusion5', 'Fusion5 Trial', null,
   'Fusion5 ProGlide', '5 blades · Free at salon',
   'https://picsum.photos/seed/gillette-fusion5/600/600', null, 'image',
   '#0a2a6b', '#ffffff', '#ffd400',
   'Claim', '/c/home',
   60, 60, now() + interval '90 days'),

  ('home_strip', 'Gillette Mach3', 'Mach3 Trial', null,
   'Mach3 Turbo', '3 blades · Free at salon',
   'https://picsum.photos/seed/gillette-mach3/600/600', null, 'image',
   '#b91c1c', '#ffffff', '#ffffff',
   'Claim', '/c/home',
   50, 60, now() + interval '90 days'),

  ('home_strip', 'King C. Gillette', 'Beard Oil Sample', null,
   'Beard Oil', '30 ml sample · Free',
   'https://picsum.photos/seed/king-c-beard-oil/600/600', null, 'image',
   '#1a1a1a', '#ffffff', '#c8a45c',
   'Claim', '/c/home',
   40, 50, now() + interval '90 days'),

  ('home_strip', 'Gillette Aftershave', 'Aftershave Splash', null,
   'After Shave', '50 ml · Free with beard service',
   'https://picsum.photos/seed/gillette-aftershave-card/600/600', null, 'image',
   '#0e7a47', '#ffffff', '#ffd400',
   'Claim', '/c/home',
   30, 50, now() + interval '90 days');
