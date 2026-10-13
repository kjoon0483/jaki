-- 006: account deletion, unique nicknames, community reports and blocks
-- (safe to run many times)

-- 1) Account deletion --------------------------------------------------------
-- Deletes the signed-in user. Every app table references auth.users with
-- "on delete cascade", so expenses, rooms, posts, comments, likes, profile,
-- reports and blocks are removed with it.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 2) Unique nicknames (case-insensitive) --------------------------------------
-- Existing duplicates keep the oldest owner; later ones get a short suffix
-- (7 chars + "_" + 4 chars = 12, the app's max nickname length).
with ranked as (
  select id, row_number() over (partition by lower(display_name) order by created_at, id) as rn
  from public.profiles
),
renamed as (
  update public.profiles p
  set display_name = left(p.display_name, 7) || '_' || left(replace(p.id::text, '-', ''), 4)
  from ranked r
  where r.id = p.id and r.rn > 1
  returning p.id, p.display_name
)
update auth.users u
set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nickname', renamed.display_name)
from renamed
where u.id = renamed.id;

create unique index if not exists profiles_display_name_unique_idx
  on public.profiles (lower(display_name));

-- Lets the sign-up and nickname forms check a name before saving.
create or replace function public.nickname_available(name text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select not exists (
    select 1 from public.profiles
    where lower(display_name) = lower(trim(name))
      and id is distinct from auth.uid()
  );
$$;

grant execute on function public.nickname_available(text) to anon, authenticated;

-- New users: if the nickname was taken in the meantime, add a short suffix
-- instead of failing the whole sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''), split_part(new.email, '@', 1));
begin
  begin
    insert into public.profiles (id, display_name) values (new.id, base);
  exception when unique_violation then
    insert into public.profiles (id, display_name)
    values (new.id, left(base, 7) || '_' || left(replace(new.id::text, '-', ''), 4));
  end;
  return new;
end;
$$;

-- 3) Reports ----------------------------------------------------------------
-- Users can file reports but not read them; review them in the dashboard
-- (Table Editor > community_reports).
create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  post_id uuid references public.community_posts (id) on delete cascade,
  comment_id uuid references public.community_comments (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 200),
  created_at timestamptz not null default now(),
  check (post_id is not null or comment_id is not null),
  unique nulls not distinct (reporter_id, post_id, comment_id)
);

alter table public.community_reports enable row level security;

drop policy if exists "users file their own reports" on public.community_reports;
create policy "users file their own reports" on public.community_reports
  for insert with check (auth.uid() = reporter_id);

-- 4) Blocks -----------------------------------------------------------------
-- A user's blocks are private to them; the app hides blocked users' posts and comments.
create table if not exists public.user_blocks (
  blocker_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.user_blocks enable row level security;

drop policy if exists "users manage their own blocks" on public.user_blocks;
create policy "users manage their own blocks" on public.user_blocks
  for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

notify pgrst, 'reload schema';
