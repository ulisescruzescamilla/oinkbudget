/**
 * TransactionRow — a single movement row (icon, description, meta, signed amount).
 * Ported from the `.row` markup in `design/src/{dashboard,transactions}.jsx`.
 * Consumes a denormalized `BalanceType` from the local balances log.
 */
import { Pressable, View } from 'react-native';
import { IconTile, Text } from '@/components/ui';
import { BalanceType } from '@/types/BalanceType';
import { signedCash } from '@/utils/formatting';
import { useTheme } from '@/styles/useTheme';

export interface TransactionRowProps {
  item: BalanceType;
  /** Secondary meta line: show the account + budget, or account + time. */
  subtitle?: string;
  onPress?: () => void;
}

/** Signed amount for a balance entry (expenses are negative). */
export const balanceSignedAmount = (item: BalanceType): number =>
  item.type === 'expense' ? -Math.abs(item.amount) : Math.abs(item.amount);

/** Single transaction list row. */
export function TransactionRow({ item, subtitle, onPress }: TransactionRowProps) {
  const t = useTheme();
  const signed = balanceSignedAmount(item);
  const income = signed > 0;
  const category = item.type || (income ? 'Ingreso' : 'Otro');

  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 px-[18px] py-3 active:bg-card-2">
      <IconTile icon={item.type === 'expense' ? 'minus' : 'plus'} color={item.type === 'expense' ? 'red' : 'green'} />
      <View className="min-w-0 flex-1">
        <Text className="font-strong text-[14.5px]" numberOfLines={1}>
          {item.description}
        </Text>
        <Text className="mt-0.5 text-[12.5px] font-semi text-muted" numberOfLines={1}>
          {subtitle ?? (
            <View className='flex flex-row items-center gap-2'>
              <Text>{item.account_name}</Text>
              <View className="h-[5px] w-[5px] rounded-full bg-faint" />
              {/* Time get formatted from backend */}
              <Text>{item.created_at.split(' ')[1] ?? item.created_at}</Text>
            </View>
          )}
        </Text>
      </View>
      <Text
        className="font-display text-[15px]"
        style={{ color: income ? t.income : t.text }}
      >
        {signedCash(signed)}
      </Text>
    </Pressable >
  );
}

export default TransactionRow;
