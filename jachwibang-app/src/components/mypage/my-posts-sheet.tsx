import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/dates';

export interface MyPost {
  id: string;
  body: string;
  topic: string;
  likes_count: number;
  created_at: string;
}

/** List of the posts I wrote, with delete. */
export function MyPostsSheet({
  visible,
  posts,
  loading,
  error,
  onClose,
  onDelete,
}: {
  visible: boolean;
  posts: MyPost[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onDelete: (post: MyPost) => void;
}) {
  const theme = useTheme();
  return (
    <Sheet visible={visible} title="내가 쓴 글" onClose={onClose}>
      {error ? (
        <Text style={[styles.msg, { color: theme.danger }]}>{error}</Text>
      ) : loading && posts.length === 0 ? (
        <ActivityIndicator color={theme.accent} style={{ marginVertical: Spacing.four }} />
      ) : posts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="create-outline" size={24} color={theme.accent} />
          <Text style={[styles.msg, { color: theme.textSecondary }]}>아직 쓴 글이 없어요.</Text>
        </View>
      ) : (
        <View style={[styles.list, { backgroundColor: theme.backgroundElement }]}>
          {posts.map((p, i) => (
            <View
              key={p.id}
              style={[styles.row, i < posts.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
              <View style={styles.rowText}>
                <Text style={[styles.body, { color: theme.text }]} numberOfLines={2}>
                  {p.body}
                </Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {p.topic} · {timeAgo(p.created_at)} · ♥ {p.likes_count}
                </Text>
              </View>
              <Pressable onPress={() => onDelete(p)} hitSlop={10} accessibilityLabel="글 삭제">
                <Ionicons name="trash-outline" size={17} color={theme.textSecondary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  msg: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.four },
  list: { borderRadius: 16, paddingHorizontal: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 12 },
  rowText: { flex: 1, gap: 3 },
  body: { fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 12 },
});
