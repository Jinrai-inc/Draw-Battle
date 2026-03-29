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
import { useLanguageStore } from '../../src/stores/languageStore';
import { LANGUAGE_LABELS, type Language } from '../../src/i18n/translations';

export default function LoginScreen() {
  const router = useRouter();
  const setGuest = useAuthStore((s) => s.setGuest);
  const t = useLanguageStore((s) => s.t);
  const { language, setLanguage } = useLanguageStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading('google');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      // Don't show alert for user-initiated cancellations
      if (err.message !== 'Login cancelled') {
        Alert.alert(t('error'), err.message || 'Google login failed');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading('apple');
    try {
      await signInWithApple();
    } catch (err: any) {
      // Don't show alert for user-initiated cancellations (native Apple dialog or browser)
      const code = err.code;
      if (code === 'ERR_CANCELED' || err.message === 'Login cancelled') {
        // User cancelled - do nothing
      } else {
        Alert.alert(t('error'), err.message || 'Apple login failed');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading('guest');
    try {
      const guestName = 'Guest' + Math.floor(Math.random() * 9000 + 1000);
      const profile = createGuestProfile(guestName);
      setGuest(mapDbUser(profile));
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert(t('error'), err.message || 'Guest login failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <View style={styles.content}>
        {/* Language Selector */}
        <View style={styles.langRow}>
          {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
            <TouchableOpacity
              key={lang}
              onPress={() => setLanguage(lang)}
              style={[styles.langChip, language === lang && styles.langChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.langText, language === lang && styles.langTextActive]}>
                {LANGUAGE_LABELS[lang]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <View style={styles.header}>
          <GlowText size={32} color={COLORS.primary}>DRAW BATTLE</GlowText>
          <Text style={styles.subtitle}>-- CYBER ARENA --</Text>
        </View>

        {/* Login Buttons */}
        <View style={styles.buttons}>
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
                <Text style={styles.loginText}>{t('login_google')}</Text>
              </>
            )}
          </TouchableOpacity>

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
                <Text style={styles.loginText}>{t('login_apple')}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, styles.emailButton]}
            onPress={() => router.push('/(auth)/register')}
            disabled={loading !== null}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.loginText}>{t('login_email')}</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('login_or')}</Text>
            <View style={styles.dividerLine} />
          </View>

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
                <Text style={[styles.loginText, { color: COLORS.primary }]}>{t('login_guest')}</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.guestNote}>{t('login_guest_note')}</Text>
        </View>

        <Text style={styles.terms}>{t('login_terms')}</Text>
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
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  langChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0,255,255,0.1)',
  },
  langText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
  },
  langTextActive: {
    color: COLORS.primary,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
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
  googleButton: { backgroundColor: '#4285F4' },
  appleButton: { backgroundColor: '#333333' },
  emailButton: { backgroundColor: '#6B5CE7' },
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
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
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
