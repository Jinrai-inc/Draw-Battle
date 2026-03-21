import { create } from 'zustand';
import type { Character } from '../types';
import * as characterService from '../services/characterService';

interface CollectionState {
  characters: Character[];
  selectedCharacter: Character | null;
  isLoading: boolean;
  // Draft character (between draw and naming screens)
  draftCharacter: Character | null;
  draftImageBase64: string | null;
  setCharacters: (chars: Character[]) => void;
  addCharacter: (char: Character) => void;
  selectCharacter: (char: Character | null) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  removeCharacter: (id: string) => void;
  setDraft: (char: Character, imageBase64: string) => void;
  clearDraft: () => void;
  // DB-connected methods
  loadCharacters: (userId: string) => Promise<void>;
  saveCharacter: (userId: string, imageBase64: string, char: Character) => Promise<Character | null>;
  deleteCharacterFromDb: (id: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  characters: [],
  selectedCharacter: null,
  isLoading: false,
  draftCharacter: null,
  draftImageBase64: null,

  setCharacters: (characters) => set({ characters }),
  addCharacter: (char) => set({ characters: [...get().characters, char] }),
  selectCharacter: (selectedCharacter) => set({ selectedCharacter }),
  updateCharacter: (id, updates) => set({
    characters: get().characters.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ),
  }),
  removeCharacter: (id) => set({
    characters: get().characters.filter(c => c.id !== id),
    selectedCharacter: get().selectedCharacter?.id === id ? null : get().selectedCharacter,
  }),
  setDraft: (char, imageBase64) => set({ draftCharacter: char, draftImageBase64: imageBase64 }),
  clearDraft: () => set({ draftCharacter: null, draftImageBase64: null }),

  loadCharacters: async (userId: string) => {
    set({ isLoading: true });
    try {
      const chars = await characterService.getCharacters(userId);
      set({ characters: chars, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  saveCharacter: async (userId: string, imageBase64: string, char: Character) => {
    const saved = await characterService.createCharacter(userId, imageBase64, char);
    if (saved) {
      set({ characters: [saved, ...get().characters] });
    }
    return saved;
  },

  deleteCharacterFromDb: async (id: string) => {
    const success = await characterService.deleteCharacter(id);
    if (success) {
      get().removeCharacter(id);
    }
  },
}));
