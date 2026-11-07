import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { session, profile, isLoading } = useAuth();

  // Keep the splash up until we know who is signed in, so there's no flash
  // of the login screen for returning users.
  useEffect(() => {
    if (!isLoading) SplashScreen.hide();
  }, [isLoading]);

  if (isLoading) return null;

  const role = session ? profile?.role : undefined;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'teacher'}>
        <Stack.Screen name="teacher" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'student'}>
        <Stack.Screen name="student" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && role !== 'teacher' && role !== 'student'}>
        <Stack.Screen name="web-only" />
      </Stack.Protected>
      <Stack.Screen name="index" />
    </Stack>
  );
}
