import { useState, useCallback } from 'react';
import { accountService, AccountPayload } from '@/services/accountService';
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

  /** Clears field errors. Call when closing the form to reset stale errors. */
  const clearFieldErrors = useCallback(() => {
    setState((s) => ({ ...s, fieldErrors: null }));
  }, []);

  /** Fetches all accounts from the API. */
  const fetchAccounts = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const accounts = await accountService.getAll();
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
      const payload: AccountPayload = {
        name: account.name,
        amount: account.amount,
        type: account.type,
        hidden: account.hidden,
      };
      const created = await accountService.create(payload);
      setState((s) => ({ ...s, loading: false, accounts: [...s.accounts, created] }));
      return created;
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
      const payload: AccountPayload = {
        name: account.name,
        amount: account.amount,
        type: account.type,
        hidden: account.hidden,
      };
      const updated = await accountService.update(String(account.id), payload);
      setState((s) => ({
        ...s,
        loading: false,
        accounts: s.accounts.map((a) => (a.id === account.id ? updated : a)),
      }));
      return updated;
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
