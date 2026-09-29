import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { RoomSimulatorProps, useSimBridge } from '@/components/room/sim-bridge';
import ONEROOM_HTML from '@/generated/oneroom-html';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

// oneroom.html reads its palette from <html data-theme="light|dark">.
const setThemeScript = (scheme: string) => `document.documentElement.dataset.theme = ${JSON.stringify(scheme)}; true;`;

// JSON is valid JS except for the U+2028/U+2029 line separators, which would end the injected
// script's string early, so they are re-escaped.
const LINE_SEP = new RegExp(String.fromCharCode(0x2028), 'g');
const PARA_SEP = new RegExp(String.fromCharCode(0x2029), 'g');
const toJsLiteral = (value: unknown) =>
  JSON.stringify(value).replace(LINE_SEP, '\\' + 'u2028').replace(PARA_SEP, '\\' + 'u2029');

/** oneroom.html(three.js 원룸 배치 시뮬레이터)을 그대로 띄우는 뷰. */
export function RoomSimulator(props: RoomSimulatorProps) {
  const scheme = useColorScheme();
  const theme = useTheme();
  const webRef = useRef<WebView>(null);
  // Only the first value matters here; later changes are pushed via injectJavaScript.
  const initialScheme = useRef(scheme).current;

  const send = useCallback((msg: object) => {
    webRef.current?.injectJavaScript(`window.__oneroomReceive && window.__oneroomReceive(${toJsLiteral(msg)}); true;`);
  }, []);
  const { onMessage } = useSimBridge(send, props);

  useEffect(() => {
    webRef.current?.injectJavaScript(setThemeScript(scheme));
  }, [scheme]);

  return (
    <View style={[styles.wrap, { backgroundColor: theme.background }]}>
      <WebView
        ref={webRef}
        style={[styles.web, { backgroundColor: theme.background }]}
        originWhitelist={['*']}
        source={{ html: ONEROOM_HTML, baseUrl: 'https://localhost/' }}
        injectedJavaScriptBeforeContentLoaded={setThemeScript(initialScheme)}
        onMessage={(e) => {
          try {
            onMessage(JSON.parse(e.nativeEvent.data));
          } catch {
            // not one of ours
          }
        }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
  web: { flex: 1 },
});
