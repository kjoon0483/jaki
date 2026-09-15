import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { categoryBreakdown, formatWon, monthlyExpensesByDay, totalThisMonth } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function BudgetScreen() {
  const theme = useTheme();
  const [pickedDay, setPickedDay] = useState<number | null>(null);

  const { year, month, today, firstWeekday, daysInMonth } = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      today: now.getDate(),
      firstWeekday: new Date(now.getFullYear(), now.getMonth(), 1).getDay(),
      daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    };
  }, []);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstWeekday }, (_, i) => `blank-${i}`);

  let detail = '지출 내역을 보려면 날짜를 눌러보세요';
  if (pickedDay !== null) {
    const amount = monthlyExpensesByDay[pickedDay];
    detail = amount
      ? `${month + 1}월 ${pickedDay}일 · ${formatWon(amount)} 지출`
      : `${month + 1}월 ${pickedDay}일 · 지출 내역 없음`;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>가계부</Text>

        <View style={styles.headerRow}>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>{month + 1}월 지출</Text>
          <Text style={[styles.link, { color: theme.accent }]}>전체보기</Text>
        </View>
        <Text style={[styles.total, { color: theme.text }]}>{formatWon(totalThisMonth)}</Text>

        <View style={{ gap: Spacing.two }}>
          {categoryBreakdown.map((row) => (
            <View key={row.category} style={styles.categoryRow}>
              <View style={styles.categoryLabel}>
                <Ionicons name={row.icon as never} size={15} color={theme.accent} />
                <Text style={[styles.categoryText, { color: theme.text }]}>{row.category}</Text>
              </View>
              <Text style={[styles.categoryAmount, { color: theme.text }]}>{formatWon(row.amount)}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.muted, { color: theme.textSecondary, marginTop: Spacing.two }]}>날짜별 지출</Text>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={[styles.weekday, { color: theme.textSecondary }]}>
              {w}
            </Text>
          ))}
        </View>
        <View style={styles.calGrid}>
          {leadingBlanks.map((key) => (
            <View key={key} style={styles.calCell} />
          ))}
          {days.map((day) => {
            const hasSpend = monthlyExpensesByDay[day] !== undefined;
            const isToday = day === today;
            const isPicked = day === pickedDay;
            return (
              <View key={day} style={styles.calCell}>
                <Pressable
                  onPress={() => setPickedDay(day)}
                  style={[
                    styles.dayButton,
                    { backgroundColor: hasSpend ? theme.accentSoft : theme.backgroundElement },
                    isToday && { borderWidth: 1.5, borderColor: theme.accent },
                    isPicked && { borderWidth: 2, borderColor: theme.accent },
                  ]}>
                  <Text style={[styles.dayText, { color: theme.text }]}>{day}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={[styles.detailBox, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.detailText, { color: theme.accent }]}>{detail}</Text>
        </View>

        <Pressable
          style={[styles.fab, { backgroundColor: theme.accent }]}
          onPress={() => Alert.alert('지출 추가', '지출 등록 기능은 준비 중이에요.')}>
          <Ionicons name="add" size={20} color={theme.onAccent} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  pageTitle: { fontSize: 22, fontWeight: '700' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  muted: { fontSize: 12 },
  link: { fontSize: 12 },
  total: { fontSize: 24, fontWeight: '700' },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  categoryText: { fontSize: 13 },
  categoryAmount: { fontSize: 13, fontWeight: '600' },
  weekRow: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  dayButton: { flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 12 },
  detailBox: { borderRadius: Spacing.two, padding: Spacing.three },
  detailText: { fontSize: 12 },
  fab: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
