// Client Configuration API Client
import { apiUrl } from '@/lib/api-url';
import { useAuthStore } from '@/lib/auth-store';

export type ClientGroupConfig = any; // Import from page component

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function authHeaders(json = false): Record<string, string> {
  const token = useAuthStore.getState().accessToken ?? '';
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

/**
 * Fetch client configuration for a specific group
 */
export async function getClientConfig(groupId: string): Promise<ClientGroupConfig> {
  const response = await fetch(apiUrl(`/api/v1/admin/client-config/${groupId}`), {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch client config: HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Save/update client configuration for a group
 */
export async function saveClientConfig(groupId: string, config: ClientGroupConfig): Promise<ClientGroupConfig> {
  const response = await fetch(apiUrl(`/api/v1/admin/client-config/${groupId}`), {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to save config' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * List all client configurations for the organization
 */
export async function listClientConfigs(): Promise<ClientGroupConfig[]> {
  const response = await fetch(apiUrl('/api/v1/admin/client-config'), {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch client configs: HTTP ${response.status}`);
  }

  return asArray<ClientGroupConfig>(await response.json());
}

/**
 * Create a new client configuration group
 */
export async function createClientConfig(config: ClientGroupConfig): Promise<ClientGroupConfig> {
  const response = await fetch(apiUrl('/api/v1/admin/client-config'), {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create config' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetch audit logs for client configuration changes
 */
export async function getClientConfigAuditLogs(
  groupId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  const params = new URLSearchParams();
  if (groupId) params.append('group_id', groupId);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(apiUrl(`/api/v1/admin/client-config/audit-logs?${params.toString()}`), {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch audit logs: HTTP ${response.status}`);
  }

  return asArray<any>(await response.json());
}

/**
 * Validate client configuration before saving
 */
export async function validateClientConfig(config: ClientGroupConfig): Promise<{ valid: boolean; errors: string[] }> {
  const response = await fetch(apiUrl('/api/v1/admin/client-config/validate'), {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error(`Validation failed: HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Delete a client configuration group
 */
export async function deleteClientConfig(groupId: string): Promise<void> {
  const response = await fetch(apiUrl(`/api/v1/admin/client-config/${groupId}`), {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete config: HTTP ${response.status}`);
  }
}
