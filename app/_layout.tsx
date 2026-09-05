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
import * as SQLite from 'expo-sqlite';
import { SQLiteProvider } from 'expo-sqlite';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { initDatabase } from '@/database';
import { getNavTheme } from '@/navigation/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

const db = SQLite.openDatabaseSync('database.db');

/**
 * Root layout: loads fonts, initializes SQLite, and wires the global providers
 * (gesture handler, bottom sheets, safe area, navigation theme).
 */
export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { colorScheme } = useColorScheme();
  useDrizzleStudio(db);

  return (
    <SQLiteProvider databaseName="database.db" onInit={initDatabase}>
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
    </SQLiteProvider>
  );
}
