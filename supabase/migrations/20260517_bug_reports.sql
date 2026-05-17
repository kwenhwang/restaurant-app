-- User-submitted bug reports / feedback
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  message text not null check (char_length(message) between 3 and 2000),
  url text,
  user_agent text,
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists bug_reports_user_idx
  on public.bug_reports (user_id, created_at desc);

create index if not exists bug_reports_status_idx
  on public.bug_reports (status, created_at desc);

alter table public.bug_reports enable row level security;

-- Users can insert their own reports
drop policy if exists "bug_reports_insert_own" on public.bug_reports;
create policy "bug_reports_insert_own"
  on public.bug_reports for insert
  with check (auth.uid() = user_id);

-- Users can view their own reports
drop policy if exists "bug_reports_select_own" on public.bug_reports;
create policy "bug_reports_select_own"
  on public.bug_reports for select
  using (auth.uid() = user_id);

-- Grant table privileges to the authenticated role (RLS still gates rows)
grant select, insert on public.bug_reports to authenticated;
