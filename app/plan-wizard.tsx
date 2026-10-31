import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PlanWizardScreen } from '@/screens/PlanWizardScreen';

/**
 * Plan wizard route — pushed over the tabs from the Budgets screen, so it shows
 * without the tab bar. It sits outside the tab layout, so it brings its own
 * `BottomSheetModalProvider` for the new-account sheet.
 */
export default function PlanWizard() {
  return (
    <BottomSheetModalProvider>
      <PlanWizardScreen />
    </BottomSheetModalProvider>
  );
}
