import { render, screen, fireEvent } from '@testing-library/react-native';
import { DateField } from './DateField';
import { dayOffset, isSameDay } from '@/utils/formatting';

jest.mock('@react-native-community/datetimepicker', () => {
  const { View: RNView } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => <RNView testID="date-time-picker" {...props} />,
  };
});

describe('DateField', () => {
  it('marks "Hoy" active when the value is today', async () => {
    await render(<DateField value={dayOffset(0)} onChange={() => {}} />);
    expect(screen.getByText('Hoy').parent?.props.className).toEqual(expect.stringContaining('bg-primary'));
    expect(screen.getByText('Otra fecha')).toBeTruthy();
  });

  it('marks "Ayer" active when the value is yesterday', async () => {
    await render(<DateField value={dayOffset(-1)} onChange={() => {}} />);
    expect(screen.getByText('Ayer').parent?.props.className).toEqual(expect.stringContaining('bg-primary'));
  });

  it('calls onChange with today when "Hoy" is pressed', async () => {
    const onChange = jest.fn();
    await render(<DateField value={dayOffset(-5)} onChange={onChange} />);

    await fireEvent.press(screen.getByText('Hoy'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(isSameDay(onChange.mock.calls[0][0], dayOffset(0))).toBe(true);
  });

  it('calls onChange with yesterday when "Ayer" is pressed', async () => {
    const onChange = jest.fn();
    await render(<DateField value={dayOffset(0)} onChange={onChange} />);

    await fireEvent.press(screen.getByText('Ayer'));
    expect(isSameDay(onChange.mock.calls[0][0], dayOffset(-1))).toBe(true);
  });

  it('shows the formatted date on the pill when neither preset is selected', async () => {
    const fiveDaysAgo = dayOffset(-5);
    await render(<DateField value={fiveDaysAgo} onChange={() => {}} />);

    expect(screen.queryByText('Otra fecha')).toBeNull();
  });

  it('opens the native picker when the pill is pressed, and forwards its selection', async () => {
    const onChange = jest.fn();
    await render(<DateField value={dayOffset(0)} onChange={onChange} />);

    await fireEvent.press(screen.getByText('Otra fecha'));
    const picker = screen.getByTestId('date-time-picker');

    const selected = dayOffset(-3);
    picker.props.onValueChange({}, selected);
    expect(onChange).toHaveBeenCalledWith(selected);
  });
});
