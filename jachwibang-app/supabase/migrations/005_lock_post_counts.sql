-- 005: stop users from setting likes_count (or user_id, created_at) on posts themselves
-- (safe to run many times)
--
-- Before this, the "own posts" policies let an author write any column of their post,
-- so a direct API call could set likes_count to 9999. Signed-in users may now only
-- write the content columns; likes_count is changed only by the like trigger,
-- which runs as the table owner and is not affected by these grants.

revoke insert, update on public.community_posts from anon, authenticated;

grant insert (user_id, body, topic, placed, room, room_name)
  on public.community_posts to authenticated;

grant update (body, topic, placed, room, room_name)
  on public.community_posts to authenticated;
