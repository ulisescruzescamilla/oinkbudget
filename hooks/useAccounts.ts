import { useState, useCallback } from 'react';
import { accountService } from '@/services/accountService';
import { AccountType } from '@/types/AccountType';
import { AppError, FieldErrors } from '@/utils/errorHandler';

interface AccountsState {
  accounts: AccountType[];
  loading: boolean;
  error: AppError | null;
  /** Per-field validation errors from the last failed mutation (422 response). */
  fieldErrors: FieldErrors | null;
}

/**
 * Manages accounts state and exposes CRUD operations backed by the API.
 * Surfaces per-field validation errors from 422 responses in `fieldErrors`.
 */
export function useAccounts() {
  const [state, setState] = useState<AccountsState>({
    accounts: [],
    loading: false,
    error: null,
    fieldErrors: null,
  });

  /** Clears field errors. Call before opening the form again. */
  const clearFieldErrors = useCallback(() => {
    setState((s) => ({ ...s, fieldErrors: null }));
  }, []);

  /** Fetches all accounts from the API. */
  const fetchAccounts = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const data = await accountService.getAll();
      const accounts: AccountType[] = data.map((a) => ({
        id: Number(a.id),
        name: a.name,
        amount: a.amount,
        type: a.type,
        hidden: a.hidden,
      }));
      setState({ accounts, loading: false, error: null, fieldErrors: null });
    } catch (err) {
      console.error(err);
      setState((s) => ({ ...s, loading: false, error: err as AppError }));
    }
  }, []);

  /**
   * Creates a new account. Populates `fieldErrors` on 422.
   *
   * @param account - The account data to create
   */
  async function createAccount(account: AccountType): Promise<AccountType | undefined> {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const created = await accountService.create({
        name: account.name,
        amount: account.amount,
        type: account.type,
        hidden: account.hidden,
      });
      const newAccount: AccountType = { ...account, id: Number(created.id) };
      setState((s) => ({ ...s, loading: false, accounts: [...s.accounts, newAccount] }));
      return newAccount;
    } catch (err) {
      const appErr = err as AppError;
      console.error(err);
      setState((s) => ({
        ...s,
        loading: false,
        error: appErr,
        fieldErrors: appErr.fieldErrors ?? null,
      }));
    }
  }

  /**
   * Updates an existing account. Populates `fieldErrors` on 422.
   *
   * @param account - The account data including its id
   */
  async function updateAccount(account: AccountType): Promise<AccountType | undefined> {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const updated = await accountService.update(String(account.id), {
        name: account.name,
        amount: account.amount,
        type: account.type,
        hidden: account.hidden,
      });
      const updatedAccount: AccountType = { ...account, id: Number(updated.id) };
      setState((s) => ({
        ...s,
        loading: false,
        accounts: s.accounts.map((a) => (a.id === account.id ? updatedAccount : a)),
      }));
      return updatedAccount;
    } catch (err) {
      const appErr = err as AppError;
      console.error(err);
      setState((s) => ({
        ...s,
        loading: false,
        error: appErr,
        fieldErrors: appErr.fieldErrors ?? null,
      }));
    }
  }

  /**
   * Deletes an account.
   *
   * @param account - The account to remove
   */
  async function removeAccount(account: AccountType): Promise<void> {
    await accountService.remove(String(account.id));
    setState((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== account.id) }));
  }

  /**
   * Transfers an amount between two accounts and refreshes the list.
   *
   * @param from - Origin account
   * @param to - Destination account
   * @param amount - Amount to transfer
   */
  async function transferAccounts(from: AccountType, to: AccountType, amount: number): Promise<void> {
    await accountService.transfer(String(from.id), String(to.id), amount);
    await fetchAccounts();
  }

  return {
    ...state,
    refresh: fetchAccounts,
    clearFieldErrors,
    createAccount,
    updateAccount,
    removeAccount,
    transferAccounts,
  };
}
