import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { CyberButton, CyberCard, GlowText } from '../../src/components/cyber';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useBattleStore } from '../../src/stores/battleStore';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import type { Character } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PICKER_CARD_SIZE = 80;

function getElementInfo(elementId: string) {
  return GAME_CONFIG.elements.find(e => e.id === elementId);
}

function getRarityColor(rarityId: string): string {
  return GAME_CONFIG.rarityThresholds.find(r => r.id === rarityId)?.color || '#888888';
}

export default function BattleScreen() {
  const router = useRouter();
  const { setPlayerCharacter, setPhase } = useBattleStore();
  const { selectedCharacter, characters, selectCharacter } = useCollectionStore();
  const { isOnline } = useNetworkStatus();

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

  const handlePickCharacter = (char: Character) => {
    if (selectedCharacter?.id === char.id) {
      selectCharacter(null);
    } else {
      selectCharacter(char);
    }
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
          <Text style={styles.subtitle}>-- SELECT FIGHTER & MODE --</Text>
        </View>

        {/* Character Picker */}
        {hasCharacters && (
          <View style={styles.pickerSection}>
            <Text style={styles.pickerTitle}>{'\u25C6'} SELECT FIGHTER</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pickerScroll}
            >
              {characters.map(char => {
                const isSelected = selectedCharacter?.id === char.id;
                const elInfo = getElementInfo(char.element);
                const rarityColor = getRarityColor(char.rarity);
                return (
                  <TouchableOpacity
                    key={char.id}
                    style={[
                      styles.pickerCard,
                      isSelected && {
                        borderColor: COLORS.primary,
                        borderWidth: 2,
                        shadowColor: COLORS.primary,
                        shadowOpacity: 0.8,
                        shadowRadius: 8,
                        elevation: 6,
                      },
                    ]}
                    onPress={() => handlePickCharacter(char)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.pickerIcon, { borderColor: elInfo?.color || COLORS.textDim }]}>
                      <Text style={[styles.pickerIconText, { color: elInfo?.color || COLORS.textDim }]}>
                        {'\u25C8'}
                      </Text>
                    </View>
                    <Text style={styles.pickerName} numberOfLines={1}>
                      {char.name || 'No Name'}
                    </Text>
                    <Text style={[styles.pickerRarity, { color: rarityColor }]}>
                      {char.rarity}
                    </Text>
                    {isSelected && (
                      <View style={styles.pickerSelectedDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

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
                  ? '\u25A1 Tap a character above to select your fighter.'
                  : '\u25A1 No characters yet. DRAW your first character!'}
              </Text>
              {!hasCharacters && (
                <CyberButton
                  title="DRAW CHARACTER"
                  onPress={() => router.push('/(tabs)/draw')}
                  color={COLORS.primary}
                  size="small"
                  style={{ marginTop: 12 }}
                />
              )}
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
          <CyberButton
            title={'\u25C8 RANDOM MATCH'}
            onPress={() => {
              if (!selectedCharacter) return;
              setPlayerCharacter(selectedCharacter);
              setPhase('matching');
              router.push('/battle/matching?mode=random' as any);
            }}
            color={COLORS.secondary}
            size="medium"
            style={styles.battleBtn}
            disabled={!hasSelected || !isOnline}
          />
          <Text style={styles.modeDesc}>
            {isOnline
              ? 'Match against a random online player via Supabase Realtime'
              : '\u25C8 OFFLINE - Online match unavailable'}
          </Text>

          {/* Friend Battle */}
          <CyberButton
            title={'\u25A1 FRIEND BATTLE'}
            onPress={() => {
              if (!selectedCharacter) return;
              setPlayerCharacter(selectedCharacter);
              setPhase('matching');
              router.push('/battle/matching?mode=friend' as any);
            }}
            color={COLORS.primary}
            size="medium"
            style={styles.battleBtn}
            disabled={!hasSelected || !isOnline}
          />
          <Text style={styles.modeDesc}>
            {isOnline
              ? 'Challenge a friend (offline friends battle their best AI character)'
              : '\u25C8 OFFLINE - Friend battle unavailable'}
          </Text>
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
    marginBottom: 16,
    marginTop: 10,
  },
  subtitle: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: 3,
    marginTop: 4,
  },
  // Character picker
  pickerSection: {
    marginBottom: 16,
  },
  pickerTitle: {
    fontFamily: FONTS.heading,
    fontSize: 13,
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 10,
  },
  pickerScroll: {
    gap: 10,
    paddingRight: 10,
  },
  pickerCard: {
    width: PICKER_CARD_SIZE,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.15)',
    padding: 8,
    alignItems: 'center',
    position: 'relative',
  },
  pickerIcon: {
    width: 44,
    height: 44,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pickerIconText: {
    fontSize: 20,
  },
  pickerName: {
    fontFamily: FONTS.heading,
    fontSize: 9,
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  pickerRarity: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  pickerSelectedDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  // Cards
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
});
