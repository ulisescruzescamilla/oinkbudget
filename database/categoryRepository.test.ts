import { getDBConnection } from '.';
import { replaceAllFromServer } from './categoryRepository';

jest.mock('.', () => ({ getDBConnection: jest.fn() }));

describe('categoryRepository.replaceAllFromServer', () => {
  it('rewrites the cache inside a transaction on the shared connection', async () => {
    const db = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
      withExclusiveTransactionAsync: jest.fn(),
    };
    (getDBConnection as jest.Mock).mockResolvedValue(db);

    await replaceAllFromServer([
      { id: 1, name: 'Renta', icon_code: 'house', color: '#111111', type: 'expense' },
      { id: 2, name: 'Salario', icon_code: 'briefcase', color: '#222222', type: 'income' },
    ]);

    // The exclusive variant opens a second connection that locks out
    // concurrent writes ("database is locked").
    expect(db.withExclusiveTransactionAsync).not.toHaveBeenCalled();
    expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(db.runAsync.mock.calls.map((c) => c[0])).toEqual([
      'DELETE FROM categories;',
      'INSERT INTO categories (id, name, icon_code, color, type) VALUES (?,?,?,?,?);',
      'INSERT INTO categories (id, name, icon_code, color, type) VALUES (?,?,?,?,?);',
    ]);
    expect(db.runAsync).toHaveBeenLastCalledWith(expect.any(String), [2, 'Salario', 'briefcase', '#222222', 'income']);
  });
});
