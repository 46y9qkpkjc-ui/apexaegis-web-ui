'use client';
import React, { useState, useEffect } from 'react';
import {
  Settings, Users, Save, AlertCircle, CheckCircle, Loader
} from 'lucide-react';
import { clsx } from 'clsx';
import { TunnelSettingsComponent } from '@/components/client-config/TunnelSettings';
import { FeaturesSettingsComponent } from '@/components/client-config/FeaturesSettings';
import { PrivateAccessSettingsComponent } from '@/components/client-config/PrivateAccessSettings';
import { InstallSettingsComponent } from '@/components/client-config/InstallSettings';
import { TamperproofSettingsComponent } from '@/components/client-config/TamperproofSettings';
import { saveClientConfig, listClientConfigs, createClientConfig } from '@/lib/client-config-api';
import { apiUrl } from '@/lib/api-url';
import { useAuthStore } from '@/lib/auth-store';

// Re-export types used by sub-components
export interface TunnelSettings {
  protocol: 'quic' | 'dtls' | 'both';
  enable_quic: boolean;
  enable_dtls: boolean;
  device_posture_enabled: boolean;
  posture_check_interval_mins: number;
  allow_user_gateway_select: boolean;
  perform_sni_check: boolean;
  sni_cert_validation: 'strict' | 'loose';
  audit_logs: { disable_with_password: boolean; fail_close_logs: boolean; fail_open_logs: boolean };
}

export interface FeaturesSettings {
  dlp: { enabled: boolean; usb_drives: boolean; printers: boolean; clipboard_copy_paste: boolean; screenshot_print_screen: boolean };
  dns_filtering: { enabled: boolean; filter_mode: 'block' | 'log'; block_malware: boolean; block_adult_content: boolean };
  url_filtering: { enabled: boolean; block_categories: string[] };
  file_type_download_control: { enabled: boolean; blocked_extensions: string[] };
  sandboxing: { enabled: boolean };
  http_header_filtering: { enabled: boolean };
  web_client_filtering: { enabled: boolean; blocked_clients: string[] };
}

export interface PrivateAccessSettings {
  machine_tunnel_enabled: boolean;
  mtls_enabled: boolean;
  device_certificate_required: boolean;
  vdi_support: { enabled: boolean; single_ip_multi_user: boolean };
  periodic_auth_hours: number;
  partner_tenant_access: { enabled: boolean };
}

export interface InstallSettings {
  verify_app_domains: boolean;
  app_integrity_verification: boolean;
  auto_update: { enabled: boolean; auto_update_channel: 'stable' | 'beta' };
  revoke_on_token_deletion: boolean;
  debug_options: { enabled: boolean; log_level: string };
  otp_enforcement: { enabled: boolean };
}

export interface TamperproofSettings {
  fail_close_mode: 'all_traffic' | 'internet_only' | 'private_only';
  protect_all_internet_private: { enabled: boolean; password_protected: boolean };
  protect_internet_only: { enabled: boolean; password_protected: boolean };
  protect_private_only: { enabled: boolean; password_protected: boolean };
  fail_close_exceptions: { enabled: boolean };
  uninstall_protection: { enabled: boolean; password_required: boolean };
  cert_pinning: { enabled: boolean };
}

interface ClientGroupConfig {
  id?: string;
  group_id: string;
  group_name: string;
  priority: number;
  tunnel_settings: TunnelSettings;
  features_settings: FeaturesSettings;
  private_access_settings: PrivateAccessSettings;
  install_settings: InstallSettings;
  tamperproof_settings: TamperproofSettings;
  session_timeout_mins: number;
  periodic_auth_mins: number;
  dns_servers: string[];
  allowed_protocols: string[];
  gateway_priority: string[];
  updated_by: string;
  updated_at: string;
}

const DEFAULT_CONFIG: ClientGroupConfig = {
  group_id: 'default',
  group_name: 'Default',
  priority: 1000,
  tunnel_settings: {
    protocol: 'both',
    enable_quic: true,
    enable_dtls: false,
    device_posture_enabled: true,
    posture_check_interval_mins: 60,
    allow_user_gateway_select: true,
    perform_sni_check: true,
    sni_cert_validation: 'strict',
    audit_logs: { disable_with_password: true, fail_close_logs: true, fail_open_logs: false },
  },
  features_settings: {
    dlp: { enabled: false, usb_drives: false, printers: false, clipboard_copy_paste: false, screenshot_print_screen: false },
    dns_filtering: { enabled: true, filter_mode: 'block', block_malware: true, block_adult_content: false },
    url_filtering: { enabled: true, block_categories: ['malware', 'phishing'] },
    file_type_download_control: { enabled: false, blocked_extensions: ['.exe', '.scr', '.bat'] },
    sandboxing: { enabled: false },
    http_header_filtering: { enabled: false },
    web_client_filtering: { enabled: false, blocked_clients: [] },
  },
  private_access_settings: {
    machine_tunnel_enabled: true,
    mtls_enabled: true,
    device_certificate_required: true,
    vdi_support: { enabled: false, single_ip_multi_user: false },
    periodic_auth_hours: 24,
    partner_tenant_access: { enabled: false },
  },
  install_settings: {
    verify_app_domains: true,
    app_integrity_verification: true,
    auto_update: { enabled: true, auto_update_channel: 'stable' },
    revoke_on_token_deletion: true,
    debug_options: { enabled: false, log_level: 'error' },
    otp_enforcement: { enabled: false },
  },
  tamperproof_settings: {
    fail_close_mode: 'all_traffic',
    protect_all_internet_private: { enabled: true, password_protected: true },
    protect_internet_only: { enabled: false, password_protected: false },
    protect_private_only: { enabled: false, password_protected: false },
    fail_close_exceptions: { enabled: false },
    uninstall_protection: { enabled: true, password_required: true },
    cert_pinning: { enabled: false },
  },
  session_timeout_mins: 480,
  periodic_auth_mins: 60,
  dns_servers: ['10.0.0.53'],
  allowed_protocols: ['quic', 'dtls'],
  gateway_priority: ['gw-sg-01'],
  updated_by: 'system',
  updated_at: new Date().toISOString(),
};

