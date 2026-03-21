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
 * Join matchmaking queue. Returns immediately if a match is found,
 * otherwise adds the user to the queue.
 */
export async function joinMatchmaking(
  userId: string,
  characterId: string
): Promise<{ matched: boolean; opponentUserId?: string; opponentCharacterId?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('matchmaking', {
      body: {
        user_id: userId,
        character_id: characterId,
        action: 'join',
      },
    });

    if (error) {
      console.error('Matchmaking join error:', error);
      return { matched: false };
    }

    return {
      matched: data.matched,
      opponentUserId: data.opponent_user_id,
      opponentCharacterId: data.opponent_character_id,
    };
  } catch (err) {
    console.error('Matchmaking service error:', err);
    return { matched: false };
  }
}

/**
 * Leave matchmaking queue.
 */
export async function leaveMatchmaking(userId: string): Promise<void> {
  try {
    await supabase.functions.invoke('matchmaking', {
      body: {
        user_id: userId,
        action: 'leave',
      },
    });
  } catch (err) {
    console.error('Matchmaking leave error:', err);
  }
}

/**
 * Subscribe to matchmaking queue changes to detect when paired.
 * Returns an unsubscribe function.
 */
export function subscribeToMatchmaking(
  userId: string,
  onMatch: (opponentUserId: string, opponentCharacterId: string) => void
): () => void {
  const channel = supabase
    .channel(`matchmaking:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'matchmaking_queue',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        // Our entry was deleted = we got matched
        // Poll for the battle that was created
        checkForPendingBattle(userId).then(result => {
          if (result) {
            onMatch(result.opponentUserId, result.opponentCharacterId);
          }
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

async function checkForPendingBattle(userId: string) {
  const { data } = await supabase
    .from('battles')
    .select('*')
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const battle = data[0];
    const opponentUserId = battle.player1_id === userId ? battle.player2_id : battle.player1_id;
    const opponentCharacterId = battle.player1_id === userId ? battle.player2_char_id : battle.player1_char_id;
    return { opponentUserId, opponentCharacterId };
  }
  return null;
}

/**
 * Update user rating after battle.
 * Uses simplified Elo-like formula.
 */
export async function updateRating(
  userId: string,
  opponentRating: number,
  won: boolean
): Promise<number | null> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('rating')
      .eq('id', userId)
      .single();

    if (!user) return null;

    const currentRating = user.rating;
    const expected = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
    const kFactor = 32;
    const change = Math.round(kFactor * ((won ? 1 : 0) - expected));
    const newRating = Math.max(0, currentRating + change);

    await supabase
      .from('users')
      .update({ rating: newRating })
      .eq('id', userId);

    return newRating;
  } catch {
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
