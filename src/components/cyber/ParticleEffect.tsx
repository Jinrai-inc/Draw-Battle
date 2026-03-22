import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParticleEffectProps {
  color?: string;
  count?: number;
  duration?: number;
  spread?: number;
  active?: boolean;
}

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  startX: number;
  startY: number;
}

/**
 * Animated particle burst effect.
 * Used for victory celebrations, rarity reveals, level ups, etc.
 */
export function ParticleEffect({
  color = '#00FFFF',
  count = 20,
  duration = 1500,
  spread = 200,
  active = true,
}: ParticleEffectProps) {
  const particles = useRef<Particle[]>(
    Array.from({ length: count }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      startX: SCREEN_WIDTH / 2,
      startY: SCREEN_HEIGHT / 2,
    }))
  ).current;

  useEffect(() => {
    if (!active) return;

    const animations = particles.map((p) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = spread * (0.3 + Math.random() * 0.7);
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;
      const particleDuration = duration * (0.6 + Math.random() * 0.4);

      p.x.setValue(0);
      p.y.setValue(0);
      p.opacity.setValue(0);
      p.scale.setValue(0);

      return Animated.parallel([
        Animated.timing(p.x, {
          toValue: targetX,
          duration: particleDuration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: targetY,
          duration: particleDuration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(p.opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: particleDuration - 100,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(p.scale, {
            toValue: 1 + Math.random(),
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(p.scale, {
            toValue: 0,
            duration: particleDuration - 200,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.stagger(30, animations).start();
  }, [active]);

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              backgroundColor: color,
              shadowColor: color,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { scale: p.scale },
              ],
              opacity: p.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
});
