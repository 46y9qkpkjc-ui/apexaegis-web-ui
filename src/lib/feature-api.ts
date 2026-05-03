import { useAuthStore } from '@/lib/auth-store';

const API_BASE = '/api/v1/features';
function authHeader() {
  const token = useAuthStore.getState().accessToken;
  return { Authorization: `Bearer ${token ?? ''}` };
}

export interface Feature {
  id: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  min_plan: 'standard' | 'professional' | 'enterprise';
  trial_days: number;
  trial_end?: string;
  updated_by: string;
  updated_at: string;
}

export async function fetchFeatures(): Promise<Feature[]> {
  const res = await fetch(API_BASE, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to fetch features: ${res.status}`);
  const data = await res.json();
  return data.features ?? [];
}

export async function toggleFeature(id: string, enabled: boolean): Promise<Feature> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}/toggle`, {
    method: 'PUT',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error(`Failed to toggle feature: ${res.status}`);
  return res.json();
}

export async function startTrial(id: string): Promise<Feature> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}/trial`, {
    method: 'POST',
    headers: authHeader(),
  });
  if (!res.ok) throw new Error(`Failed to start trial: ${res.status}`);
  return res.json();
}
