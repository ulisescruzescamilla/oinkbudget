import type * as SQLite from 'expo-sqlite';
import { BalanceType, TypeBalance } from '@/types/BalanceType';
import { getDBConnection } from '.';
import { generateClientId } from './clientId';
import { CDMX_SQL_SHIFT } from './timezone';
import { dayInAppTimeZone, todayInAppTimeZone } from '@/utils/formatting';

interface BalanceRow {
  client_id: string;
  id: number | null;
  amount: number;
  description: string;
  type: TypeBalance;
  account_name: string;
  account_id: number | null;
  source_client_id: string | null;
  created_at: string;
}

const toBalanceType = (row: BalanceRow): BalanceType => ({
  id: row.id,
  client_id: row.client_id,
  amount: row.amount,
  description: row.description,
  account_name: row.account_name,
  type: row.type,
  account: null,
  created_at: new Date(row.created_at),
});

/** Local mirror of `balanceService.getAll` — same `(range?, type?)` filter contract, used as the offline read fallback. */
export async function getAll(range?: string, type?: string): Promise<BalanceType[]> {
  const db = await getDBConnection();
  const clauses: string[] = ['deleted = 0'];
  const params: (string | number)[] = [];

  if (range && range !== 'all') {
    const days = range === 'today' ? 0 : range === 'week' ? 7 : 30;
    clauses.push('DATE(created_at, ?) >= ?');
    params.push(CDMX_SQL_SHIFT, dayInAppTimeZone(-days));
  }
  if (type && type !== 'all') {
    clauses.push('type = ?');
    params.push(type);
  }

  const rows = await db.getAllAsync<BalanceRow>(
    `SELECT * FROM balances WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC;`,
    params
  );
  return rows.map(toBalanceType);
}

export async function replaceAllFromServer(balances: BalanceType[]): Promise<void> {
  const db = await getDBConnection();
  for (const balance of balances) {
    // A single atomic upsert (rather than a SELECT-then-INSERT/UPDATE) so two
    // overlapping calls to this function (e.g. a tab refresh racing a
    // reconnect-triggered mirror sync) can't both see "not found" for the
    // same `id` and then both try to INSERT it, which previously tripped
    // `balances.id`'s UNIQUE constraint.
    await db.runAsync(
      `INSERT INTO balances (client_id, id, amount, description, type, account_name, account_id, created_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')
       ON CONFLICT(id) DO UPDATE SET
         amount = excluded.amount,
         description = excluded.description,
         type = excluded.type,
         account_name = excluded.account_name,
         account_id = excluded.account_id,
         created_at = excluded.created_at,
         sync_status = 'synced',
         deleted = 0;`,
      [
        generateClientId(),
        balance.id,
        balance.amount,
        balance.description,
        balance.type,
        balance.account_name,
        balance.account?.id ?? null,
        balance.created_at?.toISOString() ?? 'Sin fecha',
      ]
    );
  }
}

/**
 * Appends a mirrored transaction-log row. Takes a `db`/transaction handle
 * (not `getDBConnection()`) so it can run inside the same
 * `withExclusiveTransactionAsync` block as the expense/income insert that
 * calls it, keeping the balance update atomic. `sourceClientId` (the
 * expense/income's own `client_id`) is what lets `removeBySourceClientId`
 * find this row again once that expense/income syncs or is cancelled —
 * without it, a server refresh can't tell this is the same transaction (it
 * only matches by `id`, which this row doesn't have yet) and inserts a
 * duplicate instead of replacing it.
 */
export async function appendMirrorRow(
  db: SQLite.SQLiteDatabase,
  entry: {
    amount: number;
    description: string;
    type: TypeBalance;
    accountName: string;
    accountId: number | null;
    accountClientId: string;
    sourceClientId: string;
    createdAt: Date;
  }
): Promise<void> {
  await db.runAsync(
    "INSERT INTO balances (client_id, id, amount, description, type, account_name, account_id, account_client_id, source_client_id, created_at, sync_status) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'pending');",
    [
      generateClientId(),
      entry.amount,
      entry.description,
      entry.type,
      entry.accountName,
      entry.accountId,
      entry.accountClientId,
      entry.sourceClientId,
      entry.createdAt.toISOString(),
    ]
  );
}

/**
 * Removes the local mirror row tied to a given expense/income `client_id` —
 * called once that expense/income is confirmed synced (the next server
 * refresh brings the authoritative balance row back in) or cancelled before
 * it ever synced (nothing server-side to mirror).
 */
export async function removeBySourceClientId(sourceClientId: string): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync('DELETE FROM balances WHERE source_client_id = ?;', [sourceClientId]);
}

export async function getTodayExpensesTotal(): Promise<{ total: number } | null> {
  const db = await getDBConnection();
  return db.getFirstAsync<{ total: number }>(
    "SELECT SUM(amount) as total FROM balances WHERE type = 'expense' AND deleted = 0 AND DATE(created_at, ?) = ?;",
    [CDMX_SQL_SHIFT, todayInAppTimeZone()]
  );
}

export async function getLatestExpenses(limit = 5): Promise<BalanceType[]> {
  const db = await getDBConnection();
  const rows = await db.getAllAsync<BalanceRow>(
    "SELECT * FROM balances WHERE type = 'expense' AND deleted = 0 ORDER BY id DESC LIMIT ?;",
    [limit]
  );
  return rows.map(toBalanceType);
}
