import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../src/config/gameConfig';
import { GlowText } from '../../src/components/cyber/GlowText';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { signInWithGoogle, signInWithApple, signInAsGuest } from '../../src/services/authService';

export default function LoginScreen() {
  const router = useRouter();
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
      await signInAsGuest();
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
        <View style={styles.header}>
          <GlowText size={32} color={COLORS.primary}>DRAW BATTLE</GlowText>
          <Text style={styles.subtitle}>-- CYBER ARENA --</Text>
        </View>

        <View style={styles.buttons}>
          {/* Google ログイン */}
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={loading !== null}
            activeOpacity={0.7}
          >
            {loading === 'google' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialText}>Googleでログイン</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Apple ログイン */}
          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={loading !== null}
            activeOpacity={0.7}
          >
            {loading === 'apple' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.socialIcon}>{'\uF8FF'}</Text>
                <Text style={styles.socialText}>Appleでログイン</Text>
              </>
            )}
          </TouchableOpacity>

          {/* メールで登録 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.emailButton]}
            onPress={() => router.push('/(auth)/register')}
            disabled={loading !== null}
            activeOpacity={0.7}
          >
            <Text style={styles.emailIcon}>✉</Text>
            <Text style={styles.socialText}>メールで登録 / ログイン</Text>
          </TouchableOpacity>

          {/* 区切り線 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>または</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ゲストログイン */}
          <TouchableOpacity
            style={[styles.socialButton, styles.guestButton]}
            onPress={handleGuestSignIn}
            disabled={loading !== null}
            activeOpacity={0.7}
          >
            {loading === 'guest' ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.guestText}>ゲストではじめる</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.guestNote}>
            ※ゲストデータは端末に保存されます
          </Text>
        </View>

        <Text style={styles.terms}>
          {'登録により利用規約に\n同意したものとみなします'}
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
    padding: 20,
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
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    minHeight: 52,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  appleButton: {
    backgroundColor: '#333',
  },
  emailButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  emailIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  socialText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  guestText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  guestNote: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textDim,
    textAlign: 'center',
    marginTop: -4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
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
    marginHorizontal: 12,
  },
  terms: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textDim,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
});
