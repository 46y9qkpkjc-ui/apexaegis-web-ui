'use client';
import React, { useState, useMemo } from 'react';
import {
  FileText, Search, Filter, RefreshCw, ChevronDown, ChevronRight,
  Shield, AlertTriangle, Clock, User, Server, Lock, Settings,
  GitBranch, ArrowLeftRight, Eye, History, Unlock, Download,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ─────────────────────────────────────────────────── */
interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: string;
  severity: 'info' | 'warning' | 'critical';
  actor: string;
  actorIp: string;
  resource: string;
  action: string;
  orgId: string;
  success: boolean;
  errorMsg?: string;
  details?: Record<string, unknown>;
}

interface ConfigVersion {
  version: number;
  author: string;
  message: string;
  change_type: string;
  policy_id?: string;
  created_at: string;
  policies: Policy[];
}

interface Policy {
  id: string;
  name: string;
  enabled: boolean;
  action: string;
  sequence: number;
  [key: string]: unknown;
}

interface ConfigLock {
  locked_by: string;
  locked_at: string;
  expires_at: string;
}

/* ─── Demo data ─────────────────────────────────────────────── */
const demoAuditLogs: AuditEntry[] = [
  { id: 'a1', timestamp: '2026-03-14T08:12:33Z', eventType: 'policy_change', severity: 'warning', actor: 'admin@acme.com', actorIp: '10.0.1.5', resource: 'policy/block-malware-domains', action: 'update', orgId: 'acme-corp', success: true },
  { id: 'a2', timestamp: '2026-03-14T08:10:05Z', eventType: 'authentication', severity: 'info', actor: 'admin@acme.com', actorIp: '10.0.1.5', resource: 'session', action: 'login', orgId: 'acme-corp', success: true },
  { id: 'a3', timestamp: '2026-03-14T07:55:12Z', eventType: 'config_revert', severity: 'critical', actor: 'secops@acme.com', actorIp: '10.0.2.10', resource: 'config/v8', action: 'revert', orgId: 'acme-corp', success: true },
  { id: 'a4', timestamp: '2026-03-14T07:30:44Z', eventType: 'certificate_issued', severity: 'info', actor: 'system', actorIp: '127.0.0.1', resource: 'cert/gw-sg-01', action: 'issue', orgId: 'acme-corp', success: true },
  { id: 'a5', timestamp: '2026-03-14T07:15:00Z', eventType: 'policy_change', severity: 'warning', actor: 'admin@acme.com', actorIp: '10.0.1.5', resource: 'policy/ssl-inspect-all', action: 'create', orgId: 'acme-corp', success: true },
  { id: 'a6', timestamp: '2026-03-14T06:45:22Z', eventType: 'gateway_operation', severity: 'info', actor: 'system', actorIp: '10.10.1.1', resource: 'gateway/gw-sg-01', action: 'health_check', orgId: 'acme-corp', success: true },
  { id: 'a7', timestamp: '2026-03-14T06:30:11Z', eventType: 'scanner_run', severity: 'info', actor: 'secops@acme.com', actorIp: '10.0.2.10', resource: 'scanner/tls', action: 'scan_all', orgId: 'acme-corp', success: true },
  { id: 'a8', timestamp: '2026-03-14T06:00:00Z', eventType: 'admin_action', severity: 'warning', actor: 'admin@acme.com', actorIp: '10.0.1.5', resource: 'config/lock', action: 'acquire', orgId: 'acme-corp', success: true },
  { id: 'a9', timestamp: '2026-03-14T05:45:33Z', eventType: 'dot1x_auth', severity: 'info', actor: 'switch-01', actorIp: '10.20.1.1', resource: 'port/GigE0/1', action: 'authenticate', orgId: 'acme-corp', success: true },
  { id: 'a10', timestamp: '2026-03-14T05:30:15Z', eventType: 'policy_change', severity: 'warning', actor: 'devops@acme.com', actorIp: '10.0.3.8', resource: 'policy/allow-dev-exceptions', action: 'delete', orgId: 'acme-corp', success: false, errorMsg: 'config locked by admin@acme.com' },
  { id: 'a11', timestamp: '2026-03-14T05:00:00Z', eventType: 'segment_change', severity: 'warning', actor: 'admin@acme.com', actorIp: '10.0.1.5', resource: 'segment/pci-zone', action: 'update', orgId: 'acme-corp', success: true },
  { id: 'a12', timestamp: '2026-03-14T04:30:00Z', eventType: 'mesh_change', severity: 'info', actor: 'system', actorIp: '10.10.1.1', resource: 'mesh/gw-syd-01', action: 'peer_register', orgId: 'acme-corp', success: true },
];

