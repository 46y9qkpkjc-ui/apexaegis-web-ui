'use client';

import { useState } from 'react';
import {
  Activity, Wifi, Monitor, Zap, Radio, ArrowDownToLine,
  ArrowUpFromLine, CheckCircle, AlertTriangle, XCircle,
  Globe, Cpu, Network, Shield
} from 'lucide-react';

interface BackoffSignal {
  id: string;
  timestamp: string;
  endpoint: string;
  eventType: 'video-call' | 'audio-call' | 'screen-share';
  signalType: 'ECN-CE' | 'RED' | 'WRED' | 'DCTCP';
  bytesBackedOff: number;
  reason: string;
  nicUtilBefore: number;
  nicUtilAfter: number;
}

interface ProcessTelemetry {
  pid: number;
  processName: string;
  user: string;
  flowsTotal: number;
  flowsSteered: number;
  flowsBypassed: number;
  bytesSteered: number;
  bytesBypassed: number;
  vnetNic: string;
}

interface QuicConnection {
  id: string;
  remoteHost: string;
  remotePort: number;
  protocol: 'QUIC' | 'TCP';
  state: 'active' | 'idle' | 'closed';
  rttMs: number;
  lossRate: number;
  bandwidth: string;
  congestionWindow: number;
  lastPmtud: string;
}

interface QoELog {
  id: string;
  timestamp: string;
  user: string;
  endpoint: string;
  metric: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'good' | 'degraded' | 'poor';
  prediction: string;
}

const BACKOFF_SIGNALS: BackoffSignal[] = [
  { id: 'BO-001', timestamp: new Date(Date.now() - 30000).toISOString(), endpoint: 'vc.zoom.us', eventType: 'video-call', signalType: 'ECN-CE', bytesBackedOff: 245000, reason: 'NIC TX queue depth exceeded 75% during 1080p30 video stream', nicUtilBefore: 82, nicUtilAfter: 61 },
  { id: 'BO-002', timestamp: new Date(Date.now() - 120000).toISOString(), endpoint: 'meet.google.com', eventType: 'video-call', signalType: 'RED', bytesBackedOff: 180000, reason: 'Audio jitter buffer overflow during multi-party call', nicUtilBefore: 74, nicUtilAfter: 55 },
  { id: 'BO-003', timestamp: new Date(Date.now() - 300000).toISOString(), endpoint: 'teams.microsoft.com', eventType: 'screen-share', signalType: 'WRED', bytesBackedOff: 520000, reason: 'Bulky screen-share transfer competing with audio call', nicUtilBefore: 88, nicUtilAfter: 52 },
  { id: 'BO-004', timestamp: new Date(Date.now() - 600000).toISOString(), endpoint: 'zoom.us', eventType: 'audio-call', signalType: 'DCTCP', bytesBackedOff: 95000, reason: 'Low-latency audio stream backoff to preserve MOS score', nicUtilBefore: 67, nicUtilAfter: 45 },
];

const PROCESS_TELEMETRY: ProcessTelemetry[] = [
  { pid: 4821, processName: 'Zoom.exe', user: 'evelyn.ng.aspire', flowsTotal: 12, flowsSteered: 10, flowsBypassed: 2, bytesSteered: 12400000, bytesBypassed: 3200000, vnetNic: 'vNET-LAN-01' },
  { pid: 7234, processName: 'ms-teams.exe', user: 'evelyn.ng.aspire', flowsTotal: 8, flowsSteered: 7, flowsBypassed: 1, bytesSteered: 8900000, bytesBypassed: 1200000, vnetNic: 'vNET-LAN-01' },
  { pid: 1923, processName: 'chrome.exe', user: 'evelyn.ng.aspire', flowsTotal: 24, flowsSteered: 3, flowsBypassed: 21, bytesSteered: 2100000, bytesBypassed: 45000000, vnetNic: 'vNET-LAN-01' },
  { pid: 5512, processName: 'obsidian.exe', user: 'evelyn.ng.aspire', flowsTotal: 4, flowsSteered: 0, flowsBypassed: 4, bytesSteered: 0, bytesBypassed: 850000, vnetNic: 'vNET-LAN-01' },
];

