import { useAuthStore } from '@/lib/auth-store';

const API_BASE = '/api/v1/admin/posture-profile';

function authHeader() {
  const token = useAuthStore.getState().accessToken;
  return { Authorization: `Bearer ${token ?? ''}` };
}

export interface PostureProfile {
  check_device_cert: boolean;
  check_av: boolean;
  check_disk_encryption: boolean;
  check_os_patch: boolean;
}

export async function fetchPostureProfile(): Promise<PostureProfile> {
  const res = await fetch(API_BASE, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to load posture profile: ${res.status}`);
  return res.json();
}

export async function savePostureProfile(p: PostureProfile): Promise<void> {
  const res = await fetch(API_BASE, {
    method: 'PUT',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  });
  if (!res.ok) throw new Error(`Failed to save posture profile: ${res.status}`);
}
