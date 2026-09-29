import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import ONEROOM_HTML from '@/generated/oneroom-html';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

/** 웹에서는 WebView 대신 iframe(srcDoc)으로 같은 HTML을 띄운다. */
export function RoomSimulator() {
  const scheme = useColorScheme();
  const theme = useTheme();
  const frameRef = useRef<HTMLIFrameElement>(null);

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
        style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
});
