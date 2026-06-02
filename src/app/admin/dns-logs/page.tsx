'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Shield } from 'lucide-react';

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
        return <Badge variant="outline">{verdict}</Badge>;
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
        return <Badge variant="outline">{level}</Badge>;
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
              <Input
                placeholder="example.com"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  setOffset(0);
                }}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Client IP</label>
              <Input
                placeholder="192.168.1.1"
                value={clientIp}
                onChange={(e) => {
                  setClientIp(e.target.value);
                  setOffset(0);
                }}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Verdict</label>
              <Select value={verdict} onValueChange={(v) => {
                setVerdict(v);
                setOffset(0);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="allow">Allowed</SelectItem>
                  <SelectItem value="block">Blocked</SelectItem>
                  <SelectItem value="threat_detected">Threat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Threat Level</label>
              <Select value={threatLevel} onValueChange={(v) => {
                setThreatLevel(v);
                setOffset(0);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Time Range</label>
              <Select value={hoursBack} onValueChange={(v) => {
                setHoursBack(v);
                setOffset(0);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 1h</SelectItem>
                  <SelectItem value="6">Last 6h</SelectItem>
                  <SelectItem value="24">Last 24h</SelectItem>
                  <SelectItem value="72">Last 72h</SelectItem>
                  <SelectItem value="168">Last 7d</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={fetchDNSData} variant="default">
              Apply Filters
            </Button>
            <Button onClick={resetFilters} variant="outline">
              Reset
            </Button>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Client IP</TableHead>
                      <TableHead>Query Type</TableHead>
                      <TableHead>Verdict</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <div key={log.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() =>
                            setExpandedId(
                              expandedId === log.id ? null : log.id
                            )
                          }
                        >
                          <TableCell className="text-xs">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.domain}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.client_ip}
                          </TableCell>
                          <TableCell className="text-sm">{log.query_type}</TableCell>
                          <TableCell>{getVerdictBadge(log.verdict)}</TableCell>
                          <TableCell className="text-xs">
                            {log.response_time_ms}ms
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedId(
                                  expandedId === log.id ? null : log.id
                                );
                              }}
                            >
                              {expandedId === log.id ? 'Hide' : 'Details'}
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Expanded row */}
                        {expandedId === log.id && (
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={7}>
                              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 p-4 text-sm">
                                <div>
                                  <div className="font-medium text-gray-600">
                                    Response Code
                                  </div>
                                  <div className="text-gray-900">
                                    {log.response_code}
                                  </div>
                                </div>

                                {log.threat_level && (
                                  <div>
                                    <div className="font-medium text-gray-600">
                                      Threat Level
                                    </div>
                                    <div>
                                      {getThreatLevelBadge(log.threat_level)}
                                    </div>
                                  </div>
                                )}

                                {log.threat_category && (
                                  <div>
                                    <div className="font-medium text-gray-600">
                                      Category
                                    </div>
                                    <div className="text-gray-900">
                                      {log.threat_category}
                                    </div>
                                  </div>
                                )}

                                <div className="col-span-full">
                                  <div className="font-medium text-gray-600">
                                    Log ID
                                  </div>
                                  <div className="font-mono text-xs text-gray-700 break-all">
                                    {log.id}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </div>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <Select value={limit} onValueChange={(v) => {
                  setLimit(v);
                  setOffset(0);
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setOffset(Math.max(0, offset - parseInt(limit)))}
                    disabled={offset === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    {offset + 1} -{' '}
                    {Math.min(offset + parseInt(limit), logs.length)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setOffset(offset + parseInt(limit))}
                    disabled={offset + parseInt(limit) >= (summary?.total_queries || 0)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
