import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../src/config/gameConfig';
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
      Alert.alert('', 'ニックネームは3〜12文字で入力してください');
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
      Alert.alert('', err.message || 'エラーが発生しました');
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
          ニックネームを決めよう
        </GlowText>
        <Text style={styles.hint}>
          {'ランキングやフレンドに表示されます\n3〜12文字'}
        </Text>

        <View style={styles.form}>
          <CyberInput
            placeholder="ニックネーム..."
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
            <TouchableOpacity
              style={[styles.startButton, nickname.trim().length < 3 && styles.startButtonDisabled]}
              onPress={handleStart}
              disabled={nickname.trim().length < 3}
              activeOpacity={0.8}
            >
              <Text style={styles.startText}>はじめる</Text>
            </TouchableOpacity>
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
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startText: {
    fontFamily: FONTS.body,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.background,
  },
});
