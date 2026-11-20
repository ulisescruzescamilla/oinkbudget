/**
 * QuickAddForm — expense/income capture form with a numeric keypad.
 * Ported from `design/src/quickadd.jsx`. Collects the entry and delegates
 * persistence to `onSubmit` (`QuickAddScreen` sends it through the API hooks).
 */
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { ScrollView, View } from 'react-native';
import { Button, Card, Field, Keypad, Text } from '@/components/ui';
import { DateField } from './DateField';
import { PillPicker, type PillPickerItem } from './PillPicker';
import { SuccessState } from './SuccessState';
import { TypeTabs } from './TypeTabs';
import { AccountType } from '@/types/AccountType';
import { BudgetType } from '@/types/BudgetType';
import { TypeBalance } from '@/types/BalanceType';
import { CategoryType } from '@/types/CategoryType';
import { getAccountTypeStyle } from '@/styles/accounts';
import { cashFormat, cashFormatRounded, dayOffset } from '@/utils/formatting';
import { pushRecentPick } from '@/utils/recentPicks';
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
  categoryId: number | null;
  date: Date;
}

/** Values an existing movement prefills the form with when editing. */
export interface QuickAddInitial {
  amount: number;
  description: string;
  accountId: number | null;
  budgetId: number | null;
  categoryId: number | null;
}

export interface QuickAddFormProps {
  /** Initial mode when mounted. */
  mode?: TypeBalance;
  accounts: AccountType[];
  budgets: BudgetType[];
  /** Every category; the form offers those matching its type. */
  categories: CategoryType[];
  /** Opens the new-category form; `onCreated` receives the saved category. */
  onNewCategory?: (type: TypeBalance, onCreated: (category: CategoryType) => void) => void;
  /** Resolves to whether the entry was saved; `false` keeps the form up so errors can be shown. */
  onSubmit: (entry: QuickAddEntry) => Promise<boolean>;
  /** Called once the success confirmation has been shown, to leave the screen. */
  onSaved: () => void;
  /** Per-field errors from the last failed submit (422 response). */
  serverFieldErrors?: FieldErrors | null;
  /** Prefilled values. Read once on mount — remount (via `key`) to load another movement. */
  initial?: QuickAddInitial;
  /** Editing an existing movement: its type and date are fixed, so those controls are hidden. */
  editing?: boolean;
}

/** How long the success confirmation stays up before `onSaved` fires. */
const SUCCESS_DELAY_MS = 900;

/** Mode tab labels shown at the top of the form. */
const MODE_LABELS = { expense: 'Gasto', income: 'Ingreso' };

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
  categories,
  onNewCategory,
  onSubmit,
  onSaved,
  serverFieldErrors,
  initial,
  editing = false,
}: QuickAddFormProps) {
  const t = useTheme();
  const [type, setType] = useState<TypeBalance>(mode);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '0');
  const [accountId, setAccountId] = useState<number | null>(initial?.accountId ?? accounts[0]?.id ?? null);
  const [budgetId, setBudgetId] = useState<number | null>(initial?.budgetId ?? budgets[0]?.id ?? null);
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null);
  const [description, setDescription] = useState(initial?.description ?? '');
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

  // An edited movement keeps the category it has, even when it has none.
  useEffect(() => {
    if (editing) return;
    setCategoryId((current) => current ?? categories.find((c) => c.type === type)?.id ?? null);
  }, [categories, type, editing]);

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

  const switchType = (next: TypeBalance) => {
    setType(next);
    setCategoryId(categories.find((c) => c.type === next)?.id ?? null);
  };

  const categoryItems: PillPickerItem[] = categories
    .filter((c) => c.type === type)
    .map((c) => ({ id: c.id, name: c.name, icon: c.icon_code as IconName }));
  // Records still waiting to sync have no server id, so they can't be referenced here.
  const accountItems: PillPickerItem[] = accounts.flatMap((a) =>
    a.id == null
      ? []
      : [{
          id: a.id,
          name: a.name,
          icon: getAccountTypeStyle(a.type).icon,
          sub: `${getAccountTypeStyle(a.type).label} · ${cashFormat(Number(a.amount))}`,
        }]
  );
  const budgetItems: PillPickerItem[] = budgets.flatMap((b) => {
    if (b.id == null) return [];
    const max = Number(b.max_limit);
    const available = max - Number(b.expense_amount ?? 0);
    return [{
      id: b.id,
      name: b.name,
      icon: (b.category?.icon_code ?? 'tag') as IconName,
      sub: `Disponible ${cashFormatRounded(available)} de ${cashFormatRounded(max)}`,
    }];
  });

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
      const saved = await onSubmit({ type, amount: value, description, account, budget, categoryId, date });
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
          title={editing ? 'Movimiento actualizado' : isIncome ? 'Ingreso guardado' : 'Gasto guardado'}
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
        {!editing && <TypeTabs value={type} onChange={switchType} labels={MODE_LABELS} />}

        {/* Amount */}
        <View className="items-center pt-1.5">
          <Text className="font-display text-[52px]" style={{ color: accent }}>
            <Text className="text-[30px] text-muted">$ </Text>
            {amount}
          </Text>
          {submitted && errorFor('amount') ? (
            <Text className="text-[12px] font-semi text-danger">{errorFor('amount')}</Text>
          ) : null}
        </View>

        {/* Keypad */}
        <Keypad keys={KEYS} onPress={press} />

        <Card className="gap-4">
          {/* Select category */}
          <PillPicker
            key={`category-${type}`}
            label="Categoría"
            recentKey={`category-${type}`}
            items={categoryItems}
            value={categoryId}
            onChange={setCategoryId}
            onNew={
              onNewCategory &&
              (() =>
                onNewCategory(type, (category) => {
                  if (category.type !== type) return;
                  pushRecentPick(`category-${type}`, category.id);
                  setCategoryId(category.id);
                }))
            }
            newLabel="Nueva categoría"
          />

          {/* Select account */}
          {hasAccounts ? (
            <PillPicker
              label="Cuenta"
              recentKey="account"
              items={accountItems}
              value={accountId}
              onChange={setAccountId}
              error={submitted ? errorFor('accountId', 'account_id') : undefined}
            />
          ) : (
            <View className="gap-[7px]">
              <Text className="text-[12.5px] font-strong text-muted">Cuenta</Text>
              <Text className="text-[12px] font-semi text-danger">No existen cuentas, por favor genere uno.</Text>
            </View>
          )}

          {/* Select budget */}
          {!isIncome &&
            (hasBudgets ? (
              <PillPicker
                label="Presupuesto"
                recentKey="budget"
                items={budgetItems}
                value={budgetId}
                onChange={setBudgetId}
                error={submitted ? errorFor('budgetId', 'budget_id') : undefined}
              />
            ) : (
              <View className="gap-[7px]">
                <Text className="text-[12.5px] font-strong text-muted">Presupuesto</Text>
                <Text className="text-[12px] font-semi text-danger">No existen presupuestos, por favor genere uno.</Text>
              </View>
            ))}

          {/* Date */}
          {!editing && <DateField value={date} onChange={setDate} />}

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
          {`Guardar ${editing ? 'cambios' : isIncome ? 'ingreso' : 'gasto'} · ${cashFormat(value)}`}
        </Button>
      </View>
    </View>
  );
}

export default QuickAddForm;
