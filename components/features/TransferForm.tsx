/**
 * TransferForm — moves balance from one account to another. Backs the
 * "Transferir saldo" action of the manage sheet in `design/src/accounts.jsx`.
 * Wires to the `useAccounts` transfer mutation via props, renders per-field 422
 * errors and swaps to a confirmation once the transfer goes through.
 */
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconTile, ModalField, Text } from '@/components/ui';
import { SuccessState } from './SuccessState';
import { AccountType } from '@/types/AccountType';
import { FieldErrors, getFieldError } from '@/utils/errorHandler';
import { cashFormat } from '@/utils/formatting';
import { getAccountTypeStyle } from '@/styles/accounts';
import { useTheme } from '@/styles/useTheme';

export interface TransferFormProps {
  /** Origin account the balance is taken from. */
  from: AccountType;
  /** All accounts; the origin and not-yet-synced ones are excluded from the destination picker. */
  accounts: AccountType[];
  /** Submit handler resolving to whether the transfer succeeded. */
  onSubmit: (from: AccountType, to: AccountType, amount: number) => Promise<boolean>;
  /** Per-field errors from the last failed submit (422 response). */
  fieldErrors: FieldErrors | null;
  /** General error message from the last failed submit (offline, server error…). */
  errorMessage?: string | null;
  loading?: boolean;
}

/** A completed transfer, kept to render the confirmation. */
interface TransferResult {
  to: AccountType;
  amount: number;
}

/**
 * Validates the transfer locally, keyed by the API field names so local and
 * server errors render through the same `getFieldError` lookups.
 *
 * @param from - Origin account
 * @param to - Selected destination account, if any
 * @param amount - Parsed amount to transfer
 * @returns The field errors, or `null` when the transfer is valid
 */
function validateTransfer(from: AccountType, to: AccountType | undefined, amount: number): FieldErrors | null {
  const errors: FieldErrors = {};
  if (!to) errors.account_to = ['Selecciona la cuenta destino'];
  if (amount < 1) errors.amount = ['Ingresa un monto de al menos $1'];
  else if (amount > Number(from.amount)) errors.amount = ['Saldo insuficiente en la cuenta origen'];
  return Object.keys(errors).length > 0 ? errors : null;
}

/** Form for transferring balance between two accounts. */
export function TransferForm({ from, accounts, onSubmit, fieldErrors, errorMessage, loading }: TransferFormProps) {
  const t = useTheme();
  const destinations = accounts.filter((a) => a.id != null && a.id !== from.id);
  const [toId, setToId] = useState<number | null>(destinations.length === 1 ? destinations[0].id : null);
  const [amount, setAmount] = useState('');
  const [localErrors, setLocalErrors] = useState<FieldErrors | null>(null);
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<TransferResult | null>(null);

  const style = getAccountTypeStyle(from.type);
  const errors = localErrors ?? fieldErrors ?? undefined;

  const submit = async () => {
    const to = destinations.find((a) => a.id === toId);
    const value = parseFloat(amount) || 0;
    const invalid = validateTransfer(from, to, value);
    setLocalErrors(invalid);
    setFailed(false);
    if (invalid || !to) return;
    const ok = await onSubmit(from, to, value);
    if (ok) setResult({ to, amount: value });
    else setFailed(true);
  };

  if (result) {
    return (
      <SuccessState
        iconColor={t.income}
        iconBackgroundColor={t.incomeSoft}
        title="Transferencia realizada"
        subtitle={`${cashFormat(result.amount)} · ${from.name} → ${result.to.name}`}
      />
    );
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" className="gap-4">
      <View className="gap-4">
        <View className="flex-row items-center gap-3">
          <IconTile icon={style.icon} bg={style.color} color="#FFFFFF" size={46} />
          <View className="min-w-0 flex-1">
            <Text className="font-strong text-[14.5px]" numberOfLines={1}>
              {from.name}
            </Text>
            <Text className="text-[12.5px] font-semi text-muted">
              {`Disponible · ${cashFormat(Number(from.amount))}`}
            </Text>
          </View>
        </View>

        <View className="gap-[7px]">
          <Text className="text-[12.5px] font-strong text-muted">Cuenta destino</Text>
          {destinations.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {destinations.map((a) => (
                <Chip key={a.id} label={a.name} active={toId === a.id} onPress={() => setToId(a.id)} />
              ))}
            </View>
          ) : (
            <Text className="text-[12px] font-semi text-danger">Necesitas otra cuenta para transferir saldo.</Text>
          )}
          {getFieldError(errors, 'account_to') ? (
            <Text className="text-[12px] font-semi text-expense">{getFieldError(errors, 'account_to')}</Text>
          ) : null}
        </View>

        <ModalField
          label="Monto"
          placeholder="$0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          error={getFieldError(errors, 'amount') ?? getFieldError(errors, 'account_from')}
        />

        {failed && !errors && errorMessage ? (
          <Text className="text-[12px] font-semi text-expense">{errorMessage}</Text>
        ) : null}

        <Button icon="swap" block size="lg" loading={loading} disabled={destinations.length === 0} onPress={submit}>
          Transferir
        </Button>
      </View>
    </ScrollView>
  );
}

export default TransferForm;
