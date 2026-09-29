-- 내 방(3D 배치) 저장 + 커뮤니티 글에 방 첨부
-- Supabase 대시보드 > SQL Editor > New query 에 붙여넣고 Run 하세요. (여러 번 실행해도 안전)

-- rooms: 내가 저장한 3D 방. 본인만 보고 고칠 수 있다.
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  data jsonb not null check (pg_column_size(data) < 262144),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rooms_user_id_updated_at_idx on public.rooms (user_id, updated_at desc);

alter table public.rooms enable row level security;

drop policy if exists "users manage their own rooms" on public.rooms;
create policy "users manage their own rooms" on public.rooms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- community_posts: 공유할 때 방의 "복사본"을 글에 넣는다.
-- (원본 방을 나중에 고쳐도 글은 그대로이고, rooms 테이블은 계속 비공개로 남는다.)
alter table public.community_posts
  add column if not exists room jsonb,
  add column if not exists room_name text;

alter table public.community_posts drop constraint if exists community_posts_room_size;
alter table public.community_posts
  add constraint community_posts_room_size check (room is null or pg_column_size(room) < 262144);
