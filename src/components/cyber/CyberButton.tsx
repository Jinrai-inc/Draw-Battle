import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONTS } from '../../config/gameConfig';

interface CyberButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'small' | 'medium' | 'large';
}

export function CyberButton({
  title,
  onPress,
  color = COLORS.primary,
  disabled = false,
  style,
  textStyle,
  size = 'medium',
}: CyberButtonProps) {
  const sizeStyles = {
    small: { paddingVertical: 6, paddingHorizontal: 16, fontSize: 12 },
    medium: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 },
    large: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 20 },
  };

  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          borderColor: color,
          shadowColor: color,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color, fontSize: s.fontSize },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontFamily: FONTS.body,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
