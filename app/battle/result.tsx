import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { GlowText } from '../../src/components/cyber/GlowText';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { CyberCard } from '../../src/components/cyber/CyberCard';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useBattleStore } from '../../src/stores/battleStore';
import { useEquipmentStore } from '../../src/stores/equipmentStore';
import { useAuthStore } from '../../src/stores/authStore';
import { playSE, playBGM, SE, BGM } from '../../src/services/soundService';
import { ParticleEffect } from '../../src/components/cyber/ParticleEffect';
import { useAdControl } from '../../src/hooks/useAdControl';
import { createEquipment } from '../../src/services/equipmentService';

export default function ResultScreen() {
  const router = useRouter();
  const {
    playerCharacter,
    enemyCharacter,
    battleResult,
    isPlayerWinner,
    turns,
    reset,
  } = useBattleStore();

  const { addEquipment } = useEquipmentStore();
  const { user } = useAuthStore();
  const { onBattleEnd, showExpBoostAd } = useAdControl();
  const [expMultiplied, setExpMultiplied] = React.useState(false);
  const [dropSaved, setDropSaved] = React.useState(false);

  const titleScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(1)).current;
  const expBarWidth = useRef(new Animated.Value(0)).current;

  // Play result SE/BGM and notify ad system
  useEffect(() => {
    playSE(isPlayerWinner ? SE.VICTORY : SE.DEFEAT);
    playBGM(isPlayerWinner ? BGM.RESULT_WIN : BGM.RESULT_LOSE);
    onBattleEnd();
  }, []);

  // Save equipment drop to store and DB
  useEffect(() => {
    if (dropSaved || !battleResult?.rewards.equipmentDrop) return;
    const drop = battleResult.rewards.equipmentDrop;
    addEquipment(drop);
    setDropSaved(true);
    // Persist to DB in background
    if (user?.id) {
      createEquipment(user.id, {
        name: drop.name,
        slot: drop.slot,
        rarity: drop.rarity,
        bonusStat: drop.bonusStat,
        bonusValue: drop.bonusValue,
      }).catch(() => {});
    }
  }, [battleResult, dropSaved]);

  useEffect(() => {
    Animated.sequence([
      // Flash
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      // Title appears
      Animated.parallel([
        Animated.spring(titleScale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Content fades in
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // EXP bar animation
    Animated.timing(expBarWidth, {
      toValue: 1,
      duration: 1000,
      delay: 1200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, []);

  if (!playerCharacter || !enemyCharacter || !battleResult) return null;

  // Calculate stats
  const totalDamageDealt = turns
    .filter(t => t.attacker === 'player1' && t.damage > 0)
    .reduce((sum, t) => sum + t.damage, 0);

  const totalDamageTaken = turns
    .filter(t => t.attacker === 'player2' && t.damage > 0)
    .reduce((sum, t) => sum + t.damage, 0);

  const totalTurns = turns.length > 0 ? turns[turns.length - 1].turn : 0;

  const specialMovesUsed = turns.filter(
    t => t.attacker === 'player1' && t.isSpecial
  ).length;

  const criticalHits = turns.filter(
    t => t.attacker === 'player1' && t.isCritical
  ).length;

  const baseExpGained = battleResult.rewards.expGained;
  const expGained = expMultiplied ? baseExpGained * 2 : baseExpGained;
  const equipmentDrop = battleResult.rewards.equipmentDrop;

  const eqRarityColors: Record<string, string> = {
    normal: '#888888', rare: '#00FFFF', epic: '#FFD700',
  };
  const STAT_LABELS: Record<string, string> = {
    hp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD', special: 'SPE',
  };

  const resultColor = isPlayerWinner ? COLORS.primary : COLORS.danger;
  const resultText = isPlayerWinner ? 'VICTORY' : 'DEFEATED';

  const expWidth = expBarWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleHome = () => {
    reset();
    router.replace('/(tabs)');
  };

  const handleRematch = () => {
    // Preserve playerCharacter for rematch, only reset battle state
    const savedChar = playerCharacter;
    reset();
    if (savedChar) {
      useBattleStore.getState().setPlayerCharacter(savedChar);
      useBattleStore.getState().setPhase('matching');
    }
    router.replace('/battle/matching');
  };

  const getElementName = (elementId: string) => {
    return GAME_CONFIG.elements.find(e => e.id === elementId)?.name || elementId;
  };

  const getRarityColor = (rarityId: string) => {
    return GAME_CONFIG.rarityThresholds.find(r => r.id === rarityId)?.color || COLORS.text;
  };

  return (
    <View style={styles.container}>
      <GridBackground />

      {/* Initial flash */}
      <Animated.View
        style={[
          styles.flash,
          {
            opacity: flashOpacity,
            backgroundColor: isPlayerWinner ? COLORS.primary : COLORS.danger,
          },
        ]}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Result title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ scale: titleScale }],
            },
          ]}
        >
          <GlowText size={42} color={resultColor}>
            {resultText}
          </GlowText>
          <Text style={[styles.resultSubtext, { color: resultColor }]}>
            {isPlayerWinner ? '\u25C6 BATTLE COMPLETE \u25C6' : '\u25C7 BATTLE COMPLETE \u25C7'}
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity }}>
          {/* EXP gained */}
          <CyberCard style={styles.card} accentColor={COLORS.warning}>
            <Text style={styles.sectionTitle}>{'\u25B7'} EXP GAINED</Text>
            <View style={styles.expRow}>
              <GlowText size={32} color={COLORS.warning}>
                +{expGained}
              </GlowText>
              <Text style={styles.expLabel}>EXP</Text>
            </View>
            <View style={styles.expBarTrack}>
              <Animated.View
                style={[
                  styles.expBarFill,
                  { width: expWidth },
                ]}
              />
            </View>
          </CyberCard>

          {/* EXP 2x reward ad button */}
          {!expMultiplied && (
            <CyberButton
              title={'\u25B6 WATCH AD FOR 2x EXP'}
              onPress={() => {
                showExpBoostAd(() => {
                  setExpMultiplied(true);
                  playSE(SE.LEVELUP);
                });
              }}
              color={COLORS.warning}
              size="medium"
              style={styles.rewardButton}
            />
          )}

          {/* Equipment drop */}
          {equipmentDrop && (
            <CyberCard style={styles.card} accentColor={eqRarityColors[equipmentDrop.rarity] || COLORS.primary}>
              <Text style={styles.sectionTitle}>{'\u25C7'} EQUIPMENT DROP!</Text>
              <View style={styles.dropRow}>
                <View style={styles.dropInfo}>
                  <Text style={[styles.dropName, { color: eqRarityColors[equipmentDrop.rarity] }]}>
                    {equipmentDrop.name}
                  </Text>
                  <Text style={styles.dropRarity}>
                    {equipmentDrop.rarity.toUpperCase()} {equipmentDrop.slot.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.dropStatBadge}>
                  <Text style={styles.dropStatLabel}>{STAT_LABELS[equipmentDrop.bonusStat]}</Text>
                  <Text style={[styles.dropStatValue, { color: COLORS.success }]}>+{equipmentDrop.bonusValue}</Text>
                </View>
              </View>
            </CyberCard>
          )}

          {/* Battle stats */}
          <CyberCard style={styles.card} accentColor={COLORS.primary}>
            <Text style={styles.sectionTitle}>{'\u25B7'} BATTLE STATS</Text>

            <View style={styles.statLine}>
              <Text style={styles.statLabel}>{'\u25C8'} Damage Dealt</Text>
              <Text style={[styles.statValue, { color: COLORS.danger }]}>{totalDamageDealt}</Text>
            </View>

            <View style={styles.statLine}>
              <Text style={styles.statLabel}>{'\u25C8'} Damage Taken</Text>
              <Text style={[styles.statValue, { color: COLORS.warning }]}>{totalDamageTaken}</Text>
            </View>

            <View style={styles.statLine}>
              <Text style={styles.statLabel}>{'\u25C8'} Turns</Text>
              <Text style={styles.statValue}>{totalTurns}</Text>
            </View>

            <View style={styles.statLine}>
              <Text style={styles.statLabel}>{'\u25C8'} Special Moves</Text>
              <Text style={[styles.statValue, { color: COLORS.secondary }]}>{specialMovesUsed}</Text>
            </View>

            <View style={styles.statLine}>
              <Text style={styles.statLabel}>{'\u25C8'} Critical Hits</Text>
              <Text style={[styles.statValue, { color: COLORS.warning }]}>{criticalHits}</Text>
            </View>
          </CyberCard>

          {/* Character comparison */}
          <CyberCard style={styles.card} accentColor={COLORS.secondary}>
            <Text style={styles.sectionTitle}>{'\u25B7'} COMBATANTS</Text>

            <View style={styles.comparisonHeader}>
              <Text style={[styles.compName, { color: COLORS.primary }]}>
                {playerCharacter.name || 'PLAYER'}
              </Text>
              <Text style={styles.compVs}>VS</Text>
              <Text style={[styles.compName, { color: COLORS.danger }]}>
                {enemyCharacter.name || 'ENEMY'}
              </Text>
            </View>

            {/* Rarity & Element */}
            <View style={styles.compRow}>
              <Text style={[styles.compValue, { color: getRarityColor(playerCharacter.rarity) }]}>
                {'\u25C6'}{playerCharacter.rarity}
              </Text>
              <Text style={styles.compLabel}>RARITY</Text>
              <Text style={[styles.compValue, { color: getRarityColor(enemyCharacter.rarity) }]}>
                {'\u25C6'}{enemyCharacter.rarity}
              </Text>
            </View>

            <View style={styles.compRow}>
              <Text style={[styles.compValue, { color: GAME_CONFIG.elements.find(e => e.id === playerCharacter.element)?.color }]}>
                {getElementName(playerCharacter.element)}
              </Text>
              <Text style={styles.compLabel}>ELEMENT</Text>
              <Text style={[styles.compValue, { color: GAME_CONFIG.elements.find(e => e.id === enemyCharacter.element)?.color }]}>
                {getElementName(enemyCharacter.element)}
              </Text>
            </View>

            {/* Stat comparison */}
            {(['hp', 'atk', 'def', 'spd', 'special'] as const).map(key => {
              const pVal = playerCharacter.stats[key];
              const eVal = enemyCharacter.stats[key];
              const pColor = pVal > eVal ? COLORS.success : pVal < eVal ? COLORS.danger : COLORS.text;
              const eColor = eVal > pVal ? COLORS.success : eVal < pVal ? COLORS.danger : COLORS.text;

              return (
                <View key={key} style={styles.compRow}>
                  <Text style={[styles.compValue, { color: pColor }]}>{pVal}</Text>
                  <Text style={styles.compLabel}>{key.toUpperCase()}</Text>
                  <Text style={[styles.compValue, { color: eColor }]}>{eVal}</Text>
                </View>
              );
            })}

            <View style={[styles.compRow, styles.compTotalRow]}>
              <Text style={[styles.compValue, styles.compTotal]}>{playerCharacter.stats.totalStats}</Text>
              <Text style={styles.compLabel}>TOTAL</Text>
              <Text style={[styles.compValue, styles.compTotal]}>{enemyCharacter.stats.totalStats}</Text>
            </View>
          </CyberCard>

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            <CyberButton
              title={'\u25C8 HOME'}
              onPress={handleHome}
              color={COLORS.primary}
              style={styles.button}
              size="large"
            />
            <CyberButton
              title={'\u25B7 REMATCH'}
              onPress={handleRematch}
              color={COLORS.secondary}
              style={styles.button}
              size="large"
            />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Victory particles */}
      {isPlayerWinner && (
        <ParticleEffect
          color={COLORS.primary}
          count={30}
          duration={2000}
          spread={300}
          active={true}
        />
      )}

      <ScanlineOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultSubtext: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: 3,
    marginTop: 8,
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.textDim,
    letterSpacing: 2,
    marginBottom: 12,
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  expLabel: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.warning,
    letterSpacing: 2,
    opacity: 0.7,
  },
  expBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 221, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  expBarFill: {
    height: '100%',
    backgroundColor: COLORS.warning,
    borderRadius: 3,
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 255, 0.05)',
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text,
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 255, 0.15)',
  },
  compName: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  compVs: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.textDim,
    marginHorizontal: 8,
    letterSpacing: 2,
  },
  compRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  compLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textDim,
    letterSpacing: 2,
    minWidth: 60,
    textAlign: 'center',
  },
  compValue: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    letterSpacing: 1,
  },
  compTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 0, 255, 0.15)',
  },
  compTotal: {
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  rewardButton: {
    marginBottom: 16,
  },
  dropRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropInfo: {
    flex: 1,
  },
  dropName: {
    fontFamily: FONTS.body,
    fontSize: 18,
    fontWeight: '700',
  },
  dropRarity: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textDim,
    letterSpacing: 2,
    marginTop: 2,
  },
  dropStatBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  dropStatLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textDim,
    letterSpacing: 1,
  },
  dropStatValue: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    fontWeight: '700',
  },
});
