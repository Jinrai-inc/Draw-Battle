import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { CyberButton, CyberCard, GlowText, CyberInput } from '../../src/components/cyber';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useAuthStore } from '../../src/stores/authStore';
import { analyzeDrawing, generateStats, determineElement, determineRarity } from '../../src/engine/drawingAnalyzer';
import type { Character, DrawingAnalysis } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - 40;

interface DrawPath {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

const PALETTE_COLORS = [
  '#000000', '#FF4444', '#4488FF', '#00CC44',
  '#FFDD00', '#AA44FF', '#FF8800', '#FFFFFF',
];

const BRUSH_SIZES = [
  { label: 'S', value: 3 },
  { label: 'M', value: 8 },
  { label: 'L', value: 16 },
];

function generateMockPixelData(paths: DrawPath[], canvasSize: number): Uint8Array {
  const w = 64;
  const h = 64;
  const data = new Uint8Array(w * h * 4);

  // Fill with white background (RGBA)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = 0; // transparent background
  }

  const scale = w / canvasSize;

  for (const path of paths) {
    // Parse hex color
    let r = 0, g = 0, b = 0;
    const hex = path.color.replace('#', '');
    if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    for (const pt of path.points) {
      const px = Math.floor(pt.x * scale);
      const py = Math.floor(pt.y * scale);
      const brushRadius = Math.max(1, Math.floor(path.width * scale * 0.5));

      for (let dy = -brushRadius; dy <= brushRadius; dy++) {
        for (let dx = -brushRadius; dx <= brushRadius; dx++) {
          const fx = px + dx;
          const fy = py + dy;
          if (fx >= 0 && fx < w && fy >= 0 && fy < h) {
            const idx = (fy * w + fx) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }
      }
    }
  }

  return data;
}

// Convert pixel data (Uint8Array RGBA) to base64 PNG-like string
// In production this would use a canvas to encode real PNG; for now we store raw RGBA
function pixelDataToBase64(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

export default function DrawScreen() {
  const router = useRouter();
  const { setDraft } = useCollectionStore();
  const user = useAuthStore((s) => s.user);

  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);

  const currentPathRef = useRef<DrawPath | null>(null);
  const currentColorRef = useRef(currentColor);
  const brushSizeRef = useRef(brushSize);

  // Keep refs in sync with state so PanResponder always uses latest values
  useEffect(() => { currentColorRef.current = currentColor; }, [currentColor]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touch = evt.nativeEvent;
        const x = touch.locationX;
        const y = touch.locationY;
        currentPathRef.current = {
          points: [{ x, y }],
          color: currentColorRef.current,
          width: brushSizeRef.current,
        };
        setIsDrawing(true);
      },
      onPanResponderMove: (evt) => {
        if (currentPathRef.current) {
          const touch = evt.nativeEvent;
          const x = touch.locationX;
          const y = touch.locationY;
          currentPathRef.current.points.push({ x, y });
          // Force re-render by updating paths
          setPaths((prev) => [...prev]);
        }
      },
      onPanResponderRelease: () => {
        if (currentPathRef.current && currentPathRef.current.points.length > 0) {
          setPaths((prev) => [...prev, { ...currentPathRef.current! }]);
        }
        currentPathRef.current = null;
        setIsDrawing(false);
      },
    })
  ).current;

  const handleClear = useCallback(() => {
    setPaths([]);
    currentPathRef.current = null;
  }, []);

  const handleComplete = useCallback(() => {
    if (paths.length === 0) {
      Alert.alert('NO DATA', 'Draw something on the canvas first!');
      return;
    }

    // Generate pixel data from paths
    const pixelData = generateMockPixelData(paths, CANVAS_SIZE);
    const analysis = analyzeDrawing(pixelData, 64, 64);
    const stats = generateStats(analysis);
    const element = determineElement(analysis);
    const rarity = determineRarity(stats.totalStats);
    const imageBase64 = pixelDataToBase64(pixelData);

    const newCharacter: Character = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      userId: user?.id || 'local',
      imageUrl: '',
      name: undefined,
      specialMoveName: '',
      stats,
      element,
      rarity,
      level: 1,
      exp: 0,
      battleCount: 0,
      isEvolved: false,
      createdAt: new Date().toISOString(),
    };

    // Save as draft and navigate to naming screen
    setDraft(newCharacter, imageBase64);
    setPaths([]);
    router.push('/character/naming');
  }, [paths, setDraft, user, router]);

  // Render drawn paths as small dot views
  const renderPaths = () => {
    const allPaths = [...paths];
    if (currentPathRef.current) {
      allPaths.push(currentPathRef.current);
    }

    return allPaths.map((path, pathIdx) =>
      path.points.map((pt, ptIdx) => (
        <View
          key={`${pathIdx}-${ptIdx}`}
          style={{
            position: 'absolute',
            left: pt.x - path.width / 2,
            top: pt.y - path.width / 2,
            width: path.width,
            height: path.width,
            borderRadius: path.width / 2,
            backgroundColor: path.color,
          }}
        />
      ))
    );
  };

  const totalPoints = paths.reduce((sum, p) => sum + p.points.length, 0);

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <GlowText size={24} color={COLORS.primary}>
            {'\u25C8'} DRAW CHARACTER
          </GlowText>
          <Text style={styles.subtitle}>-- SKETCH YOUR FIGHTER --</Text>
        </View>

        {/* Canvas */}
        <View style={styles.canvasWrapper}>
          <View
            style={[styles.canvas, { width: CANVAS_SIZE, height: CANVAS_SIZE }]}
            {...panResponder.panHandlers}
          >
            {renderPaths()}
            {paths.length === 0 && !isDrawing && (
              <View style={styles.canvasPlaceholder}>
                <Text style={styles.placeholderText}>{'\u25A1'} DRAW HERE {'\u25A1'}</Text>
                <Text style={styles.placeholderSubtext}>
                  Use your finger to sketch a character
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Drawing Info */}
        <View style={styles.drawInfo}>
          <Text style={styles.infoText}>
            STROKES: {paths.length} {'\u25C6'} POINTS: {totalPoints}
          </Text>
        </View>

        {/* Color Palette */}
        <CyberCard style={styles.toolCard}>
          <Text style={styles.toolLabel}>{'\u25B7'} COLOR</Text>
          <View style={styles.paletteRow}>
            {PALETTE_COLORS.map((color) => (
              <View
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  currentColor === color && styles.colorSwatchSelected,
                  currentColor === color && { borderColor: COLORS.primary },
                ]}
              >
                <View
                  style={styles.colorTouchable}
                  onTouchEnd={() => setCurrentColor(color)}
                />
              </View>
            ))}
          </View>
        </CyberCard>

        {/* Brush Size */}
        <CyberCard style={styles.toolCard}>
          <Text style={styles.toolLabel}>{'\u25B7'} BRUSH SIZE</Text>
          <View style={styles.brushRow}>
            {BRUSH_SIZES.map((bs) => (
              <CyberButton
                key={bs.label}
                title={bs.label}
                onPress={() => setBrushSize(bs.value)}
                color={brushSize === bs.value ? COLORS.primary : COLORS.textDim}
                size="small"
                style={styles.brushButton}
              />
            ))}
          </View>
        </CyberCard>

        {/* Actions */}
        <View style={styles.actionRow}>
          <CyberButton
            title="CLEAR"
            onPress={handleClear}
            color={COLORS.danger}
            size="medium"
            style={styles.actionBtn}
          />
          <CyberButton
            title="COMPLETE"
            onPress={handleComplete}
            color={COLORS.success}
            size="medium"
            style={styles.actionBtn}
            disabled={paths.length === 0}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  subtitle: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: 3,
    marginTop: 4,
  },
  canvasWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  canvas: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    position: 'relative',
  },
  canvasPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: 'rgba(0,0,0,0.2)',
    letterSpacing: 2,
  },
  placeholderSubtext: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(0,0,0,0.15)',
    marginTop: 4,
  },
  drawInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: 1,
  },
  toolCard: {
    marginBottom: 12,
  },
  toolLabel: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  colorTouchable: {
    flex: 1,
  },
  brushRow: {
    flexDirection: 'row',
    gap: 10,
  },
  brushButton: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
  },
});
