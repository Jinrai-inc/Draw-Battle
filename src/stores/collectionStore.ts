import { create } from 'zustand';
import type { Character } from '../types';

interface CollectionState {
  characters: Character[];
  selectedCharacter: Character | null;
  setCharacters: (chars: Character[]) => void;
  addCharacter: (char: Character) => void;
  selectCharacter: (char: Character | null) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  removeCharacter: (id: string) => void;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  characters: [],
  selectedCharacter: null,
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
  }),
}));
