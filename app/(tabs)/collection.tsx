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
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { CyberButton, CyberCard, GlowText, CyberInput } from '../../src/components/cyber';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useCollectionStore } from '../../src/stores/collectionStore';
import type { Character, RarityId } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2;

type FilterTab = 'ALL' | RarityId;

const FILTER_TABS: FilterTab[] = ['ALL', 'C', 'UC', 'R', 'SR', 'SSR'];

function getRarityColor(rarityId: string): string {
  const entry = GAME_CONFIG.rarityThresholds.find((r) => r.id === rarityId);
  return entry ? entry.color : '#888888';
}

function getElementInfo(elementId: string) {
  return GAME_CONFIG.elements.find((e) => e.id === elementId);
}

export default function CollectionScreen() {
  const { characters, selectedCharacter, selectCharacter } = useCollectionStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');

  const filteredCharacters = useMemo(() => {
    if (activeFilter === 'ALL') return characters;
    return characters.filter((c) => c.rarity === activeFilter);
  }, [characters, activeFilter]);

  const handleSelectCharacter = (char: Character) => {
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
          <GlowText size={24} color={COLORS.primary}>
            {'\u25C6'} COLLECTION
          </GlowText>
          <Text style={styles.subtitle}>-- YOUR FIGHTERS --</Text>
        </View>

        {/* Character Count */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {'\u25A1'} TOTAL: {characters.length} CHARACTER{characters.length !== 1 ? 'S' : ''}
          </Text>
          {selectedCharacter && (
            <Text style={styles.selectedLabel}>
              {'\u25C8'} SELECTED: {selectedCharacter.name || 'UNNAMED'}
            </Text>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab;
            const tabColor = tab === 'ALL' ? COLORS.primary : getRarityColor(tab);
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterTab,
                  isActive && { borderColor: tabColor, backgroundColor: `${tabColor}15` },
                ]}
                onPress={() => setActiveFilter(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: isActive ? tabColor : COLORS.textDim },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Character Grid */}
        {filteredCharacters.length > 0 ? (
          <View style={styles.grid}>
            {filteredCharacters.map((char) => {
              const isSelected = selectedCharacter?.id === char.id;
              const rarityColor = getRarityColor(char.rarity);
              const elementInfo = getElementInfo(char.element);

              return (
                <TouchableOpacity
                  key={char.id}
                  style={[
                    styles.characterCard,
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
                  activeOpacity={0.8}
                >
                  {/* Rarity indicator dots */}
                  <View style={styles.rarityDots}>
                    {Array.from(
                      { length: FILTER_TABS.indexOf(char.rarity as FilterTab) },
                      (_, i) => (
                        <View
                          key={i}
                          style={[styles.rarityDot, { backgroundColor: rarityColor }]}
                        />
                      )
                    )}
                  </View>

                  {/* Character preview area */}
                  <View style={styles.previewArea}>
                    <Text style={[styles.previewIcon, { color: elementInfo?.color || COLORS.textDim }]}>
                      {'\u25C8'}
                    </Text>
                  </View>

                  {/* Character name */}
                  <Text style={styles.charName} numberOfLines={1}>
                    {char.name || 'No Name'}
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
          /* Empty State */
          <CyberCard style={styles.emptyCard} accentColor={COLORS.textDim}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{'\u25A1'}</Text>
              <Text style={styles.emptyTitle}>
                {activeFilter === 'ALL'
                  ? 'No characters yet.'
                  : `No ${activeFilter} characters.`}
              </Text>
              <Text style={styles.emptySubtext}>
                {activeFilter === 'ALL'
                  ? 'Draw your first character!'
                  : 'Draw more characters to find this rarity.'}
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
    marginBottom: 16,
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
    fontSize: 11,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.08)',
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
