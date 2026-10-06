-- 자취방 키우기: core schema
-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query > Run).

-- profiles: one row per auth user, for a display name in the community feed
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'User',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- expenses: 가계부
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  amount integer not null check (amount >= 0),
  spent_on date not null default current_date,
  memo text,
  is_income boolean not null default false, -- true = 수입, false = 지출
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_id_spent_on_idx on public.expenses (user_id, spent_on);

-- room_furniture: 내 3D 배치 (한 유저당 여러 가구 row)
create table if not exists public.room_furniture (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('sofa', 'bed', 'armchair', 'table')),
  x real not null,
  y real not null,
  rotation integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists room_furniture_user_id_idx on public.room_furniture (user_id);

-- rooms: 내가 저장한 3D 방 (본인만 접근)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  data jsonb not null check (pg_column_size(data) < 262144),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rooms_user_id_updated_at_idx on public.rooms (user_id, updated_at desc);

-- community_posts: 커뮤니티 글 (본문·주제, 선택적으로 배치 스냅샷)
-- 이미 테이블을 만든 경우에는 migrations/002, 003 을 순서대로 실행하세요.
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  placed jsonb not null default '[]'::jsonb,
  body text not null check (char_length(body) between 1 and 1000),
  topic text not null default '잡담',
  room jsonb check (room is null or pg_column_size(room) < 262144), -- 공유한 3D 방의 복사본
  room_name text,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists community_posts_created_at_idx on public.community_posts (created_at desc);

-- community_post_likes: 유저별 좋아요 (중복 방지 + likes_count 동기화)
create table if not exists public.community_post_likes (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create or replace function public.sync_post_likes_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_posts set likes_count = likes_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists on_post_like_change on public.community_post_likes;
create trigger on_post_like_change
  after insert or delete on public.community_post_likes
  for each row execute function public.sync_post_likes_count();

-- community_comments: 댓글
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists community_comments_post_id_idx on public.community_comments (post_id);

-- Row Level Security: every table is locked down to "own rows" except the
-- community feed, which is readable by anyone signed in.
alter table public.profiles enable row level security;
alter table public.expenses enable row level security;
alter table public.room_furniture enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_post_likes enable row level security;
alter table public.community_comments enable row level security;
alter table public.rooms enable row level security;

create policy "profiles are readable by everyone" on public.profiles
  for select using (true);
create policy "users manage their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "users manage their own expenses" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage their own room furniture" on public.room_furniture
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "posts are readable by everyone" on public.community_posts
  for select using (true);
create policy "users manage their own posts" on public.community_posts
  for insert with check (auth.uid() = user_id);
create policy "users update or delete their own posts" on public.community_posts
  for update using (auth.uid() = user_id);
create policy "users delete their own posts" on public.community_posts
  for delete using (auth.uid() = user_id);

create policy "users manage their own rooms" on public.rooms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "likes are readable by everyone" on public.community_post_likes
  for select using (true);
create policy "users manage their own likes" on public.community_post_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "comments are readable by everyone" on public.community_comments
  for select using (true);
create policy "users add their own comments" on public.community_comments
  for insert with check (auth.uid() = user_id);
create policy "users delete their own comments" on public.community_comments
  for delete using (auth.uid() = user_id);
