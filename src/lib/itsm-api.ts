import { apiUrl } from './api-url';
import { useAuthStore } from './auth-store';

// Internal ITSM client. Tenant scope is stamped by the global fetch interceptor
// (X-Scope-Tenant-ID); we only add the bearer token here.

export interface ITSMTicket {
  id: string;
  tenant_id?: string;
  ticket_key: string;
  provider: string;      // internal | jira | servicenow
  ticket_type: string;   // service_request | change_request | incident
  status: string;
  priority: string;
  summary: string;
  description?: string;
  requester?: string;
  assignee?: string;
  // EUN Coach fields
  domain?: string;
  category?: string;
  policy_id?: string;
  device_id?: string;
  user_id?: string;
  justification?: string;
  duration_hours?: number;
  contact_method?: string;
  // AI Context Engine
  ai_decision?: string;
  ai_score?: number;
  // RBI session
  rbi_session_url?: string;
  rbi_expiry?: string;
  // Audit
  rejection_reason?: string;
  risk_decision_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTicketReq {
  provider: string;
  ticket_type: string;
  priority: string;
  summary: string;
  description?: string;
  assignee?: string;
}

export interface UpdateTicketReq {
  status?: string;
  assignee?: string;
  priority?: string;
  summary?: string;
  description?: string;
  ai_decision?: string;
  ai_score?: number;
  rbi_session_url?: string;
  rejection_reason?: string;
}

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createTicket(req: CreateTicketReq): Promise<ITSMTicket> {
  const res = await fetch(apiUrl('/api/v1/admin/itsm/tickets'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'failed to create ticket');
  }
  return res.json();
}

export async function listTickets(status?: string): Promise<{ tickets: ITSMTicket[]; total: number }> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(apiUrl(`/api/v1/admin/itsm/tickets${qs}`), { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('failed to load tickets');
  return res.json();
}

export async function getTicket(id: string): Promise<ITSMTicket> {
  const res = await fetch(apiUrl(`/api/v1/admin/itsm/tickets/${id}`), { headers: { ...authHeaders() } });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'failed to load ticket');
  }
  return res.json();
}

export async function updateTicket(id: string, updates: UpdateTicketReq): Promise<ITSMTicket> {
  const res = await fetch(apiUrl(`/api/v1/admin/itsm/tickets/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'failed to update ticket');
  }
  return res.json();
}

export async function deleteTicket(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/admin/itsm/tickets/${id}`), {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'failed to delete ticket');
  }
}

export async function getItsmStats(): Promise<{ counts: Record<string, number> }> {
  const res = await fetch(apiUrl('/api/v1/admin/itsm/stats'), { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('failed to load stats');
  return res.json();
}
