import { DarkTheme, DefaultTheme, Slot, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AppSplash } from '@/components/app-splash';
import AppTabs from '@/components/navigation/app-tabs';
import { AuthScreen } from '@/components/auth/auth-screen';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/state/auth-state';
import { BudgetProvider } from '@/state/budget-state';
import { ThemePreferenceProvider } from '@/state/theme-state';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <ThemedRoot />
    </ThemePreferenceProvider>
  );
}

function ThemedRoot() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootContent />
        <AppSplash />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootContent() {
  const { session, initializing } = useAuth();
  const pathname = usePathname();

  // The password-recovery email link lands here; render it regardless of
  // auth state, since the link itself carries a temporary recovery session.
  if (pathname.startsWith('/reset-password')) return <Slot />;

  if (initializing) return null;

  return session ? (
    <BudgetProvider>
      <AppTabs />
    </BudgetProvider>
  ) : (
    <AuthScreen />
  );
}
