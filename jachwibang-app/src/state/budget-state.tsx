import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { dateKey } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth-state';

/** One ledger entry: an expense, or income when `is_income` is true. */
export interface Expense {
  id: string;
  category: string;
  amount: number;
  spent_on: string; // YYYY-MM-DD
  memo: string | null;
  is_income: boolean;
  created_at: string;
}

export interface NewExpense {
  category: string;
  amount: number;
  spent_on: string;
  memo?: string;
  is_income?: boolean;
}

interface BudgetValue {
  expenses: Expense[];
  loading: boolean;
  /** Last load/save error, shown on screen so a missing table or RLS problem is visible. */
  error: string | null;
  /** False until migration 004 (`is_income` column) has been run; income can't be saved before that. */
  incomeSupported: boolean;
  /** Monthly spending goal, or null if the user hasn't set one yet. */
  monthlyBudget: number | null;
  refresh: () => Promise<void>;
  /** Loads a month older than the default history window ("YYYY-MM"). No-op if already loaded. */
  ensureMonth: (month: string) => Promise<void>;
  addExpense: (input: NewExpense) => Promise<{ error: string | null }>;
  updateExpense: (id: string, input: NewExpense) => Promise<{ error: string | null }>;
  deleteExpense: (id: string) => Promise<{ error: string | null }>;
  setMonthlyBudget: (amount: number | null) => Promise<{ error: string | null }>;
}

const BudgetContext = createContext<BudgetValue | null>(null);

/** How far back expenses are loaded up front (covers this month + month-over-month comparisons). */
const HISTORY_MONTHS = 12;

const BASE_COLUMNS = 'id, category, amount, spent_on, memo, created_at';
const COLUMNS = `${BASE_COLUMNS}, is_income`;

const INCOME_MIGRATION_MESSAGE = '수입 기록을 쓰려면 Supabase에서 supabase/migrations/004_expenses_income.sql을 먼저 실행해주세요.';

function sortExpenses(list: Expense[]) {
  return [...list].sort((a, b) =>
    a.spent_on === b.spent_on ? b.created_at.localeCompare(a.created_at) : b.spent_on.localeCompare(a.spent_on)
  );
}

function normalize(rows: unknown[] | null): Expense[] {
  return (rows ?? []).map((r) => ({ ...(r as Expense), is_income: Boolean((r as Expense).is_income) }));
}

/** Merges freshly loaded rows into the list, replacing any with the same id. */
function mergeExpenses(prev: Expense[], rows: Expense[]) {
  const ids = new Set(rows.map((r) => r.id));
  return sortExpenses([...prev.filter((e) => !ids.has(e.id)), ...rows]);
}

function isMissingIncomeColumn(message: string | undefined) {
  return !!message && message.includes('is_income');
}

/** "YYYY-MM" -> [first day, first day of next month) as date keys. */
function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number);
  return [dateKey(new Date(y, m - 1, 1)), dateKey(new Date(y, m, 1))] as const;
}

