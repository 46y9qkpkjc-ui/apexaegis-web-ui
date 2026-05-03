'use client';
import React, { useState, useMemo } from 'react';
import {
  MonitorSmartphone, Search, ChevronDown, AlertTriangle,
  HardDrive, Wifi, Usb, Clipboard, Camera, Printer,
  FileUp, LogIn, LogOut, Shield,
  ChevronRight, Filter, Download, RefreshCw, ShieldPlus, X,
  Server, Clock, Fingerprint,
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { DlpEngineEditor, DEFAULT_DLP_CONFIG, type DlpEngineConfig } from '@/components/policies/dlp-engine';

/* ─── Types ─────────────────────────────────────────────────── */
interface EndpointEvent {
  id: string;
  timestamp: string;
  hostname: string;
  user: string;
  os: 'windows' | 'macos' | 'linux';
  eventType: 'usb_insert' | 'usb_remove' | 'file_copy_usb' | 'screen_capture' | 'clipboard_exfil' |
    'print_job' | 'process_start' | 'network_connect' | 'login' | 'logout' | 'agent_health' |
    'dlp_violation' | 'privilege_escalation' | 'file_encrypt';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  details: string;
  dlpPattern?: string;
  blocked: boolean;
}

const EVENT_TYPE_META: Record<EndpointEvent['eventType'], { icon: typeof Shield; label: string; color: string }> = {
  usb_insert: { icon: Usb, label: 'USB Inserted', color: 'text-yellow-400' },
  usb_remove: { icon: Usb, label: 'USB Removed', color: 'text-gray-400' },
  file_copy_usb: { icon: FileUp, label: 'File → USB', color: 'text-red-400' },
  screen_capture: { icon: Camera, label: 'Screen Capture', color: 'text-orange-400' },
  clipboard_exfil: { icon: Clipboard, label: 'Clipboard Exfil', color: 'text-red-400' },
  print_job: { icon: Printer, label: 'Print Job', color: 'text-blue-400' },
  process_start: { icon: HardDrive, label: 'Process Start', color: 'text-gray-400' },
  network_connect: { icon: Wifi, label: 'Network Connect', color: 'text-cyan-400' },
  login: { icon: LogIn, label: 'Login', color: 'text-green-400' },
  logout: { icon: LogOut, label: 'Logout', color: 'text-gray-400' },
  agent_health: { icon: Shield, label: 'Agent Health', color: 'text-green-400' },
  dlp_violation: { icon: AlertTriangle, label: 'DLP Violation', color: 'text-red-400' },
  privilege_escalation: { icon: AlertTriangle, label: 'Priv Escalation', color: 'text-red-400' },
  file_encrypt: { icon: HardDrive, label: 'File Encrypt', color: 'text-orange-400' },
};

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  info: 'bg-gray-500',
};

