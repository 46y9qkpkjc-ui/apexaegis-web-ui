'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Globe, Link2, Network, Plus, Save, Search, Server, ToggleLeft, ToggleRight, Trash2, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { listClientConfigs, saveClientConfig } from '@/lib/client-config-api';

type MatchType = 'process' | 'fqdn' | 'domain' | 'cidr' | 'url' | 'dns_query';
type RouteAction = 'bypass' | 'tunnel' | 'block';

interface RouteRule {
  id: string;
  match_type: MatchType;
  pattern: string;
  action: RouteAction;
  enabled: boolean;
  comment: string;
  resolver?: 'system' | 'gateway';
}

interface RouteGroupConfig {
  group_id: string;
  group_name: string;
  version: number;
  rules: RouteRule[];
  updated_by: string;
  updated_at: string;
  source_config: any;
}

const matchTypeIcons: Record<MatchType, typeof Globe> = {
  process: Server,
  fqdn: Globe,
  domain: Network,
  cidr: Network,
  url: Link2,
  dns_query: Search,
};

const matchTypeLabels: Record<MatchType, string> = {
  process: 'Process',
  fqdn: 'FQDN',
  domain: 'Domain',
  cidr: 'CIDR',
  url: 'URL Pattern',
  dns_query: 'DNS Query',
};

const actionColors: Record<RouteAction, string> = {
  bypass: 'bg-green-900/30 text-green-400 border-green-800',
  tunnel: 'bg-blue-900/30 text-blue-400 border-blue-800',
  block: 'bg-red-900/30 text-red-400 border-red-800',
};

