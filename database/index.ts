import * as SQLite from 'expo-sqlite';
import { generateClientId } from './clientId';

let db: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Lazily opens (once) and returns the shared SQLite connection. Concurrent
 * callers before the first open resolves all await the same in-flight
 * promise — without this, each concurrent call would race past the `!db`
 * check and open its own separate native connection to the same file, which
 * crashes on Android when they prepare statements concurrently.
 */
export const getDBConnection = async () => {
  if (db) return db;
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('database.db');
  }
  db = await dbPromise;
  return db;
};

/**
 * `id` is the server-assigned identifier (null until synced); `client_id` is a
 * locally-generated UUID used as the local primary key and for offline FK
 * relations. `sync_status`/`deleted` back the offline write-queue (see
 * `syncQueueRepository`); a row keeps its `deleted=1` tombstone until its
 * pending 'delete' op is confirmed synced, so it can still be resolved by FK
 * lookups in the meantime.
 */
const TABLE_DDL: Record<string, string> = {
  accounts: `
    CREATE TABLE IF NOT EXISTS accounts (
      client_id TEXT PRIMARY KEY NOT NULL,
      id INTEGER UNIQUE,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      hidden INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      deleted INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_accounts_id ON accounts(id);
  `,
  budgets: `
    CREATE TABLE IF NOT EXISTS budgets (
      client_id TEXT PRIMARY KEY NOT NULL,
      id INTEGER UNIQUE,
      name TEXT NOT NULL,
      max_limit REAL NOT NULL,
      expense_amount REAL NOT NULL DEFAULT 0,
      percentage_value REAL NOT NULL,
      start_date TEXT,
      end_date TEXT,
      is_recurrent INTEGER NOT NULL DEFAULT 0,
      period TEXT NOT NULL DEFAULT 'monthly',
      category_id INTEGER,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      deleted INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_budgets_id ON budgets(id);
  `,
  expenses: `
    CREATE TABLE IF NOT EXISTS expenses (
      client_id TEXT PRIMARY KEY NOT NULL,
      id INTEGER UNIQUE,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      account_id INTEGER,
      account_client_id TEXT NOT NULL,
      budget_id INTEGER,
      budget_client_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      deleted INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_client_id) REFERENCES accounts(client_id) ON DELETE CASCADE,
      FOREIGN KEY (budget_client_id) REFERENCES budgets(client_id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_expenses_account_client ON expenses(account_client_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_budget_client ON expenses(budget_client_id);
  `,
  incomes: `
    CREATE TABLE IF NOT EXISTS incomes (
      client_id TEXT PRIMARY KEY NOT NULL,
      id INTEGER UNIQUE,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      account_id INTEGER,
      account_client_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      deleted INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_client_id) REFERENCES accounts(client_id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_incomes_account_client ON incomes(account_client_id);
  `,
  balances: `
    CREATE TABLE IF NOT EXISTS balances (
      client_id TEXT PRIMARY KEY NOT NULL,
      id INTEGER UNIQUE,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_id INTEGER,
      account_client_id TEXT,
      source_client_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      deleted INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_balances_created_at ON balances(created_at);
    CREATE INDEX IF NOT EXISTS idx_balances_type ON balances(type);
    CREATE INDEX IF NOT EXISTS idx_balances_source_client ON balances(source_client_id);
  `,
};

const CATEGORIES_DDL = `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon_code TEXT NOT NULL,
    color TEXT NOT NULL,
    cached_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

const SYNC_QUEUE_DDL = `
  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    operation TEXT NOT NULL,
    client_id TEXT NOT NULL,
    payload TEXT,
    depends_on TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, created_at);
`;

const LATEST_SCHEMA_VERSION = 3;

async function tableExists(database: SQLite.SQLiteDatabase, name: string): Promise<boolean> {
  const row = await database.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?;",
    [name]
  );
  return !!row;
}

async function hasColumn(database: SQLite.SQLiteDatabase, table: string, column: string): Promise<boolean> {
  const columns = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${table});`);
  return columns.some((c) => c.name === column);
}

