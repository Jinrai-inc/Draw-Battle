import { checkSkipTurn, applyStatusDamage, tickStatusEffects, addStatusEffect, getStatusModifiers } from '../statusEffects';
import type { BattleFighterState, ActiveStatusEffect } from '../../types';

describe('checkSkipTurn', () => {
  test('sleep always causes skip', () => {
    const effects: ActiveStatusEffect[] = [{ id: 'sleep', remainingTurns: 2 }];
    const result = checkSkipTurn(effects);
    expect(result).not.toBeNull();
    expect(result).toContain('SLP');
  });

  test('no effects means no skip', () => {
    const result = checkSkipTurn([]);
    expect(result).toBeNull();
  });

  test('poison does not cause skip', () => {
    const effects: ActiveStatusEffect[] = [{ id: 'poison', remainingTurns: 3 }];
    const result = checkSkipTurn(effects);
    expect(result).toBeNull();
  });
});

describe('applyStatusDamage', () => {
  test('poison deals damage based on max HP', () => {
    const fighter: BattleFighterState = {
      character: {} as any,
      currentHp: 100,
      maxHp: 100,
      statusEffects: [{ id: 'poison', remainingTurns: 3 }],
      specialMultiplier: 1.5,
    };
    const damage = applyStatusDamage(fighter);
    expect(damage).toBe(8); // 8% of 100
  });

  test('burn deals damage', () => {
    const fighter: BattleFighterState = {
      character: {} as any,
      currentHp: 200,
      maxHp: 200,
      statusEffects: [{ id: 'burn', remainingTurns: 2 }],
      specialMultiplier: 1.5,
    };
    const damage = applyStatusDamage(fighter);
    expect(damage).toBe(10); // 5% of 200
  });

  test('no damage from non-damage effects', () => {
    const fighter: BattleFighterState = {
      character: {} as any,
      currentHp: 100,
      maxHp: 100,
      statusEffects: [{ id: 'sleep', remainingTurns: 2 }],
      specialMultiplier: 1.5,
    };
    const damage = applyStatusDamage(fighter);
    expect(damage).toBe(0);
  });
});

describe('tickStatusEffects', () => {
  test('decrements remaining turns', () => {
    const effects: ActiveStatusEffect[] = [
      { id: 'poison', remainingTurns: 3 },
      { id: 'sleep', remainingTurns: 1 },
    ];
    const result = tickStatusEffects(effects);
    expect(result).toHaveLength(1); // sleep should be removed (0 turns left)
    expect(result[0].id).toBe('poison');
    expect(result[0].remainingTurns).toBe(2);
  });

  test('removes expired effects', () => {
    const effects: ActiveStatusEffect[] = [{ id: 'freeze', remainingTurns: 1 }];
    const result = tickStatusEffects(effects);
    expect(result).toHaveLength(0);
  });
});

describe('addStatusEffect', () => {
  test('adds new effect', () => {
    const effects: ActiveStatusEffect[] = [];
    const result = addStatusEffect(effects, { id: 'poison', duration: 3 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('poison');
    expect(result[0].remainingTurns).toBe(3);
  });

  test('refreshes existing effect', () => {
    const effects: ActiveStatusEffect[] = [{ id: 'poison', remainingTurns: 1 }];
    const result = addStatusEffect(effects, { id: 'poison', duration: 3 });
    expect(result).toHaveLength(1);
    expect(result[0].remainingTurns).toBe(3);
  });
});

describe('getStatusModifiers', () => {
  test('burn reduces ATK', () => {
    const effects: ActiveStatusEffect[] = [{ id: 'burn', remainingTurns: 2 }];
    const { atkMod, spdMod } = getStatusModifiers(effects);
    expect(atkMod).toBe(0.8); // 20% reduction
    expect(spdMod).toBe(1.0);
  });

  test('freeze reduces SPD', () => {
    const effects: ActiveStatusEffect[] = [{ id: 'freeze', remainingTurns: 2 }];
    const { atkMod, spdMod } = getStatusModifiers(effects);
    expect(atkMod).toBe(1.0);
    expect(spdMod).toBe(0.5); // 50% reduction
  });

  test('no effects = no modifiers', () => {
    const { atkMod, spdMod } = getStatusModifiers([]);
    expect(atkMod).toBe(1.0);
    expect(spdMod).toBe(1.0);
  });
});
