/**
 * SideMenu — settings drawer that slides in from the right over a dimmed scrim.
 * Ported from `SideMenu` + the `.drawer*` styles in `design/src/app.jsx` /
 * `design/styles.css`.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brandmark, Heading, Icon, IconButton, Muted, Switch, Text, type IconName } from '@/components/ui';
import { useTheme } from '@/styles/useTheme';

/** One row in the drawer. Rows with `toggle` render a switch instead of a chevron. */
export interface SideMenuItem {
  id: string;
  icon: IconName;
  label: string;
  /** Secondary line under the label. */
  sub?: string;
  /** Current switch state; omit for navigation rows. */
  toggle?: boolean;
  onPress: () => void;
}

export interface SideMenuProps {
  open: boolean;
  onClose: () => void;
  items: SideMenuItem[];
}

const DURATION = 300;

/** Right-side settings drawer. */
export function SideMenu({ open, onClose, items }: SideMenuProps) {
  const t = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(screenWidth * 0.84, 320);
  const progress = useRef(new Animated.Value(0)).current;
  // Keep the modal mounted until the close animation finishes.
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) setVisible(true);
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: DURATION,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !open) setVisible(false);
    });
  }, [open, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [width * 1.04, 0],
  });

  return (
    // Translucent system bars let the scrim dim the full screen; the SafeAreaView
    // keeps the drawer between the status and navigation bars.
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(20,10,40,0.38)',
          opacity: progress,
        }}
      >
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Cerrar ajustes" />
      </Animated.View>
      <SafeAreaView
        edges={['top', 'bottom']}
        pointerEvents="box-none"
        className="absolute inset-0 flex-row justify-end"
      >
        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel="Ajustes"
          className="gap-1.5 bg-surface px-3.5"
          style={{
            width,
            paddingTop: 14,
            paddingBottom: 20,
            borderTopLeftRadius: 28,
            borderBottomLeftRadius: 28,
            shadowColor: '#140a28',
            shadowOffset: { width: -12, height: 0 },
            shadowOpacity: 0.18,
            shadowRadius: 20,
            elevation: 24,
            transform: [{ translateX }],
          }}
        >
          <View className="flex-row items-center gap-2.5 px-1 pb-3">
            <Brandmark />
            <Heading className="flex-1 text-[20px] tracking-tight">Ajustes</Heading>
            <IconButton icon="close" onPress={onClose} accessibilityLabel="Cerrar" />
          </View>
          <View className="gap-1.5">
            {items.map((it) => (
              <Pressable
                key={it.id}
                onPress={it.onPress}
                accessibilityRole={it.toggle !== undefined ? 'switch' : 'button'}
                accessibilityState={it.toggle !== undefined ? { checked: it.toggle } : undefined}
                className="w-full flex-row items-center gap-3 rounded-inner bg-card p-3 active:scale-[0.985] active:bg-card-2"
              >
                <View className="h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-primary-soft">
                  <Icon name={it.icon} size={19} strokeWidth={2.1} color={t.primary} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-display text-[14.5px]">{it.label}</Text>
                  {it.sub ? <Muted className="mt-0.5 text-[12px] leading-[16px]">{it.sub}</Muted> : null}
                </View>
                {it.toggle !== undefined ? (
                  <View pointerEvents="none">
                    <Switch value={it.toggle} onValueChange={() => {}} />
                  </View>
                ) : (
                  <Icon name="chev" size={18} color={t.faint} />
                )}
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

export default SideMenu;
