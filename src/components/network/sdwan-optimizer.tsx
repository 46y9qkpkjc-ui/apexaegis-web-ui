'use client';
import { useState, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import {
  X, Globe, Zap, Signal, BarChart3, RefreshCw, CheckCircle2,
  ArrowRight, ChevronDown, ChevronRight, AlertTriangle, Router,
  Activity, MapPin, Star, Shield, Clock,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
interface CdnPoP {
  id: string;
  name: string;
  city: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  provider: string;
}

interface PathMetrics {
  latencyMs: number;
  jitterMs: number;
  packetLossPct: number;
  bandwidthMbps: number;
  hopCount: number;
  reliability: number; // 0-100
  congestionLevel: 'none' | 'low' | 'moderate' | 'high';
}

interface SdwanPath {
  id: string;
  label: string;
  sourcePop: CdnPoP;
  intermediatePops: CdnPoP[];
  destinationPop: CdnPoP;
  metrics: PathMetrics;
  isOptimal: boolean;
  isActive: boolean;
  protocol: 'IPSEC' | 'GRE' | 'VXLAN' | 'Direct';
  cost: number; // 1-100 metric
}

interface SdwanPolicy {
  id: string;
  name: string;
  appCategory: string;
  metric: 'latency' | 'reliability' | 'bandwidth' | 'cost';
  preferredPaths: string[];
  failoverEnabled: boolean;
}

/* ─── PoP data ──────────────────────────────────────────────── */
const CDN_POPS: CdnPoP[] = [
  { id: 'sg1', name: 'SG-SIN-01', city: 'Singapore', country: 'Singapore', region: 'Asia-Pacific', lat: 1.35, lng: 103.82, provider: 'Cloudflare' },
  { id: 'jp1', name: 'JP-TYO-01', city: 'Tokyo', country: 'Japan', region: 'Asia-Pacific', lat: 35.68, lng: 139.69, provider: 'AWS CloudFront' },
  { id: 'us-w1', name: 'US-LAX-01', city: 'Los Angeles', country: 'USA', region: 'North America', lat: 34.05, lng: -118.24, provider: 'Cloudflare' },
  { id: 'us-e1', name: 'US-IAD-01', city: 'Ashburn', country: 'USA', region: 'North America', lat: 39.04, lng: -77.49, provider: 'AWS CloudFront' },
  { id: 'us-e2', name: 'US-NYC-01', city: 'New York', country: 'USA', region: 'North America', lat: 40.71, lng: -74.01, provider: 'Akamai' },
  { id: 'eu1', name: 'EU-FRA-01', city: 'Frankfurt', country: 'Germany', region: 'Europe', lat: 50.11, lng: 8.68, provider: 'AWS CloudFront' },
  { id: 'eu2', name: 'EU-LHR-01', city: 'London', country: 'UK', region: 'Europe', lat: 51.51, lng: -0.13, provider: 'Cloudflare' },
  { id: 'au1', name: 'AU-SYD-01', city: 'Sydney', country: 'Australia', region: 'Oceania', lat: -33.87, lng: 151.21, provider: 'Akamai' },
  { id: 'in1', name: 'IN-BOM-01', city: 'Mumbai', country: 'India', region: 'Asia-Pacific', lat: 19.08, lng: 72.88, provider: 'Cloudflare' },
  { id: 'br1', name: 'BR-GRU-01', city: 'São Paulo', country: 'Brazil', region: 'South America', lat: -23.55, lng: -46.63, provider: 'AWS CloudFront' },
];

function find(id: string) { return CDN_POPS.find(p => p.id === id)!; }

/* ─── Demo paths ────────────────────────────────────────────── */
const DEMO_PATHS: SdwanPath[] = [
  {
    id: 'path-1', label: 'Singapore Direct → US East',
    sourcePop: find('sg1'), intermediatePops: [find('jp1')], destinationPop: find('us-e1'),
    metrics: { latencyMs: 185, jitterMs: 4, packetLossPct: 0.02, bandwidthMbps: 950, hopCount: 12, reliability: 99.2, congestionLevel: 'none' },
    isOptimal: true, isActive: true, protocol: 'IPSEC', cost: 25,
  },
  {
    id: 'path-2', label: 'Singapore → LA → US East',
    sourcePop: find('sg1'), intermediatePops: [find('us-w1')], destinationPop: find('us-e1'),
    metrics: { latencyMs: 210, jitterMs: 8, packetLossPct: 0.15, bandwidthMbps: 800, hopCount: 15, reliability: 97.8, congestionLevel: 'low' },
    isOptimal: false, isActive: false, protocol: 'IPSEC', cost: 30,
  },
  {
    id: 'path-3', label: 'Singapore → Mumbai → Frankfurt → US East',
    sourcePop: find('sg1'), intermediatePops: [find('in1'), find('eu1')], destinationPop: find('us-e1'),
    metrics: { latencyMs: 290, jitterMs: 15, packetLossPct: 0.5, bandwidthMbps: 600, hopCount: 22, reliability: 94.5, congestionLevel: 'moderate' },
    isOptimal: false, isActive: false, protocol: 'GRE', cost: 45,
  },
  {
    id: 'path-4', label: 'Singapore → Sydney → LA → US East',
    sourcePop: find('sg1'), intermediatePops: [find('au1'), find('us-w1')], destinationPop: find('us-e1'),
    metrics: { latencyMs: 320, jitterMs: 22, packetLossPct: 1.2, bandwidthMbps: 450, hopCount: 25, reliability: 91.3, congestionLevel: 'high' },
    isOptimal: false, isActive: false, protocol: 'VXLAN', cost: 55,
  },
  {
    id: 'path-5', label: 'Singapore → London → NYC → US East',
    sourcePop: find('sg1'), intermediatePops: [find('eu2'), find('us-e2')], destinationPop: find('us-e1'),
    metrics: { latencyMs: 260, jitterMs: 12, packetLossPct: 0.3, bandwidthMbps: 720, hopCount: 18, reliability: 96.1, congestionLevel: 'low' },
    isOptimal: false, isActive: false, protocol: 'IPSEC', cost: 40,
  },
];

const DEMO_POLICIES: SdwanPolicy[] = [
  { id: 'pol-1', name: 'Real-Time Apps (VoIP/Video)', appCategory: 'Real-Time', metric: 'latency', preferredPaths: ['path-1', 'path-2'], failoverEnabled: true },
  { id: 'pol-2', name: 'Business Critical SaaS', appCategory: 'SaaS', metric: 'reliability', preferredPaths: ['path-1'], failoverEnabled: true },
  { id: 'pol-3', name: 'Bulk Data Transfer', appCategory: 'Data', metric: 'bandwidth', preferredPaths: ['path-2', 'path-5'], failoverEnabled: false },
  { id: 'pol-4', name: 'General Web Traffic', appCategory: 'Web', metric: 'cost', preferredPaths: ['path-1', 'path-2', 'path-5'], failoverEnabled: true },
];

/* ─── Helpers ───────────────────────────────────────────────── */
function reliabilityColor(r: number) {
  if (r >= 99) return 'text-green-400';
  if (r >= 97) return 'text-yellow-400';
  return 'text-red-400';
}

function congestionBadge(c: string) {
  const map: Record<string, string> = {
    none: 'bg-green-900/40 text-green-400 border-green-700',
    low: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
    moderate: 'bg-orange-900/30 text-orange-400 border-orange-700',
    high: 'bg-red-900/30 text-red-400 border-red-700',
  };
  return map[c] ?? map.none;
}

function metricScore(path: SdwanPath) {
  return (
    (1000 - path.metrics.latencyMs) * 0.3 +
    path.metrics.reliability * 0.3 +
    (path.metrics.bandwidthMbps / 10) * 0.2 +
    (100 - path.metrics.packetLossPct * 100) * 0.1 +
    (100 - path.cost) * 0.1
  );
}

/* ═══════════════════════════════════════════════════════════════
   SD-WAN MULTI-PATH OPTIMIZER
   ═══════════════════════════════════════════════════════════════ */
interface SdwanOptimizerProps {
  onClose?: () => void;
}

export function SdwanOptimizer({ onClose }: SdwanOptimizerProps) {
  const [paths, setPaths] = useState(DEMO_PATHS);
  const [policies] = useState(DEMO_POLICIES);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [tab, setTab] = useState<'paths' | 'policies' | 'analytics'>('paths');
  const [optimizing, setOptimizing] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState(false);

  /* Live metrics simulation */
  useEffect(() => {
    if (!liveMetrics) return;
    const iv = setInterval(() => {
      setPaths(prev => prev.map(p => ({
        ...p,
        metrics: {
          ...p.metrics,
          latencyMs: Math.max(50, p.metrics.latencyMs + (Math.random() - 0.5) * 20),
          jitterMs: Math.max(1, p.metrics.jitterMs + (Math.random() - 0.5) * 3),
          packetLossPct: Math.max(0, +(p.metrics.packetLossPct + (Math.random() - 0.5) * 0.1).toFixed(2)),
        },
      })));
    }, 2000);
    return () => clearInterval(iv);
  }, [liveMetrics]);

  /* Optimize paths */
  function runOptimization() {
    setOptimizing(true);
    setTimeout(() => {
      setPaths(prev => {
        const scored = prev.map(p => ({ path: p, score: metricScore(p) }));
        scored.sort((a, b) => b.score - a.score);
        return scored.map((s, i) => ({
          ...s.path,
          isOptimal: i === 0,
          isActive: i === 0,
        }));
      });
      setOptimizing(false);
    }, 1200);
  }

  const activePath = paths.find(p => p.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Router size={24} className="text-cyan-400" />
          <div>
            <h1 className="text-xl font-semibold">SD-WAN Path Optimizer</h1>
            <p className="text-sm text-gray-500">Multi-path optimization with intelligent CDN routing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiveMetrics(v => !v)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              liveMetrics ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700',
            )}
          >
            <Activity size={14} className={liveMetrics ? 'animate-pulse' : ''} />
            {liveMetrics ? 'Live' : 'Live Metrics'}
          </button>
          <button
            onClick={runOptimization}
            disabled={optimizing}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {optimizing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            {optimizing ? 'Optimizing…' : 'Optimize Paths'}
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={14} /></button>
          )}
        </div>
      </div>

      {/* Active route card */}
      {activePath && (
        <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-700/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star size={14} className="text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-300">Active Optimal Route</span>
              <span className="px-2 py-0.5 bg-green-900/40 border border-green-700 rounded text-[10px] font-medium text-green-400">ACTIVE</span>
            </div>
            <span className="text-xs text-gray-500">{activePath.protocol} tunnel</span>
          </div>
          {/* Visual path */}
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            <PopNode pop={activePath.sourcePop} color="cyan" label="Source" />
            {activePath.intermediatePops.map((pop, i) => (
              <span key={pop.id} className="contents">
                <PathArrow latency={Math.round(activePath.metrics.latencyMs / (activePath.intermediatePops.length + 1))} />
                <PopNode pop={pop} color="blue" label={`Hop ${i + 1}`} />
              </span>
            ))}
            <PathArrow latency={Math.round(activePath.metrics.latencyMs / (activePath.intermediatePops.length + 1))} />
            <PopNode pop={activePath.destinationPop} color="green" label="Destination" />
          </div>
          <div className="flex gap-6 mt-3 text-xs">
            <Metric label="Latency" value={`${activePath.metrics.latencyMs.toFixed(0)} ms`} good={activePath.metrics.latencyMs < 200} />
            <Metric label="Jitter" value={`${activePath.metrics.jitterMs.toFixed(1)} ms`} good={activePath.metrics.jitterMs < 10} />
            <Metric label="Loss" value={`${activePath.metrics.packetLossPct}%`} good={activePath.metrics.packetLossPct < 0.1} />
            <Metric label="Bandwidth" value={`${activePath.metrics.bandwidthMbps} Mbps`} good={activePath.metrics.bandwidthMbps > 500} />
            <Metric label="Reliability" value={`${activePath.metrics.reliability}%`} good={activePath.metrics.reliability > 98} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {(['paths', 'policies', 'analytics'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize',
              tab === t ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-300',
            )}
          >{t}</button>
        ))}
      </div>

      {/* ─── Paths Tab ─────────────────────────────────────── */}
      {tab === 'paths' && (
        <div className="space-y-3">
          {paths.map((path, idx) => {
            const expanded = selectedPath === path.id;
            const score = metricScore(path);
            return (
              <div key={path.id} className={clsx(
                'bg-gray-900 border rounded-xl overflow-hidden transition-colors',
                path.isOptimal ? 'border-cyan-700/60' : 'border-gray-800',
              )}>
                <button
                  onClick={() => setSelectedPath(expanded ? null : path.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className="flex items-center gap-2 w-8">
                    {path.isOptimal && <Star size={14} className="text-cyan-400" />}
                    {!path.isOptimal && <span className="text-gray-600 text-sm font-mono">#{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-200 truncate">{path.label}</span>
                      {path.isActive && <span className="px-1.5 py-0.5 bg-green-900/40 border border-green-700 rounded text-[9px] text-green-400">ACTIVE</span>}
                      <span className={`px-1.5 py-0.5 rounded text-[9px] border ${congestionBadge(path.metrics.congestionLevel)}`}>{path.metrics.congestionLevel}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-500">
                      <MapPin size={9} />{path.sourcePop.city}
                      {path.intermediatePops.map(p => <span key={p.id} className="contents"> → {p.city}</span>)}
                      <span> → {path.destinationPop.city}</span>
                    </div>
                  </div>
                  {/* Mini metrics */}
                  <div className="flex gap-4 text-xs shrink-0">
                    <span className={path.metrics.latencyMs < 200 ? 'text-green-400' : path.metrics.latencyMs < 300 ? 'text-yellow-400' : 'text-red-400'}>
                      {path.metrics.latencyMs.toFixed(0)}ms
                    </span>
                    <span className={reliabilityColor(path.metrics.reliability)}>
                      {path.metrics.reliability}%
                    </span>
                    <span className="text-gray-500 font-mono">{path.protocol}</span>
                  </div>
                  {/* Score bar */}
                  <div className="w-20 shrink-0">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${(score / 400) * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-gray-500 mt-0.5 block text-center">Score {score.toFixed(0)}</span>
                  </div>
                  {expanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                </button>

                {expanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-gray-800">
                    {/* Detailed metrics */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 pt-3">
                      {[
                        { label: 'Latency', value: `${path.metrics.latencyMs.toFixed(0)} ms`, bad: path.metrics.latencyMs > 250 },
                        { label: 'Jitter', value: `${path.metrics.jitterMs.toFixed(1)} ms`, bad: path.metrics.jitterMs > 15 },
                        { label: 'Packet Loss', value: `${path.metrics.packetLossPct}%`, bad: path.metrics.packetLossPct > 0.5 },
                        { label: 'Bandwidth', value: `${path.metrics.bandwidthMbps} Mbps`, bad: path.metrics.bandwidthMbps < 500 },
                        { label: 'Hops', value: `${path.metrics.hopCount}`, bad: path.metrics.hopCount > 20 },
                        { label: 'Cost', value: `${path.cost}`, bad: path.cost > 50 },
                      ].map(m => (
                        <div key={m.label} className={`p-2 rounded-lg border ${m.bad ? 'border-red-700/30 bg-red-900/10' : 'border-gray-700/40 bg-gray-800/30'}`}>
                          <div className="text-[10px] text-gray-500">{m.label}</div>
                          <div className={`text-sm font-mono font-medium ${m.bad ? 'text-red-400' : 'text-gray-200'}`}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                    {/* Visual path */}
                    <div className="flex items-center gap-0 overflow-x-auto py-2">
                      <PopNode pop={path.sourcePop} color="cyan" label="Source" />
                      {path.intermediatePops.map((pop, i) => (
                        <span key={pop.id} className="contents">
                          <PathArrow latency={Math.round(path.metrics.latencyMs / (path.intermediatePops.length + 1))} />
                          <PopNode pop={pop} color="blue" label={pop.provider} />
                        </span>
                      ))}
                      <PathArrow latency={Math.round(path.metrics.latencyMs / (path.intermediatePops.length + 1))} />
                      <PopNode pop={path.destinationPop} color="green" label="Destination" />
                    </div>
                    {/* Activate button */}
                    {!path.isActive && (
                      <button
                        onClick={() => setPaths(prev => prev.map(p => ({ ...p, isActive: p.id === path.id, isOptimal: p.id === path.id })))}
                        className="w-full py-2 bg-cyan-600/20 border border-cyan-700/40 text-cyan-300 rounded-lg text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                      >
                        Switch to This Path
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Policies Tab ──────────────────────────────────── */}
      {tab === 'policies' && (
        <div className="space-y-3">
          {policies.map(pol => (
            <div key={pol.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-blue-400" />
                    <span className="text-sm font-medium text-gray-200">{pol.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>Category: <span className="text-gray-400">{pol.appCategory}</span></span>
                    <span>Optimize for: <span className="text-cyan-400 capitalize">{pol.metric}</span></span>
                    <span>Failover: <span className={pol.failoverEnabled ? 'text-green-400' : 'text-gray-500'}>{pol.failoverEnabled ? 'Enabled' : 'Disabled'}</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pol.preferredPaths.map(pid => {
                    const p = paths.find(x => x.id === pid);
                    return p ? (
                      <span key={pid} className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-400">
                        {p.sourcePop.city} → {p.destinationPop.city}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Analytics Tab ──────────────────────────────────── */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          {/* Latency comparison */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Latency Comparison (ms)</h3>
            <div className="space-y-2">
              {paths.slice().sort((a, b) => a.metrics.latencyMs - b.metrics.latencyMs).map(path => {
                const maxLat = Math.max(...paths.map(p => p.metrics.latencyMs));
                const pct = (path.metrics.latencyMs / maxLat) * 100;
                return (
                  <div key={path.id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-48 truncate shrink-0">{path.label}</span>
                    <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden relative">
                      <div
                        className={clsx('h-full rounded transition-all duration-700', path.isOptimal ? 'bg-cyan-500' : 'bg-gray-600')}
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute right-2 top-0.5 text-[10px] font-mono text-gray-300">{path.metrics.latencyMs.toFixed(0)} ms</span>
                    </div>
                    {path.isOptimal && <Star size={12} className="text-cyan-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reliability comparison */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Reliability Score (%)</h3>
            <div className="space-y-2">
              {paths.slice().sort((a, b) => b.metrics.reliability - a.metrics.reliability).map(path => (
                <div key={path.id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-48 truncate shrink-0">{path.label}</span>
                  <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden relative">
                    <div
                      className={clsx('h-full rounded transition-all duration-700',
                        path.metrics.reliability >= 99 ? 'bg-green-500' : path.metrics.reliability >= 97 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ width: `${path.metrics.reliability}%` }}
                    />
                    <span className="absolute right-2 top-0.5 text-[10px] font-mono text-gray-300">{path.metrics.reliability}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Path health summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Paths', value: paths.length, icon: Router, color: 'text-blue-400' },
              { label: 'Avg Latency', value: `${Math.round(paths.reduce((s, p) => s + p.metrics.latencyMs, 0) / paths.length)} ms`, icon: Clock, color: 'text-cyan-400' },
              { label: 'Best Reliability', value: `${Math.max(...paths.map(p => p.metrics.reliability))}%`, icon: CheckCircle2, color: 'text-green-400' },
              { label: 'Congested', value: paths.filter(p => p.metrics.congestionLevel === 'high' || p.metrics.congestionLevel === 'moderate').length, icon: AlertTriangle, color: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <s.icon size={14} className={s.color} />
                  <span className="text-[11px] text-gray-500">{s.label}</span>
                </div>
                <div className={`text-lg font-semibold mt-1 ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */
function PopNode({ pop, color, label }: { pop: CdnPoP; color: 'cyan' | 'blue' | 'green'; label: string }) {
  const colors = {
    cyan: 'border-cyan-600 bg-cyan-900/30',
    blue: 'border-blue-600 bg-blue-900/30',
    green: 'border-green-600 bg-green-900/30',
  };
  const textColors = { cyan: 'text-cyan-400', blue: 'text-blue-400', green: 'text-green-400' };
  return (
    <div className={`flex flex-col items-center p-2 rounded-lg border ${colors[color]} min-w-[90px]`}>
      <Globe size={14} className={textColors[color]} />
      <span className="text-[11px] font-medium text-gray-200 mt-1">{pop.city}</span>
      <span className="text-[9px] text-gray-500">{pop.name}</span>
      <span className="text-[9px] text-gray-600">{label}</span>
    </div>
  );
}

function PathArrow({ latency }: { latency: number }) {
  return (
    <div className="flex flex-col items-center mx-1">
      <ArrowRight size={14} className="text-gray-600" />
      <span className="text-[8px] text-gray-600 font-mono">{latency}ms</span>
    </div>
  );
}

function Metric({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div>
      <span className="text-gray-500">{label}: </span>
      <span className={`font-mono font-medium ${good ? 'text-green-400' : 'text-red-400'}`}>{value}</span>
    </div>
  );
}


