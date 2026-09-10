import { getDBConnection } from '.';

export type SyncEntityType = 'account' | 'budget' | 'expense' | 'income';
export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncQueueItem {
  id: number;
  entityType: SyncEntityType;
  operation: SyncOperation;
  clientId: string;
  payload: Record<string, unknown> | null;
  dependsOn: string[];
  status: 'pending' | 'in_progress' | 'failed';
  attempts: number;
  lastError: string | null;
  createdAt: Date;
}

interface SyncQueueRow {
  id: number;
  entity_type: SyncEntityType;
  operation: SyncOperation;
  client_id: string;
  payload: string | null;
  depends_on: string | null;
  status: 'pending' | 'in_progress' | 'failed';
  attempts: number;
  last_error: string | null;
  created_at: string;
}

const MAX_ATTEMPTS = 5;

const toItem = (row: SyncQueueRow): SyncQueueItem => ({
  id: row.id,
  entityType: row.entity_type,
  operation: row.operation,
  clientId: row.client_id,
  payload: row.payload ? JSON.parse(row.payload) : null,
  dependsOn: row.depends_on ? JSON.parse(row.depends_on) : [],
  status: row.status,
  attempts: row.attempts,
  lastError: row.last_error,
  createdAt: new Date(row.created_at),
});

export async function enqueue(item: {
  entityType: SyncEntityType;
  operation: SyncOperation;
  clientId: string;
  payload: Record<string, unknown> | null;
  dependsOn?: string[];
}): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync('INSERT INTO sync_queue (entity_type, operation, client_id, payload, depends_on) VALUES (?,?,?,?,?);', [
    item.entityType,
    item.operation,
    item.clientId,
    item.payload ? JSON.stringify(item.payload) : null,
    item.dependsOn?.length ? JSON.stringify(item.dependsOn) : null,
  ]);
}

/** Pending items ordered so accounts/budgets sync before expenses/incomes that may reference them. */
export async function dequeuePending(): Promise<SyncQueueItem[]> {
  const db = await getDBConnection();
  const rows = await db.getAllAsync<SyncQueueRow>(
    `SELECT * FROM sync_queue WHERE status = 'pending'
     ORDER BY CASE entity_type WHEN 'account' THEN 0 WHEN 'budget' THEN 0 ELSE 1 END, created_at ASC;`
  );
  return rows.map(toItem);
}

export async function markInProgress(id: number): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync("UPDATE sync_queue SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?;", [id]);
}

/** A synced operation's ledger entry is removed entirely — the pending-work queue stays empty and ready for the next offline spell. */
export async function markSucceeded(id: number): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?;', [id]);
}

export async function markFailed(id: number, error: string): Promise<void> {
  const db = await getDBConnection();
  const row = await db.getFirstAsync<{ attempts: number }>('SELECT attempts FROM sync_queue WHERE id = ?;', [id]);
  const attempts = (row?.attempts ?? 0) + 1;
  const status = attempts >= MAX_ATTEMPTS ? 'failed' : 'pending';
  await db.runAsync('UPDATE sync_queue SET status = ?, attempts = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;', [
    status,
    attempts,
    error,
    id,
  ]);
}

/** Cancels a queued 'create' for a record that never made it to the server (e.g. deleted locally before it synced). */
export async function removePendingCreateFor(clientId: string): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync("DELETE FROM sync_queue WHERE client_id = ? AND operation = 'create';", [clientId]);
}

/** Merges edited fields into a still-pending 'create' payload — the record hasn't synced yet, so there's nothing server-side to send an 'update' op against. */
export async function mergeIntoPendingCreate(clientId: string, payload: Record<string, unknown>): Promise<void> {
  const db = await getDBConnection();
  const row = await db.getFirstAsync<{ id: number; payload: string | null }>(
    "SELECT id, payload FROM sync_queue WHERE client_id = ? AND operation = 'create';",
    [clientId]
  );
  if (!row) return;
  const merged = { ...(row.payload ? JSON.parse(row.payload) : {}), ...payload };
  await db.runAsync('UPDATE sync_queue SET payload = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;', [
    JSON.stringify(merged),
    row.id,
  ]);
}

export async function countPending(): Promise<number> {
  const db = await getDBConnection();
  const row = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM sync_queue WHERE status != 'failed';");
  return row?.count ?? 0;
}
