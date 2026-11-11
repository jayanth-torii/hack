import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  /**
   * Drives whether the admin entry point is rendered at all. It is a **UI
   * hint, nothing more** — every `/admin` endpoint re-reads the role from the
   * database, so hiding or showing a link here changes what a person sees,
   * never what they can do.
   */
  role?: "user" | "admin";
}

interface AuthState {
  user: User | null;
  isInitializing: boolean;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitializing: true,
  initAuth: async () => {
    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      set({ user: response.user, isInitializing: false });
    } catch (err) {
      set({ user: null, isInitializing: false });
    }
  },
  logout: async () => {
    try {
      await apiClient.post('/auth/logout', {});
      set({ user: null });
    } catch (err) {
      console.error('Logout failed', err);
    }
  }
}));
