import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AppSplash } from '@/components/app-splash';
import AppTabs from '@/components/app-tabs';
import { AuthScreen } from '@/components/auth-screen';
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

  if (initializing) return null;

  return session ? <AppTabs /> : <AuthScreen />;
}
