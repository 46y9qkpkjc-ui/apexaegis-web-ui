import { apiUrl } from './api-url';
import { useAuthStore } from './auth-store';

// Security-events console feed. Real events come from domain-risk adjudications,
// so sourceIp/bytesIn/bytesOut/gatewayRegion may be '' or 0 and action is
// allow/deny/monitor. Tenant scope is stamped by the global fetch interceptor
// (X-Scope-Tenant-ID); we add the bearer token.

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  sourceIp: string;
  action: 'allow' | 'deny' | 'monitor' | 'dns-block';
  destination: string;
  category: string;
  policyName: string;
  bytesIn: number;
  bytesOut: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  gatewayRegion: string;
}

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Tenant-scoped security events (the console list) — scoped by the global
// X-Scope-Tenant-ID interceptor. When "All Tenants" is selected the interceptor
// sends no header and the backend returns the caller's full breadth.
export async function listSecurityEvents(): Promise<LogEntry[]> {
  const res = await fetch(apiUrl('/api/v1/admin/security-events'), { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('failed to load security events');
  const data = await res.json();
  return data.events ?? [];
}
