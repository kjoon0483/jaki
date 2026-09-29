-- 커뮤니티 글 본문/주제 추가
-- Supabase 대시보드 > SQL Editor > New query 에 붙여넣고 Run 하세요. (여러 번 실행해도 안전)

alter table public.community_posts
  add column if not exists body text not null default '',
  add column if not exists topic text not null default '잡담';

alter table public.community_posts drop constraint if exists community_posts_body_length;
alter table public.community_posts
  add constraint community_posts_body_length check (char_length(body) between 1 and 1000) not valid;