async function getSchemaVersion(database: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const row = await database.getFirstAsync<{ value: string }>(
      "SELECT value FROM schema_meta WHERE key = 'schema_version';"
    );
    return row ? Number(row.value) : 0;
  } catch {
    return 0;
  }
}

async function setSchemaVersion(database: SQLite.SQLiteDatabase, version: number): Promise<void> {
  await database.runAsync(
    "INSERT INTO schema_meta (key, value) VALUES ('schema_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;",
    [String(version)]
  );
}

/** Legacy `accounts`/`budgets` row shapes had no `client_id` — build an id→client_id map while migrating them, so dependent tables can resolve their FKs. */
async function migrateAccountsOrBudgets(
  database: SQLite.SQLiteDatabase,
  table: 'accounts' | 'budgets'
): Promise<Map<number, string>> {
  const idMap = new Map<number, string>();
  const exists = await tableExists(database, table);
  if (!exists) {
    await database.execAsync(TABLE_DDL[table]);
    return idMap;
  }
  if (await hasColumn(database, table, 'client_id')) return idMap; // already v1 shape

  const legacyTable = `${table}_legacy_v0`;
  await database.execAsync(`ALTER TABLE ${table} RENAME TO ${legacyTable};`);
  await database.execAsync(TABLE_DDL[table]);

  const legacyRows = await database.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${legacyTable};`);
  for (const row of legacyRows) {
    const clientId = generateClientId();
    try {
      if (table === 'accounts') {
        await database.runAsync(
          'INSERT INTO accounts (client_id, id, name, amount, type, hidden, sync_status) VALUES (?,?,?,?,?,?,?);',
          [clientId, row.id as number, row.name as string, row.amount as number, row.type as string, row.hidden as number, 'synced']
        );
      } else {
        await database.runAsync(
          'INSERT INTO budgets (client_id, id, name, max_limit, expense_amount, percentage_value, sync_status) VALUES (?,?,?,?,?,?,?);',
          [
            clientId,
            row.id as number,
            row.name as string,
            row.max_limit as number,
            (row.expense_amount as number) ?? 0,
            row.percentage_value as number,
            'synced',
          ]
        );
      }
      idMap.set(row.id as number, clientId);
    } catch (error) {
      console.error(`[database] failed to migrate legacy ${table} row`, row, error);
    }
  }
  await database.execAsync(`DROP TABLE ${legacyTable};`);
  return idMap;
}

async function migrateExpenses(
  database: SQLite.SQLiteDatabase,
  accountIdMap: Map<number, string>,
  budgetIdMap: Map<number, string>
): Promise<void> {
  const exists = await tableExists(database, 'expenses');
  if (!exists) {
    await database.execAsync(TABLE_DDL.expenses);
    return;
  }
  if (await hasColumn(database, 'expenses', 'client_id')) return;

  await database.execAsync('ALTER TABLE expenses RENAME TO expenses_legacy_v0;');
  await database.execAsync(TABLE_DDL.expenses);

  const legacyRows = await database.getAllAsync<Record<string, unknown>>('SELECT * FROM expenses_legacy_v0;');
  for (const row of legacyRows) {
    const accountClientId = accountIdMap.get(row.account_id as number);
    const budgetClientId = budgetIdMap.get(row.budget_id as number);
    if (!accountClientId || !budgetClientId) {
      console.error('[database] skipping legacy expense row with unresolvable account/budget', row);
      continue;
    }
    try {
      await database.runAsync(
        'INSERT INTO expenses (client_id, id, amount, description, account_id, account_client_id, budget_id, budget_client_id, created_at, sync_status) VALUES (?,?,?,?,?,?,?,?,?,?);',
        [
          generateClientId(),
          row.id as number,
          row.amount as number,
          row.description as string,
          row.account_id as number,
          accountClientId,
          row.budget_id as number,
          budgetClientId,
          row.created_at as string,
          'synced',
        ]
      );
    } catch (error) {
      console.error('[database] failed to migrate legacy expense row', row, error);
    }
  }
  await database.execAsync('DROP TABLE expenses_legacy_v0;');
}

async function migrateIncomes(database: SQLite.SQLiteDatabase, accountIdMap: Map<number, string>): Promise<void> {
  const exists = await tableExists(database, 'incomes');
  if (!exists) {
    await database.execAsync(TABLE_DDL.incomes);
    return;
  }
  if (await hasColumn(database, 'incomes', 'client_id')) return;

  await database.execAsync('ALTER TABLE incomes RENAME TO incomes_legacy_v0;');
  await database.execAsync(TABLE_DDL.incomes);

  const legacyRows = await database.getAllAsync<Record<string, unknown>>('SELECT * FROM incomes_legacy_v0;');
  for (const row of legacyRows) {
    const accountClientId = accountIdMap.get(row.account_id as number);
    if (!accountClientId) {
      console.error('[database] skipping legacy income row with unresolvable account', row);
      continue;
    }
    try {
      await database.runAsync(
        'INSERT INTO incomes (client_id, id, amount, description, account_id, account_client_id, created_at, sync_status) VALUES (?,?,?,?,?,?,?,?);',
        [
          generateClientId(),
          row.id as number,
          row.amount as number,
          row.description as string,
          row.account_id as number,
          accountClientId,
          row.created_at as string,
          'synced',
        ]
      );
    } catch (error) {
      console.error('[database] failed to migrate legacy income row', row, error);
    }
  }
  await database.execAsync('DROP TABLE incomes_legacy_v0;');
}

async function migrateBalances(database: SQLite.SQLiteDatabase, accountIdMap: Map<number, string>): Promise<void> {
  const exists = await tableExists(database, 'balances');
  if (!exists) {
    await database.execAsync(TABLE_DDL.balances);
    return;
  }
  if (await hasColumn(database, 'balances', 'client_id')) return;

  await database.execAsync('ALTER TABLE balances RENAME TO balances_legacy_v0;');
  await database.execAsync(TABLE_DDL.balances);

  const legacyRows = await database.getAllAsync<Record<string, unknown>>('SELECT * FROM balances_legacy_v0;');
  for (const row of legacyRows) {
    try {
      await database.runAsync(
        'INSERT INTO balances (client_id, id, amount, description, type, account_name, account_client_id, created_at, sync_status) VALUES (?,?,?,?,?,?,?,?,?);',
        [
          generateClientId(),
          row.id as number,
          row.amount as number,
          row.description as string,
          row.type as string,
          row.account_name as string,
          accountIdMap.get(row.account_id as number) ?? null,
          row.created_at as string,
          'synced',
        ]
      );
    } catch (error) {
      console.error('[database] failed to migrate legacy balance row', row, error);
    }
  }
  await database.execAsync('DROP TABLE balances_legacy_v0;');
}

/**
 * Brings the local schema up to v1 (client_id-based offline mirror + sync
 * queue). Every table's migration is wrapped in its own try/catch so a single
 * failure can't block app boot — worst case that table's legacy data is lost
 * but the app still starts with the new-shape table.
 */
async function migrateToV1(database: SQLite.SQLiteDatabase): Promise<void> {
  let accountIdMap = new Map<number, string>();
  let budgetIdMap = new Map<number, string>();

  try {
    accountIdMap = await migrateAccountsOrBudgets(database, 'accounts');
  } catch (error) {
    console.error('[database] accounts migration failed', error);
  }
  try {
    budgetIdMap = await migrateAccountsOrBudgets(database, 'budgets');
  } catch (error) {
    console.error('[database] budgets migration failed', error);
  }
  try {
    await migrateExpenses(database, accountIdMap, budgetIdMap);
  } catch (error) {
    console.error('[database] expenses migration failed', error);
  }
  try {
    await migrateIncomes(database, accountIdMap);
  } catch (error) {
    console.error('[database] incomes migration failed', error);
  }
  try {
    await migrateBalances(database, accountIdMap);
  } catch (error) {
    console.error('[database] balances migration failed', error);
  }
}

/**
 * One-time repair for expenses/incomes created offline against an account or
 * budget that was *already synced* at the time: `createLocal` used to hard-code
 * `account_id`/`budget_id` to NULL and rely on `attachServerId` to backfill them,
 * but that only fires for a dependency that was itself pending — so these rows
 * were stuck with a null link id forever, and their queued 'create' synced a
 * bogus `account_id: 0`/`budget_id: 0` to the API until it hit MAX_ATTEMPTS and
 * was marked 'failed'. Backfills the now-resolvable id and gives those queue
 * items a fresh retry budget.
 */
async function backfillLinkedServerIds(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    UPDATE expenses SET account_id = (SELECT id FROM accounts WHERE accounts.client_id = expenses.account_client_id)
    WHERE account_id IS NULL AND account_client_id IN (SELECT client_id FROM accounts WHERE id IS NOT NULL);

    UPDATE expenses SET budget_id = (SELECT id FROM budgets WHERE budgets.client_id = expenses.budget_client_id)
    WHERE budget_id IS NULL AND budget_client_id IN (SELECT client_id FROM budgets WHERE id IS NOT NULL);

    UPDATE incomes SET account_id = (SELECT id FROM accounts WHERE accounts.client_id = incomes.account_client_id)
    WHERE account_id IS NULL AND account_client_id IN (SELECT client_id FROM accounts WHERE id IS NOT NULL);

    UPDATE sync_queue SET status = 'pending', attempts = 0, last_error = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE status = 'failed' AND operation = 'create' AND entity_type IN ('expense', 'income');
  `);
}

