import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { CyberButton, CyberCard, GlowText } from '../../src/components/cyber';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useDailyMissionStore } from '../../src/stores/dailyMissionStore';
import { useLanguageStore } from '../../src/stores/languageStore';
import { analyzeDrawing, generateStats, determineElement, determineRarity } from '../../src/engine/drawingAnalyzer';
import { playSE, SE } from '../../src/services/soundService';
import type { Character } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - 40;

interface SvgPathData {
  d: string;
  color: string;
  width: number;
  points: { x: number; y: number }[];
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

function pointsToSvgPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y} L ${p.x + 0.5} ${p.y + 0.5}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  if (points.length === 2) {
    d += ` L ${points[1].x} ${points[1].y}`;
    return d;
  }

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${midX} ${midY}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

function generateMockPixelData(paths: SvgPathData[], canvasSize: number): Uint8Array {
  const w = 64;
  const h = 64;
  const data = new Uint8Array(w * h * 4);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 0;
  }

  const scale = w / canvasSize;

  for (const path of paths) {
    let r = 0, g = 0, b = 0;
    const hex = path.color.replace('#', '');
    if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    for (let pi = 0; pi < path.points.length - 1; pi++) {
      const p0 = path.points[pi];
      const p1 = path.points[pi + 1];
      const dist = Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2);
      const steps = Math.max(1, Math.ceil(dist * scale));

      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = Math.floor((p0.x + (p1.x - p0.x) * t) * scale);
        const y = Math.floor((p0.y + (p1.y - p0.y) * t) * scale);
        const brushRadius = Math.max(1, Math.floor(path.width * scale * 0.5));

        for (let dy = -brushRadius; dy <= brushRadius; dy++) {
          for (let dx = -brushRadius; dx <= brushRadius; dx++) {
            const fx = x + dx;
            const fy = y + dy;
            if (fx >= 0 && fx < w && fy >= 0 && fy < h) {
              const idx = (fy * w + fx) * 4;
              data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
            }
          }
        }
      }
    }
  }

  return data;
}

function pixelDataToBase64(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

/** Generate pseudo pixel data from a base64 string for analysis. */
function generatePixelDataFromBase64(base64: string): Uint8Array {
  const w = 64;
  const h = 64;
  const data = new Uint8Array(w * h * 4);

  // Decode base64 to get raw bytes for hashing
  const raw = atob(base64.substring(0, Math.min(base64.length, 8192)));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }

  // Fill pixel data using image bytes as seed for variety
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const byteIdx = ((y * w + x) * 3) % bytes.length;
      const r = bytes[byteIdx % bytes.length];
      const g = bytes[(byteIdx + 1) % bytes.length];
      const b = bytes[(byteIdx + 2) % bytes.length];
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  return data;
}

