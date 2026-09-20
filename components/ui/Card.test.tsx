import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card, CardHeader } from './Card';

describe('Card', () => {
  it('renders its children inside the default surface', async () => {
    await render(
      <Card>
        <Text>Contenido</Text>
      </Card>
    );
    const content = screen.getByText('Contenido');
    expect(content).toBeTruthy();
    expect(content.parent?.props.className).toEqual(expect.stringContaining('bg-card'));
    expect(content.parent?.props.className).toEqual(expect.stringContaining('p-[18px]'));
  });

  it('paints the hero gradient and drops the border/background classes', async () => {
    await render(
      <Card hero>
        <Text>Contenido</Text>
      </Card>
    );
    const className = screen.getByText('Contenido').parent?.props.className;
    expect(className).not.toEqual(expect.stringContaining('bg-card'));
    expect(className).toEqual(expect.stringContaining('overflow-hidden'));
  });

  it('drops the internal padding when flush', async () => {
    await render(
      <Card flush>
        <Text>Contenido</Text>
      </Card>
    );
    expect(screen.getByText('Contenido').parent?.props.className).not.toEqual(
      expect.stringContaining('p-[18px]')
    );
  });
});

describe('CardHeader', () => {
  it('renders the title', async () => {
    await render(<CardHeader title="Cuentas" />);
    expect(screen.getByText('Cuentas')).toBeTruthy();
  });

  it('renders custom right content when no link is given', async () => {
    await render(<CardHeader title="Cuentas" right={<Text>Extra</Text>} />);
    expect(screen.getByText('Extra')).toBeTruthy();
  });

  it('renders the link label instead of `right`, and fires onLinkPress', async () => {
    const onLinkPress = jest.fn();
    await render(
      <CardHeader title="Cuentas" right={<Text>Extra</Text>} linkLabel="Ver todo" onLinkPress={onLinkPress} />
    );

    expect(screen.queryByText('Extra')).toBeNull();
    await fireEvent.press(screen.getByText('Ver todo'));
    expect(onLinkPress).toHaveBeenCalledTimes(1);
  });
});
