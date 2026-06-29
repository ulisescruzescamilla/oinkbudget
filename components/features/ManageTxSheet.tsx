/**
 * ManageTxSheet — transaction detail sheet with edit/delete actions.
 * Ported from `ManageTx` in `design/src/transactions.jsx`.
 */
import { View } from 'react-native';
import { Button, IconTile, Sheet, Text } from '@/components/ui';
import { BalanceType } from '@/types/BalanceType';
import { signedCash } from '@/utils/formatting';
import { balanceSignedAmount } from './TransactionRow';
import { useTheme } from '@/styles/useTheme';

export interface ManageTxSheetProps {
  /** Selected transaction, or null when closed. */
  tx: BalanceType | null;
  onClose: () => void;
  onDelete?: (tx: BalanceType) => void;
}

/** Detail rows for a transaction. */
function detailRows(tx: BalanceType): [string, string][] {
  const income = tx.type === 'income';
  return [
    ['Categoría', tx.budget_name || (income ? 'Ingreso' : 'Otro')],
    ['Cuenta', tx.account_name],
    ['Fecha', new Date(tx.created_at).toLocaleDateString('es-MX')],
    ['Tipo', income ? 'Ingreso' : 'Gasto'],
  ];
}

/** Bottom sheet showing a transaction's details. */
export function ManageTxSheet({ tx, onClose, onDelete }: ManageTxSheetProps) {
  const t = useTheme();
  const signed = tx ? balanceSignedAmount(tx) : 0;
  const income = signed > 0;
  const category = tx ? tx.budget_name || (income ? 'Ingreso' : 'Otro') : 'Otro';

  return (
    <Sheet open={!!tx} onClose={onClose} title="Detalle">
      {tx && (
        <View>
          <View className="items-center pb-4 pt-1">
            <View className="mb-3">
              <IconTile category={category} size={60} />
            </View>
            <Text className="font-display text-[36px]" style={{ color: income ? t.income : t.text }}>
              {signedCash(signed)}
            </Text>
            <Text className="mt-1 font-display text-base">{tx.description || category}</Text>
          </View>

          <View className="mb-4 rounded-inner bg-card-2 px-3.5">
            {detailRows(tx).map(([k, v], i, arr) => (
              <View
                key={k}
                className="flex-row items-center justify-between py-3"
                style={i < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: t.border } : undefined}
              >
                <Text className="text-[13px] font-strong text-muted">{k}</Text>
                <Text className="font-display text-[14px]">{v}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row gap-2.5">
            <Button variant="soft" icon="edit" block onPress={onClose} className="flex-1">
              Editar
            </Button>
            <Button
              variant="danger-soft"
              icon="trash"
              block
              className="flex-1"
              onPress={() => {
                onDelete?.(tx);
                onClose();
              }}
            >
              Eliminar
            </Button>
          </View>
        </View>
      )}
    </Sheet>
  );
}

export default ManageTxSheet;
