/**
 * QuickAddSheet — fast expense/income capture with a numeric keypad.
 * Ported from `design/src/quickadd.jsx`. Collects the entry and delegates
 * persistence to `onSubmit` (the tab layout writes it to the local balances log).
 */
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Chip, Icon, ModalField, Segmented, Sheet, Text } from '@/components/ui';
import { AccountType } from '@/types/AccountType';
import { BudgetType } from '@/types/BudgetType';
import { TypeBalance } from '@/types/BalanceType';
import { cashFormat } from '@/utils/formatting';
import { useTheme } from '@/styles/useTheme';
import { FieldErrors, getFieldError } from '@/utils/errorHandler';
import type { IconName } from '@/components/ui';

/** A captured quick-add entry. */
export interface QuickAddEntry {
  type: TypeBalance;
  amount: number;
  description: string;
  account: AccountType;
  budget?: BudgetType;
}

export interface QuickAddSheetProps {
  open: boolean;
  /** Initial mode when opened. */
  mode?: TypeBalance;
  onClose: () => void;
  accounts: AccountType[];
  budgets: BudgetType[];
  /** Resolves to whether the entry was saved; `false` keeps the sheet open so errors can be shown. */
  onSubmit: (entry: QuickAddEntry) => Promise<boolean>;
  /** Per-field errors from the last failed submit (422 response). */
  serverFieldErrors?: FieldErrors | null;
  /** Clears `serverFieldErrors`; called whenever the sheet is (re)opened. */
  onClearServerFieldErrors?: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

/** Builds the validation schema; budget is always required for expenses (income never needs one). */
function buildQuickAddSchema(isIncome: boolean) {
  return z
    .object({
      amount: z.number().positive('Ingresa un monto válido'),
      accountId: z.number().nullable(),
      budgetId: z.number().nullable(),
      description: z.string().trim().min(1, 'Ingresa una descripción'),
    })
    .superRefine((val, ctx) => {
      if (val.accountId === null) {
        ctx.addIssue({ code: 'custom', path: ['accountId'], message: 'Selecciona una cuenta' });
      }
      if (!isIncome && val.budgetId === null) {
        ctx.addIssue({ code: 'custom', path: ['budgetId'], message: 'Selecciona un presupuesto' });
      }
    });
}

/** Maps a failed zod parse into this app's `FieldErrors` shape so `getFieldError` can render it. */
function zodToFieldErrors(result: z.ZodSafeParseError<unknown>): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '_');
    out[key] = out[key] ? [...out[key], issue.message] : [issue.message];
  }
  return out;
}

