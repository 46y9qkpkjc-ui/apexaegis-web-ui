// Device enrolment secret admin API — talks to the MP's /api/v1/admin/enrol-secrets.
import { apiUrl } from '@/lib/api-url';
import { useAuthStore } from '@/lib/auth-store';

function authHeaders(json = false): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

export interface EnrolSecret {
  id: string;
  org_id: string;
  label: string;
  prefix: string;
  status: 'active' | 'revoked';
  created_at: string;
  last_used_at?: string | null;
}

export async function listEnrolSecrets(): Promise<EnrolSecret[]> {
  const res = await fetch(apiUrl('/api/v1/admin/enrol-secrets'), { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to load enrolment secrets (HTTP ${res.status})`);
  const data = await res.json();
  return data.secrets ?? [];
}

// Returns the plaintext secret (shown to the admin exactly once) + its metadata.
export async function generateEnrolSecret(label?: string): Promise<{ secret: string; ref: EnrolSecret }> {
  const res = await fetch(apiUrl('/api/v1/admin/enrol-secrets'), {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ label: label ?? '' }),
  });
  if (!res.ok) throw new Error(`Failed to generate enrolment secret (HTTP ${res.status})`);
  const data = await res.json();
  return { secret: data.secret, ref: data.enrol_secret };
}

export async function revokeEnrolSecret(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/admin/enrol-secrets/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to revoke enrolment secret (HTTP ${res.status})`);
}
