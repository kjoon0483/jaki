import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import type { SavedRoom } from '@/hooks/use-rooms';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/dates';

/** "내 방" list: open, share or delete saved rooms, or start a new one. */
export function RoomsSheet({
  visible,
  rooms,
  loading,
  error,
  currentId,
  onClose,
  onOpen,
  onShare,
  onDelete,
  onNew,
}: {
  visible: boolean;
  rooms: SavedRoom[];
  loading: boolean;
  error: string | null;
  currentId: string | null;
  onClose: () => void;
  onOpen: (room: SavedRoom) => void;
  onShare: (room: SavedRoom) => void;
  onDelete: (room: SavedRoom) => void;
  onNew: () => void;
}) {
  const theme = useTheme();
  return (
    <Sheet visible={visible} title="내 방" onClose={onClose}>
      {error ? (
        <Text style={[styles.msg, { color: theme.danger }]}>{error}</Text>
      ) : loading && rooms.length === 0 ? (
        <ActivityIndicator color={theme.accent} style={{ marginVertical: Spacing.four }} />
      ) : rooms.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cube-outline" size={26} color={theme.accent} />
          <Text style={[styles.msg, { color: theme.textSecondary, textAlign: 'center' }]}>
            아직 저장한 방이 없어요.{'\n'}위쪽의 저장 버튼으로 지금 방을 저장해보세요.
          </Text>
        </View>
      ) : (
        <View style={[styles.list, { backgroundColor: theme.backgroundElement }]}>
          {rooms.map((r, i) => (
            <View
              key={r.id}
              style={[styles.row, i < rooms.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
              <Pressable style={styles.rowMain} onPress={() => onOpen(r)} accessibilityRole="button" accessibilityLabel={`${r.name} 열기`}>
                <View style={[styles.icon, { backgroundColor: r.id === currentId ? theme.accent : theme.background }]}>
                  <Ionicons name="cube-outline" size={16} color={r.id === currentId ? theme.onAccent : theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>
                    {r.id === currentId ? '지금 편집 중 · ' : ''}
                    {timeAgo(r.updated_at)} 저장
                  </Text>
                </View>
              </Pressable>
              <Pressable onPress={() => onShare(r)} hitSlop={8} style={styles.action} accessibilityLabel={`${r.name} 커뮤니티에 공유`}>
                <Ionicons name="share-social-outline" size={18} color={theme.accent} />
              </Pressable>
              <Pressable onPress={() => onDelete(r)} hitSlop={8} style={styles.action} accessibilityLabel={`${r.name} 삭제`}>
                <Ionicons name="trash-outline" size={17} color={theme.textSecondary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <Button label="새 방으로 시작하기" variant="secondary" onPress={onNew} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  msg: { fontSize: 13, lineHeight: 19 },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three },
  list: { borderRadius: 16, paddingHorizontal: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: 12 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12 },
  action: { padding: 6 },
});
