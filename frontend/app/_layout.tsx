// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ignoreLogs } from '../src/utils/ignoreLogs';

// Initialize log suppression
ignoreLogs();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(work)" options={{ headerShown: false }} />
        <Stack.Screen name="(finance)" options={{ headerShown: false }} />
        <Stack.Screen name="(health)" options={{ headerShown: false }} />
        <Stack.Screen name="(family)" options={{ headerShown: false }} />
        <Stack.Screen name="(goals)" options={{ headerShown: false }} />
        <Stack.Screen name="(social)" options={{ headerShown: false }} />
        <Stack.Screen name="(blog)" options={{ headerShown: false }} />
        <Stack.Screen name="(games)" options={{ headerShown: false }} />
        <Stack.Screen name="(shopping)" options={{ headerShown: false }} />
        <Stack.Screen name="(reminders)" options={{ headerShown: false }} />
        <Stack.Screen name="personal-info" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}