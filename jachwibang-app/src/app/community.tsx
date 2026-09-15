import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FurnitureIcon } from '@/components/furniture-icon';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { CommunityPost } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';
import { useAppState } from '@/state/app-state';

export default function CommunityScreen() {
  const theme = useTheme();
  const { posts, setPosts } = useAppState();
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  function toggleLike(id: number) {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p))
    );
  }

  function toggleComments(id: number) {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function sendComment(id: number) {
    const text = (drafts[id] ?? '').trim();
    if (!text) return;
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, comments: [...p.comments, { author: '나', text }] } : p))
    );
    setDrafts((prev) => ({ ...prev, [id]: '' }));
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>커뮤니티</Text>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            commentsOpen={openComments.has(post.id)}
            draft={drafts[post.id] ?? ''}
            onDraftChange={(t) => setDrafts((prev) => ({ ...prev, [post.id]: t }))}
            onToggleLike={() => toggleLike(post.id)}
            onToggleComments={() => toggleComments(post.id)}
            onSendComment={() => sendComment(post.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function PostCard({
  post,
  commentsOpen,
  draft,
  onDraftChange,
  onToggleLike,
  onToggleComments,
  onSendComment,
}: {
  post: CommunityPost;
  commentsOpen: boolean;
  draft: string;
  onDraftChange: (text: string) => void;
  onToggleLike: () => void;
  onToggleComments: () => void;
  onSendComment: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.authorRow}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.avatarText, { color: theme.accent }]}>{post.author.charAt(0)}</Text>
        </View>
        <Text style={[styles.authorText, { color: theme.text }]}>{post.author}님의 방</Text>
      </View>

      <View style={[styles.thumb, { backgroundColor: theme.background }]}>
        {post.placed.map((item) => (
          <View
            key={item.id}
            style={{
              position: 'absolute',
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: [{ translateX: -12 }, { translateY: -10 }, { scale: 0.55 }, { rotate: `${item.rotation}deg` }],
            }}>
            <FurnitureIcon type={item.type} />
          </View>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionItem} onPress={onToggleLike}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={17} color={post.liked ? theme.danger : theme.textSecondary} />
          <Text style={[styles.actionCount, { color: theme.textSecondary }]}>{post.likes}</Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={onToggleComments}>
          <Ionicons name="chatbubble-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.actionCount, { color: theme.textSecondary }]}>{post.comments.length}</Text>
        </Pressable>
      </View>

      {commentsOpen && (
        <View style={[styles.commentsBox, { borderTopColor: theme.border }]}>
          {post.comments.length === 0 ? (
            <Text style={[styles.noComment, { color: theme.textSecondary }]}>아직 댓글이 없어요</Text>
          ) : (
            post.comments.map((c, i) => (
              <Text key={i} style={[styles.commentLine, { color: theme.textSecondary }]}>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{c.author}</Text> {c.text}
              </Text>
            ))
          )}
          <View style={styles.commentInputRow}>
            <TextInput
              value={draft}
              onChangeText={onDraftChange}
              onSubmitEditing={onSendComment}
              placeholder="댓글 달기"
              placeholderTextColor={theme.textSecondary}
              style={[styles.commentInput, { backgroundColor: theme.background, color: theme.text }]}
            />
            <Pressable style={[styles.sendBtn, { backgroundColor: theme.accent }]} onPress={onSendComment}>
              <Ionicons name="send" size={13} color={theme.onAccent} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  pageTitle: { fontSize: 22, fontWeight: '700' },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '700' },
  authorText: { fontSize: 13, fontWeight: '600' },
  thumb: { height: 100, borderRadius: Spacing.two, overflow: 'hidden' },
  actionsRow: { flexDirection: 'row', gap: Spacing.four },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { fontSize: 12 },
  commentsBox: { borderTopWidth: 1, paddingTop: Spacing.two, gap: 4 },
  noComment: { fontSize: 11 },
  commentLine: { fontSize: 12 },
  commentInputRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  commentInput: { flex: 1, height: 32, borderRadius: 8, paddingHorizontal: 10, fontSize: 12 },
  sendBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
