/**
 * Account-type presentation: icon, Spanish label and accent color.
 * Maps the API `KindOfAccountType` to the design's account visuals.
 */
import type { IconName } from '@/components/ui/Icon';
import type { KindOfAccountType } from '@/types/AccountType';

/** Visual style for an account type. */
export interface AccountTypeStyle {
  icon: IconName;
  label: string;
  color: string;
}

export const ACCOUNT_TYPE_STYLE: Record<KindOfAccountType, AccountTypeStyle> = {
  cash: { icon: 'wallet', label: 'Efectivo', color: '#F17264' },
  debit_card: { icon: 'bank', label: 'Débito', color: '#1289E7' },
  credit_card: { icon: 'card', label: 'Crédito', color: '#8C6DE2' },
  bank: { icon: 'building', label: 'Banco', color: '#00B894' },
  investment: { icon: 'piggy', label: 'Inversión', color: '#F39C12' },
};

/** Returns the visual style for an account type (falls back to cash). */
export const getAccountTypeStyle = (type?: KindOfAccountType): AccountTypeStyle =>
  (type && ACCOUNT_TYPE_STYLE[type]) || ACCOUNT_TYPE_STYLE.cash;

/** Ordered account-type options for pickers. */
export const ACCOUNT_TYPE_OPTIONS: { value: KindOfAccountType; label: string; icon: IconName }[] = [
  { value: 'cash', label: 'Efectivo', icon: 'wallet' },
  { value: 'debit_card', label: 'Débito', icon: 'card' },
  { value: 'credit_card', label: 'Crédito', icon: 'card' },
  { value: 'investment', label: 'Inversión', icon: 'piggy' },
  { value: 'bank', label: 'Banco', icon: 'bank' },
];
