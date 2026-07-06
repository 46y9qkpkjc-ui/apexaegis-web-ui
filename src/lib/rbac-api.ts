import { useAuthStore } from '@/lib/auth-store';

const API_BASE = '/api/v1/admin/rbac';

function authHeader() {
  const token = useAuthStore.getState().accessToken;
  return { Authorization: `Bearer ${token ?? ''}` };
}

function jsonHeaders() {
  return { ...authHeader(), 'Content-Type': 'application/json' };
}

export interface RbacPage {
  slug: string;
  label: string;
  category: string;
  sort_order: number;
}

export interface PageGrant {
  page_slug: string;
  can_view: boolean;
  can_edit: boolean;
}

export interface RbacRole {
  id: string;
  org_id: string | null; // null = global / MSP role
  org_name: string;      // "" for global roles
  name: string;
  description: string;
  is_system: boolean;
  pages: PageGrant[];
}

export interface Tenant {
  id: string;
  name: string;
}

export interface EffectivePages {
  controlled: boolean; // false = show every page (super_admin / unmapped role)
  pages: string[];     // viewable page slugs when controlled
}

export async function fetchEffectivePages(): Promise<EffectivePages> {
  const res = await fetch(`${API_BASE}/effective-pages`, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to fetch effective pages: ${res.status}`);
  return res.json();
}

export async function fetchTenants(): Promise<Tenant[]> {
  const res = await fetch(`${API_BASE}/tenants`, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to fetch tenants: ${res.status}`);
  return (await res.json()).tenants ?? [];
}

export async function fetchPages(): Promise<RbacPage[]> {
  const res = await fetch(`${API_BASE}/pages`, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to fetch pages: ${res.status}`);
  return (await res.json()).pages ?? [];
}

// scope: 'all' | 'global' | '<tenant uuid>'
export async function fetchRoles(scope: string): Promise<RbacRole[]> {
  const res = await fetch(`${API_BASE}/roles?tenant_id=${encodeURIComponent(scope)}`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);
  return (await res.json()).roles ?? [];
}

export async function createRole(input: {
  name: string;
  tenant_id: string; // '' or 'global' => global role
  description: string;
}): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/roles`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.error ?? `Failed to create role: ${res.status}`);
  }
  return res.json();
}

export async function updateRole(
  id: string,
  input: { name: string; description: string; pages: PageGrant[] },
): Promise<void> {
  const res = await fetch(`${API_BASE}/roles/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.error ?? `Failed to update role: ${res.status}`);
  }
}

export async function deleteRole(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/roles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  if (!res.ok) throw new Error(`Failed to delete role: ${res.status}`);
}
