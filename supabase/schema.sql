-- 맛집 테이블
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  address text,
  lat float8,
  lng float8,
  category text,
  rating int check (rating between 1 and 5),
  note text,
  created_at timestamptz default now()
);

-- 맛집 이미지 테이블
create table if not exists restaurant_images (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants on delete cascade,
  storage_path text not null,
  is_primary boolean default false
);

-- 방문 기록 테이블
create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  restaurant_id uuid references restaurants on delete cascade,
  visited_at date not null default current_date,
  memo text,
  created_at timestamptz default now()
);

-- RLS 활성화
alter table restaurants enable row level security;
alter table restaurant_images enable row level security;
alter table visits enable row level security;

-- restaurants 정책: 자신의 데이터만
create policy "restaurants_own" on restaurants
  for all using (auth.uid() = user_id);

-- restaurant_images 정책: 맛집 소유자만
create policy "images_own" on restaurant_images
  for all using (
    exists (select 1 from restaurants where id = restaurant_id and user_id = auth.uid())
  );

-- visits 정책: 자신의 데이터만
create policy "visits_own" on visits
  for all using (auth.uid() = user_id);

-- Storage 버킷 (Supabase 대시보드에서 수동으로 생성 필요)
-- Bucket name: restaurant-images
-- Public: true
