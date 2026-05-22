-- 20260522_tags_place_visits.sql
-- v2 UX improvements: tags, place info cache, business hours.

-- ──────────────────────────────────────────────────────────────
-- 1. restaurants table — Kakao Place info + business hours.
--    business_hours is user-editable jsonb (no public Kakao endpoint
--    for hours, so we cache phone + place_url from keyword search
--    and let users fill hours manually or via future scrape worker).
-- ──────────────────────────────────────────────────────────────
alter table public.restaurants
  add column if not exists phone           text,
  add column if not exists place_url       text,
  add column if not exists kakao_place_id  text,
  add column if not exists business_hours  jsonb,
  add column if not exists place_synced_at timestamptz;

-- ──────────────────────────────────────────────────────────────
-- 2. restaurant_tags — multi-select mood tags per restaurant.
--    Free-text but de-duped per restaurant via composite PK.
-- ──────────────────────────────────────────────────────────────
create table if not exists public.restaurant_tags (
  restaurant_id uuid not null
    references public.restaurants(id) on delete cascade,
  tag           text not null,
  created_at    timestamptz not null default now(),
  primary key (restaurant_id, tag)
);

-- Cross-restaurant tag aggregation (e.g. "show all #혼술")
create index if not exists restaurant_tags_tag_idx
  on public.restaurant_tags (tag);

-- Per-restaurant lookup (rare, but supports cascade efficiently)
create index if not exists restaurant_tags_restaurant_idx
  on public.restaurant_tags (restaurant_id);

-- RLS — inherit ownership from restaurants row
alter table public.restaurant_tags enable row level security;

drop policy if exists restaurant_tags_own on public.restaurant_tags;
create policy restaurant_tags_own on public.restaurant_tags
  for all using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 3. Visit aggregation index — speed up the home page rollup query
--    (count visits per restaurant for the current user).
-- ──────────────────────────────────────────────────────────────
create index if not exists visits_user_restaurant_visited_at_idx
  on public.visits (user_id, restaurant_id, visited_at desc);
