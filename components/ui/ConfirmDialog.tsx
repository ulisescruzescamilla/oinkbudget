/**
 * ConfirmDialog — shared destructive-action confirmation. Ported from
 * `askConfirm` / `ConfirmHost` in `design/src/ui.jsx` and the `.confirm*`
 * styles in `design/styles.css`.
 *
 * Mount `<ConfirmHost />` once (root layout), then call
 * `askConfirm({ title, message, confirmLabel, onConfirm })` from anywhere.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, View } from 'react-native';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Heading, Text } from './Text';
import { useTheme } from '@/styles/useTheme';

/** Options for a confirmation request. */
export interface ConfirmOptions {
  /** Question shown as the dialog title, e.g. "¿Eliminar la cuenta BBVA?". */
  title: string;
  /** Optional consequence text under the title. */
  message?: string;
  /** Label of the destructive action. Defaults to "Eliminar". */
  confirmLabel?: string;
  /** Label of the dismiss action. Defaults to "Cancelar". */
  cancelLabel?: string;
  /** Glyph in the tinted tile above the title. Defaults to `trash`. */
  icon?: IconName;
  /** Runs after the dialog closes, when the user confirms. */
  onConfirm: () => void;
}

type Listener = (opts: ConfirmOptions) => void;
const listeners = new Set<Listener>();

/**
 * Opens the confirmation dialog rendered by the mounted `ConfirmHost`.
 *
 * @param opts - Title, message, labels and the confirm callback
 */
export function askConfirm(opts: ConfirmOptions): void {
  listeners.forEach((listener) => listener(opts));
}

/** Renders the dialog requested through `askConfirm`. Mount it once, above every screen. */
export function ConfirmHost() {
  const t = useTheme();
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const listener: Listener = (next) => {
      setOpts(next);
      setVisible(true);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [visible, opts, progress]);

  const close = () => setVisible(false);
  const confirm = () => {
    const onConfirm = opts?.onConfirm;
    close();
    onConfirm?.();
  };

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <Pressable
        onPress={close}
        accessibilityLabel="Cerrar"
        className="flex-1 items-center justify-center p-6"
        style={{ backgroundColor: 'rgba(28,20,44,0.48)' }}
      >
        {opts && (
          <Animated.View
            accessibilityRole="alert"
            accessibilityViewIsModal
            style={{ width: '100%', maxWidth: 320, opacity: progress, transform: [{ scale }] }}
          >
            {/* Swallow taps so pressing the card doesn't dismiss through the scrim. */}
            <Pressable
              onPress={() => {}}
              className="items-center gap-1.5 rounded-[26px] bg-card px-5 pb-[18px] pt-6"
              style={{
                shadowColor: '#140a28',
                shadowOffset: { width: 0, height: 24 },
                shadowOpacity: 0.28,
                shadowRadius: 30,
                elevation: 24,
              }}
            >
              <View className="mb-2 h-14 w-14 items-center justify-center rounded-[18px] bg-expense-soft">
                <Icon name={opts.icon ?? 'trash'} size={26} strokeWidth={2.2} color={t.expense} />
              </View>
              <Heading className="text-center text-[18px] tracking-tight">{opts.title}</Heading>
              {opts.message ? (
                <Text className="text-center text-[13.5px] font-semi leading-[20px] text-muted">{opts.message}</Text>
              ) : null}
              <View className="mt-3.5 w-full gap-1">
                <Button variant="danger" block onPress={confirm}>
                  {opts.confirmLabel ?? 'Eliminar'}
                </Button>
                <Button variant="text" block onPress={close}>
                  {opts.cancelLabel ?? 'Cancelar'}
                </Button>
              </View>
            </Pressable>
          </Animated.View>
        )}
      </Pressable>
    </Modal>
  );
}

export default ConfirmHost;
