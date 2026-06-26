'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Server, Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw, MapPin,
  Power, X, Ban, Globe, Network, Route, Shield, Zap, Radio, Waypoints,
  GitBranch, Lock, Eye, ChevronRight, BarChart3, ArrowLeftRight,
  Search,
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

/* ─── Singtel Backbone — 428 PoPs in 362 cities ────────────── */
interface SingtelPoP {
  city: string;
  country: string;
  pops: number;
  tier: 'core' | 'edge' | 'access';
  scionEnabled: boolean;
  mplsRingId: string;
  latencyToCore: number; // ms
  capacity: string;
  peerings: number;
}

interface SingtelRegion {
  name: string;
  code: string;
  cities: number;
  pops: number;
  totalCapacity: string;
  scionPaths: number;
  mplsRings: number;
  topPops: SingtelPoP[];
}

interface ScionPath {
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

const singtelRegions: SingtelRegion[] = [
  {
    name: 'Asia Pacific', code: 'APAC', cities: 128, pops: 156, totalCapacity: '48 Tbps',
    scionPaths: 312, mplsRings: 14,
    topPops: [
      { city: 'Singapore', country: 'SG', pops: 8, tier: 'core', scionEnabled: true, mplsRingId: 'APAC-CORE-1', latencyToCore: 0, capacity: '4.8 Tbps', peerings: 142 },
      { city: 'Tokyo', country: 'JP', pops: 6, tier: 'core', scionEnabled: true, mplsRingId: 'APAC-CORE-2', latencyToCore: 52, capacity: '3.2 Tbps', peerings: 98 },
      { city: 'Hong Kong', country: 'HK', pops: 5, tier: 'core', scionEnabled: true, mplsRingId: 'APAC-CORE-3', latencyToCore: 28, capacity: '2.8 Tbps', peerings: 87 },
      { city: 'Sydney', country: 'AU', pops: 4, tier: 'core', scionEnabled: true, mplsRingId: 'APAC-CORE-4', latencyToCore: 96, capacity: '2.4 Tbps', peerings: 64 },
      { city: 'Mumbai', country: 'IN', pops: 4, tier: 'edge', scionEnabled: true, mplsRingId: 'APAC-EDGE-1', latencyToCore: 68, capacity: '1.6 Tbps', peerings: 52 },
      { city: 'Seoul', country: 'KR', pops: 3, tier: 'edge', scionEnabled: true, mplsRingId: 'APAC-EDGE-2', latencyToCore: 45, capacity: '1.2 Tbps', peerings: 41 },
    ],
  },
  {
    name: 'North America', code: 'NA', cities: 82, pops: 98, totalCapacity: '38 Tbps',
    scionPaths: 224, mplsRings: 11,
    topPops: [
      { city: 'Ashburn', country: 'US', pops: 6, tier: 'core', scionEnabled: true, mplsRingId: 'NA-CORE-1', latencyToCore: 180, capacity: '4.2 Tbps', peerings: 128 },
      { city: 'San Jose', country: 'US', pops: 5, tier: 'core', scionEnabled: true, mplsRingId: 'NA-CORE-2', latencyToCore: 162, capacity: '3.6 Tbps', peerings: 104 },
      { city: 'Chicago', country: 'US', pops: 4, tier: 'core', scionEnabled: true, mplsRingId: 'NA-CORE-3', latencyToCore: 195, capacity: '2.8 Tbps', peerings: 76 },
      { city: 'Dallas', country: 'US', pops: 3, tier: 'edge', scionEnabled: true, mplsRingId: 'NA-EDGE-1', latencyToCore: 210, capacity: '1.4 Tbps', peerings: 48 },
      { city: 'Toronto', country: 'CA', pops: 3, tier: 'edge', scionEnabled: true, mplsRingId: 'NA-EDGE-2', latencyToCore: 200, capacity: '1.2 Tbps', peerings: 38 },
    ],
  },
  {
    name: 'Europe', code: 'EU', cities: 94, pops: 108, totalCapacity: '42 Tbps',
    scionPaths: 268, mplsRings: 12,
    topPops: [
      { city: 'Frankfurt', country: 'DE', pops: 7, tier: 'core', scionEnabled: true, mplsRingId: 'EU-CORE-1', latencyToCore: 148, capacity: '4.4 Tbps', peerings: 136 },
      { city: 'London', country: 'GB', pops: 6, tier: 'core', scionEnabled: true, mplsRingId: 'EU-CORE-2', latencyToCore: 164, capacity: '3.8 Tbps', peerings: 118 },
      { city: 'Amsterdam', country: 'NL', pops: 5, tier: 'core', scionEnabled: true, mplsRingId: 'EU-CORE-3', latencyToCore: 152, capacity: '3.2 Tbps', peerings: 94 },
      { city: 'Paris', country: 'FR', pops: 4, tier: 'edge', scionEnabled: true, mplsRingId: 'EU-EDGE-1', latencyToCore: 158, capacity: '2.1 Tbps', peerings: 72 },
      { city: 'Zurich', country: 'CH', pops: 3, tier: 'edge', scionEnabled: true, mplsRingId: 'EU-EDGE-2', latencyToCore: 150, capacity: '1.8 Tbps', peerings: 56 },
    ],
  },
  {
    name: 'Middle East & Africa', code: 'MEA', cities: 32, pops: 38, totalCapacity: '12 Tbps',
    scionPaths: 86, mplsRings: 5,
    topPops: [
      { city: 'Dubai', country: 'AE', pops: 4, tier: 'core', scionEnabled: true, mplsRingId: 'MEA-CORE-1', latencyToCore: 108, capacity: '2.4 Tbps', peerings: 48 },
      { city: 'Johannesburg', country: 'ZA', pops: 3, tier: 'edge', scionEnabled: true, mplsRingId: 'MEA-EDGE-1', latencyToCore: 186, capacity: '1.2 Tbps', peerings: 28 },
      { city: 'Nairobi', country: 'KE', pops: 2, tier: 'access', scionEnabled: false, mplsRingId: 'MEA-ACC-1', latencyToCore: 210, capacity: '400 Gbps', peerings: 12 },
    ],
  },
  {
    name: 'Latin America', code: 'LATAM', cities: 26, pops: 28, totalCapacity: '8 Tbps',
    scionPaths: 54, mplsRings: 4,
    topPops: [
      { city: 'São Paulo', country: 'BR', pops: 4, tier: 'core', scionEnabled: true, mplsRingId: 'LATAM-CORE-1', latencyToCore: 284, capacity: '2.8 Tbps', peerings: 52 },
      { city: 'Mexico City', country: 'MX', pops: 3, tier: 'edge', scionEnabled: true, mplsRingId: 'LATAM-EDGE-1', latencyToCore: 230, capacity: '1.2 Tbps', peerings: 34 },
      { city: 'Buenos Aires', country: 'AR', pops: 2, tier: 'edge', scionEnabled: true, mplsRingId: 'LATAM-EDGE-2', latencyToCore: 310, capacity: '800 Gbps', peerings: 22 },
    ],
  },
];

const scionPaths: ScionPath[] = [
  {
    id: 'sp-1', name: 'APAC Express → NA West',
    hops: ['Singapore (SG)', 'Tokyo (JP)', 'San Jose (US)'],
    latency: 142, bandwidth: '400 Gbps', isolationDomain: 'ISD-1 (Singtel Sovereign)',
    status: 'active', mplsLabel: 100201, pathType: 'primary', encryption: 'AES-256-GCM + SCION DRKey', trustScore: 99,
  },
  {
    id: 'sp-2', name: 'APAC Express → EU Core',
    hops: ['Singapore (SG)', 'Mumbai (IN)', 'Dubai (AE)', 'Frankfurt (DE)'],
    latency: 148, bandwidth: '400 Gbps', isolationDomain: 'ISD-1 (Singtel Sovereign)',
    status: 'active', mplsLabel: 100202, pathType: 'primary', encryption: 'AES-256-GCM + SCION DRKey', trustScore: 98,
  },
  {
    id: 'sp-3', name: 'Trans-Pacific Backup',
    hops: ['Singapore (SG)', 'Sydney (AU)', 'Auckland (NZ)', 'San Jose (US)'],
    latency: 186, bandwidth: '200 Gbps', isolationDomain: 'ISD-2 (Pacific Ring)',
    status: 'standby', mplsLabel: 100301, pathType: 'backup', encryption: 'AES-256-GCM + SCION DRKey', trustScore: 97,
  },
  {
    id: 'sp-4', name: 'EU ↔ NA Express',
    hops: ['London (GB)', 'Ashburn (US)', 'Chicago (US)'],
    latency: 72, bandwidth: '800 Gbps', isolationDomain: 'ISD-3 (Atlantic Secure)',
    status: 'active', mplsLabel: 100401, pathType: 'primary', encryption: 'AES-256-GCM + SCION DRKey', trustScore: 99,
  },
  {
    id: 'sp-5', name: 'Sovereign APAC Ring',
    hops: ['Singapore (SG)', 'Hong Kong (HK)', 'Tokyo (JP)', 'Seoul (KR)', 'Singapore (SG)'],
    latency: 94, bandwidth: '1.2 Tbps', isolationDomain: 'ISD-1 (Singtel Sovereign)',
    status: 'active', mplsLabel: 100501, pathType: 'primary', encryption: 'AES-256-GCM + Post-Quantum CRYSTALS-Kyber', trustScore: 100,
  },
  {
    id: 'sp-6', name: 'MEA → APAC Direct',
    hops: ['Dubai (AE)', 'Mumbai (IN)', 'Singapore (SG)'],
    latency: 108, bandwidth: '200 Gbps', isolationDomain: 'ISD-4 (Gulf-Asia Corridor)',
    status: 'active', mplsLabel: 100601, pathType: 'primary', encryption: 'AES-256-GCM + SCION DRKey', trustScore: 96,
  },
  {
    id: 'sp-7', name: 'LATAM → NA Failover',
    hops: ['São Paulo (BR)', 'Miami (US)', 'Ashburn (US)'],
    latency: 134, bandwidth: '100 Gbps', isolationDomain: 'ISD-5 (Americas)',
    status: 'failover', mplsLabel: 100701, pathType: 'on-demand', encryption: 'AES-256-GCM + SCION DRKey', trustScore: 94,
  },
];

const TOTAL_POPS = 428;
const TOTAL_CITIES = 362;
const TOTAL_CAPACITY = '148 Tbps';

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string; bg: string }> = {
  healthy: { icon: CheckCircle, color: 'text-green-400', label: 'Healthy', bg: 'bg-green-900/40 border-green-800' },
  degraded: { icon: AlertTriangle, color: 'text-yellow-400', label: 'Degraded', bg: 'bg-yellow-900/40 border-yellow-800' },
  offline: { icon: XCircle, color: 'text-red-400', label: 'Offline', bg: 'bg-red-900/40 border-red-800' },
};

