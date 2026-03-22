import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, Easing, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '../../src/config/gameConfig';
import { GlowText } from '../../src/components/cyber/GlowText';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { StatsCard } from '../../src/components/StatsCard';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useAuthStore } from '../../src/stores/authStore';

export default function NamingScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { draftCharacter, draftImageBase64, clearDraft, saveCharacter, addCharacter } = useCollectionStore();

  const [specialName, setSpecialName] = useState('');
  const [saving, setSaving] = useState(false);

  const inputGlow = useRef(new Animated.Value(0.3)).current;

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

  const handleConfirm = useCallback(async () => {
    if (!draftCharacter || !specialName.trim()) return;

    const finalCharacter = {
      ...draftCharacter,
      specialMoveName: specialName.trim(),
      imageBase64: draftImageBase64 || undefined,
    };

    // If user is logged in, save to DB
    if (user?.id && draftImageBase64) {
      setSaving(true);
      try {
        const saved = await saveCharacter(user.id, draftImageBase64, finalCharacter);
        if (!saved) {
          // DB save failed, keep locally with base64 image
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
              onChangeText={setSpecialName}
              placeholder="Enter special move name..."
              placeholderTextColor="rgba(0, 255, 255, 0.2)"
              maxLength={30}
              autoFocus
            />
            <Text style={styles.charCount}>
              {specialName.length}/30
            </Text>
          </View>

          {/* Mystery rank hint */}
          <View style={styles.mysterySection}>
            <Text style={styles.mysteryIcon}>{'\u2753'}</Text>
            <Text style={styles.mysteryTitle}>{'\u25C8'} RANK: ???</Text>
            <Text style={styles.mysteryDesc}>
              The power of your special move will be revealed when battle begins!
            </Text>
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
  mysterySection: {
    backgroundColor: 'rgba(10, 22, 40, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 4,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  mysteryIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  mysteryTitle: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    color: COLORS.warning,
    letterSpacing: 3,
    marginBottom: 8,
  },
  mysteryDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textDim,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 16,
  },
  tipsContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.1)',
    alignSelf: 'stretch',
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
