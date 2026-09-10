import { useCallback, useEffect, useState } from 'react';
import { getSyncStatus, runSync, subscribeSyncStatus, type SyncStatus } from '@/services/syncService';

const INITIAL_STATUS: SyncStatus = {
  isOnline: true,
  pendingCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  lastError: null,
};

/** Exposes the offline/sync status for the UI indicator, plus a manual sync trigger. */
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(INITIAL_STATUS);

  useEffect(() => {
    getSyncStatus().then(setStatus);
    return subscribeSyncStatus(setStatus);
  }, []);

  const triggerSync = useCallback(() => {
    void runSync();
  }, []);

  return { ...status, triggerSync };
}
