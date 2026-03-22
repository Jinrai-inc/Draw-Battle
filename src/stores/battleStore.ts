import { create } from 'zustand';
import type { Character, BattleTurnLog, BattleResult } from '../types';

type BattlePhase = 'idle' | 'matching' | 'summon' | 'fighting' | 'result';

interface BattleState {
  phase: BattlePhase;
  playerCharacter: Character | null;
  enemyCharacter: Character | null;
  battleResult: BattleResult | null;
  currentTurnIndex: number;
  turns: BattleTurnLog[];
  isPlayerWinner: boolean;

  setPhase: (phase: BattlePhase) => void;
  setPlayerCharacter: (char: Character) => void;
  setEnemyCharacter: (char: Character) => void;
  setBattleResult: (result: BattleResult) => void;
  setCurrentTurnIndex: (index: number) => void;
  advanceTurn: () => void;
  reset: () => void;
}

export const useBattleStore = create<BattleState>((set, get) => ({
  phase: 'idle',
  playerCharacter: null,
  enemyCharacter: null,
  battleResult: null,
  currentTurnIndex: 0,
  turns: [],
  isPlayerWinner: false,

  setPhase: (phase) => set({ phase }),
  setPlayerCharacter: (char) => set({ playerCharacter: char }),
  setEnemyCharacter: (char) => set({ enemyCharacter: char }),
  setBattleResult: (result) => set({
    battleResult: result,
    turns: result.turns || [],
    currentTurnIndex: 0,
    isPlayerWinner: result.winnerId === get().playerCharacter?.id,
  }),
  setCurrentTurnIndex: (index) => set({ currentTurnIndex: index }),
  advanceTurn: () => {
    const { currentTurnIndex, turns } = get();
    if (currentTurnIndex < turns.length - 1) {
      set({ currentTurnIndex: currentTurnIndex + 1 });
    }
  },
  reset: () => set({
    phase: 'idle',
    playerCharacter: null,
    enemyCharacter: null,
    battleResult: null,
    currentTurnIndex: 0,
    turns: [],
    isPlayerWinner: false,
  }),
}));
