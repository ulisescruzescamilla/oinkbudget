import * as SQLite from 'expo-sqlite'

let db: SQLite.SQLiteDatabase | null = null;

export const getDBConnection = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync("database.db")
  }

  return db;
}

export const initDatabase = async () => {
  const db = await getDBConnection()
  // `execAsync()` is useful for bulk queries when you want to execute altogether.
  // Note that `execAsync()` does not escape parameters and may lead to SQL injection.
  await db.execAsync(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  max_limit REAL NOT NULL,
  expense_amount REAL NOT NULL,
  percentage_value REAL NOT NULL,
  color TEXT NOT NULL,
  account_id INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY NOT NULL,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  budget_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (budget_id) REFERENCES budgets(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
  );

  `)
}

export const testDB = async() => {
  const db = await getDBConnection()

  try {
  
    const result = await db.getAllSync(
      `SELECT * 
      FROM budgets;`
    );

  console.debug(result)
  } catch (error) {
    console.error(error)
  }

}