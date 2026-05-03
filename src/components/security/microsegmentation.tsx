'use client';
import { useState } from 'react';
import {
  Network, Server, Database, Globe, Shield, Lock,
  ArrowRight, AlertTriangle, CheckCircle2, XCircle,
  ChevronDown, ChevronRight, Plus, Zap, Eye,
  MonitorSmartphone, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ─────────────────────────────────────────────────── */
interface SGTZone {
  id: string;
  name: string;
  sgtValue: number;
  type: 'production' | 'development' | 'staging' | 'dmz' | 'management' | 'iot' | 'user';
  contexts: { domain: string; attributes: string[] }[];
  assetCount: number;
  icon: keyof typeof SEGMENT_ICONS;
  color: string;
  borderColor: string;
}

interface SGTFlow {
  id: string;
  from: string;
  to: string;
  protocol: string;
  port: number;
  bytesPerHour: number;
  policy: 'allow' | 'deny' | 'monitor' | 'none';
  risk: 'critical' | 'high' | 'medium' | 'low' | 'none';
  description: string;
}

interface SGTPolicy {
  id: string;
  from: string;
  to: string;
  action: 'allow' | 'deny' | 'monitor';
  protocols: string[];
  ports: string;
  description: string;
  enabled: boolean;
}

const SEGMENT_ICONS = {
  server: Server,
  database: Database,
  globe: Globe,
  monitor: MonitorSmartphone,
  shield: Shield,
  network: Network,
};

/* ─── Demo SGT Zones ───────────────────────────────────────── */
const DEMO_SGT_ZONES: SGTZone[] = [
  { id: 'prod-web', name: 'Production Web Tier', sgtValue: 100, type: 'production', contexts: [{ domain: 'application', attributes: ['web-frontend', 'tier-1'] }, { domain: 'data', attributes: ['public'] }], assetCount: 12, icon: 'globe', color: 'bg-green-900/30', borderColor: 'border-green-700' },
  { id: 'prod-app', name: 'Production App Tier', sgtValue: 110, type: 'production', contexts: [{ domain: 'application', attributes: ['api-backend', 'tier-2'] }, { domain: 'data', attributes: ['confidential'] }], assetCount: 8, icon: 'server', color: 'bg-green-900/30', borderColor: 'border-green-700' },
  { id: 'prod-db', name: 'Production Database', sgtValue: 120, type: 'production', contexts: [{ domain: 'application', attributes: ['database', 'tier-3'] }, { domain: 'data', attributes: ['pii', 'financial'] }], assetCount: 4, icon: 'database', color: 'bg-purple-900/30', borderColor: 'border-purple-700' },
  { id: 'dev', name: 'Development', sgtValue: 200, type: 'development', contexts: [{ domain: 'identity', attributes: ['developer'] }, { domain: 'device', attributes: ['managed'] }], assetCount: 20, icon: 'monitor', color: 'bg-blue-900/30', borderColor: 'border-blue-700' },
  { id: 'staging', name: 'Staging', sgtValue: 210, type: 'staging', contexts: [{ domain: 'application', attributes: ['pre-prod'] }, { domain: 'device', attributes: ['managed'] }], assetCount: 6, icon: 'server', color: 'bg-yellow-900/30', borderColor: 'border-yellow-700' },
  { id: 'dmz', name: 'DMZ', sgtValue: 50, type: 'dmz', contexts: [{ domain: 'location', attributes: ['perimeter'] }, { domain: 'data', attributes: ['public'] }], assetCount: 3, icon: 'shield', color: 'bg-red-900/30', borderColor: 'border-red-700' },
  { id: 'mgmt', name: 'Management', sgtValue: 999, type: 'management', contexts: [{ domain: 'identity', attributes: ['admin', 'network-ops'] }, { domain: 'device', attributes: ['hardened'] }], assetCount: 5, icon: 'shield', color: 'bg-cyan-900/30', borderColor: 'border-cyan-700' },
  { id: 'iot', name: 'IoT Devices', sgtValue: 30, type: 'iot', contexts: [{ domain: 'device', attributes: ['iot-sensor', 'camera'] }, { domain: 'application', attributes: ['mqtt', 'coap'] }], assetCount: 34, icon: 'network', color: 'bg-orange-900/30', borderColor: 'border-orange-700' },
  { id: 'users', name: 'Corporate Users', sgtValue: 10, type: 'user', contexts: [{ domain: 'identity', attributes: ['employee'] }, { domain: 'device', attributes: ['managed', 'compliant'] }], assetCount: 150, icon: 'monitor', color: 'bg-gray-800', borderColor: 'border-gray-600' },
];

const DEMO_FLOWS: SGTFlow[] = [
  { id: 'f1', from: 'dmz', to: 'prod-web', protocol: 'HTTPS', port: 443, bytesPerHour: 52428800, policy: 'allow', risk: 'low', description: 'Load balancer → web servers' },
  { id: 'f2', from: 'prod-web', to: 'prod-app', protocol: 'gRPC', port: 8443, bytesPerHour: 31457280, policy: 'allow', risk: 'none', description: 'Web → App tier API calls' },
  { id: 'f3', from: 'prod-app', to: 'prod-db', protocol: 'PostgreSQL', port: 5432, bytesPerHour: 10485760, policy: 'allow', risk: 'none', description: 'App → Database queries' },
  { id: 'f4', from: 'dev', to: 'prod-db', protocol: 'PostgreSQL', port: 5432, bytesPerHour: 524288, policy: 'deny', risk: 'critical', description: 'Dev accessing production DB — BLOCKED' },
  { id: 'f5', from: 'users', to: 'prod-web', protocol: 'HTTPS', port: 443, bytesPerHour: 15728640, policy: 'allow', risk: 'low', description: 'User access to web applications' },
  { id: 'f6', from: 'users', to: 'prod-db', protocol: 'PostgreSQL', port: 5432, bytesPerHour: 0, policy: 'deny', risk: 'high', description: 'Direct DB access from workstations — BLOCKED' },
  { id: 'f7', from: 'iot', to: 'prod-app', protocol: 'MQTT', port: 1883, bytesPerHour: 2097152, policy: 'monitor', risk: 'medium', description: 'IoT telemetry → App tier (unencrypted)' },
  { id: 'f8', from: 'iot', to: 'mgmt', protocol: 'SSH', port: 22, bytesPerHour: 0, policy: 'deny', risk: 'critical', description: 'IoT → Management SSH — BLOCKED' },
  { id: 'f9', from: 'staging', to: 'prod-app', protocol: 'HTTPS', port: 443, bytesPerHour: 1048576, policy: 'monitor', risk: 'medium', description: 'Staging → Prod API (cross-env traffic)' },
  { id: 'f10', from: 'dev', to: 'staging', protocol: 'HTTPS', port: 443, bytesPerHour: 3145728, policy: 'allow', risk: 'low', description: 'Dev → Staging deployment pipeline' },
  { id: 'f11', from: 'mgmt', to: 'prod-web', protocol: 'SSH', port: 22, bytesPerHour: 524288, policy: 'allow', risk: 'low', description: 'Admin SSH to production web' },
  { id: 'f12', from: 'mgmt', to: 'prod-db', protocol: 'SSH', port: 22, bytesPerHour: 262144, policy: 'allow', risk: 'low', description: 'DBA access to production database' },
];

const DEMO_POLICIES: SGTPolicy[] = [
  { id: 'sp1', from: 'prod-web', to: 'prod-app', action: 'allow', protocols: ['gRPC', 'HTTPS'], ports: '8443, 443', description: 'Web-to-App API communication', enabled: true },
  { id: 'sp2', from: 'prod-app', to: 'prod-db', action: 'allow', protocols: ['PostgreSQL'], ports: '5432', description: 'App-to-DB queries only', enabled: true },
  { id: 'sp3', from: 'dev', to: 'prod-db', action: 'deny', protocols: ['*'], ports: '*', description: 'Block dev from production database', enabled: true },
  { id: 'sp4', from: 'users', to: 'prod-db', action: 'deny', protocols: ['*'], ports: '*', description: 'No direct DB from workstations', enabled: true },
  { id: 'sp5', from: 'iot', to: 'mgmt', action: 'deny', protocols: ['*'], ports: '*', description: 'Isolate IoT from management plane', enabled: true },
  { id: 'sp6', from: 'iot', to: 'prod-app', action: 'monitor', protocols: ['MQTT', 'HTTPS'], ports: '1883, 443', description: 'Monitor IoT → App (enforce TLS later)', enabled: true },
  { id: 'sp7', from: 'staging', to: 'prod-app', action: 'monitor', protocols: ['HTTPS'], ports: '443', description: 'Cross-env traffic monitoring', enabled: true },
  { id: 'sp8', from: 'dmz', to: 'prod-web', action: 'allow', protocols: ['HTTPS'], ports: '443', description: 'Inbound web traffic from DMZ', enabled: true },
];

/* ─── Helper ────────────────────────────────────────────────── */
function formatBytes(b: number): string {
  if (b === 0) return '0 B/h';
  const k = 1024;
  const u = ['B/h', 'KB/h', 'MB/h', 'GB/h'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(1)} ${u[i]}`;
}

const POLICY_BADGE: Record<string, string> = {
  allow: 'bg-green-900/40 text-green-400 border-green-800',
  deny: 'bg-red-900/40 text-red-400 border-red-800',
  monitor: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  none: 'bg-gray-800 text-gray-500 border-gray-700',
};

const RISK_BADGE: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  none: 'bg-gray-600',
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function MicrosegmentationMap() {
  const [zones] = useState<SGTZone[]>(DEMO_SGT_ZONES);
  const [flows] = useState<SGTFlow[]>(DEMO_FLOWS);
  const [policies, setPolicies] = useState<SGTPolicy[]>(DEMO_POLICIES);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [tab, setTab] = useState<'map' | 'flows' | 'policies'>('map');
  const [showFlowRisk, setShowFlowRisk] = useState(true);

  const zoneById = (id: string) => zones.find(s => s.id === id);

  const relatedFlows = selectedZone
    ? flows.filter(f => f.from === selectedZone || f.to === selectedZone)
    : flows;

  const blockedFlows = flows.filter(f => f.policy === 'deny').length;
  const monitoredFlows = flows.filter(f => f.policy === 'monitor').length;
  const criticalRisks = flows.filter(f => f.risk === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex gap-3">
        <div className="px-3 py-1.5 rounded-lg bg-gray-800 text-xs"><span className="text-gray-500">SGT Zones:</span> <span className="text-gray-300 font-medium">{zones.length}</span></div>
        <div className="px-3 py-1.5 rounded-lg bg-gray-800 text-xs"><span className="text-gray-500">Flows:</span> <span className="text-gray-300 font-medium">{flows.length}</span></div>
        <div className="px-3 py-1.5 rounded-lg bg-red-900/20 text-xs"><span className="text-gray-500">Blocked:</span> <span className="text-red-400 font-medium">{blockedFlows}</span></div>
        <div className="px-3 py-1.5 rounded-lg bg-yellow-900/20 text-xs"><span className="text-gray-500">Monitored:</span> <span className="text-yellow-400 font-medium">{monitoredFlows}</span></div>
        <div className="px-3 py-1.5 rounded-lg bg-red-900/20 text-xs"><span className="text-gray-500">Critical Risk:</span> <span className="text-red-400 font-medium">{criticalRisks}</span></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1 w-fit overflow-x-auto">
        {(['map', 'flows', 'policies'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-1.5 rounded-md text-xs font-medium transition-colors',
              tab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
            )}
          >
            {t === 'map' ? 'SGT Zone Map' : t === 'flows' ? 'Traffic Flows' : 'Policies'}
          </button>
        ))}
      </div>

      {/* ─── Segment Map ──────────────────────────────────── */}
      {tab === 'map' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-xs text-gray-500 mb-4">Click an SGT zone to see its traffic flows. Connections show active data paths.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map(seg => {
              const Icon = SEGMENT_ICONS[seg.icon];
              const isSelected = selectedZone === seg.id;
              const segFlows = flows.filter(f => f.from === seg.id || f.to === seg.id);
              const hasRisk = segFlows.some(f => f.risk === 'critical' || f.risk === 'high');
              const deniedCount = segFlows.filter(f => f.policy === 'deny').length;

              return (
                <button
                  key={seg.id}
                  onClick={() => setSelectedZone(isSelected ? null : seg.id)}
                  className={clsx(
                    'relative p-4 rounded-xl border-2 text-left transition-all',
                    isSelected ? `${seg.color} ${seg.borderColor} shadow-lg` : 'bg-gray-800/30 border-gray-800 hover:border-gray-700',
                    hasRisk && !isSelected && 'ring-1 ring-red-800/50'
                  )}
                >
                  {hasRisk && (
                    <AlertTriangle size={12} className="absolute top-2 right-2 text-red-400" />
                  )}
                  <Icon size={20} className={isSelected ? 'text-white' : 'text-gray-500'} />
                  <p className={clsx('text-xs font-medium mt-2', isSelected ? 'text-white' : 'text-gray-300')}>{seg.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-gray-500">SGT:{seg.sgtValue}</span>
                    <span className="text-[10px] text-gray-500">{seg.assetCount} assets</span>
                    <span className="text-[10px] text-gray-500">{segFlows.length} flows</span>
                    {deniedCount > 0 && (
                      <span className="text-[10px] text-red-400">{deniedCount} blocked</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected segment flows */}
          {selectedZone && (
            <div className="mt-4 border-t border-gray-800 pt-4">
              <h4 className="text-xs font-semibold text-gray-400 mb-2">
                Flows for: {zoneById(selectedZone)?.name}
              </h4>
              <div className="space-y-1.5">
                {relatedFlows.map(flow => {
                    const fromSeg = zoneById(flow.from);
                    const toSeg = zoneById(flow.to);
                  return (
                    <div key={flow.id} className="flex items-center gap-2 px-3 py-2 bg-gray-800/30 rounded-lg">
                      <span className={`w-1.5 h-1.5 rounded-full ${RISK_BADGE[flow.risk]}`} />
                      <span className="text-xs text-gray-300 w-36 truncate">{fromSeg?.name}</span>
                      <ArrowRight size={12} className="text-gray-600" />
                      <span className="text-xs text-gray-300 w-36 truncate">{toSeg?.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px]">{flow.protocol}:{flow.port}</span>
                      <span className="text-[10px] text-gray-500 flex-1 truncate">{flow.description}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${POLICY_BADGE[flow.policy]}`}>
                        {flow.policy.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Traffic Flows Table ──────────────────────────── */}
      {tab === 'flows' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="w-6 px-3 py-3"></th>
                <th className="px-3 py-3 text-left">Source</th>
                <th className="w-6 px-3 py-3"></th>
                <th className="px-3 py-3 text-left">Destination</th>
                <th className="px-3 py-3 text-left">Protocol</th>
                <th className="px-3 py-3 text-right">Throughput</th>
                <th className="px-3 py-3 text-center">Policy</th>
                <th className="px-3 py-3 text-center">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {flows.map(flow => (
                <tr key={flow.id} className="hover:bg-gray-800/20 transition-colors">
                  <td className="px-3 py-2.5"><span className={`w-2 h-2 rounded-full block ${RISK_BADGE[flow.risk]}`} /></td>
                  <td className="px-3 py-2.5 text-xs text-gray-300">{zoneById(flow.from)?.name}</td>
                  <td className="px-3 py-2.5"><ArrowRight size={10} className="text-gray-600" /></td>
                  <td className="px-3 py-2.5 text-xs text-gray-300">{zoneById(flow.to)?.name}</td>
                  <td className="px-3 py-2.5 text-xs"><span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{flow.protocol}:{flow.port}</span></td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 text-right font-mono">{formatBytes(flow.bytesPerHour)}</td>
                  <td className="px-3 py-2.5 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${POLICY_BADGE[flow.policy]}`}>{flow.policy.toUpperCase()}</span></td>
                  <td className="px-3 py-2.5 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-medium text-white ${RISK_BADGE[flow.risk]}`}>{flow.risk.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Policies ─────────────────────────────────────── */}
      {tab === 'policies' && (
        <div className="space-y-2">
          {policies.map(pol => (
            <div key={pol.id} className={clsx('border rounded-lg px-4 py-3 transition-colors', pol.enabled ? 'border-gray-800' : 'border-gray-800/50 opacity-50')}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPolicies(prev => prev.map(p => p.id === pol.id ? { ...p, enabled: !p.enabled } : p))}
                  className={clsx('shrink-0', pol.enabled ? 'text-green-400' : 'text-gray-600')}
                >
                  {pol.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs text-gray-300 truncate w-36">{zoneById(pol.from)?.name}</span>
                  <ArrowRight size={12} className="text-gray-600 shrink-0" />
                  <span className="text-xs text-gray-300 truncate w-36">{zoneById(pol.to)?.name}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px] shrink-0">{pol.protocols.join(', ')}</span>
                <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 text-[10px] shrink-0">Port {pol.ports}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 ${POLICY_BADGE[pol.action]}`}>
                  {pol.action.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 ml-7">{pol.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
