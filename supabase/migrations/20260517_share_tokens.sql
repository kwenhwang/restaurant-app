-- Share tokens: random short string makes a restaurant viewable without auth
alter table public.restaurants
  add column if not exists share_token text unique;

create index if not exists restaurants_share_token_idx
  on public.restaurants (share_token)
  where share_token is not null;
