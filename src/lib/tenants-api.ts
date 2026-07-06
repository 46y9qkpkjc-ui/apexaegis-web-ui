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

export interface GhostedApp {
  name: string;
  vendor: string;
  category: string;
  device_count: number;
  risk_level: string;
  duplicates_feature: string;
  tenant_name: string;
  tenant_id: string;
}

export interface TenantDetail {
  summary: TenantSummary;
  recent_blocks: TenantLogRow[];
  policies: TenantPolicyRow[];
  ghosted_apps: GhostedApp[];
}

export async function fetchGhostedApps(): Promise<GhostedApp[]> {
  const res = await fetch('/api/v1/admin/ghosted', { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to load ghosted apps: ${res.status}`);
  return (await res.json()).ghosted_apps ?? [];
}

export async function emailReport(input: { to: string; subject: string; body: string }): Promise<void> {
  const res = await fetch('/api/v1/admin/report/email', {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.error ?? `Failed to email report: ${res.status}`);
  }
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
