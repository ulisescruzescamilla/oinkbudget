/**
 * QuickAddForm — expense/income capture form with a numeric keypad.
 * Ported from `design/src/quickadd.jsx`. Collects the entry and delegates
 * persistence to `onSubmit` (`QuickAddScreen` sends it through the API hooks).
 */
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Card, Chip, Field, Icon, Text, cn } from '@/components/ui';
import { DateField } from './DateField';
import { SuccessState } from './SuccessState';
import { AccountType } from '@/types/AccountType';
import { BudgetType } from '@/types/BudgetType';
import { TypeBalance } from '@/types/BalanceType';
import { cashFormat, dayOffset } from '@/utils/formatting';
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
  date: Date;
}

export interface QuickAddFormProps {
  /** Initial mode when mounted. */
  mode?: TypeBalance;
  accounts: AccountType[];
  budgets: BudgetType[];
  /** Resolves to whether the entry was saved; `false` keeps the form up so errors can be shown. */
  onSubmit: (entry: QuickAddEntry) => Promise<boolean>;
  /** Called once the success confirmation has been shown, to leave the screen. */
  onSaved: () => void;
  /** Per-field errors from the last failed submit (422 response). */
  serverFieldErrors?: FieldErrors | null;
}

/** How long the success confirmation stays up before `onSaved` fires. */
const SUCCESS_DELAY_MS = 900;

/** Mode tabs shown at the top of the form. */
const MODES: { value: TypeBalance; label: string; icon: IconName }[] = [
  { value: 'expense', label: 'Gasto', icon: 'down' },
  { value: 'income', label: 'Ingreso', icon: 'up' },
];

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

/**
 * Full-screen form for capturing an expense or income. State lives for the
 * lifetime of the component — remount it (via `key`) to start a fresh entry.
 */
export function QuickAddForm({
  mode = 'expense',
  accounts,
  budgets,
  onSubmit,
  onSaved,
  serverFieldErrors,
}: QuickAddFormProps) {
  const t = useTheme();
  const [type, setType] = useState<TypeBalance>(mode);
  const [amount, setAmount] = useState('0');
  const [accountId, setAccountId] = useState<number | null>(accounts[0]?.id ?? null);
  const [budgetId, setBudgetId] = useState<number | null>(budgets[0]?.id ?? null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(dayOffset(0));
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const [success, setSuccess] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The lists are re-fetched when the screen gains focus, so they can arrive
  // after mount — preselect the first option once there is one.
  useEffect(() => {
    setAccountId((current) => current ?? accounts[0]?.id ?? null);
  }, [accounts]);

  useEffect(() => {
    setBudgetId((current) => current ?? budgets[0]?.id ?? null);
  }, [budgets]);

  useEffect(() => {
    return () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  const isIncome = type === 'income';
  const accent = isIncome ? t.income : t.expense;
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
      const saved = await onSubmit({ type, amount: value, description, account, budget, date });
      if (saved) {
        setSuccess(true);
        closeTimeout.current = setTimeout(onSaved, SUCCESS_DELAY_MS);
      }
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 items-center justify-center px-[18px]">
        <SuccessState
          iconColor={accent}
          iconBackgroundColor={isIncome ? t.incomeSoft : t.expenseSoft}
          title={isIncome ? 'Ingreso guardado' : 'Gasto guardado'}
          subtitle={`${cashFormat(value)} · ${description}`}
        />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 12, gap: 18 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {/* Gasto / Ingreso */}
        <View accessibilityRole="tablist" className="flex-row gap-1 rounded-pill border border-border bg-card-2 p-1">
          {MODES.map((m) => {
            const active = type === m.value;
            const color = active ? accent : t.muted;
            return (
              <Pressable
                key={m.value}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setType(m.value)}
                className={cn(
                  'h-[42px] flex-1 flex-row items-center justify-center gap-[7px] rounded-pill',
                  active && 'bg-card shadow-soft'
                )}
              >
                <Icon name={m.icon} size={17} strokeWidth={2.4} color={color} />
                <Text className="font-display text-[14.5px]" style={{ color }}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Amount */}
        <View className="items-center pt-1.5">
          <Text className="font-display text-[52px]" style={{ color: accent }}>
            <Text className="text-[30px] text-muted">$ </Text>
            {amount}
          </Text>
          {submitted && errorFor('amount') ? (
            <Text className="text-[12px] font-semi text-expense">{errorFor('amount')}</Text>
          ) : null}
        </View>

        {/* Keypad */}
        <View className="flex-row flex-wrap justify-between gap-y-2">
          {KEYS.map((k) => (
            <Pressable
              key={k}
              onPress={() => press(k)}
              accessibilityRole="button"
              accessibilityLabel={k === 'del' ? 'Borrar' : k}
              className="items-center justify-center rounded-2xl bg-card-2 py-4 active:scale-95 active:bg-primary-soft"
              style={{ width: '32%' }}
            >
              {k === 'del' ? (
                <Icon name="back" size={20} strokeWidth={2.4} color={t.text} />
              ) : (
                <Text className="font-strong text-[22px]">{k}</Text>
              )}
            </Pressable>
          ))}
        </View>

        <Card className="gap-4">
          {/* Select budget */}
          {!isIncome && (
            <View className="gap-[7px]">
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
          <View className="gap-[7px]">
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

          {/* Date */}
          <DateField value={date} onChange={setDate} />

          {/* Description */}
          <Field
            label="Descripción"
            placeholder={isIncome ? 'Ej. Nómina, freelance…' : 'Ej. Café, súper…'}
            value={description}
            onChangeText={setDescription}
            error={submitted ? errorFor('description') : undefined}
          />
        </Card>
      </ScrollView>

      {/* Save button — pinned above the tab bar; the bottom padding clears the FAB's overhang. */}
      <View className="bg-surface px-[18px] pb-[34px] pt-2.5">
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
      </View>
    </View>
  );
}

export default QuickAddForm;
