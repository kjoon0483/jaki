/**
 * Brand palette derived from the 자취방 키우기 logo (deep green roof, sage green
 * furniture, warm cream walls, terracotta plant pot).
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#22281F',
    textSecondary: '#6E6C61',
    background: '#FAF8F3',
    backgroundElement: '#F1EADD',
    backgroundSelected: '#E6DCC6',
    accent: '#33544A',
    accentSoft: '#E4EBDF',
    onAccent: '#FFFFFF',
    success: '#3B6D11',
    danger: '#A3462D',
    border: 'rgba(34,40,31,0.12)',
  },
  dark: {
    text: '#F3F1E9',
    textSecondary: '#B6B2A2',
    background: '#171A15',
    backgroundElement: '#232821',
    backgroundSelected: '#2E352B',
    accent: '#9CAE86',
    accentSoft: '#2B3628',
    onAccent: '#171A15',
    success: '#8FBE5E',
    danger: '#E38A6E',
    border: 'rgba(243,241,233,0.12)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Fixed brand hues used for furniture/plant illustrations, independent of theme. */
export const Brand = {
  deepGreen: '#33544A',
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
