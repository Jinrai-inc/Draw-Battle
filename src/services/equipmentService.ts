import { supabase } from './supabase';
import { GAME_CONFIG } from '../config/gameConfig';
import type { Equipment, EquipmentSlot, EquipmentRarity, StatKey } from '../types';

function mapDbToEquipment(row: any): Equipment {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    slot: row.slot,
    rarity: row.rarity,
    bonusStat: row.bonus_stat,
    bonusValue: row.bonus_value,
    createdAt: row.created_at,
  };
}

export async function getEquipment(userId: string): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapDbToEquipment);
}

export async function createEquipment(
  userId: string,
  equipment: Omit<Equipment, 'id' | 'createdAt' | 'userId'>
): Promise<Equipment | null> {
  const { data, error } = await supabase
    .from('equipment')
    .insert({
      user_id: userId,
      name: equipment.name,
      slot: equipment.slot,
      rarity: equipment.rarity,
      bonus_stat: equipment.bonusStat,
      bonus_value: equipment.bonusValue,
    })
    .select()
    .single();

  if (error || !data) return null;
  return mapDbToEquipment(data);
}

export async function deleteEquipment(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', id);

  return !error;
}

/**
 * Generate a random equipment drop after battle victory.
 */
export function generateEquipmentDrop(userId: string): Equipment | null {
  const cfg = GAME_CONFIG.equipment;

  // Roll for drop
  if (Math.random() > cfg.dropChance) return null;

  // Determine rarity
  const roll = Math.random();
  let rarity: EquipmentRarity;
  if (roll < cfg.rarityWeights.epic) {
    rarity = 'epic';
  } else if (roll < cfg.rarityWeights.epic + cfg.rarityWeights.rare) {
    rarity = 'rare';
  } else {
    rarity = 'normal';
  }

  // Pick random slot
  const slot = cfg.slots[Math.floor(Math.random() * cfg.slots.length)] as EquipmentSlot;

  // Pick bonus stat from slot's stat pool
  const slotDef = cfg.slotLabels[slot];
  const bonusStat = slotDef.statPool[Math.floor(Math.random() * slotDef.statPool.length)] as StatKey;

  // Roll bonus value
  const range = cfg.bonusRange[rarity];
  const bonusValue = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

  // Generate name
  const names = cfg.namePool[slot];
  const prefix = names.prefix[Math.floor(Math.random() * names.prefix.length)];
  const base = names.base[Math.floor(Math.random() * names.base.length)];
  const name = `${prefix}${base}`;

  return {
    id: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    name,
    slot,
    rarity,
    bonusStat,
    bonusValue,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Calculate total equipment bonuses for a character.
 */
export function calcEquipmentBonuses(
  equipment: Equipment[]
): Record<StatKey, number> {
  const bonuses: Record<StatKey, number> = { hp: 0, atk: 0, def: 0, spd: 0, special: 0 };
  for (const eq of equipment) {
    bonuses[eq.bonusStat] += eq.bonusValue;
  }
  return bonuses;
}
