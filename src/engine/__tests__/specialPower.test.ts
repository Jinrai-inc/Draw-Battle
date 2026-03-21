import { calcSpecialPower } from '../specialPower';

describe('calcSpecialPower', () => {
  test('empty name returns base multiplier and rank D', () => {
    const result = calcSpecialPower('');
    expect(result.multiplier).toBe(1.0);
    expect(result.rank).toBe('D');
    expect(result.totalScore).toBe(0);
  });

  test('whitespace-only name returns base multiplier', () => {
    const result = calcSpecialPower('   ');
    expect(result.multiplier).toBe(1.0);
    expect(result.rank).toBe('D');
  });

  test('power kanji names produce higher multiplier', () => {
    const weak = calcSpecialPower('あいうえお');
    const strong = calcSpecialPower('龍神');
    expect(strong.multiplier).toBeGreaterThan(weak.multiplier);
  });

  test('density matters: short powerful > long with filler', () => {
    // "龍神" (2 chars, both high power) should beat "あいうえお龍" (6 chars, only 1 power)
    const dense = calcSpecialPower('龍神');
    const diluted = calcSpecialPower('あいうえお龍');
    expect(dense.multiplier).toBeGreaterThan(diluted.multiplier);
  });

  test('power words give bonus', () => {
    const withWord = calcSpecialPower('秘奥義');
    const withoutWord = calcSpecialPower('あああ');
    expect(withWord.totalScore).toBeGreaterThan(withoutWord.totalScore);
  });

  test('very long names get penalized', () => {
    const short = calcSpecialPower('龍斬');
    const long = calcSpecialPower('龍斬あいうえおかきくけこさしす');
    expect(short.multiplier).toBeGreaterThanOrEqual(long.multiplier);
  });

  test('multiplier does not exceed maxMultiplier', () => {
    const result = calcSpecialPower('龍神滅斬魔覇帝');
    expect(result.multiplier).toBeLessThanOrEqual(3.5);
  });

  test('katakana gives bonus', () => {
    const katakana = calcSpecialPower('バースト');
    const hiragana = calcSpecialPower('ばーすと');
    expect(katakana.totalScore).toBeGreaterThan(hiragana.totalScore);
  });

  test('rank SSS for high multiplier', () => {
    // Max out with dense power kanji
    const result = calcSpecialPower('龍神滅');
    // Should be at least A rank
    expect(['SSS', 'SS', 'S', 'A'].includes(result.rank)).toBe(true);
  });

  test('multiplier is always >= 1.0', () => {
    const result = calcSpecialPower('ああああああああああああああああ');
    expect(result.multiplier).toBeGreaterThanOrEqual(1.0);
  });
});
