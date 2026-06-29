/**
 * Typography primitives. Replace the old Gluestack `text`/`heading` wrappers.
 * Default to the body font + primary text color; override via `className`.
 */
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from './cn';

export interface TextProps extends RNTextProps {
  className?: string;
}

/** Body text. */
export function Text({ className, ...rest }: TextProps) {
  return <RNText className={cn('font-body text-text', className)} {...rest} />;
}

/** Muted/secondary text. */
export function Muted({ className, ...rest }: TextProps) {
  return <RNText className={cn('font-semi text-muted', className)} {...rest} />;
}

export interface HeadingProps extends TextProps {
  /** Visual size of the heading. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const HEADING_SIZES: Record<NonNullable<HeadingProps['size']>, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

/** Display heading (extra-bold). */
export function Heading({ size = 'md', className, ...rest }: HeadingProps) {
  return (
    <RNText
      className={cn('font-display text-text', HEADING_SIZES[size], className)}
      {...rest}
    />
  );
}

export default Text;
