import { create } from 'zustand';

export type SsoMethod = 'kerberos' | 'microsoft' | 'saml' | 'credentials' | 'none';
export type AuthStep = 'detecting' | 'sso-prompt' | 'credentials' | 'mfa';

interface SsoProbe {
  kerberos: boolean;
  microsoft: boolean;
  checked: boolean;
}

interface AuthUser {
  email: string;
  name: string;
  role: string;
  id?: string;
  org_id?: string;
  // Set for MSP operators (e.g. April/StarHub): the service provider whose fleet
  // this user manages. Absent for single-tenant users (consumers/tenant admins).
  operator_scope?: string;
  mfa_enabled?: boolean;
}

// isMspUser reports whether a user gets the multitenant/MSP console (tenant
// switcher, consolidated overview, partner ladder). True for the platform
// super_admin and for any operator-scoped user; false for a single-tenant
// consumer, who is locked to their own org's data.
export function isMspUser(user?: { role?: string; operator_scope?: string } | null): boolean {
  if (!user) return false;
  return user.role === 'super_admin' || !!(user.operator_scope && user.operator_scope.trim());
}

interface AuthState {
  step: AuthStep;
  ssoProbe: SsoProbe;
  ssoMethod: SsoMethod;
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isDevMode: boolean;

  /* actions */
  setStep: (s: AuthStep) => void;
  setSsoProbe: (p: Partial<SsoProbe>) => void;
  setSsoMethod: (m: SsoMethod) => void;
  signIn: (user: AuthUser, accessToken?: string, refreshToken?: string) => void;
  signOut: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

const STORAGE_KEY = 'apexaegis_auth';

function loadPersistedAuth(): Partial<AuthState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return {
      isAuthenticated: data.isAuthenticated ?? false,
      user: data.user ?? null,
      accessToken: data.accessToken ?? null,
      refreshToken: data.refreshToken ?? null,
    };
  } catch {
    return {};
  }
}

function persistAuth(state: Partial<AuthState>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
    }));
  } catch { /* ignore storage errors */ }
}

function clearPersistedAuth() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

const persisted = loadPersistedAuth();

export const useAuthStore = create<AuthState>((set) => ({
  step: persisted.isAuthenticated ? 'credentials' : 'detecting',
  ssoProbe: { kerberos: false, microsoft: false, checked: false },
  ssoMethod: 'none',
  isAuthenticated: persisted.isAuthenticated ?? false,
  user: persisted.user ?? null,
  accessToken: persisted.accessToken ?? null,
  refreshToken: persisted.refreshToken ?? null,
  isDevMode: process.env.NEXT_PUBLIC_DEPLOY_MODE === 'dev',

  setStep: (step) => set({ step }),
  setSsoProbe: (p) =>
    set((s) => ({ ssoProbe: { ...s.ssoProbe, ...p } })),
  setSsoMethod: (ssoMethod) => set({ ssoMethod }),
  signIn: (user, accessToken, refreshToken) => {
    const state = { isAuthenticated: true, user, accessToken: accessToken ?? null, refreshToken: refreshToken ?? null };
    persistAuth(state);
    set(state);
  },
  signOut: () => {
    clearPersistedAuth();
    set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      step: 'detecting',
      ssoProbe: { kerberos: false, microsoft: false, checked: false },
      ssoMethod: 'none',
    });
  },
  setTokens: (accessToken, refreshToken) => {
    set((s) => {
      const state = { ...s, accessToken, refreshToken };
      persistAuth(state);
      return { accessToken, refreshToken };
    });
  },
}));
