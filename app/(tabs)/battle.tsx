import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { CyberButton, CyberCard, GlowText, CyberInput } from '../../src/components/cyber';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useBattleStore } from '../../src/stores/battleStore';
import { useCollectionStore } from '../../src/stores/collectionStore';

export default function BattleScreen() {
  const router = useRouter();
  const { setPlayerCharacter, setPhase } = useBattleStore();
  const { selectedCharacter, characters } = useCollectionStore();

  const hasCharacters = characters.length > 0;
  const hasSelected = selectedCharacter !== null;

  const selectedElement = selectedCharacter
    ? GAME_CONFIG.elements.find((e) => e.id === selectedCharacter.element)
    : null;

  const selectedRarity = selectedCharacter
    ? GAME_CONFIG.rarityThresholds.find((r) => r.id === selectedCharacter.rarity)
    : null;

  const handleAiBattle = () => {
    if (!selectedCharacter) return;
    setPlayerCharacter(selectedCharacter);
    setPhase('matching');
    router.push('/battle/matching' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <GlowText size={28} color={COLORS.primary}>
            {'\u25B7'} BATTLE
          </GlowText>
          <Text style={styles.subtitle}>-- SELECT BATTLE MODE --</Text>
        </View>

        {/* Selected Character Display */}
        <CyberCard style={styles.card} accentColor={hasSelected ? COLORS.primary : COLORS.textDim}>
          <Text style={styles.cardTitle}>{'\u25C8'} SELECTED FIGHTER</Text>

          {hasSelected && selectedCharacter ? (
            <View style={styles.selectedInfo}>
              <View style={styles.selectedHeader}>
                <Text style={styles.characterName}>
                  {selectedCharacter.name || 'UNNAMED'}
                </Text>
                <View style={styles.badges}>
                  {selectedRarity && (
                    <View style={[styles.badge, { borderColor: selectedRarity.color }]}>
                      <Text style={[styles.badgeText, { color: selectedRarity.color }]}>
                        {selectedRarity.id}
                      </Text>
                    </View>
                  )}
                  {selectedElement && (
                    <View style={[styles.badge, { borderColor: selectedElement.color }]}>
                      <Text style={[styles.badgeText, { color: selectedElement.color }]}>
                        {selectedElement.name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>HP</Text>
                  <Text style={styles.statValue}>{selectedCharacter.stats.hp}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>ATK</Text>
                  <Text style={[styles.statValue, { color: '#FF4444' }]}>
                    {selectedCharacter.stats.atk}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>DEF</Text>
                  <Text style={[styles.statValue, { color: '#4488FF' }]}>
                    {selectedCharacter.stats.def}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>SPD</Text>
                  <Text style={[styles.statValue, { color: '#00CC44' }]}>
                    {selectedCharacter.stats.spd}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>SPE</Text>
                  <Text style={[styles.statValue, { color: '#AA44FF' }]}>
                    {selectedCharacter.stats.special}
                  </Text>
                </View>
              </View>

              <Text style={styles.levelText}>
                LV.{selectedCharacter.level} {'\u25C6'} TOTAL: {selectedCharacter.stats.totalStats}
              </Text>
            </View>
          ) : (
            <View style={styles.noSelection}>
              <Text style={styles.noSelectionText}>
                {hasCharacters
                  ? '\u25A1 No character selected. Go to COLLECTION to pick a fighter.'
                  : '\u25A1 No characters yet. DRAW your first character!'}
              </Text>
              <CyberButton
                title={hasCharacters ? 'GO TO COLLECTION' : 'DRAW CHARACTER'}
                onPress={() =>
                  router.push(hasCharacters ? '/(tabs)/collection' : '/(tabs)/draw')
                }
                color={COLORS.primary}
                size="small"
                style={{ marginTop: 12 }}
              />
            </View>
          )}
        </CyberCard>

        {/* Battle Mode Buttons */}
        <CyberCard style={styles.card} accentColor={COLORS.danger}>
          <Text style={styles.cardTitle}>{'\u25B7'} BATTLE MODES</Text>

          {/* AI Battle */}
          <CyberButton
            title={'\u25B7 AI BATTLE'}
            onPress={handleAiBattle}
            color={COLORS.danger}
            size="large"
            style={styles.battleBtn}
            disabled={!hasSelected}
          />
          <Text style={styles.modeDesc}>
            Battle against a randomly generated AI opponent
          </Text>

          {/* Random Match */}
          <View style={styles.disabledMode}>
            <CyberButton
              title="RANDOM MATCH"
              onPress={() => {}}
              color={COLORS.textDim}
              size="medium"
              style={styles.battleBtn}
              disabled={true}
            />
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>COMING SOON</Text>
            </View>
            <Text style={styles.modeDesc}>
              Match against a random online player
            </Text>
          </View>

          {/* Friend Battle */}
          <View style={styles.disabledMode}>
            <CyberButton
              title="FRIEND BATTLE"
              onPress={() => {}}
              color={COLORS.textDim}
              size="medium"
              style={styles.battleBtn}
              disabled={true}
            />
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>COMING SOON</Text>
            </View>
            <Text style={styles.modeDesc}>
              Challenge a friend to a battle
            </Text>
          </View>
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
  scroll: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  subtitle: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: 3,
    marginTop: 4,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 12,
  },
  selectedInfo: {
    gap: 10,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  characterName: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontFamily: FONTS.heading,
    fontSize: 9,
    color: COLORS.textDim,
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '700',
  },
  levelText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: 1,
    textAlign: 'center',
  },
  noSelection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noSelectionText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: 'center',
    lineHeight: 20,
  },
  battleBtn: {
    width: '100%',
    marginBottom: 4,
  },
  modeDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
    textAlign: 'center',
    marginBottom: 16,
  },
  disabledMode: {
    alignItems: 'center',
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255, 0, 255, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginVertical: 4,
  },
  comingSoonText: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.secondary,
    letterSpacing: 2,
    fontWeight: '700',
  },
});
