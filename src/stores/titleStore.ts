import { create } from 'zustand';
import * as titleService from '../services/titleService';
import type { Character } from '../types';
import { calcSpecialPower } from '../engine/specialPower';

interface TitleState {
  unlockedIds: Set<string>;
  isLoading: boolean;
  winStreak: number;
  synthesesDone: number;
  newlyUnlockedQueue: string[]; // for showing notifications

  loadUnlockedTitles: (userId: string) => Promise<void>;
  incrementWinStreak: () => void;
  resetWinStreak: () => void;
  incrementSyntheses: () => void;
  checkTitles: (userId: string, characters: Character[], totalWins: number) => Promise<string[]>;
  popNewlyUnlocked: () => string | undefined;
}

export const useTitleStore = create<TitleState>((set, get) => ({
  unlockedIds: new Set<string>(),
  isLoading: false,
  winStreak: 0,
  synthesesDone: 0,
  newlyUnlockedQueue: [],

  loadUnlockedTitles: async (userId: string) => {
    set({ isLoading: true });
    try {
      const ids = await titleService.getUnlockedTitles(userId);
      set({ unlockedIds: new Set(ids), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  incrementWinStreak: () => set({ winStreak: get().winStreak + 1 }),
  resetWinStreak: () => set({ winStreak: 0 }),
  incrementSyntheses: () => set({ synthesesDone: get().synthesesDone + 1 }),

  checkTitles: async (userId: string, characters: Character[], totalWins: number) => {
    const { unlockedIds, winStreak, synthesesDone } = get();

    // Build element count
    const charactersByElement: Record<string, number> = {};
    for (const c of characters) {
      charactersByElement[c.element] = (charactersByElement[c.element] || 0) + 1;
    }

    // Check for SSR/UR
    const hasSSR = characters.some(c => c.rarity === 'SSR' || c.rarity === 'UR');

    // Check for SSS rank special move
    const hasSSSRank = characters.some(c => {
      const result = calcSpecialPower(c.specialMoveName);
      return result.rank === 'SSS';
    });

    // Codex completion: 5 elements x 5 rarities (C, UC, R, SR, SSR) = 25 slots
    const codexSlots = new Set<string>();
    for (const c of characters) {
      codexSlots.add(`${c.element}_${c.rarity}`);
    }
    const codexCompletion = Math.round((codexSlots.size / 25) * 100);

    const context: titleService.TitleCheckContext = {
      totalWins,
      totalCharacters: characters.length,
      charactersByElement,
      hasSSR,
      hasURorSSR: hasSSR,
      codexCompletion,
      hasSSSRank,
      winStreak,
      synthesesDone,
    };

    const newlyUnlocked = await titleService.checkAndUnlockTitles(userId, context, new Set(unlockedIds));

    if (newlyUnlocked.length > 0) {
      const updated = new Set(unlockedIds);
      for (const id of newlyUnlocked) updated.add(id);
      set({
        unlockedIds: updated,
        newlyUnlockedQueue: [...get().newlyUnlockedQueue, ...newlyUnlocked],
      });
    }

    return newlyUnlocked;
  },

  popNewlyUnlocked: () => {
    const queue = get().newlyUnlockedQueue;
    if (queue.length === 0) return undefined;
    const [first, ...rest] = queue;
    set({ newlyUnlockedQueue: rest });
    return first;
  },
}));
