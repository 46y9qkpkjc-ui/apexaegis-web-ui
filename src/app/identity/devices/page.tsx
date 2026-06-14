'use client';
import { useCallback, useEffect, useState } from 'react';
import { MonitorSmartphone, Search, Shield, ShieldAlert, ShieldCheck, Laptop, Smartphone, Tablet, Pencil, X, Plus, Eye, FileCheck, Bug, Key, HardDrive, CheckCircle, XCircle } from 'lucide-react';
import { apiUrl } from '@/lib/api-url';
import { useAuthStore } from '@/lib/auth-store';

/* ── Types ── */
interface Device {
  id: string;
  name: string;
  type: 'laptop' | 'mobile' | 'tablet';
  os: string;
  user: string;
  compliance: 'compliant' | 'non-compliant' | 'unknown';
  agentVersion: string;
  lastSeen: string;
  enrolled: boolean;
  encrypted: boolean;
  firewallOn: boolean;
  certValid: boolean;
  avProcess: string;
  avVersion: string;
  avRunning: boolean;
  postureProfile: string;
  registeredAt: string;
}

interface ApiDevice {
  id: string;
  device_id: string;
  device_name?: string;
  device_type?: string;
  os_type?: string;
  os_version?: string;
  client_version?: string;
  user_name?: string;
  user_email?: string;
  compliance_status?: string;
  status?: string;
  registered_via?: string;
  mtls_cert_not_after?: string;
  last_seen?: string;
  created_at?: string;
}

interface DeviceDetail {
  device: ApiDevice;
  posture?: { checked_at: string; compliant: boolean; score: number; disk_encrypted: boolean; firewall_enabled: boolean; antivirus_running: boolean; antivirus_name: string; os_version: string };
  logs: Array<{ logged_at: string; level: string; source: string; message: string }>;
}

interface PostureProfile {
  id: string;
  name: string;
  requireCert: boolean;
  requireEncryption: boolean;
  requireFirewall: boolean;
  requireAv: boolean;
  minAvVersion: string;
  minAgentVersion: string;
  maxOfflineDays: number;
  enabled: boolean;
  builtin: boolean;
}

interface ClientEvent {
  id: string;
  deviceName: string;
  user: string;
  event: 'registered' | 'compliance-pass' | 'compliance-fail' | 'deregistered' | 'cert-renewed' | 'agent-updated';
  detail: string;
  timestamp: string;
}

/* ── Demo Data ── */
const demoDevices: Device[] = [
  { id: '1', name: 'ALICE-MBP16', type: 'laptop', os: 'macOS 15.2', user: 'alice@acme.io', compliance: 'compliant', agentVersion: '3.4.1', lastSeen: '1 min ago', enrolled: true, encrypted: true, firewallOn: true, certValid: true, avProcess: 'CrowdStrike Falcon', avVersion: '7.18.0', avRunning: true, postureProfile: 'Standard-Posture', registeredAt: '2025-08-14' },
  { id: '2', name: 'BOB-THINKPAD', type: 'laptop', os: 'Windows 11', user: 'bob@acme.io', compliance: 'compliant', agentVersion: '3.4.1', lastSeen: '15 min ago', enrolled: true, encrypted: true, firewallOn: true, certValid: true, avProcess: 'Defender ATP', avVersion: '4.18.24070', avRunning: true, postureProfile: 'Standard-Posture', registeredAt: '2025-09-03' },
  { id: '3', name: 'CAROL-IPHONE', type: 'mobile', os: 'iOS 18.3', user: 'carol@acme.io', compliance: 'compliant', agentVersion: '3.4.0', lastSeen: '2 hrs ago', enrolled: true, encrypted: true, firewallOn: true, certValid: true, avProcess: 'N/A', avVersion: 'N/A', avRunning: false, postureProfile: 'Mobile-Posture', registeredAt: '2025-11-20' },
  { id: '4', name: 'DAVID-PIXEL', type: 'mobile', os: 'Android 15', user: 'david@acme.io', compliance: 'non-compliant', agentVersion: '3.2.0', lastSeen: '1 day ago', enrolled: true, encrypted: false, firewallOn: true, certValid: true, avProcess: 'N/A', avVersion: 'N/A', avRunning: false, postureProfile: 'Mobile-Posture', registeredAt: '2025-12-01' },
  { id: '5', name: 'EVE-SURFACE', type: 'tablet', os: 'Windows 11', user: 'eve@acme.io', compliance: 'unknown', agentVersion: '—', lastSeen: '14 days ago', enrolled: false, encrypted: false, firewallOn: false, certValid: false, avProcess: '—', avVersion: '—', avRunning: false, postureProfile: '—', registeredAt: '—' },
  { id: '6', name: 'FRANK-MBP14', type: 'laptop', os: 'macOS 15.1', user: 'frank@acme.io', compliance: 'non-compliant', agentVersion: '3.3.0', lastSeen: '3 days ago', enrolled: true, encrypted: true, firewallOn: false, certValid: true, avProcess: 'SentinelOne', avVersion: '23.3.2', avRunning: true, postureProfile: 'Strict-Posture', registeredAt: '2025-07-22' },
  { id: '7', name: 'GRACE-IPAD', type: 'tablet', os: 'iPadOS 18.3', user: 'grace@acme.io', compliance: 'compliant', agentVersion: '3.4.1', lastSeen: '30 min ago', enrolled: true, encrypted: true, firewallOn: true, certValid: true, avProcess: 'N/A', avVersion: 'N/A', avRunning: false, postureProfile: 'Mobile-Posture', registeredAt: '2026-01-05' },
];

