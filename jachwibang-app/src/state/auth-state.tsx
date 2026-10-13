import { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

import { isMissingSafetyFeature, isNicknameAvailable, SAFETY_MIGRATION_MESSAGE } from '@/lib/safety';
import { supabase } from '@/lib/supabase';

interface AuthValue {
  session: Session | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, nickname: string) => Promise<{ error: string | null }>;
  resendSignUpCode: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  completePasswordReset: (newPassword: string) => Promise<{ error: string | null }>;
  updateNickname: (nickname: string) => Promise<{ error: string | null }>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
  /** Permanently deletes the account and all of its data, then signs out. */
  deleteAccount: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthValue | null>(null);

export const NICKNAME_TAKEN = '이미 다른 사람이 쓰는 닉네임이에요.';

function isNicknameTaken(message: string) {
  return /profiles_display_name_unique_idx|duplicate key/i.test(message);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, nickname: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname }, emailRedirectTo: Linking.createURL('/') },
    });
    return { error: error?.message ?? null };
  }

  async function resendSignUpCode(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: Linking.createURL('/') },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL('reset-password'),
    });
    return { error: error?.message ?? null };
  }

  async function completePasswordReset(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    // The recovery link signs the user in via a temporary session;
    // sign out so they land back on the login form with their new password.
    await supabase.auth.signOut();
    return { error: error?.message ?? null };
  }

  // The nickname lives in the auth user's metadata (shown on My Page / Home) and is mirrored into
  // `profiles.display_name`, which is what other people see on community posts.
  // The profile is saved first: it holds the uniqueness rule, so a taken name fails before the metadata changes.
  async function updateNickname(nickname: string) {
    const name = nickname.trim();
    const userId = session?.user.id;
    if (!userId) return { error: '로그인이 필요해요.' };
    if (!(await isNicknameAvailable(name))) return { error: NICKNAME_TAKEN };
    const { error: profileError } = await supabase.from('profiles').update({ display_name: name }).eq('id', userId);
    if (profileError) return { error: isNicknameTaken(profileError.message) ? NICKNAME_TAKEN : profileError.message };
    const { error } = await supabase.auth.updateUser({ data: { nickname: name } });
    return { error: error?.message ?? null };
  }

  async function changePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  }

  async function deleteAccount() {
    const { error } = await supabase.rpc('delete_my_account');
    if (error) return { error: isMissingSafetyFeature(error.message) ? SAFETY_MIGRATION_MESSAGE : error.message };
    // The user no longer exists on the server, so only clear the saved login on this device.
    await supabase.auth.signOut({ scope: 'local' });
    return { error: null };
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        initializing,
        signIn,
        signUp,
        resendSignUpCode,
        signOut,
        requestPasswordReset,
        completePasswordReset,
        updateNickname,
        changePassword,
        deleteAccount,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
