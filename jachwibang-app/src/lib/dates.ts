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
