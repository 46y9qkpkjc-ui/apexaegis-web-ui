'use client';
import { useState } from 'react';
import {
  Cable, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronRight, Search, RefreshCw,
  Zap, Shield, Settings, ArrowUpDown, MonitorSmartphone,
  Activity, Router, Server,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ──────────────────────────────────────────────────── */

type PortSpeed = '10M' | '100M' | '1G' | '2.5G' | '5G' | '10G' | '25G' | '40G' | '100G' | 'auto';
type PortDuplex = 'full' | 'half' | 'auto';
type PortMode = 'access' | 'trunk' | 'hybrid' | 'routed';
type PoeClass = 'off' | 'class0' | 'class1' | 'class2' | 'class3' | 'class4' | 'class5' | 'class6' | 'class7' | 'class8';

interface PortConfig {
  port_id: string;
  label: string;
  description: string;
  admin_status: 'up' | 'down';
  oper_status: 'up' | 'down' | 'err-disabled';
  speed: PortSpeed;
  duplex: PortDuplex;
  mode: PortMode;
  native_vlan: number;
  allowed_vlans: string;
  sgt_tag: number | null;
  sgt_name: string;
  dot1x_enabled: boolean;
  mab_enabled: boolean;
  poe_enabled: boolean;
  poe_class: PoeClass;
  poe_watts_allocated: number;
  poe_watts_drawn: number;
  storm_control_bcast: number;
  storm_control_mcast: number;
  bpdu_guard: boolean;
  root_guard: boolean;
  port_security: boolean;
  max_mac_addresses: number;
  connected_device: string | null;
  connected_mac: string | null;
  link_type: 'copper' | 'sfp' | 'sfp+' | 'qsfp28';
  tx_bytes: number;
  rx_bytes: number;
  errors_in: number;
  errors_out: number;
  last_flap: string;
}

interface DeviceInfo {
  id: string;
  hostname: string;
  ip: string;
  model: string;
  role: 'access' | 'distribution' | 'core' | 'ap_controller';
  total_ports: number;
  ports_up: number;
  poe_budget_watts: number;
  poe_used_watts: number;
  ports: PortConfig[];
}

/* ─── Demo Data ──────────────────────────────────────────────── */

const demoDevices: DeviceInfo[] = [
  {
    id: 'sw-acc-01',
    hostname: 'SG-ACC-SW01',
    ip: '10.1.1.10',
    model: 'Edgecore DCS204 (48x1G + 6x10G)',
    role: 'access',
    total_ports: 54,
    ports_up: 38,
    poe_budget_watts: 740,
    poe_used_watts: 312,
    ports: [
      { port_id: 'Gi1/0/1', label: 'ge-0/0/1', description: 'Workstation — Finance', admin_status: 'up', oper_status: 'up', speed: '1G', duplex: 'full', mode: 'access', native_vlan: 100, allowed_vlans: '100', sgt_tag: 10, sgt_name: 'Corp-Finance', dot1x_enabled: true, mab_enabled: false, poe_enabled: true, poe_class: 'class4', poe_watts_allocated: 30, poe_watts_drawn: 12.4, storm_control_bcast: 10, storm_control_mcast: 10, bpdu_guard: true, root_guard: false, port_security: true, max_mac_addresses: 3, connected_device: 'Dell-Latitude-5540', connected_mac: 'AA:BB:CC:11:22:33', link_type: 'copper', tx_bytes: 1240000000, rx_bytes: 890000000, errors_in: 0, errors_out: 0, last_flap: '14 days ago' },
      { port_id: 'Gi1/0/2', label: 'ge-0/0/2', description: 'IP Phone — Finance Desk 2', admin_status: 'up', oper_status: 'up', speed: '100M', duplex: 'full', mode: 'access', native_vlan: 200, allowed_vlans: '200', sgt_tag: 40, sgt_name: 'Voice-SGT', dot1x_enabled: false, mab_enabled: true, poe_enabled: true, poe_class: 'class3', poe_watts_allocated: 15.4, poe_watts_drawn: 6.3, storm_control_bcast: 5, storm_control_mcast: 5, bpdu_guard: true, root_guard: false, port_security: true, max_mac_addresses: 2, connected_device: 'Poly-VVX450', connected_mac: 'DE:AD:BE:EF:01:02', link_type: 'copper', tx_bytes: 340000000, rx_bytes: 280000000, errors_in: 0, errors_out: 0, last_flap: '30 days ago' },
      { port_id: 'Gi1/0/3', label: 'ge-0/0/3', description: 'Wireless AP — 3F Lobby', admin_status: 'up', oper_status: 'up', speed: '1G', duplex: 'full', mode: 'trunk', native_vlan: 1, allowed_vlans: '100,200,300,400', sgt_tag: null, sgt_name: '', dot1x_enabled: false, mab_enabled: false, poe_enabled: true, poe_class: 'class5', poe_watts_allocated: 45, poe_watts_drawn: 24.7, storm_control_bcast: 20, storm_control_mcast: 20, bpdu_guard: false, root_guard: true, port_security: false, max_mac_addresses: 64, connected_device: 'Ruckus-R750', connected_mac: 'C4:01:7C:AA:BB:CC', link_type: 'copper', tx_bytes: 5200000000, rx_bytes: 8100000000, errors_in: 2, errors_out: 0, last_flap: '7 days ago' },
      { port_id: 'Gi1/0/4', label: 'ge-0/0/4', description: 'CCTV Camera — Entrance', admin_status: 'up', oper_status: 'up', speed: '100M', duplex: 'full', mode: 'access', native_vlan: 300, allowed_vlans: '300', sgt_tag: 50, sgt_name: 'IoT-Restricted', dot1x_enabled: false, mab_enabled: true, poe_enabled: true, poe_class: 'class2', poe_watts_allocated: 7, poe_watts_drawn: 4.8, storm_control_bcast: 5, storm_control_mcast: 5, bpdu_guard: true, root_guard: false, port_security: true, max_mac_addresses: 1, connected_device: 'Hikvision-DS2CD2345', connected_mac: 'F0:E1:D2:C3:B4:A5', link_type: 'copper', tx_bytes: 12000000000, rx_bytes: 590000000, errors_in: 0, errors_out: 0, last_flap: '45 days ago' },
      { port_id: 'Gi1/0/5', label: 'ge-0/0/5', description: 'Empty — Patch F2-05', admin_status: 'up', oper_status: 'down', speed: 'auto', duplex: 'auto', mode: 'access', native_vlan: 100, allowed_vlans: '100', sgt_tag: null, sgt_name: '', dot1x_enabled: true, mab_enabled: true, poe_enabled: true, poe_class: 'off', poe_watts_allocated: 0, poe_watts_drawn: 0, storm_control_bcast: 10, storm_control_mcast: 10, bpdu_guard: true, root_guard: false, port_security: true, max_mac_addresses: 3, connected_device: null, connected_mac: null, link_type: 'copper', tx_bytes: 0, rx_bytes: 0, errors_in: 0, errors_out: 0, last_flap: 'never' },
      { port_id: 'Gi1/0/6', label: 'ge-0/0/6', description: 'Printer — HR Floor', admin_status: 'up', oper_status: 'up', speed: '1G', duplex: 'full', mode: 'access', native_vlan: 100, allowed_vlans: '100', sgt_tag: 20, sgt_name: 'Corp-General', dot1x_enabled: false, mab_enabled: true, poe_enabled: false, poe_class: 'off', poe_watts_allocated: 0, poe_watts_drawn: 0, storm_control_bcast: 10, storm_control_mcast: 10, bpdu_guard: true, root_guard: false, port_security: true, max_mac_addresses: 1, connected_device: 'HP-LaserJet-M609', connected_mac: '08:00:2B:AA:BB:CC', link_type: 'copper', tx_bytes: 2100000000, rx_bytes: 780000000, errors_in: 0, errors_out: 0, last_flap: '62 days ago' },
      { port_id: 'Gi1/0/7', label: 'ge-0/0/7', description: 'Err-Disabled — Sec Violation', admin_status: 'up', oper_status: 'err-disabled', speed: '1G', duplex: 'full', mode: 'access', native_vlan: 100, allowed_vlans: '100', sgt_tag: 10, sgt_name: 'Corp-Finance', dot1x_enabled: true, mab_enabled: false, poe_enabled: true, poe_class: 'class4', poe_watts_allocated: 30, poe_watts_drawn: 0, storm_control_bcast: 10, storm_control_mcast: 10, bpdu_guard: true, root_guard: false, port_security: true, max_mac_addresses: 1, connected_device: 'Unknown', connected_mac: 'FF:FF:FF:00:00:01', link_type: 'copper', tx_bytes: 0, rx_bytes: 0, errors_in: 847, errors_out: 0, last_flap: '2 hours ago' },
      { port_id: 'Te1/0/49', label: 'xe-0/0/49', description: 'Uplink — Core Switch 1', admin_status: 'up', oper_status: 'up', speed: '10G', duplex: 'full', mode: 'trunk', native_vlan: 1, allowed_vlans: 'all', sgt_tag: null, sgt_name: '', dot1x_enabled: false, mab_enabled: false, poe_enabled: false, poe_class: 'off', poe_watts_allocated: 0, poe_watts_drawn: 0, storm_control_bcast: 30, storm_control_mcast: 30, bpdu_guard: false, root_guard: true, port_security: false, max_mac_addresses: 8192, connected_device: 'SG-CORE-SW01', connected_mac: '00:1A:2B:3C:4D:5E', link_type: 'sfp+', tx_bytes: 98000000000, rx_bytes: 124000000000, errors_in: 0, errors_out: 0, last_flap: '90 days ago' },
    ],
  },
  {
    id: 'sw-acc-02',
    hostname: 'SG-ACC-SW02',
    ip: '10.1.1.11',
    model: 'Edgecore DCS204 (48x1G + 6x10G)',
    role: 'access',
    total_ports: 54,
    ports_up: 42,
    poe_budget_watts: 740,
    poe_used_watts: 485,
    ports: [
      { port_id: 'Gi1/0/1', label: 'ge-0/0/1', description: 'Workstation — IT Admin', admin_status: 'up', oper_status: 'up', speed: '1G', duplex: 'full', mode: 'access', native_vlan: 100, allowed_vlans: '100', sgt_tag: 5, sgt_name: 'IT-Admin', dot1x_enabled: true, mab_enabled: false, poe_enabled: true, poe_class: 'class4', poe_watts_allocated: 30, poe_watts_drawn: 15.2, storm_control_bcast: 10, storm_control_mcast: 10, bpdu_guard: true, root_guard: false, port_security: true, max_mac_addresses: 3, connected_device: 'ThinkPad-X1C-Gen11', connected_mac: '11:22:33:44:55:66', link_type: 'copper', tx_bytes: 3100000000, rx_bytes: 2400000000, errors_in: 0, errors_out: 0, last_flap: '21 days ago' },
      { port_id: 'Gi1/0/2', label: 'ge-0/0/2', description: 'Badge Reader — Server Room', admin_status: 'up', oper_status: 'up', speed: '100M', duplex: 'full', mode: 'access', native_vlan: 300, allowed_vlans: '300', sgt_tag: 50, sgt_name: 'IoT-Restricted', dot1x_enabled: false, mab_enabled: true, poe_enabled: true, poe_class: 'class1', poe_watts_allocated: 4, poe_watts_drawn: 2.1, storm_control_bcast: 5, storm_control_mcast: 5, bpdu_guard: true, root_guard: false, port_security: true, max_mac_addresses: 1, connected_device: 'HID-iCLASS-SE', connected_mac: 'AB:CD:EF:01:23:45', link_type: 'copper', tx_bytes: 45000000, rx_bytes: 23000000, errors_in: 0, errors_out: 0, last_flap: '120 days ago' },
      { port_id: 'Gi1/0/3', label: 'ge-0/0/3', description: 'Conference Room Display', admin_status: 'up', oper_status: 'up', speed: '1G', duplex: 'full', mode: 'access', native_vlan: 400, allowed_vlans: '400', sgt_tag: 60, sgt_name: 'AV-Equipment', dot1x_enabled: false, mab_enabled: true, poe_enabled: false, poe_class: 'off', poe_watts_allocated: 0, poe_watts_drawn: 0, storm_control_bcast: 10, storm_control_mcast: 10, bpdu_guard: true, root_guard: false, port_security: true, max_mac_addresses: 1, connected_device: 'Samsung-QM55R', connected_mac: 'CC:DD:EE:FF:00:11', link_type: 'copper', tx_bytes: 890000000, rx_bytes: 67000000, errors_in: 0, errors_out: 0, last_flap: '35 days ago' },
    ],
  },
];

const formatBytes = (b: number) => {
  if (b === 0) return '0 B';
  if (b < 1e6) return (b / 1e3).toFixed(1) + ' KB';
  if (b < 1e9) return (b / 1e6).toFixed(1) + ' MB';
  return (b / 1e9).toFixed(1) + ' GB';
};

const poePercent = (d: DeviceInfo) => d.poe_budget_watts > 0 ? Math.round((d.poe_used_watts / d.poe_budget_watts) * 100) : 0;

/* ─── Component ──────────────────────────────────────────────── */

export default function PortConfigPage() {
  const [selectedDevice, setSelectedDevice] = useState(demoDevices[0].id);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'up' | 'down' | 'err-disabled'>('all');
  const [expandedPort, setExpandedPort] = useState<string | null>(null);
  const [tab, setTab] = useState<'ports' | 'poe' | 'security' | 'templates'>('ports');

  const device = demoDevices.find(d => d.id === selectedDevice)!;
  const filtered = device.ports.filter(p => {
    const matchSearch = search === '' || p.port_id.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()) || (p.connected_device ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.oper_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const errDisabledCount = device.ports.filter(p => p.oper_status === 'err-disabled').length;

  /* ─── Port Templates ─── */
  const portTemplates = [
    { name: 'Corporate Workstation', description: '802.1X + PoE + Port-Security, Access mode, Corp SGT', mode: 'access' as PortMode, dot1x: true, mab: false, poe: true, poe_class: 'class4', bpdu_guard: true, port_security: true, max_mac: 3, storm_bcast: 10, sgt_name: 'Corp-General' },
    { name: 'IP Phone + Data', description: 'MAB for phone, 802.1X for data, PoE Class 3, Voice SGT', mode: 'access' as PortMode, dot1x: true, mab: true, poe: true, poe_class: 'class3', bpdu_guard: true, port_security: true, max_mac: 2, storm_bcast: 5, sgt_name: 'Voice-SGT' },
    { name: 'Wireless AP Uplink', description: 'Trunk mode, PoE++ (Class 5), Root Guard, no auth', mode: 'trunk' as PortMode, dot1x: false, mab: false, poe: true, poe_class: 'class5', bpdu_guard: false, port_security: false, max_mac: 64, storm_bcast: 20, sgt_name: 'AP-Trunk' },
    { name: 'IoT / CCTV Device', description: 'MAB only, PoE Class 2, port-security max 1, IoT-Restricted SGT', mode: 'access' as PortMode, dot1x: false, mab: true, poe: true, poe_class: 'class2', bpdu_guard: true, port_security: true, max_mac: 1, storm_bcast: 5, sgt_name: 'IoT-Restricted' },
    { name: 'Printer / Shared', description: 'MAB only, no PoE, port-security max 1', mode: 'access' as PortMode, dot1x: false, mab: true, poe: false, poe_class: 'off', bpdu_guard: true, port_security: true, max_mac: 1, storm_bcast: 10, sgt_name: 'Corp-General' },
    { name: '10G Uplink — Core', description: 'Trunk all VLANs, no PoE, root-guard, high storm threshold', mode: 'trunk' as PortMode, dot1x: false, mab: false, poe: false, poe_class: 'off', bpdu_guard: false, port_security: false, max_mac: 8192, storm_bcast: 30, sgt_name: '' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-900/30 rounded-lg"><Cable size={20} className="text-cyan-400" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Device Port Configuration</h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage switch port settings, PoE, security and SGT assignments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/60 border border-gray-700/50 rounded-lg text-xs hover:bg-gray-700/60 transition-colors">
            <RefreshCw size={13} /> Sync Config
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 text-cyan-400 border border-cyan-600/30 rounded-lg text-xs hover:bg-cyan-600/30 transition-colors">
            <Settings size={13} /> Bulk Edit
          </button>
        </div>
      </div>

      {/* Device Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {demoDevices.map(d => (
          <button key={d.id} onClick={() => setSelectedDevice(d.id)}
            className={clsx('text-left p-3 rounded-xl border transition-all',
              selectedDevice === d.id
                ? 'bg-cyan-900/20 border-cyan-600/40 ring-1 ring-cyan-500/20'
                : 'bg-gray-900/50 border-gray-800/60 hover:border-gray-700'
            )}>
            <div className="flex items-center gap-2 mb-1">
              <Router size={14} className="text-cyan-400" />
              <span className="text-sm font-semibold">{d.hostname}</span>
            </div>
            <div className="text-[10px] text-gray-500">{d.ip} &middot; {d.model}</div>
            <div className="flex items-center gap-3 mt-2 text-[10px]">
              <span className="text-green-400">{d.ports_up}/{d.total_ports} up</span>
              <span className="text-amber-400">PoE {poePercent(d)}%</span>
              <span className="text-gray-500 capitalize">{d.role}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Ports', value: device.total_ports, icon: Cable, color: 'text-blue-400' },
          { label: 'Ports Up', value: device.ports_up, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Ports Down', value: device.total_ports - device.ports_up - errDisabledCount, icon: XCircle, color: 'text-gray-500' },
          { label: 'Err-Disabled', value: errDisabledCount, icon: AlertTriangle, color: errDisabledCount > 0 ? 'text-red-400' : 'text-gray-500' },
          { label: 'PoE Budget', value: `${device.poe_used_watts}/${device.poe_budget_watts}W`, icon: Zap, color: 'text-amber-400' },
          { label: 'PoE Utilisation', value: `${poePercent(device)}%`, icon: Activity, color: poePercent(device) > 80 ? 'text-red-400' : 'text-cyan-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-3 flex items-center gap-3">
            <s.icon size={16} className={s.color} />
            <div>
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
        {([
          { key: 'ports', label: 'Port Table', icon: Cable },
          { key: 'poe', label: 'PoE Dashboard', icon: Zap },
          { key: 'security', label: 'Port Security', icon: Shield },
          { key: 'templates', label: 'Port Templates', icon: Settings },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
              tab === t.key ? 'bg-cyan-600/20 text-cyan-300 shadow-sm' : 'text-gray-500 hover:text-gray-300'
            )}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* ─── Port Table Tab ─── */}
      {tab === 'ports' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className="relative flex-1 max-w-xs w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search port, description, device..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-800/30 border border-gray-700/50 rounded-lg text-xs placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40" />
            </div>
            <div className="flex gap-1">
              {(['all', 'up', 'down', 'err-disabled'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={clsx('px-2 py-1 rounded-md text-[10px] border transition-all capitalize',
                    statusFilter === s ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/40' : 'text-gray-500 border-transparent hover:text-gray-300'
                  )}>
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left px-3 py-2 font-medium">Port</th>
                  <th className="text-left px-3 py-2 font-medium">Description</th>
                  <th className="text-center px-3 py-2 font-medium">Status</th>
                  <th className="text-left px-3 py-2 font-medium">Speed</th>
                  <th className="text-left px-3 py-2 font-medium">Mode</th>
                  <th className="text-left px-3 py-2 font-medium">SGT</th>
                  <th className="text-center px-3 py-2 font-medium">802.1X</th>
                  <th className="text-center px-3 py-2 font-medium">PoE</th>
                  <th className="text-left px-3 py-2 font-medium">Connected</th>
                  <th className="text-center px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filtered.map(p => (
                  <>
                    <tr key={p.port_id} className="hover:bg-gray-800/30 transition-colors cursor-pointer" onClick={() => setExpandedPort(expandedPort === p.port_id ? null : p.port_id)}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className={clsx('w-1.5 h-1.5 rounded-full', p.oper_status === 'up' ? 'bg-green-400' : p.oper_status === 'err-disabled' ? 'bg-red-400 animate-pulse' : 'bg-gray-600')} />
                          <span className="font-mono font-medium text-gray-200">{p.port_id}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-gray-400 max-w-[160px] truncate">{p.description}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-medium',
                          p.oper_status === 'up' ? 'bg-green-900/30 text-green-400' : p.oper_status === 'err-disabled' ? 'bg-red-900/30 text-red-400' : 'bg-gray-800 text-gray-500'
                        )}>{p.oper_status}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-400">{p.speed}/{p.duplex}</td>
                      <td className="px-3 py-2">
                        <span className={clsx('px-1.5 py-0.5 rounded text-[9px]',
                          p.mode === 'trunk' ? 'bg-purple-900/30 text-purple-400' : p.mode === 'routed' ? 'bg-blue-900/30 text-blue-400' : 'bg-gray-800 text-gray-400'
                        )}>{p.mode}</span>
                      </td>
                      <td className="px-3 py-2">
                        {p.sgt_tag !== null
                          ? <span className="text-cyan-400">{p.sgt_name} <span className="text-gray-600">({p.sgt_tag})</span></span>
                          : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {p.dot1x_enabled ? <CheckCircle2 size={13} className="text-green-400 inline-block" /> : <span className="text-gray-700">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {p.poe_enabled
                          ? <span className="text-amber-400">{p.poe_watts_drawn}W</span>
                          : <span className="text-gray-700">—</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-400 max-w-[140px] truncate">
                        {p.connected_device ?? <span className="text-gray-600 italic">none</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {expandedPort === p.port_id ? <ChevronDown size={13} className="text-gray-500" /> : <ChevronRight size={13} className="text-gray-600" />}
                      </td>
                    </tr>
                    {expandedPort === p.port_id && (
                      <tr key={`${p.port_id}-detail`}>
                        <td colSpan={10} className="px-4 py-3 bg-gray-800/20">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[11px]">
                            <div className="space-y-1.5">
                              <h4 className="text-gray-400 font-medium mb-1">Layer 2</h4>
                              <div className="flex justify-between"><span className="text-gray-500">Native VLAN</span><span>{p.native_vlan}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Allowed VLANs</span><span className="text-gray-300">{p.allowed_vlans}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Link Type</span><span className="text-gray-300 uppercase">{p.link_type}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">MAC Address</span><span className="font-mono text-gray-300">{p.connected_mac ?? '—'}</span></div>
                            </div>
                            <div className="space-y-1.5">
                              <h4 className="text-gray-400 font-medium mb-1">Security</h4>
                              <div className="flex justify-between"><span className="text-gray-500">BPDU Guard</span><span className={p.bpdu_guard ? 'text-green-400' : 'text-gray-600'}>{p.bpdu_guard ? 'Enabled' : 'Off'}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Root Guard</span><span className={p.root_guard ? 'text-green-400' : 'text-gray-600'}>{p.root_guard ? 'Enabled' : 'Off'}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Port Security</span><span className={p.port_security ? 'text-green-400' : 'text-gray-600'}>{p.port_security ? `On (max ${p.max_mac_addresses})` : 'Off'}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Storm Ctrl (B/M)</span><span className="text-gray-300">{p.storm_control_bcast}% / {p.storm_control_mcast}%</span></div>
                            </div>
                            <div className="space-y-1.5">
                              <h4 className="text-gray-400 font-medium mb-1">PoE</h4>
                              <div className="flex justify-between"><span className="text-gray-500">PoE Enabled</span><span className={p.poe_enabled ? 'text-amber-400' : 'text-gray-600'}>{p.poe_enabled ? 'Yes' : 'No'}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">PoE Class</span><span className="text-gray-300">{p.poe_class}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Allocated</span><span className="text-gray-300">{p.poe_watts_allocated}W</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Drawn</span><span className="text-amber-400">{p.poe_watts_drawn}W</span></div>
                            </div>
                            <div className="space-y-1.5">
                              <h4 className="text-gray-400 font-medium mb-1">Counters</h4>
                              <div className="flex justify-between"><span className="text-gray-500">TX</span><span className="text-gray-300">{formatBytes(p.tx_bytes)}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">RX</span><span className="text-gray-300">{formatBytes(p.rx_bytes)}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Errors In/Out</span><span className={p.errors_in > 0 ? 'text-red-400' : 'text-gray-300'}>{p.errors_in}/{p.errors_out}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Last Flap</span><span className="text-gray-300">{p.last_flap}</span></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── PoE Dashboard Tab ─── */}
      {tab === 'poe' && (
        <div className="space-y-4">
          {/* PoE Power Budget */}
          <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Zap size={14} className="text-amber-400" /> Power Budget — {device.hostname}</h3>
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{device.poe_used_watts}W used</span>
                <span className="text-gray-500">{device.poe_budget_watts}W total</span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className={clsx('h-full rounded-full transition-all', poePercent(device) > 80 ? 'bg-red-500' : poePercent(device) > 60 ? 'bg-amber-500' : 'bg-green-500')}
                  style={{ width: `${poePercent(device)}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Available</span><span className="text-green-400">{device.poe_budget_watts - device.poe_used_watts}W</span></div>
              <div className="flex justify-between"><span className="text-gray-500">PoE Ports Active</span><span>{device.ports.filter(p => p.poe_enabled && p.poe_watts_drawn > 0).length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Avg per Port</span><span>{(device.poe_used_watts / Math.max(1, device.ports.filter(p => p.poe_watts_drawn > 0).length)).toFixed(1)}W</span></div>
            </div>
          </div>

          {/* Per-Port PoE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {device.ports.filter(p => p.poe_enabled).map(p => (
              <div key={p.port_id} className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap size={12} className={p.poe_watts_drawn > 0 ? 'text-amber-400' : 'text-gray-600'} />
                    <span className="text-xs font-mono font-medium">{p.port_id}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{p.poe_class}</span>
                </div>
                <div className="mb-1.5">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                    <span>{p.poe_watts_drawn}W drawn</span>
                    <span>{p.poe_watts_allocated}W alloc</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className={clsx('h-full rounded-full', p.poe_watts_allocated > 0 && (p.poe_watts_drawn / p.poe_watts_allocated) > 0.8 ? 'bg-red-500' : 'bg-amber-500')}
                      style={{ width: `${p.poe_watts_allocated > 0 ? (p.poe_watts_drawn / p.poe_watts_allocated) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 truncate">{p.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Port Security Tab ─── */}
      {tab === 'security' && (
        <div className="space-y-4">
          {/* Err-Disabled Ports Alert */}
          {errDisabledCount > 0 && (
            <div className="bg-red-950/20 border border-red-800/30 rounded-xl p-3 flex items-center gap-3">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-red-400">{errDisabledCount} Port(s) Err-Disabled</div>
                <div className="text-[11px] text-gray-400">
                  {device.ports.filter(p => p.oper_status === 'err-disabled').map(p => p.port_id).join(', ')} — security violation detected. Review and bounce to restore.
                </div>
              </div>
              <button className="ml-auto px-2 py-1 text-[10px] bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors whitespace-nowrap">
                Bounce All
              </button>
            </div>
          )}

          {/* Security features table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left px-3 py-2 font-medium">Port</th>
                  <th className="text-center px-3 py-2 font-medium">802.1X</th>
                  <th className="text-center px-3 py-2 font-medium">MAB</th>
                  <th className="text-center px-3 py-2 font-medium">Port Security</th>
                  <th className="text-center px-3 py-2 font-medium">Max MAC</th>
                  <th className="text-center px-3 py-2 font-medium">BPDU Guard</th>
                  <th className="text-center px-3 py-2 font-medium">Root Guard</th>
                  <th className="text-left px-3 py-2 font-medium">Storm Ctrl</th>
                  <th className="text-left px-3 py-2 font-medium">SGT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {device.ports.map(p => {
                  const secFeatures = [p.dot1x_enabled, p.mab_enabled, p.port_security, p.bpdu_guard, p.root_guard].filter(Boolean).length;
                  return (
                    <tr key={p.port_id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className={clsx('w-1.5 h-1.5 rounded-full', p.oper_status === 'up' ? 'bg-green-400' : p.oper_status === 'err-disabled' ? 'bg-red-400' : 'bg-gray-600')} />
                          <span className="font-mono">{p.port_id}</span>
                          {secFeatures >= 4 && <Shield size={11} className="text-green-400 ml-1" />}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">{p.dot1x_enabled ? <CheckCircle2 size={13} className="text-green-400 inline-block" /> : <XCircle size={13} className="text-gray-700 inline-block" />}</td>
                      <td className="px-3 py-2 text-center">{p.mab_enabled ? <CheckCircle2 size={13} className="text-green-400 inline-block" /> : <XCircle size={13} className="text-gray-700 inline-block" />}</td>
                      <td className="px-3 py-2 text-center">{p.port_security ? <CheckCircle2 size={13} className="text-green-400 inline-block" /> : <XCircle size={13} className="text-gray-700 inline-block" />}</td>
                      <td className="px-3 py-2 text-center text-gray-300">{p.max_mac_addresses}</td>
                      <td className="px-3 py-2 text-center">{p.bpdu_guard ? <CheckCircle2 size={13} className="text-green-400 inline-block" /> : <XCircle size={13} className="text-gray-700 inline-block" />}</td>
                      <td className="px-3 py-2 text-center">{p.root_guard ? <CheckCircle2 size={13} className="text-green-400 inline-block" /> : <XCircle size={13} className="text-gray-700 inline-block" />}</td>
                      <td className="px-3 py-2 text-gray-400">{p.storm_control_bcast}% / {p.storm_control_mcast}%</td>
                      <td className="px-3 py-2 text-cyan-400">{p.sgt_name || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Port Templates Tab ─── */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">Pre-defined port configuration templates. Apply a template to one or more ports to standardise settings.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {portTemplates.map(t => (
              <div key={t.name} className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-200">{t.name}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">{t.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex justify-between"><span className="text-gray-500">Mode</span><span className="capitalize">{t.mode}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">SGT</span><span className="text-cyan-400">{t.sgt_name || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">802.1X</span><span className={t.dot1x ? 'text-green-400' : 'text-gray-600'}>{t.dot1x ? 'On' : 'Off'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">MAB</span><span className={t.mab ? 'text-green-400' : 'text-gray-600'}>{t.mab ? 'On' : 'Off'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">PoE</span><span className={t.poe ? 'text-amber-400' : 'text-gray-600'}>{t.poe ? t.poe_class : 'Off'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Port Sec</span><span className={t.port_security ? 'text-green-400' : 'text-gray-600'}>{t.port_security ? `Max ${t.max_mac}` : 'Off'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">BPDU Guard</span><span className={t.bpdu_guard ? 'text-green-400' : 'text-gray-600'}>{t.bpdu_guard ? 'On' : 'Off'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Storm Ctrl</span><span>{t.storm_bcast}%</span></div>
                </div>
                <button className="w-full py-1.5 text-[10px] bg-cyan-600/15 text-cyan-400 border border-cyan-600/25 rounded-lg hover:bg-cyan-600/25 transition-colors">
                  Apply to Selected Ports
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-[10px] text-gray-600 text-center py-2">
        Device Port Configuration &middot; ApexAegis SSE Platform &middot; Last config sync: 2 minutes ago
      </div>
    </div>
  );
}