const tierColors: Record<string, string> = {
  core: 'text-emerald-400 bg-emerald-900/30 border-emerald-800',
  edge: 'text-blue-400 bg-blue-900/30 border-blue-800',
  access: 'text-amber-400 bg-amber-900/30 border-amber-800',
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

type ActiveTab = 'gateways' | 'backbone' | 'scion';

export default function GatewayNodesPage() {
  const [gateways, setGateways] = useState<GatewayNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [disableModal, setDisableModal] = useState<{ gwId: string; action: 'disable' | 'enable' } | null>(null);
  const [disableReason, setDisableReason] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('gateways');
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<ScionPath | null>(null);
  const [backboneSearch, setBackboneSearch] = useState('');

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
  const activeScionPaths = scionPaths.filter(p => p.status === 'active').length;

  const filteredRegions = useMemo(() => {
    if (!backboneSearch) return singtelRegions;
    const q = backboneSearch.toLowerCase();
    return singtelRegions.map(r => {
      const filteredPops = r.topPops.filter(p => p.city.toLowerCase().includes(q) || p.country.toLowerCase().includes(q));
      if (filteredPops.length > 0) return { ...r, topPops: filteredPops };
      if (r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)) return r;
      return null;
    }).filter(Boolean) as SingtelRegion[];
  }, [backboneSearch]);

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
              <span className="text-xs font-normal px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 border border-emerald-800">Singtel Backbone</span>
            </h1>
            <p className="text-sm text-gray-500">
              {TOTAL_POPS} Points-of-Presence · {TOTAL_CITIES} Cities · SCION over MPLS · {TOTAL_CAPACITY} Global Capacity
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
          { key: 'backbone' as ActiveTab, label: 'Singtel Backbone', icon: Network, count: TOTAL_POPS },
          { key: 'scion' as ActiveTab, label: 'SCION Paths', icon: Route, count: scionPaths.length },
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
          <Network size={14} className="inline mr-1" /> SCION Active: {activeScionPaths}/{scionPaths.length}
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

      {/* ═══════════════ TAB 2: SINGTEL BACKBONE ═══════════════ */}
      {activeTab === 'backbone' && (
        <>
          {/* Global backbone KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Points-of-Presence', value: TOTAL_POPS, icon: Radio, color: 'text-emerald-400' },
              { label: 'Cities', value: TOTAL_CITIES, icon: MapPin, color: 'text-blue-400' },
              { label: 'MPLS Rings', value: singtelRegions.reduce((s, r) => s + r.mplsRings, 0), icon: GitBranch, color: 'text-purple-400' },
              { label: 'SCION Paths', value: singtelRegions.reduce((s, r) => s + r.scionPaths, 0), icon: Route, color: 'text-amber-400' },
              { label: 'Global Capacity', value: TOTAL_CAPACITY, icon: Zap, color: 'text-cyan-400' },
              { label: 'Regions', value: singtelRegions.length, icon: Globe, color: 'text-pink-400' },
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

          {/* SCION over MPLS feature banner */}
          <div className="bg-gradient-to-r from-emerald-900/20 via-blue-900/20 to-purple-900/20 border border-emerald-800/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-900/40 rounded-lg"><Waypoints size={20} className="text-emerald-400" /></div>
              <div>
                <h3 className="text-sm font-semibold">SCION over MPLS Backbone</h3>
                <p className="text-xs text-gray-400">Path-aware networking with cryptographic sovereignty on Singtel&apos;s global MPLS infrastructure</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-2"><Lock size={12} className="text-emerald-400" /> <span className="text-gray-300">Isolation Domains (ISD) — sovereign trust boundaries</span></div>
              <div className="flex items-center gap-2"><Route size={12} className="text-blue-400" /> <span className="text-gray-300">Multi-path selection — latency, geofence, compliance</span></div>
              <div className="flex items-center gap-2"><Shield size={12} className="text-purple-400" /> <span className="text-gray-300">DRKey — per-flow cryptographic authentication</span></div>
              <div className="flex items-center gap-2"><Eye size={12} className="text-amber-400" /> <span className="text-gray-300">Path transparency — no hidden hops or BGP hijacks</span></div>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={backboneSearch}
              onChange={e => setBackboneSearch(e.target.value)}
              placeholder="Search cities, countries, regions..."
              className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Region cards */}
          <div className="space-y-4">
            {filteredRegions.map(region => (
              <div key={region.code} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedRegion(expandedRegion === region.code ? null : region.code)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-semibold">{region.name} <span className="text-gray-500 font-normal">({region.code})</span></h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>{region.cities} cities</span>
                        <span>·</span>
                        <span>{region.pops} PoPs</span>
                        <span>·</span>
                        <span>{region.totalCapacity}</span>
                        <span>·</span>
                        <span>{region.mplsRings} MPLS rings</span>
                        <span>·</span>
                        <span>{region.scionPaths} SCION paths</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Region capacity bar */}
                    <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                        style={{ width: `${(region.pops / TOTAL_POPS) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">{((region.pops / TOTAL_POPS) * 100).toFixed(0)}%</span>
                    <ChevronRight size={16} className={`text-gray-500 transition-transform ${expandedRegion === region.code ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {expandedRegion === region.code && (
                  <div className="border-t border-gray-800 p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-500 border-b border-gray-800">
                          <th className="text-left py-2 font-medium">City</th>
                          <th className="text-left py-2 font-medium">Country</th>
                          <th className="text-left py-2 font-medium">PoPs</th>
                          <th className="text-left py-2 font-medium">Tier</th>
                          <th className="text-left py-2 font-medium">MPLS Ring</th>
                          <th className="text-left py-2 font-medium">Capacity</th>
                          <th className="text-left py-2 font-medium">Latency to Core</th>
                          <th className="text-left py-2 font-medium">Peerings</th>
                          <th className="text-left py-2 font-medium">SCION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {region.topPops.map(pop => (
                          <tr key={pop.city} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                            <td className="py-2.5 font-medium">{pop.city}</td>
                            <td className="py-2.5 text-gray-400">{pop.country}</td>
                            <td className="py-2.5">{pop.pops}</td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded text-xs border ${tierColors[pop.tier]}`}>
                                {pop.tier}
                              </span>
                            </td>
                            <td className="py-2.5 font-mono text-xs text-gray-400">{pop.mplsRingId}</td>
                            <td className="py-2.5 text-gray-300">{pop.capacity}</td>
                            <td className="py-2.5 text-gray-300">{pop.latencyToCore} ms</td>
                            <td className="py-2.5 text-gray-300">{pop.peerings}</td>
                            <td className="py-2.5">
                              {pop.scionEnabled
                                ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> Enabled</span>
                                : <span className="text-gray-500 flex items-center gap-1"><XCircle size={12} /> Pending</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══════════════ TAB 3: SCION PATHS ═══════════════ */}
      {activeTab === 'scion' && (
        <>
          {/* SCION overview KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Active Paths', value: scionPaths.filter(p => p.status === 'active').length, icon: Route, color: 'text-green-400' },
              { label: 'Standby Paths', value: scionPaths.filter(p => p.status === 'standby').length, icon: Route, color: 'text-amber-400' },
              { label: 'Failover Paths', value: scionPaths.filter(p => p.status === 'failover').length, icon: Route, color: 'text-purple-400' },
              { label: 'Isolation Domains', value: new Set(scionPaths.map(p => p.isolationDomain)).size, icon: Lock, color: 'text-cyan-400' },
              { label: 'Avg Trust Score', value: (scionPaths.reduce((s, p) => s + p.trustScore, 0) / scionPaths.length).toFixed(1) + '%', icon: Shield, color: 'text-emerald-400' },
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
            {scionPaths.map(path => {
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
