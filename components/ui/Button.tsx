/**
 * Button — ported from the `.btn*` styles in `design/styles.css`.
 *
 * Variants:
 *  - `primary`      main call-to-action (violet, elevated)
 *  - `ghost`        secondary / neutral (card surface + outline)
 *  - `soft`         tinted violet
 *  - `danger-soft`  tinted destructive
 */
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';
import { tv, type VariantProps } from 'tailwind-variants';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useTheme } from '@/styles/useTheme';

const button = tv({
  base: 'flex-row items-center justify-center gap-2 rounded-pill active:scale-[0.97]',
  variants: {
    variant: {
      primary: 'bg-primary shadow-btn',
      ghost: 'bg-card border border-border-2',
      soft: 'bg-primary-soft',
      'danger-soft': 'bg-expense-soft',
    },
    size: {
      md: 'px-5 py-3.5',
      lg: 'px-5 py-4',
    },
    block: { true: 'w-full' },
    disabled: { true: 'opacity-50' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

const label = tv({
  base: 'font-strong',
  variants: {
    variant: {
      primary: 'text-on-primary',
      ghost: 'text-text',
      soft: 'text-primary',
      'danger-soft': 'text-expense',
    },
    size: { md: 'text-[15px]', lg: 'text-base' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

type Variant = NonNullable<VariantProps<typeof button>['variant']>;

export interface ButtonProps extends Omit<PressableProps, 'children' | 'disabled'> {
  /** Button label. */
  children: React.ReactNode;
  variant?: Variant;
  size?: 'md' | 'lg';
  /** Stretch to fill the available width. */
  block?: boolean;
  /** Optional leading icon. */
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Maps each variant to the matching icon/label color from the active palette. */
function useVariantColor(variant: Variant): string {
  const t = useTheme();
  switch (variant) {
    case 'primary':
      return t.onPrimary;
    case 'soft':
      return t.primary;
    case 'danger-soft':
      return t.expense;
    default:
      return t.text;
  }
}

/** Pressable button with design-system variants. */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  block,
  icon,
  loading,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const color = useVariantColor(variant);
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={button({ variant, size, block, disabled: isDisabled, className })}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Icon name={icon} size={20} strokeWidth={2.4} color={color} /> : null}
          {typeof children === 'string' ? (
            <Text className={label({ variant, size })}>{children}</Text>
          ) : (
            children
          )}
        </View>
      )}
    </Pressable>
  );
}

export default Button;
