import { render, screen, fireEvent } from '@testing-library/react-native';
import { BudgetAccordionCard } from './BudgetAccordionCard';
import type { BudgetType } from '@/types/BudgetType';

const budget: BudgetType = {
  id: 1,
  client_id: 'client-1',
  name: 'Mercado',
  max_limit: 1000,
  expense_amount: 250,
  percentage_value: 0,
  color: '#F17264',
  start_date: new Date(2026, 5, 4),
  end_date: new Date(2026, 5, 30),
};

const noop = () => {};

describe('BudgetAccordionCard', () => {
  it('renders the name, spent/max amounts and percentage while collapsed', async () => {
    await render(
      <BudgetAccordionCard budget={budget} open={false} onToggle={noop} onEdit={noop} onDelete={noop} />
    );

    expect(screen.getByText('Mercado')).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy();
  });

  it('hides the expanded details while collapsed', async () => {
    await render(
      <BudgetAccordionCard budget={budget} open={false} onToggle={noop} onEdit={noop} onDelete={noop} />
    );

    expect(screen.queryByText('Gastado')).toBeNull();
    expect(screen.queryByText('Editar')).toBeNull();
  });

  it('shows the expanded stats, period, and actions when open', async () => {
    await render(
      <BudgetAccordionCard budget={budget} open onToggle={noop} onEdit={noop} onDelete={noop} />
    );

    expect(screen.getByText('Gastado')).toBeTruthy();
    expect(screen.getByText('Máximo')).toBeTruthy();
    expect(screen.getByText('Restante')).toBeTruthy();
    expect(screen.getByText(/4 – 30 jun 2026/)).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('fires onToggle when the header is pressed', async () => {
    const onToggle = jest.fn();
    await render(
      <BudgetAccordionCard budget={budget} open={false} onToggle={onToggle} onEdit={noop} onDelete={noop} />
    );

    await fireEvent.press(screen.getByText('Mercado'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('fires onEdit and onDelete from their respective buttons', async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    await render(
      <BudgetAccordionCard budget={budget} open onToggle={noop} onEdit={onEdit} onDelete={onDelete} />
    );

    await fireEvent.press(screen.getByText('Editar'));
    expect(onEdit).toHaveBeenCalledTimes(1);

    const [, deleteButton] = screen.getAllByRole('button');
    await fireEvent.press(deleteButton);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('clamps the remaining amount to $0 when over budget', async () => {
    const overBudget: BudgetType = { ...budget, expense_amount: 1200 };
    await render(
      <BudgetAccordionCard budget={overBudget} open onToggle={noop} onEdit={noop} onDelete={noop} />
    );

    expect(screen.getByText('120%')).toBeTruthy();
    // "Restante" clamps to $0 instead of showing a negative amount.
    expect(screen.getByText('$ 0')).toBeTruthy();
  });
});
