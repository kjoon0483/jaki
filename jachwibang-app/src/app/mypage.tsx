import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmAsync, notify } from '@/lib/confirm';
import { useAuth } from '@/state/auth-state';
import { ThemePreference, useThemePreference } from '@/state/theme-state';

const MENU = [
  { label: '프로필 수정', icon: 'person-outline' },
  { label: '알림 설정', icon: 'notifications-outline' },
] as const;

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'system', label: '시스템', icon: 'phone-portrait-outline' },
  { value: 'light', label: '라이트', icon: 'sunny-outline' },
  { value: 'dark', label: '다크', icon: 'moon-outline' },
];

export default function MyPageScreen() {
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const { preference, setPreference } = useThemePreference();
  const email = session?.user.email ?? '';
  const nickname = (session?.user.user_metadata?.nickname as string | undefined) ?? '';
  const displayName = nickname || email || '알 수 없음';
  const initial = displayName.charAt(0).toUpperCase() || '?';

  async function handleSignOut() {
    if (await confirmAsync('로그아웃', '로그아웃 하시겠어요?', '로그아웃')) signOut();
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>마이페이지</Text>

        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.avatarText, { color: theme.accent }]}>{initial}</Text>
          </View>
          <View>
            <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
            <Text style={[styles.email, { color: theme.textSecondary }]}>{email || '자취방 키우기 회원'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>화면 테마</Text>
          <View style={[styles.segment, { backgroundColor: theme.backgroundElement }]}>
            {THEME_OPTIONS.map((opt) => {
              const active = preference === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setPreference(opt.value)}
                  style={[styles.segmentBtn, active && { backgroundColor: theme.accent }]}>
                  <Ionicons name={opt.icon} size={15} color={active ? theme.onAccent : theme.text} />
                  <Text style={[styles.segmentText, { color: active ? theme.onAccent : theme.text }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.menuBox, { backgroundColor: theme.backgroundElement }]}>
          {MENU.map((item, i) => (
            <Pressable
              key={item.label}
              style={[styles.menuRow, i < MENU.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
              onPress={() => notify(item.label, '준비 중인 기능이에요.')}>
              <View style={styles.menuLabel}>
                <Ionicons name={item.icon} size={16} color={theme.text} />
                <Text style={[styles.menuText, { color: theme.text }]}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
            </Pressable>
          ))}
          <Pressable style={styles.menuRow} onPress={handleSignOut}>
            <Text style={[styles.menuText, { color: theme.danger }]}>로그아웃</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  pageTitle: { fontSize: 22, fontWeight: '700' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '600' },
  email: { fontSize: 12, marginTop: 2 },
  section: { gap: Spacing.two },
  sectionLabel: { fontSize: 13 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: Spacing.three, gap: 4 },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Spacing.three - 4,
  },
  segmentText: { fontSize: 13, fontWeight: '600' },
  menuBox: { borderRadius: Spacing.three, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  menuLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  menuText: { fontSize: 13 },
});
