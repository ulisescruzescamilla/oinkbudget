import { AccountType } from '@/types/AccountType';
import { ExpenseType } from '@/types/ExpenseType';
import type { ExpensePayload } from '@/services/expenseService';
import { getDBConnection } from '.';
import { generateClientId } from './clientId';
import { appendMirrorRow } from './balanceRepository';

interface ExpenseRow {
  client_id: string;
  id: number | null;
  amount: number;
  description: string;
  account_id: number | null;
  account_client_id: string;
  budget_id: number | null;
  budget_client_id: string;
  created_at: string;
  acct_id: number | null;
  acct_client_id: string | null;
  acct_name: string | null;
  acct_amount: number | null;
  acct_type: string | null;
  acct_hidden: number | null;
}

const SELECT_WITH_ACCOUNT = `
  SELECT e.*, a.id as acct_id, a.client_id as acct_client_id, a.name as acct_name, a.amount as acct_amount, a.type as acct_type, a.hidden as acct_hidden
  FROM expenses e
  LEFT JOIN accounts a ON a.client_id = e.account_client_id
`;

const toExpenseType = (row: ExpenseRow): ExpenseType => ({
  id: row.id,
  client_id: row.client_id,
  amount: row.amount,
  description: row.description,
  created_at: new Date(row.created_at),
  budget_id: row.budget_id ?? 0,
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

export async function getAll(): Promise<ExpenseType[]> {
  const db = await getDBConnection();
  const rows = await db.getAllAsync<ExpenseRow>(`${SELECT_WITH_ACCOUNT} WHERE e.deleted = 0 ORDER BY e.created_at DESC;`);
  return rows.map(toExpenseType);
}

export async function findByClientId(clientId: string): Promise<ExpenseType | null> {
  const db = await getDBConnection();
  const row = await db.getFirstAsync<ExpenseRow>(`${SELECT_WITH_ACCOUNT} WHERE e.client_id = ?;`, [clientId]);
  return row ? toExpenseType(row) : null;
}

export async function findByServerId(id: number): Promise<ExpenseType | null> {
  const db = await getDBConnection();
  const row = await db.getFirstAsync<ExpenseRow>(`${SELECT_WITH_ACCOUNT} WHERE e.id = ?;`, [id]);
  return row ? toExpenseType(row) : null;
}

/** Mirrors a server-confirmed expense. Skipped (picked up on the next full sync) if its account/budget haven't been mirrored locally yet. */
export async function upsertFromServer(expense: ExpenseType): Promise<void> {
  const db = await getDBConnection();
  const account = await db.getFirstAsync<{ client_id: string }>('SELECT client_id FROM accounts WHERE id = ?;', [expense.account_id]);
  const budget = await db.getFirstAsync<{ client_id: string }>('SELECT client_id FROM budgets WHERE id = ?;', [expense.budget_id]);
  if (!account || !budget) return;

  const existing = expense.id != null ? await findByServerId(expense.id) : null;
  if (existing?.client_id) {
    await db.runAsync(
      `UPDATE expenses SET amount = ?, description = ?, account_id = ?, account_client_id = ?, budget_id = ?, budget_client_id = ?, created_at = ?,
       sync_status = 'synced', deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;`,
      [
        expense.amount,
        expense.description,
        expense.account_id,
        account.client_id,
        expense.budget_id,
        budget.client_id,
        expense.created_at.toISOString(),
        existing.client_id,
      ]
    );
  } else {
    await db.runAsync(
      `INSERT INTO expenses (client_id, id, amount, description, account_id, account_client_id, budget_id, budget_client_id, created_at, sync_status)
       VALUES (?,?,?,?,?,?,?,?,?,'synced');`,
      [
        generateClientId(),
        expense.id,
        expense.amount,
        expense.description,
        expense.account_id,
        account.client_id,
        expense.budget_id,
        budget.client_id,
        expense.created_at.toISOString(),
      ]
    );
  }
}

export async function replaceAllFromServer(expenses: ExpenseType[]): Promise<void> {
  for (const expense of expenses) {
    await upsertFromServer(expense);
  }
}

/** Creates an expense entirely offline in one transaction: the expense row, the account balance decrement, the budget's spent-amount bump, and a mirrored `balances` entry. */
export async function createLocal(payload: ExpensePayload, accountClientId: string, budgetClientId: string): Promise<ExpenseType> {
  const db = await getDBConnection();
  const clientId = generateClientId();
  const createdAt = new Date();

  await db.withTransactionAsync(async () => {
    // Resolve each side's server id up front — an account/budget synced before this expense
    // was created offline already has one, and it must be stored now: attachServerId only
    // backfills expenses that depended on an account/budget which was *itself* still pending.
    const account = await db.getFirstAsync<{ id: number | null; amount: number; name: string }>(
      'SELECT id, amount, name FROM accounts WHERE client_id = ?;',
      [accountClientId]
    );
    const budget = await db.getFirstAsync<{ id: number | null; expense_amount: number }>(
      'SELECT id, expense_amount FROM budgets WHERE client_id = ?;',
      [budgetClientId]
    );

    await db.runAsync(
      `INSERT INTO expenses (client_id, id, amount, description, account_id, account_client_id, budget_id, budget_client_id, created_at, sync_status)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 'pending');`,
      [clientId, payload.amount, payload.description, account?.id ?? null, accountClientId, budget?.id ?? null, budgetClientId, createdAt.toISOString()]
    );

    if (account) {
      await db.runAsync(
        "UPDATE accounts SET amount = ?, sync_status = CASE WHEN sync_status = 'synced' THEN 'pending' ELSE sync_status END, updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;",
        [account.amount - payload.amount, accountClientId]
      );
    }

    if (budget) {
      await db.runAsync(
        "UPDATE budgets SET expense_amount = ?, sync_status = CASE WHEN sync_status = 'synced' THEN 'pending' ELSE sync_status END, updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;",
        [budget.expense_amount + payload.amount, budgetClientId]
      );
    }

    await appendMirrorRow(db, {
      amount: payload.amount,
      description: payload.description,
      type: 'expense',
      accountName: account?.name ?? '',
      accountId: null,
      accountClientId,
      sourceClientId: clientId,
      createdAt,
    });
  });

  const created = await findByClientId(clientId);
  if (!created) throw new Error('Failed to read back locally created expense');
  return created;
}

export async function markDeletedLocal(clientId: string): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync("UPDATE expenses SET deleted = 1, sync_status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;", [
    clientId,
  ]);
}

export async function attachServerId(clientId: string, serverId: number): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync("UPDATE expenses SET id = ?, sync_status = 'synced', updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;", [
    serverId,
    clientId,
  ]);
}

export async function removeSyncedRow(clientId: string): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync('DELETE FROM expenses WHERE client_id = ?;', [clientId]);
}
