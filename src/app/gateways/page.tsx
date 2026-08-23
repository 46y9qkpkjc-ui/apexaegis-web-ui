'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Server, Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw, MapPin,
  Power, X, Ban, Globe, Network, Route, Shield, Zap,
  GitBranch, Lock, ChevronRight, BarChart3, ArrowLeftRight,
} from 'lucide-react';
import { fetchGateways, type ApiGateway } from '@/lib/gateway-api';

interface GatewayNode {
  id: string;
  name: string;
  region: string;
  location: string;
  kind: 'internet' | 'private';
  status: 'healthy' | 'degraded' | 'offline';
  publicIp: string;
  version: string;
  cpu: number;
  memory: number;
  tunnels: number;
  throughput: string;
  uptime: string;
  lastHeartbeat: string;
  mtlsIssued: boolean;
  adminDisabled: boolean;
  disableReason?: string;
}

function fromApi(gw: ApiGateway): GatewayNode {
  const statusMap: Record<string, GatewayNode['status']> = {
    online: 'healthy',
    degraded: 'degraded',
    offline: 'offline',
    draining: 'degraded',
  };

  const lastSeen = gw.last_heartbeat
    ? (() => {
        const diffSec = Math.floor((Date.now() - new Date(gw.last_heartbeat).getTime()) / 1000);
        if (diffSec < 60) return `${diffSec}s ago`;
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        return `${Math.floor(diffSec / 3600)}h ago`;
      })()
    : '—';

  const uptime = gw.registered_at
    ? (() => {
        const diffSec = Math.floor((Date.now() - new Date(gw.registered_at).getTime()) / 1000);
        const h = Math.floor(diffSec / 3600);
        const d = Math.floor(h / 24);
        return d > 0 ? `${d}d ${h % 24}h` : `${h}h ${Math.floor((diffSec % 3600) / 60)}m`;
      })()
    : '—';

  return {
    id: gw.id,
    name: gw.name || `gw-${gw.id}`,
    region: gw.location || gw.region,
    location: gw.id,
    kind: gw.deploy_mode === 'private-access' ? 'private' : 'internet',
    status: statusMap[gw.status] ?? 'offline',
    publicIp: gw.public_host,
    version: gw.version || '1.0.0',
    cpu: 0,
    memory: 0,
    tunnels: 0,
    throughput: '—',
    uptime,
    lastHeartbeat: lastSeen,
    mtlsIssued: gw.mtls_issued,
    adminDisabled: false,
  };
}

interface ApexphalanxPath {
  id: string;
  name: string;
  hops: string[];
  latency: number;
  bandwidth: string;
  isolationDomain: string;
  status: 'active' | 'standby' | 'failover';
  mplsLabel: number;
  pathType: 'primary' | 'backup' | 'on-demand';
  encryption: string;
  trustScore: number;
}

