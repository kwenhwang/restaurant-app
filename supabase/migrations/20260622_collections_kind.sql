-- Distinguish auto "wishlist" collection (찜) from user-curated 'custom' lists.
-- Each user has at most one wishlist row, enforced by a partial unique index.
-- Restaurants the user has heard about but not visited yet go into this
-- collection via /api/wish — no rating/photos/visits required.

alter table public.collections
  add column if not exists kind text not null default 'custom';

alter table public.collections
  drop constraint if exists collections_kind_check;

alter table public.collections
  add constraint collections_kind_check
  check (kind in ('custom', 'wishlist'));

-- One wishlist per user, no more.
create unique index if not exists collections_user_wishlist_idx
  on public.collections (owner_id)
  where kind = 'wishlist';
