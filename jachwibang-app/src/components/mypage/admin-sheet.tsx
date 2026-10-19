import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AdminReport, deleteReported, dismissReport, fetchReports } from '@/lib/admin';
import { confirmAsync, notify } from '@/lib/confirm';

/** Administrator only: reported posts/comments, to delete or to close without action. */
export function AdminSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const [data, setData] = useState<{ reports: AdminReport[]; error: string | null } | null>(null);
  const loading = visible && data === null;
  const reports = data?.reports ?? [];
  const error = data?.error ?? null;

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    fetchReports().then((res) => alive && setData(res));
    return () => {
      alive = false;
      setData(null);
    };
  }, [visible]);

  function removeWhere(keep: (x: AdminReport) => boolean) {
    setData((prev) => (prev ? { ...prev, reports: prev.reports.filter(keep) } : prev));
  }

  async function dismiss(r: AdminReport) {
    const { error: err } = await dismissReport(r.id);
    if (err) return notify('처리하지 못했어요', err);
    removeWhere((x) => x.id !== r.id);
  }

  async function remove(r: AdminReport) {
    const label = r.kind === 'post' ? '글' : '댓글';
    if (!(await confirmAsync(`${label}을 삭제할까요?`, '삭제하면 되돌릴 수 없고, 이 글에 들어온 신고도 함께 사라져요.', '삭제'))) return;
    const { error: err } = await deleteReported(r);
    if (err) return notify('삭제하지 못했어요', err);
    removeWhere((x) => x.targetId !== r.targetId);
  }

  return (
    <Sheet visible={visible} title="관리자 · 신고" onClose={onClose}>
      {error ? (
        <Text style={[styles.msg, { color: theme.danger }]}>{error}</Text>
      ) : loading ? (
        <ActivityIndicator color={theme.accent} style={{ marginVertical: Spacing.four }} />
      ) : reports.length === 0 ? (
        <Text style={[styles.msg, { color: theme.textSecondary }]}>들어온 신고가 없어요.</Text>
      ) : (
        reports.map((r) => (
          <View key={r.id} style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.meta}>
              <Text style={[styles.badge, { color: theme.accent }]}>{r.kind === 'post' ? '글' : '댓글'}</Text>
              <Text style={[styles.reason, { color: theme.text }]} numberOfLines={1}>
                {r.reason}
                {r.count > 1 ? ` · 신고 ${r.count}건` : ''}
              </Text>
              <Text style={[styles.date, { color: theme.textSecondary }]}>{r.createdAt.slice(0, 10)}</Text>
            </View>
            <Text style={[styles.author, { color: theme.textSecondary }]}>작성자 {r.authorName}</Text>
            <Text style={[styles.text, { color: r.text ? theme.text : theme.textSecondary }]} numberOfLines={6}>
              {r.text ?? '이미 삭제된 내용이에요.'}
            </Text>
            <View style={styles.actions}>
              <Pressable onPress={() => dismiss(r)} accessibilityRole="button" style={[styles.btn, { backgroundColor: theme.background }]}>
                <Text style={[styles.btnText, { color: theme.text }]}>문제 없음</Text>
              </Pressable>
              {r.text ? (
                <Pressable onPress={() => remove(r)} accessibilityRole="button" style={[styles.btn, { backgroundColor: theme.background }]}>
                  <Text style={[styles.btnText, { color: theme.danger }]}>삭제</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))
      )}
      <Text style={[styles.help, { color: theme.textSecondary }]}>
        {'‘문제 없음’은 신고만 지우고 글은 그대로 두어요. ‘삭제’는 글(또는 댓글)을 지워요.'}
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  msg: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginVertical: Spacing.three },
  card: { borderRadius: 14, padding: Spacing.three, gap: 6, marginBottom: Spacing.two },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: { fontSize: 12, fontWeight: '800' },
  reason: { flex: 1, fontSize: 14, fontWeight: '700' },
  date: { fontSize: 12 },
  author: { fontSize: 12 },
  text: { fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: 4 },
  btn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  btnText: { fontSize: 13, fontWeight: '700' },
  help: { fontSize: 12, lineHeight: 18 },
});
