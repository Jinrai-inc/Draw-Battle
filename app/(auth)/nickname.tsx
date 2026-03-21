import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../src/config/gameConfig';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { CyberInput } from '../../src/components/cyber/CyberInput';
import { GlowText } from '../../src/components/cyber/GlowText';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { supabase } from '../../src/services/supabase';
import { createUserProfile } from '../../src/services/authService';
import { useAuthStore, mapDbUser } from '../../src/stores/authStore';

export default function NicknameScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 3 || trimmed.length > 12) {
      Alert.alert('', '\u30CB\u30C3\u30AF\u30CD\u30FC\u30E0\u306F3\uFF5E12\u6587\u5B57\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044');
      return;
    }

    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      const profile = await createUserProfile({
        authId: authUser.id,
        displayName: trimmed,
      });

      setUser(mapDbUser(profile));
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('', err.message || '\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <View style={styles.content}>
        <GlowText size={22} color={COLORS.primary}>
          {'\u30CB\u30C3\u30AF\u30CD\u30FC\u30E0\u3092\u6C7A\u3081\u3088\u3046'}
        </GlowText>
        <Text style={styles.hint}>
          {'\u30E9\u30F3\u30AD\u30F3\u30B0\u3084\u30D5\u30EC\u30F3\u30C9\u306B\u8868\u793A\u3055\u308C\u307E\u3059\n3\uFF5E12\u6587\u5B57'}
        </Text>

        <View style={styles.form}>
          <CyberInput
            placeholder="\u30CB\u30C3\u30AF\u30CD\u30FC\u30E0..."
            value={nickname}
            onChangeText={setNickname}
            maxLength={12}
            autoFocus
          />

          <Text style={styles.charCount}>
            {nickname.trim().length} / 12
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 16 }} />
          ) : (
            <CyberButton
              title="START"
              onPress={handleStart}
              size="large"
              disabled={nickname.trim().length < 3}
              style={styles.button}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 10,
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textDim,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
    lineHeight: 20,
  },
  form: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  charCount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textDim,
    textAlign: 'right',
  },
  button: {
    width: '100%',
    marginTop: 8,
  },
});
