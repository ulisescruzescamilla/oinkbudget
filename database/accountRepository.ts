import { AccountType, KindOfAccountType } from '@/types/AccountType';
import type { AccountPayload } from '@/services/accountService';
import { getDBConnection } from '.';
import { generateClientId } from './clientId';

interface AccountRow {
  client_id: string;
  id: number | null;
  name: string;
  amount: number;
  type: KindOfAccountType;
  hidden: number;
}

const toAccountType = (row: AccountRow): AccountType => ({
  id: row.id,
  client_id: row.client_id,
  name: row.name,
  amount: row.amount,
  type: row.type,
  hidden: !!row.hidden,
});

/** All non-deleted accounts in the local mirror (offline read cache). */
export async function getAll(): Promise<AccountType[]> {
  const db = await getDBConnection();
  const rows = await db.getAllAsync<AccountRow>('SELECT * FROM accounts WHERE deleted = 0;');
  return rows.map(toAccountType);
}

export async function findByClientId(clientId: string): Promise<AccountType | null> {
  const db = await getDBConnection();
  const row = await db.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE client_id = ?;', [clientId]);
  return row ? toAccountType(row) : null;
}

export async function findById(id: number): Promise<AccountType | null> {
  const db = await getDBConnection();
  const row = await db.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE id = ?;', [id]);
  return row ? toAccountType(row) : null;
}

/** Mirrors a server-confirmed account locally (matched by server id), for offline read fallback. */
export async function upsertFromServer(account: AccountType): Promise<void> {
  const db = await getDBConnection();
  const existing = account.id != null ? await findById(account.id) : null;
  if (existing) {
    await db.runAsync(
      "UPDATE accounts SET name = ?, amount = ?, type = ?, hidden = ?, sync_status = 'synced', deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;",
      [account.name, account.amount, account.type, account.hidden ? 1 : 0, existing.client_id!]
    );
  } else {
    await db.runAsync(
      "INSERT INTO accounts (client_id, id, name, amount, type, hidden, sync_status) VALUES (?,?,?,?,?,?,'synced');",
      [generateClientId(), account.id, account.name, account.amount, account.type, account.hidden ? 1 : 0]
    );
  }
}

export async function replaceAllFromServer(accounts: AccountType[]): Promise<void> {
  for (const account of accounts) {
    await upsertFromServer(account);
  }
}

/** Creates an account entirely offline: no server id yet, queued for sync by the caller. */
export async function createLocal(payload: AccountPayload): Promise<AccountType> {
  const db = await getDBConnection();
  const clientId = generateClientId();
  await db.runAsync(
    "INSERT INTO accounts (client_id, id, name, amount, type, hidden, sync_status) VALUES (?, NULL, ?, ?, ?, ?, 'pending');",
    [clientId, payload.name, payload.amount, payload.type, payload.hidden ? 1 : 0]
  );
  return { id: null, client_id: clientId, ...payload };
}

export async function updateLocal(clientId: string, payload: Partial<AccountPayload>): Promise<AccountType> {
  const db = await getDBConnection();
  const current = await findByClientId(clientId);
  if (!current) throw new Error(`Local account not found: ${clientId}`);
  const next: AccountType = { ...current, ...payload };
  await db.runAsync(
    "UPDATE accounts SET name = ?, amount = ?, type = ?, hidden = ?, sync_status = CASE WHEN sync_status = 'synced' THEN 'pending' ELSE sync_status END, updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;",
    [next.name, next.amount, next.type, next.hidden ? 1 : 0, clientId]
  );
  return next;
}

/** Soft-deletes a local row (tombstoned until its queued 'delete' op confirms synced). */
export async function markDeletedLocal(clientId: string): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync(
    "UPDATE accounts SET deleted = 1, sync_status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;",
    [clientId]
  );
}

/** Stitches the server-assigned id into a locally-created row and cascades it into any dependents that referenced it only by client_id while offline. */
export async function attachServerId(clientId: string, serverId: number): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync(
    "UPDATE accounts SET id = ?, sync_status = 'synced', updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;",
    [serverId, clientId]
  );
  await db.runAsync('UPDATE expenses SET account_id = ? WHERE account_client_id = ?;', [serverId, clientId]);
  await db.runAsync('UPDATE incomes SET account_id = ? WHERE account_client_id = ?;', [serverId, clientId]);
  await db.runAsync('UPDATE balances SET account_id = ? WHERE account_client_id = ?;', [serverId, clientId]);
}

/** Removes the local mirror row after its queued 'delete' op is confirmed synced. */
export async function removeSyncedRow(clientId: string): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync('DELETE FROM accounts WHERE client_id = ?;', [clientId]);
}
