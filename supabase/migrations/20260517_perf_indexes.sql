-- Performance indexes for foreign keys and common query patterns
-- Without these, every RLS check (user_id = auth.uid()) and join does a seq scan.

-- restaurants: list by user, often with created_at DESC
create index if not exists restaurants_user_id_created_at_idx
  on public.restaurants (user_id, created_at desc);

-- restaurant_images: joined from detail page + delete cascade lookup
create index if not exists restaurant_images_restaurant_id_idx
  on public.restaurant_images (restaurant_id);

-- visits: by restaurant (detail page), and by user with date desc (/visits page)
create index if not exists visits_restaurant_id_visited_at_idx
  on public.visits (restaurant_id, visited_at desc);

create index if not exists visits_user_id_visited_at_idx
  on public.visits (user_id, visited_at desc);
