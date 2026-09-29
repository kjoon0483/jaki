export function formatWon(n: number) {
  return '₩' + Math.round(n).toLocaleString('ko-KR');
}

/** Keeps only digits from a text field ("12,000원" -> 12000). Returns 0 for empty input. */
export function parseAmount(text: string) {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

/** Formats a raw amount field value with thousands separators while typing. */
export function formatAmountInput(text: string) {
  const n = parseAmount(text);
  return n ? n.toLocaleString('ko-KR') : '';
}

/** Compact label for tight spaces like calendar cells: 8000 -> "8천", 12500 -> "1.3만". */
export function formatShortWon(n: number) {
  if (n >= 10000) {
    const man = n / 10000;
    return `${man >= 100 ? Math.round(man) : Math.round(man * 10) / 10}만`;
  }
  if (n >= 1000) return `${Math.round(n / 1000)}천`;
  return String(n);
}
