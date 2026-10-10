/**
 * NewAccountForm — create/edit an account. Ported from `NewAccountForm` in
 * `design/src/app.jsx`. Wires to the `useAccounts` mutations via props and renders
 * per-field 422 errors.
 */
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Field, Icon, ModalField, Switch, Text } from '@/components/ui';
import { AccountType, KindOfAccountType } from '@/types/AccountType';
import { FieldErrors, getFieldError } from '@/utils/errorHandler';
import { ACCOUNT_TYPE_OPTIONS } from '@/styles/accounts';
import { useTheme } from '@/styles/useTheme';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

export interface NewAccountFormProps {
  /** Account being edited, if any. */
  account?: AccountType | null;
  /** Submit handler returning the created/updated account (undefined on error). */
  onSubmit: (account: AccountType) => Promise<AccountType | undefined>;
  onDone: () => void;
  /** Per-field errors from the last failed submit (422 response). */
  fieldErrors: FieldErrors | null;
  /** General error message from the last failed submit (offline, server error…). */
  errorMessage?: string | null;
  loading?: boolean;
}

/** Fields whose 422 errors the form renders inline; any other failure falls back to `errorMessage`. */
const DISPLAYED_FIELDS = ['name', 'type', 'amount'];

/** Form for creating or editing an account. */
export function NewAccountForm({ account, onSubmit, onDone, fieldErrors, errorMessage, loading }: NewAccountFormProps) {
  const [name, setName] = useState(account?.name ?? '');
  const [amount, setAmount] = useState(account ? String(account.amount) : '');
  const [type, setType] = useState<KindOfAccountType>(account?.type ?? 'cash');
  const [hidden, setHidden] = useState(account?.hidden ?? false);
  const [failed, setFailed] = useState(false);
  const theme = useTheme();

  const errors = fieldErrors ?? undefined;
  const typeError = getFieldError(errors, 'type');
  const hasInlineError = DISPLAYED_FIELDS.some((field) => getFieldError(errors, field));

  useEffect(() => {
    setName(account?.name ?? '');
    setAmount(account ? String(account.amount) : '');
    setType(account?.type ?? 'cash');
    setHidden(account?.hidden ?? false);
    setFailed(false);
  }, [account]);

  const submit = async () => {
    setFailed(false);
    const result = await onSubmit({
      id: account?.id ?? null,
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      type,
      hidden,
    });
    if (result) onDone();
    else setFailed(true);
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" className="gap-4">
      <View className="gap-4">
        <ModalField
          label="Nombre"
          placeholder="Ej. BBVA"
          value={name}
          onChangeText={setName}
          error={getFieldError(fieldErrors ?? undefined, 'name')}
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
          {typeError ? <Text className="text-[12px] font-semi text-red-400">{typeError}</Text> : null}
        </View>

        <ModalField
          label="Saldo inicial"
          placeholder="$0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          error={getFieldError(fieldErrors ?? undefined, 'amount')}
        />

        <View className="flex-row items-center gap-3 bg-card border border-border-2 rounded-inner px-[14px] py-[13px]">
          <View className="w-[38px] h-[38px] rounded-chip bg-card-2 items-center justify-center">
            <Icon name="eyeoff" size={19} strokeWidth={2.2} color={theme.muted} />
          </View>
          <View className="flex-1 gap-[2px]">
            <Text className="text-[14px] font-semi">Excluir del total</Text>
            <Text className="text-[12px] text-muted">El saldo no se sumará al total de tus cuentas</Text>
          </View>
          <Switch value={hidden} onValueChange={setHidden} />
        </View>

        {failed && !hasInlineError && errorMessage ? (
          <Text className="text-[12px] font-semi text-danger">{errorMessage}</Text>
        ) : null}

        <Button icon="check" block size="lg" loading={loading} onPress={submit}>
          {account ? 'Guardar cambios' : 'Crear cuenta'}
        </Button>
      </View>
    </ScrollView>
  );
}

export default NewAccountForm;
