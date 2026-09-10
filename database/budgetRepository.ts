import type { BudgetPeriodType, BudgetType } from '@/types/BudgetType';
import type { BudgetPayload } from '@/services/budgetService';
import { formatApiDate, parseApiDate } from '@/utils/formatting';
import { getDBConnection } from '.';
import { generateClientId } from './clientId';

interface BudgetRow {
  client_id: string;
  id: number | null;
  name: string;
  max_limit: number;
  expense_amount: number;
  percentage_value: number;
  start_date: string | null;
  end_date: string | null;
  is_recurrent: number;
  period: BudgetPeriodType;
  category_id: number | null;
}

const toBudgetType = (row: BudgetRow): BudgetType => ({
  id: row.id,
  client_id: row.client_id,
  name: row.name,
  max_limit: row.max_limit,
  expense_amount: row.expense_amount,
  percentage_value: row.percentage_value,
  start_date: parseApiDate(row.start_date ?? undefined),
  end_date: parseApiDate(row.end_date ?? undefined),
  is_recurrent: !!row.is_recurrent,
  period: row.period,
  category_id: row.category_id,
});

export async function getAll(): Promise<BudgetType[]> {
  const db = await getDBConnection();
  const rows = await db.getAllAsync<BudgetRow>('SELECT * FROM budgets WHERE deleted = 0 ORDER BY name DESC;');
  return rows.map(toBudgetType);
}

export async function findByClientId(clientId: string): Promise<BudgetType | null> {
  const db = await getDBConnection();
  const row = await db.getFirstAsync<BudgetRow>('SELECT * FROM budgets WHERE client_id = ?;', [clientId]);
  return row ? toBudgetType(row) : null;
}

export async function findById(id: number): Promise<BudgetType | null> {
  const db = await getDBConnection();
  const row = await db.getFirstAsync<BudgetRow>('SELECT * FROM budgets WHERE id = ?;', [id]);
  return row ? toBudgetType(row) : null;
}

export async function getMaxPercentage(): Promise<{ sum_percentage: number } | null> {
  const db = await getDBConnection();
  return db.getFirstAsync<{ sum_percentage: number }>(
    'SELECT SUM(percentage_value) as sum_percentage FROM budgets WHERE deleted = 0;'
  );
}

export async function upsertFromServer(budget: BudgetType): Promise<void> {
  const db = await getDBConnection();
  const existing = budget.id != null ? await findById(budget.id) : null;
  const params = [
    budget.name,
    budget.max_limit,
    budget.expense_amount ?? 0,
    budget.percentage_value,
    formatApiDate(budget.start_date) ?? null,
    formatApiDate(budget.end_date) ?? null,
    budget.is_recurrent ? 1 : 0,
    budget.period,
    budget.category_id ?? null,
  ];
  if (existing) {
    await db.runAsync(
      `UPDATE budgets SET name = ?, max_limit = ?, expense_amount = ?, percentage_value = ?, start_date = ?, end_date = ?,
       is_recurrent = ?, period = ?, category_id = ?, sync_status = 'synced', deleted = 0, updated_at = CURRENT_TIMESTAMP
       WHERE client_id = ?;`,
      [...params, existing.client_id!]
    );
  } else {
    await db.runAsync(
      `INSERT INTO budgets (client_id, id, name, max_limit, expense_amount, percentage_value, start_date, end_date, is_recurrent, period, category_id, sync_status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'synced');`,
      [generateClientId(), budget.id, ...params]
    );
  }
}

export async function replaceAllFromServer(budgets: BudgetType[]): Promise<void> {
  for (const budget of budgets) {
    await upsertFromServer(budget);
  }
}

export async function createLocal(payload: BudgetPayload): Promise<BudgetType> {
  const db = await getDBConnection();
  const clientId = generateClientId();
  await db.runAsync(
    `INSERT INTO budgets (client_id, id, name, max_limit, expense_amount, percentage_value, start_date, end_date, is_recurrent, period, category_id, sync_status)
     VALUES (?, NULL, ?, ?, 0, ?, ?, ?, ?, ?, ?, 'pending');`,
    [
      clientId,
      payload.name,
      payload.max_limit ?? 0,
      payload.percentage_value ?? 0,
      formatApiDate(payload.start_date) ?? null,
      formatApiDate(payload.end_date) ?? null,
      payload.is_recurrent ? 1 : 0,
      payload.period,
      payload.category_id ?? null,
    ]
  );
  return {
    id: null,
    client_id: clientId,
    name: payload.name,
    max_limit: payload.max_limit ?? 0,
    expense_amount: 0,
    percentage_value: payload.percentage_value ?? 0,
    start_date: payload.start_date,
    end_date: payload.end_date,
    is_recurrent: payload.is_recurrent,
    period: payload.period,
    category_id: payload.category_id,
  };
}

export async function updateLocal(clientId: string, payload: Partial<BudgetPayload>): Promise<BudgetType> {
  const db = await getDBConnection();
  const current = await findByClientId(clientId);
  if (!current) throw new Error(`Local budget not found: ${clientId}`);
  const next: BudgetType = { ...current, ...payload };
  await db.runAsync(
    `UPDATE budgets SET name = ?, max_limit = ?, percentage_value = ?, start_date = ?, end_date = ?, is_recurrent = ?, period = ?, category_id = ?,
     sync_status = CASE WHEN sync_status = 'synced' THEN 'pending' ELSE sync_status END, updated_at = CURRENT_TIMESTAMP
     WHERE client_id = ?;`,
    [
      next.name,
      next.max_limit,
      next.percentage_value,
      formatApiDate(next.start_date) ?? null,
      formatApiDate(next.end_date) ?? null,
      next.is_recurrent ? 1 : 0,
      next.period,
      next.category_id ?? null,
      clientId,
    ]
  );
  return next;
}

export async function markDeletedLocal(clientId: string): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync(
    "UPDATE budgets SET deleted = 1, sync_status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;",
    [clientId]
  );
}

export async function attachServerId(clientId: string, serverId: number): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync(
    "UPDATE budgets SET id = ?, sync_status = 'synced', updated_at = CURRENT_TIMESTAMP WHERE client_id = ?;",
    [serverId, clientId]
  );
  await db.runAsync('UPDATE expenses SET budget_id = ? WHERE budget_client_id = ?;', [serverId, clientId]);
}

export async function removeSyncedRow(clientId: string): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync('DELETE FROM budgets WHERE client_id = ?;', [clientId]);
}
