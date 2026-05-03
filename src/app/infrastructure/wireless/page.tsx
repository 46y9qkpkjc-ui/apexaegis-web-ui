'use client';
import { useState } from 'react';
import {
  Wifi, Router, Shield, ChevronDown, ChevronRight, RefreshCw,
  Signal, Users, Lock, Radio, Monitor, Smartphone,
  CheckCircle2, XCircle, AlertTriangle, Cpu, Layers,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ──────────────────────────────────────────────────── */

type APStatus = 'online' | 'offline' | 'upgrading';
type ClientOS = 'Windows' | 'macOS' | 'iOS' | 'Android' | 'Linux' | 'ChromeOS';
type SecurityMode = 'WPA3-Enterprise' | 'WPA2-Enterprise' | 'WPA3-Personal' | 'Open' | 'OWE';
type Band = '2.4GHz' | '5GHz' | '6GHz';

interface SSID {
  name: string;
  security: SecurityMode;
  sgt_id: number;
  enabled: boolean;
  band: Band[];
  client_isolation: boolean;
  radius_server: string | null;
  broadcast: boolean;
}

interface AccessPoint {
  id: string;
  name: string;
  mac: string;
  model: string;
  vendor: 'Meraki' | 'Ubiquiti' | 'UniFi' | 'Generic';
  firmware: string;
  status: APStatus;
  ip: string;
  location: string;
  floor: string;
  serial: string;
  uptime_hours: number;
  connected_clients: number;
  channel_24: number;
  channel_5: number;
  channel_6: number | null;
  tx_power_24: number;
  tx_power_5: number;
  ssids: SSID[];
  cpu_pct: number;
  mem_pct: number;
  mesh_peer: string | null;
}

interface WirelessClient {
  mac: string;
  hostname: string;
  ip: string;
  os: ClientOS;
  ap_id: string;
  ap_name: string;
  ssid: string;
  band: Band;
  channel: number;
  rssi: number;
  snr: number;
  tx_rate_mbps: number;
  rx_rate_mbps: number;
  sgt: number;
  auth_method: string;
  username: string | null;
  connected_since: string;
  bytes_sent: number;
  bytes_recv: number;
}

interface WirelessSecurityEvent {
  id: string;
  timestamp: string;
  type: 'rogue_ap' | 'deauth_attack' | 'evil_twin' | 'wps_bruteforce' | 'pmkid_capture' | 'client_flood';
  severity: 'critical' | 'high' | 'medium' | 'low';
  source_mac: string;
  channel: number;
  details: string;
  action_taken: string;
  resolved: boolean;
}

/* ─── Demo Data ──────────────────────────────────────────────── */

const demoSSIDs: SSID[] = [
  { name: 'AegisSecure-Corp', security: 'WPA3-Enterprise', sgt_id: 100, enabled: true, band: ['5GHz', '6GHz'], client_isolation: false, radius_server: 'radius.corp.local', broadcast: true },
  { name: 'AegisSecure-IoT', security: 'WPA2-Enterprise', sgt_id: 200, enabled: true, band: ['2.4GHz', '5GHz'], client_isolation: true, radius_server: 'radius.corp.local', broadcast: true },
  { name: 'AegisSecure-Guest', security: 'OWE', sgt_id: 999, enabled: true, band: ['2.4GHz', '5GHz'], client_isolation: true, radius_server: null, broadcast: true },
  { name: 'AegisSecure-Mgmt', security: 'WPA3-Enterprise', sgt_id: 10, enabled: true, band: ['5GHz'], client_isolation: false, radius_server: 'radius.corp.local', broadcast: false },
];

const demoAPs: AccessPoint[] = [
  {
    id: 'ap-01', name: 'AP-Floor1-Lobby', mac: 'AA:BB:CC:11:22:01', model: 'MR56', vendor: 'Meraki',
    firmware: '30.7.1', status: 'online', ip: '10.10.1.11', location: 'Building A', floor: 'Floor 1',
    serial: 'Q3AA-BBCC-1122', uptime_hours: 1440, connected_clients: 34, channel_24: 1, channel_5: 36, channel_6: 5,
    tx_power_24: 17, tx_power_5: 20, ssids: demoSSIDs, cpu_pct: 18, mem_pct: 42, mesh_peer: null,
  },
  {
    id: 'ap-02', name: 'AP-Floor1-OpenPlan', mac: 'AA:BB:CC:11:22:02', model: 'U6-Enterprise', vendor: 'UniFi',
    firmware: '7.0.83', status: 'online', ip: '10.10.1.12', location: 'Building A', floor: 'Floor 1',
    serial: 'UF6E-44556677', uptime_hours: 720, connected_clients: 52, channel_24: 6, channel_5: 149, channel_6: null,
    tx_power_24: 14, tx_power_5: 23, ssids: demoSSIDs.slice(0, 3), cpu_pct: 35, mem_pct: 61, mesh_peer: null,
  },
  {
    id: 'ap-03', name: 'AP-Floor2-Boardroom', mac: 'AA:BB:CC:11:22:03', model: 'MR46', vendor: 'Meraki',
    firmware: '30.7.1', status: 'online', ip: '10.10.2.11', location: 'Building A', floor: 'Floor 2',
    serial: 'Q3AA-DDEE-3344', uptime_hours: 2880, connected_clients: 8, channel_24: 11, channel_5: 44, channel_6: null,
    tx_power_24: 11, tx_power_5: 17, ssids: demoSSIDs.slice(0, 2), cpu_pct: 8, mem_pct: 28, mesh_peer: null,
  },
  {
    id: 'ap-04', name: 'AP-Floor2-Lab', mac: 'AA:BB:CC:11:22:04', model: 'UAP-AC-PRO', vendor: 'Ubiquiti',
    firmware: '6.6.77', status: 'upgrading', ip: '10.10.2.12', location: 'Building A', floor: 'Floor 2',
    serial: 'UACPRO-AABBCC', uptime_hours: 4320, connected_clients: 0, channel_24: 1, channel_5: 100, channel_6: null,
    tx_power_24: 17, tx_power_5: 20, ssids: demoSSIDs.slice(0, 2), cpu_pct: 92, mem_pct: 78, mesh_peer: null,
  },
  {
    id: 'ap-05', name: 'AP-Warehouse-Mesh1', mac: 'AA:BB:CC:11:22:05', model: 'MR86', vendor: 'Meraki',
    firmware: '30.7.1', status: 'online', ip: '10.10.3.11', location: 'Warehouse B', floor: 'Ground',
    serial: 'Q3AA-FFGG-5566', uptime_hours: 960, connected_clients: 15, channel_24: 6, channel_5: 52, channel_6: 37,
    tx_power_24: 20, tx_power_5: 25, ssids: [demoSSIDs[1], demoSSIDs[2]], cpu_pct: 22, mem_pct: 45, mesh_peer: 'ap-06',
  },
  {
    id: 'ap-06', name: 'AP-Warehouse-Mesh2', mac: 'AA:BB:CC:11:22:06', model: 'MR86', vendor: 'Meraki',
    firmware: '30.6.5', status: 'offline', ip: '10.10.3.12', location: 'Warehouse B', floor: 'Ground',
    serial: 'Q3AA-HHII-7788', uptime_hours: 0, connected_clients: 0, channel_24: 11, channel_5: 60, channel_6: 69,
    tx_power_24: 20, tx_power_5: 25, ssids: [demoSSIDs[1]], cpu_pct: 0, mem_pct: 0, mesh_peer: 'ap-05',
  },
];

const demoClients: WirelessClient[] = [
  { mac: 'DE:AD:BE:EF:00:01', hostname: 'LAPTOP-JSmith', ip: '10.10.1.101', os: 'Windows', ap_id: 'ap-01', ap_name: 'AP-Floor1-Lobby', ssid: 'AegisSecure-Corp', band: '5GHz', channel: 36, rssi: -42, snr: 38, tx_rate_mbps: 866, rx_rate_mbps: 780, sgt: 100, auth_method: '802.1X EAP-TLS', username: 'jsmith@corp.com', connected_since: '2026-03-14T06:30:00Z', bytes_sent: 1_200_000_000, bytes_recv: 3_800_000_000 },
  { mac: 'DE:AD:BE:EF:00:02', hostname: 'MacBook-MWilliams', ip: '10.10.1.102', os: 'macOS', ap_id: 'ap-02', ap_name: 'AP-Floor1-OpenPlan', ssid: 'AegisSecure-Corp', band: '5GHz', channel: 149, rssi: -55, snr: 30, tx_rate_mbps: 574, rx_rate_mbps: 520, sgt: 100, auth_method: '802.1X PEAP', username: 'mwilliams@corp.com', connected_since: '2026-03-14T07:15:00Z', bytes_sent: 450_000_000, bytes_recv: 1_200_000_000 },
  { mac: 'DE:AD:BE:EF:00:03', hostname: 'iPhone-KBrown', ip: '10.10.1.103', os: 'iOS', ap_id: 'ap-01', ap_name: 'AP-Floor1-Lobby', ssid: 'AegisSecure-Corp', band: '6GHz', channel: 5, rssi: -38, snr: 42, tx_rate_mbps: 2400, rx_rate_mbps: 1800, sgt: 100, auth_method: '802.1X EAP-TLS', username: 'kbrown@corp.com', connected_since: '2026-03-14T08:00:00Z', bytes_sent: 80_000_000, bytes_recv: 320_000_000 },
  { mac: 'DE:AD:BE:EF:00:04', hostname: 'Pixel-LDavis', ip: '10.10.1.104', os: 'Android', ap_id: 'ap-02', ap_name: 'AP-Floor1-OpenPlan', ssid: 'AegisSecure-Guest', band: '2.4GHz', channel: 6, rssi: -68, snr: 18, tx_rate_mbps: 72, rx_rate_mbps: 54, sgt: 999, auth_method: 'OWE', username: null, connected_since: '2026-03-14T09:30:00Z', bytes_sent: 12_000_000, bytes_recv: 95_000_000 },
  { mac: 'DE:AD:BE:EF:00:05', hostname: 'IoT-TempSensor-1', ip: '10.10.2.50', os: 'Linux', ap_id: 'ap-03', ap_name: 'AP-Floor2-Boardroom', ssid: 'AegisSecure-IoT', band: '2.4GHz', channel: 11, rssi: -72, snr: 14, tx_rate_mbps: 24, rx_rate_mbps: 18, sgt: 200, auth_method: 'MAB', username: null, connected_since: '2026-03-12T00:00:00Z', bytes_sent: 500_000, bytes_recv: 200_000 },
  { mac: 'DE:AD:BE:EF:00:06', hostname: 'Chromebook-JLee', ip: '10.10.1.105', os: 'ChromeOS', ap_id: 'ap-02', ap_name: 'AP-Floor1-OpenPlan', ssid: 'AegisSecure-Corp', band: '5GHz', channel: 149, rssi: -60, snr: 25, tx_rate_mbps: 400, rx_rate_mbps: 350, sgt: 100, auth_method: '802.1X PEAP', username: 'jlee@corp.com', connected_since: '2026-03-14T08:45:00Z', bytes_sent: 200_000_000, bytes_recv: 600_000_000 },
  { mac: 'DE:AD:BE:EF:00:07', hostname: 'LAPTOP-Admin', ip: '10.10.2.5', os: 'Windows', ap_id: 'ap-03', ap_name: 'AP-Floor2-Boardroom', ssid: 'AegisSecure-Mgmt', band: '5GHz', channel: 44, rssi: -35, snr: 45, tx_rate_mbps: 866, rx_rate_mbps: 866, sgt: 10, auth_method: '802.1X EAP-TLS', username: 'admin@corp.com', connected_since: '2026-03-14T07:00:00Z', bytes_sent: 50_000_000, bytes_recv: 150_000_000 },
  { mac: 'DE:AD:BE:EF:00:08', hostname: 'Scanner-WH1', ip: '10.10.3.50', os: 'Android', ap_id: 'ap-05', ap_name: 'AP-Warehouse-Mesh1', ssid: 'AegisSecure-IoT', band: '5GHz', channel: 52, rssi: -58, snr: 28, tx_rate_mbps: 300, rx_rate_mbps: 240, sgt: 200, auth_method: 'MAB', username: null, connected_since: '2026-03-14T06:00:00Z', bytes_sent: 30_000_000, bytes_recv: 80_000_000 },
];

const demoSecurityEvents: WirelessSecurityEvent[] = [
  { id: 'ws-01', timestamp: '2026-03-14T08:42:00Z', type: 'rogue_ap', severity: 'critical', source_mac: 'FF:FF:FF:AA:BB:01', channel: 6, details: 'Rogue AP detected broadcasting SSID "AegisSecure-Corp" on channel 6 near Building A Floor 1. Signal strength indicates <10m proximity.', action_taken: 'Rogue AP containment activated — deauth frames sent, alert raised to SOC', resolved: false },
  { id: 'ws-02', timestamp: '2026-03-14T07:15:00Z', type: 'deauth_attack', severity: 'high', source_mac: 'FF:FF:FF:AA:BB:02', channel: 36, details: 'Mass deauthentication flood detected on channel 36. 142 deauth frames in 10 seconds targeting AP-Floor1-Lobby.', action_taken: 'Management Frame Protection (802.11w) active — attack mitigated, source blocked', resolved: true },
  { id: 'ws-03', timestamp: '2026-03-14T03:22:00Z', type: 'evil_twin', severity: 'critical', source_mac: 'FF:FF:FF:AA:BB:03', channel: 149, details: 'Evil twin AP detected with matching BSSID spoofing AP-Floor1-OpenPlan. Attempting PMKID capture.', action_taken: 'Wireless IPS containment — channel hopping jamming, WIDS alert to network team', resolved: true },
  { id: 'ws-04', timestamp: '2026-03-14T01:00:00Z', type: 'client_flood', severity: 'medium', source_mac: 'FF:FF:FF:AA:BB:04', channel: 11, details: 'Abnormal probe request flood from single MAC on channel 11. 500+ probe requests/sec — possible reconnaissance.', action_taken: 'Client blacklisted for 24h, added to wireless threat list', resolved: true },
  { id: 'ws-05', timestamp: '2026-03-13T22:18:00Z', type: 'pmkid_capture', severity: 'high', source_mac: 'FF:FF:FF:AA:BB:05', channel: 44, details: 'PMKID capture attempt on AP-Floor2-Boardroom detected. Attack tool signature matches hcxdumptool.', action_taken: 'SAE transition mode enforced, WPA3-only mode activated on affected SSID', resolved: true },
];

/* ─── Helpers ────────────────────────────────────────────────── */

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
  return `${(b / 1073741824).toFixed(2)} GB`;
};

