import apiClient from '@/api/client';
import { ExpenseType } from '@/types/ExpenseType';
import type { AccountType } from '@/types/AccountType';
import type { BudgetType } from '@/types/BudgetType';
import { AppError, isNetworkError } from '@/utils/errorHandler';
import { formatApiDateTime } from '@/utils/formatting';
import { isOnline, recordApiOutcome } from '@/utils/networkStatus';
import * as expenseRepository from '@/database/expenseRepository';
import * as accountRepository from '@/database/accountRepository';
import * as budgetRepository from '@/database/budgetRepository';
import * as balanceRepository from '@/database/balanceRepository';
import * as syncQueueRepository from '@/database/syncQueueRepository';
import { notifyQueueChanged } from '@/services/syncService';

/** Raw shape returned by the API (id is a string, created_at is a string). */
type ApiExpense = Omit<ExpenseType, 'id' | 'created_at'> & { id: string; created_at: string };

/** Fields required to create an expense. */
export type ExpensePayload = Pick<ExpenseType, 'amount' | 'description' | 'account_id' | 'budget_id'> & {
  created_at?: Date;
};

const toExpenseType = (e: ApiExpense): ExpenseType => ({
  ...e,
  id: Number(e.id),
  created_at: new Date(e.created_at),
});

/** Resolves the local `client_id` for an account, whether it's an already-synced record (looked up by numeric id) or one created offline this session (already carries `client_id`). */
async function resolveAccountClientId(account: AccountType): Promise<string> {
  if (account.client_id) return account.client_id;
  if (account.id != null) {
    const local = await accountRepository.findById(account.id);
    if (local?.client_id) return local.client_id;
  }
  throw new Error('No se pudo resolver la cuenta local para el gasto');
}

async function resolveBudgetClientId(budget: BudgetType): Promise<string> {
  if (budget.client_id) return budget.client_id;
  if (budget.id != null) {
    const local = await budgetRepository.findById(budget.id);
    if (local?.client_id) return local.client_id;
  }
  throw new Error('No se pudo resolver el presupuesto local para el gasto');
}

export const expenseService = {
  /**
   * Returns all expenses for the authenticated user. Falls back to the local
   * mirror when offline or the API is unreachable.
   */
  async getAll(): Promise<ExpenseType[]> {
    if (isOnline()) {
      try {
        const { data } = await apiClient.get<ApiExpense[]>('/expenses');
        recordApiOutcome(true);
        const expenses = data.map(toExpenseType);
        await expenseRepository.replaceAllFromServer(expenses);
        return expenses;
      } catch (err) {
        if (!isNetworkError(err as AppError)) throw err;
        recordApiOutcome(false);
      }
    }
    return expenseRepository.getAll();
  },

  /**
   * Creates a new expense. When offline (or the referenced account/budget
   * hasn't synced yet), it's written to the local mirror and queued for sync
   * — `account`/`budget` are only used to resolve that local linkage, never
   * sent to the API.
   *
   * @param payload - Expense data to create
   * @param account - The expense's account (embedded on the `ExpenseType` passed to the hook)
   * @param budget - The expense's budget, when applicable
   */
  async create(payload: ExpensePayload, account: AccountType, budget?: BudgetType): Promise<ExpenseType> {
    const accountPending = account.id == null;
    const budgetPending = budget != null && budget.id == null;

    if (isOnline() && !accountPending && !budgetPending) {
      try {
        const { data } = await apiClient.post<ApiExpense>('/expenses', {
          ...payload,
          created_at: formatApiDateTime(payload.created_at),
        });
        recordApiOutcome(true);
        const created = toExpenseType(data);
        await expenseRepository.upsertFromServer(created);
        return created;
      } catch (err) {
        if (!isNetworkError(err as AppError)) throw err;
        recordApiOutcome(false);
      }
    }

    if (!budget) throw { message: 'Se requiere un presupuesto para registrar el gasto' } as AppError;
    const accountClientId = await resolveAccountClientId(account);
    const budgetClientId = await resolveBudgetClientId(budget);
    const created = await expenseRepository.createLocal(payload, accountClientId, budgetClientId);

    const dependsOn = [accountPending ? accountClientId : null, budgetPending ? budgetClientId : null].filter(
      (v): v is string => v != null
    );
    await syncQueueRepository.enqueue({
      entityType: 'expense',
      operation: 'create',
      clientId: created.client_id!,
      payload: payload as unknown as Record<string, unknown>,
      dependsOn,
    });
    notifyQueueChanged();
    return created;
  },

  /**
   * Deletes an expense. `id` may be a server id or, for a record that hasn't
   * synced yet, its local `client_id`.
   *
   * @param id - Expense identifier
   */
  async remove(id: string): Promise<void> {
    const pending = !/^\d+$/.test(id);
    if (pending) {
      await expenseRepository.removeSyncedRow(id);
      await balanceRepository.removeBySourceClientId(id);
      await syncQueueRepository.removePendingCreateFor(id);
      notifyQueueChanged();
      return;
    }

    if (isOnline()) {
      try {
        await apiClient.delete(`/expenses/${id}`);
        recordApiOutcome(true);
        const local = await expenseRepository.findByServerId(Number(id));
        if (local?.client_id) await expenseRepository.removeSyncedRow(local.client_id);
        return;
      } catch (err) {
        if (!isNetworkError(err as AppError)) throw err;
        recordApiOutcome(false);
      }
    }

    const local = await expenseRepository.findByServerId(Number(id));
    if (!local?.client_id) throw new Error(`No se encontró el gasto local ${id}`);
    await expenseRepository.markDeletedLocal(local.client_id);
    await syncQueueRepository.enqueue({ entityType: 'expense', operation: 'delete', clientId: local.client_id, payload: null });
    notifyQueueChanged();
  },
};
