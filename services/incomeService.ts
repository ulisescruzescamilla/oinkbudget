import apiClient from '@/api/client';
import { IncomeType } from '@/types/IncomeType';
import type { AccountType } from '@/types/AccountType';
import { AppError, isNetworkError } from '@/utils/errorHandler';
import { formatApiDateTime } from '@/utils/formatting';
import { isOnline, recordApiOutcome } from '@/utils/networkStatus';
import * as incomeRepository from '@/database/incomeRepository';
import * as accountRepository from '@/database/accountRepository';
import * as balanceRepository from '@/database/balanceRepository';
import * as syncQueueRepository from '@/database/syncQueueRepository';
import { notifyQueueChanged } from '@/services/syncService';

/** Raw shape returned by the API (id is a string, created_at is a string). */
type ApiIncome = Omit<IncomeType, 'id' | 'created_at'> & { id: string; created_at: string };

/** Fields required to create an income. */
export type IncomePayload = Pick<IncomeType, 'amount' | 'description' | 'account_id'> & {
  created_at?: Date;
};

const toIncomeType = (e: ApiIncome): IncomeType => ({
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
  throw new Error('No se pudo resolver la cuenta local para el ingreso');
}

export const incomeService = {
  /**
   * Returns all incomes for the authenticated user. Falls back to the local
   * mirror when offline or the API is unreachable.
   */
  async getAll(): Promise<IncomeType[]> {
    if (isOnline()) {
      try {
        const { data } = await apiClient.get<ApiIncome[]>('/incomes');
        recordApiOutcome(true);
        const incomes = data.map(toIncomeType);
        await incomeRepository.replaceAllFromServer(incomes);
        return incomes;
      } catch (err) {
        if (!isNetworkError(err as AppError)) throw err;
        recordApiOutcome(false);
      }
    }
    return incomeRepository.getAll();
  },

  /**
   * Creates a new income. When offline (or the referenced account hasn't
   * synced yet), it's written to the local mirror and queued for sync —
   * `account` is only used to resolve that local linkage, never sent to the API.
   *
   * @param payload - Income data to create
   * @param account - The income's account (embedded on the `IncomeType` passed to the hook)
   */
  async create(payload: IncomePayload, account: AccountType): Promise<IncomeType> {
    const accountPending = account.id == null;

    if (isOnline() && !accountPending) {
      try {
        const { data } = await apiClient.post<ApiIncome>('/incomes', {
          ...payload,
          created_at: formatApiDateTime(payload.created_at),
        });
        recordApiOutcome(true);
        const created = toIncomeType(data);
        await incomeRepository.upsertFromServer(created);
        return created;
      } catch (err) {
        if (!isNetworkError(err as AppError)) throw err;
        recordApiOutcome(false);
      }
    }

    const accountClientId = await resolveAccountClientId(account);
    const created = await incomeRepository.createLocal(payload, accountClientId);

    await syncQueueRepository.enqueue({
      entityType: 'income',
      operation: 'create',
      clientId: created.client_id!,
      payload: payload as unknown as Record<string, unknown>,
      dependsOn: accountPending ? [accountClientId] : [],
    });
    notifyQueueChanged();
    return created;
  },

  /**
   * Deletes an income. `id` may be a server id or, for a record that hasn't
   * synced yet, its local `client_id`.
   *
   * @param id - Income identifier
   */
  async remove(id: string): Promise<void> {
    const pending = !/^\d+$/.test(id);
    if (pending) {
      await incomeRepository.removeSyncedRow(id);
      await balanceRepository.removeBySourceClientId(id);
      await syncQueueRepository.removePendingCreateFor(id);
      notifyQueueChanged();
      return;
    }

    if (isOnline()) {
      try {
        await apiClient.delete(`/incomes/${id}`);
        recordApiOutcome(true);
        const local = await incomeRepository.findByServerId(Number(id));
        if (local?.client_id) await incomeRepository.removeSyncedRow(local.client_id);
        return;
      } catch (err) {
        if (!isNetworkError(err as AppError)) throw err;
        recordApiOutcome(false);
      }
    }

    const local = await incomeRepository.findByServerId(Number(id));
    if (!local?.client_id) throw new Error(`No se encontró el ingreso local ${id}`);
    await incomeRepository.markDeletedLocal(local.client_id);
    await syncQueueRepository.enqueue({ entityType: 'income', operation: 'delete', clientId: local.client_id, payload: null });
    notifyQueueChanged();
  },
};
