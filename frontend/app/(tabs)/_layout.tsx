import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';

const PURPLE = '#6C63FF';

export default function TabsLayout() {
  usePushNotifications();
  const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const mode = useThemeStore((s) => s.mode);
  const resolved = resolveTheme(mode, systemScheme);
  const isDark = resolved === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#A5B4FC' : PURPLE,
        tabBarInactiveTintColor: isDark ? '#94A3B8' : '#9BA1A6',
        tabBarStyle: {
          backgroundColor: isDark ? '#0F172A' : '#fff',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#1E293B' : '#F0F0F0',
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finans',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Sağlık',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Blog',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menü',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
