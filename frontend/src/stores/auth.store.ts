import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getTenants } from '@/services/api.service';

export interface AuthUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  must_change_password?: boolean;
}

export interface TenantInfo {
  id: string | number;
  name: string;
  role: string;
  status?: string;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;

  tenantId: string | null;
  setTenantId: (tenantId: string | null) => void;

  tenants: TenantInfo[];
  setTenants: (tenants: TenantInfo[]) => void;
  fetchTenants: () => Promise<TenantInfo[]>;
  switchTenant: (tenantId: string | number) => void;

  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenantId: null,
      tenants: [],

      setUser: (user) => set({ user }),

      setTenantId: (tenantId) => set({ tenantId: tenantId ? String(tenantId) : null }),

      setTenants: (tenants) => set({ tenants }),

      fetchTenants: async () => {
        try {
          const data = await getTenants();
          set({ tenants: data });
          return data;
        } catch (err) {
          console.error('Failed to fetch tenants in auth store:', err);
          return [];
        }
      },

      switchTenant: (tenantId) => {
        set({ tenantId: String(tenantId) });
      },

      clearAuth: () =>
        set({
          user: null,
          tenantId: null,
          tenants: [],
        }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        user: state.user,
        tenantId: state.tenantId,
        tenants: state.tenants,
      }),
    }
  )
);
