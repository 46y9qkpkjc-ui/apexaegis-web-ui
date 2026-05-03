'use client';
import { useState } from 'react';
import {
  Fingerprint, Plus, Trash2, X, Smartphone, Monitor, Tablet,
  Shield, Clock, CheckCircle, XCircle, Key, RefreshCw, Search,
  AlertTriangle, Lock, Eye, Download, UserCheck,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
interface PasskeyCredential {
  id: string;
  label: string;
  user: string;
  email: string;
  rpId: string;
  deviceType: 'security-key' | 'platform' | 'phone' | 'tablet';
  aaguid: string;
  authenticatorModel: string;
  transports: string[];
  createdAt: string;
  lastUsed: string;
  signCount: number;
  backed_up: boolean;
  uvInitialized: boolean;
  status: 'active' | 'revoked' | 'expired';
  attestation: 'direct' | 'indirect' | 'none';
  residentKey: boolean;
}

interface PasskeyPolicy {
  id: string;
  name: string;
  enforcePasskeyOnly: boolean;
  allowPlatformAuth: boolean;
  allowCrossPlatform: boolean;
  allowSecurityKeys: boolean;
  requireUserVerification: boolean;
  requireResidentKey: boolean;
  attestationPreference: 'direct' | 'indirect' | 'none';
  allowedAAGUIDs: string[];
  maxCredentialsPerUser: number;
  registrationTimeout: number;
  authTimeout: number;
}

/* ─── Demo data ─────────────────────────────────────────────── */
const demoCredentials: PasskeyCredential[] = [
  {
    id: 'pk-1', label: 'MacBook Pro Touch ID', user: 'Alice Chen', email: 'alice@acme.com',
    rpId: 'acme.apexaegis.io', deviceType: 'platform', aaguid: 'adce0002-35bc-c60a-648b-0b25f1f05503',
    authenticatorModel: 'Apple Touch ID (macOS)', transports: ['internal'],
    createdAt: '2026-01-15 09:00', lastUsed: '2026-03-14 08:42', signCount: 347,
    backed_up: true, uvInitialized: true, status: 'active', attestation: 'direct', residentKey: true,
  },
  {
    id: 'pk-2', label: 'YubiKey 5 NFC', user: 'Alice Chen', email: 'alice@acme.com',
    rpId: 'acme.apexaegis.io', deviceType: 'security-key', aaguid: 'cb69481e-8ff7-4039-93ec-0a2729a154a8',
    authenticatorModel: 'Yubico YubiKey 5 NFC', transports: ['usb', 'nfc'],
    createdAt: '2025-11-20 14:30', lastUsed: '2026-03-12 16:10', signCount: 112,
    backed_up: false, uvInitialized: true, status: 'active', attestation: 'direct', residentKey: true,
  },
  {
    id: 'pk-3', label: 'iPhone 15 Pro', user: 'Bob Martinez', email: 'bob@acme.com',
    rpId: 'acme.apexaegis.io', deviceType: 'phone', aaguid: 'fbfc3007-154e-4ecc-8c0b-6e020557d7bd',
    authenticatorModel: 'Apple iCloud Keychain', transports: ['hybrid', 'internal'],
    createdAt: '2026-02-01 11:15', lastUsed: '2026-03-14 07:55', signCount: 203,
    backed_up: true, uvInitialized: true, status: 'active', attestation: 'indirect', residentKey: true,
  },
  {
    id: 'pk-4', label: 'Windows Hello', user: 'Carol Zhang', email: 'carol@acme.com',
    rpId: 'acme.apexaegis.io', deviceType: 'platform', aaguid: '08987058-cadc-4b81-b6e1-30de50dcbe96',
    authenticatorModel: 'Microsoft Windows Hello', transports: ['internal'],
    createdAt: '2026-01-28 10:00', lastUsed: '2026-03-13 17:30', signCount: 189,
    backed_up: false, uvInitialized: true, status: 'active', attestation: 'direct', residentKey: true,
  },
  {
    id: 'pk-5', label: 'Samsung Galaxy S24', user: 'Dave Patel', email: 'dave@acme.com',
    rpId: 'acme.apexaegis.io', deviceType: 'phone', aaguid: 'b93fd961-f2e6-462f-b122-82002247de78',
    authenticatorModel: 'Samsung Pass', transports: ['hybrid', 'internal'],
    createdAt: '2026-02-14 15:45', lastUsed: '2026-03-10 11:20', signCount: 87,
    backed_up: true, uvInitialized: true, status: 'active', attestation: 'none', residentKey: true,
  },
  {
    id: 'pk-6', label: 'Legacy FIDO U2F Key', user: 'Eve Kim', email: 'eve@acme.com',
    rpId: 'acme.apexaegis.io', deviceType: 'security-key', aaguid: '00000000-0000-0000-0000-000000000000',
    authenticatorModel: 'Unknown FIDO U2F Device', transports: ['usb'],
    createdAt: '2024-06-10 09:30', lastUsed: '2025-12-01 14:00', signCount: 42,
    backed_up: false, uvInitialized: false, status: 'expired', attestation: 'none', residentKey: false,
  },
  {
    id: 'pk-7', label: 'iPad Pro (Revoked)', user: 'Frank Liu', email: 'frank@acme.com',
    rpId: 'acme.apexaegis.io', deviceType: 'tablet', aaguid: 'adce0002-35bc-c60a-648b-0b25f1f05503',
    authenticatorModel: 'Apple Touch ID (iPadOS)', transports: ['internal'],
    createdAt: '2025-09-01 08:00', lastUsed: '2026-01-15 09:45', signCount: 156,
    backed_up: true, uvInitialized: true, status: 'revoked', attestation: 'direct', residentKey: true,
  },
];

const defaultPolicy: PasskeyPolicy = {
  id: 'pol-1', name: 'Organization Default',
  enforcePasskeyOnly: false, allowPlatformAuth: true, allowCrossPlatform: true,
  allowSecurityKeys: true, requireUserVerification: true, requireResidentKey: true,
  attestationPreference: 'direct', allowedAAGUIDs: [],
  maxCredentialsPerUser: 5, registrationTimeout: 120000, authTimeout: 60000,
};

/* ─── Helpers ───────────────────────────────────────────────── */
const deviceIcon = (t: string) => {
  switch (t) {
    case 'security-key': return <Key size={16} className="text-amber-400" />;
    case 'platform': return <Monitor size={16} className="text-blue-400" />;
    case 'phone': return <Smartphone size={16} className="text-green-400" />;
    case 'tablet': return <Tablet size={16} className="text-purple-400" />;
    default: return <Fingerprint size={16} className="text-gray-400" />;
  }
};

const statusColors: Record<string, string> = {
  active: 'bg-green-900/40 text-green-400 border-green-800',
  revoked: 'bg-red-900/40 text-red-400 border-red-800',
  expired: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
};

export default function PasskeyManagerPage() {
  const [credentials, setCredentials] = useState(demoCredentials);
  const [policy, setPolicy] = useState(defaultPolicy);
  const [activeTab, setActiveTab] = useState<'credentials' | 'policy' | 'audit'>('credentials');
  const [search, setSearch] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerLabel, setRegisterLabel] = useState('');
  const [registerUser, setRegisterUser] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPolicyEdit, setShowPolicyEdit] = useState(false);

  const filtered = credentials.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.label.toLowerCase().includes(q) || c.user.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) || c.authenticatorModel.toLowerCase().includes(q);
  });

  const activeCount = credentials.filter(c => c.status === 'active').length;
  const revokedCount = credentials.filter(c => c.status === 'revoked').length;
  const uniqueUsers = new Set(credentials.map(c => c.email)).size;

  const handleRevoke = (id: string) => {
    setCredentials(prev => prev.map(c => c.id === id ? { ...c, status: 'revoked' as const } : c));
  };

  const handleDelete = (id: string) => {
    setCredentials(prev => prev.filter(c => c.id !== id));
  };

  const handleRegister = () => {
    if (!registerLabel || !registerUser) return;
    const newCred: PasskeyCredential = {
      id: `pk-${Date.now()}`, label: registerLabel, user: registerUser,
      email: `${registerUser.toLowerCase().replace(/\s/g, '.')}@acme.com`,
      rpId: 'acme.apexaegis.io', deviceType: 'platform',
      aaguid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      authenticatorModel: 'Browser Platform Authenticator',
      transports: ['internal'], createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      lastUsed: 'Never', signCount: 0, backed_up: false, uvInitialized: true,
      status: 'active', attestation: policy.attestationPreference, residentKey: policy.requireResidentKey,
    };
    setCredentials(prev => [newCred, ...prev]);
    setShowRegister(false);
    setRegisterLabel('');
    setRegisterUser('');
  };

  const selected = selectedId ? credentials.find(c => c.id === selectedId) : null;

  /* ─── Audit log (mock) ─────────────────────────────────── */
  const auditLogs = [
    { time: '2026-03-14 08:42:12', user: 'alice@acme.com', event: 'Authentication Success', credential: 'MacBook Pro Touch ID', ip: '10.0.1.42' },
    { time: '2026-03-14 07:55:03', user: 'bob@acme.com', event: 'Authentication Success', credential: 'iPhone 15 Pro', ip: '192.168.1.15' },
    { time: '2026-03-13 17:30:45', user: 'carol@acme.com', event: 'Authentication Success', credential: 'Windows Hello', ip: '10.0.2.18' },
    { time: '2026-03-13 16:10:22', user: 'alice@acme.com', event: 'Authentication Success', credential: 'YubiKey 5 NFC', ip: '10.0.1.42' },
    { time: '2026-03-13 14:20:10', user: 'frank@acme.com', event: 'Credential Revoked', credential: 'iPad Pro (Revoked)', ip: 'Admin Console' },
    { time: '2026-03-12 09:15:33', user: 'eve@acme.com', event: 'Authentication Failed — Expired Key', credential: 'Legacy FIDO U2F Key', ip: '10.0.3.7' },
    { time: '2026-03-11 11:00:00', user: 'admin@acme.com', event: 'Policy Updated — attestation changed to direct', credential: '—', ip: 'Admin Console' },
    { time: '2026-03-10 11:20:55', user: 'dave@acme.com', event: 'Authentication Success', credential: 'Samsung Galaxy S24', ip: '172.16.0.88' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Fingerprint size={24} className="text-indigo-400" />
          <div>
            <h1 className="text-xl font-semibold">Passkey Manager</h1>
            <p className="text-sm text-gray-500">WebAuthn / FIDO2 credential lifecycle — register, manage, audit, and enforce passkey policies</p>
          </div>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Register Passkey
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Credentials', value: credentials.length, icon: Key, color: 'text-indigo-400' },
          { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Revoked', value: revokedCount, icon: XCircle, color: 'text-red-400' },
          { label: 'Unique Users', value: uniqueUsers, icon: UserCheck, color: 'text-blue-400' },
          { label: 'Avg Sign Count', value: Math.round(credentials.reduce((s, c) => s + c.signCount, 0) / credentials.length), icon: Shield, color: 'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <k.icon size={14} className={k.color} />
              <span className="text-xs text-gray-500">{k.label}</span>
            </div>
            <span className="text-lg font-semibold">{k.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-800/50 rounded-lg border border-gray-700/50 w-fit overflow-x-auto">
        {[
          { key: 'credentials' as const, label: 'Credentials', icon: Key },
          { key: 'policy' as const, label: 'Enrollment Policy', icon: Shield },
          { key: 'audit' as const, label: 'Audit Log', icon: Eye },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ CREDENTIALS TAB ═══ */}
      {activeTab === 'credentials' && (
        <>
          <div className="relative w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search user, label, model..."
              className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Device</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Authenticator</th>
                  <th className="px-4 py-3 text-left">Transports</th>
                  <th className="px-4 py-3 text-center">Sign Count</th>
                  <th className="px-4 py-3 text-left">Last Used</th>
                  <th className="px-4 py-3 text-center">Backup</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filtered.map(cred => (
                  <tr key={cred.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedId(selectedId === cred.id ? null : cred.id)}
                        className="flex items-center gap-2 text-left hover:text-indigo-400 transition-colors">
                        {deviceIcon(cred.deviceType)}
                        <span className="font-medium text-sm">{cred.label}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{cred.user}</div>
                      <div className="text-xs text-gray-500">{cred.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{cred.authenticatorModel}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {cred.transports.map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px] border border-gray-700">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-gray-300">{cred.signCount}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{cred.lastUsed}</td>
                    <td className="px-4 py-3 text-center">
                      {cred.backed_up
                        ? <CheckCircle size={14} className="inline text-green-400" />
                        : <XCircle size={14} className="inline text-gray-600" />
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${statusColors[cred.status]}`}>
                        {cred.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {cred.status === 'active' && (
                          <button onClick={() => handleRevoke(cred.id)} className="p-1 text-gray-500 hover:text-yellow-400 transition-colors" title="Revoke">
                            <AlertTriangle size={14} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(cred.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Delete permanently">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {deviceIcon(selected.deviceType)}
                  <h3 className="text-sm font-semibold">{selected.label}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] border ${statusColors[selected.status]}`}>{selected.status.toUpperCase()}</span>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-200"><X size={16} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {[
                  { label: 'AAGUID', value: selected.aaguid },
                  { label: 'RP ID', value: selected.rpId },
                  { label: 'Attestation', value: selected.attestation },
                  { label: 'Resident Key', value: selected.residentKey ? 'Yes (Discoverable)' : 'No (Server-side)' },
                  { label: 'User Verification', value: selected.uvInitialized ? 'Initialized' : 'Not initialized' },
                  { label: 'Created', value: selected.createdAt },
                  { label: 'Last Used', value: selected.lastUsed },
                  { label: 'Sign Count', value: String(selected.signCount) },
                ].map(f => (
                  <div key={f.label} className="p-3 bg-gray-800/30 rounded-lg">
                    <div className="text-gray-500 mb-1">{f.label}</div>
                    <span className="text-gray-300 font-mono break-all">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ POLICY TAB ═══ */}
      {activeTab === 'policy' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Shield size={16} className="text-indigo-400" /> {policy.name}</h3>
            <button onClick={() => setShowPolicyEdit(!showPolicyEdit)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors">
              {showPolicyEdit ? 'Cancel' : 'Edit Policy'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Enforce Passkey-Only Login', key: 'enforcePasskeyOnly' as const, desc: 'Disable password fallback for all users' },
              { label: 'Allow Platform Authenticators', key: 'allowPlatformAuth' as const, desc: 'Touch ID, Windows Hello, Face ID' },
              { label: 'Allow Cross-Platform (Hybrid)', key: 'allowCrossPlatform' as const, desc: 'Phone as authenticator via BLE/QR' },
              { label: 'Allow Security Keys', key: 'allowSecurityKeys' as const, desc: 'YubiKey, Titan, SoloKeys (USB/NFC)' },
              { label: 'Require User Verification', key: 'requireUserVerification' as const, desc: 'Biometric or PIN required on device' },
              { label: 'Require Resident Key', key: 'requireResidentKey' as const, desc: 'Discoverable credential (usernameless flow)' },
            ].map(toggle => (
              <div key={toggle.key} className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{toggle.label}</span>
                  <button
                    onClick={() => showPolicyEdit && setPolicy(p => ({ ...p, [toggle.key]: !p[toggle.key] }))}
                    className={`w-9 h-5 rounded-full transition-colors relative ${policy[toggle.key] ? 'bg-indigo-600' : 'bg-gray-700'} ${!showPolicyEdit ? 'opacity-60' : 'cursor-pointer'}`}
                    disabled={!showPolicyEdit}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${policy[toggle.key] ? 'left-4.5' : 'left-0.5'}`} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">{toggle.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Attestation Preference</div>
              <select value={policy.attestationPreference} disabled={!showPolicyEdit}
                onChange={e => setPolicy(p => ({ ...p, attestationPreference: e.target.value as 'direct' | 'indirect' | 'none' }))}
                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm disabled:opacity-60">
                <option value="direct">Direct (full attestation)</option>
                <option value="indirect">Indirect (anonymized)</option>
                <option value="none">None (no attestation)</option>
              </select>
            </div>
            <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Max Credentials per User</div>
              <input type="number" value={policy.maxCredentialsPerUser} disabled={!showPolicyEdit}
                onChange={e => setPolicy(p => ({ ...p, maxCredentialsPerUser: Number(e.target.value) }))}
                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm disabled:opacity-60"
              />
            </div>
            <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Auth Timeout</div>
              <span className="text-sm text-gray-300">{policy.authTimeout / 1000}s registration / {policy.registrationTimeout / 1000}s auth</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ AUDIT TAB ═══ */}
      {activeTab === 'audit' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Timestamp</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-left">Credential</th>
                <th className="px-4 py-3 text-left">IP / Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {auditLogs.map((log, i) => (
                <tr key={i} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{log.time}</td>
                  <td className="px-4 py-3 text-gray-300">{log.user}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs border ${
                      log.event.includes('Success') ? 'bg-green-900/30 text-green-400 border-green-800' :
                      log.event.includes('Failed') || log.event.includes('Revoked') ? 'bg-red-900/30 text-red-400 border-red-800' :
                      'bg-blue-900/30 text-blue-400 border-blue-800'
                    }`}>{log.event}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{log.credential}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register Passkey Modal */}
      {showRegister && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowRegister(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Fingerprint size={16} className="text-indigo-400" /> Register New Passkey</h3>
              <button onClick={() => setShowRegister(false)} className="text-gray-400 hover:text-gray-200"><X size={16} /></button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs text-gray-400 mb-1" htmlFor="pk-user">User</label>
                <input id="pk-user" value={registerUser} onChange={e => setRegisterUser(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500/50"
                  placeholder="e.g. Alice Chen" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1" htmlFor="pk-label">Credential Label</label>
                <input id="pk-label" value={registerLabel} onChange={e => setRegisterLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500/50"
                  placeholder="e.g. MacBook Pro Touch ID" />
              </div>
              <p className="text-[11px] text-gray-500">
                Your browser will prompt for biometric / security key verification using the WebAuthn API.
                Attestation preference: <span className="text-indigo-400">{policy.attestationPreference}</span> |
                Resident key: <span className="text-indigo-400">{policy.requireResidentKey ? 'required' : 'preferred'}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRegister(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleRegister} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors">
                Begin Registration
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
