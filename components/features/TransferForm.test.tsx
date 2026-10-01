import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { TransferForm } from './TransferForm';
import type { AccountType } from '@/types/AccountType';

// `ModalField`'s `Input` renders `BottomSheetTextInput`, which needs a real bottom-sheet
// context (`useBottomSheetInternal`) to mount. Outside an actual sheet (as in a unit test)
// it throws, so it's swapped for a plain `TextInput` here.
jest.mock('@gorhom/bottom-sheet', () => {
  const { TextInput } = require('react-native');
  return { BottomSheetTextInput: TextInput };
});

const bbva: AccountType = { id: 1, name: 'BBVA', amount: 1000, type: 'debit_card', hidden: false };
const cash: AccountType = { id: 2, name: 'Efectivo', amount: 200, type: 'cash', hidden: false };
const savings: AccountType = { id: 3, name: 'Ahorro', amount: 50, type: 'bank', hidden: false };
const unsynced: AccountType = { id: null, client_id: 'c-9', name: 'Sin sincronizar', amount: 0, type: 'cash', hidden: false };
const accounts = [bbva, cash, savings, unsynced];

describe('TransferForm', () => {
  it('lists only other, synced accounts as destinations', async () => {
    await render(<TransferForm from={bbva} accounts={accounts} onSubmit={jest.fn()} fieldErrors={null} />);

    expect(screen.getByText('Efectivo')).toBeTruthy();
    expect(screen.getByText('Ahorro')).toBeTruthy();
    expect(screen.queryByText('Sin sincronizar')).toBeNull();
    // The origin shows once (as the summary), never as a destination chip.
    expect(screen.getAllByText('BBVA')).toHaveLength(1);
  });

  it('submits the origin, destination and amount, then shows the success message', async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    await render(<TransferForm from={bbva} accounts={accounts} onSubmit={onSubmit} fieldErrors={null} />);

    await fireEvent.press(screen.getByText('Efectivo'));
    await fireEvent.changeText(screen.getByPlaceholderText('$0.00'), '250.50');
    await fireEvent.press(screen.getByText('Transferir'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(bbva, cash, 250.5));
    expect(await screen.findByText('Transferencia realizada')).toBeTruthy();
    expect(screen.getByText(/BBVA → Efectivo/)).toBeTruthy();
  });

  it('preselects the destination when there is only one', async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    await render(<TransferForm from={bbva} accounts={[bbva, cash]} onSubmit={onSubmit} fieldErrors={null} />);

    await fireEvent.changeText(screen.getByPlaceholderText('$0.00'), '10');
    await fireEvent.press(screen.getByText('Transferir'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(bbva, cash, 10));
  });

  it('requires a destination and a valid amount before calling onSubmit', async () => {
    const onSubmit = jest.fn();
    await render(<TransferForm from={bbva} accounts={accounts} onSubmit={onSubmit} fieldErrors={null} />);

    await fireEvent.press(screen.getByText('Transferir'));

    expect(await screen.findByText('Selecciona la cuenta destino')).toBeTruthy();
    expect(screen.getByText('Ingresa un monto de al menos $1')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an amount above the origin balance', async () => {
    const onSubmit = jest.fn();
    await render(<TransferForm from={bbva} accounts={accounts} onSubmit={onSubmit} fieldErrors={null} />);

    await fireEvent.press(screen.getByText('Efectivo'));
    await fireEvent.changeText(screen.getByPlaceholderText('$0.00'), '1000.01');
    await fireEvent.press(screen.getByText('Transferir'));

    expect(await screen.findByText('Saldo insuficiente en la cuenta origen')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the form and shows the error message when the transfer fails', async () => {
    const onSubmit = jest.fn().mockResolvedValue(false);
    await render(
      <TransferForm
        from={bbva}
        accounts={accounts}
        onSubmit={onSubmit}
        fieldErrors={null}
        errorMessage="Se requiere conexión a internet"
      />
    );

    expect(screen.queryByText('Se requiere conexión a internet')).toBeNull();

    await fireEvent.press(screen.getByText('Efectivo'));
    await fireEvent.changeText(screen.getByPlaceholderText('$0.00'), '10');
    await fireEvent.press(screen.getByText('Transferir'));

    expect(await screen.findByText('Se requiere conexión a internet')).toBeTruthy();
    expect(screen.queryByText('Transferencia realizada')).toBeNull();
  });

  it('renders server field errors', async () => {
    await render(
      <TransferForm
        from={bbva}
        accounts={accounts}
        onSubmit={jest.fn()}
        fieldErrors={{ amount: ['El monto es inválido'], account_to: ['La cuenta no existe'] }}
      />
    );

    expect(screen.getByText('El monto es inválido')).toBeTruthy();
    expect(screen.getByText('La cuenta no existe')).toBeTruthy();
  });

  it('disables the submit when there is no other account', async () => {
    const onSubmit = jest.fn();
    await render(<TransferForm from={bbva} accounts={[bbva]} onSubmit={onSubmit} fieldErrors={null} />);

    expect(screen.getByText('Necesitas otra cuenta para transferir saldo.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Transferir'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