/**
 * `balances` rows created offline (`appendMirrorRow`) had no link back to the
 * expense/income that produced them, so once that expense/income synced,
 * nothing ever removed the local pending mirror row — the next server refresh
 * (`replaceAllFromServer`, matched only by `id`) inserted the now-synced
 * balance as a brand-new row alongside the orphaned one, doubling it up in
 * History. Adds the missing link column (`source_client_id`, populated by
 * `appendMirrorRow`/consumed by `balanceRepository.removeBySourceClientId`
 * going forward) and, one time, removes already-orphaned pending rows that
 * predate this column (`source_client_id IS NULL`) by matching them against
 * their now-synced counterpart.
 */
async function migrateBalancesV3(database: SQLite.SQLiteDatabase): Promise<void> {
  if (!(await hasColumn(database, 'balances', 'source_client_id'))) {
    await database.execAsync('ALTER TABLE balances ADD COLUMN source_client_id TEXT;');
    await database.execAsync('CREATE INDEX IF NOT EXISTS idx_balances_source_client ON balances(source_client_id);');
  }

  await database.execAsync(`
    DELETE FROM balances
    WHERE sync_status = 'pending' AND id IS NULL AND source_client_id IS NULL
    AND EXISTS (
      SELECT 1 FROM balances synced
      WHERE synced.sync_status = 'synced'
        AND synced.client_id != balances.client_id
        AND synced.account_client_id = balances.account_client_id
        AND synced.amount = balances.amount
        AND synced.description = balances.description
        AND synced.type = balances.type
    );
  `);
}

export const initDatabase = async () => {
  const database = await getDBConnection();
  await database.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await database.execAsync('CREATE TABLE IF NOT EXISTS schema_meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);');
  // No legacy shape for these — safe to create unconditionally every launch.
  await database.execAsync(CATEGORIES_DDL);
  await database.execAsync(SYNC_QUEUE_DDL);

  const version = await getSchemaVersion(database);
  if (version < 1) {
    await migrateToV1(database);
  }
  if (version < 2) {
    try {
      await backfillLinkedServerIds(database);
    } catch (error) {
      console.error('[database] backfillLinkedServerIds failed', error);
    }
  }
  if (version < 3) {
    try {
      await migrateBalancesV3(database);
    } catch (error) {
      console.error('[database] migrateBalancesV3 failed', error);
    }
  }
  if (version < LATEST_SCHEMA_VERSION) {
    await setSchemaVersion(database, LATEST_SCHEMA_VERSION);
  }
};