/** Bottom sheet for capturing a quick expense or income. */
export function QuickAddSheet({
  open,
  mode = 'expense',
  onClose,
  accounts,
  budgets,
  onSubmit,
  serverFieldErrors,
  onClearServerFieldErrors,
}: QuickAddSheetProps) {
  const t = useTheme();
  const [type, setType] = useState<TypeBalance>(mode);
  const [amount, setAmount] = useState('0');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [budgetId, setBudgetId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  useEffect(() => {
    if (open) {
      setType(mode);
      setAmount('0');
      setDescription('');
      setAccountId(accounts[0]?.id ?? null);
      setBudgetId(budgets[0]?.id ?? null);
      setSubmitted(false);
      setFieldErrors(null);
      onClearServerFieldErrors?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const isIncome = type === 'income';
  const value = parseFloat(amount) || 0;
  const hasBudgets = budgets.length > 0;
  const hasAccounts = accounts.length > 0;
  const schema = buildQuickAddSchema(isIncome);
  const parsed = schema.safeParse({ amount: value, accountId, budgetId, description });
  const isValid = parsed.success;
  const displayErrors = fieldErrors ?? serverFieldErrors ?? null;
  const errorFor = (...keys: string[]) => {
    for (const key of keys) {
      const message = getFieldError(displayErrors ?? undefined, key);
      if (message) return message;
    }
    return undefined;
  };

  const press = (k: string) => {
    setAmount((prev) => {
      if (k === 'del') return prev.length <= 1 ? '0' : prev.slice(0, -1);
      if (k === '.') return prev.includes('.') ? prev : prev + '.';
      if (prev === '0') return k;
      const dec = prev.split('.')[1];
      if (dec && dec.length >= 2) return prev;
      return prev + k;
    });
  };

  const save = async () => {
    setSubmitted(true);
    const result = schema.safeParse({ amount: value, accountId, budgetId, description });
    if (!result.success) {
      setFieldErrors(zodToFieldErrors(result));
      return;
    }
    setFieldErrors(null);
    const account = accounts.find((a) => a.id === accountId)!;
    const budget = isIncome ? undefined : budgets.find((b) => b.id === budgetId);
    setSaving(true);
    try {
      const success = await onSubmit({ type, amount: value, description, account, budget });
      if (success) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* View amount $ */}
        <View className="items-center py-4">
          <Text className="font-display text-[52px]" style={{ color: isIncome ? t.income : t.expense }}>
            <Text className="text-[30px] text-muted">$ </Text>
            {amount}
          </Text>
          {submitted && errorFor('amount') ? (
            <Text className="text-[12px] font-semi text-expense">{errorFor('amount')}</Text>
          ) : null}
        </View>

        {/* Select budget */}
        {!isIncome && (
          <View className="mb-3.5 gap-[7px]">
            <Text className="text-[12.5px] font-strong text-muted">Presupuesto</Text>
            {hasBudgets ? (
              <>
                <View className="flex-row flex-wrap gap-2">
                  {budgets.map((b) => (
                    <Chip
                      key={b.id}
                      label={b.name}
                      icon={b.category?.icon_code as IconName | undefined}
                      active={budgetId === b.id}
                      onPress={() => setBudgetId(b.id)}
                    />
                  ))}
                </View>
                {submitted && errorFor('budgetId', 'budget_id') ? (
                  <Text className="text-[12px] font-semi text-expense">{errorFor('budgetId', 'budget_id')}</Text>
                ) : null}
              </>
            ) : (
              <Text className="text-[12px] font-semi text-danger">No existen presupuestos, por favor genere uno.</Text>
            )}
          </View>
        )}

        {/* Select account */}
        <View className="mb-3.5 gap-[7px]">
          <Text className="text-[12.5px] font-strong text-muted">Cuenta</Text>
          {hasAccounts ? (
            <>
              <View className="flex-row flex-wrap gap-2">
                {accounts.map((a) => (
                  <Chip key={a.id} label={a.name} active={accountId === a.id} onPress={() => setAccountId(a.id)} />
                ))}
              </View>
              {submitted && errorFor('accountId', 'account_id') ? (
                <Text className="text-[12px] font-semi text-expense">{errorFor('accountId', 'account_id')}</Text>
              ) : null}
            </>
          ) : (
            <Text className="text-[12px] font-semi text-danger">No existen cuentas, por favor genere uno.</Text>
          )}
        </View>

        {/* Description */}
        <View className="mb-3.5">
          <ModalField
            label="Descripción"
            placeholder={isIncome ? 'Ej. Nómina, freelance…' : 'Ej. Café, súper…'}
            value={description}
            onChangeText={setDescription}
            error={submitted ? errorFor('description') : undefined}
          />
        </View>

        {/* KeyPad */}
        <View className="mb-3.5 flex-row flex-wrap justify-between">
          {KEYS.map((k) => (
            <Pressable
              key={k}
              onPress={() => press(k)}
              className="mb-2 items-center justify-center rounded-2xl bg-card-2 active:scale-95 active:bg-primary-soft"
              style={{ width: '32%', paddingVertical: 16 }}
            >
              {k === 'del' ? (
                <Icon name="close" size={20} strokeWidth={2.4} color={t.text} />
              ) : (
                <Text className="font-strong text-[22px]">{k}</Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Save button */}
        <Button
          icon="check"
          block
          size="lg"
          loading={saving}
          disabled={saving || !isValid}
          onPress={save}
          className={isIncome ? 'bg-income' : undefined}
        >
          {`Guardar ${isIncome ? 'ingreso' : 'gasto'} · ${cashFormat(value)}`}
        </Button>
      </ScrollView>
    </Sheet>
  );
}

export default QuickAddSheet;
