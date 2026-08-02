import { apiUrl } from './api-url';
import { useAuthStore } from './auth-store';

// Risk decision log + agentic-ops actions. Tenant scope is stamped by the global
// fetch interceptor (X-Scope-Tenant-ID); we add the bearer token.

export interface RiskDecision {
  id: string;
  tenant_id: string;
  tenant_name: string;
  operator: string;
  domain: string;
  cache_key: string;
  key_scope: string;
  actor_user: string;
  decision: 'allow' | 'monitor' | 'deny';
  risk_score: number;
  source: string;    // allowlist | blocklist | cache | ai | pending
  category: string;
  rationale: string;
  actioned_as: string;   // '' | 'policy' | 'ticket'
  actioned_ref: string;
  created_at: string;
  // Rich verdict fields for the risk-score card (from the live verdict cache;
  // may be empty once a verdict expires). signals is the raw emit_verdict object.
  confidence?: string;   // low | medium | high
  top_factors?: string[];
  signals?: {
    domain_age?: string;
    reputation?: string;
    dga_like?: boolean;
    geo_risk?: string;
    newly_observed?: boolean;
  };
  tools_ran?: string[];
}

// Consolidated per-domain risk activity (the main console list). Aggregates every
// hit for a (tenant, domain); decision/score/verdict reflect the latest hit.
export interface RiskDomain {
  tenant_id: string;
  tenant_name: string;
  operator: string;
  domain: string;
  decision: 'allow' | 'monitor' | 'deny';
  risk_score: number;
  source: string;
  category: string;
  hit_count: number;
  distinct_users: number;
  first_seen: string;
  last_seen: string;
  confidence?: string;
  top_factors?: string[];
  signals?: {
    domain_age?: string;
    reputation?: string;
    dga_like?: boolean;
    geo_risk?: string;
    newly_observed?: boolean;
  };
  tools_ran?: string[];
}

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Consolidated per-domain risk log (one row per domain) — tenant-scoped by the
// global X-Scope-Tenant-ID interceptor.
export async function listDomains(): Promise<RiskDomain[]> {
  const res = await fetch(apiUrl('/api/v1/admin/risk/decisions'), { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('failed to load risk decisions');
  const data = await res.json();
  return data.domains ?? [];
}

// Per-hit decisions for ONE domain — the expand/detail under a consolidated row.
export async function listDomainDecisions(domain: string): Promise<RiskDecision[]> {
  const res = await fetch(apiUrl(`/api/v1/admin/risk/decisions?domain=${encodeURIComponent(domain)}`), { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('failed to load domain decisions');
  const data = await res.json();
  return data.decisions ?? [];
}

// Promote an AI-allowed domain to a standing tenant allow policy.
export async function promotePolicy(id: string): Promise<{ key: string; key_scope: string }> {
  const res = await fetch(apiUrl(`/api/v1/admin/risk/decisions/${id}/promote-policy`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'failed to promote policy');
  }
  return res.json();
}

// Raise an internal ITSM ticket from a decision.
export async function createTicketFromDecision(id: string, ticketType = 'change_request'): Promise<{ ticket_key: string }> {
  const res = await fetch(apiUrl(`/api/v1/admin/risk/decisions/${id}/create-ticket`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ticket_type: ticketType, provider: 'internal' }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'failed to create ticket');
  }
  return res.json();
}
