import { create } from 'zustand';
import * as missionService from '../services/dailyMissionService';
import type { DailyMission, MissionType } from '../services/dailyMissionService';

interface DailyMissionState {
  missions: DailyMission[];
  loginStreak: number;
  isLoading: boolean;
  completedCount: number;

  initMissions: (userId: string) => Promise<void>;
  completeMission: (userId: string, type: MissionType) => Promise<void>;
  isCompleted: (type: MissionType) => boolean;
  allCompleted: () => boolean;
}

export const useDailyMissionStore = create<DailyMissionState>((set, get) => ({
  missions: [],
  loginStreak: 0,
  isLoading: false,
  completedCount: 0,

  initMissions: async (userId: string) => {
    set({ isLoading: true });
    try {
      const [missions, streak] = await Promise.all([
        missionService.initTodayMissions(userId),
        missionService.updateLoginStreak(userId),
      ]);

      // Auto-complete login mission
      const loginMission = missions.find(m => m.missionType === 'login' && !m.completed);
      if (loginMission) {
        await missionService.completeMission(userId, 'login');
        loginMission.completed = true;
        loginMission.completedAt = new Date().toISOString();
      }

      const completedCount = missions.filter(m => m.completed).length;
      set({ missions, loginStreak: streak, completedCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  completeMission: async (userId: string, type: MissionType) => {
    const { missions } = get();
    const mission = missions.find(m => m.missionType === type && !m.completed);
    if (!mission) return;

    const success = await missionService.completeMission(userId, type);
    if (success) {
      const updated = missions.map(m =>
        m.missionType === type ? { ...m, completed: true, completedAt: new Date().toISOString() } : m
      );
      set({ missions: updated, completedCount: updated.filter(m => m.completed).length });
    }
  },

  isCompleted: (type: MissionType) => {
    return get().missions.some(m => m.missionType === type && m.completed);
  },

  allCompleted: () => {
    const { missions } = get();
    return missions.length > 0 && missions.every(m => m.completed);
  },
}));
