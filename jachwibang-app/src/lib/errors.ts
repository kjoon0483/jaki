/**
 * Turns common Supabase/network error messages into Korean for the user.
 * Unknown messages are returned unchanged so nothing is hidden while debugging.
 */
export function friendlyError(message: string) {
  const m = message.toLowerCase();
  if (m.includes('failed to fetch') || m.includes('network')) return '네트워크 연결을 확인해주세요.';
  if (m.includes('jwt') || m.includes('session missing') || m.includes('not authenticated')) {
    return '로그인이 만료됐어요. 다시 로그인해주세요.';
  }
  if (m.includes('row-level security') || m.includes('permission denied')) return '이 작업을 할 권한이 없어요.';
  if (m.includes('out of range')) return '숫자가 너무 커요.';
  if (m.includes('should be different')) return '지금 쓰는 비밀번호와 다른 비밀번호를 입력해주세요.';
  if (m.includes('password should') || m.includes('weak password')) return '더 안전한 비밀번호를 입력해주세요.';
  if (m.includes('rate limit') || m.includes('too many')) return '요청이 너무 많아요. 잠시 후 다시 시도해주세요.';
  return message;
}
