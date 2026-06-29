/**
 * Pill — small badge. Ported from the `Pill` primitive in `design/src/ui.jsx`.
 */
import { View } from 'react-native';
import { tv, type VariantProps } from 'tailwind-variants';
import { Text } from './Text';

const pill = tv({
  base: 'rounded-pill px-2.5 py-1',
  variants: {
    tone: {
      muted: 'bg-card-2',
      primary: 'bg-primary-soft',
      income: 'bg-income-soft',
      expense: 'bg-expense-soft',
    },
  },
  defaultVariants: { tone: 'muted' },
});

const pillText = tv({
  base: 'text-[11.5px] font-display',
  variants: {
    tone: {
      muted: 'text-muted',
      primary: 'text-primary',
      income: 'text-income',
      expense: 'text-expense',
    },
  },
  defaultVariants: { tone: 'muted' },
});

export interface PillProps extends VariantProps<typeof pill> {
  children: React.ReactNode;
  className?: string;
}

/** Compact status badge with a semantic tone. */
export function Pill({ tone = 'muted', children, className }: PillProps) {
  return (
    <View className={pill({ tone, className })}>
      <Text className={pillText({ tone })}>{children}</Text>
    </View>
  );
}

export default Pill;