const QUIC_CONNECTIONS: QuicConnection[] = [
  { id: 'qcn-001', remoteHost: '142.250.80.46', remotePort: 443, protocol: 'QUIC', state: 'active', rttMs: 8, lossRate: 0.01, bandwidth: '42 Mbps', congestionWindow: 128, lastPmtud: '1280 B' },
  { id: 'qcn-002', remoteHost: '13.107.42.14', remotePort: 443, protocol: 'QUIC', state: 'active', rttMs: 12, lossRate: 0.02, bandwidth: '38 Mbps', congestionWindow: 96, lastPmtud: '1280 B' },
  { id: 'qcn-003', remoteHost: '104.16.132.229', remotePort: 443, protocol: 'TCP', state: 'active', rttMs: 15, lossRate: 0.0, bandwidth: '85 Mbps', congestionWindow: 256, lastPmtud: 'N/A (TCP)' },
  { id: 'qcn-004', remoteHost: '52.96.145.12', remotePort: 443, protocol: 'QUIC', state: 'idle', rttMs: 22, lossRate: 0.03, bandwidth: '12 Mbps', congestionWindow: 48, lastPmtud: '1280 B' },
];

const QOE_LOGS: QoELog[] = [
  { id: 'QOE-001', timestamp: new Date(Date.now() - 15000).toISOString(), user: 'evelyn.ng.aspire', endpoint: 'vc.zoom.us', metric: 'Video MOS', value: 4.2, unit: 'MOS', threshold: 3.5, status: 'good', prediction: 'Stable — NIC contention resolved after backoff' },
  { id: 'QOE-002', timestamp: new Date(Date.now() - 45000).toISOString(), user: 'evelyn.ng.aspire', endpoint: 'meet.google.com', metric: 'Audio Latency', value: 42, unit: 'ms', threshold: 150, status: 'good', prediction: 'Low latency maintained via QUIC steered path' },
  { id: 'QOE-003', timestamp: new Date(Date.now() - 90000).toISOString(), user: 'evelyn.ng.aspire', endpoint: 'teams.microsoft.com', metric: 'Screen Share FPS', value: 18, unit: 'fps', threshold: 24, status: 'degraded', prediction: 'Recovery expected — WRED backoff reduced NIC util from 88% to 52%' },
  { id: 'QOE-004', timestamp: new Date(Date.now() - 180000).toISOString(), user: 'evelyn.ng.aspire', endpoint: 'zoom.us', metric: 'Audio Jitter', value: 8, unit: 'ms', threshold: 30, status: 'good', prediction: 'Within bounds — DCTCP backoff effective' },
  { id: 'QOE-005', timestamp: new Date(Date.now() - 360000).toISOString(), user: 'evelyn.ng.aspire', endpoint: 'vc.zoom.us', metric: 'Packet Loss', value: 0.3, unit: '%', threshold: 1.0, status: 'good', prediction: 'Nominal — no intervention needed' },
  { id: 'QOE-006', timestamp: new Date(Date.now() - 720000).toISOString(), user: 'evelyn.ng.aspire', endpoint: 'meet.google.com', metric: 'Video MOS', value: 2.8, unit: 'MOS', threshold: 3.5, status: 'poor', prediction: 'Expected improvement — steered 10 flows to vNET-LAN-01 low-latency path' },
];

const NIC_UTIL_HISTORY = [
  { time: '10:00', tx: 45, rx: 52, backoffEvents: 0 },
  { time: '10:05', tx: 62, rx: 58, backoffEvents: 0 },
  { time: '10:10', tx: 78, rx: 71, backoffEvents: 1 },
  { time: '10:15', tx: 88, rx: 82, backoffEvents: 2 },
  { time: '10:20', tx: 55, rx: 48, backoffEvents: 0 },
  { time: '10:25', tx: 42, rx: 38, backoffEvents: 0 },
  { time: '10:30', tx: 68, rx: 61, backoffEvents: 1 },
];

function getStatusIcon(status: string) {
  if (status === 'good') return <CheckCircle size={12} className="text-green-400" />;
  if (status === 'degraded') return <AlertTriangle size={12} className="text-yellow-400" />;
  return <XCircle size={12} className="text-red-400" />;
}

function getStatusColor(status: string) {
  if (status === 'good') return 'bg-green-500/10 text-green-400 border-green-500/20';
  if (status === 'degraded') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  return 'bg-red-500/10 text-red-400 border-red-500/20';
}

function getEventTypeLabel(type: string) {
  switch (type) {
    case 'video-call': return 'Video Call';
    case 'audio-call': return 'Audio Call';
    case 'screen-share': return 'Screen Share';
    default: return type;
  }
}

