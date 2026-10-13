import { supabase } from '@/lib/supabase';

/** Shown when a feature needs migration 006 but it hasn't been run in Supabase yet. */
export const SAFETY_MIGRATION_MESSAGE =
  '이 기능을 쓰려면 Supabase SQL Editor에서 supabase/migrations/006_account_nickname_safety.sql 을 먼저 실행해주세요.';

/** True when the error means a table/function from migration 006 doesn't exist yet. */
export function isMissingSafetyFeature(message: string) {
  return /user_blocks|community_reports|delete_my_account|nickname_available/i.test(message) &&
    /does not exist|schema cache|could not find/i.test(message);
}

export const REPORT_REASONS = ['욕설·비방', '음란·폭력', '광고·도배', '개인정보 노출', '기타'] as const;

/** Ids of users I've blocked. Empty (not an error) before migration 006, so the feed still works. */
export async function fetchBlockedIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from('user_blocks').select('blocked_id');
  if (error) return new Set();
  return new Set((data ?? []).map((r) => r.blocked_id as string));
}

export async function blockUser(userId: string) {
  const { error } = await supabase.from('user_blocks').insert({ blocked_id: userId });
  // Already blocked counts as success.
  if (!error || /duplicate key|unique/i.test(error.message)) return { error: null };
  return { error: isMissingSafetyFeature(error.message) ? SAFETY_MIGRATION_MESSAGE : error.message };
}

export async function unblockUser(userId: string) {
  const { error } = await supabase.from('user_blocks').delete().eq('blocked_id', userId);
  return { error: error?.message ?? null };
}

/** Blocked users with their nicknames, for the My Page list. */
export async function fetchBlockedUsers() {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    return { users: [], error: isMissingSafetyFeature(error.message) ? SAFETY_MIGRATION_MESSAGE : error.message };
  }
  const ids = (data ?? []).map((r) => r.blocked_id as string);
  const names: Record<string, string> = {};
  if (ids.length) {
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', ids);
    (profiles ?? []).forEach((p) => {
      names[p.id] = p.display_name;
    });
  }
  return { users: ids.map((id) => ({ id, name: names[id] || '알 수 없음' })), error: null };
}

export async function reportContent(target: { postId?: string; commentId?: string }, reason: string) {
  const { error } = await supabase
    .from('community_reports')
    .insert({ post_id: target.postId ?? null, comment_id: target.commentId ?? null, reason });
  if (!error) return { error: null };
  // Reporting the same thing twice is not an error for the user.
  if (/duplicate key|unique/i.test(error.message)) return { error: null };
  return { error: isMissingSafetyFeature(error.message) ? SAFETY_MIGRATION_MESSAGE : error.message };
}

/**
 * Whether a nickname is free (ignoring case, and ignoring my own current name).
 * Returns true if the check itself can't run (e.g. before migration 006) so sign-up isn't blocked.
 */
export async function isNicknameAvailable(name: string) {
  const { data, error } = await supabase.rpc('nickname_available', { name: name.trim() });
  if (error) return true;
  return data !== false;
}
