import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

import { RoomSimulator } from '@/components/room/room-simulator';
import type { RoomData, RoomSimulatorHandle } from '@/components/room/sim-bridge';

/**
 * Preview photos for rooms saved before photos were taken on save. They are rendered on the
 * device by one hidden, view-only simulator (<RoomThumbMaker />), one room at a time, and kept on
 * the device so the slow part (starting the 3D page) only happens once per room.
 * `null` means the photo couldn't be taken (the floor plan is shown instead).
 */
const thumbs = new Map<string, string | null>();
const queue: { key: string; room: RoomData; onGenerated?: (thumb: string) => void }[] = [];
const listeners = new Set<() => void>();
let version = 0;

// v2: photos went from 400x500 to 640x800, so older (blurrier) cached ones are retaken.
const STORAGE_KEY = 'room-thumbs:v2';
/** ~40KB each, so this stays well under the browser's localStorage quota (~5MB). */
const MAX_STORED = 40;
let storage: 'idle' | 'loading' | 'ready' = 'idle';
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function emit() {
  version++;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Loads photos saved on this device; queued work waits for it so nothing is rendered twice. */
function loadStored() {
  if (storage !== 'idle') return;
  storage = 'loading';
  AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => {
      const saved = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      Object.entries(saved).forEach(([key, thumb]) => {
        if (!thumbs.has(key) && typeof thumb === 'string') thumbs.set(key, thumb);
      });
    })
    .catch(() => {})
    .finally(() => {
      storage = 'ready';
      emit();
    });
}

function saveStored() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    // Map keeps insertion order, so the newest photos are the ones kept.
    const entries = [...thumbs].filter((e): e is [string, string] => typeof e[1] === 'string').slice(-MAX_STORED);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries))).catch(() => {});
  }, 500);
}

/**
 * Generated photo for `key`: a data URL, null if it failed, undefined while still pending.
 * `onGenerated` runs once when a new photo is taken (e.g. to save it onto my own post).
 */
export function useGeneratedThumb(
  key: string | undefined,
  room: RoomData,
  onGenerated?: (thumb: string) => void
): string | null | undefined {
  useSyncExternalStore(subscribe, () => version);
  const needed = !!key && !room.thumb;
  const ready = storage === 'ready';
  const callback = useRef(onGenerated);
  callback.current = onGenerated;

  useEffect(() => {
    if (!needed) return;
    loadStored();
    if (!ready || thumbs.has(key!) || queue.some((j) => j.key === key)) return;
    queue.push({ key: key!, room, onGenerated: (t) => callback.current?.(t) });
    emit();
  }, [needed, ready, key, room]);

  if (!key) return null;
  return thumbs.get(key);
}

/** The room with a preview photo added from the generated cache, if it had none. */
export function withGeneratedThumb(room: RoomData, key: string | undefined): RoomData {
  const thumb = key ? thumbs.get(key) : null;
  return room.thumb || !thumb ? room : { ...room, thumb };
}

/** First load of the 3D page (three.js from the CDN) can outlast one serialize timeout, so retry once. */
const ATTEMPTS = 2;

/**
 * Hidden simulator that works through the queue. Mount once on a screen that shows previews: the
 * 3D page starts loading right away (while posts are still being fetched) and then stays paused,
 * so it draws nothing until a photo is needed.
 */
export function RoomThumbMaker() {
  useSyncExternalStore(subscribe, () => version);
  const sim = useRef<RoomSimulatorHandle>(null);
  const busy = useRef(false);
  const job = queue[0];

  useEffect(loadStored, []);

  useEffect(() => {
    if (!job || busy.current) return;
    busy.current = true;
    (async () => {
      let thumb: string | null = null;
      for (let i = 0; i < ATTEMPTS && !thumb; i++) {
        try {
          sim.current?.load(job.room);
          const state = await sim.current!.serialize({ thumb: true });
          thumb = typeof state.thumb === 'string' ? state.thumb : null;
        } catch {
          thumb = null;
        }
      }
      thumbs.set(job.key, thumb);
      queue.shift();
      busy.current = false;
      if (thumb) {
        saveStored();
        job.onGenerated?.(thumb);
      }
      emit();
    })();
  }, [job]);

  return (
    <View style={styles.hidden} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <RoomSimulator ref={sim} readonly paused />
    </View>
  );
}

const styles = StyleSheet.create({
  // Must stay laid out (not display:none / zero size) so the WebGL page actually runs.
  hidden: { position: 'absolute', left: 0, top: 0, width: 200, height: 250, opacity: 0, zIndex: -1 },
});
