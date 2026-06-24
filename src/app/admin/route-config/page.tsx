'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader, Network, Route, Save, Shield, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { apiUrl } from '@/lib/api-url';
import { useAuthStore } from '@/lib/auth-store';
import { createClientConfig, listClientConfigs, saveClientConfig } from '@/lib/client-config-api';

interface ApiGroup {
  id: string;
  display_name: string;
}

interface RoutingSettings {
  mode: 'full_tunnel' | 'split_tunnel';
  traffic: {
    bypass_processes: string[];
    bypass_domains: string[];
    bypass_networks: string[];
    tunnel_process_exceptions: string[];
    tunnel_domain_exceptions: string[];
    tunnel_network_exceptions: string[];
  };
}

interface RouteGroupConfig {
  id?: string;
  group_id: string;
  group_name: string;
  priority: number;
  routing_settings: RoutingSettings;
  source_config: any;
  updated_by: string;
  updated_at: string;
}

const DEFAULT_ROUTING_SETTINGS: RoutingSettings = {
  mode: 'full_tunnel',
  traffic: {
    bypass_processes: [],
    bypass_domains: [],
    bypass_networks: [],
    tunnel_process_exceptions: [],
    tunnel_domain_exceptions: [],
    tunnel_network_exceptions: [],
  },
};

const DEFAULT_CLIENT_CONFIG_PAYLOAD: any = {
  group_id: 'default',
  group_name: 'Default',
  priority: 1000,
  tunnel_settings: {
    protocol: 'both',
    enable_quic: true,
    enable_tls: true,
    device_posture_enabled: true,
    posture_check_interval_seconds: 60,
    allow_user_gateway_select: true,
    perform_sni_check: true,
    sni_cert_validation: 'strict',
    audit_logs: { disable_with_password: true, fail_close_logs: true, fail_open_logs: false },
  },
  features_settings: {
    dlp: { enabled: false, usb_drives: false, printers: false, clipboard_copy_paste: false, screenshot_print_screen: false },
    dns_routing: { enabled: true, resolver: '100.64.0.1', exceptions: [], inclusions: [] },
    split_tunnel_enabled: false,
    collab_optimization: false,
    other_vpn_bypass: false,
    ssl_inspection: false,
    log_forwarding: true,
  },
  routing_settings: DEFAULT_ROUTING_SETTINGS,
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
    config_sync_interval_mins: 15,
    revoke_on_token_deletion: true,
    debug_options: { enabled: false, log_level: 'error' },
    otp_enforcement: { enabled: false },
  },
  tamperproof_settings: {
    fail_close_mode: 'all_traffic',
    protect_all_internet_private: { enabled: true, password_protected: true },
    protect_internet_only: { enabled: false, password_protected: false },
    protect_private_only: { enabled: false, password_protected: false },
    fail_close_exceptions: { enabled: false, process_names: [], fqdns: [] },
    uninstall_protection: { enabled: true, password_required: true },
    cert_pinning: { enabled: false },
  },
  session_timeout_mins: 480,
  periodic_auth_mins: 60,
  dns_servers: ['10.0.0.53'],
  allowed_protocols: ['QUIC', 'TLS'],
  gateway_priority: ['gw-sg-01'],
  updated_by: 'system',
  updated_at: '',
};

function asArray<T>(value: unknown, fallback: T[] = []): T[] {
  return Array.isArray(value) ? value as T[] : fallback;
}

function mergeObject<T extends Record<string, any>>(defaults: T, value: unknown): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return structuredClone(defaults);
  }
  const input = value as Record<string, any>;
  const merged: Record<string, any> = { ...defaults };
  for (const [key, defaultValue] of Object.entries(defaults)) {
    const nextValue = input[key];
    if (defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
      merged[key] = mergeObject(defaultValue, nextValue);
    } else if (Array.isArray(defaultValue)) {
      merged[key] = asArray(nextValue, defaultValue);
    } else if (nextValue !== null && nextValue !== undefined) {
      merged[key] = nextValue;
    }
  }
  return merged as T;
}

