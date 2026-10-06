import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { confirmAsync } from '@/lib/confirm';
import { addDays, dateKey, formatDateLabel } from '@/lib/dates';
import { formatAmountInput, formatWon, parseAmount } from '@/lib/format';
import { Expense, useBudget } from '@/state/budget-state';

/**
 * Form for recording one ledger entry (expense or income). Opens with `initialDate` preselected,
 * or pre-filled from `editing` to change/delete an existing entry.
 */
export function ExpenseSheet({
  visible,
  initialDate,
  editing,
  onClose,
}: {
  visible: boolean;
  initialDate: string;
  editing?: Expense | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { addExpense, updateExpense, deleteExpense } = useBudget();
  const [isIncome, setIsIncome] = useState(false);
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0].key);
  const [date, setDate] = useState(initialDate);
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start fresh (or from the entry being edited) each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setIsIncome(editing?.is_income ?? false);
    setAmountText(editing ? formatAmountInput(String(editing.amount)) : '');
    setCategory(editing?.category ?? EXPENSE_CATEGORIES[0].key);
    setDate(editing?.spent_on ?? initialDate);
    setMemo(editing?.memo ?? '');
    setError(null);
  }, [visible, initialDate, editing]);

  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const amount = parseAmount(amountText);
  const today = dateKey(new Date());
  const tint = isIncome ? theme.income : theme.expense;

  function switchKind(income: boolean) {
    if (income === isIncome) return;
    setIsIncome(income);
    setCategory((income ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0].key);
  }

  async function save() {
    if (amount <= 0) {
      setError('금액을 입력해주세요.');
      return;
    }
    setSaving(true);
    const input = { category, amount, spent_on: date, memo, is_income: isIncome };
    const { error: saveError } = editing ? await updateExpense(editing.id, input) : await addExpense(input);
    setSaving(false);
    if (saveError) setError(`저장하지 못했어요: ${saveError}`);
    else onClose();
  }

  async function remove() {
    if (!editing) return;
    const ok = await confirmAsync('내역 삭제', `${editing.category} ${formatWon(editing.amount)}을(를) 삭제할까요?`, '삭제');
    if (!ok) return;
    const { error: deleteError } = await deleteExpense(editing.id);
    if (deleteError) setError(`삭제하지 못했어요: ${deleteError}`);
    else onClose();
  }

  return (
    <Sheet visible={visible} title={editing ? '내역 수정' : '내역 추가'} onClose={onClose}>
      <View style={[styles.segment, { backgroundColor: theme.backgroundElement }]}>
        {[false, true].map((income) => {
          const active = income === isIncome;
          return (
            <Pressable
              key={String(income)}
              onPress={() => switchKind(income)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.segmentItem, active && { backgroundColor: income ? theme.income : theme.expense }]}>
              <Text style={[styles.segmentText, { color: active ? '#FFFFFF' : theme.textSecondary }]}>
                {income ? '수입' : '지출'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>금액</Text>
        <View style={[styles.amountBox, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.sign, { color: tint }]}>{isIncome ? '+' : '−'}</Text>
          <TextInput
            value={amountText}
            onChangeText={(t) => setAmountText(formatAmountInput(t))}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            autoFocus={!editing}
            style={[styles.amountInput, { color: tint }]}
            accessibilityLabel="금액"
          />
          <Text style={[styles.won, { color: theme.textSecondary }]}>원</Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>카테고리</Text>
        <View style={styles.chips}>
          {categories.map((c) => {
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
          <Text style={[styles.dateText, { color: theme.text }]}>
            {date.slice(0, 4) !== today.slice(0, 4) ? `${date.slice(0, 4)}년 ` : ''}
            {formatDateLabel(date)}
          </Text>
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
          placeholder={isIncome ? '예: 10월 알바비' : '예: 편의점 도시락'}
          placeholderTextColor={theme.textSecondary}
          maxLength={60}
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />
      </View>

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      <Button label={editing ? '수정하기' : '저장하기'} onPress={save} loading={saving} />
      {editing ? (
        <Pressable onPress={remove} style={styles.deleteButton} accessibilityRole="button">
          <Ionicons name="trash-outline" size={15} color={theme.danger} />
          <Text style={[styles.deleteText, { color: theme.danger }]}>이 내역 삭제</Text>
        </Pressable>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
  segmentText: { fontSize: 14, fontWeight: '700' },
  field: { gap: Spacing.two },
  label: { fontSize: 13, fontWeight: '600' },
  amountBox: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 14, paddingHorizontal: Spacing.three },
  sign: { fontSize: 24, fontWeight: '700' },
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
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  deleteText: { fontSize: 14, fontWeight: '600' },
});
