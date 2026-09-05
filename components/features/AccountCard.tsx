/**
 * AccountCard — one account with masked balance, quick actions and a
 * share-of-total bar. Ported from `design/src/accounts.jsx`.
 */
import { View } from 'react-native';
import { Card, IconButton, IconTile, Text } from '@/components/ui';
import { AccountType } from '@/types/AccountType';
import { cashFormat } from '@/utils/formatting';
import { getAccountTypeStyle } from '@/styles/accounts';

export interface AccountCardProps {
  account: AccountType;
  /** Total across all accounts, for the share bar. */
  total: number;
  /** Whether to mask the balance. */
  masked: boolean;
  onToggleMask: () => void;
  onManage: () => void;
}

/** Card showing a single account's balance and its share of the total. */
export function AccountCard({ account, total, masked, onToggleMask, onManage }: AccountCardProps) {
  const style = getAccountTypeStyle(account.type);
  const share = total > 0 ? Math.max(0, (account.amount / total) * 100) : 0;

  return (
    <Card className="p-[15px]">
      <View className="flex-row items-center gap-3">
        <IconTile icon={style.icon} bg={style.color} color="#FFFFFF" size={46} />
        <View className="min-w-0 flex-1">
          <Text className="font-strong text-[14.5px]" numberOfLines={1}>
            {account.name}
          </Text>
          <Text className="text-[12.5px] font-semi text-muted">{style.label}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text className="font-display text-base">
            {masked ? '••••' : cashFormat(account.amount)}
          </Text>
          <IconButton
            icon={masked ? 'eyeoff' : 'eye'}
            size={34}
            iconSize={17}
            onPress={onToggleMask}
            className="bg-card-2 border-0 shadow-none"
          />
          <IconButton
            icon="dots"
            size={34}
            iconSize={18}
            onPress={onManage}
            className="bg-card-2 border-0 shadow-none"
          />
        </View>
      </View>
      <View className="mt-3 h-1.5 overflow-hidden rounded-pill bg-card-2">
        <View className="h-full rounded-pill" style={{ width: `${share}%`, backgroundColor: style.color }} />
      </View>
    </Card>
  );
}

export default AccountCard;