const demoPostureProfiles: PostureProfile[] = [
  { id: 'p1', name: 'Standard-Posture', requireCert: true, requireEncryption: true, requireFirewall: true, requireAv: true, minAvVersion: '7.0.0', minAgentVersion: '3.4.0', maxOfflineDays: 7, enabled: true, builtin: true },
  { id: 'p2', name: 'Strict-Posture', requireCert: true, requireEncryption: true, requireFirewall: true, requireAv: true, minAvVersion: '7.15.0', minAgentVersion: '3.4.1', maxOfflineDays: 1, enabled: true, builtin: true },
  { id: 'p3', name: 'Mobile-Posture', requireCert: true, requireEncryption: true, requireFirewall: false, requireAv: false, minAvVersion: '', minAgentVersion: '3.3.0', maxOfflineDays: 14, enabled: true, builtin: true },
  { id: 'p4', name: 'BYOD-Relaxed', requireCert: false, requireEncryption: false, requireFirewall: false, requireAv: false, minAvVersion: '', minAgentVersion: '3.0.0', maxOfflineDays: 30, enabled: false, builtin: false },
];

const demoClientLog: ClientEvent[] = [
  { id: 'e1', deviceName: 'ALICE-MBP16', user: 'alice@acme.io', event: 'compliance-pass', detail: 'All posture checks passed (Standard-Posture)', timestamp: '2026-03-10 09:58:12' },
  { id: 'e2', deviceName: 'DAVID-PIXEL', user: 'david@acme.io', event: 'compliance-fail', detail: 'Disk encryption disabled — violates Mobile-Posture', timestamp: '2026-03-10 09:45:00' },
  { id: 'e3', deviceName: 'FRANK-MBP14', user: 'frank@acme.io', event: 'compliance-fail', detail: 'Firewall off, agent < 3.4.1 — violates Strict-Posture', timestamp: '2026-03-10 08:30:14' },
  { id: 'e4', deviceName: 'BOB-THINKPAD', user: 'bob@acme.io', event: 'agent-updated', detail: 'Agent upgraded 3.3.0 → 3.4.1', timestamp: '2026-03-09 17:22:01' },
  { id: 'e5', deviceName: 'GRACE-IPAD', user: 'grace@acme.io', event: 'registered', detail: 'New device enrolled with cert CN=grace-ipad.acme.io', timestamp: '2026-01-05 11:04:33' },
  { id: 'e6', deviceName: 'ALICE-MBP16', user: 'alice@acme.io', event: 'cert-renewed', detail: 'Device certificate renewed — expires 2027-03-10', timestamp: '2026-03-08 03:00:00' },
  { id: 'e7', deviceName: 'EVE-SURFACE', user: 'eve@acme.io', event: 'deregistered', detail: 'Device removed — inactive >14 days, no agent', timestamp: '2026-03-07 12:00:00' },
  { id: 'e8', deviceName: 'CAROL-IPHONE', user: 'carol@acme.io', event: 'compliance-pass', detail: 'All posture checks passed (Mobile-Posture)', timestamp: '2026-03-10 07:12:44' },
];

