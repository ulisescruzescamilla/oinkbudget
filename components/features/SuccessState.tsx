/**
 * SuccessState — centered confirmation block: an icon in a colored circle,
 * a title, and an optional subtitle. Used for sheet success screens.
 */
import { View } from 'react-native';
import { Icon, Text, type IconName } from '@/components/ui';

export interface SuccessStateProps {
  /** Icon shown in the circle. Defaults to a checkmark. */
  icon?: IconName;
  iconColor: string;
  iconBackgroundColor: string;
  title: string;
  subtitle?: string;
}

/** Centered success confirmation with an icon, title, and optional subtitle. */
export function SuccessState({ icon = 'check', iconColor, iconBackgroundColor, title, subtitle }: SuccessStateProps) {
  return (
    <View className="items-center gap-3 py-8">
      <View
        className="h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: iconBackgroundColor }}
      >
        <Icon name={icon} size={30} strokeWidth={2.6} color={iconColor} />
      </View>
      <Text className="font-display text-[19px]">{title}</Text>
      {subtitle ? <Text className="text-[14px] font-semi text-muted">{subtitle}</Text> : null}
    </View>
  );
}

export default SuccessState;
