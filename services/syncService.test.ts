import apiClient from '@/api/client';
import * as accountRepository from '@/database/accountRepository';
import * as budgetRepository from '@/database/budgetRepository';
import * as syncQueueRepository from '@/database/syncQueueRepository';
import type { SyncQueueItem } from '@/database/syncQueueRepository';
import { isOnline, recordApiOutcome } from '@/utils/networkStatus';
import { AxiosError, type AxiosResponse } from 'axios';
import type { AppError } from '@/utils/errorHandler';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/database/accountRepository');
jest.mock('@/database/budgetRepository');
jest.mock('@/database/balanceRepository');
jest.mock('@/database/expenseRepository');
jest.mock('@/database/incomeRepository');
jest.mock('@/database/syncQueueRepository');
jest.mock('@/utils/networkStatus', () => ({
  isOnline: jest.fn(),
  recordApiOutcome: jest.fn(),
  subscribeNetwork: jest.fn(() => jest.fn()),
}));

const queueItem = (overrides: Partial<SyncQueueItem> = {}): SyncQueueItem => ({
  id: 1,
  entityType: 'account',
  operation: 'create',
  clientId: 'client-1',
  payload: { name: 'Cash' },
  dependsOn: [],
  status: 'pending',
  attempts: 0,
  lastError: null,
  createdAt: new Date(),
  ...overrides,
});

// Imported after the mocks above are registered, so it picks up the mocked modules.
import { runSync, getSyncStatus, subscribeSyncStatus, notifyQueueChanged } from './syncService';

describe('syncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (syncQueueRepository.countPending as jest.Mock).mockResolvedValue(0);
    (budgetRepository.findByClientId as jest.Mock).mockResolvedValue(null);
  });

  describe('runSync', () => {
    it('no-ops while offline', async () => {
      (isOnline as jest.Mock).mockReturnValue(false);

      const result = await runSync();

      expect(result).toEqual({ succeeded: 0, failed: 0 });
      expect(syncQueueRepository.dequeuePending).not.toHaveBeenCalled();
    });

    it('replays a pending create against the API and marks it succeeded', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      (syncQueueRepository.dequeuePending as jest.Mock).mockResolvedValue([queueItem()]);
      (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: '42' } });

      const result = await runSync();

      expect(apiClient.post).toHaveBeenCalledWith('/accounts', { name: 'Cash' });
      expect(accountRepository.attachServerId).toHaveBeenCalledWith('client-1', 42);
      expect(syncQueueRepository.markSucceeded).toHaveBeenCalledWith(1);
      expect(result).toEqual({ succeeded: 1, failed: 0 });

      const status = await getSyncStatus();
      expect(status.lastSyncedAt).toBeInstanceOf(Date);
      expect(status.lastError).toBeNull();
    });

    it('marks a failed replay and records the error on the sync status', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      (syncQueueRepository.dequeuePending as jest.Mock).mockResolvedValue([queueItem()]);
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('boom'));

      const result = await runSync();

      expect(syncQueueRepository.markFailed).toHaveBeenCalledWith(1, 'boom');
      expect(result).toEqual({ succeeded: 0, failed: 1 });

      const status = await getSyncStatus();
      expect(status.lastError).toBe('boom');
    });

    it('records the normalized API error message on a rejected replay', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      (syncQueueRepository.dequeuePending as jest.Mock).mockResolvedValue([queueItem()]);
      const rejected: AppError = {
        message: 'The name field is required.',
        status: 422,
        raw: new AxiosError('Request failed', undefined, undefined, undefined, { status: 422 } as AxiosResponse),
      };
      (apiClient.post as jest.Mock).mockRejectedValue(rejected);

      const result = await runSync();

      expect(syncQueueRepository.markFailed).toHaveBeenCalledWith(1, 'The name field is required.');
      expect(result).toEqual({ succeeded: 0, failed: 1 });
    });

    it('keeps an item queued without spending an attempt, and stops the run, when the API is unreachable', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      (syncQueueRepository.dequeuePending as jest.Mock).mockResolvedValue([
        queueItem(),
        queueItem({ id: 2, clientId: 'client-2' }),
      ]);
      const unreachable: AppError = { message: 'Network Error', raw: new AxiosError('Network Error') };
      (apiClient.post as jest.Mock).mockRejectedValue(unreachable);

      const result = await runSync();

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(syncQueueRepository.markPending).toHaveBeenCalledWith(1);
      expect(syncQueueRepository.markFailed).not.toHaveBeenCalled();
      expect(syncQueueRepository.markInProgress).not.toHaveBeenCalledWith(2);
      expect(recordApiOutcome).toHaveBeenCalledWith(false);
      expect(result).toEqual({ succeeded: 0, failed: 0 });
    });

    it('skips an item whose dependency has not synced yet', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      const item = queueItem({
        entityType: 'expense',
        operation: 'create',
        clientId: 'expense-client-1',
        dependsOn: ['account-client-unsynced'],
      });
      (syncQueueRepository.dequeuePending as jest.Mock).mockResolvedValue([item]);
      (accountRepository.findByClientId as jest.Mock).mockResolvedValue({ id: null, client_id: 'account-client-unsynced' });

      const result = await runSync();

      expect(syncQueueRepository.markInProgress).not.toHaveBeenCalled();
      expect(apiClient.post).not.toHaveBeenCalled();
      expect(result).toEqual({ succeeded: 0, failed: 0 });
    });
  });

  describe('sync status', () => {
    it('reflects online state and pending count', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      (syncQueueRepository.countPending as jest.Mock).mockResolvedValue(3);

      const status = await getSyncStatus();

      expect(status).toMatchObject({ isOnline: true, pendingCount: 3, isSyncing: false });
    });

    it('notifies subscribers on notifyQueueChanged', async () => {
      const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
      const listener = jest.fn();
      const unsubscribe = subscribeSyncStatus(listener);
      await flush();
      listener.mockClear();

      (syncQueueRepository.countPending as jest.Mock).mockResolvedValue(5);
      notifyQueueChanged();
      await flush();

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ pendingCount: 5 }));
      unsubscribe();
    });
  });
});
