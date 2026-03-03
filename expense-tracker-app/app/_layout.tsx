import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { getSupabase } from '../db';

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        supabase.auth.onAuthStateChange((_event: any, session: any) => {
          setSession(session);
        });
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsReady(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const inAuthGroup = segments[0] === '(tabs)';

    if (!session && inAuthGroup) {
      router.replace('/login');
    } else if (session && segments[0] === 'login') {
      router.replace('/(tabs)');
    }
  }, [session, segments, isReady, router]);

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
