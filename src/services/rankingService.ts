import { supabase } from './supabase';
import type { RankingEntry } from '../types';

export type RankingType = 'wins' | 'damage' | 'collection';

export async function getRankings(type: RankingType, limit = 100): Promise<RankingEntry[]> {
  const orderColumn = {
    wins: 'weekly_wins',
    damage: 'max_damage',
    collection: 'collection_count',
  }[type];

  const { data, error } = await supabase
    .from('weekly_rankings')
    .select('*')
    .order(orderColumn, { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: any, index: number) => ({
    userId: row.id,
    displayName: row.display_name,
    rating: row.rating,
    weeklyWins: row.weekly_wins,
    maxDamage: row.max_damage,
    collectionCount: row.collection_count,
    rank: index + 1,
  }));
}

export async function getUserRank(userId: string, type: RankingType): Promise<number | null> {
  const rankings = await getRankings(type, 1000);
  const entry = rankings.find(r => r.userId === userId);
  return entry?.rank || null;
}