const complianceBadge: Record<string, { label: string; color: string; Icon: typeof ShieldCheck }> = {
  compliant: { label: 'Compliant', color: 'bg-green-900/40 text-green-400 border-green-800', Icon: ShieldCheck },
  'non-compliant': { label: 'Non-Compliant', color: 'bg-red-900/40 text-red-400 border-red-800', Icon: ShieldAlert },
  unknown: { label: 'Unknown', color: 'bg-gray-800 text-gray-500 border-gray-700', Icon: Shield },
};

const eventBadge: Record<string, { label: string; color: string }> = {
  registered: { label: 'Registered', color: 'bg-blue-900/40 text-blue-400 border-blue-800' },
  'compliance-pass': { label: 'Compliant', color: 'bg-green-900/40 text-green-400 border-green-800' },
  'compliance-fail': { label: 'Non-Compliant', color: 'bg-red-900/40 text-red-400 border-red-800' },
  deregistered: { label: 'Deregistered', color: 'bg-gray-800 text-gray-400 border-gray-700' },
  'cert-renewed': { label: 'Cert Renewed', color: 'bg-purple-900/40 text-purple-400 border-purple-800' },
  'agent-updated': { label: 'Agent Updated', color: 'bg-cyan-900/40 text-cyan-400 border-cyan-800' },
};

const typeIcon: Record<string, typeof Laptop> = { laptop: Laptop, mobile: Smartphone, tablet: Tablet };

function formatTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function normalizeCompliance(value?: string): Device['compliance'] {
  if (value === 'compliant') return 'compliant';
  if (value === 'non_compliant' || value === 'non-compliant') return 'non-compliant';
  return 'unknown';
}

function normalizeDeviceType(value?: string, os?: string): Device['type'] {
  if (value === 'mobile' || value === 'tablet' || value === 'laptop') return value;
  const normalizedOS = (os || '').toLowerCase();
  if (normalizedOS === 'ios' || normalizedOS === 'android') return 'mobile';
  return 'laptop';
}

