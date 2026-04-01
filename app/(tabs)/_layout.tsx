import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useTheme } from '@/src/contexts/ThemeContext';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={26} style={{ marginBottom: -3 }} {...props} />;
}

function ThemeToggle() {
  const { colorScheme, toggleTheme } = useTheme();
  return (
    <Pressable
      onPress={toggleTheme}
      style={{ marginRight: 16 }}
      accessibilityRole="button"
      accessibilityLabel="Toggle light/dark mode"
    >
      <FontAwesome
        name={colorScheme === 'dark' ? 'sun-o' : 'moon-o'}
        size={20}
        color={Colors[colorScheme].tint}
      />
    </Pressable>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
        headerRight: () => <ThemeToggle />,
      }}
    >
      <Tabs.Screen
        name='search'
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <TabBarIcon name='search' color={color} />,
        }}
      />

      <Tabs.Screen
        name='watchlist'
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name='bookmark' color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name='watched'
        options={{
          title: 'Watched',
          tabBarIcon: ({ color }) => <TabBarIcon name='check' color={color} />,
        }}
      />
    </Tabs>
  );
}
