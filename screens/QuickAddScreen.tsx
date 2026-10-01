/**
 * QuickAddScreen — "Nuevo movimiento": full-screen expense/income capture.
 * Ported from the `add` screen in `design/src/app.jsx`. Opened through
 * `useQuickAdd().open(mode)`; captured entries are persisted via the API
 * through `useExpenses` / `useIncomes`.
 */
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuickAddEntry, QuickAddForm } from '@/components/features';
import { AppBar } from '@/navigation/AppBar';
import { useQuickAdd } from '@/navigation/QuickAddProvider';
import { useAccounts } from '@/hooks/useAccounts';
import { useBudgets } from '@/hooks/useBudgets';
import { useExpenses } from '@/hooks/useExpenses';
import { useIncomes } from '@/hooks/useIncomes';
import { TypeBalance } from '@/types/BalanceType';
import { ExpenseType } from '@/types/ExpenseType';
import { IncomeType } from '@/types/IncomeType';

/** Nuevo movimiento screen. */
export function QuickAddScreen() {
  const { mode, close } = useQuickAdd();
  const { accounts, refresh: refreshAccounts } = useAccounts();
  const { budgets, refresh: refreshBudgets } = useBudgets();
  const {
    createExpense,
    fieldErrors: expenseFieldErrors,
    clearFieldErrors: clearExpenseFieldErrors,
  } = useExpenses();
  const {
    createIncome,
    fieldErrors: incomeFieldErrors,
    clearFieldErrors: clearIncomeFieldErrors,
  } = useIncomes();

  const [formKey, setFormKey] = useState(0);
  const [lastType, setLastType] = useState<TypeBalance>('expense');

  // Tab screens stay mounted, so every visit starts a fresh entry: remount the
  // form, drop stale 422 errors and re-pull accounts/budgets so the chips
  // reflect anything created since the last visit.
  useFocusEffect(
    useCallback(() => {
      setFormKey((k) => k + 1);
      clearExpenseFieldErrors();
      clearIncomeFieldErrors();
      refreshAccounts();
      refreshBudgets();
    }, [clearExpenseFieldErrors, clearIncomeFieldErrors, refreshAccounts, refreshBudgets])
  );

  const handleSubmit = useCallback(
    async (entry: QuickAddEntry): Promise<boolean> => {
      setLastType(entry.type);
      if (entry.type === 'expense') {
        const expense: ExpenseType = {
          id: null,
          amount: entry.amount,
          description: entry.description,
          created_at: entry.date,
          // Placeholder when the budget hasn't synced yet (id: null); the real
          // link is resolved via `entry.budget.client_id` inside createExpense.
          budget_id: entry.budget?.id ?? 0,
          account: entry.account,
          // Placeholder when the account hasn't synced yet (id: null); the real
          // link is resolved via `entry.account.client_id` inside createExpense.
          account_id: entry.account.id ?? 0,
        };
        const created = await createExpense(expense, entry.budget);
        if (!created) return false;
      } else {
        const income: IncomeType = {
          id: null,
          amount: entry.amount,
          description: entry.description,
          account: entry.account,
          // Placeholder when the account hasn't synced yet (id: null); the real
          // link is resolved via `entry.account.client_id` inside createIncome.
          account_id: entry.account.id ?? 0,
          created_at: entry.date,
        };
        const created = await createIncome(income);
        if (!created) return false;
      }
      return true;
    },
    [createExpense, createIncome]
  );

  const serverFieldErrors = lastType === 'income' ? incomeFieldErrors : expenseFieldErrors;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface">
      <AppBar eyebrow="Registrar" title="Nuevo movimiento" onBack={close} />
      <QuickAddForm
        key={formKey}
        mode={mode}
        accounts={accounts}
        budgets={budgets}
        onSubmit={handleSubmit}
        onSaved={close}
        serverFieldErrors={serverFieldErrors}
      />
    </SafeAreaView>
  );
}

export default QuickAddScreen;
