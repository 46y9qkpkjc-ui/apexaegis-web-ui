import { apiUrl } from './api-url';
import { useAuthStore } from './auth-store';

// Per-device / per-user network telemetry log. Tenant scope is stamped by the
// global fetch interceptor (X-Scope-Tenant-ID); we add the bearer token.
//
// The endpoint returns a LOG (newest first) — one row per polled sample per
// device/user, reported by the agent every couple of minutes.

export interface NetworkEventRow {
  device_id: string;
  device_name: string;
  tenant_id: string;
  tenant_name: string;
  operator: string;
  reported_at: string;
  login_user: string;
  iface: string;
  kind: string;          // 'wifi' | 'ethernet' | 'cellular'
  ssid: string;
  signal_pct: number;
  rssi_dbm: number;
  link_mbps: number;
  source_ip: string;
  gateway_ip: string;
  dot1x_state: string;
  latency_ms: number;
  loss_pct: number;
  bandwidth_mbps: number;
  last_mile_score: number;
}

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Per-device / per-user network telemetry log (newest first) — tenant-scoped by
// the global X-Scope-Tenant-ID interceptor.
export async function listNetworkEvents(): Promise<NetworkEventRow[]> {
  const res = await fetch(apiUrl('/api/v1/admin/network-events'), { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('failed to load network events');
  const data = await res.json();
  return data.events ?? [];
}
