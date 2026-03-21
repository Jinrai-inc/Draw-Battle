import { GAME_CONFIG } from '../config/gameConfig';
import type { DrawingAnalysis, CharacterStats, ElementId, RarityId } from '../types';

/**
 * Analyze pixel data from a canvas to extract drawing properties.
 * pixelData is a Uint8Array of RGBA values (4 bytes per pixel).
 */
export function analyzeDrawing(pixelData: Uint8Array, width: number, height: number): DrawingAnalysis {
  let totalPixels = width * height;
  let filledPixels = 0;
  let totalR = 0, totalG = 0, totalB = 0;
  let coloredPixelCount = 0;

  // Edge detection for complexity
  let edgeCount = 0;
  const threshold = 30;

  for (let i = 0; i < pixelData.length; i += 4) {
    const r = pixelData[i];
    const g = pixelData[i + 1];
    const b = pixelData[i + 2];
    const a = pixelData[i + 3];

    if (a > 10) {
      filledPixels++;
      totalR += r;
      totalG += g;
      totalB += b;
      coloredPixelCount++;
    }

    // Simple edge detection: compare with right neighbor
    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    if (x < width - 1) {
      const nr = pixelData[i + 4];
      const ng = pixelData[i + 5];
      const nb = pixelData[i + 6];
      const diff = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
      if (diff > threshold) edgeCount++;
    }
  }

  const coverage = filledPixels / totalPixels;
  const avgR = coloredPixelCount > 0 ? totalR / coloredPixelCount : 0;
  const avgG = coloredPixelCount > 0 ? totalG / coloredPixelCount : 0;
  const avgB = coloredPixelCount > 0 ? totalB / coloredPixelCount : 0;
  const colorTotal = avgR + avgG + avgB || 1;

  const complexity = Math.min(edgeCount / totalPixels * 10, 1);

  return {
    coverage: Math.min(coverage, 1),
    redRatio: avgR / colorTotal,
    greenRatio: avgG / colorTotal,
    blueRatio: avgB / colorTotal,
    complexity,
    simplicity: 1 - complexity,
    emptiness: 1 - Math.min(coverage, 1),
    aspectRatio: width / height,
    colorGap: Math.max(avgR, avgG, avgB) - Math.min(avgR, avgG, avgB),
  };
}

/**
 * Generate character stats from drawing analysis.
 */
export function generateStats(analysis: DrawingAnalysis): CharacterStats {
  const cfg = GAME_CONFIG.stats;
  const clamp = (v: number) => Math.max(cfg.minStat, Math.min(cfg.maxStat, Math.round(v)));
  const rand = (range: number) => Math.floor(Math.random() * range) - Math.floor(range / 2);

  const hp = clamp(cfg.hp.base + analysis.coverage * cfg.hp.coverageScale + analysis.greenRatio * cfg.hp.greenScale + rand(cfg.hp.randomRange));
  const atk = clamp(cfg.atk.base + analysis.redRatio * cfg.atk.redScale + analysis.coverage * cfg.atk.coverageScale + rand(cfg.atk.randomRange));
  const def = clamp(cfg.def.base + analysis.blueRatio * cfg.def.blueScale + analysis.simplicity * cfg.def.simplicityScale + rand(cfg.def.randomRange));
  const spd = clamp(cfg.spd.base + analysis.complexity * cfg.spd.complexityScale + analysis.emptiness * cfg.spd.emptinessScale + rand(cfg.spd.randomRange));
  const special = clamp(cfg.special.base + analysis.aspectRatio * cfg.special.aspectScale + (analysis.colorGap / 255) * cfg.special.colorGapScale + rand(cfg.special.randomRange));

  const totalStats = hp + atk + def + spd + special;

  return { hp, atk, def, spd, special, totalStats };
}

/**
 * Determine element based on dominant color in drawing analysis.
 */
export function determineElement(analysis: DrawingAnalysis): ElementId {
  const { redRatio, greenRatio, blueRatio, colorGap } = analysis;

  // If very dark/low color gap -> dark element
  if (colorGap < 20) return 'dark';

  // Dominant color determines element
  if (redRatio > greenRatio && redRatio > blueRatio) return 'fire';
  if (blueRatio > redRatio && blueRatio > greenRatio) return 'water';
  if (greenRatio > redRatio && greenRatio > blueRatio) return 'wind';

  // Yellow-ish (red + green dominant) -> thunder
  if (redRatio > 0.3 && greenRatio > 0.3) return 'thunder';

  return 'dark';
}

/**
 * Determine rarity based on total stats.
 */
export function determineRarity(totalStats: number): RarityId {
  const thresholds = [...GAME_CONFIG.rarityThresholds].reverse();
  for (const t of thresholds) {
    if (totalStats >= t.minTotal && t.id !== 'UR') {
      return t.id as RarityId;
    }
  }
  return 'C';
}

/**
 * Generate a random enemy for AI battles.
 * Returns random stats within a difficulty range.
 */
export function generateRandomEnemy(targetTotalStats?: number): CharacterStats {
  const cfg = GAME_CONFIG.stats;
  const target = targetTotalStats || 150 + Math.floor(Math.random() * 200);
  const avg = target / 5;

  const randomize = (base: number) => {
    const v = base + (Math.random() - 0.5) * 30;
    return Math.max(cfg.minStat, Math.min(cfg.maxStat, Math.round(v)));
  };

  const hp = randomize(avg * 1.2);
  const atk = randomize(avg);
  const def = randomize(avg);
  const spd = randomize(avg * 0.9);
  const special = randomize(avg * 0.9);
  const totalStats = hp + atk + def + spd + special;

  return { hp, atk, def, spd, special, totalStats };
}
