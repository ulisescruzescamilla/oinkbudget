import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { RecurrentBudgetsScreen } from '@/screens/RecurrentBudgetsScreen';

/**
 * Recurrent budgets route — pushed over the tabs from the settings drawer, so
 * it shows without the tab bar. It sits outside the tab layout, so it brings
 * its own `BottomSheetModalProvider` for the form sheet.
 */
export default function RecurrentBudgets() {
  return (
    <BottomSheetModalProvider>
      <RecurrentBudgetsScreen />
    </BottomSheetModalProvider>
  );
}
