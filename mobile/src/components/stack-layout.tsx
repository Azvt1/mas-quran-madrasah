import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

/** Stack for a tab: the list screen has no header, detail screens get a native one. */
export function TabStack() {
  const c = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTintColor: c.tint,
        headerStyle: { backgroundColor: c.background },
        headerTitleStyle: { color: c.text },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: c.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
