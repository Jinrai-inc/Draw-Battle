import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { GlowText } from '../../src/components/cyber/GlowText';
import { CyberCard } from '../../src/components/cyber/CyberCard';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { StatsCard } from '../../src/components/StatsCard';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useBattleStore } from '../../src/stores/battleStore';
import { calcSpecialPower } from '../../src/engine/specialPower';

const EQUIPMENT_SLOT_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  weapon: { icon: '\u25B7', label: 'WEAPON', color: COLORS.danger },
  armor: { icon: '\u25A1', label: 'ARMOR', color: '#4488FF' },
  accessory: { icon: '\u25C7', label: 'ACCESSORY', color: COLORS.secondary },
};

export default function CharacterDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { characters, selectCharacter } = useCollectionStore();
  const { setPlayerCharacter, setPhase } = useBattleStore();

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
  const canEvolve = character.battleCount >= GAME_CONFIG.growth.evolveRequiredBattles && !character.isEvolved;
  const evolveProgress = Math.min(character.battleCount / GAME_CONFIG.growth.evolveRequiredBattles, 1);

  const handleBattle = () => {
    selectCharacter(character);
    setPlayerCharacter(character);
    setPhase('matching');
    router.push('/battle/matching');
  };

  const handleEvolve = () => {
    if (canEvolve) {
      router.push(`/character/evolve?id=${character.id}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <CyberButton title={'\u25C1 BACK'} onPress={() => router.back()} size="small" />
          <GlowText size={20} color={rarityDef?.color || COLORS.primary}>
            {character.name || character.specialMoveName || 'UNNAMED'}
          </GlowText>
        </View>

        {/* Character preview */}
        <View style={styles.previewContainer}>
          <View style={[
            styles.previewFrame,
            { borderColor: elementDef?.color || COLORS.primary },
            character.isEvolved && { shadowColor: rarityDef?.color, shadowOpacity: 0.8, shadowRadius: 16, elevation: 8 },
          ]}>
            <Text style={[styles.previewIcon, { color: elementDef?.color || COLORS.primary }]}>
              {'\u25C8'}
            </Text>
          </View>
          {character.isEvolved && (
            <Text style={[styles.evolvedBadge, { color: rarityDef?.color }]}>
              {'\u25C6'} EVOLVED {'\u25C6'}
            </Text>
          )}
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

          {/* Evolution progress */}
          <View style={styles.evolveSection}>
            <View style={styles.evolveRow}>
              <Text style={styles.evolveLabel}>
                {'\u25C6'} EVOLUTION
              </Text>
              <Text style={[styles.evolveStatus, {
                color: canEvolve ? COLORS.warning : character.isEvolved ? COLORS.success : COLORS.textDim
              }]}>
                {character.isEvolved ? 'EVOLVED' : canEvolve ? 'READY!' : `${character.battleCount}/${GAME_CONFIG.growth.evolveRequiredBattles}`}
              </Text>
            </View>
            <View style={styles.evolveBarBg}>
              <View style={[
                styles.evolveBar,
                {
                  width: `${character.isEvolved ? 100 : evolveProgress * 100}%`,
                  backgroundColor: canEvolve ? COLORS.warning : character.isEvolved ? COLORS.success : COLORS.secondary,
                },
              ]} />
            </View>
            {canEvolve && (
              <CyberButton
                title={'\u25C6 EVOLVE NOW'}
                onPress={handleEvolve}
                color={COLORS.warning}
                size="small"
                style={{ marginTop: 8 }}
              />
            )}
          </View>
        </CyberCard>

        {/* Stats */}
        <View style={styles.card}>
          <StatsCard
            stats={character.stats}
            element={character.element}
            rarity={character.rarity}
            specialMoveName={character.specialMoveName}
            specialRank={powerResult.rank}
          />
        </View>

        {/* Special Move Detail */}
        <CyberCard style={styles.card} accentColor={COLORS.secondary}>
          <Text style={styles.sectionTitle}>{'\u25C7'} SPECIAL MOVE</Text>
          <Text style={styles.specialName}>{character.specialMoveName}</Text>
          <View style={styles.specialStats}>
            <View style={styles.specialStatItem}>
              <Text style={styles.specialStatLabel}>MULTIPLIER</Text>
              <Text style={[styles.specialStatValue, { color: COLORS.secondary }]}>
                x{powerResult.multiplier.toFixed(2)}
              </Text>
            </View>
            <View style={styles.specialStatItem}>
              <Text style={styles.specialStatLabel}>RANK</Text>
              <Text style={[styles.specialStatValue, { color: COLORS.warning }]}>
                {powerResult.rank}
              </Text>
            </View>
            <View style={styles.specialStatItem}>
              <Text style={styles.specialStatLabel}>SCORE</Text>
              <Text style={[styles.specialStatValue, { color: COLORS.primary }]}>
                {powerResult.totalScore}
              </Text>
            </View>
          </View>
        </CyberCard>

        {/* Equipment Slots */}
        <CyberCard style={styles.card} accentColor={COLORS.primary}>
          <Text style={styles.sectionTitle}>{'\u25B7'} EQUIPMENT</Text>
          {Object.entries(EQUIPMENT_SLOT_LABELS).map(([slot, info]) => (
            <View key={slot} style={styles.equipmentSlot}>
              <View style={styles.equipSlotLeft}>
                <Text style={[styles.equipSlotIcon, { color: info.color }]}>{info.icon}</Text>
                <Text style={[styles.equipSlotLabel, { color: info.color }]}>{info.label}</Text>
              </View>
              <Text style={styles.equipSlotEmpty}>-- EMPTY --</Text>
            </View>
          ))}
        </CyberCard>

        {/* Info */}
        <CyberCard style={styles.card}>
          <Text style={styles.sectionTitle}>{'\u25C8'} INFO</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Element</Text>
              <Text style={[styles.infoValue, { color: elementDef?.color }]}>
                {elementDef?.name || character.element}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Rarity</Text>
              <Text style={[styles.infoValue, { color: rarityDef?.color }]}>
                {character.rarity}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Battles</Text>
              <Text style={styles.infoValue}>{character.battleCount}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>
                {new Date(character.createdAt).toLocaleDateString('ja-JP')}
              </Text>
            </View>
          </View>
        </CyberCard>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <CyberButton
            title={'\u25B7 BATTLE'}
            onPress={handleBattle}
            color={COLORS.danger}
            size="large"
            style={styles.actionBtn}
          />
        </View>
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
  previewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewFrame: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIcon: {
    fontSize: 48,
  },
  evolvedBadge: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    letterSpacing: 3,
    marginTop: 8,
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
  evolveSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,255,255,0.1)',
  },
  evolveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  evolveLabel: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.secondary,
    letterSpacing: 2,
  },
  evolveStatus: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  evolveBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  evolveBar: {
    height: '100%',
    borderRadius: 2,
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
    marginBottom: 12,
  },
  specialStats: {
    flexDirection: 'row',
    gap: 16,
  },
  specialStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  specialStatLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textDim,
    letterSpacing: 1,
    marginBottom: 4,
  },
  specialStatValue: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    fontWeight: '700',
  },
  equipmentSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,255,255,0.06)',
  },
  equipSlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  equipSlotIcon: {
    fontSize: 16,
    fontFamily: FONTS.mono,
  },
  equipSlotLabel: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    letterSpacing: 2,
  },
  equipSlotEmpty: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    width: '45%',
  },
  infoLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textDim,
    letterSpacing: 1,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '700',
  },
  actionRow: {
    marginTop: 20,
    gap: 12,
  },
  actionBtn: {
    width: '100%',
  },
});
