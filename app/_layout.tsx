import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../src/config/gameConfig';

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="battle/matching" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="battle/summon" options={{ animation: 'fade' }} />
        <Stack.Screen name="battle/fight" options={{ animation: 'fade' }} />
        <Stack.Screen name="battle/result" options={{ animation: 'fade' }} />
        <Stack.Screen name="character/naming" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
