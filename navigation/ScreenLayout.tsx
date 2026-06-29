/**
 * ScreenLayout — common tab-screen scaffold: safe area, AppBar, a scrollable
 * surface with pull-to-refresh, and an optional bottom CTA above the tab bar.
 */
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBar } from './AppBar';
import { useTheme } from '@/styles/useTheme';

export interface ScreenLayoutProps {
  /** AppBar eyebrow label. */
  eyebrow: string;
  /** AppBar title. */
  title: string;
  children: React.ReactNode;
  /** Whether the refresh spinner is active. */
  refreshing?: boolean;
  /** Pull-to-refresh handler. */
  onRefresh?: () => void;
  /** Optional CTA rendered in flow at the bottom of the content. */
  footer?: React.ReactNode;
}

/** Standard scrollable screen with header and refresh control. */
export function ScreenLayout({ eyebrow, title, children, refreshing, onRefresh, footer }: ScreenLayoutProps) {
  const t = useTheme();
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface">
      <AppBar eyebrow={eyebrow} title={title} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 140, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={t.primary} colors={[t.primary]} />
          ) : undefined
        }
      >
        {children}
        {footer ? <View className="mt-1">{footer}</View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default ScreenLayout;
