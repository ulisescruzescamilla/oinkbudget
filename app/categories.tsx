import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { CategoriesScreen } from '@/screens/CategoriesScreen';

/**
 * Categories route — pushed over the tabs from the settings drawer, so it shows
 * without the tab bar. It sits outside the tab layout, so it brings its own
 * `BottomSheetModalProvider` for the category form sheet.
 */
export default function Categories() {
  return (
    <BottomSheetModalProvider>
      <CategoriesScreen />
    </BottomSheetModalProvider>
  );
}
