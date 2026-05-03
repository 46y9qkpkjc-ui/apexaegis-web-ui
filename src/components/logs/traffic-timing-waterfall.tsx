'use client';
import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import {
  X, Globe, Lock, Server, Wifi, Clock, BarChart3,
  ChevronDown, ChevronRight, AlertTriangle, Zap, Search,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
export interface TimingPhase {
  name: string;
  label: string;
  startMs: number;
  durationMs: number;
  color: string;
}

export interface RequestTiming {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  status: number;
  protocol: string;
  size: number;
  mimeType: string;
  initiator: string;
  priority: 'highest' | 'high' | 'medium' | 'low' | 'lowest';
  remoteAddress: string;
  phases: TimingPhase[];
  totalMs: number;
  serverIp: string;
  tlsVersion?: string;
  httpVersion: string;
  compressed: boolean;
  cached: boolean;
  bottleneck?: string;
}

/* ─── Phase colors ──────────────────────────────────────────── */
const PHASE_COLORS: Record<string, string> = {
  queueing:      'bg-gray-500',
  stalled:       'bg-gray-400',
  dns:           'bg-teal-500',
  tcp:           'bg-orange-500',
  tls:           'bg-purple-500',
  ttfb:          'bg-green-500',
  content:       'bg-blue-500',
  proxy:         'bg-yellow-500',
};

const PHASE_LABELS: Record<string, string> = {
  queueing: 'Queueing',
  stalled:  'Stalled / Blocking',
  dns:      'DNS Lookup',
  tcp:      'TCP Connection',
  tls:      'TLS Handshake',
  ttfb:     'Waiting (TTFB)',
  content:  'Content Download',
  proxy:    'Proxy Negotiation',
};

/* ─── Simulated request timings ─────────────────────────────── */
function generateTimings(destination: string): RequestTiming[] {
  const requests: RequestTiming[] = [
    makeTiming('1', `https://${destination}/`, 'GET', 200, 'text/html', 'user-navigation', 'highest',
      { dns: 42, tcp: 28, tls: 35, ttfb: 180, content: 25 }, `104.22.3.${rand(1,254)}`, false),
    makeTiming('2', `https://${destination}/api/config`, 'GET', 200, 'application/json', 'script', 'high',
      { dns: 0, tcp: 0, tls: 0, ttfb: 95, content: 8 }, `104.22.3.${rand(1,254)}`, false),
    makeTiming('3', `https://cdn.${destination}/assets/main.js`, 'GET', 200, 'application/javascript', 'parser', 'highest',
      { dns: 18, tcp: 15, tls: 22, ttfb: 45, content: 120 }, `151.101.${rand(1,254)}.${rand(1,254)}`, false),
    makeTiming('4', `https://cdn.${destination}/assets/styles.css`, 'GET', 200, 'text/css', 'parser', 'highest',
      { dns: 0, tcp: 0, tls: 0, ttfb: 38, content: 15 }, `151.101.${rand(1,254)}.${rand(1,254)}`, false),
    makeTiming('5', `https://${destination}/api/user/profile`, 'GET', 200, 'application/json', 'fetch', 'high',
      { dns: 0, tcp: 0, tls: 0, ttfb: 320, content: 12 }, `104.22.3.${rand(1,254)}`, true),
    makeTiming('6', `https://analytics.${destination}/collect`, 'POST', 204, 'text/plain', 'script', 'low',
      { dns: 55, tcp: 32, tls: 40, ttfb: 210, content: 2 }, `216.58.${rand(1,254)}.${rand(1,254)}`, false),
    makeTiming('7', `https://${destination}/api/data/dashboard`, 'GET', 200, 'application/json', 'fetch', 'high',
      { dns: 0, tcp: 0, tls: 0, ttfb: 890, content: 45 }, `104.22.3.${rand(1,254)}`, true),
    makeTiming('8', `https://fonts.googleapis.com/css2`, 'GET', 200, 'text/css', 'stylesheet', 'medium',
      { dns: 12, tcp: 10, tls: 14, ttfb: 22, content: 5 }, `142.250.${rand(1,254)}.${rand(1,254)}`, false),
    makeTiming('9', `https://${destination}/api/notifications`, 'GET', 200, 'application/json', 'fetch', 'medium',
      { dns: 0, tcp: 0, tls: 0, ttfb: 155, content: 6 }, `104.22.3.${rand(1,254)}`, false),
    makeTiming('10', `https://${destination}/images/hero.webp`, 'GET', 200, 'image/webp', 'img', 'low',
      { dns: 0, tcp: 0, tls: 0, ttfb: 65, content: 280 }, `104.22.3.${rand(1,254)}`, false),
  ];
  return requests;
}

function rand(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min));
}

