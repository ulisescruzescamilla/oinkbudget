import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QuickAddForm } from './QuickAddForm';
import type { AccountType } from '@/types/AccountType';
import type { BudgetType } from '@/types/BudgetType';
import type { CategoryType } from '@/types/CategoryType';

// The pickers' sheet and its bottom-sheet internals need a native host, so they're plain views here.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@gorhom/bottom-sheet', () => {
  const { ScrollView, TextInput } = require('react-native');
  return { BottomSheetTextInput: TextInput, BottomSheetScrollView: ScrollView };
});
jest.mock('@/components/ui/Sheet', () => ({
  // Like the real sheet, reports the dismissal once it has been told to close.
  Sheet: ({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) => {
    const { useEffect, useRef } = require('react');
    const wasOpen = useRef(false);
    useEffect(() => {
      if (wasOpen.current && !open) onClose();
      wasOpen.current = open;
    }, [open]);
    return open ? children : null;
  },
}));
jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: jest.fn(() => null), setItemSync: jest.fn() },
}));

const bbva: AccountType = { id: 1, name: 'BBVA', amount: 1000, type: 'debit_card', hidden: false };
const cash: AccountType = { id: 2, name: 'Efectivo', amount: 200, type: 'cash', hidden: false };
const food = { id: 10, name: 'Comida', max_limit: 500, expense_amount: 0 } as BudgetType;
const fun = { id: 11, name: 'Ocio', max_limit: 300, expense_amount: 0 } as BudgetType;

const market: CategoryType = { id: 20, name: 'Mercado', icon_code: 'cart', color: '#8C6DE2', type: 'expense' };
const transport: CategoryType = { id: 21, name: 'Transporte', icon_code: 'car', color: '#1289E7', type: 'expense' };
const salary: CategoryType = { id: 30, name: 'Salario', icon_code: 'bank', color: '#00B894', type: 'income' };
const categories = [market, transport, salary];

const setup = (props: Partial<React.ComponentProps<typeof QuickAddForm>> = {}) =>
  render(
    <QuickAddForm
      accounts={[bbva, cash]}
      budgets={[food, fun]}
      categories={categories}
      onSubmit={jest.fn().mockResolvedValue(true)}
      onSaved={jest.fn()}
      {...props}
    />
  );

/** Presses keypad keys in order (`del` is the backspace key). */
const type = async (...keys: string[]) => {
  for (const k of keys) {
    await fireEvent.press(screen.getByLabelText(k === 'del' ? 'Borrar' : k));
  }
};

