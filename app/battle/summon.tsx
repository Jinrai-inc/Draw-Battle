import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { GlowText } from '../../src/components/cyber/GlowText';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useBattleStore } from '../../src/stores/battleStore';
import { playSE, playBGM, SE, BGM } from '../../src/services/soundService';
import { ParticleEffect } from '../../src/components/cyber/ParticleEffect';
import { calcSpecialPower } from '../../src/engine/specialPower';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RANK_COLORS: Record<string, string> = {
  SSS: '#FF69B4',
  SS: '#FFD700',
  S: '#FF4444',
  A: '#AA44FF',
  B: '#00FFFF',
  C: '#00FF88',
  D: '#888888',
};

export default function SummonScreen() {
  const router = useRouter();
  const { playerCharacter, enemyCharacter, setPhase } = useBattleStore();

  const [showParticles, setShowParticles] = React.useState(false);

  const circleRotate = useRef(new Animated.Value(0)).current;
  const pillarPlayerAnim = useRef(new Animated.Value(0)).current;
  const pillarEnemyAnim = useRef(new Animated.Value(0)).current;
  const vsScale = useRef(new Animated.Value(0)).current;
  const vsOpacity = useRef(new Animated.Value(0)).current;
  const battleStartOpacity = useRef(new Animated.Value(0)).current;
  const battleStartScale = useRef(new Animated.Value(0.5)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const playerSlide = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const enemySlide = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  // Rank reveal animations
  const rankRevealOpacity = useRef(new Animated.Value(0)).current;
  const rankRevealScale = useRef(new Animated.Value(0.3)).current;
  const playerRankScale = useRef(new Animated.Value(0)).current;
  const enemyRankScale = useRef(new Animated.Value(0)).current;

  // Calculate ranks
  const playerPower = playerCharacter ? calcSpecialPower(playerCharacter.specialMoveName) : null;
  const enemyPower = enemyCharacter ? calcSpecialPower(enemyCharacter.specialMoveName) : null;
  const playerRankColor = playerPower ? (RANK_COLORS[playerPower.rank] || COLORS.text) : COLORS.text;
  const enemyRankColor = enemyPower ? (RANK_COLORS[enemyPower.rank] || COLORS.text) : COLORS.text;

  // Magic circle rotation
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(circleRotate, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [circleRotate]);

  // Sound effects
  useEffect(() => {
    playBGM(BGM.BATTLE);
    playSE(SE.SUMMON_CIRCLE);

    const vsTimeout = setTimeout(() => playSE(SE.VS), 1100);
    const rankTimeout = setTimeout(() => playSE(SE.STAT_REVEAL), 2000);
    const startTimeout = setTimeout(() => playSE(SE.BATTLE_START), 3500);

    return () => {
      clearTimeout(vsTimeout);
      clearTimeout(rankTimeout);
      clearTimeout(startTimeout);
    };
  }, []);

  // Sequenced entrance animations
  useEffect(() => {
    const sequence = Animated.sequence([
      // Characters slide in
      Animated.parallel([
        Animated.timing(playerSlide, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(enemySlide, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
      // Light pillars rise
      Animated.parallel([
        Animated.timing(pillarPlayerAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pillarEnemyAnim, {
          toValue: 1,
          duration: 600,
          delay: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
      // VS impact
      Animated.parallel([
        Animated.spring(vsScale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(vsOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Flash effect
        Animated.sequence([
          Animated.timing(flashOpacity, {
            toValue: 0.6,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(flashOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Wait a moment, then reveal ranks
      Animated.delay(400),
      // Rank reveal
      Animated.parallel([
        Animated.timing(rankRevealOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(rankRevealScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        // Player rank pop
        Animated.sequence([
          Animated.spring(playerRankScale, {
            toValue: 1.3,
            friction: 3,
            tension: 120,
            useNativeDriver: true,
          }),
          Animated.spring(playerRankScale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
        // Enemy rank pop (slightly delayed)
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(enemyRankScale, {
            toValue: 1.3,
            friction: 3,
            tension: 120,
            useNativeDriver: true,
          }),
          Animated.spring(enemyRankScale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Wait then BATTLE START
      Animated.delay(600),
      // BATTLE START text
      Animated.parallel([
        Animated.timing(battleStartOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(battleStartScale, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),
    ]);

    sequence.start();

    // Trigger particles at VS impact time (~1.1s)
    const particleTimeout = setTimeout(() => setShowParticles(true), 1100);
    return () => clearTimeout(particleTimeout);
  }, []);

  // Auto-advance after animation completes (extended for rank reveal)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPhase('fighting');
      router.replace('/battle/fight');
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  const spin = circleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const playerPillarHeight = pillarPlayerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300],
  });

  const enemyPillarHeight = pillarEnemyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300],
  });

  const getElementColor = (elementId: string) => {
    return GAME_CONFIG.elements.find(e => e.id === elementId)?.color || COLORS.primary;
  };

  const getRarityColor = (rarityId: string) => {
    return GAME_CONFIG.rarityThresholds.find(r => r.id === rarityId)?.color || COLORS.text;
  };

  const getElementName = (elementId: string) => {
    return GAME_CONFIG.elements.find(e => e.id === elementId)?.name || elementId;
  };

  if (!playerCharacter || !enemyCharacter) return null;

  const playerColor = getElementColor(playerCharacter.element);
  const enemyColor = getElementColor(enemyCharacter.element);

  return (
    <View style={styles.container}>
      <GridBackground />

      {/* Flash overlay */}
      <Animated.View
        style={[styles.flashOverlay, { opacity: flashOpacity }]}
        pointerEvents="none"
      />

      <View style={styles.battleField}>
        {/* Player side */}
        <Animated.View
          style={[
            styles.fighterSide,
            { transform: [{ translateX: playerSlide }] },
          ]}
        >
          {/* Light pillar */}
          <Animated.View
            style={[
              styles.lightPillar,
              {
                height: playerPillarHeight,
                backgroundColor: playerColor,
                shadowColor: playerColor,
              },
            ]}
          />

          {/* Magic circle */}
          <Animated.View
            style={[
              styles.magicCircle,
              {
                borderColor: playerColor,
                transform: [{ rotate: spin }],
              },
            ]}
          />

          {/* Character display */}
          <View style={styles.characterArea}>
            {playerCharacter.imageUrl ? (
              <Image
                source={{ uri: playerCharacter.imageUrl }}
                style={styles.characterImage}
              />
            ) : (
              <View style={[styles.characterPlaceholder, { borderColor: playerColor }]}>
                <Text style={[styles.placeholderIcon, { color: playerColor }]}>{'\u25C8'}</Text>
              </View>
            )}
          </View>

          {/* Character info */}
          <View style={styles.characterInfo}>
            <Text style={[styles.characterName, { color: playerColor }]}>
              {playerCharacter.name || 'PLAYER'}
            </Text>
            <View style={styles.tagRow}>
              <Text style={[styles.rarityTag, { color: getRarityColor(playerCharacter.rarity) }]}>
                {'\u25C6'}{playerCharacter.rarity}
              </Text>
              <Text style={[styles.elementTag, { color: playerColor }]}>
                {'\u25C8'}{getElementName(playerCharacter.element)}
              </Text>
            </View>
            <Text style={styles.levelText}>LV.{playerCharacter.level}</Text>

            {/* Player rank reveal */}
            {playerPower && (
              <Animated.View style={[
                styles.rankReveal,
                {
                  opacity: rankRevealOpacity,
                  transform: [{ scale: playerRankScale }],
                  borderColor: playerRankColor,
                },
              ]}>
                <Text style={styles.rankRevealLabel}>SPECIAL</Text>
                <Text style={[styles.rankRevealRank, { color: playerRankColor }]}>
                  {playerPower.rank}
                </Text>
                <Text style={[styles.rankRevealMultiplier, { color: playerRankColor }]}>
                  x{playerPower.multiplier.toFixed(1)}
                </Text>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* VS Text */}
        <Animated.View
          style={[
            styles.vsContainer,
            {
              opacity: vsOpacity,
              transform: [{ scale: vsScale }],
            },
          ]}
        >
          <GlowText size={48} color={COLORS.warning} style={styles.vsText}>
            VS
          </GlowText>
        </Animated.View>

        {/* Enemy side */}
        <Animated.View
          style={[
            styles.fighterSide,
            { transform: [{ translateX: enemySlide }] },
          ]}
        >
          {/* Light pillar */}
          <Animated.View
            style={[
              styles.lightPillar,
              {
                height: enemyPillarHeight,
                backgroundColor: enemyColor,
                shadowColor: enemyColor,
              },
            ]}
          />

          {/* Magic circle */}
          <Animated.View
            style={[
              styles.magicCircle,
              {
                borderColor: enemyColor,
                transform: [{ rotate: spin }],
              },
            ]}
          />

          {/* Character display */}
          <View style={styles.characterArea}>
            {enemyCharacter.imageUrl ? (
              <Image
                source={{ uri: enemyCharacter.imageUrl }}
                style={styles.characterImage}
              />
            ) : (
              <View style={[styles.characterPlaceholder, { borderColor: enemyColor }]}>
                <Text style={[styles.placeholderIcon, { color: enemyColor }]}>{'\u25C8'}</Text>
              </View>
            )}
          </View>

          {/* Character info */}
          <View style={styles.characterInfo}>
            <Text style={[styles.characterName, { color: enemyColor }]}>
              {enemyCharacter.name || 'ENEMY'}
            </Text>
            <View style={styles.tagRow}>
              <Text style={[styles.rarityTag, { color: getRarityColor(enemyCharacter.rarity) }]}>
                {'\u25C6'}{enemyCharacter.rarity}
              </Text>
              <Text style={[styles.elementTag, { color: enemyColor }]}>
                {'\u25C8'}{getElementName(enemyCharacter.element)}
              </Text>
            </View>
            <Text style={styles.levelText}>LV.{enemyCharacter.level}</Text>

            {/* Enemy rank reveal */}
            {enemyPower && (
              <Animated.View style={[
                styles.rankReveal,
                {
                  opacity: rankRevealOpacity,
                  transform: [{ scale: enemyRankScale }],
                  borderColor: enemyRankColor,
                },
              ]}>
                <Text style={styles.rankRevealLabel}>SPECIAL</Text>
                <Text style={[styles.rankRevealRank, { color: enemyRankColor }]}>
                  {enemyPower.rank}
                </Text>
                <Text style={[styles.rankRevealMultiplier, { color: enemyRankColor }]}>
                  x{enemyPower.multiplier.toFixed(1)}
                </Text>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </View>

      {/* BATTLE START text */}
      <Animated.View
        style={[
          styles.battleStartContainer,
          {
            opacity: battleStartOpacity,
            transform: [{ scale: battleStartScale }],
          },
        ]}
      >
        <GlowText size={32} color={COLORS.warning}>
          {'\u25B7'} BATTLE START! {'\u25C1'}
        </GlowText>
      </Animated.View>

      {/* VS particle burst */}
      <ParticleEffect
        color={COLORS.warning}
        count={24}
        duration={1200}
        spread={250}
        active={showParticles}
      />

      <ScanlineOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
  },
  battleField: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    flex: 1,
  },
  fighterSide: {
    alignItems: 'center',
    flex: 1,
  },
  lightPillar: {
    position: 'absolute',
    bottom: '40%',
    width: 4,
    opacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  magicCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.5,
    position: 'absolute',
    bottom: '30%',
  },
  characterArea: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  characterImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  characterPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
  },
  placeholderIcon: {
    fontSize: 32,
  },
  characterInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  characterName: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  rarityTag: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1,
  },
  elementTag: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1,
  },
  levelText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textDim,
    letterSpacing: 1,
  },
  // Rank reveal
  rankReveal: {
    marginTop: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(10, 22, 40, 0.8)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rankRevealLabel: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.textDim,
    letterSpacing: 2,
  },
  rankRevealRank: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },
  rankRevealMultiplier: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1,
    opacity: 0.8,
  },
  vsContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
  },
  vsText: {
    textAlign: 'center',
  },
  battleStartContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    zIndex: 10,
  },
});
