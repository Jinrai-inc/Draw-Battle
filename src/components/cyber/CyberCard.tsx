import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../config/gameConfig';

interface CyberCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accentColor?: string;
}

export function CyberCard({ children, style, accentColor = COLORS.primary }: CyberCardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Corner accents */}
      <View style={[styles.cornerTL, { borderTopColor: accentColor, borderLeftColor: accentColor }]} />
      <View style={[styles.cornerTR, { borderTopColor: accentColor, borderRightColor: accentColor }]} />
      <View style={[styles.cornerBL, { borderBottomColor: accentColor, borderLeftColor: accentColor }]} />
      <View style={[styles.cornerBR, { borderBottomColor: accentColor, borderRightColor: accentColor }]} />
      {children}
    </View>
  );
}

const CORNER_SIZE = 12;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 4,
    padding: 16,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRadius: 4,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderRadius: 4,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRadius: 4,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderRadius: 4,
  },
});
