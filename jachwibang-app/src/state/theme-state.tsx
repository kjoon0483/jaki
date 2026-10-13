import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform, useColorScheme as useSystemColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

const STORAGE_KEY = 'jachwibang.themePreference';

interface ThemePreferenceValue {
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
  /** The scheme actually in effect after applying the preference. */
  scheme: ResolvedScheme;
}

const ThemePreferenceContext = createContext<ThemePreferenceValue | null>(null);

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const system = useSystemColorScheme();
  // Every launch starts in light mode; a choice made in 마이페이지 lasts until the app is restarted.
  const [preference, setPreferenceState] = useState<ThemePreference>('light');

  // Clears any choice saved by older versions, which restored dark mode on every launch.
  useEffect(() => {
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  // On native, also override the app-level appearance so native UI (tab bar,
  // alerts, keyboard) follows the in-app choice rather than the OS setting.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }, [preference]);

  const value = useMemo<ThemePreferenceValue>(
    () => ({
      preference,
      setPreference: setPreferenceState,
      scheme: preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference,
    }),
    [preference, system]
  );

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  return ctx;
}
