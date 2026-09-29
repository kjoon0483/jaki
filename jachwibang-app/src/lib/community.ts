import type { RoomData } from '@/components/room/sim-bridge';
import { supabase } from '@/lib/supabase';

export const POST_COLUMNS = 'id, user_id, body, topic, room, room_name, likes_count, created_at';
/** Columns that exist before migration 003 (room sharing). */
export const LEGACY_POST_COLUMNS = 'id, user_id, body, topic, likes_count, created_at';

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

/** True when an error says the room/room_name columns (migration 003) aren't visible to the API. */
export function isMissingRoomColumn(message: string) {
  return /\broom(_name)?\b/i.test(message) && /does not exist|schema cache|could not find/i.test(message);
}

/** Turns Postgres/PostgREST errors into something actionable for this app (keeping the raw message). */
export function communityError(message: string) {
  if (isMissingRoomColumn(message)) {
    return `방 공유용 DB 칸(room)을 찾지 못했어요. Supabase SQL Editor에서 003_rooms.sql 을 실행했는지 확인하고, 이미 했다면 notify pgrst, 'reload schema'; 를 실행해주세요.\n(${message})`;
  }
  if (/column .*(body|topic)|(body|topic).* does not exist|schema cache/i.test(message)) {
    return `커뮤니티 DB 업데이트가 필요해요. Supabase SQL Editor에서 002_community_posts_body.sql 을 실행해주세요.\n(${message})`;
  }
  if (/relation .* does not exist/i.test(message)) {
    return `커뮤니티 테이블이 없어요. Supabase SQL Editor에서 supabase/schema.sql 을 실행해주세요.\n(${message})`;
  }
  return message;
}

export async function insertPost(userId: string, body: string, topic: string, room?: AttachedRoom | null) {
  const insert = (columns: string) =>
    supabase
      .from('community_posts')
      .insert({
        user_id: userId,
        body: body.trim(),
        topic,
        ...(room ? { room: room.data, room_name: room.name } : {}),
      })
      .select(columns)
      .single();
  let { data, error } = await insert(POST_COLUMNS);
  // A text-only post doesn't need migration 003; retry without asking for the room columns.
  if (error && !room && isMissingRoomColumn(error.message)) ({ data, error } = await insert(LEGACY_POST_COLUMNS));
  if (error) return { post: null, error: communityError(error.message) };
  const row = data as unknown as PostRow;
  return { post: { ...row, room: row.room ?? null, room_name: row.room_name ?? null }, error: null };
}
