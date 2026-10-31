import { render, screen, fireEvent } from '@testing-library/react-native';
import { OptionCard } from './OptionCard';

describe('OptionCard', () => {
  it('renders its title and subtitle and responds to press', async () => {
    const onPress = jest.fn();
    await render(<OptionCard title="Mensual" subtitle="Un plan cada mes" selected={false} onPress={onPress} />);

    expect(screen.getByText('Mensual')).toBeTruthy();
    expect(screen.getByText('Un plan cada mes')).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes whether it is selected', async () => {
    await render(<OptionCard title="BBVA" selected onPress={() => {}} role="checkbox" />);

    expect(screen.getByRole('checkbox', { checked: true })).toBeTruthy();
  });
});
