import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../src/config/gameConfig';
import { GlowText } from '../../src/components/cyber/GlowText';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { signInWithGoogle, signInWithApple, createGuestProfile } from '../../src/services/authService';
import { useAuthStore, mapDbUser } from '../../src/stores/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const setGuest = useAuthStore((s) => s.setGuest);
  const [loading, setLoading] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading('google');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      Alert.alert('エラー', err.message || 'Googleログインに失敗しました');
    } finally {
      setLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading('apple');
    try {
      await signInWithApple();
    } catch (err: any) {
      Alert.alert('エラー', err.message || 'Appleログインに失敗しました');
    } finally {
      setLoading(null);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading('guest');
    try {
      const guestName = 'ゲスト' + Math.floor(Math.random() * 9000 + 1000);
      const profile = createGuestProfile(guestName);
      setGuest(mapDbUser(profile));
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('エラー', err.message || 'ゲストログインに失敗しました');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <View style={styles.content}>
        {/* タイトル */}
        <View style={styles.header}>
          <GlowText size={32} color={COLORS.primary}>DRAW BATTLE</GlowText>
          <Text style={styles.subtitle}>-- CYBER ARENA --</Text>
        </View>

        {/* ログインボタン */}
        <View style={styles.buttons}>
          {/* Google */}
          <TouchableOpacity
            style={[styles.loginButton, styles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={loading !== null}
            activeOpacity={0.8}
          >
            {loading === 'google' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <FontAwesome name="google" size={20} color="#fff" style={styles.icon} />
                <Text style={styles.loginText}>Googleでログイン</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Apple */}
          <TouchableOpacity
            style={[styles.loginButton, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={loading !== null}
            activeOpacity={0.8}
          >
            {loading === 'apple' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={22} color="#fff" style={styles.icon} />
                <Text style={styles.loginText}>Appleでログイン</Text>
              </>
            )}
          </TouchableOpacity>

          {/* メール */}
          <TouchableOpacity
            style={[styles.loginButton, styles.emailButton]}
            onPress={() => router.push('/(auth)/register')}
            disabled={loading !== null}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.loginText}>メールで登録 / ログイン</Text>
          </TouchableOpacity>

          {/* 区切り線 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>または</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ゲスト */}
          <TouchableOpacity
            style={[styles.loginButton, styles.guestButton]}
            onPress={handleGuestSignIn}
            disabled={loading !== null}
            activeOpacity={0.8}
          >
            {loading === 'guest' ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="person-outline" size={20} color={COLORS.primary} style={styles.icon} />
                <Text style={[styles.loginText, { color: COLORS.primary }]}>
                  ゲストではじめる
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.guestNote}>※ログインなしですぐ遊べます</Text>
        </View>

        <Text style={styles.terms}>
          {'登録により利用規約に同意したものとみなします'}
        </Text>
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
    padding: 24,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  subtitle: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.textDim,
    letterSpacing: 3,
    marginTop: 4,
  },
  buttons: {
    width: '100%',
    maxWidth: 320,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    minHeight: 52,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  appleButton: {
    backgroundColor: '#333333',
  },
  emailButton: {
    backgroundColor: '#6B5CE7',
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  icon: {
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  loginText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  guestNote: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textDim,
    textAlign: 'center',
    marginTop: -4,
    marginBottom: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
    marginHorizontal: 16,
  },
  terms: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textDim,
    textAlign: 'center',
    marginTop: 24,
  },
});
