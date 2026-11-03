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

import { LegalSheet } from '@/components/legal-sheet';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { LegalDoc, PRIVACY, TERMS } from '@/data/legal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { MAX_NICKNAME_LEN, MIN_NICKNAME_LEN, MIN_PASSWORD_LEN, PASSWORD_SPECIAL_RE } from '@/lib/account-rules';
import { isNicknameAvailable } from '@/lib/safety';
import { getKeepLogin, isSupabaseConfigured, setKeepLogin } from '@/lib/supabase';
import { NICKNAME_TAKEN, useAuth } from '@/state/auth-state';

type AuthView = 'login' | 'signup' | 'signup-sent' | 'forgot-request' | 'forgot-sent';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Soft dark gray behind the logo in dark mode: a step lighter than the page so the house reads clearly. */
const DARK_LOGO_TILE = '#3A3D3A';

const FEATURES = [
  { icon: 'cube-outline', title: '3D로 방 꾸미기', sub: '가구를 배치하고 1인칭으로 걸어 다녀요' },
  { icon: 'wallet-outline', title: '자취 가계부', sub: '한 달 예산과 지출을 한눈에 봐요' },
  { icon: 'people-outline', title: '자취생 커뮤니티', sub: '꾸민 방을 자랑하고 꿀팁을 나눠요' },
] as const;

function friendlyError(message: string) {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요.';
  if (m.includes('already registered') || m.includes('already exists')) return '이미 가입된 이메일이에요.';
  if (m.includes('password should be at least')) return `비밀번호는 ${MIN_PASSWORD_LEN}자 이상이어야 해요.`;
  if (m.includes('email address') && m.includes('invalid')) return '올바른 이메일 형식이 아니에요.';
  if (m.includes('email not confirmed')) return '이메일 인증이 필요해요. 메일함을 확인해주세요.';
  if (m.includes('network')) return '네트워크 연결을 확인해주세요.';
  return message;
}

