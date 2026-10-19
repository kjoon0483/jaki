import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** 폰(작은 터치 화면)이 가로로 돌아가 있는지. 키보드가 올라와 화면이 낮아진 것과 구분하려고 기기 방향을 본다. */
function phoneIsLandscape() {
  const small = Math.min(window.screen.width, window.screen.height) < 600 && window.matchMedia('(pointer: coarse)').matches;
  if (!small) return false;
  const type = window.screen.orientation?.type;
  if (type) return type.startsWith('landscape');
  return window.matchMedia('(orientation: landscape)').matches;
}

/**
 * 앱은 세로 전용이다. 브라우저는 회전을 직접 잠글 수 없어서, 폰이 가로로 돌아가 있으면
 * 화면을 덮고 세로로 돌려 달라고 안내한다. 3D 1인칭에서는(body.dataset.walking) 가로가 맞으니 숨긴다.
 */
export function PortraitGuard() {
  const theme = useTheme();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const update = () => setShow(phoneIsLandscape() && document.body.dataset.walking !== '1');
    update();
    window.addEventListener('resize', update);
    window.addEventListener('oneroom-walk', update);
    window.screen.orientation?.addEventListener?.('change', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('oneroom-walk', update);
      window.screen.orientation?.removeEventListener?.('change', update);
    };
  }, []);

  if (!show) return null;
  return (
    <View style={[styles.cover, { backgroundColor: theme.background }]} accessibilityRole="alert">
      <Ionicons name="phone-portrait-outline" size={44} color={theme.accent} />
      <Text style={[styles.title, { color: theme.text }]}>화면을 세로로 돌려 주세요</Text>
      <Text style={[styles.sub, { color: theme.textSecondary }]}>3D 1인칭 둘러보기만 가로로 볼 수 있어요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '700' },
  sub: { fontSize: 13 },
});
