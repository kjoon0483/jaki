import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았어요. .env 파일을 만들어주세요.'
  );
}

// 개발 서버(localhost)를 웹에서 열 때는 로그인을 탭이 열려 있는 동안만 기억한다(새로고침은 유지).
// 서버를 껐다 켜고 새 탭으로 열면 로그인 화면부터 나와서, 가입·로그인 흐름을 매번 확인할 수 있다.
// 배포된 주소(Vercel)와 휴대폰 앱은 예전처럼 오래 유지된다.
const authStorage =
  Platform.OS === 'web' && __DEV__ && typeof window !== 'undefined' && window.sessionStorage
    ? {
        getItem: (k: string) => Promise.resolve(window.sessionStorage.getItem(k)),
        setItem: (k: string, v: string) => Promise.resolve(window.sessionStorage.setItem(k, v)),
        removeItem: (k: string) => Promise.resolve(window.sessionStorage.removeItem(k)),
      }
    : AsyncStorage;

// createClient throws on an empty/invalid URL, so fall back to a placeholder
// that keeps the app bootable (auth calls will simply fail) until .env is set.
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    // Remember the login across refreshes and app restarts (stored via AsyncStorage / localStorage on web).
    persistSession: true,
    // Required so the app can pick up the session from a signup-confirmation
    // or password-recovery email link when it lands back in the app.
    detectSessionInUrl: true,
  },
});

// On phones, only refresh the saved login token while the app is open, so a session
// restored after a long time in the background is renewed as soon as the app returns.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
