/**
 * Shared shapes for the API/local switching layer (`SyncingDataSource`).
 * `ApiEntitySource` mirrors the plain REST calls a `services/<entity>.ts`
 * already makes; `LocalEntityRepository` mirrors a `database/<entity>Repository.ts`.
 * Implementing both lets either side stand in for the other.
 */

export interface ApiEntitySource<T, CreatePayload, UpdatePayload = Partial<CreatePayload>> {
  getAll(): Promise<T[]>;
  create(payload: CreatePayload): Promise<T>;
  update(id: string, payload: UpdatePayload): Promise<T>;
  remove(id: string): Promise<void>;
}

export interface LocalEntityRepository<
  T extends { id: number | null; client_id?: string },
  CreatePayload,
  UpdatePayload = Partial<CreatePayload>,
> {
  getAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  findByClientId(clientId: string): Promise<T | null>;
  upsertFromServer(item: T): Promise<void>;
  replaceAllFromServer(items: T[]): Promise<void>;
  createLocal(payload: CreatePayload): Promise<T>;
  updateLocal(clientId: string, payload: UpdatePayload): Promise<T>;
  markDeletedLocal(clientId: string): Promise<void>;
  removeSyncedRow(clientId: string): Promise<void>;
}