interface ApiGroup {
  id: string;
  display_name: string;
}

const sections = [
  { id: 'tunnel', label: '🌐 Tunnel', icon: '⚡' },
  { id: 'features', label: '🛡️ Features', icon: '📦' },
  { id: 'private', label: '🔒 Private Access', icon: '🔐' },
  { id: 'install', label: '📥 Install', icon: '⚙️' },
  { id: 'tamper', label: '🔐 Tamper-Proof', icon: '🛑' },
];

export default function ClientConfigPage() {
  const [configs, setConfigs] = useState<ClientGroupConfig[]>([DEFAULT_CONFIG]);
  const [selectedGroup, setSelectedGroup] = useState<string>('default');
  const [activeSection, setActiveSection] = useState<string>('tunnel');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const config = configs.find((c) => c.group_id === selectedGroup) || DEFAULT_CONFIG;

  useEffect(() => {
    const load = async () => {
      try {
        const token = useAuthStore.getState().accessToken ?? '';
        const [savedConfigs, groupsResponse] = await Promise.all([
          listClientConfigs(),
          fetch(apiUrl('/api/v1/groups'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (!groupsResponse.ok) throw new Error(`Failed to load groups: HTTP ${groupsResponse.status}`);
        const groupsPayload = await groupsResponse.json();
        const groups: ApiGroup[] = groupsPayload.groups ?? [];
        const savedByGroup = new Map(savedConfigs.map((item: ClientGroupConfig) => [item.group_id, item]));
        const groupConfigs = groups.map((group) => (
          savedByGroup.get(group.id) ?? {
            ...DEFAULT_CONFIG,
            group_id: group.id,
            group_name: group.display_name,
            updated_at: '',
          }
        ));
        const defaultConfig = savedByGroup.get('default') ?? DEFAULT_CONFIG;
        setConfigs([defaultConfig, ...groupConfigs]);
      } catch (error) {
        setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to load client configurations' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateConfig = (updater: (c: ClientGroupConfig) => ClientGroupConfig) => {
    setConfigs((prev) => prev.map((c) => (c.group_id === selectedGroup ? updater(c) : c)));
    setDirty(true);
    setStatus(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const exists = Boolean(config.id);
      const saved = exists
        ? await saveClientConfig(config.group_id, config)
        : await createClientConfig(config);
      setConfigs((prev) => prev.map((item) => item.group_id === config.group_id ? saved : item));
      setDirty(false);
      setStatus({ type: 'success', message: 'Configuration saved successfully' });
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
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
          <p className="text-sm text-gray-400 mt-1">Configure client behavior for different user groups</p>
        </div>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Status Messages */}
      {status && (
        <div className={clsx('flex items-center gap-2 p-3 rounded-lg', status.type === 'success' ? 'bg-green-900/30 border border-green-800 text-green-300' : 'bg-red-900/30 border border-red-800 text-red-300')}>
          {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {status.message}
        </div>
      )}

      {/* Group Selector */}
      <div className="flex gap-2 flex-wrap">
        {loading && <span className="text-sm text-gray-500">Loading SCIM groups...</span>}
        {configs.map((c) => (
          <button
            key={c.group_id}
            onClick={() => { setSelectedGroup(c.group_id); setDirty(false); }}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
              selectedGroup === c.group_id
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800'
            )}
          >
            <Users size={12} className="inline mr-1.5" />
            {c.group_name}
          </button>
        ))}
      </div>

      {/* Section Tabs */}
      {config.group_id !== 'default' && (
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <label htmlFor="config-priority">Group priority</label>
          <input
            id="config-priority"
            type="number"
            min={1}
            max={999}
            value={config.priority}
            onChange={(event) => updateConfig((current) => ({ ...current, priority: Number(event.target.value) || 100 }))}
            className="w-24 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200"
          />
          <span>Lower numbers win when a user belongs to multiple groups.</span>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto">
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={clsx(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeSection === sec.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            )}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
        {activeSection === 'tunnel' && (
          <TunnelSettingsComponent
            settings={config.tunnel_settings}
            onChange={(settings) => updateConfig((c) => ({ ...c, tunnel_settings: settings }))}
          />
        )}
        {activeSection === 'features' && (
          <FeaturesSettingsComponent
            settings={config.features_settings}
            onChange={(settings) => updateConfig((c) => ({ ...c, features_settings: settings }))}
          />
        )}
        {activeSection === 'private' && (
          <PrivateAccessSettingsComponent
            settings={config.private_access_settings}
            onChange={(settings) => updateConfig((c) => ({ ...c, private_access_settings: settings }))}
          />
        )}
        {activeSection === 'install' && (
          <InstallSettingsComponent
            settings={config.install_settings}
            onChange={(settings) => updateConfig((c) => ({ ...c, install_settings: settings }))}
          />
        )}
        {activeSection === 'tamper' && (
          <TamperproofSettingsComponent
            settings={config.tamperproof_settings}
            onChange={(settings) => updateConfig((c) => ({ ...c, tamperproof_settings: settings }))}
          />
        )}
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-600 flex items-center gap-4">
        <span>{config.id ? `Last updated by ${config.updated_by}` : 'No saved configuration. Default settings will apply.'}</span>
        {config.updated_at && <span>{new Date(config.updated_at).toLocaleString()}</span>}
      </div>
    </div>
  );
}