function getEventTypeColor(type: string) {
  switch (type) {
    case 'video-call': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'audio-call': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'screen-share': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

export default function DigitalQoEPage() {
  const [activeSection, setActiveSection] = useState<'backoff' | 'nic' | 'process' | 'quic' | 'qoe'>('backoff');

  const sections = [
    { id: 'backoff' as const, label: 'Backoff Signals', icon: ArrowDownToLine },
    { id: 'nic' as const, label: 'NIC Utilization', icon: Wifi },
    { id: 'process' as const, label: 'Process Telemetry', icon: Monitor },
    { id: 'quic' as const, label: 'QUIC Connections', icon: Zap },
    { id: 'qoe' as const, label: 'Predictive QoE', icon: Activity },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={24} className="text-cyan-400" />
          <div>
            <h1 className="text-xl font-bold text-gray-100">Unified Digital Quality of Experience</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              vNET LAN telemetry for <span className="text-cyan-400 font-medium">evelyn.ng.aspire</span> — backoff signals, NIC utilization, process steering, and predictive QoE
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="px-2 py-1 rounded bg-cyan-900/30 text-cyan-400 border border-cyan-800/40">
            <Radio size={10} className="inline mr-1" />vNET-LAN-01
          </span>
          <span className="px-2 py-1 rounded bg-green-900/30 text-green-400 border border-green-800/40">
            Connected
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Backoff Events (1h)', value: BACKOFF_SIGNALS.length, color: 'text-amber-400', icon: ArrowDownToLine },
          { label: 'NIC TX Utilization', value: `${NIC_UTIL_HISTORY[NIC_UTIL_HISTORY.length - 1].tx}%`, color: 'text-cyan-400', icon: Wifi },
          { label: 'Steered Flows', value: PROCESS_TELEMETRY.reduce((s, p) => s + p.flowsSteered, 0), color: 'text-green-400', icon: ArrowUpFromLine },
          { label: 'Active QUIC', value: QUIC_CONNECTIONS.filter(c => c.state === 'active').length, color: 'text-purple-400', icon: Zap },
          { label: 'QoE Score', value: '4.2', color: 'text-green-400', icon: Activity },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <stat.icon size={12} className={stat.color} />
              <span className="text-[10px] text-gray-500">{stat.label}</span>
            </div>
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1.5 flex-wrap border-b border-gray-800 pb-1">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <Icon size={12} />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Backoff Signals Section */}
      {activeSection === 'backoff' && (
        <div className="space-y-3">
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">ECN / RED / WRED Backoff Signals</h3>
            <p className="text-[10px] text-gray-500 mb-3">
              Signals sent to endpoints to throttle noisy or bulky transfers during video/audio call events. NIC contention triggers per-flow backoff to preserve real-time media quality.
            </p>
            <div className="space-y-2">
              {BACKOFF_SIGNALS.map(signal => (
                <div key={signal.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-700/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-gray-500">{signal.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] border ${getEventTypeColor(signal.eventType)}`}>
                        {getEventTypeLabel(signal.eventType)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {signal.signalType}
                      </span>
                      <span className="text-[10px] text-gray-500">→</span>
                      <span className="text-[10px] text-gray-400 font-medium">{signal.endpoint}</span>
                    </div>
                    <p className="text-[10px] text-gray-400">{signal.reason}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-[9px] text-gray-500">
                      <span>Backed off: <span className="text-amber-400">{(signal.bytesBackedOff / 1000).toFixed(0)} KB</span></span>
                      <span>NIC: <span className="text-red-400">{signal.nicUtilBefore}%</span> → <span className="text-green-400">{signal.nicUtilAfter}%</span></span>
                      <span>{new Date(signal.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NIC Utilization Section */}
      {activeSection === 'nic' && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">vNET-LAN-01 NIC Utilization</h3>
          <div className="space-y-2">
            {NIC_UTIL_HISTORY.map((entry, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500 w-10 font-mono">{entry.time}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 text-[9px] mb-0.5">
                      <span className="text-cyan-400">TX</span>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all" style={{ width: `${entry.tx}%` }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 text-[9px] mb-0.5">
                      <span className="text-purple-400">RX</span>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all" style={{ width: `${entry.rx}%` }} />
                    </div>
                  </div>
                </div>
                <div className="w-16 text-right">
                  {entry.backoffEvents > 0 ? (
                    <span className="text-[9px] text-amber-400">{entry.backoffEvents} backoff</span>
                  ) : (
                    <span className="text-[9px] text-gray-600">—</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 w-12 text-right">{entry.tx}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Telemetry Section */}
      {activeSection === 'process' && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Process Flow Steering</h3>
          <p className="text-[10px] text-gray-500 mb-3">
            Per-process telemetry showing flows steered to vNET-LAN low-latency path vs bypassed for bulk transfer.
          </p>
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-gray-500 border-b border-gray-700">
                  <th className="text-left px-3 py-2 font-medium">Process</th>
                  <th className="text-left px-3 py-2 font-medium">User</th>
                  <th className="text-center px-3 py-2 font-medium">Flows</th>
                  <th className="text-center px-3 py-2 font-medium">Steered</th>
                  <th className="text-center px-3 py-2 font-medium">Bypassed</th>
                  <th className="text-right px-3 py-2 font-medium">Bytes Steered</th>
                  <th className="text-right px-3 py-2 font-medium">Bytes Bypassed</th>
                  <th className="text-left px-3 py-2 font-medium">NIC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {PROCESS_TELEMETRY.map(proc => (
                  <tr key={proc.pid} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Monitor size={10} className="text-cyan-400" />
                        <span className="font-mono text-gray-300">{proc.processName}</span>
                        <span className="text-gray-600">PID:{proc.pid}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-400">{proc.user}</td>
                    <td className="px-3 py-2 text-center text-gray-300">{proc.flowsTotal}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-green-400 font-medium">{proc.flowsSteered}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-gray-400">{proc.flowsBypassed}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-cyan-400">{(proc.bytesSteered / 1000000).toFixed(1)} MB</td>
                    <td className="px-3 py-2 text-right text-gray-400">{(proc.bytesBypassed / 1000000).toFixed(1)} MB</td>
                    <td className="px-3 py-2 text-gray-500">{proc.vnetNic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUIC Connections Section */}
      {activeSection === 'quic' && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">QUIC Connection Health</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {QUIC_CONNECTIONS.map(conn => (
              <div key={conn.id} className="p-3 rounded-lg bg-gray-800/40 border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] border ${
                      conn.protocol === 'QUIC' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {conn.protocol}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      conn.state === 'active' ? 'bg-green-400' : conn.state === 'idle' ? 'bg-yellow-400' : 'bg-gray-500'
                    }`} />
                    <span className="text-[10px] text-gray-300 font-mono">{conn.remoteHost}:{conn.remotePort}</span>
                  </div>
                  <span className="text-[9px] text-gray-500">{conn.id}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[9px]">
                  <div className="p-1.5 rounded bg-white/5">
                    <div className="text-gray-500">RTT</div>
                    <div className={`font-mono ${conn.rttMs < 15 ? 'text-green-400' : conn.rttMs < 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {conn.rttMs} ms
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-white/5">
                    <div className="text-gray-500">Loss</div>
                    <div className={`font-mono ${conn.lossRate < 0.02 ? 'text-green-400' : conn.lossRate < 0.05 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {(conn.lossRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-white/5">
                    <div className="text-gray-500">Bandwidth</div>
                    <div className="font-mono text-cyan-400">{conn.bandwidth}</div>
                  </div>
                  <div className="p-1.5 rounded bg-white/5">
                    <div className="text-gray-500">cwnd</div>
                    <div className="font-mono text-gray-300">{conn.congestionWindow}</div>
                  </div>
                  <div className="p-1.5 rounded bg-white/5">
                    <div className="text-gray-500">PMTUD</div>
                    <div className="font-mono text-gray-300">{conn.lastPmtud}</div>
                  </div>
                  <div className="p-1.5 rounded bg-white/5">
                    <div className="text-gray-500">State</div>
                    <div className={`font-medium ${conn.state === 'active' ? 'text-green-400' : conn.state === 'idle' ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {conn.state}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Predictive QoE Section */}
      {activeSection === 'qoe' && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Predictive QoE Computation Logs</h3>
          <p className="text-[10px] text-gray-500 mb-3">
            Real-time quality of experience scoring with predictive analytics for media streams on vNET-LAN.
          </p>
          <div className="space-y-2">
            {QOE_LOGS.map(log => (
              <div key={log.id} className={`p-3 rounded-lg border ${getStatusColor(log.status)}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-gray-500">{log.id}</span>
                    {getStatusIcon(log.status)}
                    <span className="text-xs font-medium text-gray-200">{log.metric}</span>
                    <span className="text-[10px] text-gray-500">→</span>
                    <span className="text-[10px] text-gray-400">{log.endpoint}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div>
                    <span className="text-[9px] text-gray-500">Value: </span>
                    <span className={`text-xs font-bold ${log.status === 'good' ? 'text-green-400' : log.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {log.value} {log.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500">Threshold: </span>
                    <span className="text-[10px] text-gray-400">{log.threshold} {log.unit}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] text-gray-500">AI Prediction: </span>
                    <span className="text-[10px] text-gray-300 italic">{log.prediction}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
