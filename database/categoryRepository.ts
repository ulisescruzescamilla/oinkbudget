import { CategoryType } from '@/types/CategoryType';
import { getDBConnection } from '.';

/** Read-through cache only — categories aren't created or edited from this app, so there's no offline mutation path. */
export async function getAll(): Promise<CategoryType[]> {
  const db = await getDBConnection();
  return db.getAllAsync<CategoryType>('SELECT id, name, icon_code, color FROM categories ORDER BY name ASC;');
}

export async function replaceAllFromServer(categories: CategoryType[]): Promise<void> {
  const db = await getDBConnection();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync('DELETE FROM categories;');
    for (const category of categories) {
      await tx.runAsync('INSERT INTO categories (id, name, icon_code, color) VALUES (?,?,?,?);', [
        category.id,
        category.name,
        category.icon_code,
        category.color,
      ]);
    }
  });
}
