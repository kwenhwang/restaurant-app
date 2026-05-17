-- Favorites: per-restaurant boolean owned by the row's user.
alter table public.restaurants
  add column if not exists is_favorite boolean not null default false;

-- Partial index for the favorites filter (only stores true rows)
create index if not exists restaurants_user_favorites_idx
  on public.restaurants (user_id, created_at desc)
  where is_favorite = true;
