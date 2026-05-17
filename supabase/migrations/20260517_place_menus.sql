-- Shared place menu cache across users.
-- Keyed by normalized name + lat/lng bucket (~11m precision).
create table if not exists public.place_menus (
  id uuid primary key default gen_random_uuid(),
  name_normalized text not null,
  lat_bucket numeric(8, 4),  -- nullable: places without coords use null
  lng_bucket numeric(8, 4),
  display_name text not null,         -- canonical name as searched
  menu jsonb,                          -- { items, price_range, summary, source }
  fetch_status text not null default 'pending'
    check (fetch_status in ('pending', 'ok', 'not_found', 'error')),
  last_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique cache key (null-tolerant)
create unique index if not exists place_menus_key_idx
  on public.place_menus (name_normalized, coalesce(lat_bucket, 0), coalesce(lng_bucket, 0));

-- Public read; only service-role writes (RLS enabled, no permissive policies)
alter table public.place_menus enable row level security;

drop policy if exists "place_menus_public_read" on public.place_menus;
create policy "place_menus_public_read"
  on public.place_menus for select
  using (true);

grant select on public.place_menus to authenticated, anon;
