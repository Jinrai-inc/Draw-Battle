import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { GlowText } from '../../src/components/cyber/GlowText';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useBattleStore } from '../../src/stores/battleStore';
import { generateRandomEnemy, determineElement, determineRarity } from '../../src/engine/drawingAnalyzer';
import { runBattle } from '../../src/engine/battleEngine';
import type { Character } from '../../src/types';

const ENEMY_NAMES = [
  'SHADOW_UNIT', 'VOID_MECH', 'NEON_WRAITH', 'CYBER_GHOST',
  'DATA_FIEND', 'GLITCH_CORE', 'PIXEL_DEMON', 'NULL_BLADE',
  'DARK_CIRCUIT', 'STATIC_FURY', 'CHROME_FANG', 'BINARY_STORM',
];

const SPECIAL_MOVES = [
  'Void Collapse', 'Dark Pulse', 'Shadow Rend', 'Null Strike',
  'Glitch Burst', 'Data Drain', 'Neon Slash', 'Chrome Crush',
  'Pixel Storm', 'Static Shock', 'Binary Blast', 'Cyber Fang',
];

export default function MatchingScreen() {
  const router = useRouter();
  const {
    playerCharacter,
    setEnemyCharacter,
    setBattleResult,
    setPhase,
  } = useBattleStore();

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [dots, setDots] = useState('');
  const [statusText, setStatusText] = useState('INITIALIZING SEARCH PROTOCOL');
  const [cancelled, setCancelled] = useState(false);

  // Rotating ring animation
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [rotateAnim]);

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Progress bar fill
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  // Dots animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Status text updates
  useEffect(() => {
    const messages = [
      'SCANNING NETWORK NODES',
      'QUERYING BATTLE SERVERS',
      'MATCHING POWER LEVELS',
      'OPPONENT FOUND',
    ];
    let index = 0;
    const interval = setInterval(() => {
      index++;
      if (index < messages.length) {
        setStatusText(messages[index]);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Auto-generate enemy and navigate after delay
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (cancelled) return;
      if (!playerCharacter) {
        router.replace('/(tabs)');
        return;
      }

      // Generate AI enemy
      const enemyStats = generateRandomEnemy(playerCharacter.stats.totalStats);
      const enemyElement = GAME_CONFIG.elements[
        Math.floor(Math.random() * GAME_CONFIG.elements.length)
      ].id as Character['element'];
      const enemyRarity = determineRarity(enemyStats.totalStats);
      const enemyName = ENEMY_NAMES[Math.floor(Math.random() * ENEMY_NAMES.length)];
      const enemySpecial = SPECIAL_MOVES[Math.floor(Math.random() * SPECIAL_MOVES.length)];

      const enemy: Character = {
        id: `enemy_${Date.now()}`,
        userId: 'ai',
        imageUrl: '',
        name: enemyName,
        specialMoveName: enemySpecial,
        stats: enemyStats,
        element: enemyElement,
        rarity: enemyRarity,
        level: Math.max(1, playerCharacter.level + Math.floor(Math.random() * 5) - 2),
        exp: 0,
        battleCount: Math.floor(Math.random() * 50),
        isEvolved: false,
        createdAt: new Date().toISOString(),
      };

      setEnemyCharacter(enemy);

      // Run battle engine
      const result = runBattle(playerCharacter, enemy, 'ai');
      const expGained = result.winnerId === playerCharacter.id
        ? GAME_CONFIG.growth.expPerWin
        : GAME_CONFIG.growth.expPerLoss;

      setBattleResult({
        battleId: `battle_${Date.now()}`,
        winnerId: result.winnerId,
        turns: result.turns,
        rewards: { expGained },
      });

      setPhase('summon');
      router.replace('/battle/summon');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [cancelled, playerCharacter]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleCancel = () => {
    setCancelled(true);
    setPhase('idle');
    router.back();
  };

  return (
    <View style={styles.container}>
      <GridBackground />

      <View style={styles.content}>
        {/* Rotating ring */}
        <View style={styles.ringContainer}>
          <Animated.View
            style={[
              styles.outerRing,
              { transform: [{ rotate: spin }] },
            ]}
          />
          <Animated.View
            style={[
              styles.innerRing,
              {
                transform: [
                  { rotate: spin },
                  { scaleX: -1 },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.centerDot,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
        </View>

        {/* Search text */}
        <GlowText size={20} style={styles.searchText}>
          SEARCHING FOR OPPONENT{dots}
        </GlowText>

        {/* Status text */}
        <Text style={styles.statusText}>
          {'\u25C8'} {statusText}
        </Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressWidth },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{'\u25A1'} SCAN</Text>
            <Text style={styles.progressLabel}>{'\u25A1'} MATCH</Text>
            <Text style={styles.progressLabel}>{'\u25A1'} LOCK</Text>
          </View>
        </View>

        {/* Decorative data lines */}
        <View style={styles.dataLines}>
          <Text style={styles.dataText}>{'\u25B7'} NODE: SRV-{Math.floor(Math.random() * 999).toString().padStart(3, '0')}</Text>
          <Text style={styles.dataText}>{'\u25B7'} PING: {Math.floor(Math.random() * 50 + 10)}ms</Text>
          <Text style={styles.dataText}>{'\u25B7'} POOL: {Math.floor(Math.random() * 200 + 50)} ACTIVE</Text>
        </View>

        {/* Cancel button */}
        <CyberButton
          title={'\u25C6 CANCEL'}
          onPress={handleCancel}
          color={COLORS.danger}
          style={styles.cancelButton}
        />
      </View>

      <ScanlineOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  ringContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  outerRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  innerRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  searchText: {
    marginBottom: 12,
    textAlign: 'center',
  },
  statusText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    marginBottom: 32,
    letterSpacing: 1,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textDim,
    letterSpacing: 1,
  },
  dataLines: {
    alignSelf: 'stretch',
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  dataText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: 'rgba(0, 255, 255, 0.3)',
    marginVertical: 2,
    letterSpacing: 1,
  },
  cancelButton: {
    minWidth: 180,
  },
});
