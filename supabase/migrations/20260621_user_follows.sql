-- Friend follow graph. follower follows followee; reverse lookup is just
-- "who follows me." Reading the graph is auth.uid()-bound on either side.
--
-- Public collection activity feed reads from this graph + `collections`
-- WHERE is_public AND owner_id IN (my followees).

create table if not exists public.user_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists user_follows_followee_idx
  on public.user_follows (followee_id, created_at desc);

create index if not exists user_follows_follower_idx
  on public.user_follows (follower_id, created_at desc);

alter table public.user_follows enable row level security;

-- Either party can see the edge.
drop policy if exists "user_follows_either_select" on public.user_follows;
create policy "user_follows_either_select"
  on public.user_follows for select
  using (auth.uid() = follower_id or auth.uid() = followee_id);

-- Only the follower can create / remove their own follow edge.
drop policy if exists "user_follows_follower_insert" on public.user_follows;
create policy "user_follows_follower_insert"
  on public.user_follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "user_follows_follower_delete" on public.user_follows;
create policy "user_follows_follower_delete"
  on public.user_follows for delete
  using (auth.uid() = follower_id);

grant select, insert, delete on public.user_follows to authenticated;
grant all on public.user_follows to service_role;
