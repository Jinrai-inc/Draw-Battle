import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../src/config/gameConfig';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { GlowText } from '../../src/components/cyber/GlowText';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { signInWithGoogle, signInWithApple } from '../../src/services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // OAuth redirect will handle the rest
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Apple sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <View style={styles.content}>
        <GlowText size={32} color={COLORS.primary}>DRAW BATTLE</GlowText>
        <Text style={styles.subtitle}>-- CYBER ARENA --</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.buttons}>
            <CyberButton
              title="Google\u3067\u59CB\u3081\u308B"
              onPress={handleGoogleSignIn}
              size="large"
              style={styles.button}
            />
            <CyberButton
              title="Apple\u3067\u59CB\u3081\u308B"
              onPress={handleAppleSignIn}
              color={COLORS.text}
              size="large"
              style={styles.button}
            />
            <CyberButton
              title="\u30E1\u30FC\u30EB\u3067\u767B\u9332"
              onPress={() => router.push('/(auth)/register')}
              color={COLORS.secondary}
              size="large"
              style={styles.button}
            />
          </View>
        )}

        <Text style={styles.terms}>
          {'\u767B\u9332\u306B\u3088\u308A\u5229\u7528\u898F\u7D04\u306B\n\u540C\u610F\u3057\u305F\u3082\u306E\u3068\u307F\u306A\u3057\u307E\u3059'}
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
  subtitle: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.textDim,
    letterSpacing: 3,
    marginTop: 4,
    marginBottom: 48,
  },
  buttons: {
    width: '100%',
    maxWidth: 320,
    gap: 14,
  },
  button: {
    width: '100%',
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
