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

// Detect if text contains non-ASCII characters (Japanese, Chinese, Korean, etc.)
function hasNonAscii(text: string): boolean {
  return /[^\x00-\x7F]/.test(text);
}

export function GlowText({
  children,
  color = COLORS.primary,
  size = 24,
  style,
  font = 'heading',
}: GlowTextProps) {
  // Use body font for non-ASCII text (Japanese etc.) since Orbitron doesn't support it
  const textContent = typeof children === 'string' ? children : '';
  const actualFont = font === 'heading' && hasNonAscii(textContent) ? 'body' : font;

  return (
    <Text
      style={[
        styles.text,
        {
          color,
          fontSize: size,
          fontFamily: FONTS[actualFont],
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
