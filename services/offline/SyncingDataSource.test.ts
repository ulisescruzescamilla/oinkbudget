import { SyncingDataSource } from './SyncingDataSource';
import type { ApiEntitySource, LocalEntityRepository } from './DataSource';
import * as syncQueueRepository from '@/database/syncQueueRepository';
import { notifyQueueChanged, runSync } from '@/services/syncService';
import { isOnline, recordApiOutcome } from '@/utils/networkStatus';
import { AxiosError } from 'axios';
import type { AppError } from '@/utils/errorHandler';

jest.mock('@/database/syncQueueRepository');
jest.mock('@/services/syncService', () => ({
  notifyQueueChanged: jest.fn(),
  runSync: jest.fn(),
}));
jest.mock('@/utils/networkStatus', () => ({
  isOnline: jest.fn(),
  recordApiOutcome: jest.fn(),
}));

interface Entity {
  id: number | null;
  client_id?: string;
  name: string;
}
type CreatePayload = { name: string };

// `apiClient`'s response interceptor normalizes any thrown error into this shape before a
// service ever sees it (see api/client.ts + utils/errorHandler.ts). `raw` with no `.response`
// is what `isNetworkError` treats as "request never reached the server".
const networkError = (): AppError => ({ message: 'Network Error', raw: new AxiosError('Network Error') });

