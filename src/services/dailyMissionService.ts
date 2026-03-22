import { supabase } from './supabase';

export type MissionType = 'draw' | 'battle' | 'fusion' | 'login';

export interface DailyMission {
  id: string;
  missionType: MissionType;
  completed: boolean;
  completedAt: string | null;
}

export const MISSION_DEFINITIONS: {
  type: MissionType;
  label: string;
  desc: string;
  icon: string;
}[] = [
  { type: 'login', label: 'ログイン', desc: '今日ログインする', icon: '\u25C8' },
  { type: 'draw', label: 'お絵描き', desc: 'キャラを1体描く', icon: '\u25C6' },
  { type: 'battle', label: 'バトル', desc: 'バトルを1回する', icon: '\u25B7' },
  { type: 'fusion', label: '合成', desc: '合成を1回する', icon: '\u25C7' },
];

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getTodayMissions(userId: string): Promise<DailyMission[]> {
  const today = todayStr();

  const { data, error } = await supabase
    .from('daily_missions')
    .select('id, mission_type, completed, completed_at')
    .eq('user_id', userId)
    .eq('mission_date', today);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    missionType: row.mission_type,
    completed: row.completed,
    completedAt: row.completed_at,
  }));
}

export async function initTodayMissions(userId: string): Promise<DailyMission[]> {
  const today = todayStr();
  const existing = await getTodayMissions(userId);

  if (existing.length >= MISSION_DEFINITIONS.length) {
    return existing;
  }

  const existingTypes = new Set(existing.map(m => m.missionType));
  const toInsert = MISSION_DEFINITIONS
    .filter(d => !existingTypes.has(d.type))
    .map(d => ({
      user_id: userId,
      mission_date: today,
      mission_type: d.type,
      completed: false,
    }));

  if (toInsert.length > 0) {
    await supabase.from('daily_missions').insert(toInsert);
  }

  return getTodayMissions(userId);
}

export async function completeMission(userId: string, missionType: MissionType): Promise<boolean> {
  const today = todayStr();

  const { error } = await supabase
    .from('daily_missions')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('mission_date', today)
    .eq('mission_type', missionType)
    .eq('completed', false);

  return !error;
}

export async function updateLoginStreak(userId: string): Promise<number> {
  const today = todayStr();

  const { data: user } = await supabase
    .from('users')
    .select('login_streak, last_mission_date')
    .eq('id', userId)
    .single();

  if (!user) return 0;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak: number;
  if (user.last_mission_date === yesterdayStr) {
    newStreak = (user.login_streak || 0) + 1;
  } else if (user.last_mission_date === today) {
    return user.login_streak || 1;
  } else {
    newStreak = 1;
  }

  await supabase
    .from('users')
    .update({ login_streak: newStreak, last_mission_date: today })
    .eq('id', userId);

  return newStreak;
}
