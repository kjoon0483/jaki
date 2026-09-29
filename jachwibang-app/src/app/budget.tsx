import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BudgetGoalSheet } from '@/components/budget/budget-goal-sheet';
import { ExpenseSheet } from '@/components/budget/expense-sheet';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import { categoryIcon } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { confirmAsync, notify } from '@/lib/confirm';
import { dateKey, formatDateLabel, monthKey } from '@/lib/dates';
import { formatShortWon, formatWon } from '@/lib/format';
import { Expense, sumForMonth, useBudget } from '@/state/budget-state';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
/** How many past months the month switcher can go back (matches what the provider loads). */
const MAX_MONTHS_BACK = 11;

export default function BudgetScreen() {
  const theme = useTheme();
  const { expenses, loading, error, monthlyBudget, refresh, deleteExpense } = useBudget();

  const now = new Date();
  const todayKey = dateKey(now);
  const [offset, setOffset] = useState(0); // 0 = this month, 1 = last month, ...
  const view = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();
  const mKey = monthKey(year, month);
  const [pickedDay, setPickedDay] = useState<string | null>(todayKey);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  const monthExpenses = useMemo(() => expenses.filter((e) => e.spent_on.startsWith(mKey)), [expenses, mKey]);
  const total = sumForMonth(expenses, mKey);

  const byDay = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      map[e.spent_on] = (map[e.spent_on] ?? 0) + e.amount;
    });
    return map;
  }, [monthExpenses]);
  const maxDay = Math.max(0, ...Object.values(byDay));

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    });
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthExpenses]);

  const firstWeekday = view.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => dateKey(new Date(year, month, i + 1))),
  ];

  const selectedDay = pickedDay && pickedDay.startsWith(mKey) ? pickedDay : null;
  const listItems = selectedDay ? monthExpenses.filter((e) => e.spent_on === selectedDay) : monthExpenses;

  function changeMonth(delta: number) {
    const next = Math.min(MAX_MONTHS_BACK, Math.max(0, offset + delta));
    setOffset(next);
    setPickedDay(next === 0 ? todayKey : null);
  }

  async function remove(e: Expense) {
    const ok = await confirmAsync('지출 삭제', `${e.category} ${formatWon(e.amount)}을(를) 삭제할까요?`, '삭제');
    if (!ok) return;
    const { error: deleteError } = await deleteExpense(e.id);
    if (deleteError) notify('삭제하지 못했어요', deleteError);
  }

  const usedRatio = monthlyBudget ? Math.min(1, total / monthlyBudget) : 0;
  const over = monthlyBudget ? total > monthlyBudget : false;

  return (
    <Screen
      title="가계부"
      right={
        <View style={[styles.monthSwitch, { backgroundColor: theme.backgroundElement }]}>
          <Pressable onPress={() => changeMonth(1)} disabled={offset >= MAX_MONTHS_BACK} hitSlop={8} accessibilityLabel="이전 달">
            <Ionicons name="chevron-back" size={16} color={offset >= MAX_MONTHS_BACK ? theme.border : theme.text} />
          </Pressable>
          <Text style={[styles.monthText, { color: theme.text }]}>
            {year !== now.getFullYear() ? `${year}년 ` : ''}
            {month + 1}월
          </Text>
          <Pressable onPress={() => changeMonth(-1)} disabled={offset === 0} hitSlop={8} accessibilityLabel="다음 달">
            <Ionicons name="chevron-forward" size={16} color={offset === 0 ? theme.border : theme.text} />
          </Pressable>
        </View>
      }
      floating={
        <Pressable
          style={({ pressed }) => [styles.fab, { backgroundColor: theme.accent }, pressed && { opacity: 0.85 }]}
          onPress={() => setExpenseOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="지출 추가">
          <Ionicons name="add" size={26} color={theme.onAccent} />
        </Pressable>
      }>
      {/* 월 요약 + 예산 */}
      <Card tone="accent" style={styles.hero}>
        <Text style={[styles.heroLabel, { color: theme.onSurfaceAccent }]}>{month + 1}월 지출</Text>
        <Text style={[styles.heroValue, { color: theme.onSurfaceAccent }]}>{formatWon(total)}</Text>
        {monthlyBudget ? (
          <Pressable onPress={() => setGoalOpen(true)} accessibilityRole="button" accessibilityLabel="예산 수정">
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${usedRatio * 100}%`, backgroundColor: over ? theme.warm : theme.onSurfaceAccent },
                ]}
              />
            </View>
            <Text style={[styles.heroMeta, { color: theme.onSurfaceAccent }]}>
              {over
                ? `예산 ${formatWon(monthlyBudget)}보다 ${formatWon(total - monthlyBudget)} 더 썼어요`
                : `예산 ${formatWon(monthlyBudget)} 중 ${formatWon(monthlyBudget - total)} 남았어요`}
              {'  ·  수정'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setGoalOpen(true)}
            style={styles.setGoal}
            accessibilityRole="button">
            <Ionicons name="flag-outline" size={14} color={theme.onSurfaceAccent} />
            <Text style={[styles.setGoalText, { color: theme.onSurfaceAccent }]}>한 달 예산 정하기</Text>
          </Pressable>
        )}
      </Card>

      {error ? (
        <Card>
          <Text style={[styles.errorTitle, { color: theme.danger }]}>지출 내역을 불러오지 못했어요</Text>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>{error}</Text>
          <Pressable onPress={refresh} hitSlop={8}>
            <Text style={[styles.link, { color: theme.accent }]}>다시 시도</Text>
          </Pressable>
        </Card>
      ) : loading && expenses.length === 0 ? (
        <ActivityIndicator color={theme.accent} style={{ marginVertical: Spacing.four }} />
      ) : null}

      {/* 카테고리별 */}
      {byCategory.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="어디에 썼을까" />
          <Card style={styles.catCard}>
            {byCategory.map((row) => (
              <View key={row.category} style={styles.catRow}>
                <View style={styles.catHead}>
                  <View style={[styles.iconBubble, { backgroundColor: theme.accentSoft }]}>
                    <Ionicons name={categoryIcon(row.category)} size={14} color={theme.accent} />
                  </View>
                  <Text style={[styles.catName, { color: theme.text }]}>{row.category}</Text>
                  <Text style={[styles.catPct, { color: theme.textSecondary }]}>{Math.round((row.amount / total) * 100)}%</Text>
                  <Text style={[styles.catAmount, { color: theme.text }]}>{formatWon(row.amount)}</Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: theme.backgroundSelected }]}>
                  <View style={[styles.barFill, { width: `${(row.amount / byCategory[0].amount) * 100}%`, backgroundColor: theme.accent }]} />
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* 달력 */}
      <View style={styles.section}>
        <SectionHeader title="날짜별 지출" action={selectedDay ? '이번 달 전체' : undefined} onAction={() => setPickedDay(null)} />
        <Card style={styles.calCard}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={w} style={[styles.weekday, { color: i === 0 ? theme.danger : theme.textSecondary }]}>
                {w}
              </Text>
            ))}
          </View>
          <View style={styles.calGrid}>
            {cells.map((key, i) => {
              if (!key) return <View key={`b${i}`} style={styles.calCell} />;
              const amount = byDay[key] ?? 0;
              const isToday = key === todayKey;
              const isPicked = key === selectedDay;
              const future = key > todayKey;
              // Shade days by how much was spent relative to the biggest day of the month.
              const intensity = amount && maxDay ? 0.25 + 0.75 * (amount / maxDay) : 0;
              return (
                <View key={key} style={styles.calCell}>
                  <Pressable
                    onPress={() => setPickedDay(isPicked ? null : key)}
                    disabled={future}
                    accessibilityLabel={`${formatDateLabel(key)}${amount ? ` ${formatWon(amount)}` : ''}`}
                    style={[
                      styles.dayButton,
                      isPicked && { backgroundColor: theme.accent },
                      !isPicked && isToday && { borderWidth: 1.5, borderColor: theme.accent },
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        { color: isPicked ? theme.onAccent : future ? theme.border : theme.text },
                        isToday && styles.dayTextToday,
                      ]}>
                      {Number(key.slice(8))}
                    </Text>
                    {amount ? (
                      <View style={styles.dayAmountWrap}>
                        <View
                          style={[
                            styles.dayDot,
                            { backgroundColor: isPicked ? theme.onAccent : theme.accent, opacity: isPicked ? 1 : intensity },
                          ]}
                        />
                        <Text style={[styles.dayAmount, { color: isPicked ? theme.onAccent : theme.textSecondary }]} numberOfLines={1}>
                          {formatShortWon(amount)}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Card>
      </View>

      {/* 내역 */}
      <View style={styles.section}>
        <SectionHeader title={selectedDay ? formatDateLabel(selectedDay) : `${month + 1}월 전체 내역`} />
        <Card style={styles.list}>
          {listItems.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={22} color={theme.textSecondary} />
              <Text style={[styles.muted, { color: theme.textSecondary, textAlign: 'center' }]}>
                {monthExpenses.length === 0
                  ? '아직 기록이 없어요.\n오른쪽 아래 + 버튼으로 첫 지출을 적어보세요.'
                  : '이 날은 지출이 없어요.'}
              </Text>
            </View>
          ) : (
            listItems.map((e, i) => (
              <View
                key={e.id}
                style={[
                  styles.itemRow,
                  i < listItems.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                ]}>
                <View style={[styles.iconBubble, { backgroundColor: theme.background }]}>
                  <Ionicons name={categoryIcon(e.category)} size={15} color={theme.accent} />
                </View>
                <View style={styles.itemText}>
                  <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                    {e.memo || e.category}
                  </Text>
                  {itemSubtitle(e, !selectedDay) ? (
                    <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{itemSubtitle(e, !selectedDay)}</Text>
                  ) : null}
                </View>
                <Text style={[styles.itemAmount, { color: theme.text }]}>{formatWon(e.amount)}</Text>
                <Pressable onPress={() => remove(e)} hitSlop={10} accessibilityLabel="삭제">
                  <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
                </Pressable>
              </View>
            ))
          )}
        </Card>
      </View>
      {/* Keeps the last row clear of the floating + button. */}
      <View style={{ height: 56 }} />

      <ExpenseSheet
        visible={expenseOpen}
        initialDate={selectedDay ?? (offset === 0 ? todayKey : dateKey(new Date(year, month, daysInMonth)))}
        onClose={() => setExpenseOpen(false)}
      />
      <BudgetGoalSheet visible={goalOpen} onClose={() => setGoalOpen(false)} />
    </Screen>
  );
}

/** "카테고리 · 날짜" line under an expense; the category is only repeated when a memo took the title. */
function itemSubtitle(e: Expense, withDate: boolean) {
  return [e.memo ? e.category : null, withDate ? formatDateLabel(e.spent_on) : null].filter(Boolean).join(' · ');
}

const styles = StyleSheet.create({
  monthSwitch: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  monthText: { fontSize: 14, fontWeight: '700', minWidth: 34, textAlign: 'center' },
  hero: { padding: Spacing.four, gap: Spacing.two },
  heroLabel: { fontSize: 13, opacity: 0.85 },
  heroValue: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', marginVertical: Spacing.two, backgroundColor: 'rgba(255,255,255,0.2)' },
  fill: { height: '100%', borderRadius: 4 },
  heroMeta: { fontSize: 12, opacity: 0.9 },
  setGoal: {
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
  setGoalText: { fontSize: 13, fontWeight: '700' },
  errorTitle: { fontSize: 14, fontWeight: '700' },
  muted: { fontSize: 13, lineHeight: 19 },
  link: { fontSize: 13, fontWeight: '700' },
  section: { gap: Spacing.three },
  catCard: { gap: Spacing.three },
  catRow: { gap: 6 },
  catHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  catName: { flex: 1, fontSize: 14, fontWeight: '600' },
  catPct: { fontSize: 12 },
  catAmount: { fontSize: 14, fontWeight: '700', minWidth: 84, textAlign: 'right' },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginLeft: 36 },
  barFill: { height: '100%', borderRadius: 3 },
  iconBubble: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  calCard: { paddingHorizontal: Spacing.two },
  weekRow: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, aspectRatio: 0.9, padding: 2 },
  dayButton: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayText: { fontSize: 13 },
  dayTextToday: { fontWeight: '800' },
  dayAmountWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  dayAmount: { fontSize: 9 },
  list: { paddingVertical: Spacing.one, gap: 0 },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.four },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 12 },
  itemText: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 14, fontWeight: '600' },
  itemSub: { fontSize: 12 },
  itemAmount: { fontSize: 14, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
