import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import ONEROOM_HTML from '@/generated/oneroom-html';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

// oneroom.html reads its palette from <html data-theme="light|dark">.
const setThemeScript = (scheme: string) => `document.documentElement.dataset.theme = ${JSON.stringify(scheme)}; true;`;

/** oneroom.html(three.js 원룸 배치 시뮬레이터)을 그대로 띄우는 뷰. */
export function RoomSimulator() {
  const scheme = useColorScheme();
  const theme = useTheme();
  const webRef = useRef<WebView>(null);
  // Only the first value matters here; later changes are pushed via injectJavaScript.
  const initialScheme = useRef(scheme).current;

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
