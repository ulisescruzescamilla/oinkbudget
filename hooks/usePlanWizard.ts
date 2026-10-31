import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { useBudgets } from '@/hooks/useBudgets';
import { useRecurrentBudgets } from '@/hooks/useRecurrentBudgets';
import { AccountType } from '@/types/AccountType';
import { BudgetType } from '@/types/BudgetType';
import { PlanPeriodType, PlanRowType, PlanSplitMode } from '@/types/PlanType';
import { periodRange } from '@/utils/formatting';
import { clampRowAmount, sameName, suggestSplit } from '@/utils/plan';

/** Index of each wizard screen, in order. */
export const PLAN_STEP = { period: 0, accounts: 1, income: 2, split: 3, done: 4 } as const;

/** Stable key for an account, whether or not it has synced yet. */
const accountKey = (a: AccountType): string => (a.id != null ? String(a.id) : a.client_id ?? a.name);

/**
 * State and actions for the plan wizard: the answers to each step, the split
 * of the income across recurrent budgets (`/recurrent-budgets`), and `submit`,
 * which saves the split as budgets — updating the budget that already carries
 * a recurrent budget's name, creating it otherwise.
 */
export function usePlanWizard() {
  const accountsApi = useAccounts();
  const { budgets, createBudget, updateBudget } = useBudgets();
  const { recurrentBudgets, refresh: refreshRecurrentBudgets } = useRecurrentBudgets();
  const { accounts, refresh: refreshAccounts } = accountsApi;

  const [step, setStep] = useState<number>(PLAN_STEP.period);
  const [period, setPeriod] = useState<PlanPeriodType>('monthly');
  // Explicit choices only; accounts never toggled follow their `hidden` flag.
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const [income, setIncomeState] = useState(0);
  const [mode, setMode] = useState<PlanSplitMode>('amt');
  const [rows, setRows] = useState<PlanRowType[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => { refreshAccounts(); }, [refreshAccounts]);

  const isSelected = useCallback(
    (a: AccountType) => selection[accountKey(a)] ?? !a.hidden,
    [selection]
  );

  /** Adds or removes an account from the plan. */
  const toggleAccount = (a: AccountType) =>
    setSelection((s) => ({ ...s, [accountKey(a)]: !(s[accountKey(a)] ?? !a.hidden) }));

  /** Marks an account as part of the plan (used for accounts created in the wizard). */
  const selectAccount = (a: AccountType) => setSelection((s) => ({ ...s, [accountKey(a)]: true }));

  const selectedCount = useMemo(() => accounts.filter(isSelected).length, [accounts, isSelected]);
  const accountsTotal = useMemo(
    () => accounts.reduce((sum, a) => sum + (isSelected(a) ? Number(a.amount) : 0), 0),
    [accounts, isSelected]
  );
  const allocated = useMemo(() => rows.reduce((sum, r) => sum + r.amount, 0), [rows]);
  const remaining = Math.max(0, income - allocated);

  /** Sets the income; a smaller income resets a split that no longer fits it. */
  const setIncome = (value: number) => {
    setIncomeState(value);
    if (value < allocated) setRows([]);
  };

  /** Changes one row's amount, capped so the split never exceeds the income. */
  const setRowAmount = (recurrentBudgetId: number, value: number) =>
    setRows((rs) =>
      rs.map((r) =>
        r.recurrent_budget_id === recurrentBudgetId
          ? { ...r, amount: clampRowAmount(rs, recurrentBudgetId, value, income) }
          : r
      )
    );

  const removeRow = (recurrentBudgetId: number) =>
    setRows((rs) => rs.filter((r) => r.recurrent_budget_id !== recurrentBudgetId));

  const addRow = (recurrentBudgetId: number) =>
    setRows((rs) =>
      rs.some((r) => r.recurrent_budget_id === recurrentBudgetId)
        ? rs
        : [...rs, { recurrent_budget_id: recurrentBudgetId, amount: 0 }]
    );

  /** Replaces the rows with the suggested split for the current income. */
  const applySuggestion = () => setRows(suggestSplit(income, recurrentBudgets));

  /** Keeps the rows but sets every amount to zero. */
  const clearAmounts = () => setRows((rs) => rs.map((r) => ({ ...r, amount: 0 })));

  const canContinue =
    step === PLAN_STEP.accounts ? selectedCount > 0
      : step === PLAN_STEP.income ? income > 0
        : step === PLAN_STEP.split ? allocated > 0
          : true;

  const back = () => setStep((s) => Math.max(PLAN_STEP.period, s - 1));

  /**
   * Saves the split as budgets, one per recurrent budget with an amount.
   * Budgets have no link to recurrent budgets, so a row updates the budget
   * whose name matches the recurrent budget's (ignoring case), keeping that
   * budget's category; otherwise it creates a budget named after it. Budgets are
   * written one at a time; if one fails the rest are skipped and the wizard
   * stays on the split step. Running it again is safe: budgets saved by the
   * failed attempt are updated rather than duplicated.
   *
   * @returns Whether every budget was saved
   */
  const submit = async (): Promise<boolean> => {
    setSaving(true);
    setSubmitError(null);
    const { start, end } = periodRange(period);
    try {
      for (const row of rows) {
        if (row.amount <= 0) continue;
        const recurrentBudget = recurrentBudgets.find((r) => r.id === row.recurrent_budget_id);
        if (!recurrentBudget) continue;
        const existing = budgets.find((b) => sameName(b.name, recurrentBudget.name));
        const plan: BudgetType = {
          ...existing,
          id: existing?.id ?? null,
          name: existing?.name ?? recurrentBudget.name,
          max_limit: row.amount,
          percentage_value: income > 0 ? Math.round((row.amount / income) * 100) : 0,
          start_date: start,
          end_date: end,
          is_recurrent: true,
          period,
        };
        const saved = existing ? await updateBudget(plan) : await createBudget(plan);
        if (!saved) {
          setSubmitError('No se pudo guardar tu plan. Revisa tu conexión e inténtalo de nuevo.');
          return false;
        }
      }
      return true;
    } finally {
      setSaving(false);
    }
  };

  /** Advances one step; leaving the split step saves the plan first. */
  const next = async () => {
    if (!canContinue || saving) return;
    if (step === PLAN_STEP.split) {
      if (await submit()) setStep(PLAN_STEP.done);
      return;
    }
    // First arrival at the split: start from the suggested one.
    if (step === PLAN_STEP.income && rows.length === 0) setRows(suggestSplit(income, recurrentBudgets));
    setStep((s) => s + 1);
  };

  return {
    step,
    period,
    setPeriod,
    accountsApi,
    accounts,
    isSelected,
    toggleAccount,
    selectAccount,
    accountsTotal,
    income,
    setIncome,
    mode,
    setMode,
    rows,
    recurrentBudgets,
    refreshRecurrentBudgets,
    setRowAmount,
    removeRow,
    addRow,
    applySuggestion,
    clearAmounts,
    allocated,
    remaining,
    canContinue,
    saving,
    submitError,
    back,
    next,
  };
}