export function AuthScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { signIn, signUp, resendSignUpCode, requestPasswordReset } = useAuth();

  // 3D 체험 페이지(sim.html)의 '가입하고 내 방 만들기'는 /?signup=1 로 와서 회원가입부터 연다.
  // 이미 체험해 본 사람이라 앱 소개는 건너뛰고 입력 칸이 바로 보이게 한다.
  const [fromTrial] = useState(
    () => Platform.OS === 'web' && new URLSearchParams(window.location.search).get('signup') === '1'
  );
  const [view, setView] = useState<AuthView>(fromTrial ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // 웹에서만 보인다. 켜면 브라우저를 닫았다 다시 열어도 로그인이 유지된다.
  const [keepLogin, setKeepLoginState] = useState(() => getKeepLogin());

  type FieldErrors = { email?: string; nickname?: string; password?: string; confirm?: string; terms?: string };
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);

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
      setNickname('');
      setAgreeTerms(false);
    }
    setView(next);
  }

  function validateLoginSignup() {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = '이메일을 입력해주세요.';
    else if (!EMAIL_RE.test(email.trim())) next.email = '올바른 이메일 형식이 아니에요.';

    if (isSignup) {
      if (!nickname.trim()) next.nickname = '닉네임을 입력해주세요.';
      else if (nickname.trim().length < MIN_NICKNAME_LEN || nickname.trim().length > MAX_NICKNAME_LEN)
        next.nickname = `닉네임은 ${MIN_NICKNAME_LEN}~${MAX_NICKNAME_LEN}자로 입력해주세요.`;
    }

    if (!password) next.password = '비밀번호를 입력해주세요.';
    else if (isSignup && password.length < MIN_PASSWORD_LEN)
      next.password = `${MIN_PASSWORD_LEN}자 이상 입력해주세요.`;
    else if (isSignup && !PASSWORD_SPECIAL_RE.test(password)) next.password = '특수문자를 1자 이상 포함해주세요.';

    if (isSignup && confirmPassword !== password) next.confirm = '비밀번호가 일치하지 않아요.';

    if (isSignup && !agreeTerms) next.terms = '이용약관 및 개인정보처리방침에 동의해주세요.';

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

  async function handleSubmit() {
    setFormError(null);
    setNotice(null);

    if (view === 'signup-sent' || view === 'forgot-sent') {
      goTo('login');
      return;
    }

    if (view === 'login' || view === 'signup') {
      if (!validateLoginSignup()) return;
      setLoading(true);
      if (isSignup && !(await isNicknameAvailable(nickname))) {
        setLoading(false);
        setFieldErrors({ nickname: NICKNAME_TAKEN });
        return;
      }
      if (!isSignup) setKeepLogin(keepLogin);
      const result = isSignup
        ? await signUp(email.trim(), password, nickname.trim())
        : await signIn(email.trim(), password);
      setLoading(false);
      if (result.error) {
        setFormError(friendlyError(result.error));
        return;
      }
      if (isSignup) setView('signup-sent');
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
      setView('forgot-sent');
    }
  }

  async function handleResendResetLink() {
    setFormError(null);
    setLoading(true);
    const result = await requestPasswordReset(email.trim());
    setLoading(false);
    setNotice(result.error ? null : '재설정 링크를 다시 보냈어요.');
    if (result.error) setFormError(friendlyError(result.error));
  }

  async function handleResendSignupLink() {
    setFormError(null);
    setLoading(true);
    const result = await resendSignUpCode(email.trim());
    setLoading(false);
    setNotice(result.error ? null : '인증 링크를 다시 보냈어요.');
    if (result.error) setFormError(friendlyError(result.error));
  }

  const title = view === 'signup-sent' ? '이메일 인증' : '비밀번호 재설정';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            {/* The logo's dark-green wordmark disappears on a dark background, so dark mode shows only the
                house (the wordmark is cropped off) on a soft dark-gray tile; the title below names the app. */}
            {scheme === 'dark' ? (
              <View style={[styles.logoTile, styles.logoTileDark, { backgroundColor: DARK_LOGO_TILE }]}>
                <View style={styles.logoCrop}>
                  <Image style={styles.logoLarge} source={require('@/assets/images/splash-logo.png')} contentFit="contain" />
                </View>
              </View>
            ) : (
              <View style={styles.logoTile}>
                <Image style={styles.logo} source={require('@/assets/images/splash-logo.png')} contentFit="contain" />
              </View>
            )}
            {/* 밝은 모드 로고에는 이름 글자가 이미 들어 있어 두 번 쓰지 않는다. */}
            {scheme === 'dark' ? <Text style={[styles.title, { color: theme.text }]}>자취방 키우기</Text> : null}
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>내 방은 3D로 꾸미고, 생활비는 가볍게 관리해요</Text>
          </View>

          {/* 처음 온 사람이 로그인 전에 무슨 앱인지 알 수 있게, 실제 3D 방 화면과 할 수 있는 일 세 가지를 보여 준다.
              로그인·회원가입은 카드 위 탭이 이름을 대신하므로, 나머지 화면에서만 제목을 보여 준다. */}
          {view !== 'login' && view !== 'signup' ? (
            <Text style={[styles.subtitle, { color: theme.text }]}>{title}</Text>
          ) : fromTrial ? null : (
            <View style={styles.intro}>
              <View style={[styles.hero, { backgroundColor: '#FFFFFF', borderColor: theme.border }]}>
                <Image style={styles.heroImage} source={require('@/assets/images/hero-room.jpg')} contentFit="cover" />
                {/* 웹에서는 로그인 없이 열리는 3D 시뮬레이터(public/sim.html)로 바로 체험해 볼 수 있다. */}
                {Platform.OS === 'web' ? (
                  <Pressable
                    onPress={() => window.location.assign('/sim.html')}
                    accessibilityRole="link"
                    style={({ pressed }) => [styles.tryBtn, { backgroundColor: theme.accent }, pressed && styles.disabled]}>
                    <Ionicons name="cube-outline" size={15} color={theme.onAccent} />
                    <Text style={[styles.tryText, { color: theme.onAccent }]}>가입 없이 3D 체험해보기</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.features}>
                {FEATURES.map((f) => (
                  <View key={f.title} style={styles.featureRow}>
                    <View style={[styles.featureIcon, { backgroundColor: theme.accentSoft }]}>
                      <Ionicons name={f.icon} size={18} color={theme.accent} />
                    </View>
                    <View style={styles.featureText}>
                      <Text style={[styles.featureTitle, { color: theme.text }]}>{f.title}</Text>
                      <Text style={[styles.featureSub, { color: theme.textSecondary }]}>{f.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

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
                  goTo(view === 'forgot-sent' ? 'forgot-request' : view === 'signup-sent' ? 'signup' : 'login')
                }
                hitSlop={6}>
                <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
                <Text style={[styles.backText, { color: theme.textSecondary }]}>
                  {view === 'forgot-sent'
                    ? '이메일 다시 입력'
                    : view === 'signup-sent'
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
                가입할 때 사용한 이메일을 입력하면 비밀번호 재설정 링크를 보내드려요.
              </Text>
            )}

            {view === 'signup-sent' && (
              <Text style={[styles.helper, { color: theme.textSecondary }]}>
                <Text style={{ fontWeight: '600', color: theme.text }}>{email}</Text> 로 인증 링크를 보냈어요. 메일함에서
                링크를 눌러 인증을 완료한 뒤 로그인해주세요.
              </Text>
            )}

            {view === 'forgot-sent' && (
              <Text style={[styles.helper, { color: theme.textSecondary }]}>
                <Text style={{ fontWeight: '600', color: theme.text }}>{email}</Text> 로 비밀번호 재설정 링크를
                보냈어요. 메일함에서 링크를 눌러 새 비밀번호를 설정해주세요.
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

            {isSignup && (
              <View style={styles.field}>
                <View
                  style={[
                    styles.inputRow,
                    { backgroundColor: theme.background, borderColor: fieldErrors.nickname ? theme.danger : theme.border },
                  ]}>
                  <Ionicons name="person-outline" size={16} color={theme.textSecondary} />
                  <TextInput
                    value={nickname}
                    onChangeText={(t) => {
                      setNickname(t);
                      if (fieldErrors.nickname) setFieldErrors((e) => ({ ...e, nickname: undefined }));
                    }}
                    placeholder="닉네임"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    maxLength={MAX_NICKNAME_LEN}
                    style={[styles.input, { color: theme.text }]}
                  />
                </View>
                {fieldErrors.nickname ? (
                  <Text style={[styles.fieldError, { color: theme.danger }]}>{fieldErrors.nickname}</Text>
                ) : (
                  <Text style={[styles.fieldHint, { color: theme.textSecondary }]}>
                    커뮤니티에 표시될 이름이에요. {MIN_NICKNAME_LEN}~{MAX_NICKNAME_LEN}자로 입력해주세요.
                  </Text>
                )}
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
                      {MIN_PASSWORD_LEN}자 이상, 특수문자를 포함해 입력해주세요.
                    </Text>
                  ) : null}
                </View>

                {view === 'login' && Platform.OS === 'web' && (
                  <Pressable style={styles.termsRow} onPress={() => setKeepLoginState((v) => !v)} hitSlop={4} accessibilityRole="checkbox" accessibilityState={{ checked: keepLogin }}>
                    <Ionicons name={keepLogin ? 'checkbox' : 'square-outline'} size={18} color={keepLogin ? theme.accent : theme.textSecondary} />
                    <Text style={[styles.termsText, { color: theme.text }]}>로그인 상태 유지</Text>
                  </Pressable>
                )}

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

                {isSignup && (
                  <View style={styles.field}>
                    <Pressable
                      style={styles.termsRow}
                      onPress={() => {
                        setAgreeTerms((v) => !v);
                        if (fieldErrors.terms) setFieldErrors((e) => ({ ...e, terms: undefined }));
                      }}
                      hitSlop={4}>
                      <Ionicons
                        name={agreeTerms ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={agreeTerms ? theme.accent : theme.textSecondary}
                      />
                      <Text style={[styles.termsText, { color: theme.text }]}>
                        (필수) 이용약관 및 개인정보처리방침에 동의하며, 만 14세 이상입니다.
                      </Text>
                    </Pressable>
                    <View style={styles.legalLinks}>
                      <Pressable onPress={() => setLegalDoc(TERMS)} hitSlop={6} accessibilityRole="link">
                        <Text style={[styles.legalLink, { color: theme.accent }]}>이용약관 보기</Text>
                      </Pressable>
                      <Text style={[styles.legalLink, { color: theme.textSecondary }]}>·</Text>
                      <Pressable onPress={() => setLegalDoc(PRIVACY)} hitSlop={6} accessibilityRole="link">
                        <Text style={[styles.legalLink, { color: theme.accent }]}>개인정보처리방침 보기</Text>
                      </Pressable>
                    </View>
                    {fieldErrors.terms ? <Text style={[styles.fieldError, { color: theme.danger }]}>{fieldErrors.terms}</Text> : null}
                  </View>
                )}
              </>
            )}

            {(view === 'signup-sent' || view === 'forgot-sent') && (
              <Pressable
                onPress={view === 'signup-sent' ? handleResendSignupLink : handleResendResetLink}
                hitSlop={6}
                disabled={loading}>
                <Text style={[styles.forgotText, { color: theme.accent }]}>메일 재전송</Text>
              </Pressable>
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
                  {view === 'signup-sent' || view === 'forgot-sent'
                    ? '로그인 화면으로'
                    : view === 'forgot-request'
                      ? '재설정 링크 받기'
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
      <LegalSheet doc={legalDoc} onClose={() => setLegalDoc(null)} />
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
  logoTile: { borderRadius: 24, padding: 6 },
  logo: { width: 100, height: 88 },
  logoTileDark: { paddingHorizontal: 18, paddingVertical: 14 },
  // The house fills roughly the top 64% of the logo art; the rest is the wordmark.
  logoCrop: { width: 120, height: 70, overflow: 'hidden' },
  logoLarge: { width: 120, height: 106 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  tagline: { fontSize: 13.5, textAlign: 'center' },
  intro: { gap: Spacing.four },
  hero: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  heroImage: { width: '100%', aspectRatio: 16 / 10 },
  tryBtn: {
    position: 'absolute',
    bottom: Spacing.three,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  tryText: { fontSize: 13.5, fontWeight: '700' },
  features: { gap: Spacing.three, paddingHorizontal: Spacing.two },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  featureIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, gap: 1 },
  featureTitle: { fontSize: 14, fontWeight: '700' },
  featureSub: { fontSize: 12 },
  subtitle: { fontSize: 15, fontWeight: '700', marginBottom: -Spacing.two },
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
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  termsText: { flex: 1, fontSize: 12, lineHeight: 16 },
  legalLinks: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 26 },
  legalLink: { fontSize: 12, fontWeight: '600' },
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
