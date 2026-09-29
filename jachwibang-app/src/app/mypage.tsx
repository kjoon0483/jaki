import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MyPost, MyPostsSheet } from '@/components/mypage/my-posts-sheet';
import { NicknameSheet } from '@/components/mypage/nickname-sheet';
import { PasswordSheet } from '@/components/mypage/password-sheet';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import { useRooms } from '@/hooks/use-rooms';
import { useTheme } from '@/hooks/use-theme';
import { communityError, LEGACY_POST_COLUMNS } from '@/lib/community';
import { confirmAsync, notify } from '@/lib/confirm';
import { monthKey } from '@/lib/dates';
import { formatWon } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth-state';
import { sumForMonth, useBudget } from '@/state/budget-state';
import { ThemePreference, useThemePreference } from '@/state/theme-state';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'system', label: '시스템', icon: 'phone-portrait-outline' },
  { value: 'light', label: '라이트', icon: 'sunny-outline' },
  { value: 'dark', label: '다크', icon: 'moon-outline' },
];

export default function MyPageScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { preference, setPreference } = useThemePreference();
  const { expenses } = useBudget();
  const { rooms, refresh: refreshRooms } = useRooms(false); // loaded by the focus effect below

  const me = session?.user.id ?? null;
  const email = session?.user.email ?? '';
  const nickname = (session?.user.user_metadata?.nickname as string | undefined) ?? '';
  const displayName = nickname || email.split('@')[0] || '알 수 없음';

  const [nicknameOpen, setNicknameOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [postsOpen, setPostsOpen] = useState(false);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  const loadMyPosts = useCallback(async () => {
    if (!me) return;
    setPostsLoading(true);
    const { data, error } = await supabase
      .from('community_posts')
      .select(LEGACY_POST_COLUMNS)
      .eq('user_id', me)
      .order('created_at', { ascending: false });
    setPostsLoading(false);
    if (error) setPostsError(communityError(error.message));
    else {
      setPostsError(null);
      setMyPosts((data ?? []) as unknown as MyPost[]);
    }
  }, [me]);

  // Counts can change on other tabs (new post, saved room), so reload whenever this tab is shown.
  useFocusEffect(
    useCallback(() => {
      loadMyPosts();
      refreshRooms();
    }, [loadMyPosts, refreshRooms])
  );

  async function deletePost(post: MyPost) {
    if (!(await confirmAsync('글 삭제', '이 글을 삭제할까요? 댓글도 함께 지워져요.', '삭제'))) return;
    const { error } = await supabase.from('community_posts').delete().eq('id', post.id);
    if (error) notify('삭제하지 못했어요', communityError(error.message));
    else setMyPosts((prev) => prev.filter((p) => p.id !== post.id));
  }

  async function handleSignOut() {
    if (await confirmAsync('로그아웃', '로그아웃 하시겠어요?', '로그아웃')) signOut();
  }

  const now = new Date();
  const monthTotal = sumForMonth(expenses, monthKey(now.getFullYear(), now.getMonth()));

  const stats = [
    { label: `${now.getMonth() + 1}월 지출`, value: formatWon(monthTotal), icon: 'wallet-outline' as const, onPress: () => router.navigate('/budget') },
    { label: '저장한 방', value: `${rooms.length}개`, icon: 'cube-outline' as const, onPress: () => router.navigate('/room') },
    { label: '내가 쓴 글', value: `${myPosts.length}개`, icon: 'create-outline' as const, onPress: () => setPostsOpen(true) },
  ];

  return (
    <Screen title="마이페이지">
      {/* 프로필 */}
      <Card style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
          <Text style={[styles.avatarText, { color: theme.onAccent }]}>{displayName.charAt(0).toUpperCase() || '?'}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.email, { color: theme.textSecondary }]} numberOfLines={1}>
            {email}
          </Text>
        </View>
        <Pressable
          onPress={() => setNicknameOpen(true)}
          style={[styles.editBtn, { backgroundColor: theme.background }]}
          accessibilityRole="button"
          accessibilityLabel="닉네임 바꾸기">
          <Ionicons name="pencil-outline" size={14} color={theme.accent} />
          <Text style={[styles.editText, { color: theme.accent }]}>수정</Text>
        </Pressable>
      </Card>

      {/* 내 활동 */}
      <View style={styles.section}>
        <SectionHeader title="내 활동" />
        <View style={styles.statRow}>
          {stats.map((s) => (
            <Pressable key={s.label} style={styles.statWrap} onPress={s.onPress} accessibilityRole="button" accessibilityLabel={s.label}>
              {({ pressed }) => (
                <Card style={[styles.stat, pressed && { opacity: 0.8 }]}>
                  <Ionicons name={s.icon} size={18} color={theme.accent} />
                  <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                    {s.value}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
                </Card>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* 화면 테마 */}
      <View style={styles.section}>
        <SectionHeader title="화면 테마" />
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

      {/* 계정 */}
      <View style={styles.section}>
        <SectionHeader title="계정" />
        <Card style={styles.menu}>
          <MenuRow icon="person-outline" label="닉네임 바꾸기" onPress={() => setNicknameOpen(true)} />
          <MenuRow icon="lock-closed-outline" label="비밀번호 변경" onPress={() => setPasswordOpen(true)} />
          <MenuRow icon="log-out-outline" label="로그아웃" danger onPress={handleSignOut} last />
        </Card>
      </View>

      <Text style={[styles.version, { color: theme.textSecondary }]}>
        자취방 키우기 v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>

      <NicknameSheet visible={nicknameOpen} current={nickname} onClose={() => setNicknameOpen(false)} />
      <PasswordSheet visible={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <MyPostsSheet
        visible={postsOpen}
        posts={myPosts}
        loading={postsLoading}
        error={postsError}
        onClose={() => setPostsOpen(false)}
        onDelete={deletePost}
      />
    </Screen>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  danger,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const theme = useTheme();
  const color = danger ? theme.danger : theme.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.menuRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
      <Ionicons name={icon} size={17} color={color} />
      <Text style={[styles.menuText, { color }]}>{label}</Text>
      {!danger ? <Ionicons name="chevron-forward" size={15} color={theme.textSecondary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800' },
  profileText: { flex: 1, gap: 2 },
  name: { fontSize: 18, fontWeight: '700' },
  email: { fontSize: 13 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  editText: { fontSize: 13, fontWeight: '700' },
  section: { gap: Spacing.three },
  statRow: { flexDirection: 'row', gap: Spacing.two },
  statWrap: { flex: 1 },
  stat: { alignItems: 'flex-start', gap: 4, paddingVertical: Spacing.three },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 12 },
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
  menu: { paddingVertical: 0, gap: 0 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 15 },
  menuText: { flex: 1, fontSize: 15 },
  version: { fontSize: 12, textAlign: 'center' },
});
