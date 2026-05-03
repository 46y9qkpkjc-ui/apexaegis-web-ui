'use client';
import { useState } from 'react';
import {
  CheckCircle2, Users,
  ChevronDown, ChevronRight, Wifi,
  Fingerprint, Lock, Trash2,
  Plus, Server, Shield, FileText, Settings,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────── */

interface AuthSession {
  id: string;
  mac_address: string;
  ip_address: string;
  username: string;
  eap_method: 'EAP-TLS' | 'PEAP' | 'MAB';
  switch_id: string;
  port_id: string;
  segment_group: string;
  sgt_tag: number;
  acl: string[];
  qos_policy: string;
  max_bandwidth_mbps: number;
  authenticated_at: string;
  last_reauth: string;
  status: 'active' | 'expired' | 'failed';
}

interface MACAuthEntry {
  mac_address: string;
  description: string;
  segment_group: string;
  sgt_tag: number;
  added_by: string;
  added_at: string;
}

interface Dot1XSwitchConfig {
  switch_id: string;
  hostname: string;
  auth_endpoint: string;
  reauth_period_seconds: number;
  max_auth_attempts: number;
  guest_sgt: number;
  auth_fail_sgt: number;
  enabled: boolean;
}

/* ─── Demo Data ──────────────────────────────────────────────── */

const demoSessions: AuthSession[] = [
  {
    id: 'sess-001', mac_address: 'AA:BB:CC:DD:EE:01', ip_address: '10.0.1.50',
    username: 'jsmith@corp.com', eap_method: 'EAP-TLS', switch_id: 'sg-leaf-01', port_id: 'Ethernet1',
    segment_group: 'Engineering', sgt_tag: 100, acl: ['permit tcp any 10.0.0.0/8', 'permit tcp any eq 443', 'deny ip any any'],
    qos_policy: 'gold', max_bandwidth_mbps: 1000,
    authenticated_at: '2026-03-15T08:30:00Z', last_reauth: '2026-03-15T10:30:00Z', status: 'active',
  },
  {
    id: 'sess-002', mac_address: 'AA:BB:CC:DD:EE:02', ip_address: '10.0.2.10',
    username: 'alee@corp.com', eap_method: 'PEAP', switch_id: 'sg-leaf-01', port_id: 'Ethernet2',
    segment_group: 'Marketing', sgt_tag: 300, acl: ['permit tcp any eq 443', 'permit tcp any eq 80', 'deny ip any any'],
    qos_policy: 'silver', max_bandwidth_mbps: 500,
    authenticated_at: '2026-03-15T09:00:00Z', last_reauth: '2026-03-15T11:00:00Z', status: 'active',
  },
  {
    id: 'sess-003', mac_address: 'AA:BB:CC:DD:EE:03', ip_address: '10.0.5.100',
    username: '', eap_method: 'MAB', switch_id: 'sg-leaf-01', port_id: 'Ethernet3',
    segment_group: 'IoT-Untrusted', sgt_tag: 500, acl: ['permit tcp any 10.0.5.0/24', 'deny ip any any'],
    qos_policy: 'best-effort', max_bandwidth_mbps: 100,
    authenticated_at: '2026-03-15T07:00:00Z', last_reauth: '2026-03-15T09:00:00Z', status: 'active',
  },
  {
    id: 'sess-004', mac_address: 'FF:AA:BB:CC:DD:99', ip_address: '10.0.9.50',
    username: 'contractor1@ext.com', eap_method: 'PEAP', switch_id: 'sg-leaf-01', port_id: 'Ethernet4',
    segment_group: 'Contractors', sgt_tag: 400, acl: ['permit tcp any eq 443', 'deny ip any any'],
    qos_policy: 'bronze', max_bandwidth_mbps: 200,
    authenticated_at: '2026-03-14T16:00:00Z', last_reauth: '2026-03-14T18:00:00Z', status: 'expired',
  },
];

const demoMABWhitelist: MACAuthEntry[] = [
  { mac_address: 'AA:BB:CC:DD:EE:03', description: 'IoT Sensor Floor 2', segment_group: 'IoT-Untrusted', sgt_tag: 500, added_by: 'admin@acme.com', added_at: '2026-01-15T10:00:00Z' },
  { mac_address: '11:22:33:44:55:66', description: 'Network Printer Lobby', segment_group: 'IoT-Untrusted', sgt_tag: 500, added_by: 'admin@acme.com', added_at: '2026-02-01T08:00:00Z' },
  { mac_address: 'CC:DD:EE:FF:00:11', description: 'Security Camera NVR', segment_group: 'IoT-Untrusted', sgt_tag: 500, added_by: 'secops@acme.com', added_at: '2026-02-20T14:00:00Z' },
];

const demoSwitchConfigs: Dot1XSwitchConfig[] = [
  { switch_id: 'sg-leaf-01', hostname: 'sg-leaf-01', auth_endpoint: 'https://mgmt.apexaegis.io:9443/api/v1/dot1x', reauth_period_seconds: 7200, max_auth_attempts: 3, guest_sgt: 999, auth_fail_sgt: 998, enabled: true },
  { switch_id: 'sg-spine-01', hostname: 'sg-spine-01', auth_endpoint: 'https://mgmt.apexaegis.io:9443/api/v1/dot1x', reauth_period_seconds: 7200, max_auth_attempts: 3, guest_sgt: 999, auth_fail_sgt: 998, enabled: false },
];

/* ─── Helpers ────────────────────────────────────────────────── */

const eapBadge: Record<string, string> = {
  'EAP-TLS': 'text-green-400 bg-green-900/30 border-green-700/40',
  'PEAP': 'text-blue-400 bg-blue-900/30 border-blue-700/40',
  'MAB': 'text-purple-400 bg-purple-900/30 border-purple-700/40',
};

const statusBadge: Record<string, string> = {
  active: 'text-green-400 bg-green-900/30 border-green-700/40',
  expired: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/40',
  failed: 'text-red-400 bg-red-900/30 border-red-700/40',
};

/* ═══════════════════════════════════════════════════════════════ */
/*  802.1X AUTHENTICATION SERVER PAGE                              */
/* ═══════════════════════════════════════════════════════════════ */

export default function Dot1XPage() {
  const [sessions] = useState<AuthSession[]>(demoSessions);
  const [mabWhitelist, setMABWhitelist] = useState<MACAuthEntry[]>(demoMABWhitelist);
  const [switchConfigs] = useState<Dot1XSwitchConfig[]>(demoSwitchConfigs);
  const [expandedSession, setExpandedSession] = useState<string | null>('sess-001');
  const [activeTab, setActiveTab] = useState<'sessions' | 'mab' | 'switches' | 'aaa'>('sessions');
  const [newMAB, setNewMAB] = useState({ mac: '', desc: '', group: 'IoT-Untrusted', sgt: '500' });

  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const eapTLS = sessions.filter(s => s.eap_method === 'EAP-TLS').length;
  const mabSessions = sessions.filter(s => s.eap_method === 'MAB').length;

  const removeMABEntry = (mac: string) => {
    setMABWhitelist(prev => prev.filter(e => e.mac_address !== mac));
  };

  const addMABEntry = () => {
    if (!newMAB.mac.trim()) return;
    setMABWhitelist(prev => [
      ...prev,
      {
        mac_address: newMAB.mac.trim(),
        description: newMAB.desc || newMAB.mac.trim(),
        segment_group: newMAB.group,
        sgt_tag: Number.parseInt(newMAB.sgt) || 500,
        added_by: 'admin@acme.com',
        added_at: new Date().toISOString(),
      },
    ]);
    setNewMAB({ mac: '', desc: '', group: 'IoT-Untrusted', sgt: '500' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Fingerprint size={24} className="text-blue-400" />
        <div>
          <h1 className="text-xl font-semibold">802.1X Authentication Server</h1>
          <p className="text-sm text-gray-500">
            HTTPS-based 802.1X replacing RADIUS — EAP-TLS, PEAP, and MAC Auth Bypass with SGT-based segmentation
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Sessions', value: sessions.length, icon: Users, color: 'text-blue-400' },
          { label: 'Active', value: activeSessions, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'EAP-TLS', value: eapTLS, icon: Lock, color: 'text-cyan-400' },
          { label: 'MAB Devices', value: mabSessions, icon: Wifi, color: 'text-purple-400' },
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
        {([
          { key: 'sessions' as const, label: `Sessions (${sessions.length})` },
          { key: 'mab' as const, label: `MAB Whitelist (${mabWhitelist.length})` },
          { key: 'switches' as const, label: `Switch Config (${switchConfigs.length})` },
          { key: 'aaa' as const, label: 'AAA Policies' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-gray-900 text-white border border-gray-800 border-b-0'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sessions tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-2">
          {sessions.map(sess => {
            const isExpanded = expandedSession === sess.id;
            return (
              <div key={sess.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSession(isExpanded ? null : sess.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-800/30 transition-colors text-left"
                >
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${statusBadge[sess.status]}`}>
                    {sess.status}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${eapBadge[sess.eap_method]}`}>
                    {sess.eap_method}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{sess.username || sess.mac_address}</span>
                    <span className="text-[10px] text-gray-500 ml-2">
                      {sess.switch_id}:{sess.port_id} · SGT-{sess.sgt_tag} ({sess.segment_group})
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">{sess.ip_address}</span>
                  {isExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800/60 px-5 py-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {[
                        { label: 'MAC Address', value: sess.mac_address },
                        { label: 'IP Address', value: sess.ip_address },
                        { label: 'QoS Policy', value: sess.qos_policy },
                        { label: 'Max Bandwidth', value: `${sess.max_bandwidth_mbps} Mbps` },
                        { label: 'Authenticated', value: new Date(sess.authenticated_at).toLocaleString() },
                      ].map(f => (
                        <div key={f.label} className="p-2 bg-gray-800/30 rounded-lg">
                          <div className="text-[9px] text-gray-600 uppercase">{f.label}</div>
                          <div className="text-xs text-white/70 mt-0.5 truncate">{f.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* ACLs */}
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Applied ACL</div>
                      <div className="space-y-1">
                        {sess.acl.map(rule => (
                          <div key={rule} className="px-3 py-1.5 bg-gray-800/20 rounded-lg text-xs font-mono text-gray-400 border border-gray-800/40">
                            {rule}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MAB Whitelist tab */}
      {activeTab === 'mab' && (
        <div className="space-y-4">
          {/* Add MAB entry */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Plus size={14} className="text-blue-400" /> Add MAC Auth Bypass Entry
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <input
                value={newMAB.mac}
                onChange={e => setNewMAB(p => ({ ...p, mac: e.target.value }))}
                placeholder="MAC Address (AA:BB:CC:DD:EE:FF)"
                className="px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-blue-500/60"
              />
              <input
                value={newMAB.desc}
                onChange={e => setNewMAB(p => ({ ...p, desc: e.target.value }))}
                placeholder="Description"
                className="px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-blue-500/60"
              />
              <select
                value={newMAB.group}
                onChange={e => setNewMAB(p => ({ ...p, group: e.target.value }))}
                className="px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-blue-500/60"
              >
                <option value="IoT-Untrusted">IoT-Untrusted</option>
                <option value="Printers">Printers</option>
                <option value="Security-Cameras">Security-Cameras</option>
                <option value="Guest">Guest</option>
              </select>
              <div className="flex gap-2">
                <input
                  value={newMAB.sgt}
                  onChange={e => setNewMAB(p => ({ ...p, sgt: e.target.value }))}
                  placeholder="SGT Tag"
                  className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-blue-500/60"
                />
                <button
                  onClick={addMABEntry}
                  disabled={!newMAB.mac.trim()}
                  className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-lg text-sm transition-colors disabled:opacity-40"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* MAB table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-[10px] text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">MAC Address</th>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-left px-4 py-3">Segment Group</th>
                  <th className="text-left px-4 py-3">SGT Tag</th>
                  <th className="text-left px-4 py-3">Added By</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {mabWhitelist.map(entry => (
                  <tr key={entry.mac_address} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-gray-300">{entry.mac_address}</td>
                    <td className="px-4 py-2.5 text-gray-400">{entry.description}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 text-[10px] bg-purple-900/30 text-purple-400 rounded border border-purple-700/40">
                        {entry.segment_group}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-cyan-400">SGT-{entry.sgt_tag}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{entry.added_by}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => removeMABEntry(entry.mac_address)}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Switch Config tab */}
      {activeTab === 'switches' && (
        <div className="space-y-3">
          {switchConfigs.map(sc => (
            <div key={sc.switch_id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server size={14} className="text-blue-400" />
                  <span className="text-sm font-semibold">{sc.hostname}</span>
                  {sc.enabled
                    ? <span className="px-2 py-0.5 text-[9px] font-bold text-green-400 bg-green-900/30 rounded border border-green-700/40">ENABLED</span>
                    : <span className="px-2 py-0.5 text-[9px] font-bold text-gray-500 bg-gray-800 rounded border border-gray-700/40">DISABLED</span>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Auth Endpoint', value: sc.auth_endpoint },
                  { label: 'Reauth Period', value: `${sc.reauth_period_seconds}s (${Math.floor(sc.reauth_period_seconds / 3600)}h)` },
                  { label: 'Guest SGT', value: `SGT ${sc.guest_sgt}` },
                  { label: 'Auth Fail SGT', value: `SGT ${sc.auth_fail_sgt}` },
                ].map(f => (
                  <div key={f.label} className="p-2 bg-gray-800/30 rounded-lg">
                    <div className="text-[9px] text-gray-600 uppercase">{f.label}</div>
                    <div className="text-xs text-white/70 mt-0.5 truncate" title={f.value}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AAA Policies tab */}
      {activeTab === 'aaa' && (
        <div className="space-y-4">
          {/* Authentication Policies */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={16} className="text-cyan-400" />
              <h3 className="text-sm font-semibold">Authentication Policies</h3>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Corporate EAP-TLS', eap: 'EAP-TLS', priority: 1, cert_required: true, cert_ca: 'ApexAegis Internal CA', mfa: true, posture_check: true, sgt: 100, segment: 'Engineering', status: 'active' },
                { name: 'Standard PEAP', eap: 'PEAP-MSCHAPv2', priority: 2, cert_required: false, cert_ca: '—', mfa: false, posture_check: true, sgt: 300, segment: 'Standard-Users', status: 'active' },
                { name: 'Guest Portal Auth', eap: 'None (Captive Portal)', priority: 3, cert_required: false, cert_ca: '—', mfa: false, posture_check: false, sgt: 999, segment: 'Guest', status: 'active' },
                { name: 'MAB Fallback', eap: 'MAC Auth Bypass', priority: 4, cert_required: false, cert_ca: '—', mfa: false, posture_check: false, sgt: 500, segment: 'IoT-Untrusted', status: 'active' },
              ].map(pol => (
                <div key={pol.name} className="p-3 bg-gray-800/30 border border-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-200">{pol.name}</span>
                      <span className="px-1.5 py-0.5 text-[9px] font-medium text-green-400 bg-green-900/30 rounded border border-green-700/40">
                        ACTIVE
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500">Priority: {pol.priority}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
                    <div><span className="text-gray-600">EAP Method</span><div className="text-gray-300">{pol.eap}</div></div>
                    <div><span className="text-gray-600">Certificate Required</span><div className={pol.cert_required ? 'text-cyan-400' : 'text-gray-500'}>{pol.cert_required ? `Yes (${pol.cert_ca})` : 'No'}</div></div>
                    <div><span className="text-gray-600">MFA</span><div className={pol.mfa ? 'text-green-400' : 'text-gray-500'}>{pol.mfa ? 'Enabled' : 'Disabled'}</div></div>
                    <div><span className="text-gray-600">Posture Check</span><div className={pol.posture_check ? 'text-amber-400' : 'text-gray-500'}>{pol.posture_check ? 'Required' : 'Skipped'}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Authorization Policies — Dynamic SGT Assignment */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-purple-400" />
              <h3 className="text-sm font-semibold">Authorization Policies — Dynamic SGT Assignment</h3>
            </div>
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/40 text-[10px] text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-2.5">Rule Name</th>
                    <th className="text-left px-3 py-2.5">Match Condition</th>
                    <th className="text-center px-3 py-2.5">SGT Assignment</th>
                    <th className="text-left px-3 py-2.5">ACL Template</th>
                    <th className="text-center px-3 py-2.5">QoS</th>
                    <th className="text-center px-3 py-2.5">Max BW</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {[
                    { rule: 'Engineering Staff', condition: 'Group = Engineering AND EAP-TLS', sgt: 100, segment: 'Engineering', acl: 'permit tcp any 10.0.0.0/8; permit tcp any eq 443; deny ip any any', qos: 'Gold', bw: '1 Gbps' },
                    { rule: 'Corporate SaaS', condition: 'Group = Corporate AND Posture = Compliant', sgt: 200, segment: 'Corporate-SaaS', acl: 'permit tcp any eq 443; permit tcp any eq 80; deny ip any any', qos: 'Silver', bw: '500 Mbps' },
                    { rule: 'Marketing Users', condition: 'Group = Marketing', sgt: 300, segment: 'Marketing', acl: 'permit tcp any eq 443; deny ip any any', qos: 'Silver', bw: '500 Mbps' },
                    { rule: 'Contractors', condition: 'Group = Contractors AND Sponsor != null', sgt: 400, segment: 'Contractors', acl: 'permit tcp any eq 443; deny ip any any', qos: 'Bronze', bw: '200 Mbps' },
                    { rule: 'IoT Devices (MAB)', condition: 'Auth = MAB AND MAC in Whitelist', sgt: 500, segment: 'IoT-Untrusted', acl: 'permit tcp any 10.0.5.0/24; deny ip any any', qos: 'Best-Effort', bw: '100 Mbps' },
                    { rule: 'Non-Compliant Quarantine', condition: 'Posture = Non-Compliant', sgt: 900, segment: 'Quarantine', acl: 'permit tcp any host remediation-srv eq 443; deny ip any any', qos: 'Best-Effort', bw: '50 Mbps' },
                    { rule: 'Guest Fallback', condition: 'Auth = Guest Portal', sgt: 999, segment: 'Guest', acl: 'permit tcp any eq 443; permit tcp any eq 53; deny ip any any', qos: 'Best-Effort', bw: '25 Mbps' },
                  ].map(r => (
                    <tr key={r.rule} className="hover:bg-gray-800/20 transition-colors">
                      <td className="px-4 py-2.5 text-gray-200 text-xs font-medium">{r.rule}</td>
                      <td className="px-3 py-2.5 text-[10px] text-gray-400 font-mono">{r.condition}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-cyan-400 font-mono text-xs">SGT-{r.sgt}</span>
                        <div className="text-[9px] text-gray-600">{r.segment}</div>
                      </td>
                      <td className="px-3 py-2.5 text-[9px] text-gray-500 font-mono max-w-[200px] truncate" title={r.acl}>{r.acl}</td>
                      <td className="px-3 py-2.5 text-center text-[10px] text-gray-400">{r.qos}</td>
                      <td className="px-3 py-2.5 text-center text-[10px] text-gray-400">{r.bw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Accounting Policies */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold">Accounting Policies</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/30 border border-gray-700/30 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Settings size={12} className="text-gray-500" /> Session Accounting
                </h4>
                <div className="space-y-2 text-[11px]">
                  {[
                    { k: 'Accounting Mode', v: 'Start-Stop' },
                    { k: 'Interim Updates', v: 'Every 300s' },
                    { k: 'Session Timeout', v: '28800s (8h)' },
                    { k: 'Idle Timeout', v: '1800s (30min)' },
                    { k: 'Log Destination', v: 'SIEM + Local DB' },
                    { k: 'Data Retention', v: '90 days' },
                  ].map(r => (
                    <div key={r.k} className="flex justify-between py-1 border-b border-gray-800/40">
                      <span className="text-gray-500">{r.k}</span>
                      <span className="text-gray-300 font-mono">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-gray-800/30 border border-gray-700/30 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <FileText size={12} className="text-gray-500" /> Recorded Attributes
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Session-ID', 'Username', 'MAC-Address', 'NAS-IP', 'NAS-Port',
                    'SGT-Tag', 'Segment-Group', 'EAP-Method', 'Auth-Timestamp',
                    'Session-Duration', 'Bytes-In', 'Bytes-Out', 'Packets-In', 'Packets-Out',
                    'Terminate-Cause', 'Posture-Status', 'QoS-Policy', 'ACL-Applied',
                  ].map(attr => (
                    <span key={attr} className="px-2 py-0.5 bg-gray-800/60 text-gray-400 rounded text-[9px] font-mono border border-gray-700/30">
                      {attr}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
