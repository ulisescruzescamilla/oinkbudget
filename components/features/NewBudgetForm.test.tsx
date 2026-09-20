import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NewBudgetForm } from './NewBudgetForm';
import type { BudgetType } from '@/types/BudgetType';
import { useCategories } from '@/hooks/useCategories';

jest.mock('@gorhom/bottom-sheet', () => {
  const { TextInput } = require('react-native');
  return { BottomSheetTextInput: TextInput };
});
jest.mock('@/hooks/useCategories');

const mockUseCategories = useCategories as jest.Mock;

const categories = [
  { id: 1, name: 'Comida', icon_code: 'food', color: '#F17264' },
  { id: 2, name: 'Transporte', icon_code: 'car', color: '#1289E7' },
];

describe('NewBudgetForm', () => {
  beforeEach(() => {
    mockUseCategories.mockReturnValue({ categories, loading: false, error: null, refresh: jest.fn() });
  });

  it('renders empty with the "create" label when no budget is given', async () => {
    await render(<NewBudgetForm onSubmit={jest.fn()} onDone={jest.fn()} fieldErrors={null} />);

    expect(screen.getByText('Crear presupuesto')).toBeTruthy();
    expect(screen.getByPlaceholderText('Ej. Mercado').props.value).toBe('');
  });

  it('pre-fills fields and shows the "save" label when editing a budget', async () => {
    const budget: BudgetType = {
      id: 1,
      client_id: 'client-1',
      name: 'Mercado',
      max_limit: 1500,
      expense_amount: 0,
      percentage_value: 0,
      start_date: new Date(2026, 5, 1),
      end_date: new Date(2026, 5, 30),
      is_recurrent: false,
      period: 'monthly',
      category_id: 1,
    };
    await render(<NewBudgetForm budget={budget} onSubmit={jest.fn()} onDone={jest.fn()} fieldErrors={null} />);

    expect(screen.getByDisplayValue('Mercado')).toBeTruthy();
    expect(screen.getByDisplayValue('1500')).toBeTruthy();
    expect(screen.getByText('Guardar cambios')).toBeTruthy();
  });

  it('renders a chip per category and lets the user pick one', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ id: 1 });
    await render(<NewBudgetForm onSubmit={onSubmit} onDone={jest.fn()} fieldErrors={null} />);

    expect(screen.getByText('Comida')).toBeTruthy();
    expect(screen.getByText('Transporte')).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Mercado'), 'Super');
    await fireEvent.changeText(screen.getByPlaceholderText('$0.00'), '800');
    await fireEvent.press(screen.getByText('Transporte'));
    await fireEvent.press(screen.getByText('Crear presupuesto'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Super', max_limit: 800, category_id: 2 }))
    );
  });

  it('renders no category section when there are no categories', async () => {
    mockUseCategories.mockReturnValue({ categories: [], loading: false, error: null, refresh: jest.fn() });
    await render(<NewBudgetForm onSubmit={jest.fn()} onDone={jest.fn()} fieldErrors={null} />);

    expect(screen.queryByText('Categoría')).toBeNull();
  });

  it('defaults to the current month range and shows "Mensual" when not recurrent', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ id: 1 });
    await render(<NewBudgetForm onSubmit={onSubmit} onDone={jest.fn()} fieldErrors={null} />);

    expect(screen.getByText('Mensual')).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Mercado'), 'Super');
    await fireEvent.press(screen.getByText('Crear presupuesto'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    const now = new Date();
    expect(payload.start_date).toEqual(new Date(now.getFullYear(), now.getMonth(), 1));
    expect(payload.end_date).toEqual(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  });

  it('shows period options once marked recurrent, and submits the chosen period', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ id: 1 });
    await render(<NewBudgetForm onSubmit={onSubmit} onDone={jest.fn()} fieldErrors={null} />);

    await fireEvent.press(screen.getByRole('switch'));
    expect(screen.getByText('Semanal')).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Mercado'), 'Super');
    await fireEvent.press(screen.getByText('Semanal'));
    await fireEvent.press(screen.getByText('Crear presupuesto'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ is_recurrent: true, period: 'weekly' }))
    );
  });

  it('renders the field error for max_limit', async () => {
    await render(
      <NewBudgetForm
        onSubmit={jest.fn()}
        onDone={jest.fn()}
        fieldErrors={{ max_limit: ['El monto máximo es requerido'] }}
      />
    );

    expect(screen.getByText('El monto máximo es requerido')).toBeTruthy();
  });
});
