'use client';
import React, { useState } from 'react';
import {
  Settings, Users, Shield, Lock, Wifi, Server, Clock,
  Fingerprint, MonitorSmartphone, Eye, ToggleLeft, ToggleRight,
  ChevronDown, ChevronRight, Save, RefreshCw, Plus, X,
  Globe,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ─────────────────────────────────────────────────── */
interface ClientFeatures {
  split_tunnel_enabled: boolean;
  collab_optimization: boolean;
  biometric_required: boolean;
  device_posture_check: boolean;
  dns_filter_enabled: boolean;
  ssl_inspection_enabled: boolean;
  dlp_enabled: boolean;
  log_forwarding_enabled: boolean;
  captive_portal_detection: boolean;
}

type CaptivePortalAction = 'auto_open' | 'notify' | 'block';

interface ClientGroupConfig {
  group_id: string;
  group_name: string;
  features: ClientFeatures;
  session_timeout_mins: number;
  periodic_auth_mins: number;
  tamper_proof: boolean;
  vdi_support: boolean;
  dns_servers: string[];
  allowed_protocols: string[];
  gateway_priority: string[];
  captive_portal_action: CaptivePortalAction;
  trusted_captive_portals: string[];
  updated_by: string;
  updated_at: string;
}

/* ─── Demo data ─────────────────────────────────────────────── */
const demoConfigs: ClientGroupConfig[] = [
  {
    group_id: 'default', group_name: 'Default',
    features: { split_tunnel_enabled: true, collab_optimization: true, biometric_required: false, device_posture_check: true, dns_filter_enabled: true, ssl_inspection_enabled: true, dlp_enabled: false, log_forwarding_enabled: true, captive_portal_detection: true },
    session_timeout_mins: 480, periodic_auth_mins: 60, tamper_proof: true, vdi_support: false,
    dns_servers: ['10.0.0.53', '10.0.1.53'], allowed_protocols: ['wireguard', 'https'], gateway_priority: ['gw-sg-01', 'gw-syd-01'],
    captive_portal_action: 'auto_open', trusted_captive_portals: ['captive.apple.com', 'connectivitycheck.gstatic.com', 'www.msftconnecttest.com'],
    updated_by: 'system', updated_at: '2026-03-12T08:50:00Z',
  },
  {
    group_id: 'engineering', group_name: 'Engineering',
    features: { split_tunnel_enabled: true, collab_optimization: true, biometric_required: true, device_posture_check: true, dns_filter_enabled: true, ssl_inspection_enabled: true, dlp_enabled: true, log_forwarding_enabled: true, captive_portal_detection: true },
    session_timeout_mins: 480, periodic_auth_mins: 30, tamper_proof: true, vdi_support: true,
    dns_servers: ['10.0.0.53'], allowed_protocols: ['wireguard', 'https', 'ssh'], gateway_priority: ['gw-sg-01'],
    captive_portal_action: 'notify', trusted_captive_portals: ['captive.apple.com', 'connectivitycheck.gstatic.com'],
    updated_by: 'system', updated_at: '2026-03-12T08:50:00Z',
  },
  {
    group_id: 'executives', group_name: 'Executives',
    features: { split_tunnel_enabled: false, collab_optimization: true, biometric_required: true, device_posture_check: true, dns_filter_enabled: true, ssl_inspection_enabled: true, dlp_enabled: true, log_forwarding_enabled: true, captive_portal_detection: true },
    session_timeout_mins: 240, periodic_auth_mins: 15, tamper_proof: true, vdi_support: false,
    dns_servers: ['10.0.0.53', '10.0.1.53'], allowed_protocols: ['wireguard', 'https'], gateway_priority: ['gw-sg-01', 'gw-syd-01'],
    captive_portal_action: 'auto_open', trusted_captive_portals: ['captive.apple.com', 'connectivitycheck.gstatic.com', 'www.msftconnecttest.com'],
    updated_by: 'admin@acme.com', updated_at: '2026-03-13T14:00:00Z',
  },
  {
    group_id: 'contractors', group_name: 'Contractors',
    features: { split_tunnel_enabled: false, collab_optimization: false, biometric_required: true, device_posture_check: true, dns_filter_enabled: true, ssl_inspection_enabled: true, dlp_enabled: true, log_forwarding_enabled: true, captive_portal_detection: true },
    session_timeout_mins: 120, periodic_auth_mins: 15, tamper_proof: true, vdi_support: true,
    dns_servers: ['10.0.0.53'], allowed_protocols: ['https'], gateway_priority: ['gw-sg-01'],
    captive_portal_action: 'block', trusted_captive_portals: [],
    updated_by: 'admin@acme.com', updated_at: '2026-03-14T07:00:00Z',
  },
];

/* ─── Feature metadata ──────────────────────────────────────── */
const featureLabels: Record<string, { label: string; desc: string; icon: typeof Shield }> = {
  split_tunnel_enabled: { label: 'Split Tunnel', desc: 'Route only corporate traffic through gateway', icon: Wifi },
  collab_optimization: { label: 'Collab Optimization', desc: 'QoS bypass for Teams, Zoom, Meet', icon: MonitorSmartphone },
  biometric_required: { label: 'Biometric Auth', desc: 'Require biometric for sensitive operations', icon: Fingerprint },
  device_posture_check: { label: 'Device Posture', desc: 'Verify endpoint compliance before access', icon: Shield },
  dns_filter_enabled: { label: 'DNS Filtering', desc: 'DNS-layer threat and category filtering', icon: Server },
  ssl_inspection_enabled: { label: 'SSL Inspection', desc: 'TLS/SSL deep packet inspection', icon: Lock },
  dlp_enabled: { label: 'DLP', desc: 'Data loss prevention scanning', icon: Eye },
  log_forwarding_enabled: { label: 'Log Forwarding', desc: 'Forward client logs to management plane', icon: Settings },
  captive_portal_detection: { label: 'Captive Portal Detection', desc: 'Detect and handle captive portals (hotel/airport Wi-Fi)', icon: Globe },
};

/* ─── Component ─────────────────────────────────────────────── */
export default function ClientConfigPage() {
  const [configs, setConfigs] = useState<ClientGroupConfig[]>(demoConfigs);
  const [selectedGroup, setSelectedGroup] = useState<string>('default');
  const [dirty, setDirty] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupId, setNewGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  const config = configs.find(c => c.group_id === selectedGroup)!;

  const updateConfig = (updater: (c: ClientGroupConfig) => ClientGroupConfig) => {
    setConfigs(prev => prev.map(c => c.group_id === selectedGroup ? updater(c) : c));
    setDirty(true);
  };

  const toggleFeature = (key: keyof ClientFeatures) => {
    updateConfig(c => ({
      ...c,
      features: { ...c.features, [key]: !c.features[key] },
    }));
  };

  const handleSave = () => {
    setDirty(false);
    setConfigs(prev => prev.map(c => c.group_id === selectedGroup
      ? { ...c, updated_by: 'admin@acme.com', updated_at: new Date().toISOString() }
      : c
    ));
  };

  const handleCreateGroup = () => {
    const id = newGroupId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const name = newGroupName.trim();
    if (!id || !name || configs.some(c => c.group_id === id)) return;
    const newConfig: ClientGroupConfig = {
      group_id: id,
      group_name: name,
      features: { split_tunnel_enabled: true, collab_optimization: true, biometric_required: false, device_posture_check: true, dns_filter_enabled: true, ssl_inspection_enabled: true, dlp_enabled: false, log_forwarding_enabled: true, captive_portal_detection: true },
      session_timeout_mins: 480, periodic_auth_mins: 60, tamper_proof: true, vdi_support: false,
      dns_servers: ['10.0.0.53'], allowed_protocols: ['wireguard', 'https'], gateway_priority: ['gw-sg-01'],
      captive_portal_action: 'auto_open', trusted_captive_portals: ['captive.apple.com', 'connectivitycheck.gstatic.com', 'www.msftconnecttest.com'],
      updated_by: 'admin@acme.com', updated_at: new Date().toISOString(),
    };
    setConfigs(prev => [...prev, newConfig]);
    setSelectedGroup(id);
    setShowCreate(false);
    setNewGroupId('');
    setNewGroupName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="text-blue-400" size={24} />
            Client Configuration
          </h1>
          <p className="text-sm text-gray-400 mt-1">Per-group client settings: tamperproof, periodic auth, VDI, features</p>
        </div>
        {dirty && (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={14} /> Save Changes
          </button>
        )}
      </div>

      {/* Group selector */}
      <div className="flex gap-2 flex-wrap">
        {configs.map(c => (
          <button
            key={c.group_id}
            onClick={() => { setSelectedGroup(c.group_id); setDirty(false); }}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
              selectedGroup === c.group_id
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-gray-200'
            )}
          >
            <Users size={12} className="inline mr-1.5" />
            {c.group_name}
          </button>
        ))}
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-dashed border-gray-700 text-gray-500 hover:text-blue-400 hover:border-blue-500/40"
        >
          <Plus size={12} className="inline mr-1" /> New Group
        </button>
      </div>

      {/* Create group modal */}
      {showCreate && (
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2"><Plus size={14} /> Create New Group</h3>
            <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-300"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Group ID (slug)</label>
              <input value={newGroupId} onChange={e => setNewGroupId(e.target.value)} placeholder="e.g. sales-team"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Group Name</label>
              <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. Sales Team"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600" />
            </div>
          </div>
          <button onClick={handleCreateGroup} disabled={!newGroupId.trim() || !newGroupName.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Create Group
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Session & Auth Settings */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Clock size={14} className="text-yellow-400" />
            Session & Authentication
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Session Timeout (minutes)</label>
              <input
                type="number"
                value={config.session_timeout_mins}
                onChange={e => updateConfig(c => ({ ...c, session_timeout_mins: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Periodic Re-Auth Interval (minutes)</label>
              <input
                type="number"
                value={config.periodic_auth_mins}
                onChange={e => updateConfig(c => ({ ...c, periodic_auth_mins: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-gray-300">Tamper-Proof Mode</div>
                <div className="text-[10px] text-gray-500">Prevent client uninstall/disable without admin auth</div>
              </div>
              <button onClick={() => updateConfig(c => ({ ...c, tamper_proof: !c.tamper_proof }))}>
                {config.tamper_proof ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-gray-300">VDI Support</div>
                <div className="text-[10px] text-gray-500">Non-persistent desktop / Citrix / AVD compatibility</div>
              </div>
              <button onClick={() => updateConfig(c => ({ ...c, vdi_support: !c.vdi_support }))}>
                {config.vdi_support ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
              </button>
            </div>
          </div>
        </div>

        {/* Network Settings */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Server size={14} className="text-purple-400" />
            Network Settings
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">DNS Servers (comma-separated)</label>
              <input
                type="text"
                value={config.dns_servers.join(', ')}
                onChange={e => updateConfig(c => ({ ...c, dns_servers: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Allowed Protocols</label>
              <input
                type="text"
                value={config.allowed_protocols.join(', ')}
                onChange={e => updateConfig(c => ({ ...c, allowed_protocols: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Gateway Priority</label>
              <input
                type="text"
                value={config.gateway_priority.join(', ')}
                onChange={e => updateConfig(c => ({ ...c, gateway_priority: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Captive Portal Settings */}
      {config.features.captive_portal_detection && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Globe size={14} className="text-cyan-400" />
            Captive Portal Settings
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Portal Action</label>
              <div className="flex gap-2">
                {(['auto_open', 'notify', 'block'] as CaptivePortalAction[]).map(action => (
                  <button key={action}
                    onClick={() => updateConfig(c => ({ ...c, captive_portal_action: action }))}
                    className={clsx('px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                      config.captive_portal_action === action
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                        : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300')}>
                    {action === 'auto_open' && '🌐 Auto-Open Browser'}
                    {action === 'notify' && '🔔 Notify User'}
                    {action === 'block' && '🚫 Block & Alert'}
                  </button>
                ))}
              </div>
              <div className="text-[9px] text-gray-600 mt-1">
                {config.captive_portal_action === 'auto_open' && 'Automatically opens the captive portal page, pauses tunnel, reconnects after auth'}
                {config.captive_portal_action === 'notify' && 'Notifies user to authenticate with captive portal manually'}
                {config.captive_portal_action === 'block' && 'Blocks captive portal traffic and alerts admin — strictest for high-security groups'}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Trusted Captive Portal Domains</label>
              <input
                type="text"
                value={config.trusted_captive_portals.join(', ')}
                onChange={e => updateConfig(c => ({ ...c, trusted_captive_portals: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                placeholder="captive.apple.com, connectivitycheck.gstatic.com"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
              />
              <div className="text-[9px] text-gray-600 mt-1">Domains used for portal detection probes — bypassed from SSL inspection</div>
            </div>
          </div>
        </div>
      )}

      {/* Feature toggles */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Shield size={14} className="text-green-400" />
            Client Features for {config.group_name}
          </h3>
        </div>
        <div className="divide-y divide-gray-800/50">
          {(Object.keys(featureLabels) as (keyof ClientFeatures)[]).map(key => {
            const meta = featureLabels[key];
            const Icon = meta.icon;
            const enabled = config.features[key];
            return (
              <div key={key} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800/20 transition-colors">
                <button onClick={() => toggleFeature(key)}>
                  {enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
                </button>
                <Icon size={16} className={enabled ? 'text-blue-400' : 'text-gray-600'} />
                <div className="flex-1">
                  <div className="text-sm text-gray-200 font-medium">{meta.label}</div>
                  <div className="text-[10px] text-gray-500">{meta.desc}</div>
                </div>
                <span className={clsx('text-[10px] font-medium', enabled ? 'text-green-400' : 'text-gray-600')}>
                  {enabled ? 'ON' : 'OFF'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-600 flex items-center gap-4">
        <span>Last updated by {config.updated_by}</span>
        <span>{new Date(config.updated_at).toLocaleString()}</span>
      </div>
    </div>
  );
}
