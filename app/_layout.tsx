// @@iconify-code-gen
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { initDatabase, testDB } from '@/database';
import * as SQLite from 'expo-sqlite'


export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const [styleLoaded, setStyleLoaded] = useState(false);
  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);
  return <RootLayoutNav />;
}

const db = SQLite.openDatabaseSync("database.db");

function RootLayoutNav() {

  useDrizzleStudio(db)

  return (
    <SQLiteProvider databaseName='database.db' onInit={initDatabase}>
      <GluestackUIProvider mode={'light'}>
        <ThemeProvider value={DefaultTheme}>
          <StatusBar />
          <Stack screenOptions={{ headerShown: false }}>
            {/* <SafeAreaView style={{ flex: 1 }}> */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {/* </SafeAreaView> */}
          </Stack>
        </ThemeProvider>
      </GluestackUIProvider>
    </SQLiteProvider>
  );
}
