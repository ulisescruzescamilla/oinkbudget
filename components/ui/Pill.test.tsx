import { render, screen } from '@testing-library/react-native';
import { Pill } from './Pill';

describe('Pill', () => {
  it('renders its label', async () => {
    await render(<Pill>Alimentos</Pill>);
    expect(screen.getByText('Alimentos')).toBeTruthy();
  });

  it('defaults to the muted tone', async () => {
    await render(<Pill>Alimentos</Pill>);
    // tailwind-variants resolves `tone: 'muted'` into the `bg-card-2` class by default.
    expect(screen.getByText('Alimentos').parent?.props.className).toContain('bg-card-2');
  });

  it.each([
    ['primary', 'bg-primary-soft'],
    ['income', 'bg-income-soft'],
    ['expense', 'bg-expense-soft'],
  ] as const)('applies the %s tone class', async (tone, expectedClass) => {
    await render(<Pill tone={tone}>Alimentos</Pill>);
    expect(screen.getByText('Alimentos').parent?.props.className).toContain(expectedClass);
  });
});
