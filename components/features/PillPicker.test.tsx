import { render, screen, fireEvent } from '@testing-library/react-native';
import Storage from 'expo-sqlite/kv-store';
import { PillPicker, type PillPickerItem } from './PillPicker';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@gorhom/bottom-sheet', () => {
  const { ScrollView, TextInput } = require('react-native');
  return { BottomSheetTextInput: TextInput, BottomSheetScrollView: ScrollView };
});
jest.mock('@/components/ui/Sheet', () => ({
  Sheet: ({ open, children }: { open: boolean; children: React.ReactNode }) => (open ? children : null),
}));
jest.mock('expo-sqlite/kv-store', () => {
  let stored: string | null = null;
  return {
    __esModule: true,
    default: {
      getItemSync: jest.fn(() => stored),
      setItemSync: jest.fn((_key: string, value: string) => {
        stored = value;
      }),
    },
  };
});

const item = (id: number, name: string): PillPickerItem => ({ id, name, icon: 'tag', sub: `Detalle ${name}` });
const items = [item(1, 'Uno'), item(2, 'Dos'), item(3, 'Tres'), item(4, 'Cuatro')];
const many = [...items, item(5, 'Cinco'), item(6, 'Seis'), item(7, 'Siete')];

describe('PillPicker', () => {
  beforeEach(() => {
    Storage.setItemSync('oink.recent.v1', '{}');
  });

  it('shows two pills and collapses the rest into a counter', async () => {
    await render(<PillPicker label="Cuenta" items={items} value={1} onChange={jest.fn()} recentKey="a" />);

    expect(screen.getByText('Uno')).toBeTruthy();
    expect(screen.getByText('Dos')).toBeTruthy();
    expect(screen.queryByText('Tres')).toBeNull();
    expect(screen.getByText('+2')).toBeTruthy();
  });

  it('shows an icon-only "Ver todas" pill when every option fits', async () => {
    await render(<PillPicker label="Cuenta" items={items.slice(0, 2)} value={1} onChange={jest.fn()} recentKey="a" />);

    expect(screen.getByLabelText('Ver todas')).toBeTruthy();
    expect(screen.queryByText('Ver todas')).toBeNull();
  });

  it('keeps a selection from the sheet visible and surfaces recents first', async () => {
    const onChange = jest.fn();
    const view = await render(<PillPicker label="Cuenta" items={items} value={1} onChange={onChange} recentKey="a" />);

    await fireEvent.press(screen.getByText('+2'));
    expect(screen.getByText('Detalle Cuatro')).toBeTruthy();
    await fireEvent.press(screen.getByText('Cuatro'));
    expect(onChange).toHaveBeenCalledWith(4);

    await view.rerender(<PillPicker label="Cuenta" items={items} value={4} onChange={onChange} recentKey="a" />);
    expect(screen.getByText('Cuatro')).toBeTruthy();
    expect(screen.getByText('Uno')).toBeTruthy();
    expect(screen.queryByText('Dos')).toBeNull();

    await view.rerender(<PillPicker label="Cuenta" items={items} value={2} onChange={onChange} recentKey="a" />);
    expect(screen.getByText('Dos')).toBeTruthy();
    expect(screen.getByText('Cuatro')).toBeTruthy();
    expect(screen.queryByText('Uno')).toBeNull();
  });

  it('searches long lists only', async () => {
    await render(<PillPicker label="Cuenta" items={many} value={1} onChange={jest.fn()} recentKey="a" />);

    await fireEvent.press(screen.getByText('+5'));
    await fireEvent.changeText(screen.getByPlaceholderText('Buscar…'), 'sie');
    expect(screen.getByText('Siete')).toBeTruthy();
    expect(screen.queryByText('Seis')).toBeNull();

    await fireEvent.changeText(screen.getByPlaceholderText('Buscar…'), 'zzz');
    expect(screen.getByText('Sin resultados')).toBeTruthy();
  });

  it('hides the search box on short lists', async () => {
    await render(<PillPicker label="Cuenta" items={items} value={1} onChange={jest.fn()} recentKey="a" />);

    await fireEvent.press(screen.getByText('+2'));
    expect(screen.queryByPlaceholderText('Buscar…')).toBeNull();
  });
});
