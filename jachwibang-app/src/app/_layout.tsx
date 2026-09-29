import { DarkTheme, DefaultTheme, Slot, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AppSplash } from '@/components/app-splash';
import AppTabs from '@/components/navigation/app-tabs';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AppStateProvider } from '@/state/app-state';
import { AuthProvider, useAuth } from '@/state/auth-state';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AppStateProvider>
          <RootContent />
          <AppSplash />
        </AppStateProvider>
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

  return session ? <AppTabs /> : <AuthScreen />;
}
