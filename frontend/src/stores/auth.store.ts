import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  must_change_password?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;

  tenantId: string | null
  setTenantId: (tenantId: string | null) => void

  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenantId: null,

      setUser: (user) => set({ user }),

      setTenantId: (tenantId) => set({ tenantId }),

      clearAuth: () =>
        set({
          user: null,
          tenantId: null,
        }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        user: state.user,
        tenantId: state.tenantId,
      }),
    }
  )
)
