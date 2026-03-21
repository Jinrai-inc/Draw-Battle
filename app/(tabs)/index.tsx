import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '../../src/config/gameConfig';
import { CyberButton, CyberCard, GlowText } from '../../src/components/cyber';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useAuthStore } from '../../src/stores/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { characters, loadCharacters } = useCollectionStore();
  const user = useAuthStore((s) => s.user);

  // Load characters from DB on mount
  useEffect(() => {
    if (user?.id) {
      loadCharacters(user.id);
    }
  }, [user?.id]);

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <GlowText size={28} color={COLORS.primary}>DRAW BATTLE</GlowText>
          <Text style={styles.subtitle}>-- MAIN MENU --</Text>
        </View>

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
});
