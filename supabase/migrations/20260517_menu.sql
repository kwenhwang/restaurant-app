-- Structured menu data (AI-extracted from photos)
alter table public.restaurants
  add column if not exists menu jsonb;
-- Shape: { items: [{name, price}], price_range: text|null, summary: text|null, source: 'ai-vision' }
