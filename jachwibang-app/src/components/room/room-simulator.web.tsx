import { StyleSheet, View } from 'react-native';

import ONEROOM_HTML from '@/generated/oneroom-html';

/** 웹에서는 WebView 대신 iframe(srcDoc)으로 같은 HTML을 띄운다. */
export function RoomSimulator() {
  return (
    <View style={styles.wrap}>
      <iframe
        title="원룸 배치 시뮬레이터"
        srcDoc={ONEROOM_HTML}
        allow="fullscreen"
        style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
});
