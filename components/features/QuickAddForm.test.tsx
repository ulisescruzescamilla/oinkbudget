import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QuickAddForm } from './QuickAddForm';
import type { AccountType } from '@/types/AccountType';
import type { BudgetType } from '@/types/BudgetType';

const bbva: AccountType = { id: 1, name: 'BBVA', amount: 1000, type: 'debit_card', hidden: false };
const cash: AccountType = { id: 2, name: 'Efectivo', amount: 200, type: 'cash', hidden: false };
const food = { id: 10, name: 'Comida', max_limit: 500, expense_amount: 0 } as BudgetType;
const fun = { id: 11, name: 'Ocio', max_limit: 300, expense_amount: 0 } as BudgetType;

const setup = (props: Partial<React.ComponentProps<typeof QuickAddForm>> = {}) =>
  render(
    <QuickAddForm
      accounts={[bbva, cash]}
      budgets={[food, fun]}
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
      <QuickAddForm accounts={[bbva, cash]} budgets={[food, fun]} onSubmit={onSubmit} onSaved={jest.fn()} />
    );
    await type('3');
    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Café, súper…'), 'Pan');
    await fireEvent.press(screen.getByText(/Guardar gasto/));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ account: bbva, budget: food });
  });
});
