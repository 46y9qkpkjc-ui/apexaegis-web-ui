'use client';
import { useState } from 'react';
import {
  Users, Shield, Clock, CheckCircle2, XCircle, Wifi,
  ChevronDown, ChevronRight, Globe, Smartphone, Mail,
  QrCode, RefreshCw, UserPlus, Eye,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ─────────────────────────────────────────────────── */

type GuestStatus = 'active' | 'expired' | 'revoked' | 'pending';
type ApprovalMethod = 'auto' | 'sponsor' | 'self';

interface GuestAccount {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  sponsor: string | null;
  approval: ApprovalMethod;
  status: GuestStatus;
  sgt: number;
  ssid: string;
  mac: string | null;
  ip: string | null;
  created_at: string;
  expires_at: string;
  bandwidth_limit_mbps: number;
  data_cap_gb: number | null;
  bytes_used: number;
  accepted_aup: boolean;
  device_os: string | null;
  portal_theme: string;
}

interface SelfRegSettings {
  enabled: boolean;
  require_email_verification: boolean;
  require_sms_verification: boolean;
  max_duration_hours: number;
  bandwidth_limit_mbps: number;
  data_cap_gb: number | null;
  allowed_domains: string[];
  blocked_domains: string[];
  require_aup: boolean;
  aup_text: string;
  auto_approve: boolean;
  sponsor_group: string;
  captive_portal_url: string;
  branding_logo_url: string;
  branding_color: string;
  sgt_id: number;
  ssid: string;
}

/* ─── Demo Data ─────────────────────────────────────────────── */

const demoGuests: GuestAccount[] = [
  { id: 'g-001', name: 'Alice Chen', email: 'alice@vendor-a.com', company: 'Vendor A Inc', phone: '+65-9123-4567', sponsor: 'jsmith@corp.com', approval: 'sponsor', status: 'active', sgt: 999, ssid: 'AegisSecure-Guest', mac: 'DE:AD:00:00:01:01', ip: '10.10.99.51', created_at: '2026-03-14T08:00:00Z', expires_at: '2026-03-14T17:00:00Z', bandwidth_limit_mbps: 50, data_cap_gb: 5, bytes_used: 1_200_000_000, accepted_aup: true, device_os: 'macOS', portal_theme: 'default' },
  { id: 'g-002', name: 'Bob Martinez', email: 'bob@partner-b.com', company: 'Partner B LLC', phone: '+1-555-987-6543', sponsor: 'mwilliams@corp.com', approval: 'sponsor', status: 'active', sgt: 999, ssid: 'AegisSecure-Guest', mac: 'DE:AD:00:00:01:02', ip: '10.10.99.52', created_at: '2026-03-14T09:00:00Z', expires_at: '2026-03-14T18:00:00Z', bandwidth_limit_mbps: 50, data_cap_gb: 5, bytes_used: 350_000_000, accepted_aup: true, device_os: 'Windows', portal_theme: 'default' },
  { id: 'g-003', name: 'Carol Tan', email: 'carol@contractor-c.com', company: 'Contractor C', phone: '+65-8765-4321', sponsor: null, approval: 'self', status: 'active', sgt: 999, ssid: 'AegisSecure-Guest', mac: 'DE:AD:00:00:01:03', ip: '10.10.99.53', created_at: '2026-03-14T10:30:00Z', expires_at: '2026-03-14T14:30:00Z', bandwidth_limit_mbps: 25, data_cap_gb: 2, bytes_used: 80_000_000, accepted_aup: true, device_os: 'iOS', portal_theme: 'default' },
  { id: 'g-004', name: 'David Kim', email: 'david@audit-firm.com', company: 'Audit & Co', phone: '+82-10-1234-5678', sponsor: 'admin@corp.com', approval: 'sponsor', status: 'pending', sgt: 999, ssid: 'AegisSecure-Guest', mac: null, ip: null, created_at: '2026-03-14T11:00:00Z', expires_at: '2026-03-14T20:00:00Z', bandwidth_limit_mbps: 50, data_cap_gb: 5, bytes_used: 0, accepted_aup: false, device_os: null, portal_theme: 'default' },
  { id: 'g-005', name: 'Eve Nakamura', email: 'eve@supplier-e.com', company: 'Supplier E', phone: '+81-90-1234-5678', sponsor: 'jsmith@corp.com', approval: 'sponsor', status: 'expired', sgt: 999, ssid: 'AegisSecure-Guest', mac: 'DE:AD:00:00:01:05', ip: null, created_at: '2026-03-13T08:00:00Z', expires_at: '2026-03-13T17:00:00Z', bandwidth_limit_mbps: 50, data_cap_gb: 5, bytes_used: 3_800_000_000, accepted_aup: true, device_os: 'Android', portal_theme: 'default' },
  { id: 'g-006', name: 'Frank Lee', email: 'frank@temp.io', company: 'Temp Agency', phone: '+65-9999-0000', sponsor: null, approval: 'self', status: 'revoked', sgt: 999, ssid: 'AegisSecure-Guest', mac: 'DE:AD:00:00:01:06', ip: null, created_at: '2026-03-14T07:00:00Z', expires_at: '2026-03-14T11:00:00Z', bandwidth_limit_mbps: 25, data_cap_gb: 2, bytes_used: 4_900_000_000, accepted_aup: true, device_os: 'Windows', portal_theme: 'default' },
];

const demoSelfRegSettings: SelfRegSettings = {
  enabled: true,
  require_email_verification: true,
  require_sms_verification: false,
  max_duration_hours: 8,
  bandwidth_limit_mbps: 25,
  data_cap_gb: 2,
  allowed_domains: [],
  blocked_domains: ['competitor.com', 'malicious.io'],
  require_aup: true,
  aup_text: 'By connecting, you agree to ApexAegis acceptable use policy. All traffic is inspected and logged. No torrenting, cryptocurrency mining, or access to restricted content. Maximum session: 8 hours.',
  auto_approve: true,
  sponsor_group: 'it-helpdesk@corp.com',
  captive_portal_url: 'https://guest.apexaegis.io/register',
  branding_logo_url: '/logo-dark.png',
  branding_color: '#3B82F6',
  sgt_id: 999,
  ssid: 'AegisSecure-Guest',
};

/* ─── Helpers ───────────────────────────────────────────────── */

const formatBytes = (b: number) => {
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
  return `${(b / 1073741824).toFixed(2)} GB`;
};

const statusConfig: Record<GuestStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'text-green-400 bg-green-900/30 border-green-700/40' },
  pending: { label: 'Pending', color: 'text-amber-400 bg-amber-900/30 border-amber-700/40' },
  expired: { label: 'Expired', color: 'text-gray-400 bg-gray-800 border-gray-700/40' },
  revoked: { label: 'Revoked', color: 'text-red-400 bg-red-900/30 border-red-700/40' },
};

