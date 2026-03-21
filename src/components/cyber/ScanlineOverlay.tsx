import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../config/gameConfig';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCANLINE_SPACING = 2;
const SCANLINE_COUNT = Math.ceil(SCREEN_HEIGHT / SCANLINE_SPACING);

export function ScanlineOverlay() {
  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: SCANLINE_COUNT }, (_, i) => (
        <View
          key={i}
          style={[
            styles.line,
            { top: i * SCANLINE_SPACING },
          ]}
        />
      ))}
    </View>
  );
}

export function GridBackground() {
  const GRID_SIZE = 40;
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const hLines = Math.ceil(SCREEN_HEIGHT / GRID_SIZE);
  const vLines = Math.ceil(SCREEN_WIDTH / GRID_SIZE);

  return (
    <View style={styles.gridContainer} pointerEvents="none">
      {Array.from({ length: hLines }, (_, i) => (
        <View
          key={`h${i}`}
          style={[styles.gridLineH, { top: i * GRID_SIZE }]}
        />
      ))}
      {Array.from({ length: vLines }, (_, i) => (
        <View
          key={`v${i}`}
          style={[styles.gridLineV, { left: i * GRID_SIZE }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.scanline,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.grid,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: COLORS.grid,
  },
});