const apexphalanxPaths: ApexphalanxPath[] = [
  {
    id: 'sp-1', name: 'APAC Express → NA West',
    hops: ['Singapore (SG)', 'Tokyo (JP)', 'San Jose (US)'],
    latency: 142, bandwidth: '400 Gbps', isolationDomain: 'ISD-1 (ApexAegis Sovereign)',
    status: 'active', mplsLabel: 100201, pathType: 'primary', encryption: 'AES-256-GCM + Apexphalanx DRKey', trustScore: 99,
  },
  {
    id: 'sp-2', name: 'APAC Express → EU Core',
    hops: ['Singapore (SG)', 'Mumbai (IN)', 'Dubai (AE)', 'Frankfurt (DE)'],
    latency: 148, bandwidth: '400 Gbps', isolationDomain: 'ISD-1 (ApexAegis Sovereign)',
    status: 'active', mplsLabel: 100202, pathType: 'primary', encryption: 'AES-256-GCM + Apexphalanx DRKey', trustScore: 98,
  },
  {
    id: 'sp-3', name: 'Trans-Pacific Backup',
    hops: ['Singapore (SG)', 'Sydney (AU)', 'Auckland (NZ)', 'San Jose (US)'],
    latency: 186, bandwidth: '200 Gbps', isolationDomain: 'ISD-2 (Pacific Ring)',
    status: 'standby', mplsLabel: 100301, pathType: 'backup', encryption: 'AES-256-GCM + Apexphalanx DRKey', trustScore: 97,
  },
  {
    id: 'sp-4', name: 'EU ↔ NA Express',
    hops: ['London (GB)', 'Ashburn (US)', 'Chicago (US)'],
    latency: 72, bandwidth: '800 Gbps', isolationDomain: 'ISD-3 (Atlantic Secure)',
    status: 'active', mplsLabel: 100401, pathType: 'primary', encryption: 'AES-256-GCM + Apexphalanx DRKey', trustScore: 99,
  },
  {
    id: 'sp-5', name: 'Sovereign APAC Ring',
    hops: ['Singapore (SG)', 'Hong Kong (HK)', 'Tokyo (JP)', 'Seoul (KR)', 'Singapore (SG)'],
    latency: 94, bandwidth: '1.2 Tbps', isolationDomain: 'ISD-1 (ApexAegis Sovereign)',
    status: 'active', mplsLabel: 100501, pathType: 'primary', encryption: 'AES-256-GCM + Post-Quantum CRYSTALS-Kyber', trustScore: 100,
  },
  {
    id: 'sp-6', name: 'MEA → APAC Direct',
    hops: ['Dubai (AE)', 'Mumbai (IN)', 'Singapore (SG)'],
    latency: 108, bandwidth: '200 Gbps', isolationDomain: 'ISD-4 (Gulf-Asia Corridor)',
    status: 'active', mplsLabel: 100601, pathType: 'primary', encryption: 'AES-256-GCM + Apexphalanx DRKey', trustScore: 96,
  },
  {
    id: 'sp-7', name: 'LATAM → NA Failover',
    hops: ['São Paulo (BR)', 'Miami (US)', 'Ashburn (US)'],
    latency: 134, bandwidth: '100 Gbps', isolationDomain: 'ISD-5 (Americas)',
    status: 'failover', mplsLabel: 100701, pathType: 'on-demand', encryption: 'AES-256-GCM + Apexphalanx DRKey', trustScore: 94,
  },
];

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string; bg: string }> = {
  healthy: { icon: CheckCircle, color: 'text-green-400', label: 'Healthy', bg: 'bg-green-900/40 border-green-800' },
  degraded: { icon: AlertTriangle, color: 'text-yellow-400', label: 'Degraded', bg: 'bg-yellow-900/40 border-yellow-800' },
  offline: { icon: XCircle, color: 'text-red-400', label: 'Offline', bg: 'bg-red-900/40 border-red-800' },
};

