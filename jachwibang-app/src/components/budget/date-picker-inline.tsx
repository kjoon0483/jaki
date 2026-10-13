import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { dateKey, parseDateKey } from '@/lib/dates';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** Compact month calendar for picking a past (or today's) date inside a sheet. */
export function DatePickerInline({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const theme = useTheme();
  const today = dateKey(new Date());
  const initial = parseDateKey(value);
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => dateKey(new Date(year, month, i + 1))),
  ];

  return (
    <View style={[styles.box, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.header}>
        <Pressable onPress={() => shift(-1)} hitSlop={8} accessibilityLabel="이전 달">
          <Ionicons name="chevron-back" size={16} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>
          {year}년 {month + 1}월
        </Text>
        <Pressable onPress={() => shift(1)} disabled={isCurrentMonth} hitSlop={8} accessibilityLabel="다음 달">
          <Ionicons name="chevron-forward" size={16} color={isCurrentMonth ? theme.border : theme.text} />
        </Pressable>
      </View>
      <View style={styles.row}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={[styles.weekday, { color: theme.textSecondary }]}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((key, i) => {
          if (!key) return <View key={`b${i}`} style={styles.cell} />;
          const selected = key === value;
          const future = key > today;
          return (
            <View key={key} style={styles.cell}>
              <Pressable
                onPress={() => onChange(key)}
                disabled={future}
                accessibilityState={{ selected }}
                style={[styles.day, selected && { backgroundColor: theme.accent }]}>
                <Text
                  style={[
                    styles.dayText,
                    { color: selected ? theme.onAccent : future ? theme.border : theme.text },
                    (selected || key === today) && styles.dayTextStrong,
                  ]}>
                  {Number(key.slice(8))}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 14, padding: 12, gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  title: { fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  day: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 13 },
  dayTextStrong: { fontWeight: '800' },
});