/* ─── Component ─────────────────────────────────────────────── */
export default function GuestAccessPage() {
  const [activeTab, setActiveTab] = useState<'guests' | 'selfregister' | 'portal'>('guests');
  const [expandedGuest, setExpandedGuest] = useState<string | null>('g-001');
  const [statusFilter, setStatusFilter] = useState<GuestStatus | 'all'>('all');
  const [settings, setSettings] = useState<SelfRegSettings>(demoSelfRegSettings);

  const activeGuests = demoGuests.filter(g => g.status === 'active').length;
  const pendingApprovals = demoGuests.filter(g => g.status === 'pending').length;

  const filteredGuests = statusFilter === 'all'
    ? demoGuests
    : demoGuests.filter(g => g.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus size={24} className="text-amber-400" />
          <div>
            <h1 className="text-xl font-semibold">Guest Access &amp; Self-Registration</h1>
            <p className="text-sm text-gray-500">Sponsor-approved and self-service guest Wi-Fi access workflow</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
            <UserPlus size={14} /> Create Guest
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-sm transition-colors overflow-x-auto">
            <QrCode size={14} /> QR Code
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Guests', value: String(activeGuests), icon: Users, color: 'text-green-400' },
          { label: 'Pending Approval', value: String(pendingApprovals), icon: Clock, color: pendingApprovals > 0 ? 'text-amber-400' : 'text-gray-500' },
          { label: 'Self-Register', value: settings.enabled ? 'Enabled' : 'Disabled', icon: Smartphone, color: settings.enabled ? 'text-cyan-400' : 'text-gray-500' },
          { label: 'Guest SGT', value: String(settings.sgt_id), icon: Shield, color: 'text-purple-400' },
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
          { key: 'guests' as const, label: 'Guest Accounts', icon: Users },
          { key: 'selfregister' as const, label: 'Self-Registration Settings', icon: UserPlus },
          { key: 'portal' as const, label: 'Captive Portal Config', icon: Globe },
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

      {/* ── Guest Accounts ──────────────────────────────── */}
      {activeTab === 'guests' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {(['all', 'active', 'pending', 'expired', 'revoked'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={clsx('px-2.5 py-1 rounded-md text-xs transition-all border',
                  statusFilter === s ? 'bg-blue-600/20 text-blue-400 border-blue-500/40' : 'text-gray-500 border-transparent hover:text-gray-300')}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {filteredGuests.map(guest => {
            const isExpanded = expandedGuest === guest.id;
            const sc = statusConfig[guest.status];
            return (
              <div key={guest.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedGuest(isExpanded ? null : guest.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors text-left">
                  <span className={clsx('px-2 py-0.5 rounded border text-[10px] font-medium', sc.color)}>
                    {sc.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{guest.name}</span>
                    <span className="text-xs text-gray-500">{guest.company} · {guest.email}</span>
                  </div>
                  <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-medium border',
                    guest.approval === 'sponsor' ? 'text-blue-400 bg-blue-900/30 border-blue-700/40' : 'text-cyan-400 bg-cyan-900/30 border-cyan-700/40')}>
                    {guest.approval === 'sponsor' ? 'Sponsored' : 'Self-Reg'}
                  </span>
                  {isExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800/60 px-5 py-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
                      {[
                        { k: 'Phone', v: guest.phone },
                        { k: 'Sponsor', v: guest.sponsor ?? 'Self-registered' },
                        { k: 'SSID', v: guest.ssid },
                        { k: 'SGT', v: String(guest.sgt) },
                        { k: 'MAC', v: guest.mac ?? 'Not connected' },
                        { k: 'IP', v: guest.ip ?? '—' },
                        { k: 'Device', v: guest.device_os ?? '—' },
                        { k: 'AUP Accepted', v: guest.accepted_aup ? 'Yes' : 'No' },
                        { k: 'Bandwidth Limit', v: `${guest.bandwidth_limit_mbps} Mbps` },
                        { k: 'Data Cap', v: guest.data_cap_gb !== null ? `${guest.data_cap_gb} GB` : 'Unlimited' },
                        { k: 'Data Used', v: formatBytes(guest.bytes_used) },
                        { k: 'Expires', v: new Date(guest.expires_at).toLocaleString() },
                      ].map(r => (
                        <div key={r.k}>
                          <div className="text-gray-600">{r.k}</div>
                          <div className="text-gray-300">{r.v}</div>
                        </div>
                      ))}
                    </div>
                    {guest.status === 'active' && (
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] hover:bg-amber-600/30 transition-colors">
                          Extend Session
                        </button>
                        <button className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-[11px] hover:bg-red-600/30 transition-colors">
                          Revoke Access
                        </button>
                      </div>
                    )}
                    {guest.status === 'pending' && (
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-[11px] hover:bg-green-600/30 transition-colors">
                          <CheckCircle2 size={10} className="inline mr-1" /> Approve
                        </button>
                        <button className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-[11px] hover:bg-red-600/30 transition-colors">
                          <XCircle size={10} className="inline mr-1" /> Deny
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Self-Registration Settings ──────────────────── */}
      {activeTab === 'selfregister' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <UserPlus size={16} className="text-cyan-400" /> Self-Registration Configuration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Toggles */}
              {([
                { key: 'enabled' as const, label: 'Self-Registration', desc: 'Allow visitors to self-register on guest portal' },
                { key: 'require_email_verification' as const, label: 'Email Verification', desc: 'Send OTP to email before granting access' },
                { key: 'require_sms_verification' as const, label: 'SMS Verification', desc: 'Send OTP via SMS before granting access' },
                { key: 'auto_approve' as const, label: 'Auto-Approve', desc: 'Automatically approve without sponsor review' },
                { key: 'require_aup' as const, label: 'Require AUP', desc: 'Accept Acceptable Use Policy before access' },
              ] as const).map(toggle => (
                <div key={toggle.key} className="flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-lg">
                  <div>
                    <div className="text-[11px] text-gray-200 font-medium">{toggle.label}</div>
                    <div className="text-[9px] text-gray-500">{toggle.desc}</div>
                  </div>
                  <button onClick={() => setSettings(s => ({ ...s, [toggle.key]: !s[toggle.key] }))}>
                    <span className={clsx('text-[11px] font-semibold px-2 py-0.5 rounded',
                      settings[toggle.key] ? 'text-green-400 bg-green-900/30' : 'text-gray-500 bg-gray-800')}>
                      {settings[toggle.key] ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Max Duration (hours)</label>
                <input type="number" value={settings.max_duration_hours}
                  onChange={e => setSettings(s => ({ ...s, max_duration_hours: Number(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Bandwidth Limit (Mbps)</label>
                <input type="number" value={settings.bandwidth_limit_mbps}
                  onChange={e => setSettings(s => ({ ...s, bandwidth_limit_mbps: Number(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Data Cap (GB, 0=unlimited)</label>
                <input type="number" value={settings.data_cap_gb ?? 0}
                  onChange={e => { const v = Number(e.target.value); setSettings(s => ({ ...s, data_cap_gb: v > 0 ? v : null })); }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Blocked Email Domains (comma-separated)</label>
              <input type="text" value={settings.blocked_domains.join(', ')}
                onChange={e => setSettings(s => ({ ...s, blocked_domains: e.target.value.split(',').map(d => d.trim()).filter(Boolean) }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600" />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Sponsor Notification Group</label>
              <input type="text" value={settings.sponsor_group}
                onChange={e => setSettings(s => ({ ...s, sponsor_group: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600" />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Acceptable Use Policy Text</label>
              <textarea value={settings.aup_text} rows={3}
                onChange={e => setSettings(s => ({ ...s, aup_text: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600 resize-y" />
            </div>
          </div>
        </div>
      )}

      {/* ── Captive Portal Config ──────────────────────── */}
      {activeTab === 'portal' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Globe size={16} className="text-blue-400" /> Captive Portal Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Captive Portal URL</label>
                <input type="text" value={settings.captive_portal_url}
                  onChange={e => setSettings(s => ({ ...s, captive_portal_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600 font-mono" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Guest SSID</label>
                <input type="text" value={settings.ssid}
                  onChange={e => setSettings(s => ({ ...s, ssid: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Guest SGT</label>
                <input type="number" value={settings.sgt_id}
                  onChange={e => setSettings(s => ({ ...s, sgt_id: Number(e.target.value) || 999 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Branding Color</label>
                <div className="flex items-center gap-2">
                  <input type="text" value={settings.branding_color}
                    onChange={e => setSettings(s => ({ ...s, branding_color: e.target.value }))}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600 font-mono" />
                  <div className="w-9 h-9 rounded-lg border border-gray-700" style={{ backgroundColor: settings.branding_color }} />
                </div>
              </div>
            </div>

            {/* Portal preview */}
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Portal Preview</div>
              <div className="bg-gray-800/50 border border-gray-700/40 rounded-xl p-6 max-w-sm mx-auto text-center space-y-4">
                <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center font-bold text-lg shadow-lg"
                  style={{ backgroundColor: settings.branding_color }}>A</div>
                <div>
                  <div className="text-sm font-semibold">Welcome to ApexAegis Guest</div>
                  <div className="text-[10px] text-gray-500 mt-1">Connect to {settings.ssid}</div>
                </div>
                <div className="space-y-2 text-left">
                  <input placeholder="Full Name" disabled className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-xs text-gray-400" />
                  <input placeholder="Email" disabled className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-xs text-gray-400" />
                  <input placeholder="Company" disabled className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-xs text-gray-400" />
                </div>
                {settings.require_aup && (
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="w-3 h-3 rounded border border-gray-600" />
                    I accept the Acceptable Use Policy
                  </div>
                )}
                <button disabled className="w-full py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: settings.branding_color }}>
                  {settings.require_email_verification ? 'Verify & Connect' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-700 text-center">
        Guest Access Management · ApexAegis SSE · Captive portal, sponsor workflow &amp; self-registration
      </p>
    </div>
  );
}
