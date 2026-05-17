-- Optional screenshot attachment for bug reports
alter table public.bug_reports
  add column if not exists screenshot_path text;
