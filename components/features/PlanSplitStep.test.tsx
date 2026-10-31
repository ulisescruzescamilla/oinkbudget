import { render, screen, fireEvent } from '@testing-library/react-native';
import { PlanSplitStep, type PlanSplitStepProps } from './PlanSplitStep';
import type { RecurrentBudgetType } from '@/types/RecurrentBudgetType';

const recurrentBudgets: RecurrentBudgetType[] = [
  { id: 1, name: 'Renta', icon_code: 'house', color: '#111111' },
  { id: 2, name: 'Ahorro', icon_code: 'piggy', color: '#222222' },
  { id: 3, name: 'Ocio', icon_code: 'film', color: '#333333' },
];

const props = (overrides: Partial<PlanSplitStepProps> = {}): PlanSplitStepProps => ({
  income: 10000,
  rows: [
    { recurrent_budget_id: 1, amount: 6000 },
    { recurrent_budget_id: 2, amount: 1500 },
  ],
  recurrentBudgets,
  mode: 'amt',
  onModeChange: jest.fn(),
  onRowChange: jest.fn(),
  onRemoveRow: jest.fn(),
  onAddRow: jest.fn(),
  onSuggest: jest.fn(),
  onClear: jest.fn(),
  ...overrides,
});

describe('PlanSplitStep', () => {
  it('summarizes what is assigned and what is left', async () => {
    await render(<PlanSplitStep {...props()} />);

    expect(screen.getByText('$10,000')).toBeTruthy();
    expect(screen.getByText('$7,500 · 75%')).toBeTruthy();
    expect(screen.getByText('$2,500')).toBeTruthy();
  });

  it('shows each row as an amount with its share, or the reverse in percent mode', async () => {
    const view = await render(<PlanSplitStep {...props()} />);
    expect(screen.getByText(/^\$6,000/)).toBeTruthy();

    await view.rerender(<PlanSplitStep {...props({ mode: 'pct' })} />);
    expect(screen.getByText(/^60%/)).toBeTruthy();
  });

  it('offers a chip only for recurrent budgets not in the split yet', async () => {
    const p = props();
    await render(<PlanSplitStep {...p} />);

    expect(screen.getByText('Agregar presupuesto recurrente')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Renta' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Ocio' }));
    expect(p.onAddRow).toHaveBeenCalledWith(3);
  });

  it('hides the add section when every recurrent budget is in the split', async () => {
    const rows = recurrentBudgets.map((r) => ({ recurrent_budget_id: r.id, amount: 1000 }));
    await render(<PlanSplitStep {...props({ rows })} />);

    expect(screen.queryByText('Agregar presupuesto recurrente')).toBeNull();
  });

  it('offers a retry when no recurrent budgets could be loaded', async () => {
    const onRetryRecurrentBudgets = jest.fn();
    await render(<PlanSplitStep {...props({ rows: [], recurrentBudgets: [], onRetryRecurrentBudgets })} />);

    expect(screen.getByText('No se pudieron cargar los presupuestos recurrentes.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Reintentar'));
    expect(onRetryRecurrentBudgets).toHaveBeenCalledTimes(1);
  });

  it('removes a row and triggers the template actions', async () => {
    const p = props();
    await render(<PlanSplitStep {...p} />);

    await fireEvent.press(screen.getByLabelText('Quitar Ahorro'));
    expect(p.onRemoveRow).toHaveBeenCalledWith(2);

    await fireEvent.press(screen.getByText('Sugerir reparto'));
    await fireEvent.press(screen.getByText('Vaciar reparto'));
    expect(p.onSuggest).toHaveBeenCalledTimes(1);
    expect(p.onClear).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state when there are no rows', async () => {
    await render(<PlanSplitStep {...props({ rows: [] })} />);

    expect(screen.getByText('Agrega presupuestos recurrentes para repartir tu ingreso.')).toBeTruthy();
  });
});
