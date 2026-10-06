import { useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import type { Ref } from 'react';

/** Serialized room from oneroom.html (`serialize()` there). Opaque to the app apart from the version. */
export type RoomData = {
  v: 1;
  /** Small JPEG data URL of the default 3D view, used as a preview. Missing on rooms saved before it existed. */
  thumb?: string;
} & Record<string, unknown>;

export interface RoomSimulatorHandle {
  /** Asks the simulator for the current room; with `thumb`, also takes a preview photo of it. */
  serialize: (opts?: { thumb?: boolean }) => Promise<RoomData>;
  /** Replaces the room in the simulator. */
  load: (state: RoomData) => void;
  /** Reloads the simulator with its default starter room. */
  reset: () => void;
}

export interface RoomSimulatorProps {
  /** View-only: editing is disabled, only 3rd-person / top / 1st-person viewing. */
  readonly?: boolean;
  /** Room to show once the simulator has started. */
  initialState?: RoomData | null;
  /** Never draws on its own (a hidden page that only takes preview photos), to save battery. */
  paused?: boolean;
  ref?: Ref<RoomSimulatorHandle>;
}

type OutMsg = { type: string; [k: string]: unknown };

/**
 * Shared request/response plumbing between the app and oneroom.html. `send` delivers a message
 * to the page (WebView.injectJavaScript on native, iframe.postMessage on web); the platform view
 * calls `onMessage` with whatever the page posts back.
 */
export function useSimBridge(send: (msg: OutMsg) => void, { readonly, initialState, paused, ref }: RoomSimulatorProps) {
  const ready = useRef(false);
  const queue = useRef<OutMsg[]>([]);
  const pending = useRef(new Map<number, (s: RoomData) => void>());
  const nextId = useRef(1);
  const init = useRef({ readonly, initialState, paused });
  init.current = { readonly, initialState, paused };

  const post = useCallback(
    (msg: OutMsg) => {
      if (ready.current) send(msg);
      else queue.current.push(msg);
    },
    [send]
  );

  const onMessage = useCallback(
    (msg: unknown) => {
      if (!msg || typeof msg !== 'object') return;
      const m = msg as { type?: string; id?: number; state?: RoomData };
      if (m.type === 'ready') {
        // The page (re)started: hand it the room + mode, then flush anything sent early.
        ready.current = true;
        send({
          type: 'init',
          readonly: !!init.current.readonly,
          paused: !!init.current.paused,
          state: init.current.initialState ?? null,
        });
        queue.current.splice(0).forEach(send);
      } else if (m.type === 'state' && m.id !== undefined && m.state) {
        pending.current.get(m.id)?.(m.state);
        pending.current.delete(m.id);
      }
    },
    [send]
  );

  useImperativeHandle(
    ref,
    () => ({
      serialize: (opts) =>
        new Promise<RoomData>((resolve, reject) => {
          const id = nextId.current++;
          pending.current.set(id, resolve);
          post({ type: 'serialize', id, thumb: !!opts?.thumb });
          setTimeout(() => {
            if (pending.current.delete(id)) reject(new Error('3D 화면이 응답하지 않아요. 잠시 후 다시 시도해주세요.'));
          }, 8000);
        }),
      load: (state) => post({ type: 'load', state }),
      reset: () => {
        ready.current = false; // the page reloads and will announce 'ready' again
        send({ type: 'reset' });
      },
    }),
    [post, send]
  );

  // Page is gone when the view unmounts; drop anything still waiting.
  useEffect(() => () => pending.current.clear(), []);

  return { onMessage };
}
