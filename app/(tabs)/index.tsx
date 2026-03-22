import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '../../src/config/gameConfig';
import { CyberButton, CyberCard, GlowText } from '../../src/components/cyber';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useEquipmentStore } from '../../src/stores/equipmentStore';
import { useTitleStore } from '../../src/stores/titleStore';
import { useDailyMissionStore } from '../../src/stores/dailyMissionStore';
import { MISSION_DEFINITIONS } from '../../src/services/dailyMissionService';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { characters, loadCharacters } = useCollectionStore();
  const { loadEquipment } = useEquipmentStore();
  const { loadUnlockedTitles } = useTitleStore();
  const { missions, loginStreak, completedCount, initMissions } = useDailyMissionStore();
  const user = useAuthStore((s) => s.user);
  const { isOnline } = useNetworkStatus();

  // Load characters, equipment, titles, and daily missions from DB on mount
  useEffect(() => {
    if (user?.id) {
      loadCharacters(user.id);
      loadEquipment(user.id);
      loadUnlockedTitles(user.id);
      initMissions(user.id);
    }
  }, [user?.id]);

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Offline banner */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>
              {'\u25C8'} OFFLINE MODE - AI battles only
            </Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <GlowText size={28} color={COLORS.primary}>DRAW BATTLE</GlowText>
          <Text style={styles.subtitle}>-- MAIN MENU --</Text>
        </View>

        {/* Daily Missions */}
        {missions.length > 0 && (
          <CyberCard style={styles.card} accentColor={COLORS.warning}>
            <View style={styles.missionHeader}>
              <Text style={styles.cardTitle}>{'\u25C6'} DAILY MISSIONS</Text>
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>{loginStreak}日連続</Text>
              </View>
            </View>
            <View style={styles.missionProgress}>
              <View style={styles.missionBarBg}>
                <View style={[styles.missionBar, { width: `${(completedCount / missions.length) * 100}%` }]} />
              </View>
              <Text style={styles.missionProgressText}>
                {completedCount}/{missions.length} COMPLETE
              </Text>
            </View>
            <View style={styles.missionList}>
              {MISSION_DEFINITIONS.map(def => {
                const done = missions.find(m => m.missionType === def.type)?.completed ?? false;
                return (
                  <View key={def.type} style={styles.missionRow}>
                    <Text style={[styles.missionIcon, { color: done ? COLORS.success : COLORS.textDim }]}>
                      {done ? '\u25C8' : '\u25A1'}
                    </Text>
                    <View style={styles.missionInfo}>
                      <Text style={[styles.missionLabel, done && { color: COLORS.textDim, textDecorationLine: 'line-through' }]}>
                        {def.label}
                      </Text>
                      <Text style={styles.missionDesc}>{def.desc}</Text>
                    </View>
                    <Text style={[styles.missionStatus, { color: done ? COLORS.success : COLORS.textDim }]}>
                      {done ? 'DONE' : '---'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </CyberCard>
        )}

        {/* Quick Actions */}
        <CyberCard style={styles.card}>
          <Text style={styles.cardTitle}>{'\u25B7'} QUICK START</Text>
          <View style={styles.actions}>
            <CyberButton
              title="DRAW CHARACTER"
              onPress={() => router.push('/(tabs)/draw')}
              color={COLORS.primary}
              style={styles.actionButton}
            />
            <CyberButton
              title="AI BATTLE"
              onPress={() => router.push('/(tabs)/battle')}
              color={COLORS.danger}
              style={styles.actionButton}
            />
            {characters.length >= 2 && (
              <CyberButton
                title={'\u25C6 FUSION'}
                onPress={() => router.push('/character/fusion')}
                color={COLORS.warning}
                style={styles.actionButton}
              />
            )}
          </View>
        </CyberCard>

        {/* Stats Overview */}
        <CyberCard style={styles.card} accentColor={COLORS.secondary}>
          <Text style={styles.cardTitle}>{'\u25C8'} STATUS</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{characters.length}</Text>
              <Text style={styles.statLabel}>CHARACTERS</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.totalWins ?? 0}</Text>
              <Text style={styles.statLabel}>WINS</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(user?.totalWins ?? 0) + (user?.totalLosses ?? 0)}</Text>
              <Text style={styles.statLabel}>BATTLES</Text>
            </View>
          </View>
        </CyberCard>

        {/* Recent Characters */}
        {characters.length > 0 && (
          <CyberCard style={styles.card}>
            <Text style={styles.cardTitle}>{'\u25C6'} RECENT CHARACTERS</Text>
            <Text style={styles.infoText}>
              {characters.length} character{characters.length !== 1 ? 's' : ''} in collection
            </Text>
            <CyberButton
              title="VIEW COLLECTION"
              onPress={() => router.push('/(tabs)/collection')}
              color={COLORS.primary}
              size="small"
              style={{ marginTop: 8 }}
            />
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
    marginBottom: 24,
    marginTop: 10,
  },
  subtitle: {
    fontFamily: FONTS.heading,
    fontSize: 12,
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
  actions: {
    gap: 10,
  },
  actionButton: {
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: 28,
    color: COLORS.primary,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.textDim,
    letterSpacing: 1,
    marginTop: 4,
  },
  infoText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 170, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 0, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  streakText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.warning,
    letterSpacing: 1,
  },
  missionProgress: {
    marginBottom: 8,
  },
  missionBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  missionBar: {
    height: '100%',
    backgroundColor: COLORS.warning,
    borderRadius: 2,
  },
  missionProgressText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textDim,
    letterSpacing: 1,
    textAlign: 'right',
  },
  missionList: {
    gap: 2,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  missionIcon: {
    fontSize: 14,
  },
  missionInfo: {
    flex: 1,
  },
  missionLabel: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.text,
    letterSpacing: 1,
  },
  missionDesc: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.textDim,
  },
  missionStatus: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  offlineBanner: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  offlineBannerText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.danger,
    letterSpacing: 1,
  },
});
