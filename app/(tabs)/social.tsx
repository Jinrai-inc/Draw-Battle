import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { CyberButton, CyberCard, GlowText, CyberInput } from '../../src/components/cyber';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';

export default function SocialScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <GlowText size={24} color={COLORS.primary}>
            {'\u25A1'} SOCIAL
          </GlowText>
          <Text style={styles.subtitle}>-- CONNECT AND COMPETE --</Text>
        </View>

        {/* Coming Soon Banner */}
        <CyberCard style={styles.card} accentColor={COLORS.secondary}>
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonIcon}>{'\u25C8'}</Text>
            <GlowText size={22} color={COLORS.secondary}>
              COMING SOON
            </GlowText>
            <Text style={styles.comingSoonDesc}>
              Social features are under development.
              {'\n'}Stay tuned for updates!
            </Text>
          </View>
        </CyberCard>

        {/* Friend List Placeholder */}
        <CyberCard style={styles.card} accentColor={COLORS.textDim}>
          <Text style={styles.cardTitle}>{'\u25C6'} FRIEND LIST</Text>

          <View style={styles.placeholderList}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.placeholderItem}>
                <View style={styles.placeholderAvatar}>
                  <Text style={styles.placeholderAvatarText}>{'\u25A1'}</Text>
                </View>
                <View style={styles.placeholderInfo}>
                  <View style={styles.placeholderBar} />
                  <View style={[styles.placeholderBar, styles.placeholderBarShort]} />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.lockedOverlay}>
            <Text style={styles.lockedText}>{'\u25C8'} LOCKED {'\u25C8'}</Text>
          </View>
        </CyberCard>

        {/* Rankings Placeholder */}
        <CyberCard style={styles.card} accentColor={COLORS.textDim}>
          <Text style={styles.cardTitle}>{'\u25B7'} RANKINGS</Text>

          <View style={styles.rankingList}>
            {['RATING', 'WEEKLY WINS', 'MAX DAMAGE', 'COLLECTION'].map((label, idx) => (
              <View key={label} style={styles.rankingRow}>
                <Text style={styles.rankingIndex}>#{idx + 1}</Text>
                <Text style={styles.rankingLabel}>{label}</Text>
                <Text style={styles.rankingValue}>---</Text>
              </View>
            ))}
          </View>

          <View style={styles.lockedOverlay}>
            <Text style={styles.lockedText}>{'\u25C8'} LOCKED {'\u25C8'}</Text>
          </View>
        </CyberCard>

        {/* Features Preview */}
        <CyberCard style={styles.card} accentColor={COLORS.primary}>
          <Text style={styles.cardTitle}>{'\u25C6'} UPCOMING FEATURES</Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>{'\u25B7'}</Text>
              <Text style={styles.featureText}>Add and manage friends</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>{'\u25B7'}</Text>
              <Text style={styles.featureText}>Challenge friends to battles</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>{'\u25B7'}</Text>
              <Text style={styles.featureText}>Global and weekly rankings</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>{'\u25B7'}</Text>
              <Text style={styles.featureText}>Trade characters with friends</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>{'\u25B7'}</Text>
              <Text style={styles.featureText}>Guild system and group battles</Text>
            </View>
          </View>
        </CyberCard>
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
    fontSize: 11,
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
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  comingSoonIcon: {
    fontSize: 40,
    color: COLORS.secondary,
  },
  comingSoonDesc: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: 'center',
    lineHeight: 22,
  },
  placeholderList: {
    gap: 10,
    opacity: 0.3,
  },
  placeholderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderAvatarText: {
    fontSize: 18,
    color: COLORS.textDim,
  },
  placeholderInfo: {
    flex: 1,
    gap: 6,
  },
  placeholderBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    width: '70%',
  },
  placeholderBarShort: {
    width: '40%',
  },
  lockedOverlay: {
    alignItems: 'center',
    marginTop: 12,
  },
  lockedText: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.textDim,
    letterSpacing: 3,
  },
  rankingList: {
    gap: 8,
    opacity: 0.3,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rankingIndex: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.primary,
    width: 30,
    fontWeight: '700',
  },
  rankingLabel: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.text,
    flex: 1,
    letterSpacing: 1,
  },
  rankingValue: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.textDim,
    letterSpacing: 2,
  },
  featureList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureBullet: {
    fontSize: 12,
    color: COLORS.primary,
  },
  featureText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text,
  },
});
