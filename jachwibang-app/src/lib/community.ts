import type { RoomData } from '@/components/room/sim-bridge';
import { supabase } from '@/lib/supabase';

export const POST_COLUMNS = 'id, user_id, body, topic, room, room_name, likes_count, created_at';

export interface PostRow {
  id: string;
  user_id: string;
  body: string;
  topic: string;
  room: RoomData | null;
  room_name: string | null;
  likes_count: number;
  created_at: string;
}

/** A room attached to a post: a snapshot copy, so later edits to the saved room don't change the post. */
export interface AttachedRoom {
  name: string;
  data: RoomData;
}

/** Turns Postgres/PostgREST errors into something actionable for this app. */
export function communityError(message: string) {
  if (/(room|room_name)\b.*(does not exist|schema cache)|column .*room/i.test(message)) {
    return '방 공유용 DB 업데이트가 필요해요. Supabase SQL Editor에서 supabase/migrations/003_rooms.sql 을 실행해주세요.';
  }
  if (/column .*(body|topic)|(body|topic).* does not exist|schema cache/i.test(message)) {
    return '커뮤니티 DB 업데이트가 필요해요. Supabase SQL Editor에서 supabase/migrations/002_community_posts_body.sql 을 실행해주세요.';
  }
  if (/relation .* does not exist/i.test(message)) {
    return '커뮤니티 테이블이 없어요. Supabase SQL Editor에서 supabase/schema.sql 을 실행해주세요.';
  }
  return message;
}

export async function insertPost(userId: string, body: string, topic: string, room?: AttachedRoom | null) {
  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      user_id: userId,
      body: body.trim(),
      topic,
      ...(room ? { room: room.data, room_name: room.name } : {}),
    })
    .select(POST_COLUMNS)
    .single();
  if (error) return { post: null, error: communityError(error.message) };
  return { post: data as PostRow, error: null };
}
