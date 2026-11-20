/**
 * QuickAddScreen — "Nuevo movimiento": full-screen expense/income capture.
 * Ported from the `add` screen in `design/src/app.jsx`. Opened through
 * `useQuickAdd().open(mode)`; captured entries are persisted via the API
 * through `useExpenses` / `useIncomes`. `useQuickAdd().edit(tx)` opens the
 * same screen prefilled to update an existing movement.
 */
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryForm, EmptyState, notifySuccess, QuickAddEntry, QuickAddForm, type CategoryFormPayload } from '@/components/features';
import { Sheet } from '@/components/ui';
import { AppBar } from '@/navigation/AppBar';
import { useQuickAdd } from '@/navigation/QuickAddProvider';
import { useAccounts } from '@/hooks/useAccounts';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import { useIncomes } from '@/hooks/useIncomes';
import { TypeBalance } from '@/types/BalanceType';
import { CategoryKind, CategoryType } from '@/types/CategoryType';
import { ExpenseType } from '@/types/ExpenseType';
import { IncomeType } from '@/types/IncomeType';
import { useTheme } from '@/styles/useTheme';

/** Nuevo movimiento screen. */
export function QuickAddScreen() {
  const t = useTheme();
  const { mode, editing, close } = useQuickAdd();
  const { accounts, refresh: refreshAccounts } = useAccounts();
  const { budgets, refresh: refreshBudgets } = useBudgets();
  const {
    categories,
    loading: categoriesLoading,
    error: categoryError,
    fieldErrors: categoryFieldErrors,
    refresh: refreshCategories,
    clearFieldErrors: clearCategoryFieldErrors,
    createCategory,
  } = useCategories();
  const {
    expenses,
    createExpense,
    updateExpense,
    refresh: refreshExpenses,
    fieldErrors: expenseFieldErrors,
    clearFieldErrors: clearExpenseFieldErrors,
  } = useExpenses();
  const {
    incomes,
    createIncome,
    updateIncome,
    refresh: refreshIncomes,
    fieldErrors: incomeFieldErrors,
    clearFieldErrors: clearIncomeFieldErrors,
  } = useIncomes();

  const [formKey, setFormKey] = useState(0);
  const [lastType, setLastType] = useState<TypeBalance>('expense');
  // Whether the expense/income lists were re-pulled for the movement being edited.
  const [sourceReady, setSourceReady] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryKind, setCategoryKind] = useState<CategoryKind>('expense');
  // Bumped on every open so the category form remounts empty.
  const [categoryFormKey, setCategoryFormKey] = useState(0);
  // Hands the saved category back to the form that asked for it.
  const onCategoryCreated = useRef<((category: CategoryType) => void) | null>(null);

  // A balance row only points at its source record; the record itself (which
  // also carries the budget) is what gets prefilled and updated.
  const sourceId = editing?.balanceable_id != null ? Number(editing.balanceable_id) : null;
  const expenseSource = editing?.type === 'expense' ? expenses.find((e) => e.id === sourceId) : undefined;
  const incomeSource = editing?.type === 'income' ? incomes.find((i) => i.id === sourceId) : undefined;
  const source = expenseSource ?? incomeSource;

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
      refreshCategories();
      if (!editing) return;

      let active = true;
      (editing.type === 'income' ? refreshIncomes() : refreshExpenses()).finally(() => {
        if (active) setSourceReady(true);
      });
      return () => {
        active = false;
        setSourceReady(false);
      };
    }, [
      clearExpenseFieldErrors,
      clearIncomeFieldErrors,
      refreshAccounts,
      refreshBudgets,
      refreshCategories,
      refreshExpenses,
      refreshIncomes,
      editing,
    ])
  );

  const handleSubmit = useCallback(
    async (entry: QuickAddEntry): Promise<boolean> => {
      setLastType(entry.type);
      if (editing) {
        // The original account/budget may no longer be listed (e.g. hidden), so
        // fall back to the ones the record already has.
        const updated = expenseSource
          ? await updateExpense({
              ...expenseSource,
              amount: entry.amount,
              description: entry.description,
              account_id: entry.account?.id ?? expenseSource.account_id,
              budget_id: entry.budget?.id ?? expenseSource.budget_id,
              category_id: entry.categoryId,
            })
          : incomeSource
            ? await updateIncome({
                ...incomeSource,
                amount: entry.amount,
                description: entry.description,
                account_id: entry.account?.id ?? incomeSource.account_id,
                category_id: entry.categoryId,
              })
            : undefined;
        if (!updated) {
          Alert.alert('No se pudo actualizar', 'Revisa los datos y tu conexión, e inténtalo de nuevo.');
        }
        return !!updated;
      }
      if (entry.type === 'expense') {
        const expense: ExpenseType = {
          id: null,
          amount: entry.amount,
          description: entry.description,
          created_at: entry.date,
          // Placeholder when the budget hasn't synced yet (id: null); the real
          // link is resolved via `entry.budget.client_id` inside createExpense.
          budget_id: entry.budget?.id ?? 0,
          category_id: entry.categoryId,
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
          category_id: entry.categoryId,
          created_at: entry.date,
        };
        const created = await createIncome(income);
        if (!created) return false;
      }
      return true;
    },
    [createExpense, createIncome, updateExpense, updateIncome, editing, expenseSource, incomeSource]
  );

  /** Opens the new-category sheet; the saved category goes to `onCreated`. */
  const openCategoryForm = useCallback(
    (kind: TypeBalance, onCreated: (category: CategoryType) => void) => {
      onCategoryCreated.current = onCreated;
      setCategoryKind(kind);
      clearCategoryFieldErrors();
      setCategoryFormKey((k) => k + 1);
      setCategoryFormOpen(true);
    },
    [clearCategoryFieldErrors]
  );

  const closeCategoryForm = () => {
    setCategoryFormOpen(false);
    clearCategoryFieldErrors();
  };

  /** Creates the category, selects it in the form and confirms the change. */
  const submitCategory = async (values: CategoryFormPayload) => {
    const saved = await createCategory({ ...values, type: values.type ?? categoryKind });
    if (saved) {
      onCategoryCreated.current?.(saved);
      notifySuccess({
        title: 'Categoría creada',
        subtitle: saved.name,
        tone: saved.type === 'income' ? 'income' : 'primary',
      });
    }
    return saved;
  };

  const serverFieldErrors = lastType === 'income' ? incomeFieldErrors : expenseFieldErrors;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface">
      <AppBar
        eyebrow={editing ? 'Editar' : 'Registrar'}
        title={editing ? 'Editar movimiento' : 'Nuevo movimiento'}
        onBack={close}
      />
      {editing && !sourceReady ? (
        <ActivityIndicator className="mt-10" color={t.primary} />
      ) : editing && !source ? (
        <EmptyState icon="search" message="No se pudo cargar este movimiento. Revisa tu conexión e inténtalo de nuevo." />
      ) : (
        <QuickAddForm
          key={formKey}
          mode={mode}
          accounts={accounts}
          budgets={budgets}
          categories={categories}
          onNewCategory={openCategoryForm}
          onSubmit={handleSubmit}
          onSaved={close}
          serverFieldErrors={serverFieldErrors}
          editing={!!editing}
          initial={
            source
              ? {
                  amount: Number(source.amount),
                  description: source.description,
                  accountId: Number(source.account_id),
                  budgetId: expenseSource ? Number(expenseSource.budget_id) : null,
                  categoryId: source.category_id != null ? Number(source.category_id) : null,
                }
              : undefined
          }
        />
      )}
      <Sheet open={categoryFormOpen} onClose={closeCategoryForm} title="Nueva categoría">
        <CategoryForm
          key={categoryFormKey}
          categories={categories}
          kind={categoryKind}
          onSubmit={submitCategory}
          onDone={closeCategoryForm}
          fieldErrors={categoryFieldErrors}
          errorMessage={categoryError?.message}
          loading={categoriesLoading}
        />
      </Sheet>
    </SafeAreaView>
  );
}

export default QuickAddScreen;
