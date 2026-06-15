/**
 * QuickAddSheet — fast expense/income capture with a numeric keypad.
 * Ported from `design/src/quickadd.jsx`. Collects the entry and delegates
 * persistence to `onSubmit` (the tab layout writes it to the local balances log).
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Chip, Field, Icon, Segmented, Sheet, Text } from '@/components/ui';
import { AccountType } from '@/types/AccountType';
import { BudgetType } from '@/types/BudgetType';
import { TypeBalance } from '@/types/BalanceType';
import { cashFormat } from '@/utils/formatting';
import { getCategoryStyle } from '@/styles/categories';
import { useTheme } from '@/styles/useTheme';

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
  onSubmit: (entry: QuickAddEntry) => Promise<void>;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

/** Bottom sheet for capturing a quick expense or income. */
export function QuickAddSheet({ open, mode = 'expense', onClose, accounts, budgets, onSubmit }: QuickAddSheetProps) {
  const t = useTheme();
  const [type, setType] = useState<TypeBalance>(mode);
  const [amount, setAmount] = useState('0');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [budgetId, setBudgetId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setType(mode);
      setAmount('0');
      setDescription('');
      setAccountId(accounts[0]?.id ?? null);
      setBudgetId(budgets[0]?.id ?? null);
    }
  }, [open, mode, accounts, budgets]);

  const isIncome = type === 'income';
  const value = parseFloat(amount) || 0;

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
    const account = accounts.find((a) => a.id === accountId);
    if (!account || value <= 0) return;
    const budget = isIncome ? undefined : budgets.find((b) => b.id === budgetId);
    setSaving(true);
    try {
      await onSubmit({ type, amount: value, description, account, budget });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Segmented
          className="mb-2 self-start"
          value={type}
          onChange={(v) => setType(v as TypeBalance)}
          options={[
            { value: 'expense', label: 'Gasto' },
            { value: 'income', label: 'Ingreso' },
          ]}
        />

        <View className="items-center py-4">
          <Text className="font-display text-[52px]" style={{ color: isIncome ? t.income : t.expense }}>
            <Text className="text-[30px] text-muted">$ </Text>
            {amount}
          </Text>
        </View>

        {!isIncome && budgets.length > 0 && (
          <View className="mb-3.5 gap-[7px]">
            <Text className="text-[12.5px] font-strong text-muted">Presupuesto</Text>
            <View className="flex-row flex-wrap gap-2">
              {budgets.map((b) => (
                <Chip
                  key={b.id}
                  label={b.name}
                  icon={getCategoryStyle(b.name).icon}
                  active={budgetId === b.id}
                  onPress={() => setBudgetId(b.id)}
                />
              ))}
            </View>
          </View>
        )}

        <View className="mb-3.5 gap-[7px]">
          <Text className="text-[12.5px] font-strong text-muted">Cuenta</Text>
          <View className="flex-row flex-wrap gap-2">
            {accounts.map((a) => (
              <Chip key={a.id} label={a.name} active={accountId === a.id} onPress={() => setAccountId(a.id)} />
            ))}
          </View>
        </View>

        <View className="mb-3.5">
          <Field
            label="Descripción"
            placeholder={isIncome ? 'Ej. Nómina, freelance…' : 'Ej. Café, súper…'}
            value={description}
            onChangeText={setDescription}
          />
        </View>

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

        <Button
          icon="check"
          block
          size="lg"
          loading={saving}
          disabled={value <= 0 || !accountId}
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
