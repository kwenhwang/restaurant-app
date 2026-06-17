-- Extend user_feedback.surface enum to include 'insights'.
-- The original check constraint allowed 4 surfaces; AI insights wasn't
-- instrumented at the time. Adding it here.

alter table public.user_feedback
  drop constraint if exists user_feedback_surface_check;

alter table public.user_feedback
  add constraint user_feedback_surface_check
  check (surface in ('recommend', 'discover', 'review', 'menu', 'insights'));
