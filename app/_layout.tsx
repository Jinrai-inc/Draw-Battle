import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../src/config/gameConfig';
import { useAuthStore } from '../src/stores/authStore';
import { supabase } from '../src/services/supabase';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, needsNickname, initialize, setUser, logout } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initialize();

    // Listen for auth state changes (login/logout/OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Re-initialize to check profile
        initialize();
      } else {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auth guard: redirect based on auth state
  useEffect(() => {
    if (isLoading) return;

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
  }, [isAuthenticated, isLoading, needsNickname, segments]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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
      </Stack>
    </View>
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
