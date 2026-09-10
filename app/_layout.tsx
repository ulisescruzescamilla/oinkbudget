import '@/global.css';

import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import type * as SQLite from 'expo-sqlite';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { getDBConnection, initDatabase } from '@/database';
import { initNetworkStatus } from '@/utils/networkStatus';
import { initAutoSync } from '@/services/syncService';
import { getNavTheme } from '@/navigation/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

/**
 * Root layout: loads fonts, opens the shared SQLite connection and runs
 * migrations, and wires the global providers (gesture handler, bottom
 * sheets, safe area, navigation theme).
 */
export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    (async () => {
      await initDatabase();
      setDb(await getDBConnection());
    })();
  }, []);

  useEffect(() => {
    if (loaded && db) SplashScreen.hideAsync();
  }, [loaded, db]);

  if (!loaded || !db) return null;

  return <RootLayoutNav db={db} />;
}

function RootLayoutNav({ db }: { db: SQLite.SQLiteDatabase }) {
  const { colorScheme } = useColorScheme();
  useDrizzleStudio(db);

  useEffect(() => {
    const stopNetworkStatus = initNetworkStatus();
    const stopAutoSync = initAutoSync();
    return () => {
      stopNetworkStatus();
      stopAutoSync();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={getNavTheme(colorScheme)}>
          <StatusBar
            barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
          />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
