import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { GlowText } from '../../src/components/cyber/GlowText';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useBattleStore } from '../../src/stores/battleStore';
import { playSE, SE } from '../../src/services/soundService';
import type { BattleTurnLog } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TURN_DELAY = 1500;

export default function FightScreen() {
  const router = useRouter();
  const {
    playerCharacter,
    enemyCharacter,
    turns,
    battleResult,
    setPhase,
  } = useBattleStore();

  const [currentTurnIdx, setCurrentTurnIdx] = useState(-1);
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [playerMaxHp, setPlayerMaxHp] = useState(0);
  const [enemyMaxHp, setEnemyMaxHp] = useState(0);
  const [actionText, setActionText] = useState('');
  const [showDamage, setShowDamage] = useState(false);
  const [damageText, setDamageText] = useState('');
  const [damageIsPlayer, setDamageIsPlayer] = useState(false);
  const [showCritical, setShowCritical] = useState(false);
  const [showSpecialCutIn, setShowSpecialCutIn] = useState(false);
  const [specialCutInName, setSpecialCutInName] = useState('');
  const [turnNumber, setTurnNumber] = useState(0);
  const [playerStatuses, setPlayerStatuses] = useState<string[]>([]);
  const [enemyStatuses, setEnemyStatuses] = useState<string[]>([]);

  const damageAnim = useRef(new Animated.Value(0)).current;
  const damageOpacity = useRef(new Animated.Value(0)).current;
  const criticalScale = useRef(new Animated.Value(0)).current;
  const criticalOpacity = useRef(new Animated.Value(0)).current;
  const specialFlash = useRef(new Animated.Value(0)).current;
  const specialScale = useRef(new Animated.Value(0.3)).current;
  const specialOpacity = useRef(new Animated.Value(0)).current;
  const playerHpAnim = useRef(new Animated.Value(1)).current;
  const enemyHpAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Initialize HP values
  useEffect(() => {
    if (playerCharacter && enemyCharacter) {
      const pMaxHp = playerCharacter.stats.hp * GAME_CONFIG.battle.hpMultiplier;
      const eMaxHp = enemyCharacter.stats.hp * GAME_CONFIG.battle.hpMultiplier;
      setPlayerMaxHp(pMaxHp);
      setEnemyMaxHp(eMaxHp);
      setPlayerHp(pMaxHp);
      setEnemyHp(eMaxHp);
    }
  }, [playerCharacter, enemyCharacter]);

  // Process a turn
  const processTurn = useCallback((turn: BattleTurnLog) => {
    setTurnNumber(turn.turn);
    const isPlayerAttacking = turn.attacker === 'player1';
    const attackerName = isPlayerAttacking
      ? (playerCharacter?.name || 'PLAYER')
      : (enemyCharacter?.name || 'ENEMY');

    // Handle status damage
    if (turn.statusDamage && turn.statusDamage > 0) {
      playSE(SE.STATUS_TICK);
      setActionText(`${attackerName} takes ${turn.statusDamage} status damage!`);
      if (isPlayerAttacking) {
        // Status damage to the attacker themselves
        const newHp = turn.defenderHpAfter; // defenderHpAfter holds their HP after status dmg
        setPlayerHp(newHp);
        Animated.timing(playerHpAnim, {
          toValue: newHp / playerMaxHp,
          duration: 300,
          useNativeDriver: false,
        }).start();
      } else {
        const newHp = turn.defenderHpAfter;
        setEnemyHp(newHp);
        Animated.timing(enemyHpAnim, {
          toValue: newHp / enemyMaxHp,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
      return;
    }

    // Handle skip
    if (turn.action === 'skip') {
      const reason = turn.skippedReason || 'status effect';
      setActionText(`${attackerName} is immobilized by ${reason}!`);
      return;
    }

    // Special move cut-in
    if (turn.isSpecial && turn.specialName) {
      playSE(SE.SPECIAL_CUTIN);
      setShowSpecialCutIn(true);
      setSpecialCutInName(turn.specialName);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(specialFlash, {
            toValue: 0.5,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(specialOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(specialScale, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(specialFlash, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(specialOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setShowSpecialCutIn(false);
        specialScale.setValue(0.3);
      });
    }

    // Set action text
    const actionLabel = turn.isSpecial ? `[SPECIAL] ${turn.specialName}` : 'ATTACK';
    setActionText(`${attackerName} uses ${actionLabel}!`);

    // Damage display
    if (turn.damage > 0) {
      playSE(turn.isCritical ? SE.CRITICAL : turn.isSpecial ? SE.SPECIAL_HIT : SE.ATTACK);
      setDamageIsPlayer(!isPlayerAttacking);
      setDamageText(`-${turn.damage}`);
      setShowDamage(true);

      damageAnim.setValue(0);
      damageOpacity.setValue(1);

      Animated.parallel([
        Animated.timing(damageAnim, {
          toValue: -60,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(damageOpacity, {
          toValue: 0,
          duration: 800,
          delay: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowDamage(false));

      // Shake effect on hit
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      // Update HP
      if (isPlayerAttacking) {
        const newHp = turn.defenderHpAfter;
        setEnemyHp(newHp);
        Animated.timing(enemyHpAnim, {
          toValue: Math.max(0, newHp / enemyMaxHp),
          duration: 400,
          useNativeDriver: false,
        }).start();
      } else {
        const newHp = turn.defenderHpAfter;
        setPlayerHp(newHp);
        Animated.timing(playerHpAnim, {
          toValue: Math.max(0, newHp / playerMaxHp),
          duration: 400,
          useNativeDriver: false,
        }).start();
      }
    }

    // Critical hit
    if (turn.isCritical) {
      setShowCritical(true);
      criticalScale.setValue(0);
      criticalOpacity.setValue(1);

      Animated.sequence([
        Animated.spring(criticalScale, {
          toValue: 1,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.delay(400),
        Animated.timing(criticalOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowCritical(false);
      });
    }

    // Status effects
    if (turn.statusApplied) {
      const statusSE: Record<string, string> = {
        poison: SE.STATUS_POISON, sleep: SE.STATUS_SLEEP,
        paralyze: SE.STATUS_PARALYZE, burn: SE.STATUS_BURN, freeze: SE.STATUS_FREEZE,
      };
      playSE(statusSE[turn.statusApplied.id] || SE.STATUS_TICK);
      const statusCfg = GAME_CONFIG.statusEffects[turn.statusApplied.id as keyof typeof GAME_CONFIG.statusEffects];
      if (statusCfg) {
        if (isPlayerAttacking) {
          setEnemyStatuses(prev => [...prev.filter(s => s !== statusCfg.label), statusCfg.label]);
        } else {
          setPlayerStatuses(prev => [...prev.filter(s => s !== statusCfg.label), statusCfg.label]);
        }
      }
    }
  }, [playerCharacter, enemyCharacter, playerMaxHp, enemyMaxHp]);

  // Auto-play turns
  useEffect(() => {
    if (!turns || turns.length === 0 || playerMaxHp === 0) return;

    const timeout = setTimeout(() => {
      const nextIdx = currentTurnIdx + 1;
      if (nextIdx < turns.length) {
        setCurrentTurnIdx(nextIdx);
        processTurn(turns[nextIdx]);

        // Check if this is the last turn (someone's HP hit 0)
        const turn = turns[nextIdx];
        if (turn.defenderHpAfter <= 0 && turn.action !== 'skip') {
          setTimeout(() => {
            setPhase('result');
            router.replace('/battle/result');
          }, 1500);
        }
      } else {
        // All turns done, go to result
        setTimeout(() => {
          setPhase('result');
          router.replace('/battle/result');
        }, 1000);
      }
    }, currentTurnIdx === -1 ? 800 : TURN_DELAY);

    return () => clearTimeout(timeout);
  }, [currentTurnIdx, turns, playerMaxHp]);

  if (!playerCharacter || !enemyCharacter) return null;

  const playerHpWidth = playerHpAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const enemyHpWidth = enemyHpAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const playerHpColor = playerHp / playerMaxHp > 0.5
    ? COLORS.success
    : playerHp / playerMaxHp > 0.2
      ? COLORS.warning
      : COLORS.danger;

  const enemyHpColor = enemyHp / enemyMaxHp > 0.5
    ? COLORS.danger
    : enemyHp / enemyMaxHp > 0.2
      ? COLORS.warning
      : COLORS.success;

  return (
    <View style={styles.container}>
      <GridBackground />

      {/* HP Bars */}
      <View style={styles.hpSection}>
        {/* Player HP */}
        <View style={styles.hpBlock}>
          <View style={styles.hpHeader}>
            <Text style={[styles.fighterName, { color: COLORS.primary }]}>
              {'\u25C8'} {playerCharacter.name || 'PLAYER'}
            </Text>
            <Text style={styles.hpText}>
              {Math.max(0, Math.round(playerHp))}/{playerMaxHp}
            </Text>
          </View>
          <View style={styles.hpBarTrack}>
            <Animated.View
              style={[
                styles.hpBarFill,
                {
                  width: playerHpWidth,
                  backgroundColor: playerHpColor,
                },
              ]}
            />
          </View>
          {/* Player status effects */}
          {playerStatuses.length > 0 && (
            <View style={styles.statusRow}>
              {playerStatuses.map((s, i) => (
                <Text key={i} style={styles.statusBadge}>{s}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Enemy HP */}
        <View style={styles.hpBlock}>
          <View style={styles.hpHeader}>
            <Text style={[styles.fighterName, { color: COLORS.danger }]}>
              {'\u25C8'} {enemyCharacter.name || 'ENEMY'}
            </Text>
            <Text style={styles.hpText}>
              {Math.max(0, Math.round(enemyHp))}/{enemyMaxHp}
            </Text>
          </View>
          <View style={styles.hpBarTrack}>
            <Animated.View
              style={[
                styles.hpBarFill,
                {
                  width: enemyHpWidth,
                  backgroundColor: enemyHpColor,
                },
              ]}
            />
          </View>
          {/* Enemy status effects */}
          {enemyStatuses.length > 0 && (
            <View style={styles.statusRow}>
              {enemyStatuses.map((s, i) => (
                <Text key={i} style={styles.statusBadge}>{s}</Text>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Turn counter */}
      <View style={styles.turnCounter}>
        <Text style={styles.turnText}>{'\u25A1'} TURN {turnNumber}</Text>
      </View>

      {/* Character display areas */}
      <Animated.View
        style={[
          styles.characterSection,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        {/* Player character */}
        <View style={styles.characterDisplay}>
          <View style={[styles.characterFrame, { borderColor: COLORS.primary }]}>
            {playerCharacter.imageUrl ? (
              <View style={styles.imageWrapper}>
                <Text style={[styles.charIcon, { color: COLORS.primary }]}>{'\u25C8'}</Text>
              </View>
            ) : (
              <Text style={[styles.charIcon, { color: COLORS.primary }]}>{'\u25C8'}</Text>
            )}
          </View>
          {/* Damage number (on player) */}
          {showDamage && damageIsPlayer && (
            <Animated.View
              style={[
                styles.damageContainer,
                {
                  transform: [{ translateY: damageAnim }],
                  opacity: damageOpacity,
                },
              ]}
            >
              <Text style={styles.damageNumber}>{damageText}</Text>
            </Animated.View>
          )}
        </View>

        {/* VS divider */}
        <View style={styles.vsDivider}>
          <Text style={styles.vsSmall}>{'\u25C7'}</Text>
        </View>

        {/* Enemy character */}
        <View style={styles.characterDisplay}>
          <View style={[styles.characterFrame, { borderColor: COLORS.danger }]}>
            {enemyCharacter.imageUrl ? (
              <View style={styles.imageWrapper}>
                <Text style={[styles.charIcon, { color: COLORS.danger }]}>{'\u25C8'}</Text>
              </View>
            ) : (
              <Text style={[styles.charIcon, { color: COLORS.danger }]}>{'\u25C8'}</Text>
            )}
          </View>
          {/* Damage number (on enemy) */}
          {showDamage && !damageIsPlayer && (
            <Animated.View
              style={[
                styles.damageContainer,
                {
                  transform: [{ translateY: damageAnim }],
                  opacity: damageOpacity,
                },
              ]}
            >
              <Text style={styles.damageNumber}>{damageText}</Text>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      {/* Action text area */}
      <View style={styles.actionArea}>
        <View style={styles.actionBox}>
          <Text style={styles.actionLabel}>{'\u00BB'} ACTION</Text>
          <Text style={styles.actionText}>{actionText || 'Preparing battle...'}</Text>
        </View>
      </View>

      {/* Special move cut-in overlay */}
      {showSpecialCutIn && (
        <Animated.View
          style={[
            styles.specialCutIn,
            { opacity: specialFlash },
          ]}
          pointerEvents="none"
        >
          <Animated.View
            style={[
              styles.specialNameContainer,
              {
                opacity: specialOpacity,
                transform: [{ scale: specialScale }],
              },
            ]}
          >
            <View style={styles.specialNameBg}>
              <Text style={styles.specialNameLabel}>{'\u25C7'} SPECIAL MOVE {'\u25C7'}</Text>
              <GlowText size={28} color={COLORS.secondary}>
                {specialCutInName}
              </GlowText>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* Critical hit text */}
      {showCritical && (
        <Animated.View
          style={[
            styles.criticalContainer,
            {
              opacity: criticalOpacity,
              transform: [{ scale: criticalScale }],
            },
          ]}
          pointerEvents="none"
        >
          <GlowText size={36} color={COLORS.warning}>
            {'\u25B7'} CRITICAL! {'\u25C1'}
          </GlowText>
        </Animated.View>
      )}

      <ScanlineOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  hpSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  hpBlock: {
    flex: 1,
  },
  hpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fighterName: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  hpText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.text,
    letterSpacing: 1,
  },
  hpBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
    flexWrap: 'wrap',
  },
  statusBadge: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.warning,
    backgroundColor: 'rgba(255, 221, 0, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    overflow: 'hidden',
    letterSpacing: 1,
  },
  turnCounter: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  turnText: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.textDim,
    letterSpacing: 2,
  },
  characterSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 24,
  },
  characterDisplay: {
    alignItems: 'center',
    position: 'relative',
  },
  characterFrame: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  charIcon: {
    fontSize: 40,
  },
  vsDivider: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsSmall: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.textDim,
  },
  damageContainer: {
    position: 'absolute',
    top: -10,
    alignItems: 'center',
  },
  damageNumber: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.danger,
    textShadowColor: COLORS.danger,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  actionArea: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  actionBox: {
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.15)',
    borderRadius: 4,
    padding: 12,
  },
  actionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textDim,
    letterSpacing: 2,
    marginBottom: 4,
  },
  actionText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.text,
    letterSpacing: 1,
  },
  specialCutIn: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  specialNameContainer: {
    alignItems: 'center',
  },
  specialNameBg: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.secondary,
  },
  specialNameLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.secondary,
    letterSpacing: 3,
    marginBottom: 8,
    opacity: 0.7,
  },
  criticalContainer: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    zIndex: 40,
  },
});
