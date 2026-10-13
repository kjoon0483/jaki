import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmAsync, notify } from '@/lib/confirm';
import { REPORT_REASONS } from '@/lib/safety';

export interface SafetyTarget {
  kind: 'post' | 'comment';
  author: string;
}

/**
 * Report / block menu for someone else's post or comment.
 * First shows the two actions; "신고하기" then asks for a reason.
 */
export function SafetySheet({
  target,
  onClose,
  onReport,
  onBlock,
}: {
  target: SafetyTarget | null;
  onClose: () => void;
  onReport: (reason: string) => Promise<{ error: string | null }>;
  onBlock: () => Promise<{ error: string | null }>;
}) {
  const theme = useTheme();
  const [step, setStep] = useState<'menu' | 'reason'>('menu');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (target) setStep('menu');
  }, [target]);

  const what = target?.kind === 'comment' ? '댓글' : '글';

  async function report(reason: string) {
    setBusy(true);
    const { error } = await onReport(reason);
    setBusy(false);
    if (error) return notify('신고하지 못했어요', error);
    onClose();
    notify('신고했어요', `검토 후 처리할게요. 이 ${what}은 이제 보이지 않아요.`);
  }

  async function block() {
    if (!target) return;
    const ok = await confirmAsync(
      `${target.author}님 차단`,
      `${target.author}님의 글과 댓글이 더 이상 보이지 않아요. 마이페이지에서 언제든 풀 수 있어요.`,
      '차단'
    );
    if (!ok) return;
    setBusy(true);
    const { error } = await onBlock();
    setBusy(false);
    if (error) return notify('차단하지 못했어요', error);
    onClose();
  }

  const row = (icon: keyof typeof Ionicons.glyphMap, label: string, onPress: () => void, danger = false) => (
    <Pressable
      key={label}
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, { borderBottomColor: theme.border }, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={18} color={danger ? theme.danger : theme.text} />
      <Text style={[styles.rowText, { color: danger ? theme.danger : theme.text }]}>{label}</Text>
    </Pressable>
  );

  return (
    <Sheet visible={!!target} title={step === 'menu' ? `${what} 메뉴` : '신고 이유'} onClose={onClose}>
      {busy ? <ActivityIndicator color={theme.accent} /> : null}
      {step === 'menu' ? (
        <View style={[styles.list, { backgroundColor: theme.backgroundElement }]}>
          {row('flag-outline', `${what} 신고하기`, () => setStep('reason'))}
          {row('ban-outline', `${target?.author ?? ''}님 차단하기`, block, true)}
        </View>
      ) : (
        <>
          <Text style={[styles.help, { color: theme.textSecondary }]}>어떤 문제가 있나요? 신고한 {what}은 바로 숨겨져요.</Text>
          <View style={[styles.list, { backgroundColor: theme.backgroundElement }]}>
            {REPORT_REASONS.map((r) => row('alert-circle-outline', r, () => report(r)))}
          </View>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { borderRadius: 14, paddingHorizontal: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, fontSize: 15 },
  help: { fontSize: 13, lineHeight: 19 },
});
