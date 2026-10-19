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

// 웹(브라우저)에서는 로그인 화면의 '로그인 상태 유지'를 켠 경우에만 로그인을 오래 기억한다(localStorage).
// 끄면(기본) 탭이 열려 있는 동안만 기억해서(새로고침은 유지), 새 탭·다시 열기 때는 로그인 화면부터 나온다.
// 휴대폰 앱(네이티브)은 예전처럼 오래 유지된다.
const KEEP_KEY = 'jaki.keepLogin';
const hasWebStorage = Platform.OS === 'web' && typeof window !== 'undefined' && !!window.sessionStorage && !!window.localStorage;

export function getKeepLogin() {
  try {
    return hasWebStorage && window.localStorage.getItem(KEEP_KEY) === '1';
  } catch {
    return false;
  }
}

export function setKeepLogin(on: boolean) {
  try {
    if (!hasWebStorage) return;
    if (on) window.localStorage.setItem(KEEP_KEY, '1');
    else window.localStorage.removeItem(KEEP_KEY);
  } catch {
    // 저장소를 못 쓰면 그냥 탭 안에서만 기억한다
  }
}

const authStorage = hasWebStorage
  ? {
      getItem: (k: string) => {
        const tab = window.sessionStorage.getItem(k);
        if (tab !== null) return Promise.resolve(tab);
        if (getKeepLogin()) return Promise.resolve(window.localStorage.getItem(k));
        window.localStorage.removeItem(k); // 예전에 오래 저장된 로그인이 남아 있으면 지운다
        return Promise.resolve(null);
      },
      setItem: (k: string, v: string) => {
        if (getKeepLogin()) {
          window.localStorage.setItem(k, v);
          window.sessionStorage.removeItem(k);
        } else {
          window.sessionStorage.setItem(k, v);
          window.localStorage.removeItem(k);
        }
        return Promise.resolve();
      },
      removeItem: (k: string) => {
        window.sessionStorage.removeItem(k);
        window.localStorage.removeItem(k);
        return Promise.resolve();
      },
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
