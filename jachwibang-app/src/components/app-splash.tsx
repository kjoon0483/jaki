import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

const FADE_IN_MS = 900;
const HOLD_MS = 2000;
const FADE_OUT_MS = 900;

/** Full-brand splash (icon + wordmark) shown for a moment on app launch. */
export function AppSplash() {
  const [visible, setVisible] = useState(true);
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // The solid background below is opaque from the very first frame, so hiding
    // the native splash here never exposes the screen underneath. Only the logo
    // image fades in/out on top of it.
    SplashScreen.hideAsync().catch(() => {});

    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: FADE_IN_MS,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(logoOpacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }, FADE_IN_MS + HOLD_MS);
    return () => clearTimeout(timer);
  }, [logoOpacity]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.logo, { opacity: logoOpacity }]}>
        <Image style={styles.logoImage} source={require('@/assets/images/splash-logo.png')} contentFit="contain" />
      </Animated.View>
    </View>
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
    width: '80%',
    maxWidth: 380,
    aspectRatio: 2035 / 1792,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});
