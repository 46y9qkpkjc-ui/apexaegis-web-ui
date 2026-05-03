'use client';
import { useState } from 'react';
import {
  Layers, Plus, RefreshCw, CheckCircle2, XCircle,
  ChevronDown, ChevronRight, Wifi, Shield, Users,
  Monitor, Smartphone, Server, Lock,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ─────────────────────────────────────────────────── */

type SGTSource = 'static' | 'radius' | 'dot1x' | 'guest_portal' | 'mab';

interface DynamicSGT {
  id: number;
  name: string;
  description: string;
  subnet: string;
  gateway: string;
  dhcp_pool: string;
  source: SGTSource;
  sgt_tag: number | null;
  sgt_name: string | null;
  active_clients: number;
  voice_enabled: boolean;
  isolated: boolean;
  max_clients: number | null;
  radius_attribute: string | null;
  lease_duration_mins: number;
}

interface SGTAssignment {
  id: string;
  mac: string;
  hostname: string;
  sgt_id: number;
  sgt_name: string;
  assigned_by: SGTSource;
  auth_user: string | null;
  assigned_at: string;
  expires_at: string | null;
  ip: string;
  ap_or_switch: string;
  group: string | null;
}

/* ─── Demo Data ────────────────────────────────────────────── */

const demoSGTs: DynamicSGT[] = [
  { id: 10, name: 'Management', description: 'Network management & infrastructure', subnet: '10.10.10.0/24', gateway: '10.10.10.1', dhcp_pool: '10.10.10.50-254', source: 'static', sgt_tag: 10, sgt_name: 'Mgmt', active_clients: 8, voice_enabled: false, isolated: false, max_clients: 50, radius_attribute: null, lease_duration_mins: 1440 },
  { id: 100, name: 'Corporate', description: 'Authenticated corporate users', subnet: '10.10.100.0/23', gateway: '10.10.100.1', dhcp_pool: '10.10.100.50-10.10.101.254', source: 'radius', sgt_tag: 100, sgt_name: 'Engineering', active_clients: 87, voice_enabled: true, isolated: false, max_clients: 500, radius_attribute: 'Tunnel-Private-Group-ID=100', lease_duration_mins: 480 },
  { id: 200, name: 'IoT-Devices', description: 'Isolated IoT sensor network', subnet: '10.10.200.0/24', gateway: '10.10.200.1', dhcp_pool: '10.10.200.50-254', source: 'mab', sgt_tag: 200, sgt_name: 'IoT', active_clients: 23, voice_enabled: false, isolated: true, max_clients: 200, radius_attribute: null, lease_duration_mins: 1440 },
  { id: 300, name: 'Quarantine', description: 'Non-compliant device quarantine', subnet: '10.10.30.0/24', gateway: '10.10.30.1', dhcp_pool: '10.10.30.50-254', source: 'dot1x', sgt_tag: 900, sgt_name: 'Quarantine', active_clients: 3, voice_enabled: false, isolated: true, max_clients: 100, radius_attribute: 'Tunnel-Private-Group-ID=300', lease_duration_mins: 60 },
  { id: 500, name: 'Voice', description: 'VoIP phones & softphones', subnet: '10.10.50.0/24', gateway: '10.10.50.1', dhcp_pool: '10.10.50.50-254', source: 'dot1x', sgt_tag: 500, sgt_name: 'Voice', active_clients: 42, voice_enabled: true, isolated: false, max_clients: 300, radius_attribute: 'Cisco-AVPair=device-traffic-class=voice', lease_duration_mins: 1440 },
  { id: 999, name: 'Guest', description: 'Guest / visitor internet-only access', subnet: '10.10.99.0/24', gateway: '10.10.99.1', dhcp_pool: '10.10.99.50-254', source: 'guest_portal', sgt_tag: 999, sgt_name: 'Guest', active_clients: 15, voice_enabled: false, isolated: true, max_clients: 200, radius_attribute: null, lease_duration_mins: 240 },
];

const demoAssignments: SGTAssignment[] = [
  { id: 'va-01', mac: 'AA:BB:CC:DD:EE:01', hostname: 'LAPTOP-JSmith', sgt_id: 100, sgt_name: 'Corporate', assigned_by: 'radius', auth_user: 'jsmith@corp.com', assigned_at: '2026-03-14T06:30:00Z', expires_at: '2026-03-14T14:30:00Z', ip: '10.10.100.101', ap_or_switch: 'AP-Floor1-Lobby', group: 'Engineering' },
  { id: 'va-02', mac: 'AA:BB:CC:DD:EE:02', hostname: 'MacBook-MWilliams', sgt_id: 100, sgt_name: 'Corporate', assigned_by: 'dot1x', auth_user: 'mwilliams@corp.com', assigned_at: '2026-03-14T07:15:00Z', expires_at: '2026-03-14T15:15:00Z', ip: '10.10.100.102', ap_or_switch: 'AP-Floor1-OpenPlan', group: 'Executives' },
  { id: 'va-03', mac: 'AA:BB:CC:DD:EE:03', hostname: 'iPhone-KBrown', sgt_id: 100, sgt_name: 'Corporate', assigned_by: 'radius', auth_user: 'kbrown@corp.com', assigned_at: '2026-03-14T08:00:00Z', expires_at: '2026-03-14T16:00:00Z', ip: '10.10.100.103', ap_or_switch: 'AP-Floor1-Lobby', group: 'Engineering' },
  { id: 'va-04', mac: 'AA:BB:CC:DD:EE:04', hostname: 'Pixel-Guest', sgt_id: 999, sgt_name: 'Guest', assigned_by: 'guest_portal', auth_user: null, assigned_at: '2026-03-14T09:30:00Z', expires_at: '2026-03-14T13:30:00Z', ip: '10.10.99.50', ap_or_switch: 'AP-Floor1-OpenPlan', group: null },
  { id: 'va-05', mac: 'AA:BB:CC:DD:EE:05', hostname: 'IoT-TempSensor', sgt_id: 200, sgt_name: 'IoT-Devices', assigned_by: 'mab', auth_user: null, assigned_at: '2026-03-12T00:00:00Z', expires_at: null, ip: '10.10.200.50', ap_or_switch: 'SW-Floor2-IDF', group: null },
  { id: 'va-06', mac: 'AA:BB:CC:DD:EE:06', hostname: 'LAPTOP-NonCompliant', sgt_id: 300, sgt_name: 'Quarantine', assigned_by: 'dot1x', auth_user: 'rjones@corp.com', assigned_at: '2026-03-14T08:45:00Z', expires_at: '2026-03-14T09:45:00Z', ip: '10.10.30.51', ap_or_switch: 'SW-Floor1-IDF', group: 'Contractors' },
  { id: 'va-07', mac: 'AA:BB:CC:DD:EE:07', hostname: 'CiscoPhone-1001', sgt_id: 500, sgt_name: 'Voice', assigned_by: 'dot1x', auth_user: null, assigned_at: '2026-03-14T07:00:00Z', expires_at: null, ip: '10.10.50.101', ap_or_switch: 'SW-Floor2-IDF', group: null },
  { id: 'va-08', mac: 'AA:BB:CC:DD:EE:08', hostname: 'Admin-Laptop', sgt_id: 10, sgt_name: 'Management', assigned_by: 'static', auth_user: 'admin@corp.com', assigned_at: '2026-03-01T00:00:00Z', expires_at: null, ip: '10.10.10.5', ap_or_switch: 'SW-Core', group: 'NetOps' },
];

/* ─── Helpers ───────────────────────────────────────────────── */

const sourceColor: Record<SGTSource, string> = {
  static: 'text-gray-400 bg-gray-800 border-gray-700/40',
  radius: 'text-blue-400 bg-blue-900/30 border-blue-700/40',
  dot1x: 'text-purple-400 bg-purple-900/30 border-purple-700/40',
  guest_portal: 'text-amber-400 bg-amber-900/30 border-amber-700/40',
  mab: 'text-cyan-400 bg-cyan-900/30 border-cyan-700/40',
};

const sourceLabel: Record<SGTSource, string> = {
  static: 'Static', radius: 'RADIUS', dot1x: '802.1X', guest_portal: 'Guest Portal', mab: 'MAB',
};

/* ─── Component ─────────────────────────────────────────────── */
export default function DynamicSGTPage() {
  const [activeTab, setActiveTab] = useState<'sgts' | 'assignments'>('sgts');
  const [expandedSGT, setExpandedSGT] = useState<number | null>(100);
  const [assignmentFilter, setAssignmentFilter] = useState<SGTSource | 'all'>('all');

  const totalClients = demoSGTs.reduce((s, v) => s + v.active_clients, 0);
  const isolatedSGTs = demoSGTs.filter(v => v.isolated).length;

  const filteredAssignments = assignmentFilter === 'all'
    ? demoAssignments
    : demoAssignments.filter(a => a.assigned_by === assignmentFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers size={24} className="text-purple-400" />
          <div>
            <h1 className="text-xl font-semibold">Dynamic SGT Provisioning</h1>
            <p className="text-sm text-gray-500">RADIUS-assigned SGTs, 802.1X, guest portal &amp; MAB provisioning</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
            <Plus size={14} /> Add SGT
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-sm transition-colors overflow-x-auto">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'SGTs', value: String(demoSGTs.length), icon: Layers, color: 'text-purple-400' },
          { label: 'Active Clients', value: String(totalClients), icon: Users, color: 'text-blue-400' },
          { label: 'Isolated SGTs', value: String(isolatedSGTs), icon: Shield, color: 'text-amber-400' },
          { label: 'Dynamic Sources', value: '4', icon: Server, color: 'text-cyan-400' },
        ].map(st => {
          const Icon = st.icon;
          return (
            <div key={st.label} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={st.color} />
                <span className="text-xs text-gray-500 uppercase tracking-wider">{st.label}</span>
              </div>
              <div className="text-2xl font-bold">{st.value}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
        {([
          { key: 'sgts' as const, label: 'SGT Pool', icon: Layers },
          { key: 'assignments' as const, label: 'Live Assignments', icon: Monitor },
        ]).map(tab => {
          const TabIcon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={clsx('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all',
                activeTab === tab.key ? 'bg-blue-600/15 text-blue-400' : 'text-gray-500 hover:text-gray-300')}>
              <TabIcon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── SGT Pool ──────────────────────────────────────── */}
      {activeTab === 'sgts' && (
        <div className="space-y-3">
          {demoSGTs.map(sgt => {
            const isExpanded = expandedSGT === sgt.id;
            return (
              <div key={sgt.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedSGT(isExpanded ? null : sgt.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors text-left">
                  <span className="text-lg font-bold text-gray-400 w-12 text-right">{sgt.id}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{sgt.name}</span>
                    <span className="text-xs text-gray-500">{sgt.description}</span>
                  </div>
                  <span className={clsx('px-2 py-0.5 rounded border text-[10px] font-medium', sourceColor[sgt.source])}>
                    {sourceLabel[sgt.source]}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Users size={10} /> {sgt.active_clients}</span>
                  {sgt.isolated && <Lock size={12} className="text-amber-400" />}
                  {isExpanded ? <ChevronDown size={14} className="text-gray-600" /> : <ChevronRight size={14} className="text-gray-600" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800/60 px-5 py-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
                      {[
                        { k: 'Subnet', v: sgt.subnet },
                        { k: 'Gateway', v: sgt.gateway },
                        { k: 'DHCP Pool', v: sgt.dhcp_pool },
                        { k: 'Lease Duration', v: `${sgt.lease_duration_mins} min` },
                        { k: 'SGT Tag', v: sgt.sgt_tag !== null ? `SGT-${sgt.sgt_tag} (${sgt.sgt_name})` : '—' },
                        { k: 'Voice', v: sgt.voice_enabled ? 'Enabled' : 'Disabled' },
                        { k: 'Isolated', v: sgt.isolated ? 'Yes' : 'No' },
                        { k: 'Max Clients', v: sgt.max_clients !== null ? String(sgt.max_clients) : 'Unlimited' },
                      ].map(r => (
                        <div key={r.k}>
                          <div className="text-gray-600">{r.k}</div>
                          <div className="text-gray-300 font-mono">{r.v}</div>
                        </div>
                      ))}
                    </div>
                    {sgt.radius_attribute && (
                      <div className="text-[11px]">
                        <span className="text-gray-600">RADIUS Attribute: </span>
                        <span className="text-cyan-400 font-mono">{sgt.radius_attribute}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Live Assignments ──────────────────────────────── */}
      {activeTab === 'assignments' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Source:</span>
            {(['all', 'radius', 'dot1x', 'guest_portal', 'mab', 'static'] as const).map(s => (
              <button key={s} onClick={() => setAssignmentFilter(s)}
                className={clsx('px-2 py-1 rounded-md text-[10px] transition-all border',
                  assignmentFilter === s ? 'bg-blue-600/20 text-blue-400 border-blue-500/40' : 'text-gray-500 border-transparent hover:text-gray-300')}>
                {s === 'all' ? 'All' : sourceLabel[s as SGTSource]}
              </button>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/50 text-gray-400 text-[10px] uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left">Device</th>
                  <th className="px-3 py-2.5 text-left">SGT</th>
                  <th className="px-3 py-2.5 text-center">Source</th>
                  <th className="px-3 py-2.5 text-left">Auth User</th>
                  <th className="px-3 py-2.5 text-left">Port / AP</th>
                  <th className="px-3 py-2.5 text-center">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredAssignments.map(a => (
                  <tr key={a.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="text-[11px] text-gray-200 font-medium">{a.hostname}</div>
                      <div className="text-[9px] text-gray-600 font-mono">{a.mac} · {a.ip}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] font-mono text-purple-400">{a.sgt_id}</span>
                      <span className="text-[10px] text-gray-500 ml-1.5">{a.sgt_name}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={clsx('px-1.5 py-0.5 rounded border text-[9px] font-medium', sourceColor[a.assigned_by])}>
                        {sourceLabel[a.assigned_by]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[10px] text-gray-400">{a.auth_user ?? '—'}</td>
                    <td className="px-3 py-2.5 text-[10px] text-gray-500">{a.ap_or_switch}</td>
                    <td className="px-3 py-2.5 text-center text-[10px] text-gray-500">
                      {a.expires_at ? new Date(a.expires_at).toLocaleTimeString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-700 text-center">
        Dynamic SGT Provisioning · ApexAegis SSE · RADIUS / 802.1X / Guest Portal / MAB
      </p>
    </div>
  );
}
