// Unified Logs API - integrates DNS logs with main Logs & Events page
// Maps DNS logs to the unified LogEntry format used in /app/logs/page.tsx

import type { DNSAccessLog, DNSLogFilters } from './dns-logs-api';
import { getDNSLogs, getDNSSummary } from './dns-logs-api';

/**
 * Unified LogEntry format used across the entire logging system
 * This matches the LogEntry type in /app/logs/page.tsx
 */
export interface UnifiedLogEntry {
  id: string;
  timestamp: string;
  user: string; // For DNS: "system" or "dnsfilter"
  sourceIp: string; // Client IP for DNS
  action: 'allow' | 'deny' | 'monitor' | 'dns-block';
  destination: string; // Domain for DNS
  category: string; // threat category for DNS
  policyName: string;
  bytesIn: number;
  bytesOut: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  gatewayRegion: string;
  logType: 'dns' | 'traffic' | 'ssl' | 'dlp'; // Distinguish log types
  // DNS-specific fields
  dnsSpecific?: {
    queryType: string;
    threatLevel: string;
    responseCode: number;
    responseTimeMs: number;
    threatCategory: string;
  };
}

/**
 * Convert a DNS log to unified LogEntry format
 */
export function convertDNSLogToUnified(dnsLog: DNSAccessLog): UnifiedLogEntry {
  // Map DNS verdict to action
  const actionMap: Record<string, 'allow' | 'deny' | 'monitor' | 'dns-block'> = {
    allow: 'allow',
    block: 'dns-block',
    threat_detected: 'dns-block',
  };

  // Map threat level to severity
  const severityMap: Record<string, 'critical' | 'high' | 'medium' | 'low' | 'info'> = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
    none: 'info',
  };

  return {
    id: dnsLog.id,
    timestamp: dnsLog.created_at,
    user: 'dnsfilter', // System user for DNS
    sourceIp: dnsLog.client_ip,
    action: dnsLog.action as any || actionMap[dnsLog.verdict] || 'allow',
    destination: dnsLog.domain,
    category: dnsLog.threat_category || 'DNS Query',
    policyName: dnsLog.policy_name || 'Default DNS Policy',
    bytesIn: 0, // DNS doesn't track bytes
    bytesOut: dnsLog.response_code ? 64 : 0, // Typical DNS response size
    severity: dnsLog.severity as any || severityMap[dnsLog.threat_level] || 'low',
    gatewayRegion: 'us-east-1', // Default region (would be set by gateway)
    logType: 'dns',
    dnsSpecific: {
      queryType: dnsLog.query_type,
      threatLevel: dnsLog.threat_level || 'none',
      responseCode: dnsLog.response_code || 0,
      responseTimeMs: dnsLog.response_time_ms,
      threatCategory: dnsLog.threat_category || '',
    },
  };
}

/**
 * Get DNS logs formatted as unified log entries
 */
export async function getDNSLogsUnified(
  filters?: DNSLogFilters,
  token?: string
): Promise<UnifiedLogEntry[]> {
  try {
    const response = await getDNSLogs(filters, token);
    return response.logs.map(convertDNSLogToUnified);
  } catch (error) {
    console.error('Failed to fetch unified DNS logs:', error);
    return [];
  }
}

/**
 * Get combined view of DNS and traffic logs
 * (Future: will combine with traffic logs from other sources)
 */
export async function getUnifiedLogs(
  includeDns: boolean = true,
  includeTraffic: boolean = true,
  token?: string
): Promise<UnifiedLogEntry[]> {
  const logs: UnifiedLogEntry[] = [];

  // Get DNS logs
  if (includeDns) {
    const dnsLogs = await getDNSLogsUnified({}, token);
    logs.push(...dnsLogs);
  }

  // TODO: Get traffic logs from traffic-logs-api when available
  // if (includeTraffic) {
  //   const trafficLogs = await getTrafficLogsUnified({}, token);
  //   logs.push(...trafficLogs);
  // }

  // Sort by timestamp descending
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return logs;
}

