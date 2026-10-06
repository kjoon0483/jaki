import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** How many years back the picker goes. */
const YEARS_BACK = 10;

/** Year + month grid for jumping the ledger to any past month. Months after the current one are disabled. */
export function MonthPickerSheet({
  visible,
  year,
  month,
  onSelect,
  onClose,
}: {
  visible: boolean;
  year: number;
  month: number; // 0-based
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const now = new Date();
  const thisYear = now.getFullYear();
  const minYear = thisYear - YEARS_BACK;
  const [shownYear, setShownYear] = useState(year);

  useEffect(() => {
    if (visible) setShownYear(year);
  }, [visible, year]);

  return (
    <Sheet visible={visible} title="월 선택" onClose={onClose}>
      <View style={styles.yearRow}>
        <Pressable
          onPress={() => setShownYear((y) => Math.max(minYear, y - 1))}
          disabled={shownYear <= minYear}
          hitSlop={10}
          accessibilityLabel="이전 해">
          <Ionicons name="chevron-back" size={20} color={shownYear <= minYear ? theme.border : theme.text} />
        </Pressable>
        <Text style={[styles.yearText, { color: theme.text }]}>{shownYear}년</Text>
        <Pressable
          onPress={() => setShownYear((y) => Math.min(thisYear, y + 1))}
          disabled={shownYear >= thisYear}
          hitSlop={10}
          accessibilityLabel="다음 해">
          <Ionicons name="chevron-forward" size={20} color={shownYear >= thisYear ? theme.border : theme.text} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {Array.from({ length: 12 }, (_, m) => {
          const future = shownYear === thisYear && m > now.getMonth();
          const active = shownYear === year && m === month;
          return (
            <View key={m} style={styles.cell}>
              <Pressable
                onPress={() => {
                  onSelect(shownYear, m);
                  onClose();
                }}
                disabled={future}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: future }}
                style={[styles.monthButton, { backgroundColor: active ? theme.accent : theme.backgroundElement }]}>
                <Text
                  style={[
                    styles.monthText,
                    { color: active ? theme.onAccent : future ? theme.border : theme.text },
                  ]}>
                  {m + 1}월
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      {shownYear !== thisYear || month !== now.getMonth() || year !== thisYear ? (
        <Pressable
          onPress={() => {
            onSelect(thisYear, now.getMonth());
            onClose();
          }}
          style={styles.todayButton}
          accessibilityRole="button">
          <Text style={[styles.todayText, { color: theme.accent }]}>이번 달로 가기</Text>
        </Pressable>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  yearText: { fontSize: 18, fontWeight: '700', minWidth: 80, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  cell: { width: '25%', padding: 4 },
  monthButton: { alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  monthText: { fontSize: 15, fontWeight: '600' },
  todayButton: { alignItems: 'center', paddingVertical: 8 },
  todayText: { fontSize: 14, fontWeight: '700' },
});
