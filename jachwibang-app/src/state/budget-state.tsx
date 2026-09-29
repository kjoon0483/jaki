import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { dateKey } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth-state';

export interface Expense {
  id: string;
  category: string;
  amount: number;
  spent_on: string; // YYYY-MM-DD
  memo: string | null;
  created_at: string;
}

export interface NewExpense {
  category: string;
  amount: number;
  spent_on: string;
  memo?: string;
}

interface BudgetValue {
  expenses: Expense[];
  loading: boolean;
  /** Last load/save error, shown on screen so a missing table or RLS problem is visible. */
  error: string | null;
  /** Monthly spending goal, or null if the user hasn't set one yet. */
  monthlyBudget: number | null;
  refresh: () => Promise<void>;
  addExpense: (input: NewExpense) => Promise<{ error: string | null }>;
  deleteExpense: (id: string) => Promise<{ error: string | null }>;
  setMonthlyBudget: (amount: number | null) => Promise<{ error: string | null }>;
}

const BudgetContext = createContext<BudgetValue | null>(null);

/** How far back expenses are loaded (covers this month + month-over-month comparisons). */
const HISTORY_MONTHS = 12;

const COLUMNS = 'id, category, amount, spent_on, memo, created_at';

function sortExpenses(list: Expense[]) {
  return [...list].sort((a, b) =>
    a.spent_on === b.spent_on ? b.created_at.localeCompare(a.created_at) : b.spent_on.localeCompare(a.spent_on)
  );
}

export function BudgetProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rawBudget = session?.user.user_metadata?.monthly_budget;
  const monthlyBudget = typeof rawBudget === 'number' && rawBudget > 0 ? rawBudget : null;

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const from = new Date();
    from.setMonth(from.getMonth() - HISTORY_MONTHS, 1);
    const { data, error: loadError } = await supabase
      .from('expenses')
      .select(COLUMNS)
      .gte('spent_on', dateKey(from))
      .order('spent_on', { ascending: false })
      .order('created_at', { ascending: false });
    if (loadError) setError(loadError.message);
    else {
      setError(null);
      setExpenses(sortExpenses((data ?? []) as Expense[]));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setExpenses([]);
    refresh();
  }, [refresh]);

  const addExpense = useCallback(
    async (input: NewExpense) => {
      if (!userId) return { error: '로그인이 필요해요.' };
      const { data, error: saveError } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          category: input.category,
          amount: input.amount,
          spent_on: input.spent_on,
          memo: input.memo?.trim() || null,
        })
        .select(COLUMNS)
        .single();
      if (saveError) return { error: saveError.message };
      setExpenses((prev) => sortExpenses([data as Expense, ...prev]));
      return { error: null };
    },
    [userId]
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
    () => ({ expenses, loading, error, monthlyBudget, refresh, addExpense, deleteExpense, setMonthlyBudget }),
    [expenses, loading, error, monthlyBudget, refresh, addExpense, deleteExpense, setMonthlyBudget]
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}

/** Sum of expenses whose date starts with the given "YYYY-MM" (optionally only up to a day of month). */
export function sumForMonth(expenses: Expense[], month: string, uptoDay?: number) {
  return expenses.reduce((sum, e) => {
    if (!e.spent_on.startsWith(month)) return sum;
    if (uptoDay !== undefined && Number(e.spent_on.slice(8, 10)) > uptoDay) return sum;
    return sum + e.amount;
  }, 0);
}
