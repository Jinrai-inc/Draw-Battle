import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '../src/config/gameConfig';
import { CyberButton } from '../src/components/cyber/CyberButton';
import { GlowText } from '../src/components/cyber/GlowText';
import { ScanlineOverlay, GridBackground } from '../src/components/cyber/ScanlineOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.5;

export default function TitleScreen() {
  const router = useRouter();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotate neon ring
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Title icon with rotating neon ring */}
        <View style={styles.circleContainer}>
          <Animated.View
            style={[
              styles.neonRingOuter,
              { transform: [{ rotate: rotation }, { scale: pulseAnim }] },
            ]}
          />
          <Animated.View
            style={[
              styles.neonRingInner,
              { transform: [{ rotate: rotation }, { scale: pulseAnim }] },
            ]}
          />
          <View style={styles.iconCircle}>
            <Image
              source={require('../assets/images/title-icon.png')}
              style={styles.iconImage}
              resizeMode="contain"
              defaultSource={undefined}
            />
            {/* Fallback pen icon if image doesn't load */}
            <View style={styles.fallbackIcon}>
              <Text style={styles.fallbackIconText}>/</Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <GlowText size={36} color={COLORS.primary}>
            DRAW
          </GlowText>
          <GlowText size={36} color={COLORS.secondary}>
            BATTLE
          </GlowText>
        </View>

        <Text style={styles.subtitle}>-- CYBER ARENA --</Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <CyberButton
            title="BATTLE START"
            onPress={() => router.push('/(tabs)')}
            size="large"
            color={COLORS.primary}
          />
          <View style={styles.buttonSpacer} />
          <CyberButton
            title="COLLECTION"
            onPress={() => router.push('/(tabs)/collection')}
            size="medium"
            color={COLORS.secondary}
          />
        </View>

        <Text style={styles.versionText}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  circleContainer: {
    width: CIRCLE_SIZE + 40,
    height: CIRCLE_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  neonRingOuter: {
    position: 'absolute',
    width: CIRCLE_SIZE + 30,
    height: CIRCLE_SIZE + 30,
    borderRadius: (CIRCLE_SIZE + 30) / 2,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  neonRingInner: {
    position: 'absolute',
    width: CIRCLE_SIZE + 10,
    height: CIRCLE_SIZE + 10,
    borderRadius: (CIRCLE_SIZE + 10) / 2,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  iconCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImage: {
    width: CIRCLE_SIZE * 0.7,
    height: CIRCLE_SIZE * 0.7,
    position: 'absolute',
    zIndex: 1,
  },
  fallbackIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIconText: {
    fontSize: CIRCLE_SIZE * 0.4,
    color: COLORS.primary,
    fontFamily: FONTS.heading,
    transform: [{ rotate: '-45deg' }],
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.textDim,
    letterSpacing: 4,
    marginBottom: 50,
  },
  buttonContainer: {
    alignItems: 'center',
    gap: 16,
  },
  buttonSpacer: {
    height: 8,
  },
  versionText: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.textDim,
    marginTop: 40,
    letterSpacing: 2,
  },
});
