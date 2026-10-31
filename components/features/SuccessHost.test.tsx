import { act, render, screen } from '@testing-library/react-native';
import { notifySuccess, SuccessHost, SUCCESS_DELAY_MS } from './SuccessHost';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('SuccessHost', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('renders nothing until notifySuccess is called', async () => {
    await render(<SuccessHost />);
    expect(screen.queryByText('Cuenta creada')).toBeNull();
  });

  it('shows the title and detail line, then closes on its own', async () => {
    await render(<SuccessHost />);

    await act(async () => notifySuccess({ title: 'Cuenta creada', subtitle: '$1,200.00 · BBVA' }));
    expect(screen.getByText('Cuenta creada')).toBeTruthy();
    expect(screen.getByText('$1,200.00 · BBVA')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(SUCCESS_DELAY_MS + 500);
    });
    expect(screen.queryByText('Cuenta creada')).toBeNull();
  });

  it('replaces a showing confirmation with the newest one', async () => {
    await render(<SuccessHost />);

    await act(async () => notifySuccess({ title: 'Categoría creada' }));
    await act(async () => notifySuccess({ title: 'Categoría eliminada', tone: 'expense' }));

    expect(screen.queryByText('Categoría creada')).toBeNull();
    expect(screen.getByText('Categoría eliminada')).toBeTruthy();
  });
});
