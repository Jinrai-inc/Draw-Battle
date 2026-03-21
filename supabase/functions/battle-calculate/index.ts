// Supabase Edge Function: Battle Calculate
// This runs server-side to prevent cheating.
// Client sends character IDs, server fetches data, runs battle, returns results.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inline battle config (same as client GAME_CONFIG.battle)
const BATTLE_CONFIG = {
  hpMultiplier: 3,
  atkScale: 1.5,
  defScale: 0.5,
  damageVariance: 0.4,
  critChanceDivisor: 200,
  critMultiplier: 2.0,
  specialTriggerDiv: 3,
  minDamage: 1,
};

const STATUS_EFFECTS = {
  poison: { id: 'poison', damagePercent: 8, duration: 3 },
  sleep: { id: 'sleep', skipTurn: true, duration: 2 },
  paralyze: { id: 'paralyze', skipChance: 50, duration: 3 },
  burn: { id: 'burn', damagePercent: 5, atkReduction: 20, duration: 3 },
  freeze: { id: 'freeze', spdReduction: 50, duration: 2 },
};

serve(async (req: Request) => {
  try {
    const { player1_char_id, player2_char_id, battle_type } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch both characters
    const [char1Res, char2Res] = await Promise.all([
      supabase.from('characters').select('*').eq('id', player1_char_id).single(),
      supabase.from('characters').select('*').eq('id', player2_char_id).single(),
    ]);

    if (char1Res.error || char2Res.error) {
      return new Response(JSON.stringify({ error: 'Character not found' }), { status: 404 });
    }

    const char1 = char1Res.data;
    const char2 = char2Res.data;

    // Run battle
    const result = runServerBattle(char1, char2);

    // Save battle record
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .insert({
        player1_id: char1.user_id,
        player2_id: char2.user_id,
        player1_char_id,
        player2_char_id,
        winner_id: result.winnerId,
        battle_log: result.turns,
        battle_type,
      })
      .select()
      .single();

    if (battleError) {
      return new Response(JSON.stringify({ error: 'Failed to save battle' }), { status: 500 });
    }

    // Update stats
    const winnerId = result.winnerId === char1.user_id ? char1.user_id : char2.user_id;
    const loserId = result.winnerId === char1.user_id ? char2.user_id : char1.user_id;

    await Promise.all([
      supabase.rpc('increment_wins', { user_id: winnerId }),
      supabase.rpc('increment_losses', { user_id: loserId }),
    ]);

    return new Response(
      JSON.stringify({
        battle_id: battle.id,
        winner_id: result.winnerId,
        turns: result.turns,
        rewards: {
          exp_gained: result.winnerId === char1.user_id ? 100 : 30,
          equipment_drop: null,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

interface CharData {
  id: string;
  user_id: string;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  special: number;
  special_move_name: string;
}

interface FighterState {
  char: CharData;
  currentHp: number;
  maxHp: number;
  statusEffects: { id: string; remainingTurns: number }[];
  specialMultiplier: number;
}

function runServerBattle(char1: CharData, char2: CharData) {
  const fighters: [FighterState, FighterState] = [
    {
      char: char1,
      currentHp: char1.hp * BATTLE_CONFIG.hpMultiplier,
      maxHp: char1.hp * BATTLE_CONFIG.hpMultiplier,
      statusEffects: [],
      specialMultiplier: 1.5, // Simplified for server
    },
    {
      char: char2,
      currentHp: char2.hp * BATTLE_CONFIG.hpMultiplier,
      maxHp: char2.hp * BATTLE_CONFIG.hpMultiplier,
      statusEffects: [],
      specialMultiplier: 1.5,
    },
  ];

  const turns: any[] = [];
  const labels: ['player1', 'player2'] = ['player1', 'player2'];

  for (let turn = 1; turn <= 100; turn++) {
    const firstIdx = fighters[0].char.spd >= fighters[1].char.spd ? 0 : 1;
    const secondIdx = 1 - firstIdx;

    for (const idx of [firstIdx, secondIdx]) {
      const attacker = fighters[idx];
      const defender = fighters[1 - idx];

      // Check skip
      let skipped = false;
      for (const eff of attacker.statusEffects) {
        if (eff.id === 'sleep') { skipped = true; break; }
        if (eff.id === 'paralyze' && Math.random() < 0.5) { skipped = true; break; }
      }

      if (skipped) {
        turns.push({
          turn, attacker: labels[idx], action: 'skip',
          damage: 0, is_critical: false, is_special: false,
          defender_hp_after: defender.currentHp, skipped_reason: 'Status effect',
        });
        continue;
      }

      const isSpecial = Math.random() * 100 < attacker.char.special / BATTLE_CONFIG.specialTriggerDiv;
      let damage = attacker.char.atk * BATTLE_CONFIG.atkScale - defender.char.def * BATTLE_CONFIG.defScale;
      if (isSpecial) damage *= attacker.specialMultiplier;
      const variance = 1 + (Math.random() - 0.5) * BATTLE_CONFIG.damageVariance;
      damage *= variance;
      const isCritical = Math.random() < attacker.char.spd / BATTLE_CONFIG.critChanceDivisor;
      if (isCritical) damage *= BATTLE_CONFIG.critMultiplier;
      damage = Math.max(BATTLE_CONFIG.minDamage, Math.round(damage));

      defender.currentHp = Math.max(0, defender.currentHp - damage);

      let statusApplied = null;
      if (isSpecial && Math.random() < 0.3) {
        const effects = Object.values(STATUS_EFFECTS);
        const eff = effects[Math.floor(Math.random() * effects.length)];
        statusApplied = { id: eff.id, duration: eff.duration };
        defender.statusEffects = defender.statusEffects.filter(e => e.id !== eff.id);
        defender.statusEffects.push({ id: eff.id, remainingTurns: eff.duration });
      }

      turns.push({
        turn, attacker: labels[idx],
        action: isSpecial ? 'special' : 'attack',
        damage, is_critical: isCritical, is_special: isSpecial,
        special_name: isSpecial ? attacker.char.special_move_name : null,
        special_multiplier: isSpecial ? attacker.specialMultiplier : null,
        defender_hp_after: defender.currentHp,
        status_applied: statusApplied,
      });

      if (defender.currentHp <= 0) {
        return { winnerId: attacker.char.user_id, turns };
      }
    }

    // Tick status effects
    for (const f of fighters) {
      // Apply status damage
      for (const eff of f.statusEffects) {
        const def = STATUS_EFFECTS[eff.id as keyof typeof STATUS_EFFECTS] as any;
        if (def?.damagePercent) {
          const dmg = Math.max(1, Math.floor(f.maxHp * def.damagePercent / 100));
          f.currentHp = Math.max(0, f.currentHp - dmg);
        }
      }
      f.statusEffects = f.statusEffects
        .map(e => ({ ...e, remainingTurns: e.remainingTurns - 1 }))
        .filter(e => e.remainingTurns > 0);
    }

    if (fighters[0].currentHp <= 0) return { winnerId: char2.user_id, turns };
    if (fighters[1].currentHp <= 0) return { winnerId: char1.user_id, turns };
  }

  return {
    winnerId: fighters[0].currentHp >= fighters[1].currentHp ? char1.user_id : char2.user_id,
    turns,
  };
}
