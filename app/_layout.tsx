import React, { useEffect, useCallback } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from '../src/config/gameConfig';
import { useAuthStore } from '../src/stores/authStore';
import { supabase } from '../src/services/supabase';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, isGuest, needsNickname, initialize, setUser, logout } = useAuthStore();

  const [fontsLoaded] = useFonts({
    'Orbitron': require('../assets/fonts/Orbitron-Regular.ttf'),
    'Orbitron-Bold': require('../assets/fonts/Orbitron-Bold.ttf'),
    'Rajdhani': require('../assets/fonts/Rajdhani-Regular.ttf'),
    'Rajdhani-Bold': require('../assets/fonts/Rajdhani-Bold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Initialize auth on mount
  useEffect(() => {
    initialize();

    // Listen for auth state changes (login/logout/OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Re-initialize to check profile
        initialize();
      } else {
        // Don't logout guest users when Supabase has no session
        const { isGuest } = useAuthStore.getState();
        if (!isGuest) {
          logout();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auth guard: redirect based on auth state
  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not logged in -> show login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && needsNickname) {
      // Logged in but no profile -> nickname setup
      router.replace('/(auth)/nickname');
    } else if (isAuthenticated && !needsNickname && inAuthGroup) {
      // Logged in with profile -> go to app
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, needsNickname, segments, fontsLoaded]);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />
          <Stack.Screen name="(auth)/nickname" />
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="battle/matching" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="battle/summon" options={{ animation: 'fade' }} />
          <Stack.Screen name="battle/fight" options={{ animation: 'fade' }} />
          <Stack.Screen name="battle/result" options={{ animation: 'fade' }} />
          <Stack.Screen name="character/naming" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="character/evolve" options={{ animation: 'fade' }} />
        <Stack.Screen name="character/fusion" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="character/[id]" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
