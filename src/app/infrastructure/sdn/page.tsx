'use client';
import { useState } from 'react';
import {
  Router, CheckCircle2,
  ChevronDown, ChevronRight, Shield,
  RefreshCw, Layers, Cpu,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────── */

interface SGTPortMapping {
  port_id: string;
  sgt_tag: number;
  sgt_name: string;
  sgt_vlan: number;
}

interface SwitchPort {
  port_id: string;
  description: string;
  admin_status: 'up' | 'down';
  oper_status: 'up' | 'down';
  speed: string;
  dot1x_enabled: boolean;
  mab_enabled: boolean;
  sgt_tag: number | null;
  sgt_name: string;
}

interface WhiteboxSwitch {
  id: string;
  hostname: string;
  ip_address: string;
  management_ip: string;
  model: string;
  vendor: string;
  nos: string;
  nos_version: string;
  serial_number: string;
  role: string;
  status: 'online' | 'offline' | 'provisioning';
  uptime_hours: number;
  ports: SwitchPort[];
  sgt_mappings: SGTPortMapping[];
  config_version: number;
  last_config_push: string;
  last_heartbeat: string;
}

interface Vendor {
  name: string;
  models: string[];
  supported_nos: string[];
  api_type: string;
}

/* ─── Demo Data ──────────────────────────────────────────────── */

const vendors: Vendor[] = [
  { name: 'Edgecore', models: ['DCS-7060CX2-32S', 'AS7726-32X', 'AS9516-32D'], supported_nos: ['SONiC', 'DENT', 'OpenSwitch'], api_type: 'OpenConfig / gNMI' },
  { name: 'Celestica', models: ['Seastone-DX010', 'Silverstone-X'], supported_nos: ['SONiC', 'ONIE'], api_type: 'OpenConfig / gNMI' },
  { name: 'Delta Networks', models: ['AG9032v2a', 'AG5648v1'], supported_nos: ['SONiC', 'DENT'], api_type: 'OpenConfig / gNMI' },
  { name: 'Accton / Edgecore', models: ['Wedge100BF-32X', 'Minipack'], supported_nos: ['SONiC', 'FBOSS'], api_type: 'OpenConfig / gNMI' },
];

const demoSwitches: WhiteboxSwitch[] = [
  {
    id: 'sw-sg-01', hostname: 'sg-leaf-01', ip_address: '10.1.0.1', management_ip: '10.255.0.1',
    model: 'DCS-7060CX2-32S', vendor: 'Edgecore', nos: 'SONiC', nos_version: '202305.1',
    serial_number: 'EC2024A00123', role: 'Leaf', status: 'online', uptime_hours: 2160,
    ports: [
      { port_id: 'Ethernet1', description: 'Server Rack A', admin_status: 'up', oper_status: 'up', speed: '25G', dot1x_enabled: true, mab_enabled: false, sgt_tag: 100, sgt_name: 'Engineering' },
      { port_id: 'Ethernet2', description: 'Server Rack B', admin_status: 'up', oper_status: 'up', speed: '25G', dot1x_enabled: true, mab_enabled: true, sgt_tag: 200, sgt_name: 'Corporate-SaaS' },
      { port_id: 'Ethernet3', description: 'IoT Devices', admin_status: 'up', oper_status: 'up', speed: '10G', dot1x_enabled: false, mab_enabled: true, sgt_tag: 500, sgt_name: 'IoT-Untrusted' },
      { port_id: 'Ethernet4', description: 'Guest WiFi AP', admin_status: 'up', oper_status: 'down', speed: '10G', dot1x_enabled: true, mab_enabled: false, sgt_tag: 999, sgt_name: 'Guest' },
      { port_id: 'Ethernet32', description: 'Uplink to Spine', admin_status: 'up', oper_status: 'up', speed: '100G', dot1x_enabled: false, mab_enabled: false, sgt_tag: null, sgt_name: '' },
    ],
    sgt_mappings: [
      { port_id: 'Ethernet1', sgt_tag: 100, sgt_name: 'Engineering', sgt_vlan: 100 },
      { port_id: 'Ethernet2', sgt_tag: 200, sgt_name: 'Corporate-SaaS', sgt_vlan: 200 },
      { port_id: 'Ethernet3', sgt_tag: 500, sgt_name: 'IoT-Untrusted', sgt_vlan: 500 },
    ],
    config_version: 14, last_config_push: '2026-03-15T08:00:00Z', last_heartbeat: '2026-03-15T11:00:00Z',
  },
  {
    id: 'sw-sg-02', hostname: 'sg-spine-01', ip_address: '10.1.0.254', management_ip: '10.255.0.2',
    model: 'AG9032v2a', vendor: 'Delta Networks', nos: 'SONiC', nos_version: '202305.1',
    serial_number: 'DN2024B00456', role: 'Spine', status: 'online', uptime_hours: 4320,
    ports: [
      { port_id: 'Ethernet1', description: 'sg-leaf-01 Uplink', admin_status: 'up', oper_status: 'up', speed: '100G', dot1x_enabled: false, mab_enabled: false, sgt_tag: null, sgt_name: '' },
      { port_id: 'Ethernet2', description: 'sg-leaf-02 Uplink', admin_status: 'up', oper_status: 'up', speed: '100G', dot1x_enabled: false, mab_enabled: false, sgt_tag: null, sgt_name: '' },
      { port_id: 'Ethernet3', description: 'Border to WAN', admin_status: 'up', oper_status: 'up', speed: '100G', dot1x_enabled: false, mab_enabled: false, sgt_tag: null, sgt_name: '' },
    ],
    sgt_mappings: [],
    config_version: 8, last_config_push: '2026-03-14T22:00:00Z', last_heartbeat: '2026-03-15T11:00:00Z',
  },
  {
    id: 'sw-syd-01', hostname: 'syd-leaf-01', ip_address: '10.2.0.1', management_ip: '10.255.1.1',
    model: 'Seastone-DX010', vendor: 'Celestica', nos: 'SONiC', nos_version: '202305.1',
    serial_number: 'CL2024C00789', role: 'Leaf', status: 'offline', uptime_hours: 0,
    ports: [
      { port_id: 'Ethernet1', description: 'Server Rack C', admin_status: 'down', oper_status: 'down', speed: '25G', dot1x_enabled: true, mab_enabled: false, sgt_tag: 100, sgt_name: 'Engineering' },
    ],
    sgt_mappings: [
      { port_id: 'Ethernet1', sgt_tag: 100, sgt_name: 'Engineering', sgt_vlan: 100 },
    ],
    config_version: 3, last_config_push: '2026-03-10T06:00:00Z', last_heartbeat: '2026-03-14T03:00:00Z',
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */

const statusBadge: Record<string, string> = {
  online: 'text-green-400 bg-green-900/30 border-green-700/40',
  offline: 'text-red-400 bg-red-900/30 border-red-700/40',
  provisioning: 'text-blue-400 bg-blue-900/30 border-blue-500/40',
};

const portStatusDot = (s: string) => s === 'up' ? 'bg-green-400' : 'bg-red-400';

/* ═══════════════════════════════════════════════════════════════ */
/*  SDN WHITEBOX SWITCH MANAGEMENT                                 */
/* ═══════════════════════════════════════════════════════════════ */

export default function SDNPage() {
  const [switches, setSwitches] = useState<WhiteboxSwitch[]>(demoSwitches);
  const [expandedSwitch, setExpandedSwitch] = useState<string | null>('sw-sg-01');
  const [activeTab, setActiveTab] = useState<'switches' | 'vendors'>('switches');

  const online = switches.filter(s => s.status === 'online').length;
  const dot1xPorts = switches.reduce((s, sw) => s + sw.ports.filter(p => p.dot1x_enabled).length, 0);
  const sgtPorts = switches.reduce((s, sw) => s + sw.ports.filter(p => p.sgt_tag !== null).length, 0);

  const pushConfig = (swId: string) => {
    setSwitches(prev => prev.map(sw =>
      sw.id === swId
        ? { ...sw, config_version: sw.config_version + 1, last_config_push: new Date().toISOString() }
        : sw
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Router size={24} className="text-purple-400" />
        <div>
          <h1 className="text-xl font-semibold">SDN Whitebox Switch Management</h1>
          <p className="text-sm text-gray-500">
            Manage whitebox switches with SONiC/DENT NOS — configure ports, 802.1X, SGT tagging, and push via OpenConfig/gNMI
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Switches', value: switches.length, icon: Router, color: 'text-purple-400' },
          { label: 'Online', value: online, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Dot1X Ports', value: dot1xPorts, icon: Shield, color: 'text-blue-400' },
          { label: 'SGT Tagged Ports', value: sgtPorts, icon: Layers, color: 'text-cyan-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
            <s.icon size={20} className={s.color} />
            <div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-1 overflow-x-auto">
        {(['switches', 'vendors'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab
                ? 'bg-gray-900 text-white border border-gray-800 border-b-0'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'switches' ? `Switches (${switches.length})` : `Vendor Partners (${vendors.length})`}
          </button>
        ))}
      </div>

      {/* Switches tab */}
      {activeTab === 'switches' && (
        <div className="space-y-2">
          {switches.map(sw => {
            const isExpanded = expandedSwitch === sw.id;
            return (
              <div key={sw.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSwitch(isExpanded ? null : sw.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors text-left"
                >
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${statusBadge[sw.status]}`}>
                    {sw.status}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{sw.hostname}</span>
                    <span className="text-[10px] text-gray-500 ml-2">
                      {sw.vendor} {sw.model} · {sw.nos} {sw.nos_version} · {sw.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">{sw.ports.length} ports</span>
                  <span className="text-[10px] text-gray-600 font-mono">v{sw.config_version}</span>
                  {isExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800/60 px-5 py-4 space-y-4">
                    {/* Switch info grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {[
                        { label: 'IP Address', value: sw.ip_address },
                        { label: 'Management IP', value: sw.management_ip },
                        { label: 'Serial', value: sw.serial_number },
                        { label: 'Uptime', value: sw.uptime_hours > 0 ? `${Math.floor(sw.uptime_hours / 24)}d ${sw.uptime_hours % 24}h` : 'Down' },
                        { label: 'Last Config Push', value: new Date(sw.last_config_push).toLocaleString() },
                      ].map(f => (
                        <div key={f.label} className="p-2 bg-gray-800/30 rounded-lg">
                          <div className="text-[9px] text-gray-600 uppercase">{f.label}</div>
                          <div className="text-xs text-white/70 mt-0.5 truncate">{f.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Push config button */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => pushConfig(sw.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-400 rounded-lg text-xs transition-colors"
                      >
                        <RefreshCw size={12} /> Push Config (gNMI)
                      </button>
                    </div>

                    {/* Port table */}
                    <div className="rounded-lg border border-gray-800/50 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-800 text-[9px] text-gray-500 uppercase tracking-wider bg-gray-800/30">
                            <th className="text-left px-3 py-2">Port</th>
                            <th className="text-left px-3 py-2">Description</th>
                            <th className="text-left px-3 py-2">Speed</th>
                            <th className="text-left px-3 py-2">Status</th>
                            <th className="text-left px-3 py-2">802.1X</th>
                            <th className="text-left px-3 py-2">MAB</th>
                            <th className="text-left px-3 py-2">SGT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/30">
                          {sw.ports.map(port => (
                            <tr key={port.port_id} className="hover:bg-gray-800/20 transition-colors">
                              <td className="px-3 py-2 font-mono text-gray-300">{port.port_id}</td>
                              <td className="px-3 py-2 text-gray-400">{port.description}</td>
                              <td className="px-3 py-2 text-gray-400">{port.speed}</td>
                              <td className="px-3 py-2">
                                <span className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${portStatusDot(port.oper_status)}`} />
                                  <span className="text-gray-400">{port.oper_status}</span>
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {port.dot1x_enabled
                                  ? <span className="text-green-400 text-[10px]">Enabled</span>
                                  : <span className="text-gray-600 text-[10px]">—</span>}
                              </td>
                              <td className="px-3 py-2">
                                {port.mab_enabled
                                  ? <span className="text-blue-400 text-[10px]">Enabled</span>
                                  : <span className="text-gray-600 text-[10px]">—</span>}
                              </td>
                              <td className="px-3 py-2">
                                {port.sgt_tag === null
                                  ? <span className="text-gray-600 text-[10px]">—</span>
                                  : <span className="px-1.5 py-0.5 text-[9px] bg-cyan-900/30 text-cyan-400 rounded border border-cyan-700/40">SGT-{port.sgt_tag} ({port.sgt_name})</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* SGT Mappings */}
                    {sw.sgt_mappings.length > 0 && (
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">SGT Port Mappings</div>
                        <div className="flex flex-wrap gap-2">
                          {sw.sgt_mappings.map(m => (
                            <div key={m.port_id} className="px-3 py-1.5 bg-gray-800/30 rounded-lg border border-gray-700/30 text-xs">
                              <span className="text-gray-400">{m.port_id}</span>
                              <span className="mx-1.5 text-gray-600">→</span>
                              <span className="text-cyan-400 font-mono">SGT-{m.sgt_tag}</span>
                              <span className="text-gray-500 ml-1">({m.sgt_name})</span>
                              <span className="text-gray-600 ml-1.5">SGT {m.sgt_vlan}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Vendors tab */}
      {activeTab === 'vendors' && (
        <div className="grid grid-cols-2 gap-4">
          {vendors.map(v => (
            <div key={v.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-purple-400" />
                <h3 className="text-sm font-semibold text-gray-200">{v.name}</h3>
              </div>
              <div>
                <div className="text-[9px] text-gray-600 uppercase mb-1">Models</div>
                <div className="flex flex-wrap gap-1">
                  {v.models.map(m => (
                    <span key={m} className="px-2 py-0.5 text-[10px] bg-gray-800 text-gray-400 rounded border border-gray-700/40">{m}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-gray-600 uppercase mb-1">Supported NOS</div>
                <div className="flex flex-wrap gap-1">
                  {v.supported_nos.map(n => (
                    <span key={n} className="px-2 py-0.5 text-[10px] bg-purple-900/30 text-purple-400 rounded border border-purple-700/40">{n}</span>
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-gray-500">
                API: <span className="text-gray-400">{v.api_type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