export function BudgetProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incomeSupported, setIncomeSupported] = useState(true);
  // Older months fetched on demand by ensureMonth; refresh() reloads them too.
  const extraMonths = useRef(new Set<string>());
  const historyFrom = useRef('');

  const rawBudget = session?.user.user_metadata?.monthly_budget;
  const monthlyBudget = typeof rawBudget === 'number' && rawBudget > 0 ? rawBudget : null;

  /** Selects rows in [from, to), falling back to the pre-004 columns if `is_income` doesn't exist yet. */
  const fetchRange = useCallback(async (from: string, to?: string) => {
    const run = (columns: string) => {
      let query = supabase.from('expenses').select(columns).gte('spent_on', from);
      if (to) query = query.lt('spent_on', to);
      return query.order('spent_on', { ascending: false }).order('created_at', { ascending: false });
    };
    let { data, error: loadError } = await run(COLUMNS);
    if (loadError && isMissingIncomeColumn(loadError.message)) {
      setIncomeSupported(false);
      ({ data, error: loadError } = await run(BASE_COLUMNS));
    } else if (!loadError) {
      setIncomeSupported(true);
    }
    return { rows: normalize(data), error: loadError?.message ?? null };
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const from = new Date();
    from.setMonth(from.getMonth() - HISTORY_MONTHS, 1);
    historyFrom.current = dateKey(from);
    const results = await Promise.all([
      fetchRange(historyFrom.current),
      ...[...extraMonths.current].map((m) => fetchRange(...monthRange(m))),
    ]);
    const failed = results.find((r) => r.error);
    if (failed) setError(failed.error);
    else {
      setError(null);
      setExpenses(sortExpenses(results.flatMap((r) => r.rows)));
    }
    setLoading(false);
  }, [userId, fetchRange]);

  useEffect(() => {
    setExpenses([]);
    extraMonths.current = new Set();
    refresh();
  }, [refresh]);

  const ensureMonth = useCallback(
    async (month: string) => {
      if (!userId) return;
      const [start, end] = monthRange(month);
      if ((historyFrom.current && start >= historyFrom.current) || extraMonths.current.has(month)) return;
      extraMonths.current.add(month);
      const { rows, error: loadError } = await fetchRange(start, end);
      if (loadError) {
        extraMonths.current.delete(month);
        setError(loadError);
        return;
      }
      setExpenses((prev) => mergeExpenses(prev, rows));
    },
    [userId, fetchRange]
  );

  const toRow = useCallback(
    (input: NewExpense) => ({
      category: input.category,
      amount: input.amount,
      spent_on: input.spent_on,
      memo: input.memo?.trim() || null,
      ...(incomeSupported ? { is_income: !!input.is_income } : {}),
    }),
    [incomeSupported]
  );

  const addExpense = useCallback(
    async (input: NewExpense) => {
      if (!userId) return { error: '로그인이 필요해요.' };
      if (input.is_income && !incomeSupported) return { error: INCOME_MIGRATION_MESSAGE };
      const { data, error: saveError } = await supabase
        .from('expenses')
        .insert({ user_id: userId, ...toRow(input) })
        .select(incomeSupported ? COLUMNS : BASE_COLUMNS)
        .single();
      if (saveError) return { error: isMissingIncomeColumn(saveError.message) ? INCOME_MIGRATION_MESSAGE : saveError.message };
      setExpenses((prev) => mergeExpenses(prev, normalize([data])));
      return { error: null };
    },
    [userId, incomeSupported, toRow]
  );

  const updateExpense = useCallback(
    async (id: string, input: NewExpense) => {
      if (input.is_income && !incomeSupported) return { error: INCOME_MIGRATION_MESSAGE };
      const { data, error: saveError } = await supabase
        .from('expenses')
        .update(toRow(input))
        .eq('id', id)
        .select(incomeSupported ? COLUMNS : BASE_COLUMNS)
        .single();
      if (saveError) return { error: isMissingIncomeColumn(saveError.message) ? INCOME_MIGRATION_MESSAGE : saveError.message };
      setExpenses((prev) => mergeExpenses(prev, normalize([data])));
      return { error: null };
    },
    [incomeSupported, toRow]
  );

  const deleteExpense = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id);
    if (deleteError) return { error: deleteError.message };
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    return { error: null };
  }, []);

  // Stored in the auth user's metadata (like the nickname), so no extra table is needed.
  // onAuthStateChange(USER_UPDATED) then refreshes `session`, which updates `monthlyBudget`.
  const setMonthlyBudget = useCallback(async (amount: number | null) => {
    const { error: updateError } = await supabase.auth.updateUser({ data: { monthly_budget: amount } });
    return { error: updateError?.message ?? null };
  }, []);

  const value = useMemo(
    () => ({
      expenses,
      loading,
      error,
      incomeSupported,
      monthlyBudget,
      refresh,
      ensureMonth,
      addExpense,
      updateExpense,
      deleteExpense,
      setMonthlyBudget,
    }),
    [expenses, loading, error, incomeSupported, monthlyBudget, refresh, ensureMonth, addExpense, updateExpense, deleteExpense, setMonthlyBudget]
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}

/**
 * Sum of entries whose date starts with the given "YYYY-MM" (optionally only up to a day of month).
 * Counts spending by default; pass `income: true` to sum income instead.
 */
export function sumForMonth(expenses: Expense[], month: string, uptoDay?: number, income = false) {
  return expenses.reduce((sum, e) => {
    if (e.is_income !== income || !e.spent_on.startsWith(month)) return sum;
    if (uptoDay !== undefined && Number(e.spent_on.slice(8, 10)) > uptoDay) return sum;
    return sum + e.amount;
  }, 0);
}
