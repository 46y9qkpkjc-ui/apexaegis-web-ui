// IdP Configuration Logs API Client

export interface IdPConfigLog {
  id: string;
  idp_id: string;
  provider_type: string; // okta, azure_ad, google, saml, ldap, ping
  provider_name: string;
  event_type: string; // create, update, test, enable, disable
  action_by: string;
  status: string; // success, failure
  test_result?: string; // success, failed_auth, failed_network, timeout
  error_message?: string;
  action_timestamp: string; // ISO 8601
}

export interface LogsSummary {
  by_provider: ProviderStats[];
}

export interface ProviderStats {
  provider_type: string;
  total_events: number;
  successful_events: number;
  failed_events: number;
  last_event: string; // ISO 8601
}

export interface LogFilters {
  provider_type?: string;
  event_type?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch IdP configuration logs
 */
export async function getLogs(filters: LogFilters = {}): Promise<IdPConfigLog[]> {
  const params = new URLSearchParams();

  if (filters.provider_type) params.append('provider_type', filters.provider_type);
  if (filters.event_type) params.append('event_type', filters.event_type);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const response = await fetch(
    `/api/v1/admin/idp/logs?${params.toString()}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch logs: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetch logs summary
 */
export async function getLogsSummary(): Promise<LogsSummary> {
  const response = await fetch(`/api/v1/admin/idp/logs/summary`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch summary: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetch logs for specific provider
 */
export async function getProviderLogs(
  providerType: string,
  limit: number = 100,
  offset: number = 0
): Promise<IdPConfigLog[]> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(
    `/api/v1/admin/idp/logs/provider/${providerType}?${params.toString()}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch provider logs: ${response.status}`);
  }

  return await response.json();
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get provider type display name
 */
export function getProviderTypeName(type: string): string {
  const names: Record<string, string> = {
    okta: 'Okta',
    azure_ad: 'Entra ID',
    google: 'Google',
    saml: 'SAML',
    ldap: 'LDAP/AD',
    ping: 'Ping Identity',
  };
  return names[type] || type;
}

/**
 * Get event type display name and color
 */
export function getEventTypeInfo(type: string): {
  name: string;
  color: string;
} {
  const info: Record<string, { name: string; color: string }> = {
    create: { name: 'Created', color: 'bg-green-900/30 text-green-300 border-green-800' },
    update: { name: 'Updated', color: 'bg-blue-900/30 text-blue-300 border-blue-800' },
    test: { name: 'Test', color: 'bg-purple-900/30 text-purple-300 border-purple-800' },
    enable: { name: 'Enabled', color: 'bg-green-900/30 text-green-300 border-green-800' },
    disable: { name: 'Disabled', color: 'bg-orange-900/30 text-orange-300 border-orange-800' },
    delete: { name: 'Deleted', color: 'bg-red-900/30 text-red-300 border-red-800' },
  };
  return info[type] || { name: type, color: 'bg-gray-900/30 text-gray-300 border-gray-800' };
}
