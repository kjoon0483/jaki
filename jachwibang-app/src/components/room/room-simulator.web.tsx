import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { RoomSimulatorProps, useSimBridge } from '@/components/room/sim-bridge';
import ONEROOM_HTML from '@/generated/oneroom-html';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

/** 웹에서는 WebView 대신 iframe(srcDoc)으로 같은 HTML을 띄운다. */
export function RoomSimulator(props: RoomSimulatorProps) {
  const scheme = useColorScheme();
  const theme = useTheme();
  const frameRef = useRef<HTMLIFrameElement>(null);
  // 1인칭으로 걷는 동안에는 앱의 위쪽 막대와 아래 탭까지 덮어 화면 전체를 쓴다.
  const [walking, setWalking] = useState(false);
  // 폰이 세로인 채로 1인칭을 켜면, 화면을 90도 눕혀서 가로로 보여준다 (폰의 회전 잠금이 켜져 있어도 된다).
  const [portrait, setPortrait] = useState(() => typeof window !== 'undefined' && window.innerHeight > window.innerWidth);
  const [flip, setFlip] = useState(false);
  const rotated = walking && portrait;
  useEffect(() => {
    const update = () => setPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const send = useCallback((msg: object) => {
    frameRef.current?.contentWindow?.postMessage({ ...msg, target: 'oneroom' }, '*');
  }, []);
  const { onMessage } = useSimBridge(send, props);

  useEffect(() => {
    send({ type: 'rotated', on: rotated });
  }, [rotated, send]);

  useEffect(() => {
    function listener(e: MessageEvent) {
      if (e.source !== frameRef.current?.contentWindow || e.data?.source !== 'oneroom') return;
      if (e.data.type === 'walk') setWalking(!!e.data.on);
      else if (e.data.type === 'flip') setFlip((v) => !v);
      else onMessage(e.data);
    }
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onMessage]);

  // srcDoc frames share our origin, so the theme can be set on its <html> directly.
  function applyTheme() {
    const doc = frameRef.current?.contentDocument;
    if (doc?.documentElement) doc.documentElement.dataset.theme = scheme;
  }

  useEffect(applyTheme);

  return (
    <View style={[styles.wrap, { backgroundColor: theme.background }]}>
      <iframe
        ref={frameRef}
        title="원룸 배치 시뮬레이터"
        srcDoc={ONEROOM_HTML}
        onLoad={applyTheme}
        allow="fullscreen"
        style={
          !walking
            ? { border: 0, width: '100%', height: '100%', display: 'block' }
            : rotated
              ? {
                  border: 0, position: 'fixed', top: 0, left: 0, zIndex: 2000, display: 'block',
                  width: '100dvh', height: '100dvw', transformOrigin: 'top left',
                  transform: flip ? 'translateY(100dvh) rotate(-90deg)' : 'translateX(100dvw) rotate(90deg)',
                }
              : { border: 0, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', zIndex: 2000, display: 'block' }
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
});
