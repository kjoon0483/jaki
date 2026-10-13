import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { notify } from '@/lib/confirm';
import { fetchBlockedUsers, unblockUser } from '@/lib/safety';

/** Users I've blocked, with a button to unblock each. */
export function BlockedSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setLoading(true);
    fetchBlockedUsers().then((res) => {
      if (!alive) return;
      setUsers(res.users);
      setError(res.error);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [visible]);

  async function unblock(id: string) {
    const { error: unblockError } = await unblockUser(id);
    if (unblockError) return notify('차단을 풀지 못했어요', unblockError);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <Sheet visible={visible} title="차단한 사용자" onClose={onClose}>
      {error ? (
        <Text style={[styles.msg, { color: theme.danger }]}>{error}</Text>
      ) : loading ? (
        <ActivityIndicator color={theme.accent} style={{ marginVertical: Spacing.four }} />
      ) : users.length === 0 ? (
        <Text style={[styles.msg, { color: theme.textSecondary }]}>차단한 사용자가 없어요.</Text>
      ) : (
        <View style={[styles.list, { backgroundColor: theme.backgroundElement }]}>
          {users.map((u, i) => (
            <View
              key={u.id}
              style={[styles.row, i < users.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {u.name}
              </Text>
              <Pressable
                onPress={() => unblock(u.id)}
                accessibilityRole="button"
                accessibilityLabel={`${u.name}님 차단 풀기`}
                style={[styles.unblock, { backgroundColor: theme.background }]}>
                <Text style={[styles.unblockText, { color: theme.accent }]}>차단 풀기</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <Text style={[styles.help, { color: theme.textSecondary }]}>
        차단을 풀면 커뮤니티를 다시 열 때 그 사람의 글과 댓글이 보여요.
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  msg: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginVertical: Spacing.three },
  list: { borderRadius: 14, paddingHorizontal: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 12 },
  name: { flex: 1, fontSize: 15, fontWeight: '600' },
  unblock: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  unblockText: { fontSize: 13, fontWeight: '700' },
  help: { fontSize: 12, lineHeight: 18 },
});
