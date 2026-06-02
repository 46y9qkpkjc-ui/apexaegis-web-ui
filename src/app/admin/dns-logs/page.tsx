'use client';

import { Fragment, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface DNSLog {
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

interface DNSSummary {
  total_queries: number;
  unique_domains_count: number;
  unique_clients_count: number;
  blocked_queries: number;
  block_rate_percent: number;
  avg_response_time_ms: number;
}

function Badge({ children, className = '' }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function Card({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">{children}</div>;
}

function CardHeader({ children, className = '' }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <div className={`mb-3 ${className}`}>{children}</div>;
}

function CardTitle({ children, className = '' }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <h2 className={`font-semibold text-gray-100 ${className}`}>{children}</h2>;
}

function CardDescription({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p className="text-sm text-gray-500">{children}</p>;
}

function CardContent({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div>{children}</div>;
}

const inputClass = 'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500/50 focus:outline-none';
const buttonClass = 'rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50';
const primaryButtonClass = 'rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500';

export default function DNSLogsPage() {
  const [logs, setLogs] = useState<DNSLog[]>([]);
  const [summary, setSummary] = useState<DNSSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [verdict, setVerdict] = useState<string>('');
  const [threatLevel, setThreatLevel] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [clientIp, setClientIp] = useState<string>('');
  const [hoursBack, setHoursBack] = useState<string>('24');
  const [limit, setLimit] = useState<string>('50');
  const [offset, setOffset] = useState<number>(0);

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchDNSData();
  }, [verdict, threatLevel, domain, clientIp, hoursBack, limit, offset]);

  const fetchDNSData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch logs
      const logsParams = new URLSearchParams({
        limit,
        offset: offset.toString(),
        ...(verdict && { verdict }),
        ...(threatLevel && { threat_level: threatLevel }),
        ...(domain && { domain }),
        ...(clientIp && { client_ip: clientIp }),
      });

      const logsResponse = await fetch(
        `/api/v1/admin/dns-logs?${logsParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!logsResponse.ok) {
        throw new Error('Failed to fetch DNS logs');
      }

      const logsData = await logsResponse.json();
      setLogs(logsData.logs || []);

      // Fetch summary
      const summaryResponse = await fetch(
        `/api/v1/admin/dns-logs/summary?hours=${hoursBack}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!summaryResponse.ok) {
        throw new Error('Failed to fetch DNS summary');
      }

      const summaryData = await summaryResponse.json();
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setVerdict('');
    setThreatLevel('');
    setDomain('');
    setClientIp('');
    setHoursBack('24');
    setLimit('50');
    setOffset(0);
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'allow':
        return <Badge className="bg-green-100 text-green-800">Allowed</Badge>;
      case 'block':
        return <Badge className="bg-red-100 text-red-800">Blocked</Badge>;
      case 'threat_detected':
        return <Badge className="bg-orange-100 text-orange-800">Threat</Badge>;
      default:
        return <Badge className="border-gray-700 text-gray-300">{verdict}</Badge>;
    }
  };

  const getThreatLevelBadge = (level?: string) => {
    if (!level) return null;
    switch (level.toLowerCase()) {
      case 'critical':
        return <Badge className="bg-red-600 text-white">Critical</Badge>;
      case 'high':
        return <Badge className="bg-red-400 text-white">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-400 text-white">Low</Badge>;
      default:
        return <Badge className="border-gray-700 text-gray-300">{level}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DNS Logs</h1>
        <p className="text-gray-500">Monitor and analyze DNS queries and threats</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_queries}</div>
              <p className="text-xs text-gray-500">Last {hoursBack}h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.block_rate_percent.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500">
                {summary.blocked_queries} queries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Domains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.unique_domains_count}
              </div>
              <p className="text-xs text-gray-500">Unique domains</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.avg_response_time_ms.toFixed(0)}ms
              </div>
              <p className="text-xs text-gray-500">Response time</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Domain</label>
              <input
                placeholder="example.com"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  setOffset(0);
                }}
                className={`mt-1 ${inputClass}`}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Client IP</label>
              <input
                placeholder="192.168.1.1"
                value={clientIp}
                onChange={(e) => {
                  setClientIp(e.target.value);
                  setOffset(0);
                }}
                className={`mt-1 ${inputClass}`}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Verdict</label>
              <select
                value={verdict}
                onChange={(e) => {
                  setVerdict(e.target.value);
                  setOffset(0);
                }}
                className={`mt-1 ${inputClass}`}
              >
                <option value="">All</option>
                <option value="allow">Allowed</option>
                <option value="block">Blocked</option>
                <option value="threat_detected">Threat</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Threat Level</label>
              <select
                value={threatLevel}
                onChange={(e) => {
                  setThreatLevel(e.target.value);
                  setOffset(0);
                }}
                className={`mt-1 ${inputClass}`}
              >
                <option value="">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Time Range</label>
              <select
                value={hoursBack}
                onChange={(e) => {
                  setHoursBack(e.target.value);
                  setOffset(0);
                }}
                className={`mt-1 ${inputClass}`}
              >
                <option value="1">Last 1h</option>
                <option value="6">Last 6h</option>
                <option value="24">Last 24h</option>
                <option value="72">Last 72h</option>
                <option value="168">Last 7d</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={fetchDNSData} className={primaryButtonClass}>
              Apply Filters
            </button>
            <button onClick={resetFilters} className={buttonClass}>
              Reset
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>DNS Query Logs</CardTitle>
          <CardDescription>
            {logs.length} of {summary?.total_queries || 0} queries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4 text-red-800">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div>{error}</div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No logs found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs uppercase text-gray-500">
                      <th className="px-3 py-2 font-medium">Time</th>
                      <th className="px-3 py-2 font-medium">Domain</th>
                      <th className="px-3 py-2 font-medium">Client IP</th>
                      <th className="px-3 py-2 font-medium">Query Type</th>
                      <th className="px-3 py-2 font-medium">Verdict</th>
                      <th className="px-3 py-2 font-medium">Response</th>
                      <th className="px-3 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <Fragment key={log.id}>
                        <tr
                          className="cursor-pointer border-b border-gray-800/70 hover:bg-gray-800/40"
                          onClick={() =>
                            setExpandedId(
                              expandedId === log.id ? null : log.id
                            )
                          }
                        >
                          <td className="px-3 py-3 text-xs text-gray-400">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 font-mono text-sm text-gray-100">
                            {log.domain}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-300">
                            {log.client_ip}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-300">{log.query_type}</td>
                          <td className="px-3 py-3">{getVerdictBadge(log.verdict)}</td>
                          <td className="px-3 py-3 text-xs text-gray-400">
                            {log.response_time_ms}ms
                          </td>
                          <td className="px-3 py-3">
                            <button
                              className={buttonClass}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedId(
                                  expandedId === log.id ? null : log.id
                                );
                              }}
                            >
                              {expandedId === log.id ? 'Hide' : 'Details'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {expandedId === log.id && (
                          <tr className="border-b border-gray-800 bg-gray-950/70">
                            <td colSpan={7} className="px-3 py-3">
                              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 p-4 text-sm">
                                <div>
                                  <div className="font-medium text-gray-500">
                                    Response Code
                                  </div>
                                  <div className="text-gray-200">
                                    {log.response_code}
                                  </div>
                                </div>

                                {log.threat_level && (
                                  <div>
                                    <div className="font-medium text-gray-500">
                                      Threat Level
                                    </div>
                                    <div>
                                      {getThreatLevelBadge(log.threat_level)}
                                    </div>
                                  </div>
                                )}

                                {log.threat_category && (
                                  <div>
                                    <div className="font-medium text-gray-500">
                                      Category
                                    </div>
                                    <div className="text-gray-200">
                                      {log.threat_category}
                                    </div>
                                  </div>
                                )}

                                <div className="col-span-full">
                                  <div className="font-medium text-gray-500">
                                    Log ID
                                  </div>
                                  <div className="font-mono text-xs text-gray-300 break-all">
                                    {log.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(e.target.value);
                    setOffset(0);
                  }}
                  className={`w-24 ${inputClass}`}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>

                <div className="flex gap-2">
                  <button
                    className={buttonClass}
                    onClick={() => setOffset(Math.max(0, offset - parseInt(limit)))}
                    disabled={offset === 0}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500 self-center">
                    {offset + 1} -{' '}
                    {Math.min(offset + parseInt(limit), logs.length)}
                  </span>
                  <button
                    className={buttonClass}
                    onClick={() => setOffset(offset + parseInt(limit))}
                    disabled={offset + parseInt(limit) >= (summary?.total_queries || 0)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
