import { runBattle, initFighter, determineTurnOrder } from '../battleEngine';
import type { Character } from '../../types';

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char-1',
    userId: 'user-1',
    imageUrl: 'test.png',
    specialMoveName: '龍撃',
    stats: { hp: 50, atk: 40, def: 30, spd: 35, special: 40, totalStats: 195 },
    element: 'fire',
    rarity: 'R',
    level: 1,
    exp: 0,
    battleCount: 0,
    isEvolved: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('initFighter', () => {
  test('initializes HP correctly with multiplier', () => {
    const char = makeCharacter();
    const fighter = initFighter(char);
    expect(fighter.maxHp).toBe(char.stats.hp * 3); // hpMultiplier = 3
    expect(fighter.currentHp).toBe(fighter.maxHp);
    expect(fighter.statusEffects).toEqual([]);
  });
});

describe('determineTurnOrder', () => {
  test('faster character goes first', () => {
    const fast = initFighter(makeCharacter({
      id: 'fast',
      stats: { hp: 50, atk: 40, def: 30, spd: 80, special: 40, totalStats: 240 },
    }));
    const slow = initFighter(makeCharacter({
      id: 'slow',
      stats: { hp: 50, atk: 40, def: 30, spd: 20, special: 40, totalStats: 180 },
    }));

    const [firstIdx] = determineTurnOrder([fast, slow]);
    expect(firstIdx).toBe(0); // fast is index 0
  });
});

describe('runBattle', () => {
  test('produces a winner', () => {
    const char1 = makeCharacter({ id: 'p1', userId: 'u1' });
    const char2 = makeCharacter({
      id: 'p2',
      userId: 'u2',
      specialMoveName: '氷結斬',
      stats: { hp: 45, atk: 35, def: 35, spd: 30, special: 35, totalStats: 180 },
    });

    const result = runBattle(char1, char2);
    expect(result.winnerId).toBeDefined();
    expect(['p1', 'p2']).toContain(result.winnerId);
    expect(result.turns.length).toBeGreaterThan(0);
  });

  test('battle ends when HP reaches 0', () => {
    const char1 = makeCharacter({
      id: 'strong',
      stats: { hp: 99, atk: 99, def: 50, spd: 99, special: 50, totalStats: 397 },
    });
    const char2 = makeCharacter({
      id: 'weak',
      stats: { hp: 1, atk: 1, def: 1, spd: 1, special: 1, totalStats: 5 },
    });

    const result = runBattle(char1, char2);
    expect(result.winnerId).toBe('strong');

    // Last turn should have defenderHpAfter = 0
    const lastDamageTurn = result.turns.filter(t => t.damage > 0).pop();
    expect(lastDamageTurn?.defenderHpAfter).toBe(0);
  });

  test('turns have valid structure', () => {
    const char1 = makeCharacter({ id: 'a' });
    const char2 = makeCharacter({ id: 'b' });

    const result = runBattle(char1, char2);
    for (const turn of result.turns) {
      expect(turn.turn).toBeGreaterThan(0);
      expect(['player1', 'player2']).toContain(turn.attacker);
      expect(['attack', 'special', 'skip']).toContain(turn.action);
      expect(turn.damage).toBeGreaterThanOrEqual(0);
      expect(typeof turn.isCritical).toBe('boolean');
      expect(typeof turn.isSpecial).toBe('boolean');
      expect(turn.defenderHpAfter).toBeGreaterThanOrEqual(0);
    }
  });

  test('does not exceed max turns', () => {
    // Two tanks with high DEF and low ATK
    const char1 = makeCharacter({
      id: 't1',
      stats: { hp: 99, atk: 1, def: 99, spd: 1, special: 1, totalStats: 201 },
    });
    const char2 = makeCharacter({
      id: 't2',
      stats: { hp: 99, atk: 1, def: 99, spd: 1, special: 1, totalStats: 201 },
    });

    const result = runBattle(char1, char2);
    // Should still produce a winner within 100 turns
    expect(result.winnerId).toBeDefined();
  });
});
