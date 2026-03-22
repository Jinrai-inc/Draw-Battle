import { supabase } from './supabase';

// All title definitions matching the DB seed
export const TITLE_DEFINITIONS = [
  { id: 'first_win', name: '初陣', desc: '初めてバトルに勝利', icon: '\u25B7', conditionType: 'wins', conditionValue: 1 },
  { id: 'collector_10', name: 'コレクター', desc: 'キャラを10体保存', icon: '\u25C6', conditionType: 'characters', conditionValue: 10 },
  { id: 'fire_master', name: '属性マスター：炎', desc: '炎属性キャラを10体作成', icon: '\u25C8', conditionType: 'element_fire', conditionValue: 10 },
  { id: 'water_master', name: '属性マスター：水', desc: '水属性キャラを10体作成', icon: '\u25C8', conditionType: 'element_water', conditionValue: 10 },
  { id: 'wind_master', name: '属性マスター：風', desc: '風属性キャラを10体作成', icon: '\u25C8', conditionType: 'element_wind', conditionValue: 10 },
  { id: 'thunder_master', name: '属性マスター：雷', desc: '雷属性キャラを10体作成', icon: '\u25C8', conditionType: 'element_thunder', conditionValue: 10 },
  { id: 'dark_master', name: '属性マスター：闇', desc: '闇属性キャラを10体作成', icon: '\u25C8', conditionType: 'element_dark', conditionValue: 10 },
  { id: 'veteran_100', name: '百戦錬磨', desc: '100勝達成', icon: '\u25C8', conditionType: 'wins', conditionValue: 100 },
  { id: 'ssr_hunter', name: 'SSRハンター', desc: 'SSRキャラを初めて入手', icon: '\u25C7', conditionType: 'rarity_ssr', conditionValue: 1 },
  { id: 'codex_50', name: '図鑑マニア', desc: '図鑑コンプ率50%達成', icon: '\u25C6', conditionType: 'codex_completion', conditionValue: 50 },
  { id: 'naming_sss', name: 'ネーミングセンス', desc: '必殺技威力ランクSSSを出す', icon: '\u25C7', conditionType: 'special_rank_sss', conditionValue: 1 },
  { id: 'win_streak_10', name: '連勝王', desc: '10連勝達成', icon: '\u25B7', conditionType: 'win_streak', conditionValue: 10 },
  { id: 'legend', name: '伝説', desc: '図鑑コンプ率100%達成', icon: '\u25C8', conditionType: 'codex_completion', conditionValue: 100 },
  { id: 'alchemist', name: '錬金術師', desc: '初めて合成成功', icon: '\u25C7', conditionType: 'synthesis', conditionValue: 1 },
] as const;

export async function getUnlockedTitles(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_titles')
    .select('title_id')
    .eq('user_id', userId);

  if (error || !data) return [];
  return data.map((row: any) => row.title_id);
}

export async function unlockTitle(userId: string, titleId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_titles')
    .upsert({ user_id: userId, title_id: titleId }, { onConflict: 'user_id,title_id' });

  return !error;
}

export interface TitleCheckContext {
  totalWins: number;
  totalCharacters: number;
  charactersByElement: Record<string, number>;
  hasSSR: boolean;
  hasURorSSR: boolean;
  codexCompletion: number; // 0-100
  hasSSSRank: boolean;
  winStreak: number;
  synthesesDone: number;
}

/**
 * Check all titles against current user stats and unlock any newly earned ones.
 * Returns array of newly unlocked title IDs.
 */
export async function checkAndUnlockTitles(
  userId: string,
  context: TitleCheckContext,
  alreadyUnlocked: Set<string>,
): Promise<string[]> {
  const newlyUnlocked: string[] = [];

  for (const title of TITLE_DEFINITIONS) {
    if (alreadyUnlocked.has(title.id)) continue;

    let earned = false;

    switch (title.conditionType) {
      case 'wins':
        earned = context.totalWins >= title.conditionValue;
        break;
      case 'characters':
        earned = context.totalCharacters >= title.conditionValue;
        break;
      case 'element_fire':
        earned = (context.charactersByElement['fire'] || 0) >= title.conditionValue;
        break;
      case 'element_water':
        earned = (context.charactersByElement['water'] || 0) >= title.conditionValue;
        break;
      case 'element_wind':
        earned = (context.charactersByElement['wind'] || 0) >= title.conditionValue;
        break;
      case 'element_thunder':
        earned = (context.charactersByElement['thunder'] || 0) >= title.conditionValue;
        break;
      case 'element_dark':
        earned = (context.charactersByElement['dark'] || 0) >= title.conditionValue;
        break;
      case 'rarity_ssr':
        earned = context.hasSSR;
        break;
      case 'codex_completion':
        earned = context.codexCompletion >= title.conditionValue;
        break;
      case 'special_rank_sss':
        earned = context.hasSSSRank;
        break;
      case 'win_streak':
        earned = context.winStreak >= title.conditionValue;
        break;
      case 'synthesis':
        earned = context.synthesesDone >= title.conditionValue;
        break;
    }

    if (earned) {
      const success = await unlockTitle(userId, title.id);
      if (success) {
        newlyUnlocked.push(title.id);
        alreadyUnlocked.add(title.id);
      }
    }
  }

  return newlyUnlocked;
}
