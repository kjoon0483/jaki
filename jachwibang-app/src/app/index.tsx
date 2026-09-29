import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import { categoryBreakdown, formatWon, monthlyBudget, recentActivity, savedThisMonth, totalThisMonth } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/state/auth-state';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();

  const nickname =
    (session?.user.user_metadata?.nickname as string | undefined) || session?.user.email?.split('@')[0] || '';
  const usedRatio = Math.min(1, totalThisMonth / monthlyBudget);
  const remaining = Math.max(0, monthlyBudget - totalThisMonth);
  const topCategory = [...categoryBreakdown].sort((a, b) => b.amount - a.amount)[0];
  const month = new Date().getMonth() + 1;

  return (
    <Screen eyebrow={nickname ? `안녕하세요, ${nickname}님` : '안녕하세요'} title="오늘의 자취방">
      {/* 이번 달 예산 요약 */}
      <Card tone="accent" style={styles.hero}>
        <Text style={[styles.heroLabel, { color: theme.onSurfaceAccent }]}>{month}월 지출</Text>
        <Text style={[styles.heroValue, { color: theme.onSurfaceAccent }]}>{formatWon(totalThisMonth)}</Text>
        <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <View style={[styles.fill, { width: `${usedRatio * 100}%`, backgroundColor: theme.onSurfaceAccent }]} />
        </View>
        <Text style={[styles.heroMeta, { color: theme.onSurfaceAccent }]}>
          예산 {formatWon(monthlyBudget)} 중 {Math.round(usedRatio * 100)}% 사용 · {formatWon(remaining)} 남음
        </Text>
      </Card>

      <View style={styles.statRow}>
        <Card style={styles.stat}>
          <View style={[styles.iconBubble, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="leaf-outline" size={16} color={theme.accent} />
          </View>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>이번 달 절약</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{formatWon(savedThisMonth)}</Text>
          <View style={styles.trendRow}>
            <Ionicons name="trending-down-outline" size={13} color={theme.success} />
            <Text style={[styles.trendText, { color: theme.success }]}>지난달보다 11%</Text>
          </View>
        </Card>
        <Card style={styles.stat}>
          <View style={[styles.iconBubble, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name={topCategory.icon as never} size={16} color={theme.accent} />
          </View>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>가장 많이 쓴 곳</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{topCategory.category}</Text>
          <Text style={[styles.trendText, { color: theme.textSecondary }]}>{formatWon(topCategory.amount)}</Text>
        </Card>
      </View>

      {/* 3D 방 바로가기 */}
      <Pressable onPress={() => router.navigate('/room')} accessibilityRole="button">
        {({ pressed }) => (
          <Card tone="soft" style={[styles.roomCard, pressed && styles.pressed]}>
            <View style={[styles.roomIcon, { backgroundColor: theme.accent }]}>
              <Ionicons name="cube-outline" size={22} color={theme.onAccent} />
            </View>
            <View style={styles.roomText}>
              <Text style={[styles.roomTitle, { color: theme.text }]}>내 방 꾸미러 가기</Text>
              <Text style={[styles.roomSub, { color: theme.textSecondary }]}>3D로 가구를 배치하고 햇빛까지 확인해요</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.accent} />
          </Card>
        )}
      </Pressable>

      <View style={styles.section}>
        <SectionHeader title="최근 활동" />
        <Card style={styles.list}>
          {recentActivity.map((item, i) => (
            <View
              key={i}
              style={[
                styles.activityRow,
                i < recentActivity.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
              ]}>
              <View style={[styles.iconBubble, { backgroundColor: theme.background }]}>
                <Ionicons name={item.icon as never} size={15} color={theme[item.tone]} />
              </View>
              <Text style={[styles.activityText, { color: theme.text }]}>{item.text}</Text>
            </View>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: Spacing.four, gap: Spacing.two },
  heroLabel: { fontSize: 13, opacity: 0.85 },
  heroValue: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: Spacing.one },
  fill: { height: '100%', borderRadius: 4 },
  heroMeta: { fontSize: 12, opacity: 0.85 },
  statRow: { flexDirection: 'row', gap: Spacing.three },
  stat: { flex: 1 },
  iconBubble: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12, marginTop: Spacing.one },
  statValue: { fontSize: 18, fontWeight: '700' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendText: { fontSize: 12 },
  roomCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  pressed: { opacity: 0.8 },
  roomIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  roomText: { flex: 1, gap: 2 },
  roomTitle: { fontSize: 15, fontWeight: '700' },
  roomSub: { fontSize: 12 },
  section: { gap: Spacing.three },
  list: { paddingVertical: Spacing.one, gap: 0 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 12 },
  activityText: { flex: 1, fontSize: 14 },
});
