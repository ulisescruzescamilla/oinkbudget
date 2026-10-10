import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NewAccountForm } from './NewAccountForm';
import type { AccountType } from '@/types/AccountType';

// `ModalField`'s `Input` renders `BottomSheetTextInput`, which needs a real bottom-sheet
// context (`useBottomSheetInternal`) to mount. Outside an actual sheet (as in a unit test)
// it throws, so it's swapped for a plain `TextInput` here.
jest.mock('@gorhom/bottom-sheet', () => {
  const { TextInput } = require('react-native');
  return { BottomSheetTextInput: TextInput };
});

describe('NewAccountForm', () => {
  it('renders empty with the "create" label when no account is given', async () => {
    await render(<NewAccountForm onSubmit={jest.fn()} onDone={jest.fn()} fieldErrors={null} />);

    expect(screen.getByText('Crear cuenta')).toBeTruthy();
    expect(screen.getByPlaceholderText('Ej. BBVA').props.value).toBe('');
  });

  it('pre-fills fields and shows the "save" label when editing an account', async () => {
    const account: AccountType = {
      id: 5,
      client_id: 'client-5',
      name: 'BBVA',
      amount: 1200,
      type: 'debit_card',
      hidden: false,
    };
    await render(<NewAccountForm account={account} onSubmit={jest.fn()} onDone={jest.fn()} fieldErrors={null} />);

    expect(screen.getByDisplayValue('BBVA')).toBeTruthy();
    expect(screen.getByDisplayValue('1200')).toBeTruthy();
    expect(screen.getByText('Guardar cambios')).toBeTruthy();
  });

  it('submits the entered name, amount and selected type', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ id: 1 });
    const onDone = jest.fn();
    await render(<NewAccountForm onSubmit={onSubmit} onDone={onDone} fieldErrors={null} />);

    await fireEvent.changeText(screen.getByPlaceholderText('Ej. BBVA'), 'Efectivo diario');
    await fireEvent.changeText(screen.getByPlaceholderText('$0.00'), '250.50');
    await fireEvent.press(screen.getByText('Crédito'));
    await fireEvent.press(screen.getByText('Crear cuenta'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      id: null,
      name: 'Efectivo diario',
      amount: 250.5,
      type: 'credit_card',
      hidden: false,
    }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('does not call onDone when the submission fails (onSubmit resolves undefined)', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onDone = jest.fn();
    await render(<NewAccountForm onSubmit={onSubmit} onDone={onDone} fieldErrors={null} />);

    await fireEvent.press(screen.getByText('Crear cuenta'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onDone).not.toHaveBeenCalled();
  });

  it('toggles the hidden switch', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ id: 1 });
    await render(<NewAccountForm onSubmit={onSubmit} onDone={jest.fn()} fieldErrors={null} />);

    await fireEvent.press(screen.getByRole('switch'));
    await fireEvent.press(screen.getByText('Crear cuenta'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ hidden: true }))
    );
  });

  it('renders the field error for name', async () => {
    await render(
      <NewAccountForm
        onSubmit={jest.fn()}
        onDone={jest.fn()}
        fieldErrors={{ name: ['El nombre es requerido'] }}
      />
    );

    expect(screen.getByText('El nombre es requerido')).toBeTruthy();
  });

  it('renders the field error for type', async () => {
    await render(
      <NewAccountForm
        onSubmit={jest.fn()}
        onDone={jest.fn()}
        fieldErrors={{ type: ['El tipo seleccionado es inválido'] }}
      />
    );

    expect(screen.getByText('El tipo seleccionado es inválido')).toBeTruthy();
  });

  it.each([
    ['Inversión', 'investment'],
    ['Banco', 'bank'],
  ])('submits the "%s" chip as type "%s"', async (label, type) => {
    const onSubmit = jest.fn().mockResolvedValue({ id: 1 });
    await render(<NewAccountForm onSubmit={onSubmit} onDone={jest.fn()} fieldErrors={null} />);

    await fireEvent.press(screen.getByText(label));
    await fireEvent.press(screen.getByText('Crear cuenta'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ type })));
  });

  it('shows the general error message only after a failed submit', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    await render(
      <NewAccountForm onSubmit={onSubmit} onDone={jest.fn()} fieldErrors={null} errorMessage="Error del servidor" />
    );

    expect(screen.queryByText('Error del servidor')).toBeNull();

    await fireEvent.press(screen.getByText('Crear cuenta'));

    await waitFor(() => expect(screen.getByText('Error del servidor')).toBeTruthy());
  });

  it('shows the general error message when the 422 is keyed on a field the form does not render', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    await render(
      <NewAccountForm
        onSubmit={onSubmit}
        onDone={jest.fn()}
        fieldErrors={{ hidden: ['El campo es inválido'] }}
        errorMessage="Los datos son inválidos"
      />
    );

    await fireEvent.press(screen.getByText('Crear cuenta'));

    await waitFor(() => expect(screen.getByText('Los datos son inválidos')).toBeTruthy());
  });

  it('hides the general error message when a field error is already shown', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    await render(
      <NewAccountForm
        onSubmit={onSubmit}
        onDone={jest.fn()}
        fieldErrors={{ type: ['El tipo seleccionado es inválido'] }}
        errorMessage="Los datos son inválidos"
      />
    );

    await fireEvent.press(screen.getByText('Crear cuenta'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(screen.getByText('El tipo seleccionado es inválido')).toBeTruthy();
    expect(screen.queryByText('Los datos son inválidos')).toBeNull();
  });

  it('shows a spinner and hides the label while loading', async () => {
    await render(<NewAccountForm onSubmit={jest.fn()} onDone={jest.fn()} fieldErrors={null} loading />);
    expect(screen.queryByText('Crear cuenta')).toBeNull();
  });
});
