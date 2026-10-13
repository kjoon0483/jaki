import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BudgetGoalSheet } from '@/components/budget/budget-goal-sheet';
import { ExpenseSheet } from '@/components/budget/expense-sheet';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import { categoryIcon } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { dateKey, formatDateLabel, monthKey } from '@/lib/dates';
import { formatWon } from '@/lib/format';
import { useAuth } from '@/state/auth-state';
import { sumForMonth, useBudget } from '@/state/budget-state';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { expenses, monthlyBudget } = useBudget();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  const nickname =
    (session?.user.user_metadata?.nickname as string | undefined) || session?.user.email?.split('@')[0] || '';

  const now = new Date();
  const thisMonth = monthKey(now.getFullYear(), now.getMonth());
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = monthKey(prev.getFullYear(), prev.getMonth());

  const total = sumForMonth(expenses, thisMonth);
  // Compare against last month up to the same day, so early in the month isn't unfairly "less".
  const thisSoFar = sumForMonth(expenses, thisMonth, now.getDate());
  const lastSoFar = sumForMonth(expenses, lastMonthKey, now.getDate());
  const hasLastMonth = expenses.some((e) => !e.is_income && e.spent_on.startsWith(lastMonthKey));
  const diff = thisSoFar - lastSoFar;

  const topCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      if (!e.is_income && e.spent_on.startsWith(thisMonth)) map[e.category] = (map[e.category] ?? 0) + e.amount;
    });
    const [category, amount] = Object.entries(map).sort((a, b) => b[1] - a[1])[0] ?? [];
    return category ? { category, amount } : null;
  }, [expenses, thisMonth]);

  const recent = useMemo(
    () => [...expenses].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3),
    [expenses]
  );

  const usedRatio = monthlyBudget ? Math.min(1, total / monthlyBudget) : 0;
  const over = monthlyBudget ? total > monthlyBudget : false;

  return (
    <Screen eyebrow={nickname ? `안녕하세요, ${nickname}님` : '안녕하세요'} title="오늘의 자취방">
      {/* 이번 달 예산 요약. 요약(가계부로 이동)과 예산 정하기 버튼은 형제로 둔다: 웹에서 버튼 안에 버튼을 못 넣는다. */}
      <Card tone="accent" style={styles.hero}>
        <Pressable
          onPress={() => router.navigate('/budget')}
          accessibilityRole="button"
          accessibilityLabel="가계부로 가기"
          style={({ pressed }) => [styles.heroLink, pressed && styles.pressed]}>
          <View style={styles.heroTop}>
            <Text style={[styles.heroLabel, { color: theme.onSurfaceAccent }]}>{now.getMonth() + 1}월 지출</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.onSurfaceAccent} style={styles.heroChevron} />
          </View>
          <Text style={[styles.heroValue, { color: theme.onSurfaceAccent }]}>{formatWon(total)}</Text>
          {monthlyBudget ? (
            <>
              <View style={styles.track}>
                <View
                  style={[styles.fill, { width: `${usedRatio * 100}%`, backgroundColor: over ? theme.warm : theme.onSurfaceAccent }]}
                />
              </View>
              <View style={styles.heroMetaRow}>
                <Text style={[styles.heroMeta, { color: theme.onSurfaceAccent }]}>
                  {over ? '예산 초과' : `예산의 ${Math.round(usedRatio * 100)}%`}
                </Text>
                <Text style={[styles.heroMeta, { color: theme.onSurfaceAccent }]}>
                  {over ? `${formatWon(total - monthlyBudget)} 더 썼어요` : `${formatWon(monthlyBudget - total)} 남음`}
                </Text>
              </View>
            </>
          ) : null}
        </Pressable>
        {monthlyBudget ? null : (
          <Pressable onPress={() => setGoalOpen(true)} style={styles.pill} accessibilityRole="button">
            <Ionicons name="flag-outline" size={14} color={theme.onSurfaceAccent} />
            <Text style={[styles.pillText, { color: theme.onSurfaceAccent }]}>한 달 예산 정하기</Text>
          </Pressable>
        )}
      </Card>

      <View style={styles.statRow}>
        <Card style={styles.stat}>
          <View style={styles.statHead}>
            <Ionicons name="leaf-outline" size={14} color={theme.accent} />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>지난달 이맘때보다</Text>
          </View>
          {hasLastMonth ? (
            <>
              <Text style={[styles.statValue, { color: theme.text }]}>{formatWon(Math.abs(diff))}</Text>
              <View style={styles.trendRow}>
                <Ionicons
                  name={diff <= 0 ? 'trending-down-outline' : 'trending-up-outline'}
                  size={13}
                  color={diff <= 0 ? theme.success : theme.warm}
                />
                <Text style={[styles.trendText, { color: diff <= 0 ? theme.success : theme.warm }]}>
                  {diff <= 0 ? '덜 썼어요' : '더 썼어요'}
                </Text>
              </View>
            </>
          ) : (
            <Text style={[styles.statEmpty, { color: theme.textSecondary }]}>다음 달부터 비교해 드려요</Text>
          )}
        </Card>
        <Card style={styles.stat}>
          <View style={styles.statHead}>
            <Ionicons name={topCategory ? categoryIcon(topCategory.category) : 'pie-chart-outline'} size={14} color={theme.accent} />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>가장 많이 쓴 곳</Text>
          </View>
          {topCategory ? (
            <>
              <Text style={[styles.statValue, { color: theme.text }]}>{topCategory.category}</Text>
              <Text style={[styles.trendText, { color: theme.textSecondary }]}>{formatWon(topCategory.amount)}</Text>
            </>
          ) : (
            <Text style={[styles.statEmpty, { color: theme.textSecondary }]}>아직 기록이 없어요</Text>
          )}
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
        <SectionHeader title="최근 기록" action="+ 기록하기" onAction={() => setExpenseOpen(true)} />
        <Card style={styles.list}>
          {recent.length === 0 ? (
            <Pressable onPress={() => setExpenseOpen(true)} style={styles.empty} accessibilityRole="button">
              <Ionicons name="create-outline" size={22} color={theme.accent} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                아직 기록이 없어요.{'\n'}오늘 쓴 돈부터 적어볼까요?
              </Text>
            </Pressable>
          ) : (
            recent.map((e) => (
              <Pressable key={e.id} onPress={() => router.navigate('/budget')} style={styles.activityRow}>
                <View style={[styles.iconBubble, { backgroundColor: e.is_income ? theme.background : theme.accentSoft }]}>
                  <Ionicons name={categoryIcon(e.category)} size={15} color={e.is_income ? theme.income : theme.accent} />
                </View>
                <View style={styles.activityText}>
                  <Text style={[styles.activityTitle, { color: theme.text }]} numberOfLines={1}>
                    {e.memo || e.category}
                  </Text>
                  <Text style={[styles.activitySub, { color: theme.textSecondary }]}>
                    {e.spent_on === dateKey(now) ? '오늘' : formatDateLabel(e.spent_on)}
                    {e.memo ? ` · ${e.category}` : ''}
                  </Text>
                </View>
                <Text style={[styles.activityAmount, { color: e.is_income ? theme.income : theme.text }]}>
                  {e.is_income ? '+' : '−'}
                  {formatWon(e.amount)}
                </Text>
              </Pressable>
            ))
          )}
        </Card>
      </View>

      <ExpenseSheet visible={expenseOpen} initialDate={dateKey(now)} onClose={() => setExpenseOpen(false)} />
      <BudgetGoalSheet visible={goalOpen} onClose={() => setGoalOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: Spacing.four, gap: Spacing.two },
  heroLink: { gap: Spacing.two },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroChevron: { opacity: 0.7 },
  heroLabel: { fontSize: 13, opacity: 0.85 },
  heroValue: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: Spacing.two, backgroundColor: 'rgba(255,255,255,0.2)' },
  fill: { height: '100%', borderRadius: 3 },
  heroMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroMeta: { fontSize: 12, opacity: 0.9 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: Spacing.one,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  pillText: { fontSize: 13, fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: Spacing.three },
  stat: { flex: 1, gap: 6 },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  iconBubble: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  statEmpty: { fontSize: 13, lineHeight: 18 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendText: { fontSize: 12 },
  roomCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  pressed: { opacity: 0.8 },
  roomIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  roomText: { flex: 1, gap: 2 },
  roomTitle: { fontSize: 15, fontWeight: '700' },
  roomSub: { fontSize: 12 },
  section: { gap: Spacing.three },
  list: { paddingVertical: Spacing.two, gap: 0 },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.four },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 10 },
  activityText: { flex: 1, gap: 2 },
  activityTitle: { fontSize: 14, fontWeight: '600' },
  activitySub: { fontSize: 12 },
  activityAmount: { fontSize: 14, fontWeight: '700' },
});
