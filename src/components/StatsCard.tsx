import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, GAME_CONFIG } from '../config/gameConfig';
import { CyberCard } from './cyber/CyberCard';
import type { CharacterStats, ElementId, RarityId } from '../types';

interface StatsCardProps {
  stats: CharacterStats;
  element: ElementId;
  rarity: RarityId;
  specialMoveName?: string;
  specialRank?: string;
}

const STAT_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  hp: { icon: '+', color: COLORS.success, label: 'HP' },
  atk: { icon: '\u25B7', color: COLORS.danger, label: 'ATK' },
  def: { icon: '\u25A1', color: '#4488FF', label: 'DEF' },
  spd: { icon: '\u00BB', color: COLORS.warning, label: 'SPD' },
  special: { icon: '\u25C7', color: COLORS.secondary, label: 'SP' },
};

export function StatsCard({ stats, element, rarity, specialMoveName, specialRank }: StatsCardProps) {
  const elementDef = GAME_CONFIG.elements.find(e => e.id === element);
  const rarityDef = GAME_CONFIG.rarityThresholds.find(r => r.id === rarity);

  return (
    <CyberCard accentColor={rarityDef?.color || COLORS.primary}>
      {/* Rarity & Element */}
      <View style={styles.header}>
        <Text style={[styles.rarity, { color: rarityDef?.color }]}>
          {Array.from({ length: Math.min(rarity === 'UR' ? 6 : ['C','UC','R','SR','SSR'].indexOf(rarity) + 1, 6) }, () => '\u25C6').join('')}
          {' '}{rarity}
        </Text>
        <Text style={[styles.element, { color: elementDef?.color }]}>
          {'\u25C8'} {elementDef?.name || element}
        </Text>
      </View>

      {/* Stats */}
      {(['hp', 'atk', 'def', 'spd', 'special'] as const).map(key => {
        const s = STAT_ICONS[key];
        const value = stats[key];
        const barWidth = (value / GAME_CONFIG.stats.maxStat) * 100;

        return (
          <View key={key} style={styles.statRow}>
            <Text style={[styles.statIcon, { color: s.color }]}>{s.icon}</Text>
            <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
            <View style={styles.barContainer}>
              <View style={[styles.bar, { width: `${barWidth}%`, backgroundColor: s.color }]} />
            </View>
            <Text style={[styles.statValue, { color: s.color }]}>{value}</Text>
          </View>
        );
      })}

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalValue}>{stats.totalStats}</Text>
      </View>

      {/* Special move */}
      {specialMoveName && (
        <View style={styles.specialRow}>
          <Text style={styles.specialLabel}>{'\u25C7'} {specialMoveName}</Text>
          {specialRank && (
            <Text style={[styles.specialRank, { color: COLORS.secondary }]}>
              RANK {specialRank}
            </Text>
          )}
        </View>
      )}
    </CyberCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rarity: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    letterSpacing: 1,
  },
  element: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    letterSpacing: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  statIcon: {
    width: 18,
    fontSize: 14,
    fontFamily: FONTS.mono,
    textAlign: 'center',
  },
  statLabel: {
    width: 36,
    fontSize: 12,
    fontFamily: FONTS.heading,
    letterSpacing: 1,
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
    opacity: 0.8,
  },
  statValue: {
    width: 30,
    textAlign: 'right',
    fontFamily: FONTS.mono,
    fontSize: 14,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,255,255,0.2)',
  },
  totalLabel: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  totalValue: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '700',
  },
  specialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,0,255,0.2)',
  },
  specialLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.secondary,
  },
  specialRank: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