describe('SyncingDataSource', () => {
  let api: jest.Mocked<ApiEntitySource<Entity, CreatePayload>>;
  let local: jest.Mocked<LocalEntityRepository<Entity, CreatePayload>>;
  let source: SyncingDataSource<Entity, CreatePayload>;

  beforeEach(() => {
    jest.clearAllMocks();
    api = {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    local = {
      getAll: jest.fn(),
      findById: jest.fn(),
      findByClientId: jest.fn(),
      upsertFromServer: jest.fn(),
      replaceAllFromServer: jest.fn(),
      createLocal: jest.fn(),
      updateLocal: jest.fn(),
      markDeletedLocal: jest.fn(),
      removeSyncedRow: jest.fn(),
    };
    source = new SyncingDataSource(api, local, 'account');
  });

  describe('getAll', () => {
    it('flushes the queue, fetches from the API, and mirrors the result locally when online', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      const items: Entity[] = [{ id: 1, name: 'Cash' }];
      api.getAll.mockResolvedValue(items);

      const result = await source.getAll();

      expect(runSync).toHaveBeenCalled();
      expect(api.getAll).toHaveBeenCalled();
      expect(local.replaceAllFromServer).toHaveBeenCalledWith(items);
      expect(recordApiOutcome).toHaveBeenCalledWith(true);
      expect(result).toEqual(items);
    });

    it('falls back to the local mirror on a network error', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      api.getAll.mockRejectedValue(networkError());
      const localItems: Entity[] = [{ id: 1, name: 'Cash (cached)' }];
      local.getAll.mockResolvedValue(localItems);

      const result = await source.getAll();

      expect(recordApiOutcome).toHaveBeenCalledWith(false);
      expect(result).toEqual(localItems);
    });

    it('reads straight from the local mirror when offline, without touching the API', async () => {
      (isOnline as jest.Mock).mockReturnValue(false);
      const localItems: Entity[] = [{ id: 1, name: 'Cash (offline)' }];
      local.getAll.mockResolvedValue(localItems);

      const result = await source.getAll();

      expect(runSync).not.toHaveBeenCalled();
      expect(api.getAll).not.toHaveBeenCalled();
      expect(result).toEqual(localItems);
    });
  });

  describe('create', () => {
    it('creates via the API and mirrors it locally when online', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      const created: Entity = { id: 9, name: 'New account' };
      api.create.mockResolvedValue(created);

      const result = await source.create({ name: 'New account' });

      expect(api.create).toHaveBeenCalledWith({ name: 'New account' });
      expect(local.upsertFromServer).toHaveBeenCalledWith(created);
      expect(syncQueueRepository.enqueue).not.toHaveBeenCalled();
      expect(result).toEqual(created);
    });

    it('creates locally and enqueues a sync item when offline', async () => {
      (isOnline as jest.Mock).mockReturnValue(false);
      const createdLocal: Entity = { id: null, client_id: 'client-123', name: 'New account' };
      local.createLocal.mockResolvedValue(createdLocal);

      const result = await source.create({ name: 'New account' });

      expect(api.create).not.toHaveBeenCalled();
      expect(local.createLocal).toHaveBeenCalledWith({ name: 'New account' });
      expect(syncQueueRepository.enqueue).toHaveBeenCalledWith({
        entityType: 'account',
        operation: 'create',
        clientId: 'client-123',
        payload: { name: 'New account' },
      });
      expect(notifyQueueChanged).toHaveBeenCalled();
      expect(result).toEqual(createdLocal);
    });

    it('falls back to the offline path when the API is unreachable', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      api.create.mockRejectedValue(networkError());
      const createdLocal: Entity = { id: null, client_id: 'client-456', name: 'New account' };
      local.createLocal.mockResolvedValue(createdLocal);

      const result = await source.create({ name: 'New account' });

      expect(recordApiOutcome).toHaveBeenCalledWith(false);
      expect(local.createLocal).toHaveBeenCalled();
      expect(syncQueueRepository.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ operation: 'create', clientId: 'client-456' })
      );
      expect(result).toEqual(createdLocal);
    });
  });

  describe('update', () => {
    it('merges into the pending create when given a client id (never-synced record)', async () => {
      const updated: Entity = { id: null, client_id: 'client-1', name: 'Renamed' };
      local.updateLocal.mockResolvedValue(updated);

      const result = await source.update('client-1', { name: 'Renamed' });

      expect(local.updateLocal).toHaveBeenCalledWith('client-1', { name: 'Renamed' });
      expect(syncQueueRepository.mergeIntoPendingCreate).toHaveBeenCalledWith('client-1', { name: 'Renamed' });
      expect(notifyQueueChanged).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('updates via the API and mirrors it locally when online with a real id', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      const updated: Entity = { id: 5, name: 'Renamed' };
      api.update.mockResolvedValue(updated);

      const result = await source.update('5', { name: 'Renamed' });

      expect(api.update).toHaveBeenCalledWith('5', { name: 'Renamed' });
      expect(local.upsertFromServer).toHaveBeenCalledWith(updated);
      expect(result).toEqual(updated);
    });

    it('falls back to a queued local update when offline with a real id', async () => {
      (isOnline as jest.Mock).mockReturnValue(false);
      local.findById.mockResolvedValue({ id: 5, client_id: 'client-5', name: 'Old' });
      const updated: Entity = { id: 5, client_id: 'client-5', name: 'Renamed' };
      local.updateLocal.mockResolvedValue(updated);

      const result = await source.update('5', { name: 'Renamed' });

      expect(local.updateLocal).toHaveBeenCalledWith('client-5', { name: 'Renamed' });
      expect(syncQueueRepository.enqueue).toHaveBeenCalledWith({
        entityType: 'account',
        operation: 'update',
        clientId: 'client-5',
        payload: { name: 'Renamed' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('cancels the pending create when given a client id', async () => {
      await source.remove('client-1');

      expect(local.removeSyncedRow).toHaveBeenCalledWith('client-1');
      expect(syncQueueRepository.removePendingCreateFor).toHaveBeenCalledWith('client-1');
      expect(notifyQueueChanged).toHaveBeenCalled();
    });

    it('removes via the API and locally when online with a real id', async () => {
      (isOnline as jest.Mock).mockReturnValue(true);
      local.findById.mockResolvedValue({ id: 5, client_id: 'client-5', name: 'Gone' });

      await source.remove('5');

      expect(api.remove).toHaveBeenCalledWith('5');
      expect(local.removeSyncedRow).toHaveBeenCalledWith('client-5');
      expect(syncQueueRepository.enqueue).not.toHaveBeenCalled();
    });

    it('soft-deletes locally and enqueues a delete when offline with a real id', async () => {
      (isOnline as jest.Mock).mockReturnValue(false);
      local.findById.mockResolvedValue({ id: 5, client_id: 'client-5', name: 'Gone' });

      await source.remove('5');

      expect(local.markDeletedLocal).toHaveBeenCalledWith('client-5');
      expect(syncQueueRepository.enqueue).toHaveBeenCalledWith({
        entityType: 'account',
        operation: 'delete',
        clientId: 'client-5',
        payload: null,
      });
    });
  });
});
