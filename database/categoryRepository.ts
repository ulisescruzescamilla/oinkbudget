import { CategoryType } from '@/types/CategoryType';
import { getDBConnection } from '.';

/** Returns the cached categories. Read-through cache only — category mutations require connectivity, so there's no offline mutation path. */
export async function getAll(): Promise<CategoryType[]> {
  const db = await getDBConnection();
  return db.getAllAsync<CategoryType>('SELECT id, name, icon_code, color, type FROM categories ORDER BY name ASC;');
}

/**
 * Replaces the cached categories with the server's list in one transaction.
 *
 * Runs on the shared connection (`withTransactionAsync`), not
 * `withExclusiveTransactionAsync`: the exclusive variant opens a second
 * connection, and while it holds the write lock every other write on the shared
 * connection fails with "database is locked" — e.g. the accounts and budgets
 * mirrors that the plan wizard refreshes at the same time.
 *
 * @param categories - Full category list from the API
 */
export async function replaceAllFromServer(categories: CategoryType[]): Promise<void> {
  const db = await getDBConnection();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM categories;');
    for (const category of categories) {
      await db.runAsync('INSERT INTO categories (id, name, icon_code, color, type) VALUES (?,?,?,?,?);', [
        category.id,
        category.name,
        category.icon_code,
        category.color,
        category.type,
      ]);
    }
  });
}

/**
 * Inserts or replaces one cached category with the server's copy.
 *
 * @param category - Category returned by the API
 */
export async function upsertFromServer(category: CategoryType): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync('INSERT OR REPLACE INTO categories (id, name, icon_code, color, type) VALUES (?,?,?,?,?);', [
    category.id,
    category.name,
    category.icon_code,
    category.color,
    category.type,
  ]);
}

/**
 * Removes a category from the cache.
 *
 * @param id - Category identifier
 */
export async function remove(id: number): Promise<void> {
  const db = await getDBConnection();
  await db.runAsync('DELETE FROM categories WHERE id = ?;', [id]);
}