const rssiColor = (rssi: number) => {
  if (rssi > -45) return 'text-green-400';
  if (rssi > -60) return 'text-emerald-400';
  if (rssi > -70) return 'text-yellow-400';
  return 'text-red-400';
};

const apStatusColor: Record<APStatus, string> = {
  online: 'text-green-400 bg-green-900/30 border-green-700/40',
  offline: 'text-red-400 bg-red-900/30 border-red-700/40',
  upgrading: 'text-amber-400 bg-amber-900/30 border-amber-700/40',
};

const sevColor: Record<string, string> = {
  critical: 'text-red-400 bg-red-900/30 border-red-700/40',
  high: 'text-orange-400 bg-orange-900/30 border-orange-700/40',
  medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/40',
  low: 'text-blue-400 bg-blue-900/30 border-blue-700/40',
};

const eventTypeLabel: Record<string, string> = {
  rogue_ap: 'Rogue AP',
  deauth_attack: 'Deauth Attack',
  evil_twin: 'Evil Twin',
  wps_bruteforce: 'WPS Brute Force',
  pmkid_capture: 'PMKID Capture',
  client_flood: 'Client Flood',
};

const osIcon: Record<ClientOS, string> = {
  Windows: '🪟', macOS: '🍎', iOS: '📱', Android: '🤖', Linux: '🐧', ChromeOS: '💻',
};

