/**
 * Sync orchestration: replays queued offline writes against the real API in
 * dependency order (accounts/budgets before expenses/incomes that may
 * reference them), stitching server ids back into the local mirror as each
 * item succeeds. Triggered automatically on reconnect and by a periodic
 * safety-net interval, and manually via `runSync()` (wired to the UI's sync icon).
 */
import apiClient from '@/api/client';
import type { AccountType, KindOfAccountType } from '@/types/AccountType';
import type { BudgetType } from '@/types/BudgetType';
import type { BalanceType } from '@/types/BalanceType';
import type { CategoryType } from '@/types/CategoryType';
import { AppError, isNetworkError } from '@/utils/errorHandler';
import { formatApiDate, formatApiDateTime, parseApiDate } from '@/utils/formatting';
import { isOnline, recordApiOutcome, subscribeNetwork } from '@/utils/networkStatus';
import * as accountRepository from '@/database/accountRepository';
import * as budgetRepository from '@/database/budgetRepository';
import * as balanceRepository from '@/database/balanceRepository';
import * as expenseRepository from '@/database/expenseRepository';
import * as incomeRepository from '@/database/incomeRepository';
import * as syncQueueRepository from '@/database/syncQueueRepository';
import type { SyncQueueItem } from '@/database/syncQueueRepository';

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  lastError: string | null;
}

let isSyncing = false;
let lastSyncedAt: Date | null = null;
let lastError: string | null = null;
const listeners = new Set<(status: SyncStatus) => void>();

async function buildStatus(): Promise<SyncStatus> {
  return {
    isOnline: isOnline(),
    pendingCount: await syncQueueRepository.countPending(),
    isSyncing,
    lastSyncedAt,
    lastError,
  };
}

async function notify(): Promise<void> {
  const status = await buildStatus();
  listeners.forEach((listener) => listener(status));
}

/** Call after enqueueing, cancelling, or merging a pending write so subscribed UI reflects the new pending count immediately. */
export function notifyQueueChanged(): void {
  void notify();
}

export function subscribeSyncStatus(listener: (status: SyncStatus) => void): () => void {
  listeners.add(listener);
  void notify();
  return () => listeners.delete(listener);
}

export function getSyncStatus(): Promise<SyncStatus> {
  return buildStatus();
}

function reformatBudgetDates(payload: Record<string, unknown>): Record<string, unknown> {
  const next = { ...payload };
  if (typeof next.start_date === 'string') next.start_date = formatApiDate(new Date(next.start_date));
  if (typeof next.end_date === 'string') next.end_date = formatApiDate(new Date(next.end_date));
  return next;
}

async function isBlockedByDependency(item: SyncQueueItem, resolvedThisRun: Set<string>): Promise<boolean> {
  for (const dep of item.dependsOn) {
    if (resolvedThisRun.has(dep)) continue;
    const account = await accountRepository.findByClientId(dep);
    if (account) {
      if (account.id == null) return true;
      continue;
    }
    const budget = await budgetRepository.findByClientId(dep);
    if (budget) {
      if (budget.id == null) return true;
      continue;
    }
    // Dependency no longer exists locally (e.g. deleted before it synced) — nothing to wait for.
  }
  return false;
}

async function replayAccount(item: SyncQueueItem): Promise<void> {
  if (item.operation === 'create') {
    const { data } = await apiClient.post<{ id: string }>('/accounts', item.payload);
    await accountRepository.attachServerId(item.clientId, Number(data.id));
  } else if (item.operation === 'update') {
    const local = await accountRepository.findByClientId(item.clientId);
    if (!local?.id) return;
    await apiClient.put(`/accounts/${local.id}`, item.payload);
  } else {
    const local = await accountRepository.findByClientId(item.clientId);
    if (local?.id != null) await apiClient.delete(`/accounts/${local.id}`);
    await accountRepository.removeSyncedRow(item.clientId);
  }
}

async function replayBudget(item: SyncQueueItem): Promise<void> {
  const payload = item.payload ? reformatBudgetDates(item.payload) : item.payload;
  if (item.operation === 'create') {
    const { data } = await apiClient.post<{ id: string }>('/budgets', payload);
    await budgetRepository.attachServerId(item.clientId, Number(data.id));
  } else if (item.operation === 'update') {
    const local = await budgetRepository.findByClientId(item.clientId);
    if (!local?.id) return;
    await apiClient.put(`/budgets/${local.id}`, payload);
  } else {
    const local = await budgetRepository.findByClientId(item.clientId);
    if (local?.id != null) await apiClient.delete(`/budgets/${local.id}`);
    await budgetRepository.removeSyncedRow(item.clientId);
  }
}

async function replayExpense(item: SyncQueueItem): Promise<void> {
  if (item.operation === 'delete') {
    const local = await expenseRepository.findByClientId(item.clientId);
    if (local?.id != null) await apiClient.delete(`/expenses/${local.id}`);
    await expenseRepository.removeSyncedRow(item.clientId);
    await balanceRepository.removeBySourceClientId(item.clientId);
    return;
  }
  // 'create' is the only other operation expenses ever queue — there's no update endpoint.
  const local = await expenseRepository.findByClientId(item.clientId);
  if (!local) return; // deleted locally before it could sync
  const payload = {
    amount: local.amount,
    description: local.description,
    account_id: local.account_id,
    budget_id: local.budget_id,
    created_at: formatApiDateTime(local.created_at),
  };
  const { data } = await apiClient.post<{ id: string }>('/expenses', payload);
  await expenseRepository.attachServerId(item.clientId, Number(data.id));
  // The pending local mirror row (id-less, so a server refresh can't match it) is now
  // redundant with the balance the backend just created for this expense — drop it so
  // the next refresh inserts that one instead of doubling up.
  await balanceRepository.removeBySourceClientId(item.clientId);
}

