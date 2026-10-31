import { act, renderHook } from '@testing-library/react-native';
import { PLAN_STEP, usePlanWizard } from './usePlanWizard';
import { useAccounts } from '@/hooks/useAccounts';
import { useBudgets } from '@/hooks/useBudgets';
import { useRecurrentBudgets } from '@/hooks/useRecurrentBudgets';
import type { BudgetType } from '@/types/BudgetType';

jest.mock('@/hooks/useAccounts');
jest.mock('@/hooks/useBudgets');
jest.mock('@/hooks/useRecurrentBudgets');

const recurrentBudgets = [
  { id: 1, name: 'Renta', icon_code: 'house', color: '#111111' },
  { id: 2, name: 'Ahorro', icon_code: 'piggy', color: '#222222' },
];

const accounts = [
  { id: 1, name: 'BBVA', amount: 8000, type: 'bank', hidden: false },
  { id: 2, name: 'Oculta', amount: 500, type: 'cash', hidden: true },
];

const rentBudget: BudgetType = {
  id: 7,
  name: 'renta',
  max_limit: 100,
  percentage_value: 0,
  is_recurrent: false,
  period: 'monthly',
  category_id: 1,
};

const createBudget = jest.fn();
const updateBudget = jest.fn();
const refreshAccounts = jest.fn();

/** Renders the hook and walks it to the split step with an income of 4,700. */
async function atSplitStep() {
  const hook = await renderHook(() => usePlanWizard());
  await act(async () => { await hook.result.current.next(); });
  await act(async () => { await hook.result.current.next(); });
  await act(async () => { hook.result.current.setIncome(4700); });
  await act(async () => { await hook.result.current.next(); });
  return hook;
}

describe('usePlanWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createBudget.mockImplementation(async (b: BudgetType) => ({ ...b, id: 99 }));
    updateBudget.mockImplementation(async (b: BudgetType) => b);
    (useAccounts as jest.Mock).mockReturnValue({ accounts, refresh: refreshAccounts });
    (useBudgets as jest.Mock).mockReturnValue({ budgets: [rentBudget], createBudget, updateBudget });
    (useRecurrentBudgets as jest.Mock).mockReturnValue({ recurrentBudgets });
  });

  it('counts visible accounts by default and lets the user toggle them', async () => {
    const { result } = await renderHook(() => usePlanWizard());

    expect(refreshAccounts).toHaveBeenCalled();
    expect(result.current.accountsTotal).toBe(8000);

    await act(async () => { result.current.toggleAccount(accounts[1] as never); });
    expect(result.current.accountsTotal).toBe(8500);

    await act(async () => { result.current.toggleAccount(accounts[0] as never); });
    expect(result.current.accountsTotal).toBe(500);
  });

  it('does not leave the income step without an income', async () => {
    const { result } = await renderHook(() => usePlanWizard());
    await act(async () => { await result.current.next(); });
    await act(async () => { await result.current.next(); });
    expect(result.current.step).toBe(PLAN_STEP.income);

    await act(async () => { await result.current.next(); });
    expect(result.current.step).toBe(PLAN_STEP.income);
  });

  it('seeds the split with the suggestion on first arrival', async () => {
    const { result } = await atSplitStep();

    expect(result.current.step).toBe(PLAN_STEP.split);
    expect(result.current.rows).toEqual([
      { recurrent_budget_id: 1, amount: 3000 },
      { recurrent_budget_id: 2, amount: 1700 },
    ]);
    expect(result.current.remaining).toBe(0);
  });

  it('caps a row so the split never exceeds the income', async () => {
    const { result } = await atSplitStep();

    await act(async () => { result.current.setRowAmount(2, 4000); });

    expect(result.current.rows[1].amount).toBe(1700);
  });

  it('updates the budget named like a recurrent budget and creates the others', async () => {
    const { result } = await atSplitStep();

    await act(async () => { await result.current.next(); });

    expect(updateBudget).toHaveBeenCalledTimes(1);
    expect(updateBudget).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, name: 'renta', max_limit: 3000, category_id: 1, is_recurrent: true, period: 'monthly' })
    );
    expect(createBudget).toHaveBeenCalledTimes(1);
    expect(createBudget).toHaveBeenCalledWith(
      expect.objectContaining({ id: null, name: 'Ahorro', max_limit: 1700, is_recurrent: true })
    );
    expect(createBudget.mock.calls[0][0].category_id).toBeUndefined();
    expect(result.current.step).toBe(PLAN_STEP.done);
  });

  it('skips rows without an amount', async () => {
    const { result } = await atSplitStep();
    await act(async () => { result.current.setRowAmount(2, 0); });

    await act(async () => { await result.current.next(); });

    expect(createBudget).not.toHaveBeenCalled();
    expect(updateBudget).toHaveBeenCalledTimes(1);
  });

  it('stays on the split step with an error when a budget fails to save', async () => {
    updateBudget.mockResolvedValue(undefined);
    const { result } = await atSplitStep();

    await act(async () => { await result.current.next(); });

    expect(result.current.step).toBe(PLAN_STEP.split);
    expect(result.current.submitError).toBeTruthy();
    expect(createBudget).not.toHaveBeenCalled();
  });
});