export default function RouteConfigPage() {
  const [configs, setConfigs] = useState<RouteGroupConfig[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const saved = await listClientConfigs();
        if (cancelled) return;
        const mapped = saved.map(clientConfigToRouteGroup);
        setConfigs(mapped);
        setSelectedGroup(mapped[0]?.group_id ?? '');
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load route configuration');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const config = configs.find(c => c.group_id === selectedGroup);

  const stats = useMemo(() => {
    const rules = config?.rules ?? [];
    return {
      bypass: rules.filter(r => r.enabled && r.action === 'bypass').length,
      tunnel: rules.filter(r => r.enabled && r.action === 'tunnel').length,
      block: rules.filter(r => r.enabled && r.action === 'block').length,
    };
  }, [config]);

  const updateRules = (newRules: RouteRule[]) => {
    setConfigs(prev => prev.map(c => c.group_id === selectedGroup ? { ...c, rules: newRules } : c));
    setDirty(true);
    setError(null);
  };

  const addRule = () => {
    if (!config) return;
    updateRules([...config.rules, {
      id: `route-${Date.now()}`,
      match_type: 'domain',
      pattern: '',
      action: 'bypass',
      enabled: true,
      comment: '',
    }]);
  };

  const updateRule = (id: string, patch: Partial<RouteRule>) => {
    if (!config) return;
    updateRules(config.rules.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const removeRule = (id: string) => {
    if (!config) return;
    updateRules(config.rules.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      setError(null);
      const saved = await saveClientConfig(config.group_id, routeGroupToClientConfig(config));
      const mapped = clientConfigToRouteGroup(saved);
      setConfigs(prev => prev.map(c => c.group_id === selectedGroup ? mapped : c));
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save route configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="text-purple-400" size={24} />
            Route Configuration
          </h1>
          <p className="text-sm text-gray-400 mt-1">Configure DNS exceptions and traffic steering per client group.</p>
          <p className="text-xs text-gray-500 mt-1">Saved rules are delivered to devices through the mTLS client runtime API.</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
              <Save size={14} /> {saving ? 'Saving...' : `Save v${(config?.version ?? 0) + 1}`}
            </button>
          )}
          <button onClick={addRule} disabled={!config} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm border border-gray-700 transition-colors">
            <Plus size={14} /> Add Rule
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading client route configuration...</div>}
      {error && <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-sm text-red-300">{error}</div>}

      <div className="flex gap-2 flex-wrap">
        {configs.map(c => (
          <button key={c.group_id} onClick={() => { setSelectedGroup(c.group_id); setDirty(false); }} className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
            selectedGroup === c.group_id ? 'bg-purple-600 text-white border-purple-500' : 'bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-gray-200'
          )}>
            <Users size={12} className="inline mr-1.5" />
            {c.group_name}
            <span className="ml-2 text-xs opacity-60">({c.rules.length})</span>
          </button>
        ))}
      </div>

      {config && (
        <>
          <div className="flex gap-3">
            <div className="px-3 py-1.5 bg-gray-900/50 border border-gray-800 rounded-lg text-xs text-gray-400">Total Rules: <span className="text-white font-medium">{config.rules.length}</span></div>
            <div className="px-3 py-1.5 bg-green-900/20 border border-green-900/30 rounded-lg text-xs text-green-400">Bypass: <span className="font-medium">{stats.bypass}</span></div>
            <div className="px-3 py-1.5 bg-blue-900/20 border border-blue-900/30 rounded-lg text-xs text-blue-400">Tunnel: <span className="font-medium">{stats.tunnel}</span></div>
            <div className="px-3 py-1.5 bg-red-900/20 border border-red-900/30 rounded-lg text-xs text-red-400">Block: <span className="font-medium">{stats.block}</span></div>
            <div className="ml-auto px-3 py-1.5 bg-gray-900/50 border border-gray-800 rounded-lg text-xs text-gray-500">Version: v{config.version}</div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 w-10">On</th>
                  <th className="px-4 py-3 w-36">Match Type</th>
                  <th className="px-4 py-3">Pattern</th>
                  <th className="px-4 py-3 w-28">Action</th>
                  <th className="px-4 py-3 w-28">Resolver</th>
                  <th className="px-4 py-3">Comment</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {config.rules.map(rule => {
                  const MtIcon = matchTypeIcons[rule.match_type] || Globe;
                  return (
                    <tr key={rule.id} className={clsx('transition-colors', rule.enabled ? 'hover:bg-gray-800/20' : 'opacity-50')}>
                      <td className="px-4 py-2">
                        <button onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}>
                          {rule.enabled ? <ToggleRight size={22} className="text-green-400" /> : <ToggleLeft size={22} className="text-gray-600" />}
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <select value={rule.match_type} onChange={e => updateRule(rule.id, { match_type: e.target.value as MatchType })} className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-blue-600">
                          {Object.entries(matchTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <MtIcon size={12} className="text-gray-500 flex-shrink-0" />
                          <input type="text" value={rule.pattern} onChange={e => updateRule(rule.id, { pattern: e.target.value })} placeholder="e.g. *.client.local or 10.50.0.0/16" className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 font-mono focus:outline-none focus:border-blue-600" />
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <select value={rule.action} onChange={e => updateRule(rule.id, { action: e.target.value as RouteAction })} className={clsx('w-full px-2 py-1.5 rounded text-xs font-medium border focus:outline-none', actionColors[rule.action])}>
                          <option value="bypass">Bypass</option>
                          <option value="tunnel">Tunnel</option>
                          <option value="block">Block</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        {rule.match_type === 'dns_query' ? (
                          <select value={rule.resolver ?? 'system'} onChange={e => updateRule(rule.id, { resolver: e.target.value as 'system' | 'gateway' })} className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200">
                            <option value="system">System VPN DNS</option>
                            <option value="gateway">Gateway DNS</option>
                          </select>
                        ) : <span className="text-xs text-gray-600">-</span>}
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={rule.comment} onChange={e => updateRule(rule.id, { comment: e.target.value })} placeholder="Description..." className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 focus:outline-none focus:border-blue-600" />
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={() => removeRule(rule.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {config.rules.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-600">
                <AlertTriangle size={20} className="mx-auto mb-2 text-yellow-400/50" />
                No steering rules defined. Default behavior tunnels protected traffic through ApexAegis.
              </div>
            )}
          </div>

          <div className="text-xs text-gray-600 flex items-center gap-4">
            <span>Last updated by {config.updated_by || 'unknown'}</span>
            <span>{config.updated_at ? new Date(config.updated_at).toLocaleString() : 'Never saved'}</span>
            <span>Version: v{config.version}</span>
          </div>
        </>
      )}
    </div>
  );
}

function clientConfigToRouteGroup(config: any): RouteGroupConfig {
  const privateSettings = config.private_access_settings ?? {};
  const routePolicies = Array.isArray(privateSettings.route_policies) ? privateSettings.route_policies : [];
  const dnsExceptions = Array.isArray(privateSettings.dns_exceptions) ? privateSettings.dns_exceptions : [];
  const rules: RouteRule[] = [
    ...routePolicies.flatMap((rule: any, idx: number) => {
      const patterns = Array.isArray(rule.patterns) ? rule.patterns : rule.pattern ? [rule.pattern] : [];
      return patterns.map((pattern: string, pidx: number) => ({
        id: pidx === 0 ? rule.id || `route-${idx}` : `${rule.id || `route-${idx}`}-${pidx}`,
        match_type: normalizeMatchType(rule.match_type || rule.type),
        pattern,
        action: normalizeAction(rule.policy_action || rule.action),
        enabled: rule.enabled !== false,
        comment: rule.comment || rule.reason || rule.name || '',
      }));
    }),
    ...dnsExceptions.flatMap((rule: any, idx: number) => {
      const domains = Array.isArray(rule.domains) ? rule.domains : rule.pattern ? [rule.pattern] : [];
      return domains.map((pattern: string, pidx: number) => ({
        id: pidx === 0 ? rule.id || `dns-${idx}` : `${rule.id || `dns-${idx}`}-${pidx}`,
        match_type: 'dns_query' as const,
        pattern,
        action: normalizeAction(rule.action),
        enabled: rule.enabled !== false,
        comment: rule.comment || rule.reason || rule.name || '',
        resolver: rule.resolver === 'gateway' ? 'gateway' as const : 'system' as const,
      }));
    }),
  ];

  return {
    group_id: config.group_id,
    group_name: config.group_name,
    version: config.version ?? 1,
    rules,
    updated_by: config.updated_by ?? '',
    updated_at: config.updated_at ?? '',
    source_config: config,
  };
}

function routeGroupToClientConfig(group: RouteGroupConfig): any {
  const base = group.source_config ?? {};
  const privateSettings = { ...(base.private_access_settings ?? {}) };
  privateSettings.route_policies = group.rules
    .filter(rule => rule.match_type !== 'dns_query')
    .map((rule, idx) => ({
      id: rule.id || `route-${idx}`,
      name: rule.comment || rule.id || `Route ${idx + 1}`,
      match_type: rule.match_type,
      patterns: [rule.pattern].filter(Boolean),
      policy_action: rule.action,
      enabled: rule.enabled,
      priority: (idx + 1) * 10,
      comment: rule.comment,
    }));
  privateSettings.dns_exceptions = group.rules
    .filter(rule => rule.match_type === 'dns_query')
    .map((rule, idx) => ({
      id: rule.id || `dns-${idx}`,
      name: rule.comment || rule.id || `DNS exception ${idx + 1}`,
      domains: [rule.pattern].filter(Boolean),
      action: rule.action,
      resolver: rule.resolver ?? 'system',
      enabled: rule.enabled,
      priority: (idx + 1) * 10,
      comment: rule.comment,
    }));

  return {
    ...base,
    group_id: group.group_id,
    group_name: group.group_name,
    private_access_settings: privateSettings,
  };
}

function normalizeMatchType(value: string): MatchType {
  if (value === 'process' || value === 'fqdn' || value === 'domain' || value === 'cidr' || value === 'url' || value === 'dns_query') return value;
  if (value === 'ip') return 'cidr';
  return 'domain';
}

function normalizeAction(value: string): RouteAction {
  if (value === 'tunnel' || value === 'block') return value;
  return 'bypass';
}
