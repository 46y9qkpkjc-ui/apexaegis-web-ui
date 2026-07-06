import { create } from 'zustand';

// The active tenant scopes the console. null = "All Tenants" (consolidated MSP view).
export interface ActiveTenant { id: string; name: string; }

interface TenantContextState {
  active: ActiveTenant | null;
  setActive: (t: ActiveTenant | null) => void;
}

const KEY = 'apexaegis_active_tenant';

function load(): ActiveTenant | null {
  if (typeof window === 'undefined') return null;
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

export const useTenantContext = create<TenantContextState>((set) => ({
  active: load(),
  setActive: (t) => {
    if (typeof window !== 'undefined') {
      try {
        if (t) localStorage.setItem(KEY, JSON.stringify(t));
        else localStorage.removeItem(KEY);
      } catch { /* ignore */ }
    }
    set({ active: t });
  },
}));
