import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았어요. .env 파일을 만들어주세요.'
  );
}

// createClient throws on an empty/invalid URL, so fall back to a placeholder
// that keeps the app bootable (auth calls will simply fail) until .env is set.
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    // Always start on the login screen instead of restoring a previous session.
    persistSession: false,
    // Required so the app can pick up the session from a signup-confirmation
    // or password-recovery email link when it lands back in the app.
    detectSessionInUrl: true,
  },
});
