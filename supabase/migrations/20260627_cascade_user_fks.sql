-- Make per-user data clean up automatically when an auth.users row is deleted.
--
-- Pre-existing state (verified on live 2026-06-27):
--   * restaurants.user_id — had NO foreign key at all (orphan rows possible)
--   * visits.user_id      — had NO foreign key at all (orphan rows possible)
--   * bug_reports.user_id — FK existed but ON DELETE NO ACTION, so it BLOCKED
--                           deleting an account that had filed a report.
--
-- All other public tables referencing auth.users already cascade. This brings
-- the three legacy tables in line so account deletion is uniformly DB-enforced
-- (and one-off cleanups don't hit FK-violation walls). Run only after orphan
-- rows are gone (the 2026-06-27 test-account purge cleared them).

-- restaurants.user_id → cascade
alter table public.restaurants
  drop constraint if exists restaurants_user_id_fkey;
alter table public.restaurants
  add constraint restaurants_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- visits.user_id → cascade
alter table public.visits
  drop constraint if exists visits_user_id_fkey;
alter table public.visits
  add constraint visits_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- bug_reports.user_id → cascade (was NO ACTION)
alter table public.bug_reports
  drop constraint if exists bug_reports_user_id_fkey;
alter table public.bug_reports
  add constraint bug_reports_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
