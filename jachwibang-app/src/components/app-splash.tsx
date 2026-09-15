import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';

const HOLD_MS = 700;
const FADE_MS = 450;

/** Full-brand splash (icon + wordmark) shown for a moment on app launch. */
export function AppSplash() {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }, HOLD_MS);
    return () => clearTimeout(timer);
  }, [opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Image
        style={styles.logo}
        source={require('@/assets/images/splash-logo.jpg')}
        contentFit="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  logo: {
    width: 240,
    height: 240,
  },
});
