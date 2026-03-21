import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { COLORS, FONTS } from '../../config/gameConfig';

interface GlowTextProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: TextStyle;
  font?: 'heading' | 'body' | 'mono';
}

export function GlowText({
  children,
  color = COLORS.primary,
  size = 24,
  style,
  font = 'heading',
}: GlowTextProps) {
  return (
    <Text
      style={[
        styles.text,
        {
          color,
          fontSize: size,
          fontFamily: FONTS[font],
          textShadowColor: color,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
});
