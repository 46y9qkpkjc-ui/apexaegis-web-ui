import { useAuthStore } from '@/lib/auth-store';

const API_BASE = '/api/v1/admin';
function authHeader() {
  const token = useAuthStore.getState().accessToken;
  return { Authorization: `Bearer ${token ?? ''}` };
}

export interface ApiPolicy {
  id: string;
  name: string;
  sequence: number;
  enabled: boolean;
  action: string;
  traffic_steering: string[];
  access_methods: string[];
  source_users: string[];
  source_user_groups: string[];
  source_devices: string[];
  source_device_groups: string[];
  source_addresses: any;
  dest_addresses: any;
  dest_cloud_apps: any;
  dest_url_categories: string[];
  services: any;
  http_methods: string[];
  ssl_profile: any;
  atp_profiles: any;
  dns_filter_enabled: boolean;
  dns_block_categories: string[];
  dns_custom_blocklist: string[];
  dns_custom_allowlist: string[];
  web_filter_enabled: boolean;
  web_block_categories: string[];
  web_custom_blocklist: string[];
  web_custom_allowlist: string[];
  log_traffic: boolean;
  [key: string]: any;
}

/** Map front-end policy shape → backend API shape */
export function toApiPolicy(p: any): Partial<ApiPolicy> {
  return {
    id: p.id,
    name: p.name,
    sequence: p.seq ?? 0,
    enabled: p.enabled ?? true,
    action: p.action,
    traffic_steering: Array.isArray(p.trafficSteering) ? p.trafficSteering : [p.trafficSteering],
    access_methods: p.accessMethod ?? [],
    source_users: p.sourceUsers ?? [],
    source_user_groups: [],
    source_devices: [],
    source_device_groups: p.sourceDeviceGroups ?? [],
    source_addresses: p.sourceAddresses ?? [],
    dest_addresses: p.destAddresses ?? [],
    dest_cloud_apps: p.destCloudApps ?? [],
    dest_url_categories: p.destUrlCategories ?? [],
    services: p.services ?? [],
    http_methods: p.httpMethods ?? [],
    ssl_profile: p.sslProfile ?? null,
    atp_profiles: p.atpProfile ? [p.atpProfile] : null,
    dns_filter_enabled: !!p.dnsFilterList,
    dns_block_categories: p.dnsFilterList ? [p.dnsFilterList] : [],
    dns_custom_blocklist: [],
    dns_custom_allowlist: [],
    web_filter_enabled: false,
    web_block_categories: [],
    web_custom_blocklist: [],
    web_custom_allowlist: [],
    log_traffic: p.logTraffic ?? true,
  };
}

/** Map backend API shape → front-end policy shape */
export function fromApiPolicy(p: ApiPolicy): any {
  return {
    id: p.id,
    seq: p.sequence,
    name: p.name,
    enabled: p.enabled,
    trafficSteering: Array.isArray(p.traffic_steering) ? p.traffic_steering[0] ?? 'internet' : 'internet',
    accessMethod: p.access_methods ?? [],
    sourceUsers: p.source_users ?? [],
    sourceDeviceGroups: p.source_device_groups ?? [],
    sourceAddresses: Array.isArray(p.source_addresses) ? p.source_addresses : [],
    destAddresses: Array.isArray(p.dest_addresses) ? p.dest_addresses : [],
    destCloudApps: Array.isArray(p.dest_cloud_apps) ? p.dest_cloud_apps : [],
    destUrlCategories: p.dest_url_categories ?? [],
    services: Array.isArray(p.services) ? p.services : [],
    httpMethods: p.http_methods ?? [],
    atpProfile: Array.isArray(p.atp_profiles) && p.atp_profiles.length > 0 ? p.atp_profiles[0] : null,
    sslProfile: p.ssl_profile ?? null,
    dnsFilterList: p.dns_filter_enabled && p.dns_block_categories?.length > 0 ? p.dns_block_categories[0] : null,
    contentInspection: null,
    activityControls: null,
    wafConfig: null,
    iapConfig: null,
    action: p.action,
    logTraffic: p.log_traffic ?? true,
  };
}

export async function fetchPolicies(): Promise<{ policies: any[]; version: number }> {
  const res = await fetch(`${API_BASE}/policies`, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to fetch policies: ${res.status}`);
  const data = await res.json();
  const policies = (data.policies ?? []).map(fromApiPolicy);
  policies.sort((a: any, b: any) => (a.seq ?? 0) - (b.seq ?? 0));
  return { policies, version: data.version ?? 0 };
}

export async function createPolicy(policy: any): Promise<{ policyId: string; version: number }> {
  const res = await fetch(`${API_BASE}/policies`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(toApiPolicy(policy)),
  });
  if (!res.ok) throw new Error(`Failed to create policy: ${res.status}`);
  const data = await res.json();
  return { policyId: data.policy_id, version: data.version };
}

export async function updatePolicy(id: string, policy: any): Promise<{ version: number }> {
  const res = await fetch(`${API_BASE}/policies/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(toApiPolicy({ ...policy, id })),
  });
  if (!res.ok) throw new Error(`Failed to update policy: ${res.status}`);
  const data = await res.json();
  return { version: data.version };
}

export async function deletePolicy(id: string): Promise<{ version: number }> {
  const res = await fetch(`${API_BASE}/policies/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  if (!res.ok) throw new Error(`Failed to delete policy: ${res.status}`);
  const data = await res.json();
  return { version: data.version };
}
