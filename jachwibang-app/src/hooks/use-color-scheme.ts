import { ResolvedScheme, useThemePreference } from '@/state/theme-state';

/** The app's effective color scheme (system setting, or the user's in-app override). */
export function useColorScheme(): ResolvedScheme {
  return useThemePreference().scheme;
}