const demoVersions: ConfigVersion[] = [
  { version: 10, author: 'admin@acme.com', message: 'Policy updated: Block Known Malware Domains', change_type: 'update', policy_id: 'block-malware-domains', created_at: '2026-03-14T08:12:33Z', policies: [
    { id: 'block-malware-domains', name: 'Block Known Malware Domains', enabled: true, action: 'deny', sequence: 10 },
    { id: 'ssl-inspect-all', name: 'SSL Inspect All Traffic', enabled: true, action: 'inspect', sequence: 20 },
    { id: 'default-allow-all', name: 'Allow All (Dev)', enabled: true, action: 'allow', sequence: 1000 },
  ]},
  { version: 9, author: 'admin@acme.com', message: 'Policy created: SSL Inspect All Traffic', change_type: 'create', policy_id: 'ssl-inspect-all', created_at: '2026-03-14T07:15:00Z', policies: [
    { id: 'block-malware-domains', name: 'Block Known Malware Domains', enabled: true, action: 'deny', sequence: 10 },
    { id: 'ssl-inspect-all', name: 'SSL Inspect All Traffic', enabled: true, action: 'inspect', sequence: 20 },
    { id: 'default-allow-all', name: 'Allow All (Dev)', enabled: true, action: 'allow', sequence: 1000 },
  ]},
  { version: 8, author: 'secops@acme.com', message: 'Reverted to version 6', change_type: 'revert', created_at: '2026-03-14T07:55:12Z', policies: [
    { id: 'block-malware-domains', name: 'Block Known Malware Domains', enabled: true, action: 'deny', sequence: 10 },
    { id: 'default-allow-all', name: 'Allow All (Dev)', enabled: true, action: 'allow', sequence: 1000 },
  ]},
  { version: 7, author: 'devops@acme.com', message: 'Policy created: Allow Dev Exceptions', change_type: 'create', policy_id: 'allow-dev-exceptions', created_at: '2026-03-13T16:00:00Z', policies: [
    { id: 'block-malware-domains', name: 'Block Known Malware Domains', enabled: true, action: 'deny', sequence: 10 },
    { id: 'allow-dev-exceptions', name: 'Allow Dev Exceptions', enabled: true, action: 'allow', sequence: 500 },
    { id: 'default-allow-all', name: 'Allow All (Dev)', enabled: true, action: 'allow', sequence: 1000 },
  ]},
  { version: 6, author: 'admin@acme.com', message: 'Policy updated: Block Known Malware Domains', change_type: 'update', policy_id: 'block-malware-domains', created_at: '2026-03-13T14:30:00Z', policies: [
    { id: 'block-malware-domains', name: 'Block Known Malware Domains', enabled: true, action: 'deny', sequence: 10 },
    { id: 'default-allow-all', name: 'Allow All (Dev)', enabled: true, action: 'allow', sequence: 1000 },
  ]},
  { version: 5, author: 'admin@acme.com', message: 'Policy updated: Allow All (Dev)', change_type: 'update', policy_id: 'default-allow-all', created_at: '2026-03-13T10:00:00Z', policies: [
    { id: 'block-malware-domains', name: 'Block Known Malware Domains', enabled: true, action: 'deny', sequence: 10 },
    { id: 'default-allow-all', name: 'Allow All (Dev)', enabled: true, action: 'allow', sequence: 1000 },
  ]},
  { version: 4, author: 'admin@acme.com', message: 'Policy created: Block Known Malware Domains', change_type: 'create', policy_id: 'block-malware-domains', created_at: '2026-03-12T15:00:00Z', policies: [
    { id: 'block-malware-domains', name: 'Block Known Malware Domains', enabled: true, action: 'deny', sequence: 10 },
    { id: 'default-allow-all', name: 'Allow All (Dev)', enabled: true, action: 'allow', sequence: 1000 },
  ]},
  { version: 3, author: 'system', message: 'Default policies loaded', change_type: 'create', created_at: '2026-03-12T09:00:00Z', policies: [
    { id: 'default-allow-all', name: 'Allow All (Dev)', enabled: true, action: 'allow', sequence: 1000 },
  ]},
  { version: 2, author: 'system', message: 'Initial bootstrap', change_type: 'create', created_at: '2026-03-12T08:55:00Z', policies: [] },
  { version: 1, author: 'system', message: 'Config store initialized', change_type: 'create', created_at: '2026-03-12T08:50:00Z', policies: [] },
];

