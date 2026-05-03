import { useAuthStore } from '@/lib/auth-store';

const API_BASE = '/api/v1/profiles';
function authHeader() {
  const token = useAuthStore.getState().accessToken;
  return { Authorization: `Bearer ${token ?? ''}` };
}

export type ProfileType = 'atp' | 'ssl' | 'dns' | 'web' | 'device-posture';

export interface ApiProfile {
  id: string;
  type: ProfileType;
  name: string;
  enabled: boolean;
  builtin: boolean;
  sequence: number;
  config: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}

export async function fetchProfiles(type: ProfileType): Promise<ApiProfile[]> {
  const res = await fetch(`${API_BASE}/${type}`, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to fetch ${type} profiles`);
  const data = await res.json();
  return (data.profiles ?? []).sort(
    (a: ApiProfile, b: ApiProfile) => a.sequence - b.sequence,
  );
}

export async function createProfile(
  type: ProfileType,
  profile: Partial<ApiProfile>,
): Promise<ApiProfile> {
  const res = await fetch(`${API_BASE}/${type}`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to create profile');
  }
  return res.json();
}

export async function updateProfile(
  type: ProfileType,
  id: string,
  profile: Partial<ApiProfile>,
): Promise<ApiProfile> {
  const res = await fetch(`${API_BASE}/${type}/${id}`, {
    method: 'PUT',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to update profile');
  }
  return res.json();
}

export async function deleteProfile(
  type: ProfileType,
  id: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/${type}/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to delete profile');
  }
}

export async function toggleProfile(
  type: ProfileType,
  id: string,
  enabled: boolean,
): Promise<ApiProfile> {
  const res = await fetch(`${API_BASE}/${type}/${id}/toggle`, {
    method: 'PUT',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to toggle profile');
  }
  return res.json();
}
