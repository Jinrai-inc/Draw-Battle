import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../src/config/gameConfig';
import { GlowText } from '../../src/components/cyber/GlowText';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useRouter } from 'expo-router';

export default function EvolveScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />
      <View style={styles.center}>
        <GlowText size={28} color={COLORS.secondary}>EVOLUTION</GlowText>
        <Text style={styles.text}>Coming in Phase 4</Text>
        <CyberButton
          title="BACK"
          onPress={() => router.back()}
          style={{ marginTop: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textDim,
    marginTop: 10,
  },
});
