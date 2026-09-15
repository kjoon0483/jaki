import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AppSplash } from '@/components/app-splash';
import AppTabs from '@/components/app-tabs';
import { AppStateProvider } from '@/state/app-state';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppStateProvider>
        <AppTabs />
        <AppSplash />
      </AppStateProvider>
    </ThemeProvider>
  );
}
