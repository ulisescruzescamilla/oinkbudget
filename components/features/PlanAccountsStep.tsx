/**
 * PlanAccountsStep — step 2 of the plan wizard: which accounts fund the plan.
 * Ported from `StepCuentas` in `design/src/wizard-steps.jsx`.
 */
import { Pressable, View } from 'react-native';
import { Icon, IconTile, OptionCard, Text } from '@/components/ui';
import { AccountType } from '@/types/AccountType';
import { cashFormat } from '@/utils/formatting';
import { getAccountTypeStyle } from '@/styles/accounts';
import { useTheme } from '@/styles/useTheme';

export interface PlanAccountsStepProps {
  accounts: AccountType[];
  /** Whether an account is part of the plan. */
  isSelected: (account: AccountType) => boolean;
  onToggle: (account: AccountType) => void;
  /** Combined balance of the selected accounts. */
  total: number;
  /** Opens the new-account form. */
  onAddAccount: () => void;
}

/** Toggle list of the user's accounts plus a shortcut to create one. */
export function PlanAccountsStep({ accounts, isSelected, onToggle, total, onAddAccount }: PlanAccountsStepProps) {
  const t = useTheme();
  const count = accounts.filter(isSelected).length;
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between rounded-inner bg-primary-soft px-4 py-3.5">
        <Text className="text-[12.5px] font-strong text-primary">
          {count} {count === 1 ? 'cuenta' : 'cuentas'} en este plan
        </Text>
        <Text className="font-display text-[19px] text-primary">{cashFormat(total)}</Text>
      </View>

      {accounts.map((a) => {
        const style = getAccountTypeStyle(a.type);
        const selected = isSelected(a);
        return (
          <OptionCard
            key={a.id ?? a.client_id}
            compact
            role="checkbox"
            title={a.name}
            subtitle={`${style.label} · ${cashFormat(Number(a.amount))}`}
            selected={selected}
            onPress={() => onToggle(a)}
            leading={
              <IconTile
                icon={style.icon}
                size={42}
                bg={selected ? style.color : undefined}
                color={selected ? '#FFFFFF' : undefined}
              />
            }
          />
        );
      })}

      <Pressable
        onPress={onAddAccount}
        accessibilityRole="button"
        className="flex-row items-center gap-3.5 rounded-inner border-[1.5px] border-dashed border-border-2 px-3.5 py-[13px] active:scale-[0.985] active:bg-primary-soft"
      >
        <View className="h-[42px] w-[42px] items-center justify-center rounded-[13px] bg-card-2">
          <Icon name="plus" size={20} strokeWidth={2.6} color={t.muted} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-display text-[15px]">Crear cuenta nueva</Text>
          <Text className="mt-0.5 text-[12.5px] font-semi text-muted">
            Agrega una cuenta que aún no tengas registrada
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export default PlanAccountsStep;
