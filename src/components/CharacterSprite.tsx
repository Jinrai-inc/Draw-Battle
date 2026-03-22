import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { COLORS } from '../config/gameConfig';

interface Props {
  /** base64-encoded RGBA pixel data (64x64) */
  imageBase64?: string;
  /** display size in points */
  size?: number;
  /** enable idle bobbing animation */
  animate?: boolean;
  /** element color for glow */
  glowColor?: string;
}

/**
 * Renders a character drawing as a sprite with transparent background
 * and optional idle animation (gentle float/bob).
 *
 * Background removal: The pixel data already has alpha=0 for background
 * pixels (see generateMockPixelData in draw.tsx). We render each opaque
 * pixel as a tiny colored View.
 */
export function CharacterSprite({ imageBase64, size = 120, animate = true, glowColor = COLORS.primary }: Props) {
  const bobY = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!animate) return;

    const bobAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(bobY, {
          toValue: -6,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bobY, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.8,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    bobAnim.start();
    glowAnim.start();

    return () => {
      bobAnim.stop();
      glowAnim.stop();
    };
  }, [animate]);

  const pixels = React.useMemo(() => {
    if (!imageBase64) return null;

    try {
      const binary = atob(imageBase64);
      const data = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        data[i] = binary.charCodeAt(i);
      }

      // Expected: 64x64 RGBA = 16384 bytes
      const w = 64;
      const h = 64;
      if (data.length !== w * h * 4) return null;

      const pixelSize = size / w;
      const result: React.ReactNode[] = [];

      // Find bounding box of non-transparent pixels
      let minX = w, maxX = 0, minY = h, maxY = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          if (data[idx + 3] > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX < minX) return null; // empty drawing

      const drawW = maxX - minX + 1;
      const drawH = maxY - minY + 1;
      const scale = Math.min(size / drawW, size / drawH) / (size / w);
      const scaledPixelSize = pixelSize * scale;
      const offsetX = (size - drawW * scaledPixelSize) / 2;
      const offsetY = (size - drawH * scaledPixelSize) / 2;

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const idx = (y * w + x) * 4;
          const a = data[idx + 3];
          if (a === 0) continue; // transparent = background removed

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          result.push(
            <View
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: offsetX + (x - minX) * scaledPixelSize,
                top: offsetY + (y - minY) * scaledPixelSize,
                width: scaledPixelSize + 0.5, // +0.5 to prevent gaps
                height: scaledPixelSize + 0.5,
                backgroundColor: `rgba(${r},${g},${b},${a / 255})`,
              }}
            />
          );
        }
      }

      return result;
    } catch {
      return null;
    }
  }, [imageBase64, size]);

  if (!pixels) {
    return (
      <Animated.View
        style={[
          styles.placeholder,
          { width: size, height: size, transform: [{ translateY: animate ? bobY : 0 }] },
        ]}
      />
    );
  }

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* Glow shadow underneath */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 0.6,
            height: size * 0.15,
            bottom: -size * 0.05,
            backgroundColor: glowColor,
            opacity: glowOpacity,
          },
        ]}
      />
      {/* Animated sprite */}
      <Animated.View
        style={[
          styles.spriteContainer,
          {
            width: size,
            height: size,
            transform: [{ translateY: animate ? bobY : 0 }],
          },
        ]}
      >
        {pixels}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spriteContainer: {
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 100,
  },
  placeholder: {
    borderRadius: 8,
    backgroundColor: 'rgba(0,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.1)',
  },
});
