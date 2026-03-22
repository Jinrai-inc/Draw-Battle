import { supabase } from './supabase';

export interface CharacterLike {
  id: string;
  userId: string;
  characterId: string;
  ownerId: string;
  createdAt: string;
}

export async function likeCharacter(userId: string, characterId: string, ownerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('character_likes')
    .insert({ user_id: userId, character_id: characterId, owner_id: ownerId });

  if (!error) {
    // Increment cached like count
    await supabase.rpc('increment_like_count', { p_character_id: characterId });
  }

  return !error;
}

export async function unlikeCharacter(userId: string, characterId: string): Promise<boolean> {
  const { error } = await supabase
    .from('character_likes')
    .delete()
    .eq('user_id', userId)
    .eq('character_id', characterId);

  if (!error) {
    await supabase.rpc('decrement_like_count', { p_character_id: characterId });
  }

  return !error;
}

export async function getMyLikes(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('character_likes')
    .select('character_id')
    .eq('user_id', userId);

  if (error || !data) return [];
  return data.map((row: any) => row.character_id);
}

export async function getLikeCount(characterId: string): Promise<number> {
  const { count, error } = await supabase
    .from('character_likes')
    .select('*', { count: 'exact', head: true })
    .eq('character_id', characterId);

  return error ? 0 : (count ?? 0);
}

export async function getReceivedLikesSummary(userId: string): Promise<{ characterId: string; likeCount: number }[]> {
  const { data, error } = await supabase
    .from('character_likes')
    .select('character_id')
    .eq('owner_id', userId);

  if (error || !data) return [];

  // Group by character
  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.character_id] = (counts[row.character_id] || 0) + 1;
  }

  return Object.entries(counts).map(([characterId, likeCount]) => ({
    characterId,
    likeCount,
  }));
}
