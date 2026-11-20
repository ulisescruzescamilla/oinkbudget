import { withSerialTransaction } from '.';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

/** Fake connection that, like SQLite, rejects a BEGIN while a transaction is open. */
const makeDb = () => {
  let open = false;
  return {
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => {
      if (open) throw new Error('cannot start a transaction within a transaction');
      open = true;
      try {
        await task();
      } finally {
        open = false;
      }
    }),
  };
};

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('withSerialTransaction', () => {
  it('runs overlapping transactions one after the other', async () => {
    const db = makeDb();
    const order: string[] = [];
    const task = (name: string) => async () => {
      order.push(`${name}:start`);
      await tick();
      order.push(`${name}:end`);
    };

    await Promise.all([
      withSerialTransaction(db as never, task('a')),
      withSerialTransaction(db as never, task('b')),
    ]);

    expect(order).toEqual(['a:start', 'a:end', 'b:start', 'b:end']);
  });

  it('keeps the queue going after a failed transaction', async () => {
    const db = makeDb();
    const failing = withSerialTransaction(db as never, async () => {
      throw new Error('boom');
    });
    const next = jest.fn(async () => {});

    await expect(failing).rejects.toThrow('boom');
    await withSerialTransaction(db as never, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
