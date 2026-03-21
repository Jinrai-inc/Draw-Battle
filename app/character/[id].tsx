import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { GlowText } from '../../src/components/cyber/GlowText';
import { CyberCard } from '../../src/components/cyber/CyberCard';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { StatsCard } from '../../src/components/StatsCard';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { calcSpecialPower } from '../../src/engine/specialPower';

export default function CharacterDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { characters } = useCollectionStore();

  const character = characters.find(c => c.id === id);

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

  const powerResult = calcSpecialPower(character.specialMoveName);
  const elementDef = GAME_CONFIG.elements.find(e => e.id === character.element);
  const rarityDef = GAME_CONFIG.rarityThresholds.find(r => r.id === character.rarity);
  const expForNext = GAME_CONFIG.expForLevel(character.level + 1);

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <CyberButton title={'\u25C1 BACK'} onPress={() => router.back()} size="small" />
          <GlowText size={20} color={rarityDef?.color || COLORS.primary}>
            {character.name || 'UNNAMED'}
          </GlowText>
        </View>

        {/* Level & EXP */}
        <CyberCard style={styles.card}>
          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>LV.{character.level}</Text>
            <Text style={styles.expText}>
              EXP {character.exp} / {expForNext}
            </Text>
          </View>
          <View style={styles.expBarBg}>
            <View
              style={[
                styles.expBar,
                { width: `${Math.min((character.exp / expForNext) * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.battleCount}>
            Battles: {character.battleCount} / {GAME_CONFIG.growth.evolveRequiredBattles}
            {character.battleCount >= GAME_CONFIG.growth.evolveRequiredBattles && !character.isEvolved
              ? ' -- EVOLUTION READY!'
              : ''}
          </Text>
        </CyberCard>

        {/* Stats */}
        <StatsCard
          stats={character.stats}
          element={character.element}
          rarity={character.rarity}
          specialMoveName={character.specialMoveName}
          specialRank={powerResult.rank}
        />

        {/* Special Move Detail */}
        <CyberCard style={styles.card} accentColor={COLORS.secondary}>
          <Text style={styles.sectionTitle}>{'\u25C7'} SPECIAL MOVE</Text>
          <Text style={styles.specialName}>{character.specialMoveName}</Text>
          <View style={styles.specialStats}>
            <Text style={styles.specialStat}>Multiplier: x{powerResult.multiplier.toFixed(2)}</Text>
            <Text style={styles.specialStat}>Rank: {powerResult.rank}</Text>
          </View>
        </CyberCard>

        {/* Info */}
        <CyberCard style={styles.card}>
          <Text style={styles.sectionTitle}>{'\u25C8'} INFO</Text>
          <Text style={styles.infoRow}>Element: {elementDef?.name || character.element}</Text>
          <Text style={styles.infoRow}>Rarity: {character.rarity}</Text>
          <Text style={styles.infoRow}>Evolved: {character.isEvolved ? 'Yes' : 'No'}</Text>
          <Text style={styles.infoRow}>Created: {new Date(character.createdAt).toLocaleDateString()}</Text>
        </CyberCard>
      </ScrollView>
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
  scroll: {
    flex: 1,
    zIndex: 10,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  card: {
    marginTop: 16,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelLabel: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: '700',
  },
  expText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textDim,
  },
  expBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  expBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  battleCount: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  specialName: {
    fontFamily: FONTS.body,
    fontSize: 24,
    color: COLORS.secondary,
    fontWeight: '700',
    marginBottom: 8,
  },
  specialStats: {
    flexDirection: 'row',
    gap: 20,
  },
  specialStat: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.text,
  },
  infoRow: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text,
    marginVertical: 2,
  },
});
