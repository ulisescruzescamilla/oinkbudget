/**
 * SuccessHost — shared success confirmation shown after any create, update or
 * delete. Ported from `notifySuccess` / `SuccessHost` in `design/src/ui.jsx`
 * and the `.done*` styles in `design/styles.css`.
 *
 * Mount `<SuccessHost />` once (root layout), then call
 * `notifySuccess({ title, subtitle, tone })` after a mutation succeeds. It
 * slides up like a sheet and closes on its own after `SUCCESS_DELAY_MS`.
 *
 * Built on `Modal` rather than `Sheet`: the bottom-sheet providers live per
 * route (tabs, categories, plan wizard), so a single host above all of them
 * can't use `BottomSheetModal`.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SuccessState } from './SuccessState';
import { useTheme } from '@/styles/useTheme';

/** How long the confirmation stays on screen, in ms. */
export const SUCCESS_DELAY_MS = 900;

/** Accent of the check circle: `primary` for create/update, `expense` for delete. */
export type SuccessTone = 'primary' | 'income' | 'expense';

/** Options for a success confirmation. */
export interface SuccessOptions {
  /** Entity + action, e.g. "Cuenta creada". */
  title: string;
  /** Optional detail line, e.g. "$1,200.00 · BBVA". */
  subtitle?: string;
  /** Defaults to `primary`. */
  tone?: SuccessTone;
}

type Listener = (opts: SuccessOptions) => void;
const listeners = new Set<Listener>();

/**
 * Shows the success confirmation rendered by the mounted `SuccessHost`.
 *
 * @param opts - Title, detail line and tone
 */
export function notifySuccess(opts: SuccessOptions): void {
  listeners.forEach((listener) => listener(opts));
}

/** Renders the confirmation requested through `notifySuccess`. Mount it once, above every screen. */
export function SuccessHost() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [opts, setOpts] = useState<SuccessOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const listener: Listener = (next) => {
      setOpts(next);
      setVisible(true);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setVisible(false);
    });
  };

  // Re-runs for every new confirmation, restarting the auto-close timer.
  useEffect(() => {
    if (!visible || !opts) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: 280,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(hide, SUCCESS_DELAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, opts]);

  const tone = opts?.tone ?? 'primary';
  const colors = {
    primary: [t.primary, t.primarySoft],
    income: [t.income, t.incomeSoft],
    expense: [t.expense, t.expenseSoft],
  }[tone];
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [320, 0] });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={hide}
    >
      <Animated.View
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(20,10,40,0.38)', opacity: progress }}
      >
        <Pressable className="flex-1" onPress={hide} accessibilityLabel="Cerrar" />
      </Animated.View>
      {opts && (
        <Animated.View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 18,
            paddingTop: 10,
            paddingBottom: insets.bottom + 22,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: t.card,
            transform: [{ translateY }],
          }}
        >
          <View className="items-center">
            <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: t.border2 }} />
          </View>
          <SuccessState
            iconColor={colors[0]}
            iconBackgroundColor={colors[1]}
            title={opts.title}
            subtitle={opts.subtitle}
          />
        </Animated.View>
      )}
    </Modal>
  );
}

export default SuccessHost;
