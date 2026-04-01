import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={26} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
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
