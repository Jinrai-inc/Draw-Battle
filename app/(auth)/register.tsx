import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../src/config/gameConfig';
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
      Alert.alert('', 'メールとパスワードを入力してください');
      return;
    }
    if (password.length < 6) {
      Alert.alert('', 'パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmail({ email, password });
      } else {
        await signUpWithEmail({ email, password });
      }
    } catch (err: any) {
      const message = err.message?.includes('Invalid login')
        ? 'メールまたはパスワードが正しくありません'
        : err.message?.includes('already registered')
        ? 'このメールは既に登録されています'
        : err.message || 'エラーが発生しました';
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
          {isLogin ? 'ログイン' : 'メールで登録'}
        </GlowText>
        <Text style={styles.subtitle}>-- CYBER ARENA --</Text>

        <View style={styles.form}>
          <CyberInput
            label="EMAIL"
            placeholder="メールアドレス..."
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            glowColor={COLORS.secondary}
          />
          <CyberInput
            label="PASSWORD"
            placeholder="パスワード（6文字以上）..."
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            glowColor={COLORS.secondary}
          />

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 16 }} />
          ) : (
            <>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitText}>
                  {isLogin ? 'ログイン' : '登録する'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsLogin(!isLogin)}
                activeOpacity={0.7}
                style={styles.switchButton}
              >
                <Text style={styles.switchText}>
                  {isLogin ? 'アカウントを作成する' : 'ログインはこちら'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.textDim} />
            <Text style={styles.backText}>戻る</Text>
          </TouchableOpacity>
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
  submitButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    textDecorationLine: 'underline',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  backText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
  },
});
