import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../src/config/gameConfig';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { CyberInput } from '../../src/components/cyber/CyberInput';
import { GlowText } from '../../src/components/cyber/GlowText';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Phase 2: Implement Supabase Auth login
    // For MVP, skip directly to main app
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <View style={styles.content}>
        <GlowText size={28} color={COLORS.primary}>LOGIN</GlowText>
        <Text style={styles.subtitle}>-- CYBER ARENA --</Text>

        <View style={styles.form}>
          <CyberInput
            label="EMAIL"
            placeholder="Enter your email..."
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <CyberInput
            label="PASSWORD"
            placeholder="Enter password..."
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            glowColor={COLORS.secondary}
          />
          <CyberButton
            title="LOGIN"
            onPress={handleLogin}
            size="large"
            style={styles.button}
          />
          <CyberButton
            title="SKIP (OFFLINE MODE)"
            onPress={() => router.replace('/(tabs)')}
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
    maxWidth: 400,
    gap: 16,
  },
  button: {
    width: '100%',
    marginTop: 8,
  },
});
