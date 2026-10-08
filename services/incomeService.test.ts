import apiClient from '@/api/client';
import * as incomeRepository from '@/database/incomeRepository';
import * as balanceRepository from '@/database/balanceRepository';
import * as syncQueueRepository from '@/database/syncQueueRepository';
import { isOnline } from '@/utils/networkStatus';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/database/incomeRepository');
jest.mock('@/database/accountRepository');
jest.mock('@/database/balanceRepository');
jest.mock('@/database/syncQueueRepository');
jest.mock('@/services/syncService', () => ({
  notifyQueueChanged: jest.fn(),
}));
jest.mock('@/utils/networkStatus', () => ({
  isOnline: jest.fn(),
  recordApiOutcome: jest.fn(),
}));

// Imported after the mocks above so incomeService picks them up.
import { incomeService } from './incomeService';

describe('incomeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('remove', () => {
    it('reverts and removes a never-synced income locally and cancels its queued create', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);

      await incomeService.remove('income-client-1');

      expect(incomeRepository.removePendingLocal).toHaveBeenCalledWith('income-client-1');
      expect(balanceRepository.removeBySourceClientId).toHaveBeenCalledWith('income-client-1');
      expect(syncQueueRepository.removePendingCreateFor).toHaveBeenCalledWith('income-client-1');
      expect(apiClient.delete).not.toHaveBeenCalled();
    });

    it('soft-deletes a synced income and enqueues a delete when offline', async () => {
      (isOnline as jest.Mock).mockReturnValue(false);
      (incomeRepository.findByServerId as jest.Mock).mockResolvedValue({ id: 4, client_id: 'income-client-4' });

      await incomeService.remove('4');

      expect(apiClient.delete).not.toHaveBeenCalled();
      expect(incomeRepository.markDeletedLocal).toHaveBeenCalledWith('income-client-4');
      expect(syncQueueRepository.enqueue).toHaveBeenCalledWith({
        entityType: 'income',
        operation: 'delete',
        clientId: 'income-client-4',
        payload: null,
      });
    });

    it('removes via the API and drops the mirror row without a local revert when online', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      (apiClient.delete as jest.Mock).mockResolvedValue({});
      (incomeRepository.findByServerId as jest.Mock).mockResolvedValue({ id: 4, client_id: 'income-client-4' });

      await incomeService.remove('4');

      expect(apiClient.delete).toHaveBeenCalledWith('/incomes/4');
      expect(incomeRepository.removeSyncedRow).toHaveBeenCalledWith('income-client-4');
      expect(incomeRepository.markDeletedLocal).not.toHaveBeenCalled();
      expect(incomeRepository.removePendingLocal).not.toHaveBeenCalled();
    });
  });
});
