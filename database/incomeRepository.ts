import { AccountType } from '@/types/AccountType';
import { IncomeType } from '@/types/IncomeType';
import type { IncomePayload } from '@/services/incomeService';
import { getDBConnection } from '.';
import { generateClientId } from './clientId';
import { appendMirrorRow } from './balanceRepository';

interface IncomeRow {
  client_id: string;
  id: number | null;
  amount: number;
  description: string;
  account_id: number | null;
  account_client_id: string;
  created_at: string;
  acct_id: number | null;
  acct_client_id: string | null;
  acct_name: string | null;
  acct_amount: number | null;
  acct_type: string | null;
  acct_hidden: number | null;
}

const SELECT_WITH_ACCOUNT = `
  SELECT i.*, a.id as acct_id, a.client_id as acct_client_id, a.name as acct_name, a.amount as acct_amount, a.type as acct_type, a.hidden as acct_hidden
  FROM incomes i
  LEFT JOIN accounts a ON a.client_id = i.account_client_id
`;

const toIncomeType = (row: IncomeRow): IncomeType => ({
  id: row.id,
  client_id: row.client_id,
  amount: row.amount,
  description: row.description,
  created_at: new Date(row.created_at),
  account_id: row.account_id ?? 0,
  account: {
    id: row.acct_id,
    client_id: row.acct_client_id ?? undefined,
    name: row.acct_name ?? '',
    amount: row.acct_amount ?? 0,
    type: (row.acct_type as AccountType['type']) ?? 'cash',
    hidden: !!row.acct_hidden,
  },
});

export async function getAll(): Promise<IncomeType[]> {
  const db = await getDBConnection();
  const rows = await db.getAllAsync<IncomeRow>(`${SELECT_WITH_ACCOUNT} WHERE i.deleted = 0 ORDER BY i.created_at DESC;`);
  return rows.map(toIncomeType);
}

export async function findByClientId(clientId: string): Promise<IncomeType | null> {
  const db = await getDBConnection();
  const row = await db.getFirstAsync<IncomeRow>(`${SELECT_WITH_ACCOUNT} WHERE i.client_id = ?;`, [clientId]);
  return row ? toIncomeType(row) : null;
}

export async function findByServerId(id: number): Promise<IncomeType | null> {
  const db = await getDBConnection();
  const row = await db.getFirstAsync<IncomeRow>(`${SELECT_WITH_ACCOUNT} WHERE i.id = ?;`, [id]);
  return row ? toIncomeType(row) : null;
}

/** Mirrors a server-confirmed income. Skipped (picked up on the next full sync) if its account hasn't been mirrored locally yet. */
export async function upsertFromServer(income: IncomeType): Promise<void> {
  const db = await getDBConnection();
  const account = await db.getFirstAsync<{ client_id: string }>('SELECT client_id FROM accounts WHERE id = ?;', [income.account_id]);
  if (!account) return;

  const existing = income.id != null ? await findByServerId(income.id) : null;
  if (existing?.client_id) {
    await db.runAsync(
      `UPDATE incomes SET amount = ?, description = ?, account_id = ?, account_client_id = ?, created_at = ?,
       sync_status = 'synced', deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;`,
      [income.amount, income.description, income.account_id, account.client_id, income.created_at.toISOString(), existing.client_id]
    );
  } else {
    await db.runAsync(
      `INSERT INTO incomes (client_id, id, amount, description, account_id, account_client_id, created_at, sync_status)
       VALUES (?,?,?,?,?,?,?,'synced');`,
      [generateClientId(), income.id, income.amount, income.description, income.account_id, account.client_id, income.created_at.toISOString()]
    );
  }
}

export async function replaceAllFromServer(incomes: IncomeType[]): Promise<void> {
  for (const income of incomes) {
    await upsertFromServer(income);
  }
}

/** Creates an income entirely offline in one transaction: the income row, the account balance increment, and a mirrored `balances` entry. */
export async function createLocal(payload: IncomePayload, accountClientId: string): Promise<IncomeType> {
  const db = await getDBConnection();
  const clientId = generateClientId();
  const createdAt = new Date();

  await db.withTransactionAsync(async () => {
    // Resolve the account's server id up front — one synced before this income was created
    // offline already has one, and it must be stored now: attachServerId only backfills
    // incomes that depended on an account which was *itself* still pending.
    const account = await db.getFirstAsync<{ id: number | null; amount: number; name: string }>(
      'SELECT id, amount, name FROM accounts WHERE client_id = ?;',
      [accountClientId]
    );

    await db.runAsync(
      `INSERT INTO incomes (client_id, id, amount, description, account_id, account_client_id, created_at, sync_status)
       VALUES (?, NULL, ?, ?, ?, ?, ?, 'pending');`,
      [clientId, payload.amount, payload.description, account?.id ?? null, accountClientId, createdAt.toISOString()]
    );

    if (account) {
      await db.runAsync(
        "UPDATE accounts SET amount = ?, sync_status = CASE WHEN sync_status = 'synced' THEN 'pending' ELSE sync_status END, updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;",
        [account.amount + payload.amount, accountClientId]
      );
    }

    await appendMirrorRow(db, {
      amount: payload.amount,
      description: payload.description,
      type: 'income',
      accountName: account?.name ?? '',
      accountId: null,
      accountClientId,
      sourceClientId: clientId,
      createdAt,
    });
  });

  const created = await findByClientId(clientId);
  if (!created) throw new Error('Failed to read back locally created income');
  return created;
}

export async function markDeletedLocal(clientId: string): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync("UPDATE incomes SET deleted = 1, sync_status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;", [
    clientId,
  ]);
}

export async function attachServerId(clientId: string, serverId: number): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync("UPDATE incomes SET id = ?, sync_status = 'synced', updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;", [
    serverId,
    clientId,
  ]);
}

export async function removeSyncedRow(clientId: string): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync('DELETE FROM incomes WHERE client_id = ?;', [clientId]);
}
