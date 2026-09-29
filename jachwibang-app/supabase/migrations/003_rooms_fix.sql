-- 003 fix: create rooms table + room columns (safe to run many times)

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references auth.users (id) on delete cascade,
  name text not null
    check (char_length(name) between 1 and 40),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rooms_user_idx
  on public.rooms (user_id, updated_at desc);

alter table public.rooms enable row level security;

drop policy if exists rooms_owner on public.rooms;

create policy rooms_owner on public.rooms
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.community_posts
  add column if not exists room jsonb;

alter table public.community_posts
  add column if not exists room_name text;

notify pgrst, 'reload schema';

select to_regclass('public.rooms') as rooms_table;
