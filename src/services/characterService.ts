import { supabase } from './supabase';
import type { Character } from '../types';

export async function createCharacter(
  userId: string,
  imageBase64: string,
  character: Omit<Character, 'id' | 'createdAt'>
): Promise<Character | null> {
  let imageUrl = '';

  // Upload image to storage (gracefully handle failures)
  try {
    const fileName = `${userId}/${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('character-images')
      .upload(fileName, decode(imageBase64), {
        contentType: 'image/png',
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('character-images')
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    } else {
      console.warn('Image upload failed, saving without image URL:', uploadError.message);
    }
  } catch (e) {
    // Storage bucket may not exist - continue without image URL
    console.warn('Storage unavailable, saving without image URL');
  }

  // Insert character record
  try {
    const { data, error } = await supabase
      .from('characters')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        name: character.name,
        special_move_name: character.specialMoveName,
        hp: character.stats.hp,
        atk: character.stats.atk,
        def: character.stats.def,
        spd: character.stats.spd,
        special: character.stats.special,
        total_stats: character.stats.totalStats,
        element: character.element,
        rarity: character.rarity,
      })
      .select()
      .single();

    if (error) {
      console.warn('DB insert failed:', error.message);
      return null;
    }

    return mapDbToCharacter(data);
  } catch {
    return null;
  }
}

export async function getCharacters(userId: string): Promise<Character[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapDbToCharacter);
}

export async function getCharacter(id: string): Promise<Character | null> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapDbToCharacter(data);
}

export async function updateCharacter(
  id: string,
  updates: Partial<{
    name: string;
    special_move_name: string;
    level: number;
    exp: number;
    battle_count: number;
    is_evolved: boolean;
    rarity: string;
    weapon_id: string;
    armor_id: string;
    accessory_id: string;
  }>
): Promise<boolean> {
  const { error } = await supabase
    .from('characters')
    .update(updates)
    .eq('id', id);

  return !error;
}

export async function deleteCharacter(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', id);

  return !error;
}

function mapDbToCharacter(row: any): Character {
  return {
    id: row.id,
    userId: row.user_id,
    imageUrl: row.image_url,
    name: row.name,
    specialMoveName: row.special_move_name,
    stats: {
      hp: row.hp,
      atk: row.atk,
      def: row.def,
      spd: row.spd,
      special: row.special,
      totalStats: row.total_stats,
    },
    element: row.element,
    rarity: row.rarity,
    level: row.level,
    exp: row.exp,
    battleCount: row.battle_count,
    isEvolved: row.is_evolved,
    weaponId: row.weapon_id,
    armorId: row.armor_id,
    accessoryId: row.accessory_id,
    createdAt: row.created_at,
  };
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
