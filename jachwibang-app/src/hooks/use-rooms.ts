import { useCallback, useEffect, useState } from 'react';

import type { RoomData } from '@/components/room/sim-bridge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth-state';

export interface SavedRoom {
  id: string;
  name: string;
  data: RoomData;
  updated_at: string;
}

const COLUMNS = 'id, name, data, updated_at';

export function roomsError(message: string) {
  if (/relation .*rooms.* does not exist|could not find the table .*rooms/i.test(message)) {
    // Keep the raw message: "schema cache" means the table exists but the API hasn't reloaded yet.
    return `내 방 저장소를 찾지 못했어요. Supabase SQL Editor에서 003_rooms.sql 을 실행했는지 확인하고, 이미 했다면 notify pgrst, 'reload schema'; 를 실행해주세요.\n(${message})`;
  }
  return message;
}

/** The signed-in user's saved 3D rooms (newest first). Pass `enabled=false` to skip loading. */
export function useRooms(enabled = true) {
  const { session } = useAuth();
  const me = session?.user.id ?? null;
  const [rooms, setRooms] = useState<SavedRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from('rooms')
      .select(COLUMNS)
      .order('updated_at', { ascending: false });
    if (loadError) setError(roomsError(loadError.message));
    else {
      setError(null);
      setRooms((data ?? []) as SavedRoom[]);
    }
    setLoading(false);
  }, [me]);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  /** Creates a new room, or overwrites `id` when given. */
  const saveRoom = useCallback(
    async (name: string, data: RoomData, id?: string) => {
      if (!me) return { room: null, error: '로그인이 필요해요.' };
      const query = id
        ? supabase.from('rooms').update({ name, data, updated_at: new Date().toISOString() }).eq('id', id)
        : supabase.from('rooms').insert({ user_id: me, name, data });
      const { data: row, error: saveError } = await query.select(COLUMNS).single();
      if (saveError) return { room: null, error: roomsError(saveError.message) };
      const room = row as SavedRoom;
      setRooms((prev) => [room, ...prev.filter((r) => r.id !== room.id)]);
      return { room, error: null };
    },
    [me]
  );

  const deleteRoom = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('rooms').delete().eq('id', id);
    if (deleteError) return { error: roomsError(deleteError.message) };
    setRooms((prev) => prev.filter((r) => r.id !== id));
    return { error: null };
  }, []);

  return { rooms, loading, error, refresh, saveRoom, deleteRoom };
}
