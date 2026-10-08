/**
 * QuickAddProvider — navigation state for the quick-add screen (`app/(tabs)/add.tsx`).
 * Exposes `open(mode)` / `edit(tx)` / `close()` to descendants (the FAB in the tab bar, the
 * Dashboard shortcuts and the screen itself) plus the mode it was opened in.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { BalanceType, TypeBalance } from '@/types/BalanceType';

interface QuickAddContextValue {
  /** Mode the quick-add screen was last opened in. */
  mode: TypeBalance;
  /** Movement being edited, or null when the screen is capturing a new one. */
  editing: BalanceType | null;
  /** Navigates to the quick-add screen in the given mode (defaults to expense). */
  open: (mode?: TypeBalance) => void;
  /** Navigates to the quick-add screen to edit an existing movement. */
  edit: (tx: BalanceType) => void;
  /** Leaves the quick-add screen, returning to the tab the user came from. */
  close: () => void;
}

const QuickAddContext = createContext<QuickAddContextValue>({
  mode: 'expense',
  editing: null,
  open: () => { },
  edit: () => { },
  close: () => { },
});

/** Hook to access the quick-add controls. */
export const useQuickAdd = () => useContext(QuickAddContext);

/** Provides the quick-add open/close actions to the tab tree. */
export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mode, setMode] = useState<TypeBalance>('expense');

  const [editing, setEditing] = useState<BalanceType | null>(null);

  const open = useCallback((m: TypeBalance = 'expense') => {
    setEditing(null);
    setMode(m);
    router.navigate('/add');
  }, [router]);

  const edit = useCallback((tx: BalanceType) => {
    setEditing(tx);
    setMode(tx.type);
    router.navigate('/add');
  }, [router]);

  const close = useCallback(() => {
    // The tab navigator keeps a history (`backBehavior="history"`), so going
    // back lands on whichever tab opened the screen.
    if (router.canGoBack()) router.back();
    else router.navigate('/');
  }, [router]);

  const value = useMemo(() => ({ mode, editing, open, edit, close }), [mode, editing, open, edit, close]);

  return <QuickAddContext.Provider value={value}>{children}</QuickAddContext.Provider>;
}

export default QuickAddProvider;
