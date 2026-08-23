import { useAuthStore } from '@/lib/auth-store';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1`;

function authHeader(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface RegistrationCode {
  id: string;
  code: string;
  tenant_id: string;
  tenant_name: string;
  gateway_type: 'private-access' | 'internet-swg';
  description: string;
  created_at: string;
  expires_at: string;
  status: 'active' | 'used' | 'expired' | 'revoked';
  used_by_gateway_id?: string;
  used_at?: string;
}

export interface GenerateCodeInput {
  tenant_id: string;
  gateway_type: 'private-access' | 'internet-swg';
  description?: string;
}

export async function generateRegistrationCode(input: GenerateCodeInput): Promise<RegistrationCode> {
  const res = await fetch(`${API_BASE}/admin/gateway-reg/codes`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to generate code: ${res.status}`);
  return res.json();
}

export async function fetchRegistrationCodes(): Promise<RegistrationCode[]> {
  const res = await fetch(`${API_BASE}/admin/gateway-reg/codes`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error(`Failed to fetch codes: ${res.status}`);
  return (await res.json()).codes ?? [];
}

export async function revokeRegistrationCode(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/gateway-reg/codes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  if (!res.ok) throw new Error(`Failed to revoke code: ${res.status}`);
}
