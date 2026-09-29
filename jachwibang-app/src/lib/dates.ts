const pad = (n: number) => String(n).padStart(2, '0');

/** Local-date key "YYYY-MM-DD" (matches the `date` column in Postgres). */
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses "YYYY-MM-DD" as a local date (not UTC). */
export function parseDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "YYYY-MM" for grouping by month. `month` is 0-based. */
export function monthKey(year: number, month: number) {
  return `${year}-${pad(month + 1)}`;
}

export function addDays(key: string, days: number) {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

export function formatDateLabel(key: string) {
  const d = parseDateKey(key);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekday})`;
}

/** "방금", "5분 전", "3시간 전", "2일 전", then a plain date for anything older than a week. */
export function timeAgo(iso: string, now = new Date()) {
  const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  const d = new Date(iso);
  return `${d.getFullYear() !== now.getFullYear() ? `${d.getFullYear()}년 ` : ''}${d.getMonth() + 1}월 ${d.getDate()}일`;
}
