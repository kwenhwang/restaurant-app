-- AI-summarized blog reviews per place. Shared across users.
-- Key + grants follow the place_menus pattern.

create table if not exists public.place_reviews (
  id uuid primary key default gen_random_uuid(),
  name_normalized text not null,
  lat_bucket numeric(8, 4),
  lng_bucket numeric(8, 4),
  display_name text not null,
  reviews jsonb,                       -- { summary, highlights: [], pros: [], cons: [], sources: [{url, title}] }
  fetch_status text not null default 'pending'
    check (fetch_status in ('pending', 'ok', 'not_found', 'error')),
  last_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.place_reviews
  drop constraint if exists place_reviews_key_unique;

alter table public.place_reviews
  add constraint place_reviews_key_unique
  unique nulls not distinct (name_normalized, lat_bucket, lng_bucket);

alter table public.place_reviews enable row level security;

drop policy if exists "place_reviews_public_read" on public.place_reviews;
create policy "place_reviews_public_read"
  on public.place_reviews for select
  using (true);

grant select on public.place_reviews to authenticated, anon;
grant all on public.place_reviews to service_role;

-- Cache pointer on restaurants for direct access
alter table public.restaurants
  add column if not exists reviews jsonb;
