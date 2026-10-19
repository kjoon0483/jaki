-- 007: administrator (reports review + removing community posts/comments)
-- (safe to run many times)
--
-- After running this file, register yourself as the administrator with the one-time
-- statement shown at the bottom (it is NOT part of this file, so no email is stored in the repo).

-- 1) Who is an administrator ---------------------------------------------------
-- Nobody can read or write this table from the app (RLS on, no policies);
-- only the function below and the SQL Editor can see it.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 2) What an administrator may do ---------------------------------------------
drop policy if exists "admins read reports" on public.community_reports;
create policy "admins read reports" on public.community_reports
  for select using (public.is_admin());

drop policy if exists "admins delete reports" on public.community_reports;
create policy "admins delete reports" on public.community_reports
  for delete using (public.is_admin());

drop policy if exists "admins delete posts" on public.community_posts;
create policy "admins delete posts" on public.community_posts
  for delete using (public.is_admin());

drop policy if exists "admins delete comments" on public.community_comments;
create policy "admins delete comments" on public.community_comments
  for delete using (public.is_admin());

notify pgrst, 'reload schema';

-- 3) Register yourself (run this separately, with your own sign-up email) ------
--   insert into public.admins (user_id)
--   select id from auth.users where email = '여기에_내_이메일'
--   on conflict do nothing;
