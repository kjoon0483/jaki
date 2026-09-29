import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth-state';

const MIN_PASSWORD_LEN = 8;
const PASSWORD_SPECIAL_RE = /[!-/:-@[-`{-~]/;

type Status = 'checking' | 'ready' | 'invalid' | 'done';

/** Landing screen for the password-recovery email link. */
export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { completePasswordReset } = useAuth();

  const [status, setStatus] = useState<Status>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setStatus((s) => (s === 'checking' ? (data.session ? 'ready' : 'invalid') : s));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) setStatus('ready');
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  function validate() {
    if (!password) return '새 비밀번호를 입력해주세요.';
    if (password.length < MIN_PASSWORD_LEN) return `${MIN_PASSWORD_LEN}자 이상 입력해주세요.`;
    if (!PASSWORD_SPECIAL_RE.test(password)) return '특수문자를 1자 이상 포함해주세요.';
    if (confirmPassword !== password) return '비밀번호가 일치하지 않아요.';
    return null;
  }

  async function handleSubmit() {
    const v = validate();
    setFieldError(v);
    if (v) return;

    setFormError(null);
    setLoading(true);
    const result = await completePasswordReset(password);
    setLoading(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setStatus('done');
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {status === 'checking' && (
              <View style={styles.centerBox}>
                <ActivityIndicator color={theme.accent} />
              </View>
            )}

            {status === 'invalid' && (
              <View style={styles.centerBox}>
                <Text style={[styles.title, { color: theme.text }]}>링크가 유효하지 않아요</Text>
                <Text style={[styles.helper, { color: theme.textSecondary }]}>
                  재설정 링크가 만료됐거나 이미 사용됐어요. 로그인 화면에서 다시 요청해주세요.
                </Text>
                <Pressable
                  style={[styles.submitBtn, { backgroundColor: theme.accent }]}
                  onPress={() => router.replace('/')}>
                  <Text style={[styles.submitText, { color: theme.onAccent }]}>로그인 화면으로</Text>
                </Pressable>
              </View>
            )}

            {status === 'done' && (
              <View style={styles.centerBox}>
                <Text style={[styles.title, { color: theme.text }]}>비밀번호가 변경됐어요</Text>
                <Text style={[styles.helper, { color: theme.textSecondary }]}>새 비밀번호로 로그인해주세요.</Text>
                <Pressable
                  style={[styles.submitBtn, { backgroundColor: theme.accent }]}
                  onPress={() => router.replace('/')}>
                  <Text style={[styles.submitText, { color: theme.onAccent }]}>로그인 화면으로</Text>
                </Pressable>
              </View>
            )}

            {status === 'ready' && (
              <>
                <Text style={[styles.title, { color: theme.text }]}>새 비밀번호 설정</Text>
                <View style={styles.field}>
                  <View
                    style={[
                      styles.inputRow,
                      { backgroundColor: theme.background, borderColor: fieldError ? theme.danger : theme.border },
                    ]}>
                    <Ionicons name="lock-closed-outline" size={16} color={theme.textSecondary} />
                    <TextInput
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        setFieldError(null);
                      }}
                      placeholder="새 비밀번호"
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={[styles.input, { color: theme.text }]}
                    />
                    <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={16}
                        color={theme.textSecondary}
                      />
                    </Pressable>
                  </View>
                  <Text style={[styles.fieldHint, { color: theme.textSecondary }]}>
                    {MIN_PASSWORD_LEN}자 이상, 특수문자를 포함해 입력해주세요.
                  </Text>
                </View>

                <View style={styles.field}>
                  <View
                    style={[
                      styles.inputRow,
                      { backgroundColor: theme.background, borderColor: fieldError ? theme.danger : theme.border },
                    ]}>
                    <Ionicons name="lock-closed-outline" size={16} color={theme.textSecondary} />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={(t) => {
                        setConfirmPassword(t);
                        setFieldError(null);
                      }}
                      placeholder="새 비밀번호 확인"
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={[styles.input, { color: theme.text }]}
                    />
                  </View>
                  {fieldError ? <Text style={[styles.fieldError, { color: theme.danger }]}>{fieldError}</Text> : null}
                </View>

                {formError ? <Text style={[styles.notice, { color: theme.danger }]}>{formError}</Text> : null}

                <Pressable
                  style={[styles.submitBtn, { backgroundColor: theme.accent }, loading && styles.disabled]}
                  disabled={loading}
                  onPress={handleSubmit}>
                  {loading ? (
                    <ActivityIndicator color={theme.onAccent} />
                  ) : (
                    <Text style={[styles.submitText, { color: theme.onAccent }]}>비밀번호 변경</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  card: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  centerBox: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  helper: { fontSize: 12.5, lineHeight: 18, textAlign: 'center' },
  field: { gap: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 46,
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  input: { flex: 1, fontSize: 14, height: '100%' },
  fieldError: { fontSize: 11, marginLeft: 2 },
  fieldHint: { fontSize: 11, marginLeft: 2 },
  notice: { fontSize: 12, textAlign: 'center' },
  submitBtn: {
    height: 46,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  disabled: { opacity: 0.6 },
  submitText: { fontSize: 14, fontWeight: '600' },
});
