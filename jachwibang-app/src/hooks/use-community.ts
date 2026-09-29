import { useCallback, useState } from 'react';

import { AttachedRoom, communityError as friendlyError, insertPost, POST_COLUMNS, PostRow } from '@/lib/community';
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

const PAGE_SIZE = 50;


/** Community feed state. Call `refresh()` to load (the screen does it whenever it comes into focus). */
export function useCommunity() {
  const { session } = useAuth();
  const me = session?.user.id ?? null;
  const myName =
    (session?.user.user_metadata?.nickname as string | undefined) || session?.user.email?.split('@')[0] || '나';

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    const { data: rows, error: postsError } = await supabase
      .from('community_posts')
      .select(POST_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (postsError) {
      setError(friendlyError(postsError.message));
      setLoading(false);
      return;
    }
    const postRows = (rows ?? []) as PostRow[];
    const ids = postRows.map((p) => p.id);

    const [commentsRes, likesRes] = ids.length
      ? await Promise.all([
          supabase
            .from('community_comments')
            .select('id, post_id, user_id, text, created_at')
            .in('post_id', ids)
            .order('created_at', { ascending: true }),
          supabase.from('community_post_likes').select('post_id').eq('user_id', me).in('post_id', ids),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];
    const loadError = commentsRes.error ?? likesRes.error;
    if (loadError) {
      setError(friendlyError(loadError.message));
      setLoading(false);
      return;
    }
    const commentRows = commentsRes.data ?? [];
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

    setPosts(
      postRows.map((p) => ({
        ...p,
        author: nameOf(p.user_id),
        likedByMe: liked.has(p.id),
        comments: commentRows.filter((c) => c.post_id === p.id).map((c) => ({ ...c, author: nameOf(c.user_id) })),
      }))
    );
    setError(null);
    setLoading(false);
  }, [me, myName]);

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

  return { me, posts, loading, error, refresh, createPost, deletePost, toggleLike, addComment, deleteComment };
}
