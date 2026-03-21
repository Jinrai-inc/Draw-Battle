import { supabase } from './supabase';
import type { BattleResult } from '../types';

/**
 * Request a battle calculation from the server.
 * For MVP, battles are calculated client-side.
 * This will call the Edge Function when online.
 */
export async function requestBattle(
  player1CharId: string,
  player2CharId: string,
  battleType: string = 'ai'
): Promise<BattleResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke('battle-calculate', {
      body: {
        player1_char_id: player1CharId,
        player2_char_id: player2CharId,
        battle_type: battleType,
      },
    });

    if (error) {
      console.error('Battle request error:', error);
      return null;
    }

    return {
      battleId: data.battle_id,
      winnerId: data.winner_id,
      turns: data.turns.map((t: any) => ({
        turn: t.turn,
        attacker: t.attacker,
        action: t.action,
        damage: t.damage,
        isCritical: t.is_critical,
        isSpecial: t.is_special,
        specialName: t.special_name,
        specialMultiplier: t.special_multiplier,
        defenderHpAfter: t.defender_hp_after,
        statusApplied: t.status_applied,
        statusDamage: t.status_damage,
        skippedReason: t.skipped_reason,
      })),
      rewards: data.rewards,
    };
  } catch (err) {
    console.error('Battle service error:', err);
    return null;
  }
}

/**
 * Get battle history for a user.
 */
export async function getBattleHistory(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}
