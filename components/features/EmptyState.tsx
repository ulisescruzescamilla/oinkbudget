/**
 * EmptyState — centered empty/placeholder block. Ported from the `.empty` styles.
 */
import { View } from 'react-native';
import { Icon, type IconName, Text } from '@/components/ui';
import { useTheme } from '@/styles/useTheme';

export interface EmptyStateProps {
  /** Icon shown in the rounded tile. */
  icon: IconName;
  /** Message text. */
  message: string;
}

/** Friendly empty-state message with an icon. */
export function EmptyState({ icon, message }: EmptyStateProps) {
  const t = useTheme();
  return (
    <View className="items-center px-5 py-10">
      <View className="mb-3.5 h-16 w-16 items-center justify-center rounded-[22px] bg-primary-soft">
        <Icon name={icon} size={28} color={t.primary} />
      </View>
      <Text className="max-w-[220px] text-center text-sm font-semi text-muted">{message}</Text>
    </View>
  );
}

export default EmptyState;