const pathStatusColors: Record<string, { color: string; bg: string }> = {
  active: { color: 'text-green-400', bg: 'bg-green-900/30 border-green-800' },
  standby: { color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-800' },
  failover: { color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-800' },
};

function CpuBar({ value }: { value: number }) {
  const color = value > 80 ? 'bg-red-500' : value > 60 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-gray-400">{value}%</span>
    </div>
  );
}

function GatewayCard({ gw, onToggle }: { gw: GatewayNode; onToggle: () => void }) {
  const st = statusConfig[gw.status];
  const StatusIcon = st.icon;
  return (
    <div className={`bg-gray-900 border rounded-xl p-5 ${gw.adminDisabled ? 'border-red-800/50 opacity-60' : 'border-gray-800'} ${gw.status === 'offline' && !gw.adminDisabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Server size={18} className="text-emerald-400" />
          <div>
            <h3 className="font-semibold font-mono text-sm">{gw.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={10} /> {gw.region}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${st.bg} ${st.color}`}>
                <StatusIcon size={10} />
                {st.label}
              </span>
              {gw.mtlsIssued && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border bg-emerald-900/30 text-emerald-400 border-emerald-800">
                  <Lock size={10} /> mTLS
                </span>
              )}
              {gw.adminDisabled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border bg-red-900/40 text-red-400 border-red-800">
                  <Ban size={10} /> Admin Disabled
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              gw.adminDisabled
                ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-800'
                : 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800'
            }`}
            title={gw.adminDisabled ? 'Re-enable this gateway for user connections' : 'Disable this gateway — users will not be able to connect'}
          >
            <Power size={12} />
            {gw.adminDisabled ? 'Enable' : 'Disable'}
          </button>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>Heartbeat: <span className="text-gray-300">{gw.lastHeartbeat}</span></div>
          <div>Uptime: <span className="text-gray-300">{gw.uptime}</span></div>
        </div>
      </div>

      {gw.adminDisabled && gw.disableReason && (
        <div className="mb-3 px-3 py-2 bg-red-900/20 border border-red-800/30 rounded-lg text-xs text-red-300 flex items-center gap-2">
          <Ban size={12} className="shrink-0" /> <span className="text-gray-400">Reason:</span> {gw.disableReason}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
        <div className="p-3 bg-gray-800/30 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Public IP</div>
          <span className="text-xs text-gray-300 font-mono">{gw.publicIp}</span>
        </div>
        <div className="p-3 bg-gray-800/30 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Version</div>
          <span className="text-xs text-gray-300 font-mono">{gw.version}</span>
        </div>
        <div className="p-3 bg-gray-800/30 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">CPU</div>
          <CpuBar value={gw.cpu} />
        </div>
        <div className="p-3 bg-gray-800/30 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Memory</div>
          <CpuBar value={gw.memory} />
        </div>
        <div className="p-3 bg-gray-800/30 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Tunnels</div>
          <span className="text-sm text-gray-300 font-medium">{gw.tunnels}</span>
        </div>
        <div className="p-3 bg-gray-800/30 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Throughput</div>
          <span className="text-sm text-gray-300 font-medium">{gw.throughput}</span>
        </div>
      </div>
    </div>
  );
}

type ActiveTab = 'gateways' | 'apexphalanx';

export default function GatewayNodesPage() {
  const [gateways, setGateways] = useState<GatewayNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [disableModal, setDisableModal] = useState<{ gwId: string; action: 'disable' | 'enable' } | null>(null);
  const [disableReason, setDisableReason] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('gateways');
  const [selectedPath, setSelectedPath] = useState<ApexphalanxPath | null>(null);

  const loadGateways = useCallback(async () => {
    try {
      const data = await fetchGateways();
      setGateways(data.map(fromApi));
      setLastRefresh(new Date());
    } catch {
      // keep existing state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGateways();
    const interval = setInterval(loadGateways, 30_000);
    return () => clearInterval(interval);
  }, [loadGateways]);

  const handleAdminToggle = () => {
    if (!disableModal) return;
    setGateways(prev => prev.map(gw => {
      if (gw.id !== disableModal.gwId) return gw;
      if (disableModal.action === 'disable') {
        return { ...gw, adminDisabled: true, disableReason: disableReason || 'Disabled by admin — organization policy' };
      }
      return { ...gw, adminDisabled: false, disableReason: undefined };
    }));
    setDisableModal(null);
    setDisableReason('');
  };

  const healthyCount = gateways.filter(g => g.status === 'healthy').length;
  const totalTunnels = gateways.reduce((sum, g) => sum + g.tunnels, 0);
  const disabledCount = gateways.filter(g => g.adminDisabled).length;
  const activeApexphalanxPaths = apexphalanxPaths.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header — NextGenNodes branding */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Globe size={26} className="text-emerald-400" />
            <Zap size={10} className="text-amber-400 absolute -top-0.5 -right-0.5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              NextGenNodes
            </h1>
            <p className="text-sm text-gray-500">
              Gateway infrastructure for ApexAegis managed security
            </p>
          </div>
        </div>
        <button
          onClick={loadGateways}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {lastRefresh ? `Updated ${Math.floor((Date.now() - lastRefresh.getTime()) / 1000)}s ago` : 'Refresh'}
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 p-1 bg-gray-800/50 rounded-lg border border-gray-700/50 w-fit overflow-x-auto">
        {[
          { key: 'gateways' as ActiveTab, label: 'Gateway Nodes', icon: Server, count: gateways.length },
          { key: 'apexphalanx' as ActiveTab, label: 'Apexphalanx Paths', icon: Route, count: apexphalanxPaths.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-gray-700 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-700 text-gray-500'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════ TAB 1: GATEWAY NODES ═══════════════ */}
      {activeTab === 'gateways' && (
        <>
      {/* Summary chips */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm">
          Total Nodes: <span className="text-white font-medium">{gateways.length}</span>
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-green-900/20 border border-green-800/30 text-sm text-green-400">
          <CheckCircle size={14} className="inline mr-1" /> Healthy: {healthyCount}
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-blue-900/20 border border-blue-800/30 text-sm text-blue-400">
          <Activity size={14} className="inline mr-1" /> Active Tunnels: {totalTunnels}
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-emerald-900/20 border border-emerald-800/30 text-sm text-emerald-400">
          <Network size={14} className="inline mr-1" /> Apexphalanx Active: {activeApexphalanxPaths}/{apexphalanxPaths.length}
        </span>
        {disabledCount > 0 && (
          <span className="px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-800/30 text-sm text-red-400">
            <Ban size={14} className="inline mr-1" /> Admin Disabled: {disabledCount}
          </span>
        )}
      </div>

      {/* Gateway cards — grouped by type (Private Access vs Internet) */}
      <div className="space-y-6">
        {loading && gateways.length === 0 && (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading gateways...
          </div>
        )}
        {!loading && gateways.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 border border-gray-800 rounded-xl">
            <Server size={32} className="mb-3 opacity-40" />
            <p className="text-sm">No gateways registered yet.</p>
            <p className="text-xs mt-1 text-gray-600">Gateways auto-register every 30 seconds.</p>
          </div>
        )}
        {[
          { key: 'private', label: 'Private Access Gateways', icon: Shield, gws: gateways.filter(g => g.kind === 'private') },
          { key: 'internet', label: 'Internet Gateways', icon: Globe, gws: gateways.filter(g => g.kind === 'internet') },
        ].filter(grp => grp.gws.length > 0).map(grp => (
          <div key={grp.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <grp.icon size={16} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-gray-200">{grp.label}</h2>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-400">{grp.gws.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {grp.gws.map(gw => (
                <GatewayCard
                  key={gw.id}
                  gw={gw}
                  onToggle={() => setDisableModal({ gwId: gw.id, action: gw.adminDisabled ? 'enable' : 'disable' })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
        </>/* end gateways tab */
      )}

      {/* ═══════════════ TAB 2: APEXPHALANX PATHS ═══════════════ */}
      {activeTab === 'apexphalanx' && (
        <>
          {/* SCION overview KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Active Paths', value: apexphalanxPaths.filter(p => p.status === 'active').length, icon: Route, color: 'text-green-400' },
              { label: 'Standby Paths', value: apexphalanxPaths.filter(p => p.status === 'standby').length, icon: Route, color: 'text-amber-400' },
              { label: 'Failover Paths', value: apexphalanxPaths.filter(p => p.status === 'failover').length, icon: Route, color: 'text-purple-400' },
              { label: 'Isolation Domains', value: new Set(apexphalanxPaths.map(p => p.isolationDomain)).size, icon: Lock, color: 'text-cyan-400' },
              { label: 'Avg Trust Score', value: (apexphalanxPaths.reduce((s, p) => s + p.trustScore, 0) / apexphalanxPaths.length).toFixed(1) + '%', icon: Shield, color: 'text-emerald-400' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <kpi.icon size={14} className={kpi.color} />
                  <span className="text-xs text-gray-500">{kpi.label}</span>
                </div>
                <span className="text-lg font-semibold">{kpi.value}</span>
              </div>
            ))}
          </div>

          {/* Path cards */}
          <div className="space-y-3">
            {apexphalanxPaths.map(path => {
              const stc = pathStatusColors[path.status];
              return (
                <div
                  key={path.id}
                  className={`bg-gray-900 border rounded-xl p-5 cursor-pointer hover:border-emerald-800/40 transition-colors ${
                    selectedPath?.id === path.id ? 'border-emerald-700' : 'border-gray-800'
                  }`}
                  onClick={() => setSelectedPath(selectedPath?.id === path.id ? null : path)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Route size={16} className="text-emerald-400" />
                      <h3 className="text-sm font-semibold">{path.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs border ${stc.bg} ${stc.color}`}>{path.status}</span>
                      <span className={`px-2 py-0.5 rounded text-xs border ${
                        path.pathType === 'primary' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800' :
                        path.pathType === 'backup' ? 'bg-amber-900/20 text-amber-400 border-amber-800' :
                        'bg-purple-900/20 text-purple-400 border-purple-800'
                      }`}>{path.pathType}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Latency: <span className="text-white font-medium">{path.latency} ms</span></span>
                      <span>Bandwidth: <span className="text-white font-medium">{path.bandwidth}</span></span>
                      <span>Trust: <span className={`font-medium ${path.trustScore >= 98 ? 'text-emerald-400' : path.trustScore >= 95 ? 'text-blue-400' : 'text-amber-400'}`}>{path.trustScore}%</span></span>
                    </div>
                  </div>

                  {/* Hop visualization */}
                  <div className="flex items-center gap-1 mb-3">
                    {path.hops.map((hop, i) => (
                      <div key={i} className="flex items-center">
                        <div className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs font-medium">
                          <MapPin size={10} className="inline mr-1 text-emerald-400" />
                          {hop}
                        </div>
                        {i < path.hops.length - 1 && (
                          <div className="flex items-center mx-1">
                            <div className="w-6 h-px bg-emerald-700" />
                            <ArrowLeftRight size={10} className="text-emerald-600 mx-0.5" />
                            <div className="w-6 h-px bg-emerald-700" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Expanded details */}
                  {selectedPath?.id === path.id && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-800">
                      <div className="p-3 bg-gray-800/30 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Lock size={10} /> Isolation Domain</div>
                        <span className="text-xs text-gray-300">{path.isolationDomain}</span>
                      </div>
                      <div className="p-3 bg-gray-800/30 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><GitBranch size={10} /> MPLS Label</div>
                        <span className="text-xs text-gray-300 font-mono">{path.mplsLabel}</span>
                      </div>
                      <div className="p-3 bg-gray-800/30 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Shield size={10} /> Encryption</div>
                        <span className="text-xs text-gray-300">{path.encryption}</span>
                      </div>
                      <div className="p-3 bg-gray-800/30 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><BarChart3 size={10} /> Trust Score</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full" style={{ width: `${path.trustScore}%` }} />
                          </div>
                          <span className="text-xs text-emerald-400 font-medium">{path.trustScore}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Admin Disable/Enable Confirmation Modal */}
      {disableModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setDisableModal(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Power size={18} className={disableModal.action === 'disable' ? 'text-red-400' : 'text-green-400'} />
                <h3 className="text-sm font-semibold">
                  {disableModal.action === 'disable' ? 'Disable Gateway' : 'Enable Gateway'}
                </h3>
              </div>
              <button onClick={() => setDisableModal(null)} className="text-gray-400 hover:text-gray-200"><X size={16} /></button>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              {disableModal.action === 'disable'
                ? 'Disabling this gateway will prevent users from connecting to it. Active tunnels will be terminated and users will be redirected to other available gateways per organization policy.'
                : 'Re-enabling this gateway will allow users to connect to it again based on their routing policies.'}
            </p>
            {disableModal.action === 'disable' && (
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1">Reason (shown to admins)</label>
                <input
                  value={disableReason}
                  onChange={e => setDisableReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
                  placeholder="e.g. Maintenance window, security incident, capacity planning"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDisableModal(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button
                onClick={handleAdminToggle}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  disableModal.action === 'disable'
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                {disableModal.action === 'disable' ? 'Disable Gateway' : 'Enable Gateway'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
