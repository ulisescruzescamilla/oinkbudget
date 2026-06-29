import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { Heading, Text } from '@/components/ui';

/** Fallback screen for unmatched routes. */
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '¡Ups!' }} />
      <View className="flex-1 items-center justify-center gap-2 bg-surface px-6">
        <Heading size="md">Esta pantalla no existe.</Heading>
        <Link href="/">
          <Text className="font-bold text-primary">Volver al inicio</Text>
        </Link>
      </View>
    </>
  );
}