/* ─── Component ──────────────────────────────────────────────── */
export default function WirelessManagementPage() {
  const [activeTab, setActiveTab] = useState<'aps' | 'clients' | 'security' | 'ssids'>('aps');
  const [expandedAP, setExpandedAP] = useState<string | null>('ap-01');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [clientSort, setClientSort] = useState<'rssi' | 'data' | 'time'>('rssi');

  const onlineAPs = demoAPs.filter(a => a.status === 'online').length;
  const totalClients = demoAPs.reduce((s, a) => s + a.connected_clients, 0);
  const unresolvedThreats = demoSecurityEvents.filter(e => !e.resolved).length;

  const filteredClients = clientFilter === 'all'
    ? demoClients
    : demoClients.filter(c => c.ssid === clientFilter);

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (clientSort === 'rssi') return b.rssi - a.rssi;
    if (clientSort === 'data') return (b.bytes_sent + b.bytes_recv) - (a.bytes_sent + a.bytes_recv);
    return new Date(a.connected_since).getTime() - new Date(b.connected_since).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wifi size={24} className="text-cyan-400" />
          <div>
            <h1 className="text-xl font-semibold">Wireless Management</h1>
            <p className="text-sm text-gray-500">AP fleet, wireless clients, SSID config &amp; wireless security</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-sm transition-colors overflow-x-auto">
          <RefreshCw size={14} /> Sync All
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Access Points', value: `${onlineAPs}/${demoAPs.length}`, sub: 'online', icon: Router, color: 'text-cyan-400' },
          { label: 'Wireless Clients', value: String(totalClients), sub: 'connected', icon: Users, color: 'text-blue-400' },
          { label: 'SSIDs Active', value: String(demoSSIDs.filter(s => s.enabled).length), sub: `of ${demoSSIDs.length}`, icon: Radio, color: 'text-purple-400' },
          { label: 'Security Threats', value: String(unresolvedThreats), sub: 'unresolved', icon: Shield, color: unresolvedThreats > 0 ? 'text-red-400' : 'text-green-400' },
          { label: 'Wi-Fi 6E APs', value: String(demoAPs.filter(a => a.channel_6 !== null).length), sub: '6 GHz capable', icon: Signal, color: 'text-emerald-400' },
        ].map(st => {
          const Icon = st.icon;
          return (
            <div key={st.label} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={st.color} />
                <span className="text-xs text-gray-500 uppercase tracking-wider">{st.label}</span>
              </div>
              <div className="text-2xl font-bold">{st.value}</div>
              <div className="text-[10px] text-gray-600 mt-0.5">{st.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
        {([
          { key: 'aps' as const, label: 'Access Points', icon: Router },
          { key: 'clients' as const, label: 'Wireless Clients', icon: Monitor },
          { key: 'ssids' as const, label: 'SSID Management', icon: Radio },
          { key: 'security' as const, label: 'Wireless Security', icon: Shield },
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

      {/* ── Access Points Tab ──────────────────────────────── */}
      {activeTab === 'aps' && (
        <div className="space-y-3">
          {demoAPs.map(ap => {
            const isExpanded = expandedAP === ap.id;
            return (
              <div key={ap.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedAP(isExpanded ? null : ap.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors text-left">
                  <span className={clsx('px-2 py-0.5 rounded border text-[10px] font-medium', apStatusColor[ap.status])}>
                    {ap.status.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{ap.name}</span>
                    <span className="text-xs text-gray-500">{ap.vendor} {ap.model} · {ap.location} · {ap.floor}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Users size={10} /> {ap.connected_clients}</span>
                    <span className="flex items-center gap-1"><Cpu size={10} /> {ap.cpu_pct}%</span>
                    {ap.mesh_peer && <span className="flex items-center gap-1 text-purple-400"><Layers size={10} /> Mesh</span>}
                  </div>
                  {isExpanded ? <ChevronDown size={14} className="text-gray-600" /> : <ChevronRight size={14} className="text-gray-600" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800/60 px-5 py-4 space-y-4">
                    {/* AP Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
                      {[
                        { k: 'IP Address', v: ap.ip },
                        { k: 'MAC', v: ap.mac },
                        { k: 'Serial', v: ap.serial },
                        { k: 'Firmware', v: ap.firmware },
                        { k: 'Channel 2.4G', v: `Ch ${ap.channel_24}` },
                        { k: 'Channel 5G', v: `Ch ${ap.channel_5}` },
                        { k: 'Channel 6G', v: ap.channel_6 !== null ? `Ch ${ap.channel_6}` : '—' },
                        { k: 'Uptime', v: ap.uptime_hours > 24 ? `${Math.floor(ap.uptime_hours / 24)}d ${ap.uptime_hours % 24}h` : `${ap.uptime_hours}h` },
                        { k: 'Tx Power 2.4G', v: `${ap.tx_power_24} dBm` },
                        { k: 'Tx Power 5G', v: `${ap.tx_power_5} dBm` },
                        { k: 'CPU', v: `${ap.cpu_pct}%` },
                        { k: 'Memory', v: `${ap.mem_pct}%` },
                      ].map(r => (
                        <div key={r.k}>
                          <div className="text-gray-600">{r.k}</div>
                          <div className="text-gray-300 font-mono">{r.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* SSIDs on this AP */}
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Broadcast SSIDs</div>
                      <div className="flex flex-wrap gap-2">
                        {ap.ssids.map(ssid => (
                          <div key={ssid.name} className="px-3 py-1.5 bg-gray-800/40 border border-gray-700/40 rounded-lg">
                            <div className="text-[11px] text-gray-200 font-medium flex items-center gap-1.5">
                              <Radio size={10} className="text-cyan-400" />
                              {ssid.name}
                            </div>
                            <div className="text-[9px] text-gray-500 mt-0.5">
                              {ssid.security} · SGT {ssid.sgt_id} · {ssid.band.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mesh info */}
                    {ap.mesh_peer && (
                      <div className="flex items-center gap-2 text-[11px] text-purple-400">
                        <Layers size={12} />
                        Mesh peer: {demoAPs.find(a => a.id === ap.mesh_peer)?.name ?? ap.mesh_peer}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-[11px] hover:bg-blue-600/30 transition-colors">
                        Reboot AP
                      </button>
                      <button className="px-3 py-1.5 bg-gray-800/50 text-gray-400 border border-gray-700/40 rounded-lg text-[11px] hover:bg-gray-800 transition-colors">
                        Blink LED
                      </button>
                      <button className="px-3 py-1.5 bg-gray-800/50 text-gray-400 border border-gray-700/40 rounded-lg text-[11px] hover:bg-gray-800 transition-colors">
                        Channel Scan
                      </button>
                      <button className="px-3 py-1.5 bg-gray-800/50 text-gray-400 border border-gray-700/40 rounded-lg text-[11px] hover:bg-gray-800 transition-colors">
                        Upgrade Firmware
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Wireless Clients Tab ──────────────────────────── */}
      {activeTab === 'clients' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">SSID:</span>
              {['all', ...demoSSIDs.map(s => s.name)].map(s => (
                <button key={s} onClick={() => setClientFilter(s)}
                  className={clsx('px-2 py-1 rounded-md text-[10px] transition-all border',
                    clientFilter === s ? 'bg-blue-600/20 text-blue-400 border-blue-500/40' : 'text-gray-500 border-transparent hover:text-gray-300')}>
                  {s === 'all' ? 'All' : s.replace('AegisSecure-', '')}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort:</span>
              {([['rssi', 'Signal'], ['data', 'Data'], ['time', 'Connected']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setClientSort(k)}
                  className={clsx('px-2 py-1 rounded-md text-[10px] transition-all border',
                    clientSort === k ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/40' : 'text-gray-500 border-transparent hover:text-gray-300')}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Client table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/50 text-gray-400 text-[10px] uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left">Device</th>
                  <th className="px-3 py-2.5 text-left">SSID / Band</th>
                  <th className="px-3 py-2.5 text-left">AP</th>
                  <th className="px-3 py-2.5 text-center">RSSI</th>
                  <th className="px-3 py-2.5 text-center">Rate</th>
                  <th className="px-3 py-2.5 text-center">Data</th>
                  <th className="px-3 py-2.5 text-left">Auth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {sortedClients.map(client => (
                  <tr key={client.mac} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{osIcon[client.os]}</span>
                        <div>
                          <div className="text-[11px] text-gray-200 font-medium">{client.hostname}</div>
                          <div className="text-[9px] text-gray-600 font-mono">{client.mac} · {client.ip}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[11px] text-gray-300">{client.ssid.replace('AegisSecure-', '')}</div>
                      <div className="text-[9px] text-gray-600">{client.band} Ch {client.channel} · SGT {client.sgt}</div>
                    </td>
                    <td className="px-3 py-2.5 text-[10px] text-gray-500">{client.ap_name.replace('AP-', '')}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={clsx('text-[11px] font-mono font-semibold', rssiColor(client.rssi))}>{client.rssi} dBm</span>
                      <div className="text-[9px] text-gray-600">SNR {client.snr}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-[10px] text-gray-400">
                      ↑{client.tx_rate_mbps} / ↓{client.rx_rate_mbps}
                    </td>
                    <td className="px-3 py-2.5 text-center text-[10px] text-gray-400">
                      ↑{formatBytes(client.bytes_sent)} / ↓{formatBytes(client.bytes_recv)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[10px] text-gray-300">{client.auth_method}</div>
                      {client.username && <div className="text-[9px] text-gray-600">{client.username}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SSID Management Tab ──────────────────────────── */}
      {activeTab === 'ssids' && (
        <div className="space-y-3">
          {demoSSIDs.map(ssid => (
            <div key={ssid.name} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Radio size={18} className={ssid.enabled ? 'text-cyan-400' : 'text-gray-600'} />
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2">
                      {ssid.name}
                      {!ssid.broadcast && <span className="px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded text-[9px]">Hidden</span>}
                    </div>
                    <div className="text-[10px] text-gray-500">{ssid.security} · SGT {ssid.sgt_id}</div>
                  </div>
                </div>
                <span className={clsx('px-2 py-0.5 rounded border text-[10px] font-medium',
                  ssid.enabled ? 'text-green-400 bg-green-900/30 border-green-700/40' : 'text-gray-500 bg-gray-800/30 border-gray-700/40')}>
                  {ssid.enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <div className="text-gray-600">Bands</div>
                  <div className="text-gray-300">{ssid.band.join(', ')}</div>
                </div>
                <div>
                  <div className="text-gray-600">Client Isolation</div>
                  <div className={ssid.client_isolation ? 'text-amber-400' : 'text-gray-500'}>{ssid.client_isolation ? 'Enabled' : 'Disabled'}</div>
                </div>
                <div>
                  <div className="text-gray-600">RADIUS Server</div>
                  <div className="text-gray-300 font-mono">{ssid.radius_server ?? 'None'}</div>
                </div>
                <div>
                  <div className="text-gray-600">Connected Clients</div>
                  <div className="text-gray-300">{demoClients.filter(c => c.ssid === ssid.name).length}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Wireless Security Tab ──────────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-3">
          {/* WIDS/WIPS Status */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Shield size={16} className="text-cyan-400" />
                Wireless IDS/IPS (WIDS/WIPS)
              </div>
              <span className="px-2 py-0.5 text-[10px] font-medium text-green-400 bg-green-900/30 border border-green-700/40 rounded">ACTIVE</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
              <div>
                <div className="text-gray-600">Rogue AP Detection</div>
                <div className="text-green-400">Enabled</div>
              </div>
              <div>
                <div className="text-gray-600">802.11w (PMF)</div>
                <div className="text-green-400">Required</div>
              </div>
              <div>
                <div className="text-gray-600">Auto-Containment</div>
                <div className="text-green-400">Active</div>
              </div>
              <div>
                <div className="text-gray-600">WPA3-SAE Transition</div>
                <div className="text-green-400">Enforced</div>
              </div>
            </div>
          </div>

          {/* Security Events */}
          {demoSecurityEvents.map(ev => {
            const isExpanded = expandedEvent === ev.id;
            return (
              <div key={ev.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedEvent(isExpanded ? null : ev.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors text-left">
                  <span className={clsx('px-2 py-0.5 rounded border text-[10px] font-medium', sevColor[ev.severity])}>
                    {ev.severity.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{eventTypeLabel[ev.type]}</span>
                    <span className="text-xs text-gray-500">Ch {ev.channel} · {ev.source_mac} · {new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {ev.resolved
                    ? <CheckCircle2 size={14} className="text-green-400" />
                    : <AlertTriangle size={14} className="text-red-400 animate-pulse" />}
                  {isExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-800/60 px-5 py-4 space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-gray-600">Details</span>
                      <p className="text-gray-300 mt-0.5">{ev.details}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-gray-600">Action Taken</span>
                      <p className="text-cyan-400 mt-0.5">{ev.action_taken}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-gray-700 text-center">
        Wireless Infrastructure Module · ApexAegis SSE · Meraki / Ubiquiti / UniFi compatible
      </p>
    </div>
  );
}
