import { GAME_CONFIG } from '../config/gameConfig';
import { calcSpecialPower } from './specialPower';
import { rollStatusEffect, checkSkipTurn, applyStatusDamage, tickStatusEffects, addStatusEffect, getStatusModifiers } from './statusEffects';
import type { Character, BattleTurnLog, BattleFighterState, BattleResult } from '../types';

/**
 * Initialize a fighter state from a character.
 */
export function initFighter(character: Character): BattleFighterState {
  const maxHp = character.stats.hp * GAME_CONFIG.battle.hpMultiplier;
  const { multiplier } = calcSpecialPower(character.specialMoveName);

  return {
    character,
    currentHp: maxHp,
    maxHp,
    statusEffects: [],
    specialMultiplier: multiplier,
  };
}

/**
 * Determine turn order based on speed (higher SPD goes first).
 * Returns [firstIndex, secondIndex] (0 = player1, 1 = player2).
 */
export function determineTurnOrder(fighters: [BattleFighterState, BattleFighterState]): [number, number] {
  const spd0 = fighters[0].character.stats.spd * getStatusModifiers(fighters[0].statusEffects).spdMod;
  const spd1 = fighters[1].character.stats.spd * getStatusModifiers(fighters[1].statusEffects).spdMod;

  if (spd0 >= spd1) return [0, 1];
  return [1, 0];
}

/**
 * Calculate damage for a single attack.
 */
function calculateDamage(
  attacker: BattleFighterState,
  defender: BattleFighterState,
  isSpecial: boolean
): { damage: number; isCritical: boolean } {
  const cfg = GAME_CONFIG.battle;
  const { atkMod } = getStatusModifiers(attacker.statusEffects);

  let atk = attacker.character.stats.atk * atkMod;
  const def = defender.character.stats.def;

  // Base damage
  let damage = atk * cfg.atkScale - def * cfg.defScale;

  // Special move multiplier
  if (isSpecial) {
    damage *= attacker.specialMultiplier;
  }

  // Damage variance (+-20%)
  const variance = 1 + (Math.random() - 0.5) * cfg.damageVariance;
  damage *= variance;

  // Critical hit check
  const critChance = attacker.character.stats.spd / cfg.critChanceDivisor;
  const isCritical = Math.random() < critChance;
  if (isCritical) {
    damage *= cfg.critMultiplier;
  }

  damage = Math.max(cfg.minDamage, Math.round(damage));

  return { damage, isCritical };
}

/**
 * Execute one fighter's action in a turn.
 */
function executeAction(
  attacker: BattleFighterState,
  defender: BattleFighterState,
  turnNumber: number,
  attackerLabel: 'player1' | 'player2'
): BattleTurnLog {
  // Check for status effect skip
  const skipReason = checkSkipTurn(attacker.statusEffects);
  if (skipReason) {
    return {
      turn: turnNumber,
      attacker: attackerLabel,
      action: 'skip',
      damage: 0,
      isCritical: false,
      isSpecial: false,
      defenderHpAfter: defender.currentHp,
      skippedReason: skipReason,
    };
  }

  // Check if special move triggers
  const specialChance = attacker.character.stats.special / GAME_CONFIG.battle.specialTriggerDiv;
  const isSpecial = Math.random() * 100 < specialChance;

  const { damage, isCritical } = calculateDamage(attacker, defender, isSpecial);

  // Apply damage
  defender.currentHp = Math.max(0, defender.currentHp - damage);

  // Roll for status effect on special moves
  let statusApplied: { id: string; duration: number } | null = null;
  if (isSpecial) {
    const effect = rollStatusEffect();
    if (effect) {
      defender.statusEffects = addStatusEffect(defender.statusEffects, effect);
      statusApplied = effect;
    }
  }

  return {
    turn: turnNumber,
    attacker: attackerLabel,
    action: isSpecial ? 'special' : 'attack',
    damage,
    isCritical,
    isSpecial,
    specialName: isSpecial ? attacker.character.specialMoveName : undefined,
    specialMultiplier: isSpecial ? attacker.specialMultiplier : undefined,
    defenderHpAfter: defender.currentHp,
    statusApplied: statusApplied as any,
  };
}

/**
 * Run a complete battle between two characters.
 * Returns the full battle log (array of turns) for client-side playback.
 */
export function runBattle(
  char1: Character,
  char2: Character,
  battleType: 'random' | 'friend' | 'ai' = 'ai'
): { winnerId: string; turns: BattleTurnLog[] } {
  const fighters: [BattleFighterState, BattleFighterState] = [
    initFighter(char1),
    initFighter(char2),
  ];

  const turns: BattleTurnLog[] = [];
  const maxTurns = 100; // Safety limit
  const labels: ['player1', 'player2'] = ['player1', 'player2'];

  for (let turnNum = 1; turnNum <= maxTurns; turnNum++) {
    const [firstIdx, secondIdx] = determineTurnOrder(fighters);

    // Apply status damage at start of turn for both fighters
    for (let i = 0; i < 2; i++) {
      const statusDmg = applyStatusDamage(fighters[i]);
      if (statusDmg > 0) {
        fighters[i].currentHp = Math.max(0, fighters[i].currentHp - statusDmg);
        // Log status damage as a turn entry
        turns.push({
          turn: turnNum,
          attacker: labels[i],
          action: 'skip',
          damage: 0,
          isCritical: false,
          isSpecial: false,
          defenderHpAfter: fighters[i].currentHp,
          statusDamage: statusDmg,
        });

        if (fighters[i].currentHp <= 0) {
          const winnerId = fighters[1 - i].character.id;
          return { winnerId, turns };
        }
      }
    }

    // First attacker acts
    const firstLog = executeAction(
      fighters[firstIdx],
      fighters[secondIdx],
      turnNum,
      labels[firstIdx]
    );
    turns.push(firstLog);

    if (fighters[secondIdx].currentHp <= 0) {
      return { winnerId: fighters[firstIdx].character.id, turns };
    }

    // Second attacker acts (IMPORTANT: even if first attacker was skipped, second still acts)
    const secondLog = executeAction(
      fighters[secondIdx],
      fighters[firstIdx],
      turnNum,
      labels[secondIdx]
    );
    turns.push(secondLog);

    if (fighters[firstIdx].currentHp <= 0) {
      return { winnerId: fighters[secondIdx].character.id, turns };
    }

    // Tick status effects at end of turn
    fighters[0].statusEffects = tickStatusEffects(fighters[0].statusEffects);
    fighters[1].statusEffects = tickStatusEffects(fighters[1].statusEffects);
  }

  // If max turns reached, fighter with more HP% wins
  const hp1Percent = fighters[0].currentHp / fighters[0].maxHp;
  const hp2Percent = fighters[1].currentHp / fighters[1].maxHp;
  const winnerId = hp1Percent >= hp2Percent ? char1.id : char2.id;

  return { winnerId, turns };
}
