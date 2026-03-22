import { create } from 'zustand';
import type { Equipment, EquipmentSlot } from '../types';
import * as equipmentService from '../services/equipmentService';

interface EquipmentState {
  items: Equipment[];
  isLoading: boolean;

  loadEquipment: (userId: string) => Promise<void>;
  addEquipment: (eq: Equipment) => void;
  removeEquipment: (id: string) => void;
  saveEquipment: (userId: string, eq: Omit<Equipment, 'id' | 'createdAt' | 'userId'>) => Promise<Equipment | null>;
  deleteEquipmentFromDb: (id: string) => Promise<void>;
  getEquipmentForCharacter: (weaponId?: string, armorId?: string, accessoryId?: string) => Equipment[];
  getUnequippedBySlot: (slot: EquipmentSlot, allCharacters: { weaponId?: string; armorId?: string; accessoryId?: string }[]) => Equipment[];
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  items: [],
  isLoading: false,

  loadEquipment: async (userId: string) => {
    set({ isLoading: true });
    try {
      const items = await equipmentService.getEquipment(userId);
      set({ items, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addEquipment: (eq: Equipment) => set({ items: [eq, ...get().items] }),

  removeEquipment: (id: string) => set({
    items: get().items.filter(e => e.id !== id),
  }),

  saveEquipment: async (userId: string, eq: Omit<Equipment, 'id' | 'createdAt' | 'userId'>) => {
    const saved = await equipmentService.createEquipment(userId, eq);
    if (saved) {
      set({ items: [saved, ...get().items] });
    }
    return saved;
  },

  deleteEquipmentFromDb: async (id: string) => {
    const success = await equipmentService.deleteEquipment(id);
    if (success) {
      get().removeEquipment(id);
    }
  },

  getEquipmentForCharacter: (weaponId?: string, armorId?: string, accessoryId?: string) => {
    const { items } = get();
    const equipped: Equipment[] = [];
    if (weaponId) {
      const w = items.find(e => e.id === weaponId);
      if (w) equipped.push(w);
    }
    if (armorId) {
      const a = items.find(e => e.id === armorId);
      if (a) equipped.push(a);
    }
    if (accessoryId) {
      const ac = items.find(e => e.id === accessoryId);
      if (ac) equipped.push(ac);
    }
    return equipped;
  },

  getUnequippedBySlot: (slot: EquipmentSlot, allCharacters: { weaponId?: string; armorId?: string; accessoryId?: string }[]) => {
    const { items } = get();
    const slotKey = slot === 'weapon' ? 'weaponId' : slot === 'armor' ? 'armorId' : 'accessoryId';
    const equippedIds = new Set(allCharacters.map(c => c[slotKey]).filter(Boolean));
    return items.filter(e => e.slot === slot && !equippedIds.has(e.id));
  },
}));
