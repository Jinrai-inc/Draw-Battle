import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, FONTS } from '../../config/gameConfig';
import { TITLE_DEFINITIONS } from '../../services/titleService';
import { playSE, SE } from '../../services/soundService';

interface Props {
  titleId: string;
  onDone: () => void;
}

export function TitleUnlockToast({ titleId, onDone }: Props) {
  const slideY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const title = TITLE_DEFINITIONS.find(t => t.id === titleId);

  useEffect(() => {
    playSE(SE.TITLE_UNLOCK);

    Animated.sequence([
      // Slide in
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Hold
      Animated.delay(2500),
      // Slide out
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: -100,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onDone());
  }, []);

  if (!title) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideY }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.inner}>
        <Text style={styles.icon}>{title.icon}</Text>
        <View style={styles.textBox}>
          <Text style={styles.label}>TITLE UNLOCKED!</Text>
          <Text style={styles.titleName}>{title.name}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(5, 5, 16, 0.95)',
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderRadius: 8,
    padding: 14,
    shadowColor: COLORS.warning,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  icon: {
    fontSize: 24,
    color: COLORS.warning,
  },
  textBox: {
    flex: 1,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.warning,
    letterSpacing: 3,
    marginBottom: 2,
  },
  titleName: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '700',
  },
});