const demoLock: ConfigLock | null = null;

/* ─── Helpers ───────────────────────────────────────────────── */
const severityColors: Record<string, string> = {
  info: 'bg-blue-900/30 text-blue-400 border-blue-800',
  warning: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  critical: 'bg-red-900/30 text-red-400 border-red-800',
};

const changeTypeIcons: Record<string, typeof GitBranch> = {
  create: Shield,
  update: Settings,
  delete: AlertTriangle,
  revert: History,
};

const changeTypeColors: Record<string, string> = {
  create: 'text-green-400',
  update: 'text-blue-400',
  delete: 'text-red-400',
  revert: 'text-yellow-400',
};

const eventTypeLabels: Record<string, string> = {
  authentication: 'Authentication',
  policy_change: 'Policy Change',
  config_revert: 'Config Revert',
  gateway_operation: 'Gateway Op',
  scanner_run: 'Scanner Run',
  certificate_issued: 'Cert Issued',
  certificate_revoked: 'Cert Revoked',
  dot1x_auth: '802.1X Auth',
  segment_change: 'Segment Change',
  sdn_config: 'SDN Config',
  mesh_change: 'Mesh Change',
  admin_action: 'Admin Action',
  outreach_email: 'Outreach Email',
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function diffVersions(from: ConfigVersion, to: ConfigVersion): { added: Policy[]; removed: Policy[]; modified: Policy[] } {
  const fromMap = new Map(from.policies.map(p => [p.id, p]));
  const toMap = new Map(to.policies.map(p => [p.id, p]));

  const added: Policy[] = [];
  const removed: Policy[] = [];
  const modified: Policy[] = [];

  for (const [id, policy] of toMap) {
    if (!fromMap.has(id)) {
      added.push(policy);
    } else {
      const old = fromMap.get(id)!;
      if (JSON.stringify(old) !== JSON.stringify(policy)) {
        modified.push(policy);
      }
    }
  }
  for (const [id, policy] of fromMap) {
    if (!toMap.has(id)) {
      removed.push(policy);
    }
  }

  return { added, removed, modified };
}

/* ─── Component ─────────────────────────────────────────────── */
export default function AuditPage() {
  const [tab, setTab] = useState<'audit' | 'versions'>('audit');

  // Audit filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  // Config versions
  const [diffFrom, setDiffFrom] = useState<number | null>(null);
  const [diffTo, setDiffTo] = useState<number | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  // Config lock
  const [configLock, setConfigLock] = useState<ConfigLock | null>(demoLock);

  // Filtered audit logs
  const filteredLogs = useMemo(() => {
    return demoAuditLogs.filter(log => {
      if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
      if (eventTypeFilter !== 'all' && log.eventType !== eventTypeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return log.actor.toLowerCase().includes(q)
          || log.resource.toLowerCase().includes(q)
          || log.action.toLowerCase().includes(q)
          || log.eventType.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, severityFilter, eventTypeFilter]);

  // Diff computation
  const diff = useMemo(() => {
    if (diffFrom === null || diffTo === null) return null;
    const from = demoVersions.find(v => v.version === diffFrom);
    const to = demoVersions.find(v => v.version === diffTo);
    if (!from || !to) return null;
    return diffVersions(from, to);
  }, [diffFrom, diffTo]);

  const handleLockToggle = () => {
    if (configLock) {
      setConfigLock(null);
    } else {
      setConfigLock({
        locked_by: 'admin@acme.com',
        locked_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
      });
    }
  };

  const handleRevert = (version: number) => {
    // In production, this calls POST /api/v1/admin/config/revert/:version
    alert(`Revert to version ${version} — would call POST /api/v1/admin/config/revert/${version}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-blue-400" size={24} />
            Audit & Configuration Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">Audit trail, config versioning with diff comparison, lock & revert</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Config Lock Toggle */}
          <button
            onClick={handleLockToggle}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              configLock
                ? 'bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-900/50'
                : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
            )}
          >
            {configLock ? <Lock size={14} /> : <Unlock size={14} />}
            {configLock ? `Locked by ${configLock.locked_by}` : 'Acquire Lock'}
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-700 border border-gray-700">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900/50 rounded-lg p-1 border border-gray-800 w-fit overflow-x-auto">
        {(['audit', 'versions'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              tab === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            )}
          >
            {t === 'audit' ? 'Audit Logs' : 'Config Versions & Diff'}
          </button>
        ))}
      </div>

      {/* ════════════ AUDIT LOGS TAB ════════════ */}
      {tab === 'audit' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search actor, resource, action..."
                className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-600"
              />
            </div>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={eventTypeFilter}
              onChange={e => setEventTypeFilter(e.target.value)}
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
            >
              <option value="all">All Event Types</option>
              {Object.entries(eventTypeLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Summary chips */}
          <div className="flex gap-3">
            <div className="px-3 py-1.5 bg-gray-900/50 border border-gray-800 rounded-lg text-xs text-gray-400">
              Total: <span className="text-white font-medium">{filteredLogs.length}</span>
            </div>
            <div className="px-3 py-1.5 bg-red-900/20 border border-red-900/30 rounded-lg text-xs text-red-400">
              Critical: <span className="font-medium">{filteredLogs.filter(l => l.severity === 'critical').length}</span>
            </div>
            <div className="px-3 py-1.5 bg-yellow-900/20 border border-yellow-900/30 rounded-lg text-xs text-yellow-400">
              Warning: <span className="font-medium">{filteredLogs.filter(l => l.severity === 'warning').length}</span>
            </div>
            <div className="px-3 py-1.5 bg-red-900/20 border border-red-900/30 rounded-lg text-xs text-red-400">
              Failed: <span className="font-medium">{filteredLogs.filter(l => !l.success).length}</span>
            </div>
          </div>

          {/* Audit Table */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Event Type</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>{timeAgo(log.timestamp)}</span>
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{new Date(log.timestamp).toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-300 border border-gray-700">
                        {eventTypeLabels[log.eventType] || log.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${severityColors[log.severity]}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <User size={12} className="text-gray-500" />
                        {log.actor}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{log.actorIp}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 font-mono text-xs">{log.resource}</td>
                    <td className="px-4 py-3 text-gray-300">{log.action}</td>
                    <td className="px-4 py-3">
                      {log.success ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-green-900/30 text-green-400 border border-green-800">success</span>
                      ) : (
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-900/30 text-red-400 border border-red-800">failed</span>
                          {log.errorMsg && <div className="text-[10px] text-red-400/70 mt-1">{log.errorMsg}</div>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════ CONFIG VERSIONS & DIFF TAB ════════════ */}
      {tab === 'versions' && (
        <div className="space-y-4">
          {/* Lock banner */}
          {configLock && (
            <div className="flex items-center gap-3 p-3 bg-red-900/20 border border-red-800/30 rounded-xl text-sm">
              <Lock size={16} className="text-red-400" />
              <span className="text-red-300">Configuration locked by <span className="font-medium text-red-200">{configLock.locked_by}</span> — expires {timeAgo(configLock.expires_at)}</span>
              <button
                onClick={() => setConfigLock(null)}
                className="ml-auto px-3 py-1 bg-red-900/50 text-red-300 rounded-lg text-xs hover:bg-red-900 border border-red-800"
              >
                Force Unlock
              </button>
            </div>
          )}

          {/* Diff selector */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <ArrowLeftRight size={14} className="text-blue-400" />
              Compare Versions
            </h3>
            <div className="flex items-center gap-3">
              <select
                value={diffFrom ?? ''}
                onChange={e => setDiffFrom(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
              >
                <option value="">From version...</option>
                {demoVersions.map(v => (
                  <option key={v.version} value={v.version}>v{v.version} — {v.message}</option>
                ))}
              </select>
              <ArrowLeftRight size={14} className="text-gray-500" />
              <select
                value={diffTo ?? ''}
                onChange={e => setDiffTo(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
              >
                <option value="">To version...</option>
                {demoVersions.map(v => (
                  <option key={v.version} value={v.version}>v{v.version} — {v.message}</option>
                ))}
              </select>
            </div>

            {/* Diff result */}
            {diff && (
              <div className="mt-4 space-y-2">
                {diff.added.length === 0 && diff.removed.length === 0 && diff.modified.length === 0 && (
                  <p className="text-xs text-gray-500">No differences between selected versions</p>
                )}
                {diff.added.map(p => (
                  <div key={p.id} className="flex items-center gap-2 p-2 bg-green-900/20 border border-green-900/30 rounded-lg text-xs">
                    <span className="text-green-400 font-mono">+ ADDED</span>
                    <span className="text-gray-300">{p.name}</span>
                    <span className="text-gray-500 font-mono">({p.id})</span>
                    <span className="text-gray-500">seq={p.sequence}</span>
                    <span className={p.action === 'deny' ? 'text-red-400' : 'text-green-400'}>{p.action}</span>
                  </div>
                ))}
                {diff.removed.map(p => (
                  <div key={p.id} className="flex items-center gap-2 p-2 bg-red-900/20 border border-red-900/30 rounded-lg text-xs">
                    <span className="text-red-400 font-mono">- REMOVED</span>
                    <span className="text-gray-300">{p.name}</span>
                    <span className="text-gray-500 font-mono">({p.id})</span>
                  </div>
                ))}
                {diff.modified.map(p => (
                  <div key={p.id} className="flex items-center gap-2 p-2 bg-yellow-900/20 border border-yellow-900/30 rounded-lg text-xs">
                    <span className="text-yellow-400 font-mono">~ MODIFIED</span>
                    <span className="text-gray-300">{p.name}</span>
                    <span className="text-gray-500 font-mono">({p.id})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Version timeline */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <History size={14} className="text-purple-400" />
                Version History (Last 10)
              </h3>
              <span className="text-xs text-gray-500">Current: v{demoVersions[0].version}</span>
            </div>
            <div className="divide-y divide-gray-800/50">
              {demoVersions.map((v, i) => {
                const Icon = changeTypeIcons[v.change_type] || GitBranch;
                const isExpanded = expandedVersion === v.version;
                return (
                  <div key={v.version}>
                    <div
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/30 cursor-pointer transition-colors"
                      onClick={() => setExpandedVersion(isExpanded ? null : v.version)}
                    >
                      <div className="flex items-center gap-2 w-16">
                        <span className="text-xs font-mono text-gray-400">v{v.version}</span>
                        {i === 0 && <span className="px-1.5 py-0.5 text-[9px] bg-blue-900/40 text-blue-400 rounded border border-blue-800">HEAD</span>}
                      </div>
                      <Icon size={14} className={changeTypeColors[v.change_type] || 'text-gray-400'} />
                      <span className="flex-1 text-sm text-gray-300">{v.message}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <User size={10} />
                        {v.author}
                      </span>
                      <span className="text-xs text-gray-600 w-24 text-right">{timeAgo(v.created_at)}</span>
                      <div className="flex items-center gap-1">
                        {i > 0 && (
                          <button
                            onClick={e => { e.stopPropagation(); handleRevert(v.version); }}
                            className="px-2 py-1 text-[10px] bg-yellow-900/30 text-yellow-400 rounded border border-yellow-800 hover:bg-yellow-900/50"
                          >
                            Revert
                          </button>
                        )}
                        {isExpanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-3">
                        <div className="bg-gray-950/50 rounded-lg border border-gray-800 p-3">
                          <div className="text-xs text-gray-500 mb-2">Policies snapshot at v{v.version}:</div>
                          {v.policies.length === 0 ? (
                            <p className="text-xs text-gray-600 italic">No policies in this version</p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-600 text-left">
                                  <th className="pb-1">Seq</th>
                                  <th className="pb-1">Name</th>
                                  <th className="pb-1">ID</th>
                                  <th className="pb-1">Action</th>
                                  <th className="pb-1">Enabled</th>
                                </tr>
                              </thead>
                              <tbody>
                                {v.policies.sort((a, b) => a.sequence - b.sequence).map(p => (
                                  <tr key={p.id} className="text-gray-400">
                                    <td className="py-0.5 font-mono">{p.sequence}</td>
                                    <td className="py-0.5 text-gray-300">{p.name}</td>
                                    <td className="py-0.5 font-mono text-gray-500">{p.id}</td>
                                    <td className="py-0.5">
                                      <span className={p.action === 'deny' ? 'text-red-400' : p.action === 'allow' ? 'text-green-400' : 'text-blue-400'}>
                                        {p.action}
                                      </span>
                                    </td>
                                    <td className="py-0.5">{p.enabled ? '✓' : '✗'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          <div className="text-[10px] text-gray-600 mt-2">
                            {new Date(v.created_at).toLocaleString()} • by {v.author} • {v.change_type}
                            {v.policy_id && ` • ${v.policy_id}`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
