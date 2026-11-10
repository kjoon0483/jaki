import type { Expense } from '@/state/budget-state';

/**
 * Sum of entries whose date starts with the given "YYYY-MM" (optionally only up to a day of month).
 * Counts spending by default; pass `income: true` to sum income instead.
 */
export function sumForMonth(
  expenses: Pick<Expense, 'amount' | 'spent_on' | 'is_income'>[],
  month: string,
  uptoDay?: number,
  income = false
) {
  return expenses.reduce((sum, e) => {
    if (e.is_income !== income || !e.spent_on.startsWith(month)) return sum;
    if (uptoDay !== undefined && Number(e.spent_on.slice(8, 10)) > uptoDay) return sum;
    return sum + e.amount;
  }, 0);
}
