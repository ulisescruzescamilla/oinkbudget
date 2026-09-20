import { render, screen, fireEvent } from '@testing-library/react-native';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('fires onPress', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon="eye" onPress={onPress} accessibilityLabel="Mostrar" />);

    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes the accessible label for screen readers', async () => {
    await render(<IconButton icon="trash" onPress={() => {}} accessibilityLabel="Eliminar" />);
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeTruthy();
  });

  it('sizes itself via the size prop', async () => {
    await render(<IconButton icon="eye" onPress={() => {}} size={34} accessibilityLabel="Mostrar" />);
    expect(screen.getByRole('button').props.style).toMatchObject({ width: 34, height: 34 });
  });

  it('uses the primary-soft tint in the solid variant', async () => {
    await render(<IconButton icon="eye" onPress={() => {}} solid accessibilityLabel="Mostrar" />);
    expect(screen.getByRole('button').props.className).toEqual(expect.stringContaining('bg-primary-soft'));
  });
});
