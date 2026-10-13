import { useCallback, useRef, useState } from 'react';

import {
  AttachedRoom,
  communityError as friendlyError,
  insertPost,
  isMissingRoomColumn,
  LEGACY_POST_COLUMNS,
  POST_COLUMNS,
  PostRow,
} from '@/lib/community';
import { blockUser, fetchBlockedIds, reportContent } from '@/lib/safety';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth-state';

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  author: string;
}

export interface Post extends PostRow {
  author: string;
  likedByMe: boolean;
  comments: PostComment[];
}

const PAGE_SIZE = 30;

/** Community feed state. Call `refresh()` to load (the screen does it whenever it comes into focus). */
export function useCommunity() {
  const { session } = useAuth();
  const me = session?.user.id ?? null;
  const myName =
    (session?.user.user_metadata?.nickname as string | undefined) || session?.user.email?.split('@')[0] || '나';

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Users I've blocked: their posts and comments are left out of the feed.
  const blocked = useRef(new Set<string>());
  // Whether the room columns (migration 003) are visible; decided by the first page.
  const columns = useRef(POST_COLUMNS);

  /** Loads one page of posts older than `before` (or the newest page), with comments, likes and names. */
  const fetchPage = useCallback(
    async (before?: string): Promise<{ posts: Post[]; full: boolean; error: string | null }> => {
      const fetchPosts = (cols: string) => {
        let query = supabase.from('community_posts').select(cols).order('created_at', { ascending: false }).limit(PAGE_SIZE);
        if (before) query = query.lt('created_at', before);
        return query;
      };
      let { data: rows, error: postsError } = await fetchPosts(columns.current);
      // If the room-sharing migration (003) isn't visible yet, still show the posts, just without rooms.
      if (postsError && isMissingRoomColumn(postsError.message)) {
        columns.current = LEGACY_POST_COLUMNS;
        ({ data: rows, error: postsError } = await fetchPosts(LEGACY_POST_COLUMNS));
      }
      if (postsError) return { posts: [], full: false, error: friendlyError(postsError.message) };
      const allRows = ((rows ?? []) as unknown as PostRow[]).map((p) => ({ ...p, room: p.room ?? null, room_name: p.room_name ?? null }));
      const full = allRows.length === PAGE_SIZE;
      const postRows = allRows.filter((p) => !blocked.current.has(p.user_id));
      const ids = postRows.map((p) => p.id);

      const [commentsRes, likesRes] = ids.length
        ? await Promise.all([
            supabase
              .from('community_comments')
              .select('id, post_id, user_id, text, created_at')
              .in('post_id', ids)
              .order('created_at', { ascending: true }),
            supabase.from('community_post_likes').select('post_id').eq('user_id', me!).in('post_id', ids),
          ])
        : [{ data: [], error: null }, { data: [], error: null }];
      const loadError = commentsRes.error ?? likesRes.error;
      if (loadError) return { posts: [], full: false, error: friendlyError(loadError.message) };
      const commentRows = (commentsRes.data ?? []).filter((c) => !blocked.current.has(c.user_id));
      const liked = new Set((likesRes.data ?? []).map((l) => l.post_id));

      // Display names live in `profiles` (filled from the signup nickname).
      const userIds = [...new Set([...postRows.map((p) => p.user_id), ...commentRows.map((c) => c.user_id)])];
      const names: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds);
        (profiles ?? []).forEach((p) => {
          names[p.id] = p.display_name;
        });
      }
      const nameOf = (id: string) => (id === me ? myName : names[id] || '익명');

      return {
        posts: postRows.map((p) => ({
          ...p,
          author: nameOf(p.user_id),
          likedByMe: liked.has(p.id),
          comments: commentRows.filter((c) => c.post_id === p.id).map((c) => ({ ...c, author: nameOf(c.user_id) })),
        })),
        full,
        error: null,
      };
    },
    [me, myName]
  );

  const refresh = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    blocked.current = await fetchBlockedIds();
    const page = await fetchPage();
    if (page.error) setError(page.error);
    else {
      setError(null);
      setPosts(page.posts);
      setHasMore(page.full);
    }
    setLoading(false);
  }, [me, fetchPage]);

  const loadMore = useCallback(async () => {
    const last = posts[posts.length - 1];
    if (!me || !last || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const page = await fetchPage(last.created_at);
    setLoadingMore(false);
    if (page.error) {
      setError(page.error);
      return;
    }
    setPosts((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...page.posts.filter((p) => !seen.has(p.id))];
    });
    setHasMore(page.full);
  }, [me, posts, loadingMore, hasMore, fetchPage]);

  const createPost = useCallback(
    async (body: string, topic: string, room?: AttachedRoom | null) => {
      if (!me) return { error: '로그인이 필요해요.' };
      const { post, error: insertError } = await insertPost(me, body, topic, room);
      if (insertError || !post) return { error: insertError ?? '글을 올리지 못했어요.' };
      setPosts((prev) => [{ ...post, author: myName, likedByMe: false, comments: [] }, ...prev]);
      return { error: null };
    },
    [me, myName]
  );

  const deletePost = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('community_posts').delete().eq('id', id);
    if (deleteError) return { error: friendlyError(deleteError.message) };
    setPosts((prev) => prev.filter((p) => p.id !== id));
    return { error: null };
  }, []);

  const toggleLike = useCallback(
    async (post: Post) => {
      if (!me) return { error: '로그인이 필요해요.' };
      const liking = !post.likedByMe;
      const apply = (on: boolean) =>
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, likedByMe: on, likes_count: Math.max(0, p.likes_count + (on ? 1 : -1)) } : p
          )
        );
      apply(liking); // optimistic; rolled back below if the request fails
      const { error: likeError } = liking
        ? await supabase.from('community_post_likes').insert({ post_id: post.id, user_id: me })
        : await supabase.from('community_post_likes').delete().eq('post_id', post.id).eq('user_id', me);
      if (likeError) {
        apply(!liking);
        return { error: friendlyError(likeError.message) };
      }
      return { error: null };
    },
    [me]
  );

  const addComment = useCallback(
    async (postId: string, text: string) => {
      if (!me) return { error: '로그인이 필요해요.' };
      const { data, error: insertError } = await supabase
        .from('community_comments')
        .insert({ post_id: postId, user_id: me, text: text.trim() })
        .select('id, post_id, user_id, text, created_at')
        .single();
      if (insertError) return { error: friendlyError(insertError.message) };
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, { ...data, author: myName }] } : p))
      );
      return { error: null };
    },
    [me, myName]
  );

  const deleteComment = useCallback(async (comment: PostComment) => {
    const { error: deleteError } = await supabase.from('community_comments').delete().eq('id', comment.id);
    if (deleteError) return { error: friendlyError(deleteError.message) };
    setPosts((prev) =>
      prev.map((p) => (p.id === comment.post_id ? { ...p, comments: p.comments.filter((c) => c.id !== comment.id) } : p))
    );
    return { error: null };
  }, []);

  /** Reports a post or comment and hides it from my feed right away. */
  const report = useCallback(async (target: { post: Post } | { comment: PostComment }, reason: string) => {
    const isPost = 'post' in target;
    const { error: reportError } = await reportContent(
      isPost ? { postId: target.post.id } : { commentId: target.comment.id },
      reason
    );
    if (reportError) return { error: reportError };
    setPosts((prev) =>
      isPost
        ? prev.filter((p) => p.id !== target.post.id)
        : prev.map((p) =>
            p.id === target.comment.post_id ? { ...p, comments: p.comments.filter((c) => c.id !== target.comment.id) } : p
          )
    );
    return { error: null };
  }, []);

  /** Blocks a user and removes their posts and comments from the feed. */
  const block = useCallback(async (userId: string) => {
    const { error: blockError } = await blockUser(userId);
    if (blockError) return { error: blockError };
    blocked.current.add(userId);
    setPosts((prev) =>
      prev.filter((p) => p.user_id !== userId).map((p) => ({ ...p, comments: p.comments.filter((c) => c.user_id !== userId) }))
    );
    return { error: null };
  }, []);

  return {
    me,
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    createPost,
    deletePost,
    toggleLike,
    addComment,
    deleteComment,
    report,
    block,
  };
}
