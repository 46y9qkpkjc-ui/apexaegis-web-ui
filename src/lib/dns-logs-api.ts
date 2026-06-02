// DNS Logs API client
// Provides functions to interact with the management-plane DNS logs endpoints

const API_BASE = '/api/v1/admin/dns-logs';

export interface DNSLog {
  id: string;
  client_ip: string;
  domain: string;
  query_type: string;
  verdict: 'allow' | 'block' | 'threat_detected';
  threat_level?: string;
  threat_category?: string;
  response_time_ms: number;
  response_code: number;
  created_at: string;
}

export interface DNSSummary {
  total_queries: number;
  unique_domains_count: number;
  unique_clients_count: number;
  blocked_queries: number;
  block_rate_percent: number;
  avg_response_time_ms: number;
  time_range?: string;
}

export interface DNSLogFilters {
  domain?: string;
  client_ip?: string;
  verdict?: string;
  threat_level?: string;
  start_time?: string;
  end_time?: string;
  limit?: number;
  offset?: number;
}

export interface DNSLogsResponse {
  logs: DNSLog[];
  limit: number;
  offset: number;
}

export interface DNSStatsResponse {
  stats: DNSQueryStats[];
  hours: number;
}

export interface DNSQueryStats {
  id: string;
  org_id: string;
  hour_bucket: string;
  total_queries: number;
  allowed_queries: number;
  blocked_queries: number;
  threat_detected: number;
  errors: number;
  avg_response_time_ms: number;
  max_response_time_ms: number;
  top_domains: Array<{ domain: string; count: number }>;
  top_clients: Array<{ ip: string; count: number }>;
  created_at: string;
  updated_at: string;
}

/**
 * Get DNS logs with optional filtering
 */
export async function getDNSLogs(
  filters?: DNSLogFilters,
  token?: string
): Promise<DNSLogsResponse> {
  const params = new URLSearchParams();

  if (filters?.domain) params.append('domain', filters.domain);
  if (filters?.client_ip) params.append('client_ip', filters.client_ip);
  if (filters?.verdict) params.append('verdict', filters.verdict);
  if (filters?.threat_level) params.append('threat_level', filters.threat_level);
  if (filters?.start_time) params.append('start_time', filters.start_time);
  if (filters?.end_time) params.append('end_time', filters.end_time);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  const url = `${API_BASE}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get DNS logs: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get DNS summary statistics
 */
export async function getDNSSummary(
  hoursBack: number = 24,
  token?: string
): Promise<DNSSummary> {
  const url = `${API_BASE}/summary?hours=${hoursBack}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get DNS summary: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get detailed DNS statistics
 */
export async function getDNSStats(
  hoursBack: number = 24,
  token?: string
): Promise<DNSStatsResponse> {
  const url = `${API_BASE}/stats?hours=${hoursBack}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get DNS stats: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete old DNS logs (admin operation)
 */
export async function deleteOldDNSLogs(
  daysOld: number = 30,
  token?: string
): Promise<{ deleted_count: number; days_old: number }> {
  const url = `${API_BASE}/cleanup?days=${daysOld}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete old logs: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Export DNS logs as CSV
 */
export async function exportDNSLogsAsCSV(
  filters?: DNSLogFilters,
  token?: string
): Promise<Blob> {
  const params = new URLSearchParams();

  if (filters?.domain) params.append('domain', filters.domain);
  if (filters?.client_ip) params.append('client_ip', filters.client_ip);
  if (filters?.verdict) params.append('verdict', filters.verdict);
  if (filters?.threat_level) params.append('threat_level', filters.threat_level);

  const url = `${API_BASE}/export?${params.toString()}&format=csv`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to export logs: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Format DNS verdict for display
 */
export function formatVerdict(verdict: string): string {
  switch (verdict.toLowerCase()) {
    case 'allow':
      return 'Allowed';
    case 'block':
      return 'Blocked';
    case 'threat_detected':
      return 'Threat Detected';
    default:
      return verdict;
  }
}

/**
 * Get color class for verdict badge
 */
export function getVerdictColor(verdict: string): string {
  switch (verdict.toLowerCase()) {
    case 'allow':
      return 'bg-green-100 text-green-800';
    case 'block':
      return 'bg-red-100 text-red-800';
    case 'threat_detected':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get color class for threat level badge
 */
export function getThreatLevelColor(level?: string): string {
  if (!level) return '';
  switch (level.toLowerCase()) {
    case 'critical':
      return 'bg-red-600 text-white';
    case 'high':
      return 'bg-red-400 text-white';
    case 'medium':
      return 'bg-yellow-500 text-white';
    case 'low':
      return 'bg-blue-400 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
}

/**
 * Format response time for display
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Batch stream DNS logs for real-time updates
 * Returns an async iterator that yields logs as they arrive
 */
export async function* streamDNSLogs(
  filters?: Omit<DNSLogFilters, 'limit' | 'offset'>,
  batchSize: number = 50,
  token?: string
) {
  const params = new URLSearchParams();

  if (filters?.domain) params.append('domain', filters.domain);
  if (filters?.client_ip) params.append('client_ip', filters.client_ip);
  if (filters?.verdict) params.append('verdict', filters.verdict);
  if (filters?.threat_level) params.append('threat_level', filters.threat_level);
  params.append('limit', batchSize.toString());

  let offset = 0;

  while (true) {
    params.set('offset', offset.toString());
    const url = `${API_BASE}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to stream logs: ${response.statusText}`);
    }

    const data: DNSLogsResponse = await response.json();

    for (const log of data.logs) {
      yield log;
    }

    // If we got fewer logs than requested, we've reached the end
    if (data.logs.length < batchSize) {
      break;
    }

    offset += batchSize;
  }
}
