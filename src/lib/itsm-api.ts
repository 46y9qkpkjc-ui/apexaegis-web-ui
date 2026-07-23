import { apiUrl } from './api-url';
import { useAuthStore } from './auth-store';

// Internal ITSM client. Tenant scope is stamped by the global fetch interceptor
// (X-Scope-Tenant-ID); we only add the bearer token here.

export interface ITSMTicket {
  id: string;
  tenant_name?: string;
  operator?: string;
  ticket_key: string;
  provider: string;      // internal | jira | servicenow
  ticket_type: string;   // service_request | change_request | incident
  status: string;
  priority: string;
  summary: string;
  description?: string;
  requester?: string;
  assignee?: string;
  risk_decision_id?: string;
  created_at?: string;
}

export interface CreateTicketReq {
  provider: string;
  ticket_type: string;
  priority: string;
  summary: string;
  description?: string;
  assignee?: string;
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

export async function listTickets(): Promise<ITSMTicket[]> {
  const res = await fetch(apiUrl('/api/v1/admin/itsm/tickets'), { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('failed to load tickets');
  const data = await res.json();
  return data.tickets ?? [];
}