export default function DrawScreen() {
  const router = useRouter();
  const { setDraft } = useCollectionStore();
  const user = useAuthStore((s) => s.user);
  const { completeMission } = useDailyMissionStore();
  const t = useLanguageStore((s) => s.t);

  const [completedPaths, setCompletedPaths] = useState<SvgPathData[]>([]);
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [pickedImageBase64, setPickedImageBase64] = useState<string | null>(null);
  const [currentSvgPath, setCurrentSvgPath] = useState<string>('');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Use refs to accumulate points without re-renders
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const drawingColorRef = useRef(currentColor);
  const drawingWidthRef = useRef(brushSize);
  const canvasRef = useRef<View>(null);
  const canvasLayoutRef = useRef({ x: 0, y: 0 });
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Throttled SVG path update during drawing
  const updateCurrentSvg = useCallback(() => {
    if (pointsRef.current.length > 0) {
      setCurrentSvgPath(pointsToSvgPath(pointsRef.current));
    }
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (updateTimerRef.current) return;
    updateTimerRef.current = setTimeout(() => {
      updateTimerRef.current = null;
      updateCurrentSvg();
    }, 16); // ~60fps
  }, [updateCurrentSvg]);

  const handleTouchStart = useCallback((e: any) => {
    playSE(SE.DRAW_START);
    const touch = e.nativeEvent;
    const x = touch.locationX;
    const y = touch.locationY;

    drawingColorRef.current = currentColor;
    drawingWidthRef.current = brushSize;
    pointsRef.current = [{ x, y }];
    setIsDrawing(true);
    setScrollEnabled(false);
    setCurrentSvgPath(pointsToSvgPath([{ x, y }]));
  }, [currentColor, brushSize]);

  const handleTouchMove = useCallback((e: any) => {
    if (!isDrawing) return;
    const touch = e.nativeEvent;
    const x = touch.locationX;
    const y = touch.locationY;

    // Clamp to canvas bounds
    const cx = Math.max(0, Math.min(CANVAS_SIZE, x));
    const cy = Math.max(0, Math.min(CANVAS_SIZE, y));

    pointsRef.current.push({ x: cx, y: cy });
    scheduleUpdate();
  }, [isDrawing, scheduleUpdate]);

  const handleTouchEnd = useCallback(() => {
    if (!isDrawing) return;

    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }

    if (pointsRef.current.length > 0) {
      const newPath: SvgPathData = {
        d: pointsToSvgPath(pointsRef.current),
        color: drawingColorRef.current,
        width: drawingWidthRef.current,
        points: [...pointsRef.current],
      };
      setCompletedPaths((prev) => [...prev, newPath]);
    }

    pointsRef.current = [];
    setCurrentSvgPath('');
    setIsDrawing(false);
    setScrollEnabled(true);
  }, [isDrawing]);

  const handleClear = useCallback(() => {
    setCompletedPaths([]);
    setCurrentSvgPath('');
    pointsRef.current = [];
  }, []);

  const handleUndo = useCallback(() => {
    setCompletedPaths((prev) => prev.slice(0, -1));
  }, []);

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('', 'カメラロールへのアクセス許可が必要です');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPickedImageUri(asset.uri);
      setPickedImageBase64(asset.base64 || null);
      // Clear drawing paths since image is chosen
      setCompletedPaths([]);
      setCurrentSvgPath('');
      pointsRef.current = [];
    }
  }, []);

  const handleClearPickedImage = useCallback(() => {
    setPickedImageUri(null);
    setPickedImageBase64(null);
  }, []);

  const handleComplete = useCallback(() => {
    const hasDrawing = completedPaths.length > 0;
    const hasPickedImage = !!pickedImageBase64;

    if (!hasDrawing && !hasPickedImage) {
      Alert.alert('', t('draw_no_data'));
      return;
    }

    playSE(SE.DRAW_COMPLETE);

    let pixelData: Uint8Array;
    let imageBase64: string;

    if (hasPickedImage) {
      // Use picked image
      pixelData = generatePixelDataFromBase64(pickedImageBase64!);
      imageBase64 = pickedImageBase64!;
    } else {
      // Use hand-drawn paths
      pixelData = generateMockPixelData(completedPaths, CANVAS_SIZE);
      imageBase64 = pixelDataToBase64(pixelData);
    }

    const analysis = analyzeDrawing(pixelData, 64, 64);
    const stats = generateStats(analysis);
    const element = determineElement(analysis);
    const rarity = determineRarity(stats.totalStats);

    const newCharacter: Character = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      userId: user?.id || 'local',
      imageUrl: hasPickedImage ? pickedImageUri || '' : '',
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

    setDraft(newCharacter, imageBase64);
    setCompletedPaths([]);
    setPickedImageUri(null);
    setPickedImageBase64(null);
    if (user?.id) completeMission(user.id, 'draw');
    router.push('/character/naming');
  }, [completedPaths, pickedImageBase64, pickedImageUri, setDraft, user, router, t]);

  const totalPoints = completedPaths.reduce((sum, p) => sum + (p.points?.length || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <GlowText size={24} color={COLORS.primary}>
            {t('draw_title')}
          </GlowText>
          <Text style={styles.subtitle}>-- {t('draw_subtitle')} --</Text>
        </View>

        {/* Canvas - using direct touch handlers instead of PanResponder */}
        <View style={styles.canvasWrapper}>
          {pickedImageUri ? (
            <View style={[styles.canvas, { width: CANVAS_SIZE, height: CANVAS_SIZE }]}>
              <Image
                source={{ uri: pickedImageUri }}
                style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, borderRadius: 2 }}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.clearPickedBtn}
                onPress={handleClearPickedImage}
                activeOpacity={0.7}
              >
                <Text style={styles.clearPickedText}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              ref={canvasRef}
              style={[styles.canvas, { width: CANVAS_SIZE, height: CANVAS_SIZE }]}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={StyleSheet.absoluteFill}>
                {/* Completed paths */}
                {completedPaths.map((path, idx) => (
                  <Path
                    key={idx}
                    d={path.d}
                    stroke={path.color}
                    strokeWidth={path.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ))}
                {/* Current drawing path */}
                {currentSvgPath !== '' && (
                  <Path
                    d={currentSvgPath}
                    stroke={drawingColorRef.current}
                    strokeWidth={drawingWidthRef.current}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )}
              </Svg>
              {completedPaths.length === 0 && !isDrawing && (
                <View style={styles.canvasPlaceholder}>
                  <Text style={styles.placeholderText}>{t('draw_here')}</Text>
                  <Text style={styles.placeholderSubtext}>{t('draw_finger_hint')}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Image Picker */}
        {!pickedImageUri && (
          <View style={styles.imagePickerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>{t('draw_or')}</Text>
            <View style={styles.dividerLine} />
          </View>
        )}
        {!pickedImageUri && (
          <CyberButton
            title={'\uD83D\uDDBC ' + t('draw_pick_image')}
            onPress={handlePickImage}
            color={COLORS.secondary}
            size="medium"
            style={styles.pickImageBtn}
          />
        )}

        {/* Drawing Info */}
        {!pickedImageUri && (
          <View style={styles.drawInfo}>
            <Text style={styles.infoText}>
              {t('draw_strokes')}: {completedPaths.length} {'\u25C6'} {t('draw_points')}: {totalPoints}
            </Text>
          </View>
        )}

        {/* Color Palette */}
        {!pickedImageUri && (
          <CyberCard style={styles.toolCard}>
            <Text style={styles.toolLabel}>{t('draw_color')}</Text>
            <View style={styles.paletteRow}>
              {PALETTE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    currentColor === color && styles.colorSwatchSelected,
                    currentColor === color && { borderColor: COLORS.primary },
                  ]}
                  onPress={() => setCurrentColor(color)}
                  activeOpacity={0.7}
                />
              ))}
            </View>
          </CyberCard>
        )}

        {/* Brush Size */}
        {!pickedImageUri && (
          <CyberCard style={styles.toolCard}>
            <Text style={styles.toolLabel}>{t('draw_brush_size')}</Text>
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
        )}

        {/* Actions */}
        <View style={styles.actionRow}>
          {!pickedImageUri && (
            <>
              <CyberButton
                title={t('draw_undo')}
                onPress={handleUndo}
                color={COLORS.textDim}
                size="medium"
                style={styles.actionBtn}
                disabled={completedPaths.length === 0}
              />
              <CyberButton
                title={t('draw_clear')}
                onPress={handleClear}
                color={COLORS.danger}
                size="medium"
                style={styles.actionBtn}
              />
            </>
          )}
          <CyberButton
            title={t('draw_complete')}
            onPress={handleComplete}
            color={COLORS.success}
            size="medium"
            style={pickedImageUri ? styles.actionBtnFull : styles.actionBtn}
            disabled={completedPaths.length === 0 && !pickedImageUri}
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
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: 2,
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
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: 'rgba(0,0,0,0.2)',
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
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: '600',
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
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
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnFull: {
    flex: 1,
  },
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,255,255,0.15)',
  },
  orText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: 2,
  },
  pickImageBtn: {
    marginBottom: 12,
  },
  clearPickedBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearPickedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
