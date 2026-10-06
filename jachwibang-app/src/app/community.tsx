import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ComposeSheet } from '@/components/community/compose-sheet';
import { RoomPreview } from '@/components/community/room-preview';
import { RoomViewer } from '@/components/community/room-viewer';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { POST_TOPICS } from '@/data/topics';
import { Post, PostComment, useCommunity } from '@/hooks/use-community';
import { useTheme } from '@/hooks/use-theme';
import { confirmAsync, notify } from '@/lib/confirm';
import { timeAgo } from '@/lib/dates';

const FILTERS = ['전체', ...POST_TOPICS] as const;

export default function CommunityScreen() {
  const theme = useTheme();
  const { me, posts, loading, error, refresh, createPost, deletePost, toggleLike, addComment, deleteComment } =
    useCommunity();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('전체');
  const [composeOpen, setComposeOpen] = useState(false);
  const [viewing, setViewing] = useState<Post | null>(null);

  // Pick up posts shared from the 3D tab (or by others) whenever this tab comes into view.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const visible = filter === '전체' ? posts : posts.filter((p) => p.topic === filter);

  async function report<T extends { error: string | null }>(p: Promise<T>, title: string) {
    const { error: e } = await p;
    if (e) notify(title, e);
  }

  return (
    <Screen
      title="커뮤니티"
      refreshing={loading && posts.length > 0}
      onRefresh={refresh}
      floating={
        <Pressable
          style={({ pressed }) => [styles.fab, { backgroundColor: theme.accent }, pressed && { opacity: 0.85 }]}
          onPress={() => setComposeOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="글쓰기">
          <Ionicons name="create-outline" size={24} color={theme.onAccent} />
        </Pressable>
      }>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.filterChip, { backgroundColor: active ? theme.accent : theme.backgroundElement }]}>
              <Text style={[styles.filterText, { color: active ? theme.onAccent : theme.text }]}>{f}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? (
        <Card>
          <Text style={[styles.errorTitle, { color: theme.danger }]}>커뮤니티를 불러오지 못했어요</Text>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>{error}</Text>
          <Pressable onPress={refresh} hitSlop={8}>
            <Text style={[styles.link, { color: theme.accent }]}>다시 시도</Text>
          </Pressable>
        </Card>
      ) : loading && posts.length === 0 ? (
        <ActivityIndicator color={theme.accent} style={{ marginVertical: Spacing.five }} />
      ) : visible.length === 0 ? (
        <Card style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={26} color={theme.accent} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {posts.length === 0 ? '아직 글이 없어요' : `'${filter}' 글이 아직 없어요`}
          </Text>
          <Text style={[styles.muted, { color: theme.textSecondary, textAlign: 'center' }]}>
            첫 번째로 우리 방 이야기를 들려주세요.
          </Text>
          <Pressable onPress={() => setComposeOpen(true)} hitSlop={8}>
            <Text style={[styles.link, { color: theme.accent }]}>글쓰기</Text>
          </Pressable>
        </Card>
      ) : (
        visible.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            mine={post.user_id === me}
            me={me}
            onToggleLike={() => report(toggleLike(post), '좋아요를 반영하지 못했어요')}
            onOpenRoom={() => setViewing(post)}
            onDelete={async () => {
              if (await confirmAsync('글 삭제', '이 글을 삭제할까요? 댓글도 함께 지워져요.', '삭제')) {
                report(deletePost(post.id), '삭제하지 못했어요');
              }
            }}
            onAddComment={(text) => addComment(post.id, text)}
            onDeleteComment={async (c) => {
              if (await confirmAsync('댓글 삭제', '이 댓글을 삭제할까요?', '삭제')) {
                report(deleteComment(c), '삭제하지 못했어요');
              }
            }}
          />
        ))
      )}
      {/* Keeps the last card clear of the floating button. */}
      <View style={{ height: 56 }} />

      <ComposeSheet visible={composeOpen} onClose={() => setComposeOpen(false)} onSubmit={createPost} />
      <RoomViewer
        room={viewing?.room ?? null}
        title={viewing ? `${viewing.author}님의 방` : ''}
        subtitle={viewing?.room_name}
        onClose={() => setViewing(null)}
      />
    </Screen>
  );
}

