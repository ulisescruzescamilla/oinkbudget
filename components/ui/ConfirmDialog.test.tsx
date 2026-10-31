import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { askConfirm, ConfirmHost } from './ConfirmDialog';

const open = async (onConfirm = jest.fn()) => {
  await act(async () => {
    askConfirm({
      title: '¿Eliminar la cuenta BBVA?',
      message: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar cuenta',
      onConfirm,
    });
  });
  return onConfirm;
};

describe('ConfirmDialog', () => {
  it('renders nothing until askConfirm is called', async () => {
    await render(<ConfirmHost />);
    expect(screen.queryByText('Cancelar')).toBeNull();
  });

  it('shows the title, message and labels, and runs onConfirm on confirm', async () => {
    await render(<ConfirmHost />);
    const onConfirm = await open();

    expect(screen.getByText('¿Eliminar la cuenta BBVA?')).toBeTruthy();
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Eliminar cuenta'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('¿Eliminar la cuenta BBVA?')).toBeNull();
  });

  it('closes without confirming on cancel', async () => {
    await render(<ConfirmHost />);
    const onConfirm = await open();

    await fireEvent.press(screen.getByText('Cancelar'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByText('¿Eliminar la cuenta BBVA?')).toBeNull();
  });

  it('falls back to the default labels', async () => {
    await render(<ConfirmHost />);
    await act(async () => askConfirm({ title: '¿Eliminar?', onConfirm: jest.fn() }));

    expect(screen.getByText('Eliminar')).toBeTruthy();
    expect(screen.getByText('Cancelar')).toBeTruthy();
  });
});
