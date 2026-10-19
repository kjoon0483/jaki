import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { useAuth } from '@/state/auth-state';

// 홈에 고정한 방 id 목록. 기기에 저장하고(계정마다 따로), 홈과 3D 화면이 같은 값을 본다.
const key = (userId: string) => `jachwibang.pinnedRooms.${userId}`;
let current: string[] = [];
let loadedFor: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function load(userId: string) {
  if (loadedFor === userId) return;
  loadedFor = userId;
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    current = Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    current = [];
  }
  emit();
}

export function usePinnedRooms() {
  const { session } = useAuth();
  const me = session?.user.id ?? null;
  const ids = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => current,
    () => current
  );

  useEffect(() => {
    if (me) load(me);
    else {
      loadedFor = null;
      current = [];
      emit();
    }
  }, [me]);

  const toggle = useCallback(
    (roomId: string) => {
      if (!me) return;
      current = current.includes(roomId) ? current.filter((x) => x !== roomId) : [roomId, ...current];
      emit();
      AsyncStorage.setItem(key(me), JSON.stringify(current)).catch(() => {});
    },
    [me]
  );

  return { pinnedIds: ids, isPinned: (id: string) => ids.includes(id), toggle };
}
