import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../src/config/gameConfig';

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={[styles.tabIcon, { color }]}>{icon}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color }) => <TabIcon icon={'\u25C8'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="draw"
        options={{
          title: 'DRAW',
          tabBarIcon: ({ color }) => <TabIcon icon="/" color={color} />,
        }}
      />
      <Tabs.Screen
        name="battle"
        options={{
          title: 'BATTLE',
          tabBarIcon: ({ color }) => <TabIcon icon={'\u25B7'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'COLLECTION',
          tabBarIcon: ({ color }) => <TabIcon icon={'\u25C6'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'SOCIAL',
          tabBarIcon: ({ color }) => <TabIcon icon={'\u25A1'} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.backgroundCard,
    borderTopColor: 'rgba(0,255,255,0.2)',
    borderTopWidth: 1,
    paddingBottom: 4,
    paddingTop: 4,
    height: 60,
  },
  tabLabel: {
    fontFamily: FONTS.heading,
    fontSize: 9,
    letterSpacing: 1,
  },
  tabIcon: {
    fontSize: 22,
    fontFamily: FONTS.mono,
  },
});
