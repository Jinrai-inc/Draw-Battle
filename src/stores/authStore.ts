import { create } from 'zustand';
import type { User } from '../types';
import { supabase } from '../services/supabase';
import { getUserProfile, updateLastLogin } from '../services/authService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  needsNickname: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setNeedsNickname: (needs: boolean) => void;
  setGuest: (user: User) => void;
  initialize: () => Promise<void>;
  logout: () => void;
}

function mapDbUser(row: any): User {
  return {
    id: row.id,
    authId: row.auth_id,
    displayName: row.display_name,
    friendId: row.friend_id,
    titleId: row.title_id,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    rating: row.rating,
    totalWins: row.total_wins,
    totalLosses: row.total_losses,
    maxDamage: row.max_damage,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isGuest: false,
  needsNickname: false,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false, needsNickname: false, isGuest: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setNeedsNickname: (needsNickname) => set({ needsNickname }),
  setGuest: (user) => set({ user, isAuthenticated: true, isGuest: true, isLoading: false, needsNickname: false }),
  logout: () => set({ user: null, isAuthenticated: false, isGuest: false, needsNickname: false }),

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const profile = await getUserProfile(session.user.id);
      if (!profile) {
        set({ isAuthenticated: true, needsNickname: true, isLoading: false });
        return;
      }

      await updateLastLogin(profile.id);
      set({
        user: mapDbUser(profile),
        isAuthenticated: true,
        needsNickname: false,
        isLoading: false,
      });
    } catch {
      // Supabase not configured or network error - just show login screen
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export { mapDbUser };
