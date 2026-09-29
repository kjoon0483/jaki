import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import ONEROOM_HTML from '@/generated/oneroom-html';

/** oneroom.html(three.js 원룸 배치 시뮬레이터)을 그대로 띄우는 뷰. */
export function RoomSimulator() {
  return (
    <View style={styles.wrap}>
      <WebView
        style={styles.web}
        originWhitelist={['*']}
        source={{ html: ONEROOM_HTML, baseUrl: 'https://localhost/' }}
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
  web: { flex: 1, backgroundColor: 'transparent' },
});
