import { GAME_CONFIG } from '../config/gameConfig';
import type { SpecialPowerResult } from '../types';

/**
 * Calculate special move power from the move name.
 * Power is based on "density" - powerful kanji/words packed into fewer characters.
 * Short names with power kanji = high power.
 * Long names with filler = low power.
 */
export function calcSpecialPower(name: string): SpecialPowerResult {
  if (!name || name.trim().length === 0) {
    return { multiplier: GAME_CONFIG.specialName.baseMultiplier, rank: 'D', totalScore: 0 };
  }

  const cfg = GAME_CONFIG.specialName;
  let totalScore = 0;
  let scoredChars = 0;

  // Check for power words (compound matches first)
  let remaining = name;
  for (const [word, score] of Object.entries(GAME_CONFIG.powerWords)) {
    while (remaining.includes(word)) {
      totalScore += score;
      scoredChars += word.length;
      remaining = remaining.replace(word, '');
    }
  }

  // Check individual kanji
  for (const char of remaining) {
    const kanjiScore = GAME_CONFIG.powerKanji[char];
    if (kanjiScore) {
      totalScore += kanjiScore;
      scoredChars++;
    } else if (/[\u30A0-\u30FF]/.test(char)) {
      // Katakana bonus
      totalScore += cfg.katakanaBonus;
      scoredChars++;
    } else if (/[A-Za-z]/.test(char)) {
      // English bonus
      totalScore += cfg.englishBonus;
      scoredChars++;
    } else if (/[0-9]/.test(char)) {
      // Number bonus
      totalScore += cfg.numberBonus;
      scoredChars++;
    }
  }

  const nameLen = name.length;
  const fillerCount = nameLen - scoredChars;

  // Filler penalty
  totalScore -= fillerCount * cfg.fillerPenalty;

  // Length penalty for names longer than threshold
  if (nameLen > cfg.penaltyStartLen) {
    totalScore -= (nameLen - cfg.penaltyStartLen) * cfg.penaltyPerChar;
  }

  // Density bonus: high score per character
  const density = nameLen > 0 ? totalScore / nameLen : 0;
  if (density >= cfg.densityThreshold) {
    totalScore += Math.min(
      (density - cfg.densityThreshold) * cfg.densityBonusScale,
      cfg.densityBonusMax
    );
  }

  totalScore = Math.max(0, totalScore);

  // Calculate multiplier
  const multiplier = Math.min(
    cfg.baseMultiplier + (totalScore / cfg.scoreDivisor) * cfg.scaleFactor,
    cfg.maxMultiplier
  );

  // Determine rank
  const rank = getRank(multiplier);

  return { multiplier, rank, totalScore };
}

function getRank(multiplier: number): string {
  if (multiplier >= 3.2) return 'SSS';
  if (multiplier >= 2.8) return 'SS';
  if (multiplier >= 2.4) return 'S';
  if (multiplier >= 2.0) return 'A';
  if (multiplier >= 1.6) return 'B';
  if (multiplier >= 1.2) return 'C';
  return 'D';
}
