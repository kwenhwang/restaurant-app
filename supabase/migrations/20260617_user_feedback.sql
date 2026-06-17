-- Inline AI feedback: lightweight 👍/👎 votes (+ optional comment) on each
-- AI-generated surface. Separate from bug_reports because the cardinality,
-- shape, and lifecycle differ — votes are toggleable, bug reports are not.

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  surface text not null check (surface in ('recommend', 'discover', 'review', 'menu')),
  target_ref text not null,
  vote smallint not null check (vote in (-1, 1)),
  prompt_context jsonb,
  comment text check (comment is null or char_length(comment) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, surface, target_ref)
);

create index if not exists user_feedback_surface_created_idx
  on public.user_feedback (surface, created_at desc);

create index if not exists user_feedback_user_idx
  on public.user_feedback (user_id, created_at desc);

alter table public.user_feedback enable row level security;

drop policy if exists "user_feedback_owner_select" on public.user_feedback;
create policy "user_feedback_owner_select"
  on public.user_feedback for select
  using (auth.uid() = user_id);

drop policy if exists "user_feedback_owner_insert" on public.user_feedback;
create policy "user_feedback_owner_insert"
  on public.user_feedback for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_feedback_owner_update" on public.user_feedback;
create policy "user_feedback_owner_update"
  on public.user_feedback for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_feedback_owner_delete" on public.user_feedback;
create policy "user_feedback_owner_delete"
  on public.user_feedback for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_feedback to authenticated;
grant all on public.user_feedback to service_role;
