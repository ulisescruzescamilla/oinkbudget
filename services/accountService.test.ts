import apiClient from '@/api/client';
import * as accountRepository from '@/database/accountRepository';
import { isOnline } from '@/utils/networkStatus';
import { AxiosError } from 'axios';
import type { AppError } from '@/utils/errorHandler';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/database/accountRepository');
jest.mock('@/database/syncQueueRepository');
jest.mock('@/services/syncService', () => ({
  notifyQueueChanged: jest.fn(),
  runSync: jest.fn(),
}));
jest.mock('@/utils/networkStatus', () => ({
  isOnline: jest.fn(),
  recordApiOutcome: jest.fn(),
}));

// Imported after the mocks above so accountService (and the SyncingDataSource it wires up) picks them up.
import { accountService } from './accountService';
import * as syncQueueRepository from '@/database/syncQueueRepository';

// `apiClient`'s response interceptor normalizes any thrown error into this shape before a
// service ever sees it (see api/client.ts + utils/errorHandler.ts).
const networkError = (): AppError => ({ message: 'Network Error', raw: new AxiosError('Network Error') });

describe('accountService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches from the API, maps ids to numbers, and mirrors locally', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: [{ id: '7', name: 'Cash', amount: 100, type: 'cash', hidden: false }],
      });

      const result = await accountService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/accounts');
      expect(result).toEqual([{ id: 7, name: 'Cash', amount: 100, type: 'cash', hidden: false }]);
      expect(accountRepository.replaceAllFromServer).toHaveBeenCalledWith(result);
    });
  });

  describe('getById', () => {
    it('falls back to the local mirror on a network error', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(networkError());
      (accountRepository.findById as jest.Mock).mockResolvedValue({
        id: 7,
        client_id: 'client-7',
        name: 'Cash (cached)',
        amount: 100,
        type: 'cash',
        hidden: false,
      });

      const result = await accountService.getById('7');

      expect(result.name).toBe('Cash (cached)');
    });

    it('rethrows a non-network error', async () => {
      const err = { message: 'not found', raw: new AxiosError('Not Found', undefined, undefined, undefined, {
        status: 404,
      } as any) };
      (apiClient.get as jest.Mock).mockRejectedValue(err);

      await expect(accountService.getById('999')).rejects.toBe(err);
      expect(accountRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('queues an offline create and returns the local record', async () => {
      (isOnline as jest.Mock).mockReturnValue(false);
      (accountRepository.createLocal as jest.Mock).mockResolvedValue({
        id: null,
        client_id: 'client-new',
        name: 'Savings',
        amount: 0,
        type: 'cash',
        hidden: false,
      });

      const result = await accountService.create({ name: 'Savings', amount: 0, type: 'cash', hidden: false });

      expect(apiClient.post).not.toHaveBeenCalled();
      expect(syncQueueRepository.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'account', operation: 'create', clientId: 'client-new' })
      );
      expect(result.id).toBeNull();
    });
  });

  describe('remove', () => {
    it('removes via the API and the local mirror when online', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      (accountRepository.findById as jest.Mock).mockResolvedValue({ id: 7, client_id: 'client-7' });

      await accountService.remove('7');

      expect(apiClient.delete).toHaveBeenCalledWith('/accounts/7');
      expect(accountRepository.removeSyncedRow).toHaveBeenCalledWith('client-7');
    });
  });

  describe('transfer', () => {
    it('throws without calling the API when offline', async () => {
      (isOnline as jest.Mock).mockReturnValue(false);

      await expect(accountService.transfer('1', '2', 50)).rejects.toMatchObject({
        message: expect.stringContaining('conexión'),
      });
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('posts the transfer when online', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });

      await accountService.transfer('1', '2', 50);

      expect(apiClient.post).toHaveBeenCalledWith('/accounts/transfer', { fromId: '1', toId: '2', amount: 50 });
    });
  });
});
