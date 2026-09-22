import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
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

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/state/auth-state';

type AuthView = 'login' | 'signup' | 'signup-confirm' | 'forgot-request' | 'forgot-reset';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LEN = 6;

function friendlyError(message: string) {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요.';
  if (m.includes('already registered') || m.includes('already exists')) return '이미 가입된 이메일이에요.';
  if (m.includes('password should be at least')) return `비밀번호는 ${MIN_PASSWORD_LEN}자 이상이어야 해요.`;
  if (m.includes('email address') && m.includes('invalid')) return '올바른 이메일 형식이 아니에요.';
  if (m.includes('email not confirmed')) return '이메일 인증이 필요해요. 메일함을 확인해주세요.';
  if (m.includes('token has expired') || m.includes('invalid otp') || m.includes('otp expired'))
    return '인증번호가 올바르지 않거나 만료됐어요. 다시 요청해주세요.';
  if (m.includes('network')) return '네트워크 연결을 확인해주세요.';
  return message;
}

export function AuthScreen() {
  const theme = useTheme();
  const { signIn, signUp, confirmSignUp, resendSignUpCode, requestPasswordReset, confirmPasswordReset } = useAuth();

  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupCode, setSignupCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  type FieldErrors = { email?: string; password?: string; confirm?: string; code?: string };
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignup = view === 'signup';

  function clearMessages() {
    setFormError(null);
    setNotice(null);
    setFieldErrors({});
  }

  function goTo(next: AuthView) {
    clearMessages();
    if (next === 'login' || next === 'signup') {
      setPassword('');
      setConfirmPassword('');
      setSignupCode('');
    }
    setView(next);
  }

  function validateLoginSignup() {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = '이메일을 입력해주세요.';
    else if (!EMAIL_RE.test(email.trim())) next.email = '올바른 이메일 형식이 아니에요.';

    if (!password) next.password = '비밀번호를 입력해주세요.';
    else if (isSignup && password.length < MIN_PASSWORD_LEN) next.password = `${MIN_PASSWORD_LEN}자 이상 입력해주세요.`;

    if (isSignup && confirmPassword !== password) next.confirm = '비밀번호가 일치하지 않아요.';

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateSignupConfirm() {
    const next: FieldErrors = {};
    if (!signupCode.trim()) next.code = '인증번호를 입력해주세요.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateForgotRequest() {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = '이메일을 입력해주세요.';
    else if (!EMAIL_RE.test(email.trim())) next.email = '올바른 이메일 형식이 아니에요.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateForgotReset() {
    const next: FieldErrors = {};
    if (!resetCode.trim()) next.code = '인증번호를 입력해주세요.';
    if (!newPassword) next.password = '새 비밀번호를 입력해주세요.';
    else if (newPassword.length < MIN_PASSWORD_LEN) next.password = `${MIN_PASSWORD_LEN}자 이상 입력해주세요.`;
    if (confirmNewPassword !== newPassword) next.confirm = '비밀번호가 일치하지 않아요.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    setFormError(null);
    setNotice(null);

    if (view === 'login' || view === 'signup') {
      if (!validateLoginSignup()) return;
      setLoading(true);
      const result = isSignup ? await signUp(email.trim(), password) : await signIn(email.trim(), password);
      setLoading(false);
      if (result.error) {
        setFormError(friendlyError(result.error));
        return;
      }
      if (isSignup) setView('signup-confirm');
      return;
    }

    if (view === 'signup-confirm') {
      if (!validateSignupConfirm()) return;
      setLoading(true);
      const result = await confirmSignUp(email.trim(), signupCode.trim());
      setLoading(false);
      if (result.error) {
        setFormError(friendlyError(result.error));
        return;
      }
      setSignupCode('');
      return;
    }

    if (view === 'forgot-request') {
      if (!validateForgotRequest()) return;
      setLoading(true);
      const result = await requestPasswordReset(email.trim());
      setLoading(false);
      if (result.error) {
        setFormError(friendlyError(result.error));
        return;
      }
      setNotice(null);
      setView('forgot-reset');
      return;
    }

    if (view === 'forgot-reset') {
      if (!validateForgotReset()) return;
      setLoading(true);
      const result = await confirmPasswordReset(email.trim(), resetCode.trim(), newPassword);
      setLoading(false);
      if (result.error) {
        setFormError(friendlyError(result.error));
        return;
      }
      setResetCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setNotice('비밀번호가 변경됐어요. 새 비밀번호로 로그인해주세요.');
      setView('login');
    }
  }

  async function handleResendCode() {
    setFormError(null);
    setLoading(true);
    const result = await requestPasswordReset(email.trim());
    setLoading(false);
    setNotice(result.error ? null : '인증번호를 다시 보냈어요.');
    if (result.error) setFormError(friendlyError(result.error));
  }

  async function handleResendSignupCode() {
    setFormError(null);
    setLoading(true);
    const result = await resendSignUpCode(email.trim());
    setLoading(false);
    setNotice(result.error ? null : '인증번호를 다시 보냈어요.');
    if (result.error) setFormError(friendlyError(result.error));
  }

  const title =
    view === 'signup-confirm'
      ? '이메일 인증'
      : view === 'forgot-request' || view === 'forgot-reset'
        ? '비밀번호 재설정'
        : isSignup
          ? '새 계정 만들기'
          : '다시 오신 걸 환영해요';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image style={styles.logo} source={require('@/assets/images/splash-logo.png')} contentFit="contain" />
            <Text style={[styles.title, { color: theme.text }]}>자취방 키우기</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{title}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {view === 'login' || view === 'signup' ? (
              <View style={styles.tabRow}>
                <Pressable
                  style={[styles.tabBtn, view === 'login' && { backgroundColor: theme.background }]}
                  onPress={() => view !== 'login' && goTo('login')}>
                  <Text style={[styles.tabText, { color: view === 'login' ? theme.accent : theme.textSecondary }]}>
                    로그인
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.tabBtn, view === 'signup' && { backgroundColor: theme.background }]}
                  onPress={() => view !== 'signup' && goTo('signup')}>
                  <Text style={[styles.tabText, { color: view === 'signup' ? theme.accent : theme.textSecondary }]}>
                    회원가입
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.backRow}
                onPress={() =>
                  goTo(view === 'forgot-reset' ? 'forgot-request' : view === 'signup-confirm' ? 'signup' : 'login')
                }
                hitSlop={6}>
                <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
                <Text style={[styles.backText, { color: theme.textSecondary }]}>
                  {view === 'forgot-reset'
                    ? '이메일 다시 입력'
                    : view === 'signup-confirm'
                      ? '회원가입으로 돌아가기'
                      : '로그인으로 돌아가기'}
                </Text>
              </Pressable>
            )}

            {!isSupabaseConfigured && (
              <Text style={[styles.notice, { color: theme.danger }]}>
                Supabase 연결이 아직 설정되지 않았어요. .env 파일을 확인해주세요.
              </Text>
            )}

            {view === 'forgot-request' && (
              <Text style={[styles.helper, { color: theme.textSecondary }]}>
                가입할 때 사용한 이메일을 입력하면 인증번호를 보내드려요.
              </Text>
            )}

            {view === 'signup-confirm' && (
              <Text style={[styles.helper, { color: theme.textSecondary }]}>
                <Text style={{ fontWeight: '600', color: theme.text }}>{email}</Text> 로 인증번호를 보냈어요. 메일함을
                확인해서 6자리 숫자를 입력해주세요.
              </Text>
            )}

            {view === 'forgot-reset' && (
              <Text style={[styles.helper, { color: theme.textSecondary }]}>
                <Text style={{ fontWeight: '600', color: theme.text }}>{email}</Text> 로 받은 인증번호와 새
                비밀번호를 입력해주세요.
              </Text>
            )}

            {(view === 'login' || view === 'signup' || view === 'forgot-request') && (
              <View style={styles.field}>
                <View
                  style={[
                    styles.inputRow,
                    { backgroundColor: theme.background, borderColor: fieldErrors.email ? theme.danger : theme.border },
                  ]}>
                  <Ionicons name="mail-outline" size={16} color={theme.textSecondary} />
                  <TextInput
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (fieldErrors.email) setFieldErrors((e) => ({ ...e, email: undefined }));
                    }}
                    placeholder="이메일"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    style={[styles.input, { color: theme.text }]}
                  />
                </View>
                {fieldErrors.email ? <Text style={[styles.fieldError, { color: theme.danger }]}>{fieldErrors.email}</Text> : null}
              </View>
            )}

            {(view === 'login' || view === 'signup') && (
              <>
                <View style={styles.field}>
                  <View
                    style={[
                      styles.inputRow,
                      { backgroundColor: theme.background, borderColor: fieldErrors.password ? theme.danger : theme.border },
                    ]}>
                    <Ionicons name="lock-closed-outline" size={16} color={theme.textSecondary} />
                    <TextInput
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: undefined }));
                      }}
                      placeholder="비밀번호"
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={[styles.input, { color: theme.text }]}
                    />
                    <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color={theme.textSecondary} />
                    </Pressable>
                  </View>
                  {fieldErrors.password ? (
                    <Text style={[styles.fieldError, { color: theme.danger }]}>{fieldErrors.password}</Text>
                  ) : isSignup ? (
                    <Text style={[styles.fieldHint, { color: theme.textSecondary }]}>
                      {MIN_PASSWORD_LEN}자 이상으로 입력해주세요.
                    </Text>
                  ) : null}
                </View>

                {view === 'login' && (
                  <Pressable onPress={() => goTo('forgot-request')} hitSlop={6} style={styles.forgotLink}>
                    <Text style={[styles.forgotText, { color: theme.accent }]}>비밀번호를 잊으셨나요?</Text>
                  </Pressable>
                )}

                {isSignup && (
                  <View style={styles.field}>
                    <View
                      style={[
                        styles.inputRow,
                        { backgroundColor: theme.background, borderColor: fieldErrors.confirm ? theme.danger : theme.border },
                      ]}>
                      <Ionicons name="lock-closed-outline" size={16} color={theme.textSecondary} />
                      <TextInput
                        value={confirmPassword}
                        onChangeText={(t) => {
                          setConfirmPassword(t);
                          if (fieldErrors.confirm) setFieldErrors((e) => ({ ...e, confirm: undefined }));
                        }}
                        placeholder="비밀번호 확인"
                        placeholderTextColor={theme.textSecondary}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        style={[styles.input, { color: theme.text }]}
                      />
                    </View>
                    {fieldErrors.confirm ? <Text style={[styles.fieldError, { color: theme.danger }]}>{fieldErrors.confirm}</Text> : null}
                  </View>
                )}
              </>
            )}

            {view === 'signup-confirm' && (
              <>
                <View style={styles.field}>
                  <View
                    style={[
                      styles.inputRow,
                      { backgroundColor: theme.background, borderColor: fieldErrors.code ? theme.danger : theme.border },
                    ]}>
                    <Ionicons name="keypad-outline" size={16} color={theme.textSecondary} />
                    <TextInput
                      value={signupCode}
                      onChangeText={(t) => {
                        setSignupCode(t);
                        if (fieldErrors.code) setFieldErrors((e) => ({ ...e, code: undefined }));
                      }}
                      placeholder="인증번호 6자리"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                      style={[styles.input, { color: theme.text }]}
                    />
                  </View>
                  {fieldErrors.code ? <Text style={[styles.fieldError, { color: theme.danger }]}>{fieldErrors.code}</Text> : null}
                </View>

                <Pressable onPress={handleResendSignupCode} hitSlop={6} disabled={loading}>
                  <Text style={[styles.forgotText, { color: theme.accent }]}>인증번호 재전송</Text>
                </Pressable>
              </>
            )}

            {view === 'forgot-reset' && (
              <>
                <View style={styles.field}>
                  <View
                    style={[
                      styles.inputRow,
                      { backgroundColor: theme.background, borderColor: fieldErrors.code ? theme.danger : theme.border },
                    ]}>
                    <Ionicons name="keypad-outline" size={16} color={theme.textSecondary} />
                    <TextInput
                      value={resetCode}
                      onChangeText={(t) => {
                        setResetCode(t);
                        if (fieldErrors.code) setFieldErrors((e) => ({ ...e, code: undefined }));
                      }}
                      placeholder="인증번호 6자리"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                      style={[styles.input, { color: theme.text }]}
                    />
                  </View>
                  {fieldErrors.code ? <Text style={[styles.fieldError, { color: theme.danger }]}>{fieldErrors.code}</Text> : null}
                </View>

                <View style={styles.field}>
                  <View
                    style={[
                      styles.inputRow,
                      { backgroundColor: theme.background, borderColor: fieldErrors.password ? theme.danger : theme.border },
                    ]}>
                    <Ionicons name="lock-closed-outline" size={16} color={theme.textSecondary} />
                    <TextInput
                      value={newPassword}
                      onChangeText={(t) => {
                        setNewPassword(t);
                        if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: undefined }));
                      }}
                      placeholder="새 비밀번호"
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={[styles.input, { color: theme.text }]}
                    />
                    <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color={theme.textSecondary} />
                    </Pressable>
                  </View>
                  {fieldErrors.password ? (
                    <Text style={[styles.fieldError, { color: theme.danger }]}>{fieldErrors.password}</Text>
                  ) : (
                    <Text style={[styles.fieldHint, { color: theme.textSecondary }]}>
                      {MIN_PASSWORD_LEN}자 이상으로 입력해주세요.
                    </Text>
                  )}
                </View>

                <View style={styles.field}>
                  <View
                    style={[
                      styles.inputRow,
                      { backgroundColor: theme.background, borderColor: fieldErrors.confirm ? theme.danger : theme.border },
                    ]}>
                    <Ionicons name="lock-closed-outline" size={16} color={theme.textSecondary} />
                    <TextInput
                      value={confirmNewPassword}
                      onChangeText={(t) => {
                        setConfirmNewPassword(t);
                        if (fieldErrors.confirm) setFieldErrors((e) => ({ ...e, confirm: undefined }));
                      }}
                      placeholder="새 비밀번호 확인"
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={[styles.input, { color: theme.text }]}
                    />
                  </View>
                  {fieldErrors.confirm ? <Text style={[styles.fieldError, { color: theme.danger }]}>{fieldErrors.confirm}</Text> : null}
                </View>

                <Pressable onPress={handleResendCode} hitSlop={6} disabled={loading}>
                  <Text style={[styles.forgotText, { color: theme.accent }]}>인증번호 재전송</Text>
                </Pressable>
              </>
            )}

            {formError ? <Text style={[styles.notice, { color: theme.danger }]}>{formError}</Text> : null}
            {notice ? <Text style={[styles.notice, { color: theme.success }]}>{notice}</Text> : null}

            <Pressable
              style={[styles.submitBtn, { backgroundColor: theme.accent }, loading && styles.disabled]}
              disabled={loading}
              onPress={handleSubmit}>
              {loading ? (
                <ActivityIndicator color={theme.onAccent} />
              ) : (
                <Text style={[styles.submitText, { color: theme.onAccent }]}>
                  {view === 'forgot-request'
                    ? '인증번호 받기'
                    : view === 'forgot-reset'
                      ? '비밀번호 변경'
                      : view === 'signup-confirm'
                        ? '인증하기'
                        : isSignup
                          ? '회원가입'
                          : '로그인'}
                </Text>
              )}
            </Pressable>

            {(view === 'login' || view === 'signup') && (
              <Pressable onPress={() => goTo(isSignup ? 'login' : 'signup')} hitSlop={6}>
                <Text style={[styles.switchText, { color: theme.textSecondary }]}>
                  {isSignup ? '이미 계정이 있으신가요? ' : '계정이 없으신가요? '}
                  <Text style={{ color: theme.accent, fontWeight: '600' }}>{isSignup ? '로그인' : '회원가입'}</Text>
                </Text>
              </Pressable>
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
    gap: Spacing.four,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  header: { alignItems: 'center', gap: Spacing.one },
  logo: { width: 96, height: 84, marginBottom: Spacing.two },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 12.5 },
  card: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: Spacing.two,
    padding: 3,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Spacing.two - 2,
    alignItems: 'center',
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 12.5 },
  helper: { fontSize: 12, lineHeight: 17 },
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
  forgotLink: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 12, fontWeight: '600' },
  notice: { fontSize: 12, textAlign: 'center' },
  submitBtn: {
    height: 46,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  disabled: { opacity: 0.6 },
  submitText: { fontSize: 14, fontWeight: '600' },
  switchText: { fontSize: 12, textAlign: 'center' },
});
