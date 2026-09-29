import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatAmountInput, parseAmount } from '@/lib/format';
import { useBudget } from '@/state/budget-state';

/** Sets (or clears) the monthly spending goal. */
export function BudgetGoalSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const { monthlyBudget, setMonthlyBudget } = useBudget();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setText(monthlyBudget ? monthlyBudget.toLocaleString('ko-KR') : '');
    setError(null);
  }, [visible, monthlyBudget]);

  async function save(amount: number | null) {
    setSaving(true);
    const { error: saveError } = await setMonthlyBudget(amount);
    setSaving(false);
    if (saveError) setError(`저장하지 못했어요: ${saveError}`);
    else onClose();
  }

  const amount = parseAmount(text);

  return (
    <Sheet visible={visible} title="한 달 예산" onClose={onClose}>
      <Text style={[styles.help, { color: theme.textSecondary }]}>
        한 달에 쓸 금액을 정해두면 홈과 가계부에서 얼마나 남았는지 보여드려요.
      </Text>
      <View style={[styles.amountBox, { backgroundColor: theme.backgroundElement }]}>
        <TextInput
          value={text}
          onChangeText={(t) => setText(formatAmountInput(t))}
          placeholder="예: 600,000"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          autoFocus
          style={[styles.amountInput, { color: theme.text }]}
          accessibilityLabel="한 달 예산"
        />
        <Text style={[styles.won, { color: theme.textSecondary }]}>원</Text>
      </View>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      <Button label="저장하기" onPress={() => save(amount)} loading={saving} disabled={amount <= 0} />
      {monthlyBudget ? <Button label="예산 없애기" variant="secondary" onPress={() => save(null)} disabled={saving} /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  help: { fontSize: 13, lineHeight: 19 },
  amountBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: Spacing.three },
  amountInput: { flex: 1, minWidth: 0, fontSize: 26, fontWeight: '700', paddingVertical: 12 },
  won: { fontSize: 18, fontWeight: '600' },
  error: { fontSize: 13 },
});
