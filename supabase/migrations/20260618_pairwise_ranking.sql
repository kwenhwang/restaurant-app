-- Beli-style pairwise restaurant ranking.
--
-- Two tables:
--  · restaurant_comparisons  immutable event log of A>B choices
--  · restaurant_scores       derivative tier + Elo per (user, restaurant),
--                            updated atomically on each comparison
--
-- We seed restaurant_scores for every existing restaurant by mapping legacy
-- rating + visit_count into Elo space so the UI immediately has a usable
-- rank without forcing the user to compare everything first.

create table if not exists public.restaurant_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  winner_id uuid not null references public.restaurants(id) on delete cascade,
  loser_id uuid not null references public.restaurants(id) on delete cascade,
  context text not null default 'capture'
    check (context in ('capture', 'rerank', 'onboarding')),
  category text,
  created_at timestamptz not null default now(),
  check (winner_id <> loser_id)
);

create index if not exists restaurant_comparisons_user_created_idx
  on public.restaurant_comparisons (user_id, created_at desc);
create index if not exists restaurant_comparisons_user_winner_idx
  on public.restaurant_comparisons (user_id, winner_id);
create index if not exists restaurant_comparisons_user_loser_idx
  on public.restaurant_comparisons (user_id, loser_id);

create table if not exists public.restaurant_scores (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  elo double precision not null default 1000,
  comparisons_count integer not null default 0,
  tier smallint check (tier in (0, 1, 2)),
  updated_at timestamptz not null default now()
);

create index if not exists restaurant_scores_user_elo_idx
  on public.restaurant_scores (user_id, elo desc);
create index if not exists restaurant_scores_user_tier_idx
  on public.restaurant_scores (user_id, tier);

-- Backfill existing restaurants — legacy score → Elo
--   score = rating*20 + min(visit_count, 10) * 2  (existing lib/rankings.ts formula)
--   elo   = 1000 + (score - 50) * 6
-- visit_count is computed from the visits table.
insert into public.restaurant_scores (restaurant_id, user_id, elo, comparisons_count, tier)
select
  r.id,
  r.user_id,
  1000 + ((coalesce(r.rating, 0) * 20 + least(coalesce(v.cnt, 0), 10) * 2) - 50) * 6.0,
  0,
  null
from public.restaurants r
left join (
  select restaurant_id, count(*)::int as cnt
  from public.visits
  group by restaurant_id
) v on v.restaurant_id = r.id
on conflict (restaurant_id) do nothing;

-- RLS
alter table public.restaurant_comparisons enable row level security;
alter table public.restaurant_scores enable row level security;

drop policy if exists "rc_owner_all" on public.restaurant_comparisons;
create policy "rc_owner_all"
  on public.restaurant_comparisons for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "rs_owner_all" on public.restaurant_scores;
create policy "rs_owner_all"
  on public.restaurant_scores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.restaurant_comparisons to authenticated;
grant select, insert, update, delete on public.restaurant_scores to authenticated;
grant all on public.restaurant_comparisons, public.restaurant_scores to service_role;
