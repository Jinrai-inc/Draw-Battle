import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../src/config/gameConfig';
import { useLanguageStore } from '../../src/stores/languageStore';

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={[styles.tabIcon, { color }]}>{icon}</Text>;
}

export default function TabLayout() {
  const t = useLanguageStore((s) => s.t);

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
          title: t('tab_home'),
          tabBarIcon: ({ color }) => <TabIcon icon={'\u25C8'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="draw"
        options={{
          title: t('tab_draw'),
          tabBarIcon: ({ color }) => <TabIcon icon="/" color={color} />,
        }}
      />
      <Tabs.Screen
        name="battle"
        options={{
          title: t('tab_battle'),
          tabBarIcon: ({ color }) => <TabIcon icon={'\u25B7'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: t('tab_collection'),
          tabBarIcon: ({ color }) => <TabIcon icon={'\u25C6'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: t('tab_social'),
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
    fontFamily: FONTS.body,
    fontSize: 10,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 22,
  },
});
