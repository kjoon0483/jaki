/**
 * Brand palette derived from the 자취방 키우기 logo (deep green roof, sage green
 * furniture, warm cream walls, terracotta plant pot).
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  // 채도·대비 기준: 본문 글자는 배경 대비 4.5:1 이상(WCAG AA), 아이콘·강조색은 3:1 이상.
  // 다크모드 강조색은 라이트보다 채도를 낮춰(≈50%) 어두운 배경에서 번져 보이지 않게 한다.
  light: {
    text: '#22281F',
    textSecondary: '#5F6356',
    background: '#FAF7F1', // 크림 벽
    backgroundElement: '#F2ECE1', // 밝은 우드 카드
    backgroundSelected: '#E5DCCB',
    accent: '#2F5446', // 짙은 초록 지붕
    accentSoft: '#E1E9DA',
    onAccent: '#FFFFFF',
    // 큰 강조 카드(홈 요약 등) 배경. 다크에서는 밝은 세이지 대신 짙은 초록을 써서 눈부심을 줄인다.
    surfaceAccent: '#2F5446',
    onSurfaceAccent: '#FFFFFF',
    warm: '#B5673F', // 테라코타 화분: 강조·하이라이트 (아이콘·큰 글자용)
    success: '#3F6B2A',
    danger: '#A83A34',
    border: 'rgba(34,40,31,0.12)',
  },
  dark: {
    text: '#F1EFE7',
    textSecondary: '#B3B0A2',
    background: '#161A16', // 불 끈 저녁의 자취방
    backgroundElement: '#212621',
    backgroundSelected: '#2C332B',
    accent: '#9DB892',
    accentSoft: '#28342A',
    onAccent: '#141A14',
    surfaceAccent: '#2E4A3D',
    onSurfaceAccent: '#F1EFE7',
    warm: '#D49A7A',
    success: '#97BD7C',
    danger: '#D4837A',
    border: 'rgba(241,239,231,0.12)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Fixed brand hues used for furniture/plant illustrations, independent of theme. */
export const Brand = {
  deepGreen: '#2F5446',
  sage: '#9CAE86',
  cream: '#F1EADD',
  terracotta: '#D9A672',
  bark: '#5B7A63',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
