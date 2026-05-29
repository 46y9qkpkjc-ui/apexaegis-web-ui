import { useAuthStore } from '@/lib/auth-store';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1`;

function authHeader(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Shape returned by GET /api/v1/admin/gateways
export interface ApiGateway {
  id: string;
  name: string;
  region: string;
  location: string;
  country: string;
  provider: string;
  public_host: string;
  quic_endpoint: string;
  tls_endpoint: string;
  ping_endpoint: string;
  version: string;
  status: string;        // "online" | "offline" | "degraded"
  deploy_mode: string;
  mtls_issued: boolean;
  policy_version: number;
  last_heartbeat: string;
  registered_at: string;
}

export async function fetchGateways(): Promise<ApiGateway[]> {
  const res = await fetch(`${API_BASE}/admin/gateways`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error(`Failed to fetch gateways: ${res.status}`);
  const data = await res.json();
  return data.gateways ?? [];
}
