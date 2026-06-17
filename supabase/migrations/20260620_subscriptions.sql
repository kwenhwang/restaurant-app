-- Premium subscriptions.
--
-- One active (or trialing) row per user at a time, enforced by a partial
-- unique index. payment_provider lets us add 네이버페이 / 토스 later
-- without schema changes. Provider-specific identifiers (TID, billing-key,
-- customer id) live in opaque jsonb to stay flexible.
--
-- RLS: each user reads their own row. ALL writes go through the service
-- role (called from billing webhooks / server actions that validate the
-- provider signature) — the authenticated user must never be able to
-- self-grant premium.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled')),
  plan text not null default 'premium-monthly'
    check (plan in ('premium-monthly', 'premium-yearly')),
  payment_provider text not null default 'kakaopay'
    check (payment_provider in ('kakaopay', 'naverpay', 'toss')),
  -- Provider-specific identifiers: e.g. { tid, sid, billing_key, partner_user_id }
  provider_data jsonb not null default '{}'::jsonb,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end_at timestamptz,
  canceled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One live (trialing / active / past_due) sub per user.
create unique index if not exists subscriptions_user_live_idx
  on public.subscriptions (user_id)
  where status in ('trialing', 'active', 'past_due');

create index if not exists subscriptions_status_idx
  on public.subscriptions (status, current_period_end);

create index if not exists subscriptions_user_created_idx
  on public.subscriptions (user_id, created_at desc);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_owner_select" on public.subscriptions;
create policy "subscriptions_owner_select"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- NO insert/update/delete policies for authenticated. service_role only.
-- This is intentional — authenticated users must never flip their own
-- status to 'active'. All writes happen via /api/billing/* routes using
-- the admin client after validating the provider callback.

grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;

-- Convenience view: the "current" subscription per user (most recently
-- updated live row, NULL if none). Reads inherit caller's RLS.
create or replace view public.current_subscription as
  select distinct on (user_id)
    user_id, id, status, plan, current_period_end, trial_end_at, canceled_at
  from public.subscriptions
  where status in ('trialing', 'active', 'past_due')
  order by user_id, updated_at desc;

grant select on public.current_subscription to authenticated;
