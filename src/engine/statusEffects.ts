import { GAME_CONFIG } from '../config/gameConfig';
import type { StatusEffectId, ActiveStatusEffect, BattleFighterState } from '../types';

/**
 * Roll for a random status effect to apply on special moves.
 * Returns null if no effect triggered.
 */
export function rollStatusEffect(): { id: StatusEffectId; duration: number } | null {
  // 30% chance to apply a status effect on special moves
  if (Math.random() > 0.3) return null;

  const effects = Object.values(GAME_CONFIG.statusEffects);
  const chosen = effects[Math.floor(Math.random() * effects.length)];

  return { id: chosen.id as StatusEffectId, duration: chosen.duration };
}

/**
 * Check if a fighter should skip their turn due to status effects.
 * Returns the reason string if skipped, null if they can act.
 */
export function checkSkipTurn(statusEffects: ActiveStatusEffect[]): string | null {
  for (const effect of statusEffects) {
    const def = GAME_CONFIG.statusEffects[effect.id] as Record<string, any>;
    if (!def) continue;

    // Sleep: always skip
    if (effect.id === 'sleep' && def.skipTurn) {
      return `${def.label} ${def.name}で動けない!`;
    }

    // Paralyze: chance to skip
    if (effect.id === 'paralyze' && def.skipChance) {
      if (Math.random() * 100 < def.skipChance) {
        return `${def.label} ${def.name}で動けない!`;
      }
    }

    // Freeze: reduced speed (not a skip, handled in damage calc)
  }

  return null;
}

/**
 * Apply status effect damage at start of turn (poison, burn).
 * Returns the damage dealt, or 0 if no damage.
 */
export function applyStatusDamage(fighter: BattleFighterState): number {
  let totalDamage = 0;

  for (const effect of fighter.statusEffects) {
    const def = GAME_CONFIG.statusEffects[effect.id];
    if (!def) continue;

    if ('damagePercent' in def && def.damagePercent) {
      const damage = Math.max(1, Math.floor(fighter.maxHp * def.damagePercent / 100));
      totalDamage += damage;
    }
  }

  return totalDamage;
}

/**
 * Tick down status effect durations. Removes expired effects.
 */
export function tickStatusEffects(effects: ActiveStatusEffect[]): ActiveStatusEffect[] {
  return effects
    .map(e => ({ ...e, remainingTurns: e.remainingTurns - 1 }))
    .filter(e => e.remainingTurns > 0);
}

/**
 * Apply a new status effect to a fighter.
 * If the same effect already exists, refresh duration.
 */
export function addStatusEffect(
  effects: ActiveStatusEffect[],
  newEffect: { id: StatusEffectId; duration: number }
): ActiveStatusEffect[] {
  const existing = effects.filter(e => e.id !== newEffect.id);
  return [...existing, { id: newEffect.id, remainingTurns: newEffect.duration }];
}

/**
 * Get stat modifiers from active status effects.
 */
export function getStatusModifiers(effects: ActiveStatusEffect[]): { atkMod: number; spdMod: number } {
  let atkMod = 1.0;
  let spdMod = 1.0;

  for (const effect of effects) {
    const def = GAME_CONFIG.statusEffects[effect.id];
    if (!def) continue;

    if ('atkReduction' in def && def.atkReduction) {
      atkMod *= (100 - def.atkReduction) / 100;
    }
    if ('spdReduction' in def && def.spdReduction) {
      spdMod *= (100 - def.spdReduction) / 100;
    }
  }

  return { atkMod, spdMod };
}
