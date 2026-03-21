import { analyzeDrawing, generateStats, determineElement, determineRarity, generateRandomEnemy } from '../drawingAnalyzer';

describe('analyzeDrawing', () => {
  test('empty canvas returns zero coverage', () => {
    const width = 10;
    const height = 10;
    const data = new Uint8Array(width * height * 4); // All zeros = transparent
    const result = analyzeDrawing(data, width, height);
    expect(result.coverage).toBe(0);
    expect(result.emptiness).toBe(1);
  });

  test('fully filled red canvas returns high red ratio', () => {
    const width = 10;
    const height = 10;
    const data = new Uint8Array(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;     // R
      data[i + 1] = 0;   // G
      data[i + 2] = 0;   // B
      data[i + 3] = 255; // A
    }
    const result = analyzeDrawing(data, width, height);
    expect(result.coverage).toBe(1);
    expect(result.redRatio).toBe(1);
    expect(result.greenRatio).toBe(0);
    expect(result.blueRatio).toBe(0);
  });

  test('coverage is between 0 and 1', () => {
    const width = 10;
    const height = 10;
    const data = new Uint8Array(width * height * 4);
    // Fill half the pixels
    for (let i = 0; i < data.length / 2; i += 4) {
      data[i] = 128;
      data[i + 1] = 128;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
    const result = analyzeDrawing(data, width, height);
    expect(result.coverage).toBeGreaterThan(0);
    expect(result.coverage).toBeLessThanOrEqual(1);
  });
});

describe('generateStats', () => {
  test('stats are within valid range', () => {
    const analysis = {
      coverage: 0.5,
      redRatio: 0.4,
      greenRatio: 0.3,
      blueRatio: 0.3,
      complexity: 0.5,
      simplicity: 0.5,
      emptiness: 0.5,
      aspectRatio: 1.0,
      colorGap: 50,
    };
    const stats = generateStats(analysis);
    expect(stats.hp).toBeGreaterThanOrEqual(1);
    expect(stats.hp).toBeLessThanOrEqual(99);
    expect(stats.atk).toBeGreaterThanOrEqual(1);
    expect(stats.atk).toBeLessThanOrEqual(99);
    expect(stats.def).toBeGreaterThanOrEqual(1);
    expect(stats.def).toBeLessThanOrEqual(99);
    expect(stats.spd).toBeGreaterThanOrEqual(1);
    expect(stats.spd).toBeLessThanOrEqual(99);
    expect(stats.special).toBeGreaterThanOrEqual(1);
    expect(stats.special).toBeLessThanOrEqual(99);
  });

  test('totalStats is sum of all stats', () => {
    const analysis = {
      coverage: 0.6,
      redRatio: 0.5,
      greenRatio: 0.2,
      blueRatio: 0.3,
      complexity: 0.4,
      simplicity: 0.6,
      emptiness: 0.4,
      aspectRatio: 1.0,
      colorGap: 80,
    };
    const stats = generateStats(analysis);
    expect(stats.totalStats).toBe(stats.hp + stats.atk + stats.def + stats.spd + stats.special);
  });

  test('high red ratio produces higher ATK', () => {
    const redAnalysis = {
      coverage: 0.5, redRatio: 0.9, greenRatio: 0.05, blueRatio: 0.05,
      complexity: 0.5, simplicity: 0.5, emptiness: 0.5, aspectRatio: 1, colorGap: 200,
    };
    const blueAnalysis = {
      coverage: 0.5, redRatio: 0.05, greenRatio: 0.05, blueRatio: 0.9,
      complexity: 0.5, simplicity: 0.5, emptiness: 0.5, aspectRatio: 1, colorGap: 200,
    };
    // Test over multiple runs to account for randomness
    let redAtkTotal = 0;
    let blueAtkTotal = 0;
    for (let i = 0; i < 100; i++) {
      redAtkTotal += generateStats(redAnalysis).atk;
      blueAtkTotal += generateStats(blueAnalysis).atk;
    }
    expect(redAtkTotal / 100).toBeGreaterThan(blueAtkTotal / 100);
  });
});

describe('determineElement', () => {
  test('high red ratio returns fire', () => {
    expect(determineElement({
      coverage: 0.5, redRatio: 0.7, greenRatio: 0.15, blueRatio: 0.15,
      complexity: 0.5, simplicity: 0.5, emptiness: 0.5, aspectRatio: 1, colorGap: 100,
    })).toBe('fire');
  });

  test('high blue ratio returns water', () => {
    expect(determineElement({
      coverage: 0.5, redRatio: 0.1, greenRatio: 0.1, blueRatio: 0.8,
      complexity: 0.5, simplicity: 0.5, emptiness: 0.5, aspectRatio: 1, colorGap: 100,
    })).toBe('water');
  });

  test('high green ratio returns wind', () => {
    expect(determineElement({
      coverage: 0.5, redRatio: 0.1, greenRatio: 0.8, blueRatio: 0.1,
      complexity: 0.5, simplicity: 0.5, emptiness: 0.5, aspectRatio: 1, colorGap: 100,
    })).toBe('wind');
  });

  test('low color gap returns dark', () => {
    expect(determineElement({
      coverage: 0.5, redRatio: 0.33, greenRatio: 0.33, blueRatio: 0.34,
      complexity: 0.5, simplicity: 0.5, emptiness: 0.5, aspectRatio: 1, colorGap: 5,
    })).toBe('dark');
  });
});

describe('determineRarity', () => {
  test('low total gives C rarity', () => {
    expect(determineRarity(100)).toBe('C');
  });

  test('medium total gives UC rarity', () => {
    expect(determineRarity(160)).toBe('UC');
  });

  test('high total gives SSR rarity', () => {
    expect(determineRarity(400)).toBe('SSR');
  });
});

describe('generateRandomEnemy', () => {
  test('stats are within valid range', () => {
    const enemy = generateRandomEnemy(200);
    expect(enemy.hp).toBeGreaterThanOrEqual(1);
    expect(enemy.hp).toBeLessThanOrEqual(99);
    expect(enemy.atk).toBeGreaterThanOrEqual(1);
    expect(enemy.atk).toBeLessThanOrEqual(99);
  });

  test('totalStats is sum of all stats', () => {
    const enemy = generateRandomEnemy();
    expect(enemy.totalStats).toBe(enemy.hp + enemy.atk + enemy.def + enemy.spd + enemy.special);
  });
});
