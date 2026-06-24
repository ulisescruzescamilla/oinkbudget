/**
 * NewAccountForm — create/edit an account. Ported from `NewAccountForm` in
 * `design/src/app.jsx`. Wires to the `useAccounts` mutations via props and renders
 * per-field 422 errors.
 */
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Field, Text } from '@/components/ui';
import { AccountType, KindOfAccountType } from '@/types/AccountType';
import { FieldErrors, getFieldError } from '@/utils/errorHandler';
import { ACCOUNT_TYPE_OPTIONS } from '@/styles/accounts';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

export interface NewAccountFormProps {
  /** Account being edited, if any. */
  account?: AccountType | null;
  /** Submit handler returning the created/updated account (undefined on error). */
  onSubmit: (account: AccountType) => Promise<AccountType | undefined>;
  onDone: () => void;
  fieldErrors: FieldErrors | null;
  loading?: boolean;
}

/** Form for creating or editing an account. */
export function NewAccountForm({ account, onSubmit, onDone, fieldErrors, loading }: NewAccountFormProps) {
  const [name, setName] = useState(account?.name ?? '');
  const [amount, setAmount] = useState(account ? String(account.amount) : '');
  const [type, setType] = useState<KindOfAccountType>(account?.type ?? 'cash');

  useEffect(() => {
    setName(account?.name ?? '');
    setAmount(account ? String(account.amount) : '');
    setType(account?.type ?? 'cash');
  }, [account]);

  const submit = async () => {
    const result = await onSubmit({
      id: account?.id ?? null,
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      type,
      hidden: account?.hidden ?? false,
    });
    if (result) onDone();
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" className="gap-4">
      <View className="gap-4">
        <Text className="text-[12.5px] font-strong text-muted">{'Nombre'}</Text>
        <BottomSheetTextInput
          className={'w-full rounded-inner border border-border-2 bg-card px-3.5 py-3 font-semi text-[15px] text-text'}
          placeholder="Ej. BBVA"
          value={name}
          onChangeText={setName}
        />

        <View className="gap-[7px]">
          <Text className="text-[12.5px] font-strong text-muted">Tipo</Text>
          <View className="flex-row flex-wrap gap-2">
            {ACCOUNT_TYPE_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                icon={opt.icon}
                active={type === opt.value}
                onPress={() => setType(opt.value)}
              />
            ))}
          </View>
        </View>

        <Text className="text-[12.5px] font-strong text-muted">{'Saldo inicial'}</Text>
        <BottomSheetTextInput
          placeholder="$0.00"
          className={'w-full rounded-inner border border-border-2 bg-card px-3.5 py-3 font-semi text-[15px] text-text'}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Button icon="check" block size="lg" loading={loading} onPress={submit}>
          {account ? 'Guardar cambios' : 'Crear cuenta'}
        </Button>
      </View>
    </ScrollView>
  );
}

export default NewAccountForm;
