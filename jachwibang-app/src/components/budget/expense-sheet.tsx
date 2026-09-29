import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { EXPENSE_CATEGORIES } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { addDays, dateKey, formatDateLabel } from '@/lib/dates';
import { formatAmountInput, parseAmount } from '@/lib/format';
import { useBudget } from '@/state/budget-state';

/** Form for recording one expense. Opens with `initialDate` preselected. */
export function ExpenseSheet({ visible, initialDate, onClose }: { visible: boolean; initialDate: string; onClose: () => void }) {
  const theme = useTheme();
  const { addExpense } = useBudget();
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0].key);
  const [date, setDate] = useState(initialDate);
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start fresh each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setAmountText('');
    setCategory(EXPENSE_CATEGORIES[0].key);
    setDate(initialDate);
    setMemo('');
    setError(null);
  }, [visible, initialDate]);

  const amount = parseAmount(amountText);
  const today = dateKey(new Date());

  async function save() {
    if (amount <= 0) {
      setError('금액을 입력해주세요.');
      return;
    }
    setSaving(true);
    const { error: saveError } = await addExpense({ category, amount, spent_on: date, memo });
    setSaving(false);
    if (saveError) setError(`저장하지 못했어요: ${saveError}`);
    else onClose();
  }

  return (
    <Sheet visible={visible} title="지출 추가" onClose={onClose}>
      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>금액</Text>
        <View style={[styles.amountBox, { backgroundColor: theme.backgroundElement }]}>
          <TextInput
            value={amountText}
            onChangeText={(t) => setAmountText(formatAmountInput(t))}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            autoFocus
            style={[styles.amountInput, { color: theme.text }]}
            accessibilityLabel="금액"
          />
          <Text style={[styles.won, { color: theme.textSecondary }]}>원</Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>카테고리</Text>
        <View style={styles.chips}>
          {EXPENSE_CATEGORIES.map((c) => {
            const active = c.key === category;
            return (
              <Pressable
                key={c.key}
                onPress={() => setCategory(c.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.chip, { backgroundColor: active ? theme.accent : theme.backgroundElement }]}>
                <Ionicons name={c.icon} size={14} color={active ? theme.onAccent : theme.text} />
                <Text style={[styles.chipText, { color: active ? theme.onAccent : theme.text }]}>{c.key}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>날짜</Text>
        <View style={[styles.dateRow, { backgroundColor: theme.backgroundElement }]}>
          <Pressable onPress={() => setDate((d) => addDays(d, -1))} hitSlop={8} accessibilityLabel="하루 전">
            <Ionicons name="chevron-back" size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.dateText, { color: theme.text }]}>{formatDateLabel(date)}</Text>
          <Pressable
            onPress={() => setDate((d) => (d < today ? addDays(d, 1) : d))}
            hitSlop={8}
            disabled={date >= today}
            accessibilityLabel="하루 뒤">
            <Ionicons name="chevron-forward" size={18} color={date >= today ? theme.border : theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>메모 (선택)</Text>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="예: 편의점 도시락"
          placeholderTextColor={theme.textSecondary}
          maxLength={60}
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />
      </View>

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      <Button label="저장하기" onPress={save} loading={saving} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  label: { fontSize: 13, fontWeight: '600' },
  amountBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: Spacing.three },
  amountInput: { flex: 1, minWidth: 0, fontSize: 26, fontWeight: '700', paddingVertical: 12 },
  won: { fontSize: 18, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '600' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  dateText: { fontSize: 15, fontWeight: '600' },
  input: { borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: 14, fontSize: 15 },
  error: { fontSize: 13 },
});
