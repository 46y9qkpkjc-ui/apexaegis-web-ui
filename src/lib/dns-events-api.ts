import { apiUrl } from './api-url';
import { useAuthStore } from './auth-store';

// Endpoint DNS-PEP deny log — what the on-device resolver sinkhole blocked, grouped
// by device + domain (deny count + max risk score + last-seen). Tenant scope is
// stamped by the global fetch interceptor (X-Scope-Tenant-ID); we add the bearer.
//
// Blocking happens locally on the device — this is observability only, and is
// sampled/lossy under flood by design (telemetry must never stall DNS). Treat it as
// indicative, not a billing-grade audit log.

export interface DnsEventRow {
  device_id: string;
  device_name: string;
  tenant_id: string;
  tenant_name: string;
  operator: string;
  domain: string;
  score: number; // risk 0-100; 100 = seed denylist
  count: number; // denies aggregated for this device + domain
  last_seen: string;
}

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Endpoint DNS-PEP denies grouped by device + domain (newest first) — tenant-scoped
// by the global X-Scope-Tenant-ID interceptor.
export async function listDnsEvents(): Promise<DnsEventRow[]> {
  const res = await fetch(apiUrl('/api/v1/admin/dns-events'), { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('failed to load dns events');
  const data = await res.json();
  return data.events ?? [];
}
