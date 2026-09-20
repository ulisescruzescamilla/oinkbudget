import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label and responds to press', async () => {
    const onPress = jest.fn();
    await render(<Button onPress={onPress}>Guardar</Button>);

    expect(screen.getByText('Guardar')).toBeTruthy();
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <Button onPress={onPress} disabled>
        Guardar
      </Button>
    );

    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a spinner instead of the label while loading, and ignores presses', async () => {
    const onPress = jest.fn();
    await render(
      <Button onPress={onPress} loading>
        Guardar
      </Button>
    );

    expect(screen.queryByText('Guardar')).toBeNull();
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders a leading icon when one is provided', async () => {
    await render(
      <Button onPress={() => {}} icon="plus">
        Agregar
      </Button>
    );

    expect(screen.getByText('Agregar')).toBeTruthy();
  });
});
