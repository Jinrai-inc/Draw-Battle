// GAME_CONFIG - All game balance constants in one place
export const GAME_CONFIG = {
  stats: {
    minStat: 1,
    maxStat: 99,
    hp: { base: 30, coverageScale: 120, greenScale: 30, randomRange: 15 },
    atk: { base: 20, redScale: 50, coverageScale: 30, randomRange: 15 },
    def: { base: 20, blueScale: 50, simplicityScale: 20, randomRange: 15 },
    spd: { base: 20, complexityScale: 60, emptinessScale: 30, randomRange: 15 },
    special: { base: 30, aspectScale: 20, colorGapScale: 40, randomRange: 20 },
  },
  battle: {
    hpMultiplier: 3,
    atkScale: 1.5,
    defScale: 0.5,
    damageVariance: 0.4,
    critChanceDivisor: 200,
    critMultiplier: 2.0,
    specialTriggerDiv: 3,
    minDamage: 1,
  },
  specialName: {
    maxMultiplier: 3.5,
    baseMultiplier: 1.0,
    scoreDivisor: 50,
    scaleFactor: 1.5,
    densityThreshold: 5,
    densityBonusScale: 3,
    densityBonusMax: 20,
    penaltyStartLen: 10,
    penaltyPerChar: 4,
    fillerPenalty: 2,
    katakanaBonus: 5,
    englishBonus: 3,
    numberBonus: 2,
  },
  // Power Kanji dictionary - kanji characters with power scores
  powerKanji: {
    '龍': 9, '神': 9, '滅': 8, '斬': 8, '魔': 8, '覇': 8, '帝': 8,
    '天': 7, '闇': 7, '焔': 7, '雷': 7, '鬼': 7, '獄': 7, '煌': 7,
    '刃': 6, '牙': 6, '翼': 6, '蒼': 6, '紅': 6, '零': 6, '聖': 6,
    '撃': 6, '弾': 5, '拳': 5, '破': 5, '裂': 5, '爆': 5, '衝': 5,
    '閃': 5, '旋': 5, '嵐': 5, '轟': 5, '極': 5, '絶': 5, '獣': 5,
    '剣': 5, '槍': 5, '砲': 5, '甲': 4, '盾': 4, '壁': 4, '鎖': 4,
    '炎': 4, '氷': 4, '風': 4, '光': 4, '影': 4, '月': 4, '星': 4,
    '銀': 4, '金': 4, '鉄': 4, '鋼': 4, '血': 4, '魂': 4, '命': 4,
    '死': 3, '生': 3, '夜': 3, '日': 3, '空': 3, '海': 3, '地': 3,
  } as Record<string, number>,
  // Power word dictionary - compound words with power scores
  powerWords: {
    '秘奥義': 6, '奥義': 5, '必殺': 5, '究極': 5, '最終': 4,
    '超絶': 4, '無限': 4, '絶対': 4, '暗黒': 4, '真紅': 3,
    '蒼穹': 3, '深淵': 3,
  } as Record<string, number>,
  elements: [
    { id: 'fire', name: '炎', color: '#FF4444' },
    { id: 'water', name: '水', color: '#4488FF' },
    { id: 'wind', name: '風', color: '#00FF88' },
    { id: 'thunder', name: '雷', color: '#FFDD00' },
    { id: 'dark', name: '闇', color: '#AA44FF' },
  ],
  statusEffects: {
    poison: { id: 'poison', name: '毒', label: '◇PSN', color: '#AA44FF', damagePercent: 8, duration: 3 },
    sleep: { id: 'sleep', name: '眠り', label: '◇SLP', color: '#4488FF', skipTurn: true, duration: 2 },
    paralyze: { id: 'paralyze', name: '痺れ', label: '◇PAR', color: '#FFDD00', skipChance: 50, duration: 3 },
    burn: { id: 'burn', name: '火傷', label: '◇BRN', color: '#FF4444', damagePercent: 5, atkReduction: 20, duration: 3 },
    freeze: { id: 'freeze', name: '凍結', label: '◇FRZ', color: '#88DDFF', spdReduction: 50, duration: 2 },
  },
  rarityThresholds: [
    { id: 'C', name: 'C', color: '#888888', minTotal: 0 },
    { id: 'UC', name: 'UC', color: '#00FF88', minTotal: 150 },
    { id: 'R', name: 'R', color: '#00FFFF', minTotal: 220 },
    { id: 'SR', name: 'SR', color: '#AA44FF', minTotal: 300 },
    { id: 'SSR', name: 'SSR', color: '#FFD700', minTotal: 380 },
    { id: 'UR', name: 'UR', color: '#FF69B4', minTotal: 450 },
  ],
  equipment: {
    dropChance: 0.35, // 35% chance to drop equipment after battle win
    rarityWeights: {
      normal: 0.65,
      rare: 0.28,
      epic: 0.07,
    },
    slots: ['weapon', 'armor', 'accessory'] as const,
    slotLabels: {
      weapon: { icon: '\u25B7', label: 'WEAPON', color: '#FF4444', statPool: ['atk', 'special'] as const },
      armor: { icon: '\u25A1', label: 'ARMOR', color: '#4488FF', statPool: ['hp', 'def'] as const },
      accessory: { icon: '\u25C7', label: 'ACCESSORY', color: '#FF00FF', statPool: ['spd', 'special'] as const },
    },
    bonusRange: {
      normal: { min: 3, max: 8 },
      rare: { min: 7, max: 15 },
      epic: { min: 13, max: 25 },
    },
    rarityColors: {
      normal: '#888888',
      rare: '#00FFFF',
      epic: '#FFD700',
    },
    namePool: {
      weapon: {
        prefix: ['サイバー', 'ネオン', '量子', 'プラズマ', '暗黒', '聖なる', '紅蓮の', '蒼穹の'],
        base: ['ブレード', 'キャノン', 'ランス', 'アーム', 'エッジ', 'ロッド', 'ファング'],
      },
      armor: {
        prefix: ['サイバー', 'ネオン', '量子', 'プラズマ', '暗黒', '聖なる', '紅蓮の', '蒼穹の'],
        base: ['アーマー', 'シールド', 'プレート', 'コート', 'バリア', 'ガード', 'ヴェール'],
      },
      accessory: {
        prefix: ['サイバー', 'ネオン', '量子', 'プラズマ', '暗黒', '聖なる', '紅蓮の', '蒼穹の'],
        base: ['リング', 'アミュレット', 'チップ', 'コア', 'オーブ', 'クリスタル', 'サークレット'],
      },
    },
  },
  growth: {
    expPerWin: 100,
    expPerLoss: 30,
    maxLevel: 50,
    statGainPerLevel: { hp: 1.0, atk: 0.7, def: 0.7, spd: 0.5, special: 0.5 },
    evolveRequiredBattles: 30,
    evolveStatBonus: 8,
  },
  // Level-up EXP curve: expForLevel(n) = n * 100
  expForLevel: (level: number) => level * 100,
} as const;

// Color palette
export const COLORS = {
  background: '#050510',
  backgroundCard: '#0a1628',
  primary: '#00FFFF',
  secondary: '#FF00FF',
  danger: '#FF4444',
  success: '#00FF88',
  text: '#E0E8FF',
  textDim: 'rgba(10, 255, 255, 0.5)',
  warning: '#FFDD00',
  white: '#FFFFFF',
  black: '#000000',
  grid: 'rgba(0, 255, 255, 0.03)',
  scanline: 'rgba(0, 255, 255, 0.015)',
} as const;

// Font families
export const FONTS = {
  heading: 'Orbitron',
  body: 'Rajdhani',
  mono: 'Orbitron',
} as const;
