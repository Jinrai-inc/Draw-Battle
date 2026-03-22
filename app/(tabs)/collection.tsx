import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { CyberCard, GlowText } from '../../src/components/cyber';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { CharacterSprite } from '../../src/components/CharacterSprite';
import { useCollectionStore } from '../../src/stores/collectionStore';
import type { Character, RarityId, ElementId } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2;

type RarityFilter = 'ALL' | RarityId;
type ElementFilter = 'ALL' | ElementId;

const RARITY_TABS: RarityFilter[] = ['ALL', 'C', 'UC', 'R', 'SR', 'SSR'];
const ELEMENT_TABS: { id: ElementFilter; label: string; color: string }[] = [
  { id: 'ALL', label: 'ALL', color: COLORS.primary },
  ...GAME_CONFIG.elements.map(e => ({ id: e.id as ElementFilter, label: e.name, color: e.color })),
];

function getRarityColor(rarityId: string): string {
  return GAME_CONFIG.rarityThresholds.find(r => r.id === rarityId)?.color || '#888888';
}

function getElementInfo(elementId: string) {
  return GAME_CONFIG.elements.find(e => e.id === elementId);
}

export default function CollectionScreen() {
  const router = useRouter();
  const { characters, selectedCharacter, selectCharacter } = useCollectionStore();
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('ALL');
  const [elementFilter, setElementFilter] = useState<ElementFilter>('ALL');

  const filteredCharacters = useMemo(() => {
    let result = characters;
    if (rarityFilter !== 'ALL') result = result.filter(c => c.rarity === rarityFilter);
    if (elementFilter !== 'ALL') result = result.filter(c => c.element === elementFilter);
    return result;
  }, [characters, rarityFilter, elementFilter]);

  // Collection completion rate: 5 elements x 5 rarities (excl UR) = 25 slots
  const completionMatrix = useMemo(() => {
    const matrix: Record<string, Set<string>> = {};
    for (const el of GAME_CONFIG.elements) {
      matrix[el.id] = new Set();
    }
    for (const char of characters) {
      if (char.rarity !== 'UR') {
        matrix[char.element]?.add(char.rarity);
      }
    }
    let filled = 0;
    const total = GAME_CONFIG.elements.length * 5; // C, UC, R, SR, SSR
    for (const el of GAME_CONFIG.elements) {
      filled += matrix[el.id].size;
    }
    return { matrix, filled, total, percent: total > 0 ? Math.round((filled / total) * 100) : 0 };
  }, [characters]);

  const handleSelectCharacter = (char: Character) => {
    if (selectedCharacter?.id === char.id) {
      selectCharacter(null);
    } else {
      selectCharacter(char);
    }
  };

  const handleCardLongPress = (char: Character) => {
    router.push(`/character/${char.id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <GlowText size={24} color={COLORS.primary}>
            {'\u25C6'} COLLECTION
          </GlowText>
          <Text style={styles.subtitle}>-- YOUR FIGHTERS --</Text>
        </View>

        {/* Completion Rate */}
        <CyberCard style={styles.completionCard} accentColor={COLORS.secondary}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionTitle}>{'\u25C8'} COMPLETION</Text>
            <Text style={[styles.completionPercent, {
              color: completionMatrix.percent >= 100 ? '#FF69B4' :
                completionMatrix.percent >= 50 ? COLORS.warning : COLORS.primary
            }]}>
              {completionMatrix.percent}%
            </Text>
          </View>
          <View style={styles.completionBar}>
            <View style={[styles.completionFill, {
              width: `${completionMatrix.percent}%`,
              backgroundColor: completionMatrix.percent >= 100 ? '#FF69B4' :
                completionMatrix.percent >= 50 ? COLORS.warning : COLORS.primary
            }]} />
          </View>
          {/* Mini matrix */}
          <View style={styles.matrixContainer}>
            <View style={styles.matrixRow}>
              <Text style={styles.matrixCorner}> </Text>
              {['C', 'UC', 'R', 'SR', 'SSR'].map(r => (
                <Text key={r} style={[styles.matrixHeader, { color: getRarityColor(r) }]}>{r}</Text>
              ))}
            </View>
            {GAME_CONFIG.elements.map(el => (
              <View key={el.id} style={styles.matrixRow}>
                <Text style={[styles.matrixElementLabel, { color: el.color }]}>{el.name}</Text>
                {['C', 'UC', 'R', 'SR', 'SSR'].map(r => {
                  const has = completionMatrix.matrix[el.id]?.has(r);
                  return (
                    <Text key={r} style={[styles.matrixCell, { color: has ? el.color : 'rgba(255,255,255,0.1)' }]}>
                      {has ? '\u25C6' : '\u25C7'}
                    </Text>
                  );
                })}
              </View>
            ))}
          </View>
          <Text style={styles.completionCount}>
            {completionMatrix.filled}/{completionMatrix.total} slots {'\u25C6'} {characters.length} characters total
          </Text>
        </CyberCard>

        {/* Character Count & Selection */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {'\u25A1'} SHOWING: {filteredCharacters.length}
          </Text>
          {selectedCharacter && (
            <Text style={styles.selectedLabel}>
              {'\u25C8'} SELECTED: {selectedCharacter.name || 'UNNAMED'}
            </Text>
          )}
        </View>

        {/* Rarity Filter */}
        <View style={styles.filterRow}>
          {RARITY_TABS.map(tab => {
            const isActive = rarityFilter === tab;
            const tabColor = tab === 'ALL' ? COLORS.primary : getRarityColor(tab);
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, isActive && { borderColor: tabColor, backgroundColor: `${tabColor}15` }]}
                onPress={() => setRarityFilter(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, { color: isActive ? tabColor : COLORS.textDim }]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Element Filter */}
        <View style={styles.filterRow}>
          {ELEMENT_TABS.map(tab => {
            const isActive = elementFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterTab, isActive && { borderColor: tab.color, backgroundColor: `${tab.color}15` }]}
                onPress={() => setElementFilter(tab.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, { color: isActive ? tab.color : COLORS.textDim }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Character Grid */}
        {filteredCharacters.length > 0 ? (
          <View style={styles.grid}>
            {filteredCharacters.map(char => {
              const isSelected = selectedCharacter?.id === char.id;
              const rarityColor = getRarityColor(char.rarity);
              const elementInfo = getElementInfo(char.element);

              return (
                <TouchableOpacity
                  key={char.id}
                  style={[
                    styles.characterCard,
                    char.isEvolved && { borderColor: rarityColor, shadowColor: rarityColor, shadowOpacity: 0.6, shadowRadius: 8, elevation: 4 },
                    isSelected && {
                      borderColor: COLORS.primary,
                      borderWidth: 2,
                      shadowColor: COLORS.primary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 10,
                      elevation: 6,
                    },
                  ]}
                  onPress={() => handleSelectCharacter(char)}
                  onLongPress={() => handleCardLongPress(char)}
                  activeOpacity={0.8}
                >
                  {/* Rarity indicator dots */}
                  <View style={styles.rarityDots}>
                    {Array.from(
                      { length: Math.min(RARITY_TABS.indexOf(char.rarity as RarityFilter), 6) },
                      (_, i) => (
                        <View key={i} style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
                      )
                    )}
                  </View>

                  {/* Character preview area */}
                  <View style={[styles.previewArea, char.isEvolved && { borderColor: rarityColor }]}>
                    {char.imageBase64 ? (
                      <CharacterSprite
                        imageBase64={char.imageBase64}
                        size={70}
                        animate={false}
                        glowColor={elementInfo?.color || COLORS.primary}
                      />
                    ) : (
                      <Text style={[styles.previewIcon, { color: elementInfo?.color || COLORS.textDim }]}>
                        {'\u25C8'}
                      </Text>
                    )}
                  </View>

                  {/* Character name */}
                  <Text style={styles.charName} numberOfLines={1}>
                    {char.name || char.specialMoveName || 'No Name'}
                  </Text>

                  {/* Element and rarity */}
                  <View style={styles.charInfoRow}>
                    <Text style={[styles.elementLabel, { color: elementInfo?.color || COLORS.textDim }]}>
                      {elementInfo?.name || '?'}
                    </Text>
                    <Text style={[styles.rarityLabel, { color: rarityColor }]}>
                      {char.rarity}
                    </Text>
                  </View>

                  {/* Level */}
                  <Text style={styles.levelLabel}>LV.{char.level}</Text>

                  {/* Stats summary */}
                  <View style={styles.miniStats}>
                    <Text style={styles.miniStatText}>
                      HP:{char.stats.hp} A:{char.stats.atk}
                    </Text>
                    <Text style={styles.miniStatText}>
                      D:{char.stats.def} S:{char.stats.spd}
                    </Text>
                  </View>

                  {/* Selected indicator */}
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>{'\u25B7'} SEL</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <CyberCard style={styles.emptyCard} accentColor={COLORS.textDim}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{'\u25A1'}</Text>
              <Text style={styles.emptyTitle}>
                {rarityFilter === 'ALL' && elementFilter === 'ALL'
                  ? 'No characters yet.'
                  : 'No matching characters.'}
              </Text>
              <Text style={styles.emptySubtext}>
                {rarityFilter === 'ALL' && elementFilter === 'ALL'
                  ? 'Draw your first character!'
                  : 'Try different filters or draw more characters.'}
              </Text>
            </View>
          </CyberCard>
        )}
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
    marginBottom: 12,
    marginTop: 10,
  },
  subtitle: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: 3,
    marginTop: 4,
  },
  completionCard: {
    marginBottom: 16,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionTitle: {
    fontFamily: FONTS.heading,
    fontSize: 13,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  completionPercent: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    fontWeight: '700',
  },
  completionBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  completionFill: {
    height: '100%',
    borderRadius: 2,
  },
  matrixContainer: {
    marginBottom: 8,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  matrixCorner: {
    width: 24,
    fontSize: 9,
    fontFamily: FONTS.mono,
    color: COLORS.textDim,
  },
  matrixHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 8,
    fontFamily: FONTS.mono,
    letterSpacing: 0.5,
  },
  matrixElementLabel: {
    width: 24,
    fontSize: 10,
    fontFamily: FONTS.body,
    fontWeight: '700',
  },
  matrixCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
  },
  completionCount: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textDim,
    textAlign: 'center',
    letterSpacing: 1,
  },
  countRow: {
    marginBottom: 12,
  },
  countText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.text,
    letterSpacing: 1,
  },
  selectedLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.primary,
    letterSpacing: 1,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  filterTabText: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  characterCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.15)',
    padding: 10,
    position: 'relative',
  },
  rarityDots: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 6,
    height: 8,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  previewArea: {
    width: '100%',
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.15)',
  },
  previewIcon: {
    fontSize: 32,
  },
  charName: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  charInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  elementLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: '700',
  },
  rarityLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  levelLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textDim,
    letterSpacing: 1,
    marginBottom: 4,
  },
  miniStats: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,255,255,0.1)',
    paddingTop: 4,
  },
  miniStatText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textDim,
    letterSpacing: 0.5,
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,255,255,0.2)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  selectedBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    color: COLORS.textDim,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.text,
    letterSpacing: 2,
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: 'center',
  },
});