describe('QuickAddForm', () => {
  it('builds the amount from the keypad, capping decimals at two and supporting delete', async () => {
    await setup();

    await type('1', '2', '.', '5', '0', '9');
    expect(screen.getByText(/Guardar gasto · \$12\.50$/)).toBeTruthy();

    await type('del', 'del', 'del', 'del', 'del');
    expect(screen.getByText(/Guardar gasto · \$ ?0$/)).toBeTruthy();
  });

  it('keeps save disabled until there is an amount and a description', async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    await setup({ onSubmit });

    await fireEvent.press(screen.getByText(/Guardar gasto/));
    expect(onSubmit).not.toHaveBeenCalled();

    await type('5');
    await fireEvent.press(screen.getByText(/Guardar gasto/));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits an expense with the chosen account and budget, then confirms and calls onSaved', async () => {
    jest.useFakeTimers();
    const onSubmit = jest.fn().mockResolvedValue(true);
    const onSaved = jest.fn();
    await setup({ onSubmit, onSaved });

    await type('4', '5');
    await fireEvent.press(screen.getByText('Ocio'));
    await fireEvent.press(screen.getByText('Efectivo'));
    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Café, súper…'), 'Cine');
    await fireEvent.press(screen.getByText(/Guardar gasto/));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      type: 'expense',
      amount: 45,
      description: 'Cine',
      account: cash,
      budget: fun,
    });
    expect(await screen.findByText('Gasto guardado')).toBeTruthy();

    expect(onSaved).not.toHaveBeenCalled();
    jest.advanceTimersByTime(900);
    expect(onSaved).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('hides the budget picker for income and submits without a budget', async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    await setup({ onSubmit });

    await fireEvent.press(screen.getByText('Ingreso'));
    expect(screen.queryByText('Presupuesto')).toBeNull();

    await type('9');
    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Nómina, freelance…'), 'Nómina');
    await fireEvent.press(screen.getByText(/Guardar ingreso/));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ type: 'income', amount: 9, account: bbva });
    expect(onSubmit.mock.calls[0][0].budget).toBeUndefined();
  });

  it('opens in the given mode', async () => {
    await setup({ mode: 'income' });

    expect(screen.getByText(/Guardar ingreso/)).toBeTruthy();
    expect(screen.queryByText('Presupuesto')).toBeNull();
  });

  it('stays on the form and shows server field errors when the save fails', async () => {
    const onSubmit = jest.fn().mockResolvedValue(false);
    const onSaved = jest.fn();
    const view = await setup({ onSubmit, onSaved });

    await type('7');
    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Café, súper…'), 'Café');
    await fireEvent.press(screen.getByText(/Guardar gasto/));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    await view.rerender(
      <QuickAddForm
        accounts={[bbva, cash]}
        budgets={[food, fun]}
        categories={categories}
        onSubmit={onSubmit}
        onSaved={onSaved}
        serverFieldErrors={{ description: ['La descripción es demasiado larga'] }}
      />
    );

    expect(screen.getByText('La descripción es demasiado larga')).toBeTruthy();
    expect(screen.queryByText('Gasto guardado')).toBeNull();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('preselects the first account and budget once the lists load', async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    const view = await setup({ accounts: [], budgets: [], onSubmit });
    expect(screen.getByText('No existen cuentas, por favor genere uno.')).toBeTruthy();

    await view.rerender(
      <QuickAddForm accounts={[bbva, cash]} budgets={[food, fun]} categories={categories} onSubmit={onSubmit} onSaved={jest.fn()} />
    );
    await type('3');
    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Café, súper…'), 'Pan');
    await fireEvent.press(screen.getByText(/Guardar gasto/));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ account: bbva, budget: food });
  });

  it('prefills an edited movement, hides the type switch and submits the changes', async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    await setup({
      onSubmit,
      editing: true,
      initial: { amount: 45.5, description: 'Cine', accountId: 2, budgetId: 11, categoryId: 21 },
    });

    expect(screen.queryByText('Ingreso')).toBeNull();
    expect(screen.getByDisplayValue('Cine')).toBeTruthy();

    await type('del', '9');
    await fireEvent.press(screen.getByText(/Guardar cambios · \$45\.90$/));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'expense', amount: 45.9, description: 'Cine', account: cash, budget: fun, categoryId: 21 })
      )
    );
  });

  it('keeps an edited movement uncategorized when it has no category', async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    await setup({
      onSubmit,
      editing: true,
      initial: { amount: 10, description: 'Cine', accountId: 1, budgetId: 10, categoryId: null },
    });

    await fireEvent.press(screen.getByText(/Guardar cambios/));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ categoryId: null })));
  });

  it('preselects the first category of the type and resets it when switching type', async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    await setup({ onSubmit });

    expect(screen.queryByText('Salario')).toBeNull();
    await fireEvent.press(screen.getByText('Ingreso'));
    expect(screen.queryByText('Mercado')).toBeNull();

    await type('9');
    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Nómina, freelance…'), 'Nómina');
    await fireEvent.press(screen.getByText(/Guardar ingreso/));

    await waitFor(() => expect(onSubmit.mock.calls[0][0]).toMatchObject({ type: 'income', categoryId: 30 }));
  });

  it('selects a category created from the picker', async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    const created: CategoryType = { ...market, id: 22, name: 'Mascotas' };
    const onNewCategory = jest.fn();
    await setup({ onSubmit, onNewCategory });

    await fireEvent.press(screen.getAllByLabelText('Ver todas')[0]);
    await fireEvent.press(screen.getByText('Nueva categoría'));
    expect(onNewCategory).toHaveBeenCalledWith('expense', expect.any(Function));

    await act(async () => onNewCategory.mock.calls[0][1](created));
    await type('5');
    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Café, súper…'), 'Croquetas');
    await fireEvent.press(screen.getByText(/Guardar gasto/));

    await waitFor(() => expect(onSubmit.mock.calls[0][0]).toMatchObject({ categoryId: 22 }));
  });
});