function certIsValid(notAfter?: string): boolean {
  if (!notAfter) return false;
  const date = new Date(notAfter);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

function mapApiDevice(device: ApiDevice): Device {
  const os = [device.os_type, device.os_version].filter(Boolean).join(' ') || 'Unknown OS';
  return {
    id: device.id,
    name: device.device_name || device.device_id,
    type: normalizeDeviceType(device.device_type, device.os_type),
    os,
    user: device.user_email || device.user_name || device.device_id,
    compliance: normalizeCompliance(device.compliance_status),
    agentVersion: device.client_version || '—',
    lastSeen: formatTime(device.last_seen),
    enrolled: device.status === 'active',
    encrypted: false,
    firewallOn: false,
    certValid: certIsValid(device.mtls_cert_not_after),
    avProcess: '—',
    avVersion: '—',
    avRunning: false,
    postureProfile: 'Default',
    registeredAt: formatTime(device.created_at),
  };
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [postureProfiles, setPostureProfiles] = useState<PostureProfile[]>(demoPostureProfiles);
  const [tab, setTab] = useState<'devices' | 'posture' | 'log'>('devices');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'compliant' | 'non-compliant' | 'unknown'>('all');
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [editPosture, setEditPosture] = useState<PostureProfile | null>(null);
  const [viewPosture, setViewPosture] = useState<PostureProfile | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [deviceDetail, setDeviceDetail] = useState<DeviceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadDevices = useCallback(async () => {
    setLoadingDevices(true);
    setDeviceError(null);
    try {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(apiUrl('/api/v1/devices'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Device inventory rejected: HTTP ${res.status}`);
      const data = await res.json();
      setDevices((data.devices ?? []).map(mapApiDevice));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load registered devices';
      setDeviceError(message);
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const openDeviceDetail = async (device: Device) => {
    setLoadingDetail(true);
    setDeviceDetail({ device: { id: device.id, device_id: device.id, device_name: device.name }, logs: [] });
    try {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(apiUrl(`/api/v1/devices/${device.id}`), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(`Device detail rejected: HTTP ${res.status}`);
      setDeviceDetail(await res.json());
    } catch (error) {
      setDeviceError(error instanceof Error ? error.message : 'Unable to load device detail');
      setDeviceDetail(null);
    } finally { setLoadingDetail(false); }
  };

  const filtered = devices.filter(d => {
    const s = search.toLowerCase();
    const matchSearch = d.name.toLowerCase().includes(s) || d.user.toLowerCase().includes(s) || d.os.toLowerCase().includes(s) || d.id.toLowerCase().includes(s);
    const matchFilter = filter === 'all' || d.compliance === filter;
    return matchSearch && matchFilter;
  });

  const compliantCount = devices.filter(d => d.compliance === 'compliant').length;
  const nonCompliantCount = devices.filter(d => d.compliance === 'non-compliant').length;
  const enrolledCount = devices.filter(d => d.enrolled).length;

  const saveDevice = () => {
    if (!editDevice) return;
    setDevices(prev => prev.map(d => d.id === editDevice.id ? editDevice : d));
    setEditDevice(null);
  };

  const savePosture = () => {
    if (!editPosture) return;
    if (postureProfiles.find(p => p.id === editPosture.id)) {
      setPostureProfiles(prev => prev.map(p => p.id === editPosture.id ? editPosture : p));
    } else {
      setPostureProfiles(prev => [...prev, editPosture]);
    }
    setEditPosture(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MonitorSmartphone size={24} className="text-cyan-400" />
          <div>
            <h1 className="text-xl font-semibold">Devices</h1>
            <p className="text-sm text-gray-500">mTLS registered endpoints, compliance posture, and registered client log</p>
          </div>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm">
          Total: <span className="text-white font-medium">{devices.length}</span>
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-green-900/20 border border-green-800/30 text-sm text-green-400">
          <ShieldCheck size={14} className="inline mr-1" /> Compliant: {compliantCount}
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-800/30 text-sm text-red-400">
          <ShieldAlert size={14} className="inline mr-1" /> Non-Compliant: {nonCompliantCount}
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-blue-900/20 border border-blue-800/30 text-sm text-blue-400">
          Enrolled: {enrolledCount}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-800">
        {(['devices', 'posture', 'log'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setSearch(''); setFilter('all'); }}
            className={`pb-2 text-sm font-medium transition-colors capitalize ${tab === t ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
            {t === 'devices' ? 'Registered Devices' : t === 'posture' ? 'Device Posture Profiles' : 'Client Event Log'}
          </button>
        ))}
      </div>

      {/* ═══════ TAB: REGISTERED CLIENTS ═══════ */}
      {tab === 'devices' && (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by device name, authenticated user, device ID, or OS..."
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-600" />
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)}
              className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-600">
              <option value="all">All Status</option>
              <option value="compliant">Compliant</option>
              <option value="non-compliant">Non-Compliant</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          {deviceError && (
            <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-4 text-sm text-red-200">
              <div className="font-medium">Unable to load registered devices</div>
              <div className="mt-1 text-red-200/70">{deviceError}</div>
              <button onClick={loadDevices} className="mt-3 rounded-lg bg-red-900/40 px-3 py-1.5 text-xs hover:bg-red-800/50">Retry</button>
            </div>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">OS</th>
                  <th className="px-4 py-3">User / Device ID</th>
                  <th className="px-4 py-3">Compliance</th>
                  <th className="px-4 py-3">Posture Profile</th>
                  <th className="px-4 py-3">AV</th>
                  <th className="px-4 py-3">Cert</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Last Seen</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingDevices && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-500">Loading registered devices...</td>
                  </tr>
                )}
                {!loadingDevices && filtered.map(device => {
                  const DeviceIcon = typeIcon[device.type];
                  const badge = complianceBadge[device.compliance];
                  const BadgeIcon = badge.Icon;
                  return (
                    <tr key={device.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <DeviceIcon size={14} className="text-cyan-400" />
                          <span className="font-medium font-mono text-xs">{device.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{device.os}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{device.user}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${badge.color}`}>
                          <BadgeIcon size={10} /> {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-300">{device.postureProfile}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <span className={device.avRunning ? 'text-green-400' : 'text-gray-600'}>{device.avProcess}</span>
                          {device.avVersion !== 'N/A' && device.avVersion !== '—' && (
                            <div className="text-gray-500 text-[10px]">v{device.avVersion}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${device.certValid ? 'text-green-400' : 'text-red-400'}`}>
                          {device.certValid ? '✓ Valid' : '✗ Invalid'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono ${device.enrolled ? 'text-green-400' : 'text-gray-600'}`}>{device.agentVersion}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{device.registeredAt}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{device.lastSeen}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openDeviceDetail(device)} className="p-1 text-gray-500 hover:text-cyan-400 transition-colors" title="View scorecard"><Eye size={14} /></button>
                        <button onClick={() => setEditDevice({ ...device })} className="p-1 text-gray-500 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
                {!loadingDevices && filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-500">
                      No mTLS registered devices found. Devices will appear here after certificate-based registration.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════ TAB: DEVICE POSTURE PROFILES ═══════ */}
      {tab === 'posture' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setEditPosture({ id: `p${Date.now()}`, name: '', requireCert: true, requireEncryption: true, requireFirewall: true, requireAv: true, minAvVersion: '', minAgentVersion: '3.4.0', maxOfflineDays: 7, enabled: true, builtin: false })}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> New Posture Profile
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {postureProfiles.map(pp => (
              <div key={pp.id} className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${!pp.enabled ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileCheck size={18} className="text-cyan-400" />
                    <div>
                      <h3 className="font-semibold">{pp.name}</h3>
                      <span className={`text-xs ${pp.builtin ? 'text-gray-500' : 'text-green-400'}`}>{pp.builtin ? 'Built-in' : 'Custom'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPostureProfiles(prev => prev.map(p => p.id === pp.id ? { ...p, enabled: !p.enabled } : p))}
                      className={`w-8 h-4 rounded-full transition-colors relative ${pp.enabled ? 'bg-green-600' : 'bg-gray-700'}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${pp.enabled ? 'left-4' : 'left-0.5'}`} />
                    </button>
                    <button onClick={() => setViewPosture(pp)} className="p-1 text-gray-500 hover:text-blue-400 transition-colors"><Eye size={14} /></button>
                    <button onClick={() => setEditPosture({ ...pp })} className="p-1 text-gray-500 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <Check label="Device Cert" on={pp.requireCert} />
                  <Check label="Disk Encryption" on={pp.requireEncryption} />
                  <Check label="Firewall" on={pp.requireFirewall} />
                  <Check label="AV Process" on={pp.requireAv} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 text-sm">
                  <div className="p-2 bg-gray-800/30 rounded-lg">
                    <div className="text-[10px] text-gray-500 uppercase">Min AV Version</div>
                    <span className="text-xs text-gray-300 font-mono">{pp.minAvVersion || '—'}</span>
                  </div>
                  <div className="p-2 bg-gray-800/30 rounded-lg">
                    <div className="text-[10px] text-gray-500 uppercase">Min Agent Version</div>
                    <span className="text-xs text-gray-300 font-mono">{pp.minAgentVersion}</span>
                  </div>
                  <div className="p-2 bg-gray-800/30 rounded-lg">
                    <div className="text-[10px] text-gray-500 uppercase">Max Offline</div>
                    <span className="text-xs text-gray-300">{pp.maxOfflineDays} days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══════ TAB: CLIENT EVENT LOG ═══════ */}
      {tab === 'log' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {demoClientLog.map(ev => (
                <tr key={ev.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono whitespace-nowrap">{ev.timestamp}</td>
                  <td className="px-4 py-3 text-gray-300 font-mono text-xs">{ev.deviceName}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{ev.user}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${eventBadge[ev.event].color}`}>
                      {eventBadge[ev.event].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{ev.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════ MODAL: EDIT DEVICE ═══════ */}
      {deviceDetail && <>
        <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setDeviceDetail(null)} role="presentation" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] max-w-[94vw] max-h-[88vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
          <div className="flex items-center justify-between mb-5"><div><h3 className="text-lg font-semibold">{deviceDetail.device.device_name || deviceDetail.device.device_id}</h3><p className="text-xs text-gray-500">Device posture scorecard and client logs</p></div><button onClick={() => setDeviceDetail(null)}><X size={16} /></button></div>
          {loadingDetail ? <div className="py-10 text-center text-gray-500">Loading scorecard...</div> : <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <Score label="Posture Score" value={deviceDetail.posture ? `${deviceDetail.posture.score}/100` : 'Unknown'} ok={Boolean(deviceDetail.posture?.compliant)} />
              <Score label="Disk Encryption" value={deviceDetail.posture?.disk_encrypted ? 'Compliant' : 'Non-compliant'} ok={Boolean(deviceDetail.posture?.disk_encrypted)} />
              <Score label="Firewall" value={deviceDetail.posture?.firewall_enabled ? 'Compliant' : 'Non-compliant'} ok={Boolean(deviceDetail.posture?.firewall_enabled)} />
              <Score label="Antivirus" value={deviceDetail.posture?.antivirus_running ? deviceDetail.posture.antivirus_name || 'Running' : 'Non-compliant'} ok={Boolean(deviceDetail.posture?.antivirus_running)} />
            </div>
            <div className="text-xs text-gray-500 mb-2">Last posture check: {formatTime(deviceDetail.posture?.checked_at)}</div>
            <h4 className="text-sm font-semibold mb-2">Recent client logs</h4>
            <div className="border border-gray-800 rounded-lg max-h-72 overflow-auto"><table className="w-full text-xs"><thead className="sticky top-0 bg-gray-900"><tr className="text-left text-gray-500"><th className="p-2">Time</th><th className="p-2">Source</th><th className="p-2">Message</th></tr></thead><tbody>{deviceDetail.logs.map((log, index) => <tr key={`${log.logged_at}-${index}`} className="border-t border-gray-800"><td className="p-2 whitespace-nowrap text-gray-500">{formatTime(log.logged_at)}</td><td className="p-2 text-cyan-400">{log.source}</td><td className="p-2 font-mono text-gray-300 break-all">{log.message}</td></tr>)}{deviceDetail.logs.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-500">No client logs have been uploaded yet.</td></tr>}</tbody></table></div>
          </>}
        </div>
      </>}

      {editDevice && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditDevice(null)} role="presentation" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Pencil size={16} className="text-cyan-400" /> Edit Device</h3>
              <button onClick={() => setEditDevice(null)} className="p-1 text-gray-500 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <Field label="Device Name" value={editDevice.name} onChange={v => setEditDevice({ ...editDevice, name: v })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Compliance</label>
                  <select value={editDevice.compliance} onChange={e => setEditDevice({ ...editDevice, compliance: e.target.value as Device['compliance'] })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-600">
                    <option value="compliant">Compliant</option>
                    <option value="non-compliant">Non-Compliant</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Posture Profile</label>
                  <select value={editDevice.postureProfile} onChange={e => setEditDevice({ ...editDevice, postureProfile: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-600">
                    {postureProfiles.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="AV Process" value={editDevice.avProcess} onChange={v => setEditDevice({ ...editDevice, avProcess: v })} />
                <Field label="AV Version" value={editDevice.avVersion} onChange={v => setEditDevice({ ...editDevice, avVersion: v })} />
              </div>
              <div className="flex items-center gap-6 pt-2">
                <Toggle label="Enrolled" value={editDevice.enrolled} onChange={v => setEditDevice({ ...editDevice, enrolled: v })} />
                <Toggle label="Disk Encrypted" value={editDevice.encrypted} onChange={v => setEditDevice({ ...editDevice, encrypted: v })} />
                <Toggle label="Firewall" value={editDevice.firewallOn} onChange={v => setEditDevice({ ...editDevice, firewallOn: v })} />
                <Toggle label="Cert Valid" value={editDevice.certValid} onChange={v => setEditDevice({ ...editDevice, certValid: v })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditDevice(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={saveDevice} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Save Changes</button>
            </div>
          </div>
        </>
      )}

      {/* ═══════ MODAL: EDIT POSTURE PROFILE ═══════ */}
      {editPosture && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditPosture(null)} role="presentation" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold flex items-center gap-2"><FileCheck size={16} className="text-cyan-400" /> {postureProfiles.find(p => p.id === editPosture.id) ? 'Edit' : 'Create'} Posture Profile</h3>
              <button onClick={() => setEditPosture(null)} className="p-1 text-gray-500 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <Field label="Profile Name" value={editPosture.name} onChange={v => setEditPosture({ ...editPosture, name: v })} />
              <div className="flex items-center gap-6 flex-wrap pt-1">
                <Toggle label="Require Device Cert" value={editPosture.requireCert} onChange={v => setEditPosture({ ...editPosture, requireCert: v })} />
                <Toggle label="Require Encryption" value={editPosture.requireEncryption} onChange={v => setEditPosture({ ...editPosture, requireEncryption: v })} />
                <Toggle label="Require Firewall" value={editPosture.requireFirewall} onChange={v => setEditPosture({ ...editPosture, requireFirewall: v })} />
                <Toggle label="Require AV" value={editPosture.requireAv} onChange={v => setEditPosture({ ...editPosture, requireAv: v })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Min AV Version" value={editPosture.minAvVersion} onChange={v => setEditPosture({ ...editPosture, minAvVersion: v })} />
                <Field label="Min Agent Version" value={editPosture.minAgentVersion} onChange={v => setEditPosture({ ...editPosture, minAgentVersion: v })} />
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Offline Days</label>
                  <input type="number" value={editPosture.maxOfflineDays} onChange={e => setEditPosture({ ...editPosture, maxOfflineDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-600" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditPosture(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={savePosture} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
                {postureProfiles.find(p => p.id === editPosture.id) ? 'Save Changes' : 'Create Profile'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══════ MODAL: VIEW POSTURE PROFILE ═══════ */}
      {viewPosture && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setViewPosture(null)} role="presentation" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileCheck size={18} className="text-cyan-400" />{viewPosture.name}</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <ReqRow label="Device Certificate" on={viewPosture.requireCert} />
                <ReqRow label="Disk Encryption" on={viewPosture.requireEncryption} />
                <ReqRow label="Firewall" on={viewPosture.requireFirewall} />
                <ReqRow label="AV Process Running" on={viewPosture.requireAv} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs mt-2">
                <div className="p-2 bg-gray-800/40 rounded-lg"><span className="text-gray-500">Min AV:</span> <span className="text-gray-300 font-mono">{viewPosture.minAvVersion || '—'}</span></div>
                <div className="p-2 bg-gray-800/40 rounded-lg"><span className="text-gray-500">Min Agent:</span> <span className="text-gray-300 font-mono">{viewPosture.minAgentVersion}</span></div>
                <div className="p-2 bg-gray-800/40 rounded-lg"><span className="text-gray-500">Offline max:</span> <span className="text-gray-300">{viewPosture.maxOfflineDays}d</span></div>
              </div>
            </div>
            <button onClick={() => setViewPosture(null)} className="w-full mt-5 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Close</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Reusable helpers ── */
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-600" />
    </div>
  );
}

function Score({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return <div className={`rounded-lg border p-3 ${ok ? 'border-green-800 bg-green-900/20' : 'border-red-800 bg-red-900/20'}`}><div className="text-[10px] uppercase text-gray-500">{label}</div><div className={`mt-1 text-sm font-medium ${ok ? 'text-green-400' : 'text-red-400'}`}>{value}</div></div>;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button type="button" onClick={() => onChange(!value)}
        className={`w-8 h-4 rounded-full transition-colors relative ${value ? 'bg-green-600' : 'bg-gray-700'}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${value ? 'left-4' : 'left-0.5'}`} />
      </button>
      <span className="text-xs text-gray-400">{label}</span>
    </label>
  );
}

function Check({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="p-2 bg-gray-800/30 rounded-lg flex items-center gap-2">
      {on ? <CheckCircle size={12} className="text-green-400" /> : <XCircle size={12} className="text-gray-600" />}
      <span className={`text-xs ${on ? 'text-green-400' : 'text-gray-600'}`}>{label}</span>
    </div>
  );
}

function ReqRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded-lg">
      {on ? <CheckCircle size={12} className="text-green-400" /> : <XCircle size={12} className="text-gray-600" />}
      <span className={`text-xs ${on ? 'text-gray-300' : 'text-gray-600'}`}>{label}: {on ? 'Required' : 'Optional'}</span>
    </div>
  );
}