function makeTiming(
  id: string, url: string, method: RequestTiming['method'], status: number,
  mimeType: string, initiator: string, priority: RequestTiming['priority'],
  durations: { dns: number; tcp: number; tls: number; ttfb: number; content: number },
  serverIp: string, slowServer: boolean
): RequestTiming {
  const queueing = rand(1, 8);
  const stalled = rand(2, 15);
  const proxy = rand(0, 5);

  let offset = queueing;
  const phases: TimingPhase[] = [
    { name: 'queueing', label: 'Queueing', startMs: 0, durationMs: queueing, color: PHASE_COLORS.queueing },
  ];

  if (stalled > 5) {
    phases.push({ name: 'stalled', label: 'Stalled', startMs: offset, durationMs: stalled, color: PHASE_COLORS.stalled });
    offset += stalled;
  }
  if (proxy > 2) {
    phases.push({ name: 'proxy', label: 'Proxy', startMs: offset, durationMs: proxy, color: PHASE_COLORS.proxy });
    offset += proxy;
  }
  if (durations.dns > 0) {
    phases.push({ name: 'dns', label: 'DNS Lookup', startMs: offset, durationMs: durations.dns, color: PHASE_COLORS.dns });
    offset += durations.dns;
  }
  if (durations.tcp > 0) {
    phases.push({ name: 'tcp', label: 'TCP', startMs: offset, durationMs: durations.tcp, color: PHASE_COLORS.tcp });
    offset += durations.tcp;
  }
  if (durations.tls > 0) {
    phases.push({ name: 'tls', label: 'TLS', startMs: offset, durationMs: durations.tls, color: PHASE_COLORS.tls });
    offset += durations.tls;
  }
  phases.push({ name: 'ttfb', label: 'TTFB', startMs: offset, durationMs: durations.ttfb, color: PHASE_COLORS.ttfb });
  offset += durations.ttfb;
  phases.push({ name: 'content', label: 'Content Download', startMs: offset, durationMs: durations.content, color: PHASE_COLORS.content });
  offset += durations.content;

  const total = offset;
  let bottleneck: string | undefined;
  if (slowServer || durations.ttfb > 300) bottleneck = 'Slow server response (high TTFB)';
  else if (durations.dns > 40) bottleneck = 'Slow DNS resolution';
  else if (durations.content > 200) bottleneck = 'Large payload / slow download';
  else if (durations.tls > 30) bottleneck = 'TLS negotiation overhead';

  return {
    id, url, method, status, protocol: 'h2', mimeType, initiator, priority,
    remoteAddress: serverIp, phases, totalMs: total, serverIp,
    tlsVersion: 'TLS 1.3', httpVersion: 'HTTP/2', compressed: true,
    cached: durations.dns === 0 && durations.tcp === 0 && durations.tls === 0 && durations.ttfb < 50,
    bottleneck,
    size: mimeType.includes('javascript') ? rand(80000, 250000)
      : mimeType.includes('css') ? rand(5000, 40000)
      : mimeType.includes('image') ? rand(50000, 500000)
      : mimeType.includes('json') ? rand(500, 15000)
      : rand(2000, 20000),
  };
}

