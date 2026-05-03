'use client';
import React, { useState } from 'react';
import {
  Network, Users, Globe, Server, Shield, Search, Link2,
  Plus, Trash2, Save, ToggleLeft, ToggleRight, BarChart3,
  ArrowRight, AlertTriangle,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ─────────────────────────────────────────────────── */
interface RouteRule {
  id: string;
  match_type: 'process' | 'fqdn' | 'domain' | 'url' | 'dns_query';
  pattern: string;
  action: 'bypass' | 'tunnel' | 'block';
  enabled: boolean;
  comment: string;
}

interface RouteGroupConfig {
  group_id: string;
  group_name: string;
  version: number;
  rules: RouteRule[];
  updated_by: string;
  updated_at: string;
}

/* ─── Demo data ─────────────────────────────────────────────── */
const demoConfigs: RouteGroupConfig[] = [
  {
    group_id: 'default', group_name: 'Default', version: 1,
    rules: [
      { id: 'r1', match_type: 'domain', pattern: '*.microsoft.com', action: 'bypass', enabled: true, comment: 'Microsoft 365 direct' },
      { id: 'r2', match_type: 'domain', pattern: '*.office.com', action: 'bypass', enabled: true, comment: 'Office 365' },
      { id: 'r3', match_type: 'process', pattern: 'Teams.exe', action: 'bypass', enabled: true, comment: 'Teams media bypass' },
      { id: 'r4', match_type: 'fqdn', pattern: 'zoom.us', action: 'bypass', enabled: true, comment: 'Zoom meetings' },
      { id: 'r5', match_type: 'domain', pattern: '10.0.0.0/8', action: 'bypass', enabled: true, comment: 'Internal RFC1918' },
      { id: 'r6', match_type: 'dns_query', pattern: '*.local', action: 'bypass', enabled: true, comment: 'mDNS local' },
    ],
    updated_by: 'system', updated_at: '2026-03-12T08:50:00Z',
  },
  {
    group_id: 'engineering', group_name: 'Engineering', version: 1,
    rules: [
      { id: 'r1', match_type: 'domain', pattern: '*.github.com', action: 'bypass', enabled: true, comment: 'GitHub direct' },
      { id: 'r2', match_type: 'domain', pattern: '*.githubusercontent.com', action: 'bypass', enabled: true, comment: 'GitHub CDN' },
      { id: 'r3', match_type: 'process', pattern: 'docker', action: 'bypass', enabled: true, comment: 'Docker daemon' },
      { id: 'r4', match_type: 'process', pattern: 'kubectl', action: 'bypass', enabled: true, comment: 'Kubernetes CLI' },
      { id: 'r5', match_type: 'fqdn', pattern: 'registry.npmjs.org', action: 'bypass', enabled: true, comment: 'npm registry' },
      { id: 'r6', match_type: 'domain', pattern: '10.0.0.0/8', action: 'bypass', enabled: true, comment: 'Internal RFC1918' },
      { id: 'r7', match_type: 'url', pattern: 'https://pypi.org/*', action: 'bypass', enabled: true, comment: 'PyPI' },
      { id: 'r8', match_type: 'dns_query', pattern: '*.internal.acme.com', action: 'tunnel', enabled: true, comment: 'Internal DNS through tunnel' },
    ],
    updated_by: 'system', updated_at: '2026-03-12T08:50:00Z',
  },
  {
    group_id: 'executives', group_name: 'Executives', version: 1,
    rules: [
      { id: 'r1', match_type: 'domain', pattern: '*.microsoft.com', action: 'bypass', enabled: true, comment: 'Microsoft 365' },
      { id: 'r2', match_type: 'process', pattern: 'Teams.exe', action: 'bypass', enabled: true, comment: 'Teams media' },
      { id: 'r3', match_type: 'domain', pattern: '10.0.0.0/8', action: 'bypass', enabled: true, comment: 'Internal' },
    ],
    updated_by: 'admin@acme.com', updated_at: '2026-03-13T14:00:00Z',
  },
  {
    group_id: 'contractors', group_name: 'Contractors', version: 1,
    rules: [
      { id: 'r1', match_type: 'domain', pattern: '10.0.0.0/8', action: 'bypass', enabled: true, comment: 'Internal only' },
    ],
    updated_by: 'admin@acme.com', updated_at: '2026-03-14T07:00:00Z',
  },
];

/* ─── Helpers ───────────────────────────────────────────────── */
const matchTypeIcons: Record<string, typeof Globe> = {
  process: Server,
  fqdn: Globe,
  domain: Network,
  url: Link2,
  dns_query: Search,
};

const matchTypeLabels: Record<string, string> = {
  process: 'Process',
  fqdn: 'FQDN',
  domain: 'Domain / CIDR',
  url: 'URL Pattern',
  dns_query: 'DNS Query',
};

const actionColors: Record<string, string> = {
  bypass: 'bg-green-900/30 text-green-400 border-green-800',
  tunnel: 'bg-blue-900/30 text-blue-400 border-blue-800',
  block: 'bg-red-900/30 text-red-400 border-red-800',
};

/* ─── Component ─────────────────────────────────────────────── */
export default function RouteConfigPage() {
  const [configs, setConfigs] = useState<RouteGroupConfig[]>(demoConfigs);
  const [selectedGroup, setSelectedGroup] = useState<string>('default');
  const [dirty, setDirty] = useState(false);

  const config = configs.find(c => c.group_id === selectedGroup)!;

  const updateRules = (newRules: RouteRule[]) => {
    setConfigs(prev => prev.map(c =>
      c.group_id === selectedGroup ? { ...c, rules: newRules } : c
    ));
    setDirty(true);
  };

  const addRule = () => {
    const newId = `r${Date.now()}`;
    updateRules([...config.rules, {
      id: newId,
      match_type: 'domain',
      pattern: '',
      action: 'bypass',
      enabled: true,
      comment: '',
    }]);
  };

  const removeRule = (id: string) => {
    updateRules(config.rules.filter(r => r.id !== id));
  };

  const updateRule = (id: string, patch: Partial<RouteRule>) => {
    updateRules(config.rules.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const handleSave = () => {
    setDirty(false);
    setConfigs(prev => prev.map(c => c.group_id === selectedGroup
      ? { ...c, version: c.version + 1, updated_by: 'admin@acme.com', updated_at: new Date().toISOString() }
      : c
    ));
  };

  // Stats
  const bypassCount = config.rules.filter(r => r.action === 'bypass' && r.enabled).length;
  const tunnelCount = config.rules.filter(r => r.action === 'tunnel' && r.enabled).length;
  const blockCount = config.rules.filter(r => r.action === 'block' && r.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="text-purple-400" size={24} />
            Route Configuration
          </h1>
          <p className="text-sm text-gray-400 mt-1">Per-group routing rules — bypass by process, FQDN, domain, URL, or DNS query</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Save size={14} /> Save v{config.version + 1}
            </button>
          )}
          <button
            onClick={addRule}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm border border-gray-700 transition-colors"
          >
            <Plus size={14} /> Add Rule
          </button>
        </div>
      </div>

      {/* Group selector */}
      <div className="flex gap-2">
        {configs.map(c => (
          <button
            key={c.group_id}
            onClick={() => { setSelectedGroup(c.group_id); setDirty(false); }}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
              selectedGroup === c.group_id
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-gray-200'
            )}
          >
            <Users size={12} className="inline mr-1.5" />
            {c.group_name}
            <span className="ml-2 text-xs opacity-60">({c.rules.length})</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="px-3 py-1.5 bg-gray-900/50 border border-gray-800 rounded-lg text-xs text-gray-400">
          Total Rules: <span className="text-white font-medium">{config.rules.length}</span>
        </div>
        <div className="px-3 py-1.5 bg-green-900/20 border border-green-900/30 rounded-lg text-xs text-green-400">
          Bypass: <span className="font-medium">{bypassCount}</span>
        </div>
        <div className="px-3 py-1.5 bg-blue-900/20 border border-blue-900/30 rounded-lg text-xs text-blue-400">
          Tunnel: <span className="font-medium">{tunnelCount}</span>
        </div>
        <div className="px-3 py-1.5 bg-red-900/20 border border-red-900/30 rounded-lg text-xs text-red-400">
          Block: <span className="font-medium">{blockCount}</span>
        </div>
        <div className="ml-auto px-3 py-1.5 bg-gray-900/50 border border-gray-800 rounded-lg text-xs text-gray-500">
          Version: v{config.version}
        </div>
      </div>

      {/* Rules table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 w-10">On</th>
              <th className="px-4 py-3 w-36">Match Type</th>
              <th className="px-4 py-3">Pattern</th>
              <th className="px-4 py-3 w-28">Action</th>
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
                    <select
                      value={rule.match_type}
                      onChange={e => updateRule(rule.id, { match_type: e.target.value as RouteRule['match_type'] })}
                      className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-blue-600"
                    >
                      {Object.entries(matchTypeLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <MtIcon size={12} className="text-gray-500 flex-shrink-0" />
                      <input
                        type="text"
                        value={rule.pattern}
                        onChange={e => updateRule(rule.id, { pattern: e.target.value })}
                        placeholder="e.g. *.example.com"
                        className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 font-mono focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={rule.action}
                      onChange={e => updateRule(rule.id, { action: e.target.value as RouteRule['action'] })}
                      className={clsx(
                        'w-full px-2 py-1.5 rounded text-xs font-medium border focus:outline-none',
                        actionColors[rule.action]
                      )}
                    >
                      <option value="bypass">Bypass</option>
                      <option value="tunnel">Tunnel</option>
                      <option value="block">Block</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={rule.comment}
                      onChange={e => updateRule(rule.id, { comment: e.target.value })}
                      placeholder="Description..."
                      className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 focus:outline-none focus:border-blue-600"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => removeRule(rule.id)}
                      className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                    >
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
            No routing rules defined — all traffic will be tunneled through the gateway
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-600 flex items-center gap-4">
        <span>Last updated by {config.updated_by}</span>
        <span>{new Date(config.updated_at).toLocaleString()}</span>
        <span>Version: v{config.version}</span>
      </div>
    </div>
  );
}
