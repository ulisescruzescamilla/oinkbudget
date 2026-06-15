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
  children: React.ReactNode;
}

/** Controlled modal bottom sheet with dynamic height. */
export function Sheet({ open, onClose, title, right, children }: SheetProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (open) ref.current?.present();
    else ref.current?.dismiss();
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
      enableDynamicSizing
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: t.border2, width: 38, height: 4 }}
      backgroundStyle={{ backgroundColor: t.card, borderRadius: 28 }}
    >
      <BottomSheetView style={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 22, paddingTop: 4 }}>
        {(title || right) && (
          <View className="mb-4 flex-row items-center justify-between">
            <Heading size="md" className="text-[19px]">
              {title}
            </Heading>
            {right ?? (
              <Pressable
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-card"
              >
                <Icon name="close" size={20} color={t.text} />
              </Pressable>
            )}
          </View>
        )}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

export default Sheet;
