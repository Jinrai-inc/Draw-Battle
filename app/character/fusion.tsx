import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { CyberCard } from '../../src/components/cyber/CyberCard';
import { GlowText } from '../../src/components/cyber/GlowText';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useTitleStore } from '../../src/stores/titleStore';
import { determineElement, determineRarity } from '../../src/engine/drawingAnalyzer';
import type { Character, ElementId } from '../../src/types';

function getRarityColor(rarityId: string): string {
  return GAME_CONFIG.rarityThresholds.find(r => r.id === rarityId)?.color || '#888888';
}

function getElementInfo(elementId: string) {
  return GAME_CONFIG.elements.find(e => e.id === elementId);
}

export default function FusionScreen() {
  const router = useRouter();
  const { characters, addCharacter, removeCharacter } = useCollectionStore();
  const { incrementSyntheses } = useTitleStore();

  const [char1, setChar1] = useState<Character | null>(null);
  const [char2, setChar2] = useState<Character | null>(null);
  const [phase, setPhase] = useState<'select' | 'fusing' | 'result'>('select');
  const [resultChar, setResultChar] = useState<Character | null>(null);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  const availableChars = characters.filter(
    c => c.id !== char1?.id && c.id !== char2?.id
  );

  const handleSelectSlot = (slot: 1 | 2, char: Character) => {
    if (slot === 1) setChar1(char);
    else setChar2(char);
  };

  const handleFuse = () => {
    if (!char1 || !char2) return;

    Alert.alert(
      'Confirm Fusion',
      'Both characters will be consumed. The result will be a new character with averaged stats + bonus. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'FUSE', style: 'destructive', onPress: executeFusion },
      ]
    );
  };

  const executeFusion = () => {
    if (!char1 || !char2) return;
    setPhase('fusing');

    // Fusion animation
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(resultScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.timing(resultOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // Calculate fused stats
      const bonus = Math.floor(Math.random() * 6) + 3; // 3-8 random bonus
      const fusedStats = {
        hp: Math.round((char1.stats.hp + char2.stats.hp) / 2) + bonus,
        atk: Math.round((char1.stats.atk + char2.stats.atk) / 2) + bonus,
        def: Math.round((char1.stats.def + char2.stats.def) / 2) + bonus,
        spd: Math.round((char1.stats.spd + char2.stats.spd) / 2) + bonus,
        special: Math.round((char1.stats.special + char2.stats.special) / 2) + bonus,
        totalStats: 0,
      };
      fusedStats.totalStats = fusedStats.hp + fusedStats.atk + fusedStats.def + fusedStats.spd + fusedStats.special;

      // Clamp stats
      const clamp = (v: number) => Math.max(GAME_CONFIG.stats.minStat, Math.min(GAME_CONFIG.stats.maxStat, v));
      fusedStats.hp = clamp(fusedStats.hp);
      fusedStats.atk = clamp(fusedStats.atk);
      fusedStats.def = clamp(fusedStats.def);
      fusedStats.spd = clamp(fusedStats.spd);
      fusedStats.special = clamp(fusedStats.special);
      fusedStats.totalStats = fusedStats.hp + fusedStats.atk + fusedStats.def + fusedStats.spd + fusedStats.special;

      // Pick element from the higher total-stat parent
      const fusedElement: ElementId = char1.stats.totalStats >= char2.stats.totalStats
        ? char1.element : char2.element;

      const fusedRarity = determineRarity(fusedStats.totalStats);

      const newChar: Character = {
        id: `fused_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: char1.userId,
        imageUrl: '',
        name: `${(char1.name || 'X').substring(0, 4)}+${(char2.name || 'X').substring(0, 4)}`,
        specialMoveName: char1.stats.special >= char2.stats.special
          ? char1.specialMoveName : char2.specialMoveName,
        stats: fusedStats,
        element: fusedElement,
        rarity: fusedRarity,
        level: 1,
        exp: 0,
        battleCount: 0,
        isEvolved: false,
        createdAt: new Date().toISOString(),
      };

      setResultChar(newChar);

      // Remove consumed characters and add new one
      removeCharacter(char1.id);
      removeCharacter(char2.id);
      addCharacter(newChar);
      incrementSyntheses();

      setPhase('result');
    });
  };

  const renderCharSlot = (slot: 1 | 2, char: Character | null) => {
    const slotColor = slot === 1 ? COLORS.primary : COLORS.danger;
    return (
      <View style={styles.fusionSlot}>
        <Text style={[styles.slotLabel, { color: slotColor }]}>
          MATERIAL {slot}
        </Text>
        {char ? (
          <View style={[styles.slotCard, { borderColor: slotColor }]}>
            <Text style={[styles.slotIcon, { color: getElementInfo(char.element)?.color }]}>
              {'\u25C8'}
            </Text>
            <Text style={styles.slotCharName} numberOfLines={1}>
              {char.name || char.specialMoveName}
            </Text>
            <Text style={[styles.slotRarity, { color: getRarityColor(char.rarity) }]}>
              {char.rarity} {'\u25C6'} LV.{char.level}
            </Text>
            <Text style={styles.slotTotal}>TOTAL: {char.stats.totalStats}</Text>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => slot === 1 ? setChar1(null) : setChar2(null)}
            >
              <Text style={styles.removeBtnText}>X</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.emptySlot, { borderColor: slotColor }]}>
            <Text style={[styles.emptySlotText, { color: slotColor }]}>
              {'\u25A1'} SELECT
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />

      <Animated.View
        style={[styles.flash, { opacity: flashAnim }]}
        pointerEvents="none"
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <CyberButton title={'\u25C1 BACK'} onPress={() => router.back()} size="small" />
          <GlowText size={22} color={COLORS.secondary}>
            {'\u25C6'} FUSION {'\u25C6'}
          </GlowText>
        </View>

        {phase === 'select' && (
          <>
            {/* Fusion slots */}
            <View style={styles.fusionRow}>
              {renderCharSlot(1, char1)}
              <View style={styles.plusSign}>
                <Text style={styles.plusText}>+</Text>
              </View>
              {renderCharSlot(2, char2)}
            </View>

            {/* Fuse button */}
            <CyberButton
              title={'\u25C6 FUSE'}
              onPress={handleFuse}
              color={COLORS.warning}
              size="large"
              style={styles.fuseBtn}
              disabled={!char1 || !char2}
            />

            {/* Character picker */}
            <CyberCard style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>{'\u25B7'} SELECT MATERIALS</Text>
              {availableChars.length > 0 ? (
                <View style={styles.pickerGrid}>
                  {availableChars.map(char => {
                    const elInfo = getElementInfo(char.element);
                    return (
                      <TouchableOpacity
                        key={char.id}
                        style={styles.pickerItem}
                        onPress={() => {
                          if (!char1) handleSelectSlot(1, char);
                          else if (!char2) handleSelectSlot(2, char);
                        }}
                        disabled={!!char1 && !!char2}
                      >
                        <Text style={[styles.pickerIcon, { color: elInfo?.color }]}>
                          {'\u25C8'}
                        </Text>
                        <Text style={styles.pickerName} numberOfLines={1}>
                          {char.name || char.specialMoveName || '?'}
                        </Text>
                        <Text style={[styles.pickerRarity, { color: getRarityColor(char.rarity) }]}>
                          {char.rarity}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.noCharsText}>
                  Need at least 2 characters to fuse.
                </Text>
              )}
            </CyberCard>
          </>
        )}

        {phase === 'result' && resultChar && (
          <Animated.View style={{ opacity: resultOpacity, transform: [{ scale: resultScale }] }}>
            <View style={styles.resultHeader}>
              <GlowText size={28} color={COLORS.warning}>
                FUSION COMPLETE!
              </GlowText>
            </View>

            <CyberCard style={styles.resultCard} accentColor={getRarityColor(resultChar.rarity)}>
              <View style={styles.resultCharDisplay}>
                <Text style={[styles.resultIcon, { color: getElementInfo(resultChar.element)?.color }]}>
                  {'\u25C8'}
                </Text>
                <Text style={[styles.resultName, { color: getRarityColor(resultChar.rarity) }]}>
                  {resultChar.name}
                </Text>
                <Text style={[styles.resultRarity, { color: getRarityColor(resultChar.rarity) }]}>
                  {'\u25C6'.repeat(Math.min(['C','UC','R','SR','SSR','UR'].indexOf(resultChar.rarity) + 1, 6))} {resultChar.rarity}
                </Text>
              </View>

              {(['hp', 'atk', 'def', 'spd', 'special'] as const).map(key => (
                <View key={key} style={styles.resultStatRow}>
                  <Text style={styles.resultStatLabel}>{key.toUpperCase()}</Text>
                  <Text style={styles.resultStatValue}>{resultChar.stats[key]}</Text>
                </View>
              ))}

              <View style={[styles.resultStatRow, { borderTopWidth: 1, borderTopColor: 'rgba(0,255,255,0.1)', paddingTop: 8 }]}>
                <Text style={styles.resultStatLabel}>TOTAL</Text>
                <Text style={[styles.resultStatValue, { color: COLORS.warning }]}>
                  {resultChar.stats.totalStats}
                </Text>
              </View>
            </CyberCard>

            <CyberButton
              title={'\u25C8 DONE'}
              onPress={() => router.replace('/(tabs)/collection')}
              color={COLORS.primary}
              size="large"
              style={{ marginTop: 16 }}
            />
          </Animated.View>
        )}
      </ScrollView>

      <ScanlineOverlay />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.warning, zIndex: 100 },
  scroll: { flex: 1, zIndex: 10 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  fusionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
  fusionSlot: { flex: 1, alignItems: 'center' },
  slotLabel: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  slotCard: {
    width: '100%', padding: 12, borderWidth: 2, borderRadius: 8,
    backgroundColor: COLORS.backgroundCard, alignItems: 'center', position: 'relative',
  },
  slotIcon: { fontSize: 32, marginBottom: 4 },
  slotCharName: { fontFamily: FONTS.heading, fontSize: 11, color: COLORS.text, letterSpacing: 1, marginBottom: 2 },
  slotRarity: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, marginBottom: 2 },
  slotTotal: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim },
  removeBtn: {
    position: 'absolute', top: 4, right: 4, width: 20, height: 20,
    borderRadius: 10, backgroundColor: 'rgba(255,0,0,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.danger, fontWeight: '700' },
  emptySlot: {
    width: '100%', height: 120, borderWidth: 2, borderRadius: 8, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)',
  },
  emptySlotText: { fontFamily: FONTS.heading, fontSize: 14, letterSpacing: 2 },
  plusSign: { marginHorizontal: 4 },
  plusText: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.warning },
  fuseBtn: { marginBottom: 20 },
  pickerCard: { marginTop: 0 },
  pickerTitle: { fontFamily: FONTS.heading, fontSize: 13, color: COLORS.primary, letterSpacing: 2, marginBottom: 12 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerItem: {
    width: '30%', padding: 8, borderWidth: 1, borderColor: 'rgba(0,255,255,0.15)',
    borderRadius: 4, backgroundColor: COLORS.backgroundCard, alignItems: 'center',
  },
  pickerIcon: { fontSize: 20, marginBottom: 2 },
  pickerName: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.text, letterSpacing: 0.5 },
  pickerRarity: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1 },
  noCharsText: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.textDim, textAlign: 'center', paddingVertical: 20 },
  resultHeader: { alignItems: 'center', marginBottom: 20 },
  resultCard: { marginTop: 0 },
  resultCharDisplay: { alignItems: 'center', marginBottom: 16 },
  resultIcon: { fontSize: 48, marginBottom: 8 },
  resultName: { fontFamily: FONTS.heading, fontSize: 20, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  resultRarity: { fontFamily: FONTS.mono, fontSize: 14, letterSpacing: 1 },
  resultStatRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  resultStatLabel: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.textDim, letterSpacing: 2 },
  resultStatValue: { fontFamily: FONTS.mono, fontSize: 16, color: COLORS.primary, fontWeight: '700' },
});
