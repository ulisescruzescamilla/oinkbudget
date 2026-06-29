/**
 * Card — ported from the `.card` / `.card.hero` / `.card.flush` styles in
 * `design/styles.css`. The hero variant paints the violet brand gradient.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View, type ViewProps } from 'react-native';
import { cn } from './cn';
import { Icon } from './Icon';
import { Heading, Text } from './Text';
import { useTheme } from '@/styles/useTheme';

export interface CardProps extends ViewProps {
  /** Paint the violet hero gradient with white content. */
  hero?: boolean;
  /** Remove internal padding (for full-bleed lists). */
  flush?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/** Surface container with rounded corners, border and soft shadow. */
export function Card({ hero, flush, className, children, ...rest }: CardProps) {
  const t = useTheme();
  const radiusPad = cn('rounded-card', flush ? 'overflow-hidden' : 'p-[18px]');

  if (hero) {
    return (
      <View className={cn(radiusPad, 'overflow-hidden shadow-card', className)} {...rest}>
        <LinearGradient
          colors={t.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ ...StyleAbsoluteFill }}
        />
        {children}
      </View>
    );
  }

  return (
    <View
      className={cn(radiusPad, 'bg-card border border-border shadow-card', className)}
      {...rest}
    >
      {children}
    </View>
  );
}

const StyleAbsoluteFill = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

export interface CardHeaderProps {
  /** Section title (muted uppercase-ish label). */
  title: string;
  /** Optional right-side content (e.g. a Pill). */
  right?: React.ReactNode;
  /** Optional "see all" style link; renders a chevron and calls `onPress`. */
  linkLabel?: string;
  onLinkPress?: () => void;
  className?: string;
}

/** Card header row: title on the left, optional pill or link on the right. */
export function CardHeader({ title, right, linkLabel, onLinkPress, className }: CardHeaderProps) {
  const t = useTheme();
  return (
    <View className={cn('flex-row items-center justify-between mb-3.5', className)}>
      <Heading size="sm" className="text-[14.5px] text-muted">
        {title}
      </Heading>
      {linkLabel ? (
        <Pressable className="flex-row items-center gap-0.5" onPress={onLinkPress}>
          <Text className="text-[13px] font-strong text-primary">{linkLabel}</Text>
          <Icon name="chev" size={15} strokeWidth={2.4} color={t.primary} />
        </Pressable>
      ) : (
        right
      )}
    </View>
  );
}

export default Card;
