/**
 * Brand palette: cool cerulean blue UI (the logo's terracotta plant pot stays as the warm accent).
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  // 시원한 세룰리안(cerulean) 블루 계열.
  // 채도·대비 기준: 본문 글자는 배경 대비 4.5:1 이상(WCAG AA), 아이콘·강조색은 3:1 이상.
  // 다크모드 강조색은 라이트보다 채도를 낮춰 어두운 배경에서 번져 보이지 않게 한다.
  light: {
    text: '#14232E',
    textSecondary: '#52646F',
    background: '#F4F9FC', // 맑은 하늘빛 벽
    backgroundElement: '#E7F0F6', // 연한 하늘색 카드
    backgroundSelected: '#D2E3EE',
    accent: '#0B6FA4', // 세룰리안 블루
    accentSoft: '#DCEBF5',
    onAccent: '#FFFFFF',
    // 큰 강조 카드(홈 요약 등) 배경. 다크에서는 밝은 하늘색 대신 짙은 블루를 써서 눈부심을 줄인다.
    surfaceAccent: '#0B6FA4',
    onSurfaceAccent: '#FFFFFF',
    warm: '#B5673F', // 테라코타 화분: 강조·하이라이트 (아이콘·큰 글자용)
    success: '#2E7A4F',
    danger: '#A83A34',
    // 가계부 금액 색: 수입은 파랑, 지출은 빨강 (가계부 관례)
    income: '#2D62A8',
    expense: '#B23A32',
    border: 'rgba(20,35,46,0.12)',
  },
  dark: {
    text: '#EAF2F7',
    textSecondary: '#A6B6C0',
    background: '#0F171D', // 불 끈 저녁의 자취방
    backgroundElement: '#18232B',
    backgroundSelected: '#223340',
    accent: '#7FBCE3',
    accentSoft: '#1C3040',
    onAccent: '#0B141A',
    surfaceAccent: '#14486A',
    onSurfaceAccent: '#EAF2F7',
    warm: '#D49A7A',
    success: '#8CC9A2',
    danger: '#D4837A',
    income: '#8DB2E0',
    expense: '#E08A80',
    border: 'rgba(234,242,247,0.12)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
/** Width of the app column on wide (web) screens, so it reads like a phone app instead of stretching. */
export const MaxContentWidth = 480;
