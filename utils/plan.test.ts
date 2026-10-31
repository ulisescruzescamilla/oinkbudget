import { clampRowAmount, suggestSplit } from './plan';
import type { RecurrentBudgetType } from '@/types/RecurrentBudgetType';

const recurrentBudget = (id: number, name: string): RecurrentBudgetType => ({ id, name, icon_code: 'star', color: '#000000' });

describe('suggestSplit', () => {
  it('splits the income by the template weights when every recurrent budget exists', () => {
    const recurrentBudgets = ['Renta', 'Mercado', 'Servicios', 'Transporte', 'Restaurantes', 'Ocio', 'Ahorro'].map((n, i) =>
      recurrentBudget(i + 1, n)
    );

    const rows = suggestSplit(20000, recurrentBudgets);

    expect(rows).toEqual([
      { recurrent_budget_id: 1, amount: 6000 },
      { recurrent_budget_id: 2, amount: 3600 },
      { recurrent_budget_id: 3, amount: 1600 },
      { recurrent_budget_id: 4, amount: 1800 },
      { recurrent_budget_id: 5, amount: 2000 },
      { recurrent_budget_id: 6, amount: 1600 },
      { recurrent_budget_id: 7, amount: 3400 },
    ]);
  });

  it('matches names ignoring case and rescales the weights of the recurrent budgets that exist', () => {
    // Renta (30) + Ahorro (17) → 30/47 and 17/47 of the income.
    const rows = suggestSplit(4700, [recurrentBudget(9, 'ahorro'), recurrentBudget(4, ' RENTA '), recurrentBudget(5, 'Mascotas')]);

    expect(rows).toEqual([
      { recurrent_budget_id: 4, amount: 3000 },
      { recurrent_budget_id: 9, amount: 1700 },
    ]);
  });

  it('assigns the whole income even when the shares do not divide evenly', () => {
    const rows = suggestSplit(1000, [recurrentBudget(1, 'Renta'), recurrentBudget(2, 'Mercado'), recurrentBudget(3, 'Ocio')]);

    expect(rows.reduce((sum, r) => sum + r.amount, 0)).toBe(1000);
  });

  it('returns no rows when no recurrent budget matches the template', () => {
    expect(suggestSplit(5000, [recurrentBudget(1, 'Mascotas')])).toEqual([]);
    expect(suggestSplit(5000, [])).toEqual([]);
  });
});

describe('clampRowAmount', () => {
  const rows = [
    { recurrent_budget_id: 1, amount: 600 },
    { recurrent_budget_id: 2, amount: 300 },
  ];

  it('keeps a value that fits in the income', () => {
    expect(clampRowAmount(rows, 2, 400, 1000)).toBe(400);
  });

  it('caps a value at what the other rows leave free', () => {
    expect(clampRowAmount(rows, 2, 900, 1000)).toBe(400);
  });

  it('never goes below zero', () => {
    expect(clampRowAmount(rows, 2, -50, 1000)).toBe(0);
    expect(clampRowAmount(rows, 2, 100, 500)).toBe(0);
  });
});
