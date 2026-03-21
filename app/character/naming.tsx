import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, Easing, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { GlowText } from '../../src/components/cyber/GlowText';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { StatsCard } from '../../src/components/StatsCard';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useAuthStore } from '../../src/stores/authStore';
import { calcSpecialPower } from '../../src/engine/specialPower';

const RANK_COLORS: Record<string, string> = {
  SSS: '#FF69B4',
  SS: '#FFD700',
  S: '#FF4444',
  A: '#AA44FF',
  B: '#00FFFF',
  C: '#00FF88',
  D: '#888888',
};

export default function NamingScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { draftCharacter, draftImageBase64, clearDraft, saveCharacter, addCharacter } = useCollectionStore();

  const [specialName, setSpecialName] = useState('');
  const [powerResult, setPowerResult] = useState(calcSpecialPower(''));
  const [saving, setSaving] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rankScale = useRef(new Animated.Value(1)).current;
  const barAnim = useRef(new Animated.Value(0)).current;
  const inputGlow = useRef(new Animated.Value(0.3)).current;

  // Pulse animation for the power display
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Input glow animation
  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(inputGlow, {
          toValue: 0.8,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(inputGlow, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, [inputGlow]);

  const handleNameChange = useCallback((text: string) => {
    setSpecialName(text);
    const result = calcSpecialPower(text);
    setPowerResult(result);

    // Animate rank change
    Animated.sequence([
      Animated.timing(rankScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(rankScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate bar
    const barTarget = result.multiplier / GAME_CONFIG.specialName.maxMultiplier;
    Animated.timing(barAnim, {
      toValue: barTarget,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!draftCharacter || !specialName.trim()) return;

    const finalCharacter = {
      ...draftCharacter,
      specialMoveName: specialName.trim(),
    };

    // If user is logged in, save to DB
    if (user?.id && draftImageBase64) {
      setSaving(true);
      try {
        const saved = await saveCharacter(user.id, draftImageBase64, finalCharacter);
        if (!saved) {
          // DB save failed, keep locally
          addCharacter(finalCharacter);
        }
      } catch {
        // Fallback to local
        addCharacter(finalCharacter);
      } finally {
        setSaving(false);
      }
    } else {
      // Offline / not logged in
      addCharacter(finalCharacter);
    }

    clearDraft();
    router.replace('/(tabs)/collection');
  }, [draftCharacter, draftImageBase64, specialName, user, saveCharacter, addCharacter, clearDraft, router]);

  if (!draftCharacter) return null;

  const rankColor = RANK_COLORS[powerResult.rank] || COLORS.text;
  const multiplierPercent = ((powerResult.multiplier - 1) * 100).toFixed(0);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <GridBackground />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <GlowText size={22} color={COLORS.secondary}>
              {'\u25C7'} SPECIAL MOVE {'\u25C7'}
            </GlowText>
            <Text style={styles.subtitle}>
              Name your character's ultimate attack
            </Text>
          </View>

          {/* Character stats */}
          <View style={styles.statsSection}>
            <StatsCard
              stats={draftCharacter.stats}
              element={draftCharacter.element}
              rarity={draftCharacter.rarity}
            />
          </View>

          {/* Special move name input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>{'\u25B7'} MOVE NAME</Text>
            <Animated.View style={[styles.inputWrapper, { opacity: inputGlow }]}>
              <View style={styles.inputBorderGlow} />
            </Animated.View>
            <TextInput
              style={styles.textInput}
              value={specialName}
              onChangeText={handleNameChange}
              placeholder="Enter special move name..."
              placeholderTextColor="rgba(0, 255, 255, 0.2)"
              maxLength={30}
              autoFocus
            />
            <Text style={styles.charCount}>
              {specialName.length}/30
            </Text>
          </View>

          {/* Power calculation display */}
          <View style={styles.powerSection}>
            <View style={styles.powerHeader}>
              <Text style={styles.powerTitle}>{'\u25C8'} POWER ANALYSIS</Text>
            </View>

            {/* Rank display */}
            <Animated.View
              style={[
                styles.rankDisplay,
                { transform: [{ scale: rankScale }] },
              ]}
            >
              <Text style={styles.rankLabel}>RANK</Text>
              <GlowText size={48} color={rankColor}>
                {powerResult.rank}
              </GlowText>
            </Animated.View>

            {/* Multiplier */}
            <Animated.View
              style={[
                styles.multiplierRow,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Text style={styles.multiplierLabel}>MULTIPLIER</Text>
              <Text style={[styles.multiplierValue, { color: rankColor }]}>
                x{powerResult.multiplier.toFixed(2)}
              </Text>
              <Text style={[styles.multiplierPercent, { color: rankColor }]}>
                (+{multiplierPercent}%)
              </Text>
            </Animated.View>

            {/* Power bar */}
            <View style={styles.powerBarContainer}>
              <View style={styles.powerBarTrack}>
                <Animated.View
                  style={[
                    styles.powerBarFill,
                    {
                      width: barWidth,
                      backgroundColor: rankColor,
                    },
                  ]}
                />
              </View>
              <View style={styles.powerBarLabels}>
                <Text style={styles.powerBarLabel}>D</Text>
                <Text style={styles.powerBarLabel}>C</Text>
                <Text style={styles.powerBarLabel}>B</Text>
                <Text style={styles.powerBarLabel}>A</Text>
                <Text style={styles.powerBarLabel}>S</Text>
                <Text style={styles.powerBarLabel}>SS</Text>
                <Text style={styles.powerBarLabel}>SSS</Text>
              </View>
            </View>

            {/* Score details */}
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>{'\u25A1'} Total Score</Text>
              <Text style={[styles.scoreValue, { color: rankColor }]}>
                {powerResult.totalScore}
              </Text>
            </View>

            {/* Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>{'\u00BB'} TIPS</Text>
              <Text style={styles.tipText}>{'\u25C7'} Power kanji boost score significantly</Text>
              <Text style={styles.tipText}>{'\u25C7'} Short, dense names rank higher</Text>
              <Text style={styles.tipText}>{'\u25C7'} Filler characters reduce power</Text>
            </View>
          </View>

          {/* Confirm button */}
          {saving ? (
            <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 16 }} />
          ) : (
            <CyberButton
              title={'\u25C6 CONFIRM'}
              onPress={handleConfirm}
              color={COLORS.secondary}
              size="large"
              style={styles.confirmButton}
              disabled={!specialName.trim()}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ScanlineOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    marginTop: 8,
    letterSpacing: 1,
  },
  statsSection: {
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
    position: 'relative',
  },
  inputLabel: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.secondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  inputWrapper: {
    ...StyleSheet.absoluteFillObject,
    top: 26,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  inputBorderGlow: {
    flex: 1,
  },
  textInput: {
    backgroundColor: 'rgba(10, 22, 40, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 255, 0.3)',
    borderRadius: 4,
    padding: 16,
    fontFamily: FONTS.body,
    fontSize: 20,
    color: COLORS.text,
    letterSpacing: 2,
    textAlign: 'center',
  },
  charCount: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textDim,
    textAlign: 'right',
    marginTop: 4,
    letterSpacing: 1,
  },
  powerSection: {
    backgroundColor: 'rgba(10, 22, 40, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 4,
    padding: 16,
    marginBottom: 20,
  },
  powerHeader: {
    marginBottom: 12,
  },
  powerTitle: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.textDim,
    letterSpacing: 2,
  },
  rankDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  rankLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textDim,
    letterSpacing: 3,
    marginBottom: 4,
  },
  multiplierRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },
  multiplierLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textDim,
    letterSpacing: 2,
  },
  multiplierValue: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },
  multiplierPercent: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    opacity: 0.7,
    letterSpacing: 1,
  },
  powerBarContainer: {
    marginBottom: 16,
  },
  powerBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  powerBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  powerBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  powerBarLabel: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.textDim,
    letterSpacing: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 255, 255, 0.1)',
    marginBottom: 12,
  },
  scoreLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text,
    letterSpacing: 1,
  },
  scoreValue: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tipsContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 255, 255, 0.05)',
  },
  tipsTitle: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: 2,
    marginBottom: 6,
  },
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(0, 255, 255, 0.4)',
    marginVertical: 2,
    letterSpacing: 1,
  },
  confirmButton: {
    marginTop: 4,
  },
});
