import { render, screen, fireEvent } from '@testing-library/react-native';
import { Field, Input } from './Field';

describe('Input', () => {
  it('accepts text input', async () => {
    const onChangeText = jest.fn();
    await render(<Input placeholder="Ej. BBVA" value="" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByPlaceholderText('Ej. BBVA'), 'Cuenta nueva');
    expect(onChangeText).toHaveBeenCalledWith('Cuenta nueva');
  });
});

describe('Field', () => {
  it('renders without a label when none is given', async () => {
    await render(<Field placeholder="Monto" value="" onChangeText={() => {}} />);
    expect(screen.getByPlaceholderText('Monto')).toBeTruthy();
  });

  it('renders the label above the input', async () => {
    await render(<Field label="Nombre" placeholder="Ej. BBVA" value="" onChangeText={() => {}} />);
    expect(screen.getByText('Nombre')).toBeTruthy();
    expect(screen.getByPlaceholderText('Ej. BBVA')).toBeTruthy();
  });

  it('renders the error message when given', async () => {
    await render(
      <Field label="Nombre" error="El nombre es requerido" value="" onChangeText={() => {}} />
    );
    expect(screen.getByText('El nombre es requerido')).toBeTruthy();
  });

  it('renders no error text when error is absent', async () => {
    await render(<Field label="Nombre" value="" onChangeText={() => {}} />);
    expect(screen.queryByText(/requerido/)).toBeNull();
  });
});
