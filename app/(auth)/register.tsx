import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../src/config/gameConfig';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { CyberInput } from '../../src/components/cyber/CyberInput';
import { GlowText } from '../../src/components/cyber/GlowText';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { signUpWithEmail, signInWithEmail } from '../../src/services/authService';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('', '\u30E1\u30FC\u30EB\u3068\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044');
      return;
    }
    if (password.length < 6) {
      Alert.alert('', '\u30D1\u30B9\u30EF\u30FC\u30C9\u306F6\u6587\u5B57\u4EE5\u4E0A\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmail({ email, password });
      } else {
        await signUpWithEmail({ email, password });
      }
      // Auth state listener in _layout will handle navigation
    } catch (err: any) {
      const message = err.message?.includes('Invalid login')
        ? '\u30E1\u30FC\u30EB\u307E\u305F\u306F\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093'
        : err.message?.includes('already registered')
        ? '\u3053\u306E\u30E1\u30FC\u30EB\u306F\u65E2\u306B\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u3059'
        : err.message || '\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F';
      Alert.alert('', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <View style={styles.content}>
        <GlowText size={24} color={COLORS.secondary}>
          {isLogin ? '\u30ED\u30B0\u30A4\u30F3' : '\u30E1\u30FC\u30EB\u3067\u767B\u9332'}
        </GlowText>
        <Text style={styles.subtitle}>-- CYBER ARENA --</Text>

        <View style={styles.form}>
          <CyberInput
            label="EMAIL"
            placeholder="\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9..."
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            glowColor={COLORS.secondary}
          />
          <CyberInput
            label="PASSWORD"
            placeholder="\u30D1\u30B9\u30EF\u30FC\u30C9\uFF086\u6587\u5B57\u4EE5\u4E0A\uFF09..."
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            glowColor={COLORS.secondary}
          />

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 16 }} />
          ) : (
            <>
              <CyberButton
                title={isLogin ? '\u30ED\u30B0\u30A4\u30F3' : '\u767B\u9332'}
                onPress={handleSubmit}
                color={COLORS.secondary}
                size="large"
                style={styles.button}
              />
              <CyberButton
                title={isLogin ? '\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u4F5C\u308B' : '\u30ED\u30B0\u30A4\u30F3\u306F\u3053\u3061\u3089'}
                onPress={() => setIsLogin(!isLogin)}
                color={COLORS.textDim}
                size="small"
                style={styles.button}
              />
            </>
          )}

          <CyberButton
            title="\u623B\u308B"
            onPress={() => router.back()}
            color={COLORS.textDim}
            size="small"
            style={styles.button}
          />
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
  subtitle: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.textDim,
    letterSpacing: 3,
    marginTop: 4,
    marginBottom: 40,
  },
  form: {
    width: '100%',
    maxWidth: 360,
    gap: 16,
  },
  button: {
    width: '100%',
    marginTop: 4,
  },
});
