import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { GlowText } from '../../src/components/cyber/GlowText';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { CyberCard } from '../../src/components/cyber/CyberCard';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useBattleStore } from '../../src/stores/battleStore';
import { generateRandomEnemy, determineRarity } from '../../src/engine/drawingAnalyzer';
import { runBattle } from '../../src/engine/battleEngine';
import { joinMatchmaking, leaveMatchmaking, subscribeToMatchmaking, requestBattle } from '../../src/services/battleService';
import { getFriends } from '../../src/services/friendService';
import { playSE, SE } from '../../src/services/soundService';
import type { Character, Friend } from '../../src/types';

type MatchMode = 'ai' | 'random' | 'friend';
type MatchState = 'friend_select' | 'searching' | 'found' | 'connecting';

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
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: MatchMode = (params.mode as MatchMode) || 'ai';

  const {
    playerCharacter,
    setEnemyCharacter,
    setBattleResult,
    setPhase,
  } = useBattleStore();

  // Animation values
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const foundFlashAnim = useRef(new Animated.Value(0)).current;
  const opponentSlideAnim = useRef(new Animated.Value(50)).current;
  const opponentFadeAnim = useRef(new Animated.Value(0)).current;

  // State
  const [dots, setDots] = useState('');
  const [statusText, setStatusText] = useState('INITIALIZING SEARCH PROTOCOL');
  const [cancelled, setCancelled] = useState(false);
  const [matchState, setMatchState] = useState<MatchState>(
    mode === 'friend' ? 'friend_select' : 'searching'
  );
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [opponentName, setOpponentName] = useState('');
  const [searchElapsed, setSearchElapsed] = useState(0);

  const cancelledRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ── Animations ──────────────────────────────────────────

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

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
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

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Elapsed timer for online search
  useEffect(() => {
    if (matchState !== 'searching' || mode === 'ai') return;
    const interval = setInterval(() => {
      setSearchElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [matchState, mode]);

  // ── Friend list fetch ───────────────────────────────────

  useEffect(() => {
    if (mode !== 'friend') return;
    // In a real app, get userId from auth. For now, use playerCharacter's userId.
    const userId = playerCharacter?.userId;
    if (!userId) return;

    getFriends(userId).then(setFriends);
  }, [mode, playerCharacter]);

  // ── AI Match Logic ──────────────────────────────────────

  useEffect(() => {
    if (mode !== 'ai') return;

    // Progress bar for AI (3 seconds)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();

    const messages = [
      'SCANNING NETWORK NODES',
      'QUERYING BATTLE SERVERS',
      'MATCHING POWER LEVELS',
      'OPPONENT FOUND',
    ];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx++;
      if (msgIdx < messages.length) setStatusText(messages[msgIdx]);
    }, 800);

    const timeout = setTimeout(() => {
      if (cancelledRef.current || !playerCharacter) return;
      startAiBattle();
    }, 3000);

    return () => {
      clearTimeout(timeout);
      clearInterval(msgInterval);
    };
  }, [mode, playerCharacter]);

  // ── Random Match Logic ──────────────────────────────────

  useEffect(() => {
    if (mode !== 'random' || matchState !== 'searching') return;
    if (!playerCharacter) return;

    playSE(SE.MATCHING);

    const messages = [
      'SCANNING GLOBAL NETWORK',
      'SEARCHING RANKED PLAYERS',
      'EVALUATING POWER LEVELS',
      'EXPANDING SEARCH RANGE',
    ];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setStatusText(messages[msgIdx]);
    }, 2000);

    // Animated progress (loops for online)
    const loopProgress = () => {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && !cancelledRef.current) loopProgress();
      });
    };
    loopProgress();

    // Join matchmaking queue
    const userId = playerCharacter.userId || playerCharacter.id;
    joinMatchmaking(userId, playerCharacter.id).then(result => {
      if (cancelledRef.current) return;
      if (result.matched && result.opponentUserId) {
        onMatchFound(result.opponentUserId);
      }
    });

    // Subscribe for realtime match
    const unsub = subscribeToMatchmaking(userId, (opUserId) => {
      if (cancelledRef.current) return;
      onMatchFound(opUserId);
    });
    unsubscribeRef.current = unsub;

    // Fallback: if no match after 15 seconds, fall back to AI
    const fallbackTimeout = setTimeout(() => {
      if (cancelledRef.current) return;
      if (matchState === 'searching') {
        setStatusText('NO PLAYERS FOUND - AI OPPONENT ASSIGNED');
        setTimeout(() => {
          if (!cancelledRef.current) startAiBattle();
        }, 1500);
      }
    }, 15000);

    return () => {
      clearInterval(msgInterval);
      clearTimeout(fallbackTimeout);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      // Leave queue on cleanup
      if (playerCharacter) {
        leaveMatchmaking(userId);
      }
    };
  }, [mode, matchState, playerCharacter]);

  // ── Friend Battle Logic ─────────────────────────────────

  useEffect(() => {
    if (mode !== 'friend' || matchState !== 'searching') return;
    if (!playerCharacter || !selectedFriend) return;

    playSE(SE.MATCHING);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();

    const messages = [
      'CONNECTING TO FRIEND',
      'SYNCING BATTLE DATA',
      'LOADING OPPONENT',
      'FRIEND CONNECTED',
    ];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx++;
      if (msgIdx < messages.length) setStatusText(messages[msgIdx]);
    }, 700);

    // For friend battles, generate AI based on friend's best character
    const timeout = setTimeout(() => {
      if (cancelledRef.current) return;
      startAiBattle(); // Use friend's AI representation
    }, 3000);

    return () => {
      clearTimeout(timeout);
      clearInterval(msgInterval);
    };
  }, [mode, matchState, selectedFriend, playerCharacter]);

  // ── Shared Functions ────────────────────────────────────

  const onMatchFound = useCallback((opponentUserId: string) => {
    setMatchState('found');
    setOpponentName(opponentUserId.slice(0, 8).toUpperCase());
    playSE(SE.MATCH_FOUND);

    // Flash animation
    Animated.sequence([
      Animated.timing(foundFlashAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(foundFlashAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Slide in opponent info
    Animated.parallel([
      Animated.timing(opponentSlideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opponentFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // After found animation, proceed to battle
    setTimeout(() => {
      if (cancelledRef.current) return;
      startAiBattle(); // TODO: Replace with real online battle when server supports it
    }, 2000);
  }, []);

  const startAiBattle = useCallback(() => {
    if (!playerCharacter) {
      router.replace('/(tabs)');
      return;
    }

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

    const battleType = mode === 'random' ? 'random' : mode === 'friend' ? 'friend' : 'ai';
    const result = runBattle(playerCharacter, enemy, battleType);
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
  }, [playerCharacter, mode]);

  const handleCancel = () => {
    setCancelled(true);
    cancelledRef.current = true;
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setPhase('idle');
    router.back();
  };

  const handleFriendSelect = (friend: Friend) => {
    setSelectedFriend(friend);
    setMatchState('searching');
    setStatusText('CONNECTING TO FRIEND');
    playSE(SE.TAP);
  };

  // ── Interpolations ──────────────────────────────────────

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const reverseSpin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ── Render: Friend Select ──────────────────────────────

  if (matchState === 'friend_select') {
    return (
      <View style={styles.container}>
        <GridBackground />
        <View style={styles.friendContent}>
          <GlowText size={22} color={COLORS.primary} style={styles.friendTitle}>
            {'\u25A1'} SELECT FRIEND
          </GlowText>
          <Text style={styles.friendSubtitle}>
            Choose a friend to battle their AI representative
          </Text>

          {friends.length === 0 ? (
            <View style={styles.emptyFriends}>
              <Text style={styles.emptyText}>
                {'\u25C8'} NO FRIENDS FOUND
              </Text>
              <Text style={styles.emptySubtext}>
                Add friends from the Social tab to battle them
              </Text>
              <CyberButton
                title={'\u25C6 BACK'}
                onPress={handleCancel}
                color={COLORS.danger}
                style={styles.backBtn}
              />
            </View>
          ) : (
            <>
              <FlatList
                data={friends}
                keyExtractor={item => item.id}
                style={styles.friendList}
                contentContainerStyle={styles.friendListContent}
                renderItem={({ item }) => (
                  <FriendListItem friend={item} onPress={handleFriendSelect} />
                )}
                ItemSeparatorComponent={() => <View style={styles.friendSeparator} />}
              />
              <CyberButton
                title={'\u25C6 CANCEL'}
                onPress={handleCancel}
                color={COLORS.danger}
                style={styles.cancelButton}
              />
            </>
          )}
        </View>
        <ScanlineOverlay />
      </View>
    );
  }

  // ── Render: Searching / Found ──────────────────────────

  const modeLabel = mode === 'random'
    ? 'RANKED MATCH'
    : mode === 'friend'
    ? 'FRIEND BATTLE'
    : 'AI BATTLE';

  const ringColor = matchState === 'found' ? COLORS.success : COLORS.primary;
  const ringSecondary = matchState === 'found' ? COLORS.primary : COLORS.secondary;

  return (
    <View style={styles.container}>
      <GridBackground />

      {/* Flash overlay on match found */}
      <Animated.View
        style={[
          styles.flashOverlay,
          { opacity: foundFlashAnim },
        ]}
        pointerEvents="none"
      />

      <View style={styles.content}>
        {/* Mode badge */}
        <View style={[styles.modeBadge, { borderColor: mode === 'random' ? COLORS.warning : COLORS.primary }]}>
          <Text style={[styles.modeBadgeText, { color: mode === 'random' ? COLORS.warning : COLORS.primary }]}>
            {modeLabel}
          </Text>
        </View>

        {/* Rotating ring */}
        <View style={styles.ringContainer}>
          <Animated.View
            style={[
              styles.outerRing,
              {
                borderColor: ringColor,
                transform: [{ rotate: spin }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.innerRing,
              {
                borderColor: ringSecondary,
                transform: [{ rotate: reverseSpin }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.centerDot,
              {
                backgroundColor: ringColor,
                shadowColor: ringColor,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          {/* Extra ring for ranked */}
          {mode === 'random' && (
            <Animated.View
              style={[
                styles.outerMostRing,
                { transform: [{ rotate: reverseSpin }] },
              ]}
            />
          )}
        </View>

        {/* Search text */}
        <GlowText
          size={matchState === 'found' ? 24 : 20}
          color={matchState === 'found' ? COLORS.success : COLORS.primary}
          style={styles.searchText}
        >
          {matchState === 'found'
            ? '\u25C8 OPPONENT FOUND \u25C8'
            : `SEARCHING FOR OPPONENT${dots}`}
        </GlowText>

        {/* Opponent info slide-in */}
        {matchState === 'found' && (
          <Animated.View
            style={[
              styles.opponentInfo,
              {
                opacity: opponentFadeAnim,
                transform: [{ translateY: opponentSlideAnim }],
              },
            ]}
          >
            <CyberCard accentColor={COLORS.success} style={styles.opponentCard}>
              <Text style={styles.opponentLabel}>{'\u25B7'} OPPONENT</Text>
              <GlowText size={18} color={COLORS.success}>
                {opponentName}
              </GlowText>
            </CyberCard>
          </Animated.View>
        )}

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
                {
                  width: progressWidth,
                  backgroundColor: matchState === 'found' ? COLORS.success : COLORS.primary,
                  shadowColor: matchState === 'found' ? COLORS.success : COLORS.primary,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            {mode === 'random' ? (
              <>
                <Text style={styles.progressLabel}>{'\u25A1'} QUEUE</Text>
                <Text style={styles.progressLabel}>{'\u25A1'} MATCH</Text>
                <Text style={styles.progressLabel}>{'\u25A1'} VERIFY</Text>
              </>
            ) : mode === 'friend' ? (
              <>
                <Text style={styles.progressLabel}>{'\u25A1'} CONNECT</Text>
                <Text style={styles.progressLabel}>{'\u25A1'} SYNC</Text>
                <Text style={styles.progressLabel}>{'\u25A1'} READY</Text>
              </>
            ) : (
              <>
                <Text style={styles.progressLabel}>{'\u25A1'} SCAN</Text>
                <Text style={styles.progressLabel}>{'\u25A1'} MATCH</Text>
                <Text style={styles.progressLabel}>{'\u25A1'} LOCK</Text>
              </>
            )}
          </View>
        </View>

        {/* Data lines */}
        <View style={styles.dataLines}>
          <Text style={styles.dataText}>
            {'\u25B7'} NODE: SRV-{Math.floor(Math.random() * 999).toString().padStart(3, '0')}
          </Text>
          <Text style={styles.dataText}>
            {'\u25B7'} PING: {Math.floor(Math.random() * 50 + 10)}ms
          </Text>
          {mode === 'random' && (
            <>
              <Text style={styles.dataText}>
                {'\u25B7'} POOL: {Math.floor(Math.random() * 200 + 50)} ACTIVE
              </Text>
              <Text style={styles.dataText}>
                {'\u25B7'} TIME: {searchElapsed}s
              </Text>
            </>
          )}
          {mode === 'friend' && selectedFriend && (
            <Text style={styles.dataText}>
              {'\u25B7'} TARGET: FRIEND_{selectedFriend.id.slice(0, 6).toUpperCase()}
            </Text>
          )}
        </View>

        {/* Cancel button */}
        {matchState !== 'found' && (
          <CyberButton
            title={'\u25C6 CANCEL'}
            onPress={handleCancel}
            color={COLORS.danger}
            style={styles.cancelButton}
          />
        )}
      </View>

      <ScanlineOverlay />
    </View>
  );
}

// ── Friend List Item Component ────────────────────────────

function FriendListItem({
  friend,
  onPress,
}: {
  friend: Friend;
  onPress: (f: Friend) => void;
}) {
  const friendId = friend.requesterId || friend.addresseeId;
  const displayId = friendId ? friendId.slice(0, 8).toUpperCase() : 'UNKNOWN';

  return (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => onPress(friend)}
      activeOpacity={0.7}
    >
      <View style={styles.friendAvatar}>
        <Text style={styles.friendAvatarText}>
          {displayId.charAt(0)}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>PLAYER_{displayId}</Text>
        <Text style={styles.friendStatus}>{'\u25C8'} ONLINE</Text>
      </View>
      <View style={styles.friendBattleIcon}>
        <Text style={styles.friendBattleText}>{'\u25B6'}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────

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
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.success,
    zIndex: 10,
  },

  // Mode badge
  modeBadge: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
  },
  modeBadgeText: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: '700',
  },

  // Rings
  ringContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  outerMostRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    opacity: 0.5,
  },
  outerRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  innerRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  centerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
  },

  // Text
  searchText: {
    marginBottom: 10,
    textAlign: 'center',
  },
  statusText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    marginBottom: 28,
    letterSpacing: 1,
  },

  // Opponent found
  opponentInfo: {
    marginBottom: 16,
    width: '100%',
  },
  opponentCard: {
    padding: 16,
    alignItems: 'center',
  },
  opponentLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: 2,
    marginBottom: 4,
  },

  // Progress
  progressContainer: {
    width: '100%',
    marginBottom: 28,
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
    borderRadius: 2,
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

  // Data lines
  dataLines: {
    alignSelf: 'stretch',
    marginBottom: 32,
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

  // Friend select screen
  friendContent: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  friendTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  friendSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: 'center',
    marginBottom: 24,
  },
  friendList: {
    flex: 1,
  },
  friendListContent: {
    paddingBottom: 16,
  },
  friendSeparator: {
    height: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.15)',
    borderRadius: 4,
    padding: 14,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.text,
    letterSpacing: 1,
  },
  friendStatus: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.success,
    letterSpacing: 1,
    marginTop: 2,
  },
  friendBattleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendBattleText: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.secondary,
  },
  emptyFriends: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.textDim,
    letterSpacing: 2,
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(0, 255, 255, 0.3)',
    textAlign: 'center',
    marginBottom: 24,
  },
  backBtn: {
    minWidth: 160,
  },
});
