-- BlurHash placeholder for restaurant_images
-- Stores a tiny base64 data URL (~150 bytes per image) so <Image placeholder="blur">
-- can render a soft blur while the full image streams in. Generated at upload time
-- via sharp() in app/api/upload/route.ts.

alter table public.restaurant_images
  add column if not exists blur_data_url text;
