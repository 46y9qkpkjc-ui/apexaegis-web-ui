import { useAuthStore } from '@/lib/auth-store';

const API_BASE = '/api/v1/admin/tenants';

function authHeader() {
  const token = useAuthStore.getState().accessToken;
  return { Authorization: `Bearer ${token ?? ''}` };
}

// Every tenant is identified by Tenant ID + Tenant Name — never a bare org id.
export interface TenantSummary {
  tenant_id: string;
  tenant_name: string;
  tenant_type: string;
  plan: string;
  region: string;
  status: string;
  admins: number;
  client_users: number;
  policies: number;
  devices: number;
  dns_total: number;
  dns_blocked: number;
}

export interface TenantLogRow {
  domain: string;
  verdict: string;
  action: string;
  policy_name: string;
  threat_category: string;
  client_ip: string;
  created_at: string;
}

export interface TenantPolicyRow {
  id: string;
  name: string;
  action: string;
  sequence: number;
  enabled: boolean;
}

export interface TenantDetail {
  summary: TenantSummary;
  recent_blocks: TenantLogRow[];
  policies: TenantPolicyRow[];
}

export async function fetchTenantSummaries(): Promise<TenantSummary[]> {
  const res = await fetch(API_BASE, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to load tenants: ${res.status}`);
  return (await res.json()).tenants ?? [];
}

export async function fetchTenantDetail(id: string): Promise<TenantDetail> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to load tenant: ${res.status}`);
  return res.json();
}

export interface PolicyDetail {
  id: string;
  tenant_id: string;
  tenant_name: string;
  name: string;
  action: string;
  sequence: number;
  enabled: boolean;
  cloud_apps: string;
  url_categories: string;
  groups: string;
}

export async function fetchPolicyDetail(id: string): Promise<PolicyDetail> {
  const res = await fetch(`/api/v1/admin/policy/${encodeURIComponent(id)}`, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to load policy: ${res.status}`);
  return res.json();
}
