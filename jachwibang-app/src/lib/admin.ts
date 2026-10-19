import { friendlyError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

/** Shown when the admin screen needs migration 007 but it hasn't been run in Supabase yet. */
export const ADMIN_MIGRATION_MESSAGE =
  '관리자 기능을 쓰려면 Supabase SQL Editor에서 supabase/migrations/007_admin.sql 을 먼저 실행해주세요.';

/** Whether the signed-in user is the administrator. False (not an error) before migration 007. */
export async function fetchIsAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}

export type AdminReport = {
  id: string;
  reason: string;
  createdAt: string;
  kind: 'post' | 'comment';
  targetId: string;
  /** Text of the reported post/comment; null if it has already been deleted. */
  text: string | null;
  authorName: string;
  /** Reports that point at the same post/comment (including this one). */
  count: number;
};

/** Newest reports first, each with the reported text and its author's nickname. */
export async function fetchReports(): Promise<{ reports: AdminReport[]; error: string | null }> {
  const { data, error } = await supabase
    .from('community_reports')
    .select('id, post_id, comment_id, reason, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return { reports: [], error: /does not exist|schema cache/i.test(error.message) ? ADMIN_MIGRATION_MESSAGE : friendlyError(error.message) };

  const rows = data ?? [];
  const postIds = [...new Set(rows.map((r) => r.post_id as string | null).filter((v): v is string => !!v))];
  const commentIds = [...new Set(rows.map((r) => r.comment_id as string | null).filter((v): v is string => !!v))];
  const [posts, comments] = await Promise.all([
    postIds.length ? supabase.from('community_posts').select('id, user_id, body').in('id', postIds) : { data: [] },
    commentIds.length ? supabase.from('community_comments').select('id, user_id, text').in('id', commentIds) : { data: [] },
  ]);
  const postById = new Map((posts.data ?? []).map((p) => [p.id as string, p]));
  const commentById = new Map((comments.data ?? []).map((c) => [c.id as string, c]));

  const authorIds = [
    ...new Set([...(posts.data ?? []).map((p) => p.user_id as string), ...(comments.data ?? []).map((c) => c.user_id as string)]),
  ];
  const names = new Map<string, string>();
  if (authorIds.length) {
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', authorIds);
    (profiles ?? []).forEach((p) => names.set(p.id as string, p.display_name as string));
  }

  const counts = new Map<string, number>();
  rows.forEach((r) => {
    const key = (r.post_id ?? r.comment_id) as string;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const reports = rows.map((r): AdminReport => {
    const isPost = !!r.post_id;
    const targetId = (isPost ? r.post_id : r.comment_id) as string;
    const target = isPost ? postById.get(targetId) : commentById.get(targetId);
    return {
      id: r.id as string,
      reason: r.reason as string,
      createdAt: r.created_at as string,
      kind: isPost ? 'post' : 'comment',
      targetId,
      text: target ? ((isPost ? (target as { body: string }).body : (target as { text: string }).text) as string) : null,
      authorName: (target && names.get(target.user_id as string)) || '알 수 없음',
      count: counts.get(targetId) ?? 1,
    };
  });
  return { reports, error: null };
}

/** Closes a report without touching the post/comment. */
export async function dismissReport(reportId: string) {
  const { error } = await supabase.from('community_reports').delete().eq('id', reportId);
  return { error: error ? friendlyError(error.message) : null };
}

/** Deletes the reported post/comment; its reports go with it. */
export async function deleteReported(report: Pick<AdminReport, 'kind' | 'targetId'>) {
  const table = report.kind === 'post' ? 'community_posts' : 'community_comments';
  const { error } = await supabase.from(table).delete().eq('id', report.targetId);
  return { error: error ? friendlyError(error.message) : null };
}