/**
 * Get DNS logs by action type
 */
export async function getDNSLogsByAction(
  action: 'allow' | 'deny' | 'monitor' | 'dns-block',
  token?: string
): Promise<UnifiedLogEntry[]> {
  // Convert UI action to DNS action
  const actionToDnsAction: Record<string, string> = {
    'dns-block': 'block',
    'monitor': 'monitor',
    'allow': 'allow',
    'deny': 'block',
  };

  const filters: DNSLogFilters = {
    action: actionToDnsAction[action],
  };

  return getDNSLogsUnified(filters, token);
}

/**
 * Get DNS logs by severity
 */
export async function getDNSLogsBySeverity(
  severity: 'critical' | 'high' | 'medium' | 'low',
  token?: string
): Promise<UnifiedLogEntry[]> {
  // DNS logs store threat_level, not severity
  const levelMap: Record<string, string> = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
  };

  const filters: DNSLogFilters = {
    threat_level: levelMap[severity],
  };

  return getDNSLogsUnified(filters, token);
}

/**
 * Get DNS logs by domain
 */
export async function getDNSLogsByDomain(
  domain: string,
  token?: string
): Promise<UnifiedLogEntry[]> {
  const filters: DNSLogFilters = {
    domain,
  };

  return getDNSLogsUnified(filters, token);
}

/**
 * Get DNS logs by client IP
 */
export async function getDNSLogsByClientIP(
  clientIp: string,
  token?: string
): Promise<UnifiedLogEntry[]> {
  const filters: DNSLogFilters = {
    client_ip: clientIp,
  };

  return getDNSLogsUnified(filters, token);
}

/**
 * AI-friendly DNS log summary
 */
export async function getDNSSummaryForAI(
  token?: string
): Promise<Record<string, any>> {
  try {
    const summary = await getDNSSummary(24, token);
    const logs = await getDNSLogsUnified({}, token);

    // Analyze logs
    const blockCount = logs.filter(l => l.action === 'dns-block').length;
    const criticalCount = logs.filter(l => l.severity === 'critical').length;
    const highCount = logs.filter(l => l.severity === 'high').length;

    // Get top blocked domains
    const domainCounts: Record<string, number> = {};
    logs
      .filter(l => l.action === 'dns-block')
      .forEach(l => {
        domainCounts[l.destination] = (domainCounts[l.destination] || 0) + 1;
      });
    const topBlockedDomains = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    // Get top clients
    const clientCounts: Record<string, number> = {};
    logs.forEach(l => {
      clientCounts[l.sourceIp] = (clientCounts[l.sourceIp] || 0) + 1;
    });
    const topClients = Object.entries(clientCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    return {
      ...summary,
      blockCount,
      criticalCount,
      highCount,
      topBlockedDomains,
      topClients,
    };
  } catch (error) {
    console.error('Failed to get DNS summary for AI:', error);
    return {};
  }
}

/**
 * Format DNS log for display in main logs table
 */
export function formatDNSLogForDisplay(log: UnifiedLogEntry): string {
  if (!log.dnsSpecific) return '';

  return `Query: ${log.destination} | Type: ${log.dnsSpecific.queryType} | Response: ${log.dnsSpecific.responseTimeMs}ms | Level: ${log.dnsSpecific.threatLevel}`;
}

/**
 * Create a policy recommendation from a DNS log
 */
export function createPolicyRecommendationFromDNSLog(
  log: UnifiedLogEntry
): { name: string; description: string; action: 'allow' | 'deny' | 'monitor' } {
  if (!log.dnsSpecific) {
    return {
      name: 'Block Unknown Domain',
      description: `Block queries to ${log.destination}`,
      action: 'deny',
    };
  }

  const threatCategory = log.dnsSpecific.threatCategory || log.category;
  const domain = log.destination;

  return {
    name: `Block ${threatCategory} — ${domain}`,
    description: `Block DNS queries to ${domain} (Threat: ${log.dnsSpecific.threatLevel}, Category: ${threatCategory})`,
    action: 'deny',
  };
}