/* ─── Demo Data ─────────────────────────────────────────────── */
const DEMO_EVENTS: EndpointEvent[] = [
  { id: 'ep1', timestamp: '2026-03-10 14:35:01', hostname: 'LAPTOP-JD01', user: 'jdoe@acme.com', os: 'windows', eventType: 'dlp_violation', severity: 'critical', details: 'Detected 3 credit card numbers in clipboard paste to pastebin.com', dlpPattern: 'Credit Card Number', blocked: true },
  { id: 'ep2', timestamp: '2026-03-10 14:34:40', hostname: 'LAPTOP-JD01', user: 'jdoe@acme.com', os: 'windows', eventType: 'clipboard_exfil', severity: 'high', details: 'Bulk clipboard paste: 2,400 characters copied from internal CRM to external site', blocked: true },
  { id: 'ep3', timestamp: '2026-03-10 14:34:15', hostname: 'MBP-ALICE', user: 'alice@acme.com', os: 'macos', eventType: 'usb_insert', severity: 'medium', details: 'USB mass storage device "SanDisk Ultra" (32GB) inserted', blocked: false },
  { id: 'ep4', timestamp: '2026-03-10 14:33:50', hostname: 'MBP-ALICE', user: 'alice@acme.com', os: 'macos', eventType: 'file_copy_usb', severity: 'critical', details: 'Copied 47 files (128 MB) including customer-database-export.csv to USB drive', dlpPattern: 'PII Bulk Export', blocked: true },
  { id: 'ep5', timestamp: '2026-03-10 14:33:20', hostname: 'DEV-BOB', user: 'bob@acme.com', os: 'linux', eventType: 'process_start', severity: 'info', details: 'Process started: /usr/bin/code (Visual Studio Code) PID 4821', blocked: false },
  { id: 'ep6', timestamp: '2026-03-10 14:32:55', hostname: 'LAPTOP-CHARLIE', user: 'charlie@acme.com', os: 'windows', eventType: 'screen_capture', severity: 'high', details: 'Screenshot captured while viewing hr.acme.com/payroll — matched DLP rule for sensitive pages', dlpPattern: 'Sensitive Page Screenshot', blocked: true },
  { id: 'ep7', timestamp: '2026-03-10 14:32:30', hostname: 'LAPTOP-CHARLIE', user: 'charlie@acme.com', os: 'windows', eventType: 'print_job', severity: 'medium', details: 'Print job submitted: "Q4-Financial-Report.pdf" (14 pages) to HP LaserJet 4th Floor', blocked: false },
  { id: 'ep8', timestamp: '2026-03-10 14:32:05', hostname: 'WS-EVE', user: 'eve@acme.com', os: 'windows', eventType: 'privilege_escalation', severity: 'critical', details: 'Process "cmd.exe" requested elevation to SYSTEM via UAC bypass (fodhelper.exe)', blocked: true },
  { id: 'ep9', timestamp: '2026-03-10 14:31:45', hostname: 'MBP-DAVE', user: 'dave@acme.com', os: 'macos', eventType: 'network_connect', severity: 'low', details: 'Outbound connection to 185.244.25.51:4443 (unfamiliar IP, not in known services)', blocked: false },
  { id: 'ep10', timestamp: '2026-03-10 14:31:20', hostname: 'DEV-BOB', user: 'bob@acme.com', os: 'linux', eventType: 'login', severity: 'info', details: 'SSH login from 10.0.1.42 to dev-bob.internal', blocked: false },
  { id: 'ep11', timestamp: '2026-03-10 14:31:00', hostname: 'WS-EVE', user: 'eve@acme.com', os: 'windows', eventType: 'file_encrypt', severity: 'high', details: 'Rapid file encryption detected: 23 files encrypted in /Documents in 8 seconds — possible ransomware', blocked: true },
  { id: 'ep12', timestamp: '2026-03-10 14:30:40', hostname: 'LAPTOP-FRANK', user: 'frank@acme.com', os: 'windows', eventType: 'agent_health', severity: 'info', details: 'ApexAegis agent v2.4.1 healthy — last policy sync 2 minutes ago', blocked: false },
  { id: 'ep13', timestamp: '2026-03-10 14:30:15', hostname: 'MBP-ALICE', user: 'alice@acme.com', os: 'macos', eventType: 'dlp_violation', severity: 'critical', details: 'API key (AWS AKIA...) detected in email attachment draft to external recipient', dlpPattern: 'API Key / Secret', blocked: true },
  { id: 'ep14', timestamp: '2026-03-10 14:30:00', hostname: 'LAPTOP-JD01', user: 'jdoe@acme.com', os: 'windows', eventType: 'logout', severity: 'info', details: 'User session ended — idle timeout 30 minutes', blocked: false },
];

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function EndpointEventsPage() {
  const [events] = useState<EndpointEvent[]>(DEMO_EVENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showDlpConfig, setShowDlpConfig] = useState(false);
  const [dlpConfig, setDlpConfig] = useState<DlpEngineConfig>(DEFAULT_DLP_CONFIG);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createPolicyFrom, setCreatePolicyFrom] = useState<EndpointEvent | null>(null);
  const [policyName, setPolicyName] = useState('');
  const [policyAction, setPolicyAction] = useState<'deny' | 'allow' | 'monitor'>('deny');

  const filtered = useMemo(() => events.filter(ev => {
    const matchSearch = !searchQuery ||
      ev.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSeverity = severityFilter === 'all' || ev.severity === severityFilter;
    const matchType = typeFilter === 'all' || ev.eventType === typeFilter;
    return matchSearch && matchSeverity && matchType;
  }), [events, searchQuery, severityFilter, typeFilter]);

  const blockedCount = events.filter(e => e.blocked).length;
  const dlpViolations = events.filter(e => e.eventType === 'dlp_violation').length;
  const criticalCount = events.filter(e => e.severity === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MonitorSmartphone size={24} className="text-cyan-400" />
          <div>
            <h1 className="text-xl font-semibold">Endpoint Events &amp; DLP</h1>
            <p className="text-sm text-gray-500">Endpoint activity monitoring, DLP violations, and device telemetry</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDlpConfig(d => !d)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              showDlpConfig ? 'bg-orange-600 text-white' : 'bg-orange-600/20 text-orange-300 hover:bg-orange-600/30'
            )}
          >
            <Shield size={14} />
            DLP Engine
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
            <Download size={14} />Export
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
            <RefreshCw size={14} />Refresh
          </button>
        </div>
      </div>

      {/* DLP Engine Configuration Panel */}
      {showDlpConfig && (
        <div className="bg-gray-900 border border-orange-800/30 rounded-xl p-4">
          <DlpEngineEditor config={dlpConfig} onChange={setDlpConfig} />
        </div>
      )}

      {/* Summary */}
      <div className="flex gap-3">
        {[
          { label: 'Total Events', count: events.length, color: 'bg-gray-800 text-gray-300' },
          { label: 'Critical', count: criticalCount, color: 'bg-red-900/30 text-red-400' },
          { label: 'DLP Violations', count: dlpViolations, color: 'bg-orange-900/30 text-orange-400' },
          { label: 'Blocked', count: blockedCount, color: 'bg-red-900/30 text-red-300' },
        ].map(chip => (
          <div key={chip.label} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${chip.color}`}>
            {chip.label}: {chip.count}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search hostname, user, details..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm appearance-none focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="dlp_violation">DLP Violation</option>
            <option value="clipboard_exfil">Clipboard Exfil</option>
            <option value="file_copy_usb">File → USB</option>
            <option value="usb_insert">USB Insert</option>
            <option value="screen_capture">Screen Capture</option>
            <option value="print_job">Print Job</option>
            <option value="privilege_escalation">Priv Escalation</option>
            <option value="file_encrypt">File Encrypt</option>
            <option value="network_connect">Network Connect</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="agent_health">Agent Health</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="pl-3 pr-8 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm appearance-none focus:outline-none"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        <span className="text-xs text-gray-500">{filtered.length} events</span>
      </div>

      {/* Events table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
              <th className="w-6 px-3 py-3"></th>
              <th className="px-3 py-3 text-left">Timestamp</th>
              <th className="px-3 py-3 text-left">Hostname</th>
              <th className="px-3 py-3 text-left">User</th>
              <th className="px-3 py-3 text-left">OS</th>
              <th className="px-3 py-3 text-left">Event</th>
              <th className="px-3 py-3 text-left">Details</th>
              <th className="px-3 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filtered.map(ev => {
              const meta = EVENT_TYPE_META[ev.eventType];
              const Icon = meta.icon;
              const expanded = expandedId === ev.id;
              return (
                <React.Fragment key={ev.id}>
                <tr
                  className={clsx('transition-colors cursor-pointer', expanded ? 'bg-gray-800/30' : 'hover:bg-gray-800/20')}
                  onClick={() => setExpandedId(expanded ? null : ev.id)}
                >
                  <td className="px-3 py-2.5">
                    <span className={`w-2 h-2 rounded-full block ${SEVERITY_DOT[ev.severity]}`} />
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 font-mono text-xs whitespace-nowrap">{ev.timestamp}</td>
                  <td className="px-3 py-2.5 text-gray-300 text-xs font-mono">{ev.hostname}</td>
                  <td className="px-3 py-2.5 text-gray-400 text-xs truncate max-w-[120px]">{ev.user.split('@')[0]}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px] uppercase">{ev.os}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Icon size={13} className={meta.color} />
                      <span className="text-xs text-gray-300">{meta.label}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 text-xs truncate max-w-[280px]">{ev.details}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {ev.blocked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-900/40 text-red-400 border border-red-800">BLOCKED</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-500 border border-gray-700">LOGGED</span>
                      )}
                      <ChevronRight size={12} className={clsx('text-gray-600 transition-transform', expanded && 'rotate-90')} />
                    </div>
                  </td>
                </tr>

                {/* ── Expanded Detail Panel ──────────────────── */}
                {expanded && (
                  <tr>
                    <td colSpan={8} className="px-0 py-0">
                      <div className="bg-gray-800/60 border-y border-gray-700/50 px-6 py-5 space-y-4">
                        {/* Action bar */}
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                            <Icon size={14} className={meta.color} />
                            {meta.label} — {ev.hostname}
                          </h4>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setCreatePolicyFrom(ev); setPolicyName(`Block ${ev.eventType.replaceAll('_', ' ')} — ${ev.hostname}`); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-700/40 rounded-lg text-xs font-medium transition-colors"
                            >
                              <ShieldPlus size={12} /> Create Policy from Event
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Event Details */}
                          <div className="space-y-2">
                            <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Fingerprint size={11} /> Event Info</h5>
                            <div className="bg-gray-900/60 rounded-lg p-3 space-y-1.5 text-xs border border-gray-700/30">
                              <div className="flex justify-between"><span className="text-gray-500">Event Type</span><span className={`${meta.color} font-medium`}>{meta.label}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Severity</span>
                                <span className={clsx('font-medium capitalize', ev.severity === 'critical' ? 'text-red-400' : ev.severity === 'high' ? 'text-orange-400' : ev.severity === 'medium' ? 'text-yellow-400' : 'text-gray-400')}>{ev.severity}</span>
                              </div>
                              <div className="flex justify-between"><span className="text-gray-500">Status</span>
                                <span className={ev.blocked ? 'text-red-400' : 'text-gray-400'}>{ev.blocked ? 'BLOCKED' : 'LOGGED'}</span>
                              </div>
                              <div className="flex justify-between"><span className="text-gray-500">Timestamp</span><span className="text-gray-300 font-mono">{ev.timestamp}</span></div>
                              {ev.dlpPattern && (
                                <div className="flex justify-between"><span className="text-gray-500">DLP Pattern</span>
                                  <span className="text-orange-300 font-medium">{ev.dlpPattern}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Device Details */}
                          <div className="space-y-2">
                            <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Server size={11} /> Device</h5>
                            <div className="bg-gray-900/60 rounded-lg p-3 space-y-1.5 text-xs border border-gray-700/30">
                              <div className="flex justify-between"><span className="text-gray-500">Hostname</span><span className="text-gray-300 font-mono">{ev.hostname}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">User</span><span className="text-gray-300">{ev.user}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">OS</span><span className="text-gray-300 uppercase">{ev.os}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Agent</span><span className="text-green-400">ApexAegis v2.4.1</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Posture</span><span className="text-green-400">Compliant</span></div>
                            </div>
                          </div>

                          {/* Full Details */}
                          <div className="space-y-2">
                            <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle size={11} /> Details</h5>
                            <div className="bg-gray-900/60 rounded-lg p-3 text-xs border border-gray-700/30">
                              <p className="text-gray-300 leading-relaxed">{ev.details}</p>
                              {ev.blocked && (
                                <div className="mt-2 pt-2 border-t border-gray-700/30">
                                  <p className="text-red-400 text-[10px] font-medium">⛔ This action was blocked by endpoint security policy</p>
                                </div>
                              )}
                              {ev.dlpPattern && (
                                <div className="mt-2 pt-2 border-t border-gray-700/30">
                                  <p className="text-orange-300 text-[10px]">DLP Rule: {ev.dlpPattern}</p>
                                  <p className="text-gray-500 text-[10px] mt-0.5">Matched by real-time content inspection engine</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Response Timeline */}
                        <div className="space-y-2">
                          <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Clock size={11} /> Response Timeline</h5>
                          <div className="flex items-center gap-1">
                            {[
                              { step: 'Event Detected', time: '0ms', status: 'done' },
                              { step: 'Agent Analysis', time: '12ms', status: 'done' },
                              { step: 'Policy Lookup', time: '3ms', status: 'done' },
                              { step: ev.dlpPattern ? 'DLP Scan' : 'Behavior Check', time: ev.dlpPattern ? '45ms' : '8ms', status: 'done' },
                              { step: ev.blocked ? 'Action Blocked' : 'Action Logged', time: '1ms', status: ev.blocked ? 'blocked' : 'done' },
                              { step: 'Cloud Sync', time: '150ms', status: 'done' },
                            ].map((s, i, arr) => (
                              <React.Fragment key={s.step}>
                                <div className={clsx(
                                  'flex-1 px-3 py-2 rounded-lg border text-xs text-center',
                                  s.status === 'blocked' ? 'bg-red-900/30 border-red-800/40 text-red-300' : 'bg-gray-900/60 border-gray-700/30 text-gray-400',
                                )}>
                                  <div className="font-medium">{s.step}</div>
                                  <div className="text-[10px] mt-0.5 text-gray-500">{s.time}</div>
                                </div>
                                {i < arr.length - 1 && <ChevronRight size={12} className="text-gray-600 shrink-0" />}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Policy from Endpoint Event Modal */}
      {createPolicyFrom && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setCreatePolicyFrom(null)} />
          <div className="fixed inset-x-0 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-gray-900 border border-gray-700 rounded-xl z-50 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <ShieldPlus size={18} className="text-green-400" />
                <h3 className="text-sm font-semibold">Create Policy from Endpoint Event</h3>
              </div>
              <button onClick={() => setCreatePolicyFrom(null)} className="p-1 hover:bg-gray-800 rounded text-gray-400">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-xs space-y-2 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex justify-between"><span className="text-gray-500">Event</span><span className="text-gray-300">{EVENT_TYPE_META[createPolicyFrom.eventType].label}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Hostname</span><span className="text-gray-300 font-mono">{createPolicyFrom.hostname}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">User</span><span className="text-gray-300">{createPolicyFrom.user}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Severity</span><span className="text-gray-300 capitalize">{createPolicyFrom.severity}</span></div>
                {createPolicyFrom.dlpPattern && (
                  <div className="flex justify-between"><span className="text-gray-500">DLP Pattern</span><span className="text-orange-300">{createPolicyFrom.dlpPattern}</span></div>
                )}
                <div className="flex justify-between"><span className="text-gray-500">Status</span>
                  <span className={createPolicyFrom.blocked ? 'text-red-400' : 'text-gray-400'}>{createPolicyFrom.blocked ? 'BLOCKED' : 'LOGGED'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Policy Name</label>
                <input
                  value={policyName}
                  onChange={e => setPolicyName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
                  placeholder={`Block ${createPolicyFrom.eventType.replaceAll('_', ' ')} — ${createPolicyFrom.hostname}`}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Policy Action</label>
                <div className="flex gap-2">
                  {(['deny', 'allow', 'monitor'] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => setPolicyAction(a)}
                      className={clsx(
                        'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                        policyAction === a
                          ? a === 'deny' ? 'bg-red-600 border-red-500 text-white' : a === 'allow' ? 'bg-green-600 border-green-500 text-white' : 'bg-yellow-600 border-yellow-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                      )}
                    >
                      {a.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  const name = policyName || `Block ${createPolicyFrom.eventType.replaceAll('_', ' ')} — ${createPolicyFrom.hostname}`;
                  toast.success(`Policy "${name}" created — Action: ${policyAction.toUpperCase()}, Source: Endpoint Event`);
                  setCreatePolicyFrom(null);
                  setPolicyName('');
                  setPolicyAction('deny');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
              >
                Create Policy
              </button>

              <p className="text-[11px] text-gray-500">
                Creates a policy targeting {createPolicyFrom.eventType.replaceAll('_', ' ')} events from {createPolicyFrom.hostname} ({createPolicyFrom.user}).
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
