// AD-sync connector admin API client.
// Talks to the management plane's /api/v1/admin/connectors/* endpoints (JWT auth).
import { apiUrl } from '@/lib/api-url';
import { useAuthStore } from '@/lib/auth-store';

// Single connector today; the backend is keyed by connector_id.
export const AD_CONNECTOR_ID = 'ad-connector';

export interface AdConnectorConfig {
  connector_id: string;
  domain: string;
  dc_addr: string;
  base_dn: string;
  bind_dn: string;
  user_filter: string;
  group_filter: string;
  sync_interval: string;
  tls_insecure: boolean;
  user_count: number;
  group_count: number;
  last_synced_at: string | null;
}

export type AdConnectorConfigInput = Pick<
  AdConnectorConfig,
  'domain' | 'dc_addr' | 'base_dn' | 'bind_dn' | 'user_filter' | 'group_filter' | 'sync_interval' | 'tls_insecure'
>;

export interface AdUser {
  sid: string;
  upn: string;
  sam_account_name: string;
  display_name: string;
  email: string;
  enabled: boolean;
  group_sids: string[];
}

export interface AdGroup {
  sid: string;
  name: string;
  sam_account_name: string;
  sync_enabled: boolean;
}

function authHeaders(json = false): Record<string, string> {
  const token = useAuthStore.getState().accessToken ?? '';
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function readError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({ error: fallback }));
  return body.error || fallback;
}

function base(id: string): string {
  return `/api/v1/admin/connectors/${encodeURIComponent(id)}`;
}

export async function getConnectorConfig(id = AD_CONNECTOR_ID): Promise<AdConnectorConfig> {
  const res = await fetch(apiUrl(`${base(id)}/config`), { headers: authHeaders() });
  if (res.status === 404) throw new Error('This connector has no configuration yet — set it below and save.');
  if (!res.ok) throw new Error(await readError(res, `Failed to load config (HTTP ${res.status})`));
  return res.json();
}

export async function saveConnectorConfig(input: AdConnectorConfigInput, id = AD_CONNECTOR_ID): Promise<AdConnectorConfig> {
  const res = await fetch(apiUrl(`${base(id)}/config`), {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res, `Failed to save config (HTTP ${res.status})`));
  return res.json();
}

export async function listConnectorUsers(search = '', id = AD_CONNECTOR_ID): Promise<{ users: AdUser[]; total: number }> {
  const q = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(apiUrl(`${base(id)}/users${q}`), { headers: authHeaders() });
  if (!res.ok) throw new Error(await readError(res, `Failed to load users (HTTP ${res.status})`));
  const body = await res.json();
  return { users: body.users ?? [], total: body.total ?? 0 };
}

export async function listConnectorGroups(search = '', id = AD_CONNECTOR_ID): Promise<{ groups: AdGroup[]; total: number }> {
  const q = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(apiUrl(`${base(id)}/groups${q}`), { headers: authHeaders() });
  if (!res.ok) throw new Error(await readError(res, `Failed to load groups (HTTP ${res.status})`));
  const body = await res.json();
  return { groups: body.groups ?? [], total: body.total ?? 0 };
}

// setGroupSyncEnabled toggles whether a group flows into the system (is bridged
// into native policy groups). The backend re-bridges immediately.
export async function setGroupSyncEnabled(sid: string, enabled: boolean, id = AD_CONNECTOR_ID): Promise<void> {
  const res = await fetch(apiUrl(`${base(id)}/groups/${encodeURIComponent(sid)}/sync`), {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error(await readError(res, `Failed to update group (HTTP ${res.status})`));
}
