-- Group collections: user-curated lists of restaurants, shareable via token.
--
-- Patterns:
-- - owner-only writes (RLS)
-- - public read when is_public OR via share_token (handled in server actions, not in RLS for token)
-- - share_token unique random short string
-- - collection_items composite uniqueness so adding the same place twice is a no-op

create extension if not exists pgcrypto;

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  description text check (description is null or char_length(description) <= 280),
  cover_image text,
  is_public boolean not null default false,
  share_token text unique,
  item_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists collections_owner_idx
  on public.collections (owner_id, updated_at desc);

create index if not exists collections_public_idx
  on public.collections (is_public, updated_at desc)
  where is_public = true;

create index if not exists collections_share_token_idx
  on public.collections (share_token)
  where share_token is not null;

create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  added_by uuid not null references auth.users(id) on delete cascade,
  note text check (note is null or char_length(note) <= 280),
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  primary key (collection_id, restaurant_id)
);

create index if not exists collection_items_collection_idx
  on public.collection_items (collection_id, order_index);

-- Keep item_count fresh
create or replace function public.collection_item_count_sync() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.collections
      set item_count = item_count + 1, updated_at = now()
      where id = new.collection_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.collections
      set item_count = greatest(item_count - 1, 0), updated_at = now()
      where id = old.collection_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists collection_items_count_sync on public.collection_items;
create trigger collection_items_count_sync
  after insert or delete on public.collection_items
  for each row execute function public.collection_item_count_sync();

-- RLS
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

drop policy if exists "collections_owner_all" on public.collections;
create policy "collections_owner_all"
  on public.collections for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "collections_public_read" on public.collections;
create policy "collections_public_read"
  on public.collections for select
  using (is_public = true);

drop policy if exists "collection_items_owner_all" on public.collection_items;
create policy "collection_items_owner_all"
  on public.collection_items for all
  using (
    exists (select 1 from public.collections c
            where c.id = collection_id and c.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.collections c
            where c.id = collection_id and c.owner_id = auth.uid())
    and added_by = auth.uid()
  );

drop policy if exists "collection_items_public_read" on public.collection_items;
create policy "collection_items_public_read"
  on public.collection_items for select
  using (
    exists (select 1 from public.collections c
            where c.id = collection_id and c.is_public = true)
  );

grant select on public.collections, public.collection_items to authenticated, anon;
grant all on public.collections, public.collection_items to service_role;
