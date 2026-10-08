import apiClient from '@/api/client';
import * as expenseRepository from '@/database/expenseRepository';
import * as balanceRepository from '@/database/balanceRepository';
import * as syncQueueRepository from '@/database/syncQueueRepository';
import { isOnline } from '@/utils/networkStatus';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/database/expenseRepository');
jest.mock('@/database/accountRepository');
jest.mock('@/database/budgetRepository');
jest.mock('@/database/balanceRepository');
jest.mock('@/database/syncQueueRepository');
jest.mock('@/services/syncService', () => ({
  notifyQueueChanged: jest.fn(),
}));
jest.mock('@/utils/networkStatus', () => ({
  isOnline: jest.fn(),
  recordApiOutcome: jest.fn(),
}));

// Imported after the mocks above so expenseService picks them up.
import { expenseService } from './expenseService';

describe('expenseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('remove', () => {
    it('reverts and removes a never-synced expense locally and cancels its queued create', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);

      await expenseService.remove('expense-client-1');

      expect(expenseRepository.removePendingLocal).toHaveBeenCalledWith('expense-client-1');
      expect(balanceRepository.removeBySourceClientId).toHaveBeenCalledWith('expense-client-1');
      expect(syncQueueRepository.removePendingCreateFor).toHaveBeenCalledWith('expense-client-1');
      expect(apiClient.delete).not.toHaveBeenCalled();
    });

    it('soft-deletes a synced expense and enqueues a delete when offline', async () => {
      (isOnline as jest.Mock).mockReturnValue(false);
      (expenseRepository.findByServerId as jest.Mock).mockResolvedValue({ id: 9, client_id: 'expense-client-9' });

      await expenseService.remove('9');

      expect(apiClient.delete).not.toHaveBeenCalled();
      expect(expenseRepository.markDeletedLocal).toHaveBeenCalledWith('expense-client-9');
      expect(syncQueueRepository.enqueue).toHaveBeenCalledWith({
        entityType: 'expense',
        operation: 'delete',
        clientId: 'expense-client-9',
        payload: null,
      });
    });

    it('removes via the API and drops the mirror row without a local revert when online', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      (apiClient.delete as jest.Mock).mockResolvedValue({});
      (expenseRepository.findByServerId as jest.Mock).mockResolvedValue({ id: 9, client_id: 'expense-client-9' });

      await expenseService.remove('9');

      expect(apiClient.delete).toHaveBeenCalledWith('/expenses/9');
      expect(expenseRepository.removeSyncedRow).toHaveBeenCalledWith('expense-client-9');
      expect(expenseRepository.markDeletedLocal).not.toHaveBeenCalled();
      expect(expenseRepository.removePendingLocal).not.toHaveBeenCalled();
    });
  });
});