function uniqueLines(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function parseLines(value: string): string[] {
  return uniqueLines(value.split(/\r?\n|[;,]/));
}

function isCIDRLike(value: string): boolean {
  const trimmed = value.trim();
  return /^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(trimmed);
}

function normalizeRoutingSettings(config: any): RoutingSettings {
  if (config?.routing_settings) {
    const routing = mergeObject(DEFAULT_ROUTING_SETTINGS, config.routing_settings);
    routing.traffic.bypass_processes = uniqueLines(routing.traffic.bypass_processes);
    routing.traffic.bypass_domains = uniqueLines(routing.traffic.bypass_domains);
    routing.traffic.bypass_networks = uniqueLines(routing.traffic.bypass_networks);
    routing.traffic.tunnel_process_exceptions = uniqueLines(routing.traffic.tunnel_process_exceptions);
    routing.traffic.tunnel_domain_exceptions = uniqueLines(routing.traffic.tunnel_domain_exceptions);
    routing.traffic.tunnel_network_exceptions = uniqueLines(routing.traffic.tunnel_network_exceptions);
    return routing;
  }

  const routing = structuredClone(DEFAULT_ROUTING_SETTINGS);

  const consumeRule = (rule: any) => {
    const action = String(rule?.policy_action || rule?.action || 'bypass').toLowerCase();
    const matchType = String(rule?.match_type || rule?.type || 'domain').toLowerCase();
    const patterns = uniqueLines([
      ...asArray<string>(rule?.patterns),
      ...asArray<string>(rule?.domains),
      ...(typeof rule?.pattern === 'string' ? [rule.pattern] : []),
    ]);
    for (const pattern of patterns) {
      if (matchType === 'dns_query') continue; // DNS forwarding/exceptions are managed in Client Config
      if (matchType === 'process') {
        if (action === 'tunnel') routing.traffic.tunnel_process_exceptions.push(pattern);
        else routing.traffic.bypass_processes.push(pattern);
        continue;
      }
      if (isCIDRLike(pattern)) {
        if (action === 'tunnel') routing.traffic.tunnel_network_exceptions.push(pattern);
        else routing.traffic.bypass_networks.push(pattern);
        continue;
      }
      if (action === 'tunnel') routing.traffic.tunnel_domain_exceptions.push(pattern);
      else routing.traffic.bypass_domains.push(pattern);
    }
  };

  for (const rule of asArray<any>(config?.private_access_settings?.route_policies)) consumeRule(rule);
  for (const rule of asArray<any>(config?.private_access_settings?.traffic_bypass)) consumeRule(rule);

  routing.traffic.bypass_processes = uniqueLines(routing.traffic.bypass_processes);
  routing.traffic.bypass_domains = uniqueLines(routing.traffic.bypass_domains);
  routing.traffic.bypass_networks = uniqueLines(routing.traffic.bypass_networks);
  routing.traffic.tunnel_process_exceptions = uniqueLines(routing.traffic.tunnel_process_exceptions);
  routing.traffic.tunnel_domain_exceptions = uniqueLines(routing.traffic.tunnel_domain_exceptions);
  routing.traffic.tunnel_network_exceptions = uniqueLines(routing.traffic.tunnel_network_exceptions);
  return routing;
}

function toRouteGroupConfig(config: any): RouteGroupConfig {
  const base = { ...DEFAULT_CLIENT_CONFIG_PAYLOAD, ...config };
  const routing_settings = normalizeRoutingSettings(base);
  return {
    id: base.id,
    group_id: base.group_id,
    group_name: base.group_name,
    priority: typeof base.priority === 'number' ? base.priority : 1000,
    routing_settings,
    source_config: { ...base, routing_settings },
    updated_by: base.updated_by ?? '',
    updated_at: base.updated_at ?? '',
  };
}

function buildClientConfigPayload(config: RouteGroupConfig) {
  const routing = config.routing_settings;
  const base: any = mergeObject(DEFAULT_CLIENT_CONFIG_PAYLOAD, config.source_config ?? {});

  base.group_id = config.group_id;
  base.group_name = config.group_name;
  base.priority = config.priority;
  base.routing_settings = routing;
  base.features_settings = {
    ...base.features_settings,
    split_tunnel_enabled: routing.mode === 'split_tunnel',
  };
  base.private_access_settings = {
    ...base.private_access_settings,
    route_policies: [],
    traffic_bypass: [],
    dns_exceptions: [],
  };
  return base;
}

function textareaValue(values: string[]): string {
  return values.join('\n');
}

export default function RouteConfigPage() {
  const [configs, setConfigs] = useState<RouteGroupConfig[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('default');
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const config = configs.find((item) => item.group_id === selectedGroup);

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
        const groups: ApiGroup[] = asArray<ApiGroup>(groupsPayload?.groups).filter((group) => group && typeof group.id === 'string');
        const savedByGroup = new Map(asArray<any>(savedConfigs).map((item) => {
          const mapped = toRouteGroupConfig(item);
          return [mapped.group_id, mapped] as const;
        }));

        const defaultGroup = savedByGroup.get('default') ?? toRouteGroupConfig(DEFAULT_CLIENT_CONFIG_PAYLOAD);
        const groupConfigs = groups.map((group) => (
          savedByGroup.get(group.id) ?? toRouteGroupConfig({
            ...DEFAULT_CLIENT_CONFIG_PAYLOAD,
            group_id: group.id,
            group_name: group.display_name || group.id,
          })
        ));
        setConfigs([defaultGroup, ...groupConfigs]);
      } catch (error) {
        setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to load route configuration' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateConfig = (updater: (current: RouteGroupConfig) => RouteGroupConfig) => {
    setConfigs((prev) => prev.map((item) => (item.group_id === selectedGroup ? updater(item) : item)));
    setDirty(true);
    setStatus(null);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const payload = buildClientConfigPayload(config);
      const saved = config.id
        ? await saveClientConfig(config.group_id, payload)
        : await createClientConfig(payload);
      setConfigs((prev) => prev.map((item) => item.group_id === config.group_id ? toRouteGroupConfig(saved) : item));
      setDirty(false);
      setStatus({ type: 'success', message: 'Routing configuration saved successfully' });
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to save route configuration' });
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    if (!config) return { bypass: 0, exceptions: 0 };
    const routing = config.routing_settings;
    return {
      bypass: routing.traffic.bypass_processes.length + routing.traffic.bypass_domains.length + routing.traffic.bypass_networks.length,
      exceptions: routing.traffic.tunnel_process_exceptions.length + routing.traffic.tunnel_domain_exceptions.length + routing.traffic.tunnel_network_exceptions.length,
    };
  }, [config]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Route className="text-purple-400" size={24} />
            Route Configuration
          </h1>
          <p className="text-sm text-gray-400 mt-1">Define split tunnel mode, bypass lists, and tunnel inclusions per client group. DNS forwarding &amp; exceptions are managed in Client Configuration.</p>
          <p className="text-xs text-gray-500 mt-1">These settings are delivered to the desktop runtime after user authentication and device-to-user binding.</p>
        </div>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving || !config}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {status && (
        <div className={clsx('p-3 rounded-lg text-sm border', status.type === 'success' ? 'bg-green-900/30 border-green-800 text-green-300' : 'bg-red-900/30 border-red-800 text-red-300')}>
          {status.message}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {loading && <span className="text-sm text-gray-500">Loading groups...</span>}
        {configs.map((item) => (
          <button
            key={item.group_id}
            onClick={() => { setSelectedGroup(item.group_id); setDirty(false); }}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
              selectedGroup === item.group_id
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-gray-200'
            )}
          >
            <Users size={12} className="inline mr-1.5" />
            {item.group_name}
          </button>
        ))}
      </div>

      {config && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
            {config.group_id !== 'default' && (
              <>
                <label htmlFor="route-config-priority">Group priority</label>
                <input
                  id="route-config-priority"
                  type="number"
                  min={1}
                  max={999}
                  value={config.priority}
                  onChange={(event) => updateConfig((current) => ({ ...current, priority: Number(event.target.value) || 100 }))}
                  className="w-24 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200"
                />
                <span>Lower numbers win when a user belongs to multiple groups.</span>
              </>
            )}
            <span className="ml-auto px-3 py-1.5 bg-gray-900/50 border border-gray-800 rounded-lg text-xs text-gray-500">Bypass entries: {stats.bypass}</span>
            <span className="px-3 py-1.5 bg-gray-900/50 border border-gray-800 rounded-lg text-xs text-gray-500">Tunnel inclusions: {stats.exceptions}</span>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-6">
            <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
                <Shield size={14} className="text-blue-400" />
                Routing Mode
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {([
                  ['full_tunnel', 'Full tunnel', 'All traffic stays on the ApexAegis path unless explicitly bypassed for operations.'],
                  ['split_tunnel', 'Split tunnel', 'Bypass lists are active and only selected traffic leaves outside the tunnel.'],
                ] as const).map(([value, label, description]) => (
                  <button
                    key={value}
                    onClick={() => updateConfig((current) => ({ ...current, routing_settings: { ...current.routing_settings, mode: value } }))}
                    className={clsx(
                      'text-left px-4 py-3 rounded-lg border transition-colors',
                      config.routing_settings.mode === value
                        ? 'bg-blue-600/15 border-blue-500/40 text-blue-200'
                        : 'bg-gray-800/40 border-gray-700 text-gray-300 hover:bg-gray-800/70'
                    )}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-gray-500 mt-1">{description}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
                <Network size={14} className="text-green-400" />
                Split Tunnel / VPN Bypass
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Bypass processes</label>
                  <div className="text-[11px] text-gray-600 mb-1">Accepts one entry per line, comma, or semicolon.</div>
                  <textarea
                    rows={6}
                    value={textareaValue(config.routing_settings.traffic.bypass_processes)}
                    onChange={(event) => updateConfig((current) => ({
                      ...current,
                      routing_settings: {
                        ...current.routing_settings,
                        traffic: { ...current.routing_settings.traffic, bypass_processes: parseLines(event.target.value) },
                      },
                    }))}
                    placeholder={'teamviewer.exe\nzoom.exe'}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Bypass domains</label>
                  <div className="text-[11px] text-gray-600 mb-1">Accepts one entry per line, comma, or semicolon.</div>
                  <textarea
                    rows={6}
                    value={textareaValue(config.routing_settings.traffic.bypass_domains)}
                    onChange={(event) => updateConfig((current) => ({
                      ...current,
                      routing_settings: {
                        ...current.routing_settings,
                        traffic: { ...current.routing_settings.traffic, bypass_domains: parseLines(event.target.value) },
                      },
                    }))}
                    placeholder={'support.vendor.example\n*.teamviewer.com'}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Bypass networks (CIDR)</label>
                  <div className="text-[11px] text-gray-600 mb-1">Accepts one entry per line, comma, or semicolon.</div>
                  <textarea
                    rows={6}
                    value={textareaValue(config.routing_settings.traffic.bypass_networks)}
                    onChange={(event) => updateConfig((current) => ({
                      ...current,
                      routing_settings: {
                        ...current.routing_settings,
                        traffic: { ...current.routing_settings.traffic, bypass_networks: parseLines(event.target.value) },
                      },
                    }))}
                    placeholder={'10.20.0.0/16\n192.168.10.0/24'}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono text-gray-200"
                  />
                </div>
              </div>
            </section>

            <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
                <Shield size={14} className="text-amber-400" />
                Tunnel Inclusions
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Tunnel process inclusions</label>
                  <div className="text-[11px] text-gray-600 mb-1">Accepts one entry per line, comma, or semicolon.</div>
                  <textarea
                    rows={6}
                    value={textareaValue(config.routing_settings.traffic.tunnel_process_exceptions)}
                    onChange={(event) => updateConfig((current) => ({
                      ...current,
                      routing_settings: {
                        ...current.routing_settings,
                        traffic: { ...current.routing_settings.traffic, tunnel_process_exceptions: parseLines(event.target.value) },
                      },
                    }))}
                    placeholder={'chrome.exe'}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Tunnel domain inclusions</label>
                  <div className="text-[11px] text-gray-600 mb-1">Accepts one entry per line, comma, or semicolon.</div>
                  <textarea
                    rows={6}
                    value={textareaValue(config.routing_settings.traffic.tunnel_domain_exceptions)}
                    onChange={(event) => updateConfig((current) => ({
                      ...current,
                      routing_settings: {
                        ...current.routing_settings,
                        traffic: { ...current.routing_settings.traffic, tunnel_domain_exceptions: parseLines(event.target.value) },
                      },
                    }))}
                    placeholder={'secure.zoom.us'}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Tunnel network inclusions</label>
                  <div className="text-[11px] text-gray-600 mb-1">Accepts one entry per line, comma, or semicolon.</div>
                  <textarea
                    rows={6}
                    value={textareaValue(config.routing_settings.traffic.tunnel_network_exceptions)}
                    onChange={(event) => updateConfig((current) => ({
                      ...current,
                      routing_settings: {
                        ...current.routing_settings,
                        traffic: { ...current.routing_settings.traffic, tunnel_network_exceptions: parseLines(event.target.value) },
                      },
                    }))}
                    placeholder={'10.20.10.0/24'}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono text-gray-200"
                  />
                </div>
              </div>
            </section>

            <section className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Precedence</h3>
              <div className="text-xs text-blue-300 space-y-1">
                <div>1. Group priority decides which configuration a multi-group user receives.</div>
                <div>2. Tunnel inclusions win over broader bypass intent when both are configured.</div>
                <div>3. Exact domains should be preferred over broad wildcards for operator clarity.</div>
              </div>
            </section>
          </div>

          <div className="text-xs text-gray-600 flex items-center gap-4">
            <span>{config.id ? `Last updated by ${config.updated_by}` : 'No saved routing configuration. Default steering will apply.'}</span>
            {config.updated_at && <span>{new Date(config.updated_at).toLocaleString()}</span>}
          </div>
        </>
      )}
    </div>
  );
}
