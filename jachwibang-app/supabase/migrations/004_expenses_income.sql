-- 004: income entries in the household ledger (safe to run many times)

alter table public.expenses
  add column if not exists is_income boolean not null default false;