function formatMs(ms: number) {
  if (ms < 1) return '<1 ms';
  if (ms < 1000) return `${ms.toFixed(0)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusColor(status: number) {
  if (status < 300) return 'text-green-400';
  if (status < 400) return 'text-yellow-400';
  return 'text-red-400';
}

/* ═══════════════════════════════════════════════════════════════
   TRAFFIC TIMING WATERFALL
   ═══════════════════════════════════════════════════════════════ */
interface TrafficTimingWaterfallProps {
  destination?: string;
  onClose: () => void;
}

export function TrafficTimingWaterfall({ destination = 'example.com', onClose }: TrafficTimingWaterfallProps) {
  const requests = useMemo(() => generateTimings(destination), [destination]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const maxTime = useMemo(() => Math.max(...requests.map(r => r.totalMs)), [requests]);
  const scaleMax = Math.ceil(maxTime / 100) * 100;

  const totalRequests = requests.length;
  const totalSize = requests.reduce((s, r) => s + r.size, 0);
  const bottleneckCount = requests.filter(r => r.bottleneck).length;
  const avgTtfb = Math.round(requests.reduce((s, r) => {
    const ttfb = r.phases.find(p => p.name === 'ttfb');
    return s + (ttfb?.durationMs ?? 0);
  }, 0) / requests.length);

  const filtered = useMemo(() => requests.filter(r => {
    const matchSearch = !searchFilter || r.url.toLowerCase().includes(searchFilter.toLowerCase());
    const matchType = typeFilter === 'all'
      || (typeFilter === 'doc' && r.mimeType.includes('html'))
      || (typeFilter === 'js' && r.mimeType.includes('javascript'))
      || (typeFilter === 'css' && r.mimeType.includes('css'))
      || (typeFilter === 'img' && r.mimeType.includes('image'))
      || (typeFilter === 'api' && r.mimeType.includes('json'))
      || (typeFilter === 'other' && !['html','javascript','css','image','json'].some(t => r.mimeType.includes(t)));
    return matchSearch && matchType;
  }), [requests, searchFilter, typeFilter]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-cyan-400" />
          <h3 className="text-sm font-semibold">Traffic Timing Waterfall</h3>
          <span className="text-xs text-gray-500 ml-2">— {destination}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded text-gray-400"><X size={14} /></button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 px-4 py-2 border-b border-gray-800/60 bg-gray-800/30">
        {[
          { label: 'Requests', value: totalRequests, color: 'text-blue-400' },
          { label: 'Transferred', value: formatSize(totalSize), color: 'text-green-400' },
          { label: 'Avg TTFB', value: formatMs(avgTtfb), color: avgTtfb > 200 ? 'text-red-400' : 'text-green-400' },
          { label: 'Bottlenecks', value: bottleneckCount, color: bottleneckCount > 0 ? 'text-yellow-400' : 'text-green-400' },
          { label: 'Page Load', value: formatMs(maxTime), color: maxTime > 500 ? 'text-orange-400' : 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="text-xs">
            <span className="text-gray-500">{s.label}: </span>
            <span className={`font-mono font-medium ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800/60">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Filter URLs..."
            className="w-full pl-7 pr-3 py-1 bg-gray-800 border border-gray-700 rounded text-xs focus:outline-none focus:border-cyan-600/50"
          />
        </div>
        <div className="flex gap-1">
          {['all','doc','js','css','img','api','other'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={clsx(
                'px-2 py-0.5 rounded text-[10px] uppercase font-medium transition-colors',
                typeFilter === t ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-600/40' : 'text-gray-500 hover:text-gray-300'
              )}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Phase legend */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-gray-800/60 bg-gray-800/20">
        {Object.entries(PHASE_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-sm ${PHASE_COLORS[key]}`} />
            <span className="text-[10px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Waterfall table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-800/50">
              <th className="px-3 py-2 text-left w-8">#</th>
              <th className="px-3 py-2 text-left" style={{ minWidth: 220 }}>Name</th>
              <th className="px-3 py-2 text-center w-14">Status</th>
              <th className="px-3 py-2 text-center w-16">Type</th>
              <th className="px-3 py-2 text-right w-16">Size</th>
              <th className="px-3 py-2 text-right w-16">Time</th>
              <th className="px-3 py-2 text-left" style={{ minWidth: 380 }}>Waterfall</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {filtered.map((req, idx) => {
              const expanded = expandedId === req.id;
              const urlPath = (() => {
                try { return new URL(req.url).pathname + new URL(req.url).search; }
                catch { return req.url; }
              })();
              const hostname = (() => {
                try { return new URL(req.url).hostname; }
                catch { return ''; }
              })();

              return (
                <tr key={req.id} className="group">
                  <td className="px-3 py-1.5 text-gray-600">{idx + 1}</td>
                  <td className="px-3 py-1.5">
                    <button
                      onClick={() => setExpandedId(expanded ? null : req.id)}
                      className="flex items-center gap-1 text-left w-full"
                    >
                      {expanded ? <ChevronDown size={10} className="text-gray-500 shrink-0" /> : <ChevronRight size={10} className="text-gray-500 shrink-0" />}
                      <div className="truncate">
                        <span className="text-gray-300 group-hover:text-white transition-colors">{urlPath || '/'}</span>
                        <span className="text-gray-600 ml-1">{hostname}</span>
                      </div>
                      {req.bottleneck && <AlertTriangle size={10} className="text-yellow-500 shrink-0 ml-1" />}
                    </button>
                    {/* Expanded detail */}
                    {expanded && (
                      <div className="mt-2 ml-3 p-3 bg-gray-800/60 rounded-lg border border-gray-700/60 space-y-3">
                        {/* General */}
                        <div className="space-y-1">
                          <div className="text-[10px] font-semibold uppercase text-gray-500 mb-1">General</div>
                          {[
                            ['URL', req.url],
                            ['Method', req.method],
                            ['Status', `${req.status}`],
                            ['Remote Address', req.remoteAddress],
                            ['Protocol', req.httpVersion],
                            ['TLS', req.tlsVersion ?? 'N/A'],
                            ['Priority', req.priority],
                            ['Initiator', req.initiator],
                          ].map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span className="text-gray-500 w-24 shrink-0">{k}:</span>
                              <span className="text-gray-300 font-mono break-all">{v}</span>
                            </div>
                          ))}
                        </div>
                        {/* Timing breakdown */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-semibold uppercase text-gray-500 mb-1">Timing Breakdown</div>
                          {req.phases.map(phase => (
                            <div key={phase.name} className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${phase.color}`} />
                              <span className="text-gray-400 w-32 shrink-0">{phase.label}</span>
                              <div className="flex-1 h-3 bg-gray-900 rounded overflow-hidden">
                                <div
                                  className={`h-full rounded ${phase.color}`}
                                  style={{ width: `${Math.max((phase.durationMs / req.totalMs) * 100, 2)}%` }}
                                />
                              </div>
                              <span className="text-gray-400 font-mono w-16 text-right">{formatMs(phase.durationMs)}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 pt-1 border-t border-gray-700/40">
                            <span className="w-2.5" />
                            <span className="text-gray-300 font-medium w-32">Total</span>
                            <div className="flex-1" />
                            <span className="text-white font-mono font-medium w-16 text-right">{formatMs(req.totalMs)}</span>
                          </div>
                        </div>
                        {/* Bottleneck diagnosis */}
                        {req.bottleneck && (
                          <div className="flex items-start gap-2 p-2 bg-yellow-900/20 border border-yellow-700/40 rounded">
                            <AlertTriangle size={12} className="text-yellow-400 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-yellow-300 text-[11px] font-medium">Bottleneck Detected: </span>
                              <span className="text-yellow-200/70 text-[11px]">{req.bottleneck}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={`px-3 py-1.5 text-center font-mono ${statusColor(req.status)}`}>{req.status}</td>
                  <td className="px-3 py-1.5 text-center text-gray-500">
                    {req.mimeType.split('/').pop()?.replace('javascript','js').replace('plain','txt')}
                  </td>
                  <td className="px-3 py-1.5 text-right text-gray-500 font-mono">{formatSize(req.size)}</td>
                  <td className={clsx('px-3 py-1.5 text-right font-mono', req.totalMs > 500 ? 'text-red-400' : req.totalMs > 200 ? 'text-yellow-400' : 'text-gray-400')}>
                    {formatMs(req.totalMs)}
                  </td>
                  <td className="px-3 py-1.5">
                    {/* Waterfall bar */}
                    <div className="relative h-4" style={{ minWidth: 360 }}>
                      {req.phases.map(phase => (
                        <div
                          key={phase.name}
                          className={`absolute top-0.5 h-3 rounded-sm ${phase.color} opacity-90`}
                          style={{
                            left: `${(phase.startMs / scaleMax) * 100}%`,
                            width: `${Math.max((phase.durationMs / scaleMax) * 100, 0.4)}%`,
                          }}
                          title={`${phase.label}: ${formatMs(phase.durationMs)}`}
                        />
                      ))}
                      {/* Time scale ticks */}
                      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                        <div
                          key={pct}
                          className="absolute top-0 h-4 border-l border-gray-700/30"
                          style={{ left: `${pct * 100}%` }}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* Scale labels */}
        <div className="relative h-4 mx-3 mb-2" style={{ minWidth: 360, marginLeft: 'calc(220px + 14px + 56px + 64px + 64px + 64px + 24px)' }}>
          {[0, 0.25, 0.5, 0.75, 1].map(pct => (
            <span
              key={pct}
              className="absolute text-[9px] text-gray-600 font-mono -translate-x-1/2"
              style={{ left: `${pct * 100}%` }}
            >
              {formatMs(scaleMax * pct)}
            </span>
          ))}
        </div>
      </div>

      {/* Diagnosis summary */}
      <div className="px-4 py-3 border-t border-gray-800 bg-gray-800/20">
        <h4 className="text-[11px] font-semibold uppercase text-gray-500 mb-2">Performance Diagnosis</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* DNS */}
          {(() => {
            const dnsTotal = requests.reduce((s, r) => s + (r.phases.find(p => p.name === 'dns')?.durationMs ?? 0), 0);
            const bad = dnsTotal > 50;
            return (
              <div className={`p-2 rounded-lg border ${bad ? 'border-yellow-700/40 bg-yellow-900/10' : 'border-gray-700/40 bg-gray-800/30'}`}>
                <div className="flex items-center gap-1.5">
                  <Globe size={12} className={bad ? 'text-yellow-400' : 'text-green-400'} />
                  <span className="text-[11px] font-medium text-gray-300">DNS Resolution</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {bad ? `Total ${formatMs(dnsTotal)} across requests. Consider DNS prefetching or faster resolver.` : 'DNS resolution times are healthy.'}
                </p>
              </div>
            );
          })()}
          {/* TTFB */}
          {(() => {
            const bad = avgTtfb > 200;
            const slowReqs = requests.filter(r => (r.phases.find(p => p.name === 'ttfb')?.durationMs ?? 0) > 300);
            return (
              <div className={`p-2 rounded-lg border ${bad ? 'border-red-700/40 bg-red-900/10' : 'border-gray-700/40 bg-gray-800/30'}`}>
                <div className="flex items-center gap-1.5">
                  <Server size={12} className={bad ? 'text-red-400' : 'text-green-400'} />
                  <span className="text-[11px] font-medium text-gray-300">Server Response (TTFB)</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {bad ? `Avg ${formatMs(avgTtfb)}. ${slowReqs.length} request(s) > 300ms. Server-side optimization needed.` : `Avg ${formatMs(avgTtfb)}. Server response times are good.`}
                </p>
              </div>
            );
          })()}
          {/* TLS */}
          {(() => {
            const tlsTotal = requests.reduce((s, r) => s + (r.phases.find(p => p.name === 'tls')?.durationMs ?? 0), 0);
            const bad = tlsTotal > 80;
            return (
              <div className={`p-2 rounded-lg border ${bad ? 'border-purple-700/40 bg-purple-900/10' : 'border-gray-700/40 bg-gray-800/30'}`}>
                <div className="flex items-center gap-1.5">
                  <Lock size={12} className={bad ? 'text-purple-400' : 'text-green-400'} />
                  <span className="text-[11px] font-medium text-gray-300">TLS Handshake</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {bad ? `Total ${formatMs(tlsTotal)}. Enable TLS 1.3 & connection reuse for optimization.` : 'TLS negotiation overhead is minimal.'}
                </p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
