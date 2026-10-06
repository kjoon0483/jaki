import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BudgetGoalSheet } from '@/components/budget/budget-goal-sheet';
import { ExpenseSheet } from '@/components/budget/expense-sheet';
import { MonthPickerSheet } from '@/components/budget/month-picker-sheet';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import { categoryIcon } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { dateKey, formatDateLabel, monthKey } from '@/lib/dates';
import { formatShortWon, formatWon } from '@/lib/format';
import { Expense, sumForMonth, useBudget } from '@/state/budget-state';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface DayTotals {
  income: number;
  expense: number;
}

export default function BudgetScreen() {
  const theme = useTheme();
  const { expenses, loading, error, monthlyBudget, refresh, ensureMonth } = useBudget();

  const now = new Date();
  const todayKey = dateKey(now);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const mKey = monthKey(year, month);
  const isThisMonth = year === now.getFullYear() && month === now.getMonth();
  const [pickedDay, setPickedDay] = useState<string | null>(todayKey);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [monthLoading, setMonthLoading] = useState(false);

  // Months older than the provider's default window are fetched when first viewed.
  useEffect(() => {
    let alive = true;
    setMonthLoading(true);
    ensureMonth(mKey).finally(() => {
      if (alive) setMonthLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [mKey, ensureMonth]);

  const monthEntries = useMemo(() => expenses.filter((e) => e.spent_on.startsWith(mKey)), [expenses, mKey]);
  const total = sumForMonth(expenses, mKey);
  const income = sumForMonth(expenses, mKey, undefined, true);
  const balance = income - total;

  const byDay = useMemo(() => {
    const map: Record<string, DayTotals> = {};
    monthEntries.forEach((e) => {
      const day = (map[e.spent_on] ??= { income: 0, expense: 0 });
      if (e.is_income) day.income += e.amount;
      else day.expense += e.amount;
    });
    return map;
  }, [monthEntries]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthEntries.forEach((e) => {
      if (!e.is_income) map[e.category] = (map[e.category] ?? 0) + e.amount;
    });
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthEntries]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => dateKey(new Date(year, month, i + 1))),
  ];

  const selectedDay = pickedDay && pickedDay.startsWith(mKey) ? pickedDay : null;
  // Entries are already sorted newest day first, so grouping keeps that order.
  const groups = useMemo(() => {
    const list = selectedDay ? monthEntries.filter((e) => e.spent_on === selectedDay) : monthEntries;
    const result: { day: string; items: Expense[] }[] = [];
    list.forEach((e) => {
      const last = result[result.length - 1];
      if (last && last.day === e.spent_on) last.items.push(e);
      else result.push({ day: e.spent_on, items: [e] });
    });
    return result;
  }, [monthEntries, selectedDay]);

  /** Jumps to any month up to the current one; `m` may overflow (-1, 12) and is normalized. */
  function goToMonth(y: number, m: number) {
    const target = new Date(y, m, 1);
    const current = new Date(now.getFullYear(), now.getMonth(), 1);
    if (target > current) return;
    setYear(target.getFullYear());
    setMonth(target.getMonth());
    setPickedDay(target.getTime() === current.getTime() ? todayKey : null);
  }

  function openNew() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setSheetOpen(true);
  }

  const usedRatio = monthlyBudget ? Math.min(1, total / monthlyBudget) : 0;
  const over = monthlyBudget ? total > monthlyBudget : false;
  const otherYear = year !== now.getFullYear();

  return (
    <Screen
      title="가계부"
      right={
        <View style={[styles.monthSwitch, { backgroundColor: theme.backgroundElement }]}>
          <Pressable onPress={() => goToMonth(year, month - 1)} hitSlop={8} accessibilityLabel="이전 달">
            <Ionicons name="chevron-back" size={16} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={() => setPickerOpen(true)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${year}년 ${month + 1}월, 다른 달 고르기`}
            style={styles.monthLabel}>
            <Text style={[styles.monthText, { color: theme.text }]}>
              {otherYear ? `${String(year).slice(2)}년 ` : ''}
              {month + 1}월
            </Text>
            <Ionicons name="caret-down" size={10} color={theme.textSecondary} />
          </Pressable>
          <Pressable onPress={() => goToMonth(year, month + 1)} disabled={isThisMonth} hitSlop={8} accessibilityLabel="다음 달">
            <Ionicons name="chevron-forward" size={16} color={isThisMonth ? theme.border : theme.text} />
          </Pressable>
        </View>
      }
      floating={
        <Pressable
          style={({ pressed }) => [styles.fab, { backgroundColor: theme.accent }, pressed && { opacity: 0.85 }]}
          onPress={openNew}
          accessibilityRole="button"
          accessibilityLabel="내역 추가">
          <Ionicons name="add" size={26} color={theme.onAccent} />
        </Pressable>
      }>
      {/* 월 요약: 합계(수입 - 지출) + 수입·지출 + 예산 */}
      <Card tone="accent" style={styles.hero}>
        <Text style={[styles.heroLabel, { color: theme.onSurfaceAccent }]}>
          {otherYear ? `${year}년 ` : ''}
          {month + 1}월 합계
        </Text>
        <Text style={[styles.heroValue, { color: theme.onSurfaceAccent }]}>
          {balance > 0 ? '+' : balance < 0 ? '−' : ''}
          {formatWon(Math.abs(balance))}
        </Text>
        <View style={styles.heroSplit}>
          <View style={styles.heroCol}>
            <Text style={[styles.heroColLabel, { color: theme.onSurfaceAccent }]}>수입</Text>
            <Text style={[styles.heroColValue, { color: theme.onSurfaceAccent }]}>{formatWon(income)}</Text>
          </View>
          <View style={[styles.heroDivider, { backgroundColor: theme.onSurfaceAccent }]} />
          <View style={styles.heroCol}>
            <Text style={[styles.heroColLabel, { color: theme.onSurfaceAccent }]}>지출</Text>
            <Text style={[styles.heroColValue, { color: theme.onSurfaceAccent }]}>{formatWon(total)}</Text>
          </View>
        </View>
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
          <Pressable onPress={() => setGoalOpen(true)} style={styles.setGoal} accessibilityRole="button">
            <Ionicons name="flag-outline" size={14} color={theme.onSurfaceAccent} />
            <Text style={[styles.setGoalText, { color: theme.onSurfaceAccent }]}>한 달 예산 정하기</Text>
          </Pressable>
        )}
      </Card>

      {error ? (
        <Card>
          <Text style={[styles.errorTitle, { color: theme.danger }]}>내역을 불러오지 못했어요</Text>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>{error}</Text>
          <Pressable onPress={refresh} hitSlop={8}>
            <Text style={[styles.link, { color: theme.accent }]}>다시 시도</Text>
          </Pressable>
        </Card>
      ) : (loading && expenses.length === 0) || (monthLoading && monthEntries.length === 0) ? (
        <ActivityIndicator color={theme.accent} style={{ marginVertical: Spacing.four }} />
      ) : null}

      {/* 달력 */}
      <View style={styles.section}>
        <SectionHeader title="날짜별 내역" action={selectedDay ? '이번 달 전체' : undefined} onAction={() => setPickedDay(null)} />
        <Card style={styles.calCard}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text
                key={w}
                style={[styles.weekday, { color: i === 0 ? theme.expense : i === 6 ? theme.income : theme.textSecondary }]}>
                {w}
              </Text>
            ))}
          </View>
          <View style={styles.calGrid}>
            {cells.map((key, i) => {
              if (!key) return <View key={`b${i}`} style={styles.calCell} />;
              const day = byDay[key];
              const isToday = key === todayKey;
              const isPicked = key === selectedDay;
              const future = key > todayKey;
              const label = [
                formatDateLabel(key),
                day?.income ? `수입 ${formatWon(day.income)}` : '',
                day?.expense ? `지출 ${formatWon(day.expense)}` : '',
              ]
                .filter(Boolean)
                .join(', ');
              return (
                <View key={key} style={styles.calCell}>
                  <Pressable
                    onPress={() => setPickedDay(isPicked ? null : key)}
                    disabled={future}
                    accessibilityLabel={label}
                    accessibilityState={{ selected: isPicked }}
                    style={[
                      styles.dayButton,
                      isPicked && { backgroundColor: theme.accentSoft },
                      isToday && { borderWidth: 1.5, borderColor: theme.accent },
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        { color: future ? theme.border : theme.text },
                        (isToday || isPicked) && styles.dayTextStrong,
                      ]}>
                      {Number(key.slice(8))}
                    </Text>
                    {day?.income ? (
                      <Text style={[styles.dayAmount, { color: theme.income }]} numberOfLines={1}>
                        +{formatShortWon(day.income)}
                      </Text>
                    ) : null}
                    {day?.expense ? (
                      <Text style={[styles.dayAmount, { color: theme.expense }]} numberOfLines={1}>
                        −{formatShortWon(day.expense)}
                      </Text>
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Card>
      </View>

      {/* 내역: 날짜별로 묶어서 */}
      <View style={styles.section}>
        <SectionHeader title={selectedDay ? formatDateLabel(selectedDay) : `${month + 1}월 전체 내역`} />
        {groups.length === 0 ? (
          <Card>
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={22} color={theme.textSecondary} />
              <Text style={[styles.muted, { color: theme.textSecondary, textAlign: 'center' }]}>
                {monthEntries.length === 0
                  ? '아직 기록이 없어요.\n오른쪽 아래 + 버튼으로 수입·지출을 적어보세요.'
                  : '이 날은 기록이 없어요.'}
              </Text>
            </View>
          </Card>
        ) : (
          groups.map((g) => {
            const day = byDay[g.day];
            return (
              <Card key={g.day} style={styles.list}>
                <View style={[styles.dayHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.dayHeaderDate, { color: theme.text }]}>
                    {g.day === todayKey ? '오늘 · ' : ''}
                    {formatDateLabel(g.day)}
                  </Text>
                  <View style={styles.dayHeaderSums}>
                    {day?.income ? (
                      <Text style={[styles.dayHeaderSum, { color: theme.income }]}>+{formatWon(day.income)}</Text>
                    ) : null}
                    {day?.expense ? (
                      <Text style={[styles.dayHeaderSum, { color: theme.expense }]}>−{formatWon(day.expense)}</Text>
                    ) : null}
                  </View>
                </View>
                {g.items.map((e, i) => (
                  <Pressable
                    key={e.id}
                    onPress={() => openEdit(e)}
                    accessibilityRole="button"
                    accessibilityLabel={`${e.memo || e.category} ${e.is_income ? '수입' : '지출'} ${formatWon(e.amount)}, 수정하기`}
                    style={({ pressed }) => [
                      styles.itemRow,
                      i < g.items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                      pressed && { opacity: 0.6 },
                    ]}>
                    <View style={[styles.iconBubble, { backgroundColor: theme.background }]}>
                      <Ionicons name={categoryIcon(e.category)} size={15} color={e.is_income ? theme.income : theme.accent} />
                    </View>
                    <View style={styles.itemText}>
                      <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                        {e.memo || e.category}
                      </Text>
                      {e.memo ? <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{e.category}</Text> : null}
                    </View>
                    <Text style={[styles.itemAmount, { color: e.is_income ? theme.income : theme.expense }]}>
                      {e.is_income ? '+' : '−'}
                      {formatWon(e.amount)}
                    </Text>
                  </Pressable>
                ))}
              </Card>
            );
          })
        )}
      </View>

      {/* 카테고리별 지출 */}
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
      {/* Keeps the last row clear of the floating + button. */}
      <View style={{ height: 56 }} />

      <ExpenseSheet
        visible={sheetOpen}
        editing={editing}
        initialDate={selectedDay ?? (isThisMonth ? todayKey : dateKey(new Date(year, month, daysInMonth)))}
        onClose={() => setSheetOpen(false)}
      />
      <BudgetGoalSheet visible={goalOpen} onClose={() => setGoalOpen(false)} />
      <MonthPickerSheet
        visible={pickerOpen}
        year={year}
        month={month}
        onSelect={goToMonth}
        onClose={() => setPickerOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthSwitch: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  monthLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthText: { fontSize: 14, fontWeight: '700', minWidth: 34, textAlign: 'center' },
  hero: { padding: Spacing.four, gap: Spacing.two },
  heroLabel: { fontSize: 13, opacity: 0.85 },
  heroValue: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  heroSplit: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.one },
  heroCol: { flex: 1, gap: 2 },
  heroColLabel: { fontSize: 12, opacity: 0.8 },
  heroColValue: { fontSize: 16, fontWeight: '700' },
  heroDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', opacity: 0.4, marginHorizontal: Spacing.three },
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
  calCell: { width: `${100 / 7}%`, aspectRatio: 0.72, padding: 2 },
  dayButton: { flex: 1, borderRadius: 10, alignItems: 'center', paddingTop: 6, gap: 1 },
  dayText: { fontSize: 13, marginBottom: 2 },
  dayTextStrong: { fontWeight: '800' },
  dayAmount: { fontSize: 9, fontWeight: '600' },
  list: { paddingVertical: Spacing.one, gap: 0 },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayHeaderDate: { fontSize: 13, fontWeight: '700' },
  dayHeaderSums: { flexDirection: 'row', gap: Spacing.two },
  dayHeaderSum: { fontSize: 13, fontWeight: '700' },
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
