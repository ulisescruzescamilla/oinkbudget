/**
 * SyncStatusIndicator — shows whether the app is running on local data
 * pending sync to the API. Hidden when online with nothing queued; tapping it
 * while offline/pending triggers a manual sync attempt.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { IconButton } from '@/components/ui';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useTheme } from '@/styles/useTheme';

export function SyncStatusIndicator() {
  const t = useTheme();
  const { isOnline, pendingCount, isSyncing, triggerSync } = useSyncStatus();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isSyncing) {
      spin.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [isSyncing, spin]);

  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <IconButton icon={isSyncing ? 'cloudsync' : 'cloudoff'} onPress={isSyncing ? undefined : triggerSync} color={t.danger} />
    </Animated.View>
  );
}

export default SyncStatusIndicator;
