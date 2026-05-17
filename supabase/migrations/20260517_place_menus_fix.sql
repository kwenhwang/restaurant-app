-- Fix: unique constraint must use plain columns for ON CONFLICT to work.
-- Use NULLS NOT DISTINCT (Postgres 15+) so (null, null) coords still conflict properly.

drop index if exists place_menus_key_idx;

alter table public.place_menus
  drop constraint if exists place_menus_key_unique;

alter table public.place_menus
  add constraint place_menus_key_unique
  unique nulls not distinct (name_normalized, lat_bucket, lng_bucket);

-- Service role needs explicit grants for INSERT/UPDATE in tables with RLS
grant all on public.place_menus to service_role;