async function replayIncome(item: SyncQueueItem): Promise<void> {
  if (item.operation === 'delete') {
    const local = await incomeRepository.findByClientId(item.clientId);
    if (local?.id != null) await apiClient.delete(`/incomes/${local.id}`);
    await incomeRepository.removeSyncedRow(item.clientId);
    await balanceRepository.removeBySourceClientId(item.clientId);
    return;
  }
  const local = await incomeRepository.findByClientId(item.clientId);
  if (!local) return;
  const payload = {
    amount: local.amount,
    description: local.description,
    account_id: local.account_id,
    created_at: formatApiDateTime(local.created_at),
  };
  const { data } = await apiClient.post<{ id: string }>('/incomes', payload);
  await incomeRepository.attachServerId(item.clientId, Number(data.id));
  await balanceRepository.removeBySourceClientId(item.clientId);
}

async function replay(item: SyncQueueItem): Promise<void> {
  switch (item.entityType) {
    case 'account':
      return replayAccount(item);
    case 'budget':
      return replayBudget(item);
    case 'expense':
      return replayExpense(item);
    case 'income':
      return replayIncome(item);
  }
}

/** Replays every pending queued write against the API, in dependency order. No-ops if already syncing or offline. */
export async function runSync(): Promise<{ succeeded: number; failed: number }> {
  if (isSyncing || !isOnline()) return { succeeded: 0, failed: 0 };

  isSyncing = true;
  await notify();

  let succeeded = 0;
  let failed = 0;

  try {
    const items = await syncQueueRepository.dequeuePending();
    const resolvedThisRun = new Set<string>();

    for (const item of items) {
      if (await isBlockedByDependency(item, resolvedThisRun)) continue;

      await syncQueueRepository.markInProgress(item.id);
      try {
        await replay(item);
        await syncQueueRepository.markSucceeded(item.id);
        resolvedThisRun.add(item.clientId);
        succeeded += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await syncQueueRepository.markFailed(item.id, message);
        lastError = message;
        failed += 1;
      }
    }
    lastSyncedAt = new Date();
  } finally {
    isSyncing = false;
    await notify();
  }

  return { succeeded, failed };
}

/** Raw account/budget/balance shapes returned by the API — mirrors the mapping each `services/<entity>.ts` does, kept local here to avoid a require cycle (those services import `notifyQueueChanged` from this module). */
type ApiAccount = Omit<AccountType, 'id' | 'client_id'> & { id: string; type: KindOfAccountType };
type ApiBudget = Omit<BudgetType, 'id' | 'start_date' | 'end_date' | 'category'> & {
  id: string;
  start_date?: string;
  end_date?: string;
  category?: Omit<CategoryType, 'id'> & { id: string };
};
type ApiBalance = Omit<BalanceType, 'created_at'> & { created_at: string };

const toAccountType = (a: ApiAccount): AccountType => ({ ...a, id: Number(a.id) });
const toBudgetType = (b: ApiBudget): BudgetType => ({
  ...b,
  id: Number(b.id),
  start_date: parseApiDate(b.start_date),
  end_date: parseApiDate(b.end_date),
  category: b.category ? { ...b.category, id: Number(b.category.id) } : undefined,
});
const toBalanceType = (b: ApiBalance): BalanceType => ({ ...b, created_at: new Date(b.created_at) });

/**
 * Best-effort background refresh of the local mirror on reconnect, so recent
 * data is already sitting in SQLite — ready to read instantly — the next time
 * the device drops offline, instead of only being cached lazily whenever a
 * screen happened to call a service's `getAll()` while online. Accounts and
 * budgets are mirrored in full (small, and screens depend on having all of
 * them); balances (the transaction log backing History/Dashboard) are capped
 * to the last week, matching the "recent moves ready offline" goal rather
 * than mirroring the user's entire history on every reconnect.
 */
async function refreshLocalMirror(): Promise<void> {
  try {
    const [accountsRes, budgetsRes, balancesRes] = await Promise.all([
      apiClient.get<ApiAccount[]>('/accounts'),
      apiClient.get<ApiBudget[]>('/budgets'),
      apiClient.get<ApiBalance[]>('/balances', { params: { range: 'week' } }),
    ]);
    recordApiOutcome(true);
    await accountRepository.replaceAllFromServer(accountsRes.data.map(toAccountType));
    await budgetRepository.replaceAllFromServer(budgetsRes.data.map(toBudgetType));
    await balanceRepository.replaceAllFromServer(balancesRes.data.map(toBalanceType));
  } catch (err) {
    if (!isNetworkError(err as AppError)) throw err;
    recordApiOutcome(false);
  }
}

/** Wires reconnect-triggered and periodic sync attempts. Call once at app startup; returns a teardown function. */
export function initAutoSync(): () => void {
  const unsubscribeNet = subscribeNetwork((online) => {
    if (online) void runSync().then(refreshLocalMirror);
  });
  const interval = setInterval(() => {
    if (isOnline()) void runSync();
  }, 30_000);

  return () => {
    unsubscribeNet();
    clearInterval(interval);
  };
}