function PostCard({
  post,
  mine,
  me,
  onToggleLike,
  onOpenRoom,
  onDelete,
  onAddComment,
  onDeleteComment,
}: {
  post: Post;
  mine: boolean;
  me: string | null;
  onToggleLike: () => void;
  onOpenRoom: () => void;
  onDelete: () => void;
  onAddComment: (text: string) => Promise<{ error: string | null }>;
  onDeleteComment: (c: PostComment) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const room = post.room;
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const { error } = await onAddComment(text);
    setSending(false);
    if (error) notify('댓글을 달지 못했어요', error);
    else setDraft('');
  }

  return (
    <Card style={styles.post}>
      <View style={styles.authorRow}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.avatarText, { color: theme.accent }]}>{post.author.charAt(0)}</Text>
        </View>
        <View style={styles.authorText}>
          <Text style={[styles.authorName, { color: theme.text }]}>
            {post.author}
            {mine ? <Text style={{ color: theme.textSecondary, fontWeight: '400' }}> (나)</Text> : null}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>{timeAgo(post.created_at)}</Text>
        </View>
        <View style={[styles.topic, { backgroundColor: theme.background }]}>
          <Text style={[styles.topicText, { color: theme.accent }]}>{post.topic}</Text>
        </View>
        {mine ? (
          <Pressable onPress={onDelete} hitSlop={10} accessibilityLabel="글 삭제">
            <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <Text style={[styles.body, { color: theme.text }]}>{post.body}</Text>

      {room ? (
        <Pressable onPress={onOpenRoom} accessibilityRole="button" accessibilityLabel="3D 방 둘러보기">
          {({ pressed }) => (
            <View style={[styles.roomTile, { backgroundColor: theme.accentSoft }, pressed && { opacity: 0.8 }]}>
              <View>
                <RoomPreview room={room} />
                <View style={[styles.roomBadge, { backgroundColor: theme.accent }]}>
                  <Ionicons name="cube-outline" size={13} color={theme.onAccent} />
                  <Text style={[styles.roomBadgeText, { color: theme.onAccent }]}>3D</Text>
                </View>
              </View>
              <View style={styles.roomFooter}>
                <View style={styles.roomText}>
                  <Text style={[styles.roomTitle, { color: theme.text }]} numberOfLines={1}>
                    {post.room_name || `${post.author}님의 방`}
                  </Text>
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>눌러서 3인칭·1인칭으로 둘러보기</Text>
                </View>
                <Ionicons name="play-circle-outline" size={24} color={theme.accent} />
              </View>
            </View>
          )}
        </Pressable>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionItem} onPress={onToggleLike} hitSlop={6} accessibilityLabel="좋아요">
          <Ionicons
            name={post.likedByMe ? 'heart' : 'heart-outline'}
            size={18}
            color={post.likedByMe ? theme.warm : theme.textSecondary}
          />
          <Text style={[styles.actionCount, { color: theme.textSecondary }]}>{post.likes_count}</Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={() => setOpen((v) => !v)} hitSlop={6} accessibilityLabel="댓글">
          <Ionicons name={open ? 'chatbubble' : 'chatbubble-outline'} size={16} color={theme.textSecondary} />
          <Text style={[styles.actionCount, { color: theme.textSecondary }]}>{post.comments.length}</Text>
        </Pressable>
      </View>

      {open && (
        <View style={[styles.comments, { borderTopColor: theme.border }]}>
          {post.comments.length === 0 ? (
            <Text style={[styles.meta, { color: theme.textSecondary }]}>첫 댓글을 남겨보세요</Text>
          ) : (
            post.comments.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                <Text style={[styles.commentText, { color: theme.text }]}>
                  <Text style={{ fontWeight: '700' }}>{c.author}</Text>
                  {'  '}
                  {c.text}
                  <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{'  '}{timeAgo(c.created_at)}</Text>
                </Text>
                {c.user_id === me ? (
                  <Pressable onPress={() => onDeleteComment(c)} hitSlop={8} accessibilityLabel="댓글 삭제">
                    <Ionicons name="close" size={14} color={theme.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
          <View style={styles.commentInputRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={send}
              placeholder="댓글 달기"
              placeholderTextColor={theme.textSecondary}
              maxLength={500}
              returnKeyType="send"
              style={[styles.commentInput, { backgroundColor: theme.background, color: theme.text }]}
            />
            <Pressable
              style={[styles.sendBtn, { backgroundColor: theme.accent }, (!draft.trim() || sending) && { opacity: 0.5 }]}
              onPress={send}
              disabled={!draft.trim() || sending}
              accessibilityLabel="댓글 보내기">
              <Ionicons name="send" size={14} color={theme.onAccent} />
            </Pressable>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  filters: { gap: Spacing.two },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  filterText: { fontSize: 13, fontWeight: '600' },
  errorTitle: { fontSize: 14, fontWeight: '700' },
  muted: { fontSize: 13, lineHeight: 19 },
  link: { fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: Spacing.five, gap: Spacing.two },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  post: { gap: Spacing.three },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700' },
  authorText: { flex: 1, gap: 1 },
  authorName: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12 },
  topic: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  topicText: { fontSize: 12, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  roomTile: { gap: Spacing.three, padding: Spacing.two, paddingBottom: Spacing.three, borderRadius: 14 },
  roomBadge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roomBadgeText: { fontSize: 12, fontWeight: '800' },
  roomFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.two },
  roomText: { flex: 1, gap: 2 },
  roomTitle: { fontSize: 15, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: Spacing.four },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { fontSize: 13 },
  comments: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three, gap: Spacing.two },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  commentText: { flex: 1, fontSize: 13, lineHeight: 19 },
  commentInputRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  commentInput: { flex: 1, minWidth: 0, height: 40, borderRadius: 12, paddingHorizontal: 12, fontSize: 14 },
  sendBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
