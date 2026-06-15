import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/navigation/CustomTabBar';
import { QuickAddProvider } from '@/navigation/QuickAddProvider';

/**
 * Tab navigator: hides the default header/tab bar and renders the custom
 * Aurora tab bar with a central quick-add FAB. Wrapped in QuickAddProvider so
 * the FAB and the Dashboard shortcuts share one capture sheet.
 */
export default function TabLayout() {
  return (
    <QuickAddProvider>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="history" />
        <Tabs.Screen name="accounts" />
        <Tabs.Screen name="budgets" />
      </Tabs>
    </QuickAddProvider>
  );
}
