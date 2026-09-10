import apiClient from '@/api/client';
import { AccountType, KindOfAccountType } from '@/types/AccountType';
import { AppError, isNetworkError } from '@/utils/errorHandler';
import { isOnline } from '@/utils/networkStatus';
import * as accountRepository from '@/database/accountRepository';
import type { ApiEntitySource } from './offline/DataSource';
import { SyncingDataSource } from './offline/SyncingDataSource';

/** Raw shape returned by the API (id is a string). */
type ApiAccount = {
  id: string;
  name: string;
  amount: number;
  type: KindOfAccountType;
  hidden: boolean;
};

/** Fields required to create or update an account. */
export type AccountPayload = Omit<AccountType, 'id' | 'client_id'>;

const toAccountType = (a: ApiAccount): AccountType => ({ ...a, id: Number(a.id) });

const apiSource: ApiEntitySource<AccountType, AccountPayload> = {
  async getAll() {
    const { data } = await apiClient.get<ApiAccount[]>('/accounts');
    return data.map(toAccountType);
  },
  async create(payload) {
    const { data } = await apiClient.post<ApiAccount>('/accounts', payload);
    return toAccountType(data);
  },
  async update(id, payload) {
    const { data } = await apiClient.put<ApiAccount>(`/accounts/${id}`, payload);
    return toAccountType(data);
  },
  async remove(id) {
    await apiClient.delete(`/accounts/${id}`);
  },
};

const synced = new SyncingDataSource(apiSource, accountRepository, 'account');

export const accountService = {
  /**
   * Returns all accounts for the authenticated user. Falls back to the local
   * mirror when offline or the API is unreachable.
   */
  getAll: (): Promise<AccountType[]> => synced.getAll(),

  /**
   * Returns a single account by id, falling back to the local mirror on a network error.
   *
   * @param id - Account identifier
   */
  async getById(id: string): Promise<AccountType> {
    try {
      const { data } = await apiClient.get<ApiAccount>(`/accounts/${id}`);
      return toAccountType(data);
    } catch (err) {
      if (!isNetworkError(err as AppError)) throw err;
      const local = await accountRepository.findById(Number(id));
      if (local) return local;
      throw err;
    }
  },

  /**
   * Creates a new account. Queued locally for sync when offline.
   *
   * @param payload - Account data to create
   */
  create: (payload: AccountPayload): Promise<AccountType> => synced.create(payload),

  /**
   * Updates an existing account. `id` may be a server id or, for a record
   * that hasn't synced yet, its local `client_id`.
   *
   * @param id - Account identifier
   * @param payload - Fields to update
   */
  update: (id: string, payload: Partial<AccountPayload>): Promise<AccountType> => synced.update(id, payload),

  /**
   * Deletes an account and its associated records.
   *
   * @param id - Account identifier
   */
  remove: (id: string): Promise<void> => synced.remove(id),

  /**
   * Transfers an amount between two accounts. Requires connectivity — a
   * compound server-side operation with no offline representation.
   *
   * @param fromId - Origin account identifier
   * @param toId - Destination account identifier
   * @param amount - Amount to transfer
   */
  async transfer(fromId: string, toId: string, amount: number): Promise<void> {
    if (!isOnline()) {
      throw { message: 'Se requiere conexión a internet para transferir entre cuentas' } as AppError;
    }
    await apiClient.post('/accounts/transfer', { fromId, toId, amount });
  },
};
