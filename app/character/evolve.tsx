import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { GlowText } from '../../src/components/cyber/GlowText';
import { CyberCard } from '../../src/components/cyber/CyberCard';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useAuthStore } from '../../src/stores/authStore';
import * as characterService from '../../src/services/characterService';
import type { RarityId } from '../../src/types';

const RARITY_ORDER: RarityId[] = ['C', 'UC', 'R', 'SR', 'SSR', 'UR'];

function getNextRarity(current: RarityId): RarityId {
  const idx = RARITY_ORDER.indexOf(current);
  return idx < RARITY_ORDER.length - 1 ? RARITY_ORDER[idx + 1] : current;
}

function getRarityColor(rarityId: string): string {
  return GAME_CONFIG.rarityThresholds.find(r => r.id === rarityId)?.color || '#888888';
}

export default function EvolveScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { characters, updateCharacter } = useCollectionStore();
  const user = useAuthStore(s => s.user);

  const character = characters.find(c => c.id === id);

  const [phase, setPhase] = useState<'preview' | 'evolving' | 'complete'>('preview');
  const [evolving, setEvolving] = useState(false);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const statsRevealAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase === 'evolving' || phase === 'complete') {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [phase]);

  if (!character) {
    return (
      <SafeAreaView style={styles.container}>
        <GridBackground />
        <ScanlineOverlay />
        <View style={styles.center}>
          <GlowText size={20} color={COLORS.danger}>CHARACTER NOT FOUND</GlowText>
          <CyberButton title="BACK" onPress={() => router.back()} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  const canEvolve = character.battleCount >= GAME_CONFIG.growth.evolveRequiredBattles && !character.isEvolved;
  const nextRarity = getNextRarity(character.rarity);
  const bonus = GAME_CONFIG.growth.evolveStatBonus;
  const currentColor = getRarityColor(character.rarity);
  const nextColor = getRarityColor(nextRarity);

  const handleEvolve = async () => {
    if (!canEvolve || evolving) return;
    setEvolving(true);
    setPhase('evolving');

    Animated.sequence([
      Animated.parallel([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
      Animated.timing(statsRevealAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start(async () => {
      const newStats = {
        hp: character.stats.hp + bonus,
        atk: character.stats.atk + bonus,
        def: character.stats.def + bonus,
        spd: character.stats.spd + bonus,
        special: character.stats.special + bonus,
        totalStats: character.stats.totalStats + bonus * 5,
      };

      updateCharacter(character.id, {
        stats: newStats,
        rarity: nextRarity,
        isEvolved: true,
      });

      if (user?.id) {
        await characterService.updateCharacter(character.id, {
          rarity: nextRarity,
          is_evolved: true,
        }).catch(() => {});
      }

      setPhase('complete');
    });
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />

      <Animated.View
        style={[styles.flash, { opacity: flashAnim, backgroundColor: nextColor }]}
        pointerEvents="none"
      />

      <View style={styles.mainContent}>
        <View style={styles.header}>
          <CyberButton title={'\u25C1 BACK'} onPress={() => router.back()} size="small" />
          <GlowText size={20} color={COLORS.secondary}>
            {'\u25C6'} EVOLUTION {'\u25C6'}
          </GlowText>
        </View>

        <View style={styles.characterSection}>
          {phase !== 'preview' && (
            <Animated.View
              style={[
                styles.auraRing,
                {
                  borderColor: phase === 'complete' ? nextColor : COLORS.secondary,
                  transform: [{ rotate: spin }],
                },
              ]}
            />
          )}

          <Animated.View style={[styles.characterFrame, {
            borderColor: phase === 'complete' ? nextColor : currentColor,
            transform: [{ scale: scaleAnim }],
          }]}>
            <Animated.View style={[styles.glowOverlay, { opacity: glowAnim, backgroundColor: nextColor }]} />
            <Text style={[styles.characterIcon, {
              color: phase === 'complete' ? nextColor : currentColor,
            }]}>
              {'\u25C8'}
            </Text>
          </Animated.View>

          <Text style={[styles.characterName, {
            color: phase === 'complete' ? nextColor : currentColor,
          }]}>
            {character.name || character.specialMoveName || 'UNNAMED'}
          </Text>
        </View>

        {phase === 'preview' && (
          <CyberCard style={styles.infoCard} accentColor={COLORS.secondary}>
            <Text style={styles.sectionTitle}>{'\u25C6'} EVOLUTION PREVIEW</Text>

            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>RARITY</Text>
              <View style={styles.changeValues}>
                <Text style={[styles.changeFrom, { color: currentColor }]}>{character.rarity}</Text>
                <Text style={styles.arrow}>{'\u00BB'}</Text>
                <Text style={[styles.changeTo, { color: nextColor }]}>{nextRarity}</Text>
              </View>
            </View>

            {(['hp', 'atk', 'def', 'spd', 'special'] as const).map(key => (
              <View key={key} style={styles.changeRow}>
                <Text style={styles.changeLabel}>{key.toUpperCase()}</Text>
                <View style={styles.changeValues}>
                  <Text style={styles.changeFrom}>{character.stats[key]}</Text>
                  <Text style={styles.arrow}>{'\u00BB'}</Text>
                  <Text style={[styles.changeTo, { color: COLORS.success }]}>
                    {character.stats[key] + bonus}
                  </Text>
                  <Text style={styles.bonusText}>(+{bonus})</Text>
                </View>
              </View>
            ))}

            <View style={[styles.changeRow, styles.totalRow]}>
              <Text style={styles.changeLabel}>TOTAL</Text>
              <View style={styles.changeValues}>
                <Text style={styles.changeFrom}>{character.stats.totalStats}</Text>
                <Text style={styles.arrow}>{'\u00BB'}</Text>
                <Text style={[styles.changeTo, { color: COLORS.warning }]}>
                  {character.stats.totalStats + bonus * 5}
                </Text>
              </View>
            </View>

            <CyberButton
              title={'\u25C6 EVOLVE'}
              onPress={handleEvolve}
              color={COLORS.warning}
              size="large"
              style={{ marginTop: 16 }}
              disabled={!canEvolve || evolving}
            />
          </CyberCard>
        )}

        {phase === 'complete' && (
          <Animated.View style={{ opacity: statsRevealAnim }}>
            <CyberCard style={styles.infoCard} accentColor={nextColor}>
              <View style={styles.completeHeader}>
                <GlowText size={28} color={nextColor}>
                  EVOLUTION COMPLETE!
                </GlowText>
              </View>
              <View style={styles.newRarityDisplay}>
                <Text style={[styles.newRarityLabel, { color: nextColor }]}>
                  {'\u25C6'.repeat(RARITY_ORDER.indexOf(nextRarity) + 1)} {nextRarity}
                </Text>
              </View>
              <Text style={styles.bonusSummary}>
                All stats increased by +{bonus}!
              </Text>
              <CyberButton
                title={'\u25C8 DONE'}
                onPress={() => router.back()}
                color={nextColor}
                size="large"
                style={{ marginTop: 16 }}
              />
            </CyberCard>
          </Animated.View>
        )}

        {phase === 'evolving' && (
          <View style={styles.evolvingMessage}>
            <GlowText size={18} color={COLORS.secondary}>
              EVOLVING...
            </GlowText>
          </View>
        )}
      </View>

      <ScanlineOverlay />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  flash: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  mainContent: { flex: 1, padding: 20, zIndex: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 30 },
  characterSection: { alignItems: 'center', marginBottom: 30, position: 'relative' },
  auraRing: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 2, borderStyle: 'dashed', opacity: 0.5,
  },
  characterFrame: {
    width: 120, height: 120, borderRadius: 12, borderWidth: 3,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  glowOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0 },
  characterIcon: { fontSize: 48 },
  characterName: { fontFamily: FONTS.heading, fontSize: 18, fontWeight: '700', letterSpacing: 2, marginTop: 12 },
  infoCard: { marginTop: 0 },
  sectionTitle: { fontFamily: FONTS.heading, fontSize: 14, color: COLORS.secondary, letterSpacing: 2, marginBottom: 16 },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  changeLabel: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.textDim, letterSpacing: 2, width: 70 },
  changeValues: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  changeFrom: { fontFamily: FONTS.mono, fontSize: 16, color: COLORS.text },
  arrow: { fontFamily: FONTS.mono, fontSize: 16, color: COLORS.textDim },
  changeTo: { fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700' },
  bonusText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.success },
  totalRow: { borderTopWidth: 1, borderTopColor: 'rgba(0,255,255,0.1)', paddingTop: 8 },
  completeHeader: { alignItems: 'center', marginBottom: 16 },
  newRarityDisplay: { alignItems: 'center', marginBottom: 12 },
  newRarityLabel: { fontFamily: FONTS.heading, fontSize: 24, fontWeight: '700', letterSpacing: 2 },
  bonusSummary: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.text, textAlign: 'center' },
  evolvingMessage: { alignItems: 'center', marginTop: 20 },
});
