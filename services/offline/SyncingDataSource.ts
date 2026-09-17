/**
 * Polymorphic API/local switch shared by `accountService` and `budgetService`
 * (entities with no create-time FK dependency on another offline record).
 * `expenseService`/`incomeService` implement the same switching logic by hand
 * instead of through this class, since creating them offline needs extra
 * context (which local account/budget client_id to attach to) that doesn't
 * fit this generic shape — see their `create` methods.
 *
 * A record whose id is still a client-generated UUID (i.e. it hasn't synced
 * yet) can only ever be resolved locally — `update`/`remove` branch on that
 * before ever touching the network.
 */
import { AppError, isNetworkError } from '@/utils/errorHandler';
import { isOnline, recordApiOutcome } from '@/utils/networkStatus';
import * as syncQueueRepository from '@/database/syncQueueRepository';
import { notifyQueueChanged, runSync } from '@/services/syncService';
import type { ApiEntitySource, LocalEntityRepository } from './DataSource';

const isClientId = (idOrClientId: string): boolean => !/^\d+$/.test(idOrClientId);

export class SyncingDataSource<
  T extends { id: number | null; client_id?: string },
  CreatePayload,
  UpdatePayload = Partial<CreatePayload>,
> implements ApiEntitySource<T, CreatePayload, UpdatePayload>
{
  constructor(
    private readonly api: ApiEntitySource<T, CreatePayload, UpdatePayload>,
    private readonly local: LocalEntityRepository<T, CreatePayload, UpdatePayload>,
    private readonly entityType: syncQueueRepository.SyncEntityType
  ) {}

  async getAll(): Promise<T[]> {
    if (isOnline()) {
      // Flush any offline-queued writes (this entity's and others', in dependency
      // order) before reading, so a record created while offline is pushed to the
      // API first instead of being shadowed by a server list that doesn't have it
      // yet — otherwise the mirror below would overwrite local state without ever
      // having sent it. No-ops quickly when the queue is empty or already syncing.
      await runSync();
      try {
        const items = await this.api.getAll();
        recordApiOutcome(true);
        await this.local.replaceAllFromServer(items);
        return items;
      } catch (err) {
        if (!isNetworkError(err as AppError)) throw err;
        recordApiOutcome(false);
      }
    }
    return this.local.getAll();
  }

  async create(payload: CreatePayload): Promise<T> {
    if (isOnline()) {
      try {
        const created = await this.api.create(payload);
        recordApiOutcome(true);
        await this.local.upsertFromServer(created);
        return created;
      } catch (err) {
        if (!isNetworkError(err as AppError)) throw err;
        recordApiOutcome(false);
      }
    }

    const created = await this.local.createLocal(payload);
    await syncQueueRepository.enqueue({
      entityType: this.entityType,
      operation: 'create',
      clientId: created.client_id!,
      payload: payload as unknown as Record<string, unknown>,
    });
    notifyQueueChanged();
    return created;
  }

  async update(idOrClientId: string, payload: UpdatePayload): Promise<T> {
    if (isClientId(idOrClientId)) {
      const updated = await this.local.updateLocal(idOrClientId, payload);
      await syncQueueRepository.mergeIntoPendingCreate(idOrClientId, payload as unknown as Record<string, unknown>);
      notifyQueueChanged();
      return updated;
    }

    const id = Number(idOrClientId);
    if (isOnline()) {
      try {
        const updated = await this.api.update(idOrClientId, payload);
        recordApiOutcome(true);
        await this.local.upsertFromServer(updated);
        return updated;
      } catch (err) {
        if (!isNetworkError(err as AppError)) throw err;
        recordApiOutcome(false);
      }
    }

    const local = await this.local.findById(id);
    if (!local?.client_id) throw new Error(`No local record for id ${id}`);
    const updated = await this.local.updateLocal(local.client_id, payload);
    await syncQueueRepository.enqueue({
      entityType: this.entityType,
      operation: 'update',
      clientId: local.client_id,
      payload: payload as unknown as Record<string, unknown>,
    });
    notifyQueueChanged();
    return updated;
  }

  async remove(idOrClientId: string): Promise<void> {
    if (isClientId(idOrClientId)) {
      await this.local.removeSyncedRow(idOrClientId);
      await syncQueueRepository.removePendingCreateFor(idOrClientId);
      notifyQueueChanged();
      return;
    }

    const id = Number(idOrClientId);
    if (isOnline()) {
      try {
        await this.api.remove(idOrClientId);
        recordApiOutcome(true);
        const local = await this.local.findById(id);
        if (local?.client_id) await this.local.removeSyncedRow(local.client_id);
        return;
      } catch (err) {
        if (!isNetworkError(err as AppError)) throw err;
        recordApiOutcome(false);
      }
    }

    const local = await this.local.findById(id);
    if (!local?.client_id) throw new Error(`No local record for id ${id}`);
    await this.local.markDeletedLocal(local.client_id);
    await syncQueueRepository.enqueue({
      entityType: this.entityType,
      operation: 'delete',
      clientId: local.client_id,
      payload: null,
    });
    notifyQueueChanged();
  }
}
