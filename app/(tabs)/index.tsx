import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '../../src/config/gameConfig';
import { CyberButton, CyberCard, GlowText } from '../../src/components/cyber';
import { playBGM, BGM } from '../../src/services/soundService';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useEquipmentStore } from '../../src/stores/equipmentStore';
import { useTitleStore } from '../../src/stores/titleStore';
import { useDailyMissionStore } from '../../src/stores/dailyMissionStore';
import { useLanguageStore } from '../../src/stores/languageStore';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { characters, loadCharacters } = useCollectionStore();
  const { loadEquipment } = useEquipmentStore();
  const { loadUnlockedTitles } = useTitleStore();
  const { missions, loginStreak, completedCount, initMissions } = useDailyMissionStore();
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const { isOnline } = useNetworkStatus();
  const t = useLanguageStore((s) => s.t);

  useEffect(() => {
    if (user?.id && !isGuest) {
      loadCharacters(user.id);
      loadEquipment(user.id);
      loadUnlockedTitles(user.id);
      initMissions(user.id);
    }
  }, [user?.id, isGuest]);

  // Play menu BGM when home screen mounts
  useEffect(() => {
    playBGM(BGM.MENU);
  }, []);

  const missionDefs = [
    { type: 'login' as const, label: t('mission_login'), desc: t('mission_login_desc'), icon: '\u25C8' },
    { type: 'draw' as const, label: t('mission_draw'), desc: t('mission_draw_desc'), icon: '\u25C6' },
    { type: 'battle' as const, label: t('mission_battle'), desc: t('mission_battle_desc'), icon: '\u25B7' },
    { type: 'fusion' as const, label: t('mission_fusion'), desc: t('mission_fusion_desc'), icon: '\u25C7' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>{t('home_offline')}</Text>
          </View>
        )}

        <View style={styles.header}>
          <GlowText size={28} color={COLORS.primary}>DRAW BATTLE</GlowText>
          <Text style={styles.subtitle}>-- {t('home_title')} --</Text>
        </View>

        {missions.length > 0 && (
          <CyberCard style={styles.card} accentColor={COLORS.warning}>
            <View style={styles.missionHeader}>
              <Text style={styles.cardTitle}>{t('home_daily_missions')}</Text>
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>{loginStreak}{t('home_day_streak')}</Text>
              </View>
            </View>
            <View style={styles.missionProgress}>
              <View style={styles.missionBarBg}>
                <View style={[styles.missionBar, { width: `${(completedCount / missions.length) * 100}%` }]} />
              </View>
              <Text style={styles.missionProgressText}>{completedCount}/{missions.length} COMPLETE</Text>
            </View>
            <View style={styles.missionList}>
              {missionDefs.map(def => {
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
                      {done ? t('home_complete') : '---'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </CyberCard>
        )}

        <CyberCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('home_quick_start')}</Text>
          <View style={styles.actions}>
            <CyberButton
              title={t('home_draw_character')}
              onPress={() => router.push('/(tabs)/draw')}
              color={COLORS.primary}
              style={styles.actionButton}
            />
            <CyberButton
              title={t('home_ai_battle')}
              onPress={() => router.push('/(tabs)/battle')}
              color={COLORS.danger}
              style={styles.actionButton}
            />
            {characters.length >= 2 && (
              <CyberButton
                title={t('home_fusion')}
                onPress={() => router.push('/character/fusion')}
                color={COLORS.warning}
                style={styles.actionButton}
              />
            )}
          </View>
        </CyberCard>

        <CyberCard style={styles.card} accentColor={COLORS.secondary}>
          <Text style={styles.cardTitle}>{t('home_status')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{characters.length}</Text>
              <Text style={styles.statLabel}>{t('home_characters')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.totalWins ?? 0}</Text>
              <Text style={styles.statLabel}>{t('home_wins')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(user?.totalWins ?? 0) + (user?.totalLosses ?? 0)}</Text>
              <Text style={styles.statLabel}>{t('home_battles')}</Text>
            </View>
          </View>
        </CyberCard>

        {characters.length > 0 && (
          <CyberCard style={styles.card}>
            <Text style={styles.cardTitle}>{t('home_recent')}</Text>
            <CyberButton
              title={t('home_view_collection')}
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
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, zIndex: 10 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  subtitle: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textDim, letterSpacing: 2, marginTop: 4 },
  card: { marginBottom: 16 },
  cardTitle: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.primary, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  actions: { gap: 10 },
  actionButton: { width: '100%' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontFamily: FONTS.mono, fontSize: 28, color: COLORS.primary, fontWeight: '700' },
  statLabel: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.textDim, marginTop: 4 },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakBadge: { backgroundColor: 'rgba(255,170,0,0.15)', borderWidth: 1, borderColor: 'rgba(255,170,0,0.3)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  streakText: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.warning },
  missionProgress: { marginBottom: 8 },
  missionBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  missionBar: { height: '100%', backgroundColor: COLORS.warning, borderRadius: 2 },
  missionProgressText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim, letterSpacing: 1, textAlign: 'right' },
  missionList: { gap: 2 },
  missionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  missionIcon: { fontSize: 14 },
  missionInfo: { flex: 1 },
  missionLabel: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.text },
  missionDesc: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.textDim },
  missionStatus: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1 },
  offlineBanner: { backgroundColor: 'rgba(255,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(255,68,68,0.3)', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 12, alignItems: 'center' },
  offlineBannerText: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.danger },
});
