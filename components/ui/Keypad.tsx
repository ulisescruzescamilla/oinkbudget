/**
 * Keypad — 3-column numeric pad. Ported from the `.keypad` styles in the design.
 * Stateless: the caller decides what each key does to its amount.
 */
import { Pressable, View } from 'react-native';
import { Icon } from './Icon';
import { Text } from './Text';
import { useTheme } from '@/styles/useTheme';

/** Key that renders as a backspace glyph instead of its label. */
export const KEYPAD_DELETE = 'del';

export interface KeypadProps {
  /** Keys in reading order (rows of three). Use `KEYPAD_DELETE` for backspace. */
  keys: string[];
  onPress: (key: string) => void;
}

/** Grid of large amount-entry keys. */
export function Keypad({ keys, onPress }: KeypadProps) {
  const t = useTheme();
  return (
    <View className="flex-row flex-wrap justify-between gap-y-2">
      {keys.map((k) => (
        <Pressable
          key={k}
          onPress={() => onPress(k)}
          accessibilityRole="button"
          accessibilityLabel={k === KEYPAD_DELETE ? 'Borrar' : k}
          className="items-center justify-center rounded-2xl bg-card-2 py-4 active:scale-95 active:bg-primary-soft"
          style={{ width: '32%' }}
        >
          {k === KEYPAD_DELETE ? (
            <Icon name="back" size={20} strokeWidth={2.4} color={t.text} />
          ) : (
            <Text className="font-strong text-[22px]">{k}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

export default Keypad;
