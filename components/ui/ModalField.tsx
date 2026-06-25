/**
 * Field + Input — labeled text input. Ported from the `.field`/`.input` styles.
 * Supports an optional error message (for 422 field errors surfaced by hooks).
 */
import { TextInput, type TextInputProps, View } from 'react-native';
import { Text } from './Text';
import { cn } from './cn';
import { useTheme } from '@/styles/useTheme';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

export interface InputProps extends TextInputProps {
  className?: string;
}

/** Standalone styled text input. */
export function Input({ className, ...rest }: InputProps) {
  const t = useTheme();
  return (
    <BottomSheetTextInput
      placeholderTextColor={t.faint}
      className={cn(
        'w-full rounded-inner border border-border-2 bg-card px-3.5 py-3 font-semi text-[15px] text-text',
        className
      )}
      {...rest}
    />
  );
}

export interface FieldProps extends InputProps {
  /** Field label (omit for an unlabeled input). */
  label?: string;
  /** Optional validation error message. */
  error?: string | null;
}

/** Labeled input with optional error text. */
export function ModalField({ label, error, ...rest }: FieldProps) {
  return (
    <View className="gap-[7px]">
      {label ? <Text className="text-[12.5px] font-strong text-muted">{label}</Text> : null}
      <Input {...rest} />
      {error ? <Text className="text-[12px] font-semi text-expense">{error}</Text> : null}
    </View>
  );
}

export default ModalField;
