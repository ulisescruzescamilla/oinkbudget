/**
 * Sheet — controlled bottom sheet built on `@gorhom/bottom-sheet`.
 * Mirrors the design's `Sheet` primitive (grab handle + optional header).
 * Drive it with the `open` boolean; `onClose` fires when dismissed.
 */
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { Heading } from './Text';
import { useTheme } from '@/styles/useTheme';

export interface SheetProps {
  /** Whether the sheet is visible. */
  open: boolean;
  /** Called when the sheet is dismissed (swipe down, backdrop tap, close button). */
  onClose: () => void;
  /** Optional header title. */
  title?: string;
  /** Optional custom right-side header content (defaults to a close button). */
  right?: React.ReactNode;
  /** Fixed snap points (e.g. `['100%']`). When omitted, the sheet sizes itself to its content. */
  snapPoints?: (string | number)[];
  children: React.ReactNode;
}

/** Controlled modal bottom sheet. Sizes to content by default, or to `snapPoints` when given. */
export function Sheet({ open, onClose, title, right, snapPoints, children }: SheetProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);
  const hasPresented = useRef(false);

  useEffect(() => {
    if (open) {
      ref.current?.present();
      hasPresented.current = true;
    } else if (hasPresented.current) {
      // Only dismiss once we've actually presented — calling dismiss()
      // before the first present() can leave the modal unable to open later.
      // ref.current?.dismiss();
    }
  }, [open]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onClose}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      topInset={insets.top}
      enableDynamicSizing={!snapPoints}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: t.border2, width: 38, height: 4 }}
      backgroundStyle={{ backgroundColor: t.card, borderRadius: 28 }}
    >
      <BottomSheetView
        style={{
          paddingHorizontal: 18,
          paddingBottom: insets.bottom + 22,
          paddingTop: 4,
          ...(snapPoints ? { flex: 1 } : null),
        }}
      >
        {(title || right) && (
          <View className="mb-4 flex-row items-center justify-between">
            <Heading size="md" className="text-[19px]">
              {title}
            </Heading>
          </View>
        )}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

export default Sheet;
