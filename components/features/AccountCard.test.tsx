import { render, screen, fireEvent } from '@testing-library/react-native';
import { AccountCard } from './AccountCard';
import type { AccountType } from '@/types/AccountType';

const account: AccountType = {
  id: 1,
  client_id: 'client-1',
  name: 'BBVA',
  amount: 500,
  type: 'debit_card',
  hidden: false,
};

describe('AccountCard', () => {
  it('renders the account name and type label', async () => {
    await render(
      <AccountCard account={account} total={1000} masked={false} onToggleMask={() => {}} onManage={() => {}} />
    );
    expect(screen.getByText('BBVA')).toBeTruthy();
    expect(screen.getByText('Débito')).toBeTruthy();
  });

  it('shows the formatted balance when unmasked', async () => {
    await render(
      <AccountCard account={account} total={1000} masked={false} onToggleMask={() => {}} onManage={() => {}} />
    );
    expect(screen.getByText(/\$\s*500/)).toBeTruthy();
  });

  it('masks the balance when masked', async () => {
    await render(
      <AccountCard account={account} total={1000} masked onToggleMask={() => {}} onManage={() => {}} />
    );
    expect(screen.getByText('••••')).toBeTruthy();
    expect(screen.queryByText(/\$\s*500/)).toBeNull();
  });

  it('calls onToggleMask when the eye button is pressed', async () => {
    const onToggleMask = jest.fn();
    await render(
      <AccountCard account={account} total={1000} masked={false} onToggleMask={onToggleMask} onManage={() => {}} />
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Ocultar saldo' }));
    expect(onToggleMask).toHaveBeenCalledTimes(1);
  });

  it('calls onManage when the options button is pressed', async () => {
    const onManage = jest.fn();
    await render(
      <AccountCard account={account} total={1000} masked={false} onToggleMask={() => {}} onManage={onManage} />
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Más opciones' }));
    expect(onManage).toHaveBeenCalledTimes(1);
  });

  it('sizes the share bar proportionally to the total', async () => {
    await render(
      <AccountCard account={account} total={2000} masked={false} onToggleMask={() => {}} onManage={() => {}} />
    );
    // 500 / 2000 = 25%
    expect(screen.getByTestId('account-share-bar').props.style).toMatchObject({ width: '25%' });
  });

  it('clamps the share bar to 0% when the total is 0', async () => {
    await render(
      <AccountCard account={account} total={0} masked={false} onToggleMask={() => {}} onManage={() => {}} />
    );
    expect(screen.getByTestId('account-share-bar').props.style).toMatchObject({ width: '0%' });
  });
});
