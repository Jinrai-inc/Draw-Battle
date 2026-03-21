import React from 'react';
import { TextInput, StyleSheet, View, Text, TextInputProps } from 'react-native';
import { COLORS, FONTS } from '../../config/gameConfig';

interface CyberInputProps extends TextInputProps {
  label?: string;
  glowColor?: string;
}

export function CyberInput({ label, glowColor = COLORS.primary, style, ...props }: CyberInputProps) {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: glowColor }]}>{label}</Text>
      )}
      <TextInput
        placeholderTextColor={COLORS.textDim}
        style={[
          styles.input,
          {
            borderColor: glowColor,
            shadowColor: glowColor,
            color: COLORS.text,
          },
          style,
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    fontFamily: FONTS.body,
    fontSize: 16,
    backgroundColor: 'rgba(10, 22, 40, 0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
});
