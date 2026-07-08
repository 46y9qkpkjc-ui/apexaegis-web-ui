'use client';
import { useState } from 'react';
import {
  Key, Plus, Trash2, X, Copy, Shield, Eye, EyeOff, RefreshCw,
  CheckCircle, XCircle, Clock, Lock, Globe, Server, Users,
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────────── */
interface ApiClient {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  grantTypes: string[];
  scopes: string[];
  redirectUris: string[];
  tokenLifetime: number; // seconds
  refreshTokenLifetime: number;
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  lastUsed: string | null;
  createdBy: string;
  rateLimitRpm: number;
  allowedIps: string[];
  description: string;
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string; // first 8 chars shown
  scopes: string[];
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  lastUsed: string | null;
  expiresAt: string;
  createdBy: string;
  rateLimitRpm: number;
  allowedIps: string[];
}

interface TokenIssuance {
  id: string;
  clientName: string;
  grantType: string;
  issuedAt: string;
  expiresAt: string;
  scopes: string[];
  ip: string;
  status: 'active' | 'expired' | 'revoked';
}

/* ─── Demo data ─────────────────────────────────────────────── */
const demoClients: ApiClient[] = [
  {
    id: 'cli-1', name: 'Gateway Fleet Manager', clientId: 'gw-fleet-mgr-prod',
    clientSecret: 'aegis_sk_live_••••••••••••••••••••••••••••••••',
    grantTypes: ['client_credentials', 'authorization_code'], scopes: ['gateways:read', 'gateways:write', 'policies:read', 'tunnel:manage'],
    redirectUris: ['https://fleet.apexaegis.io/callback'], tokenLifetime: 3600, refreshTokenLifetime: 86400,
    status: 'active', createdAt: '2025-11-01 09:00', lastUsed: '2026-03-14 08:45', createdBy: 'admin@acme.com',
    rateLimitRpm: 1000, allowedIps: ['10.0.0.0/8', '172.16.0.0/12'],
    description: 'Production client for automated gateway provisioning and fleet health checks',
  },
  {
    id: 'cli-2', name: 'SIEM Integration (Splunk)', clientId: 'siem-splunk-prod',
    clientSecret: 'aegis_sk_live_••••••••••••••••••••••••••••••••',
    grantTypes: ['client_credentials'], scopes: ['logs:read', 'events:read', 'alerts:read'],
    redirectUris: [], tokenLifetime: 7200, refreshTokenLifetime: 0,
    status: 'active', createdAt: '2025-12-15 14:30', lastUsed: '2026-03-14 09:12', createdBy: 'soc-lead@acme.com',
    rateLimitRpm: 5000, allowedIps: ['10.0.5.50/32'],
    description: 'Read-only SIEM ingestion for log forwarding and threat correlation',
  },
  {
    id: 'cli-3', name: 'Terraform Provider', clientId: 'tf-provider-infra',
    clientSecret: 'aegis_sk_live_••••••••••••••••••••••••••••••••',
    grantTypes: ['client_credentials'], scopes: ['gateways:write', 'policies:write', 'certificates:write', 'dns:write', 'objects:write'],
    redirectUris: [], tokenLifetime: 1800, refreshTokenLifetime: 0,
    status: 'active', createdAt: '2026-01-10 08:00', lastUsed: '2026-03-13 16:20', createdBy: 'platform-eng@acme.com',
    rateLimitRpm: 500, allowedIps: ['10.0.10.0/24'],
    description: 'Infrastructure-as-code provider for CI/CD pipeline policy and gateway management',
  },
  {
    id: 'cli-4', name: 'Mobile App (PKCE)', clientId: 'mobile-app-ios',
    clientSecret: '', // public client
    grantTypes: ['authorization_code'], scopes: ['user:profile', 'tunnel:connect', 'device:register'],
    redirectUris: ['apexaegis://oauth/callback', 'https://mobile.apexaegis.io/callback'], tokenLifetime: 900, refreshTokenLifetime: 604800,
    status: 'active', createdAt: '2026-02-01 11:00', lastUsed: '2026-03-14 07:55', createdBy: 'mobile-team@acme.com',
    rateLimitRpm: 200, allowedIps: [],
    description: 'Public client (PKCE) for iOS/Android app — no client secret, uses code_verifier',
  },
  {
    id: 'cli-5', name: 'Legacy Webhook (Deprecated)', clientId: 'webhook-legacy-v1',
    clientSecret: 'aegis_sk_live_REVOKED_••••••••••••••••••••••••',
    grantTypes: ['client_credentials'], scopes: ['events:read'],
    redirectUris: [], tokenLifetime: 3600, refreshTokenLifetime: 0,
    status: 'revoked', createdAt: '2025-06-01 10:00', lastUsed: '2025-12-15 09:30', createdBy: 'admin@acme.com',
    rateLimitRpm: 100, allowedIps: [],
    description: 'Deprecated v1 webhook integration — revoked after migration to v2',
  },
];

const demoApiKeys: ApiKey[] = [
  { id: 'ak-1', name: 'CI/CD Pipeline', prefix: 'aegis_ak', scopes: ['policies:read', 'policies:write'], status: 'active', createdAt: '2026-01-05 08:00', lastUsed: '2026-03-14 06:00', expiresAt: '2027-01-05', createdBy: 'devops@acme.com', rateLimitRpm: 300, allowedIps: ['10.0.10.0/24'] },
  { id: 'ak-2', name: 'Monitoring Dashboard', prefix: 'aegis_ak', scopes: ['gateways:read', 'logs:read', 'events:read'], status: 'active', createdAt: '2026-02-10 14:00', lastUsed: '2026-03-14 09:15', expiresAt: '2027-02-10', createdBy: 'sre@acme.com', rateLimitRpm: 1000, allowedIps: [] },
  { id: 'ak-3', name: 'Partner SCION Gateway', prefix: 'aegis_ak', scopes: ['scion:isd', 'tunnel:manage', 'gateways:read'], status: 'active', createdAt: '2026-03-01 09:00', lastUsed: '2026-03-13 22:00', expiresAt: '2027-03-01', createdBy: 'partners@apexaegis.io', rateLimitRpm: 2000, allowedIps: ['203.0.113.0/24'] },
  { id: 'ak-4', name: 'Old Test Key', prefix: 'aegis_ak', scopes: ['logs:read'], status: 'expired', createdAt: '2025-03-01 09:00', lastUsed: '2025-09-01 10:00', expiresAt: '2025-09-01', createdBy: 'dev@acme.com', rateLimitRpm: 50, allowedIps: [] },
];

const demoTokens: TokenIssuance[] = [
  { id: 'tk-1', clientName: 'Gateway Fleet Manager', grantType: 'client_credentials', issuedAt: '2026-03-14 08:45', expiresAt: '2026-03-14 09:45', scopes: ['gateways:read', 'gateways:write'], ip: '10.0.1.42', status: 'active' },
  { id: 'tk-2', clientName: 'SIEM Integration (Splunk)', grantType: 'client_credentials', issuedAt: '2026-03-14 09:12', expiresAt: '2026-03-14 11:12', scopes: ['logs:read', 'events:read'], ip: '10.0.5.50', status: 'active' },
  { id: 'tk-3', clientName: 'Mobile App (PKCE)', grantType: 'authorization_code', issuedAt: '2026-03-14 07:55', expiresAt: '2026-03-14 08:10', scopes: ['user:profile', 'tunnel:connect'], ip: '192.168.1.15', status: 'expired' },
  { id: 'tk-4', clientName: 'Terraform Provider', grantType: 'client_credentials', issuedAt: '2026-03-13 16:20', expiresAt: '2026-03-13 16:50', scopes: ['gateways:write', 'policies:write'], ip: '10.0.10.5', status: 'expired' },
  { id: 'tk-5', clientName: 'Gateway Fleet Manager', grantType: 'client_credentials', issuedAt: '2026-03-13 14:00', expiresAt: '2026-03-13 15:00', scopes: ['policies:read', 'tunnel:manage'], ip: '10.0.1.42', status: 'expired' },
];

const availableScopes = [
  { group: 'Gateways', scopes: ['gateways:read', 'gateways:write', 'gateways:delete'] },
  { group: 'Policies', scopes: ['policies:read', 'policies:write', 'policies:delete'] },
  { group: 'Logs & Events', scopes: ['logs:read', 'events:read', 'alerts:read'] },
  { group: 'Identity', scopes: ['users:read', 'users:write', 'user:profile', 'device:register'] },
  { group: 'Tunnel & Network', scopes: ['tunnel:connect', 'tunnel:manage', 'dns:read', 'dns:write'] },
  { group: 'Certificates', scopes: ['certificates:read', 'certificates:write'] },
  { group: 'Objects', scopes: ['objects:read', 'objects:write'] },
  { group: 'SCION Partner', scopes: ['scion:isd', 'scion:path', 'scion:peering'] },
];

const statusColors: Record<string, string> = {
  active: 'bg-green-900/40 text-green-400 border-green-800',
  revoked: 'bg-red-900/40 text-red-400 border-red-800',
  expired: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
};

/* ─── Component ─────────────────────────────────────────────── */
export default function OAuthApiPage() {
  const [clients, setClients] = useState(demoClients);
  const [apiKeys, setApiKeys] = useState(demoApiKeys);
  const [activeTab, setActiveTab] = useState<'clients' | 'api-keys' | 'tokens' | 'server-config'>('clients');
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [revealSecret, setRevealSecret] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ApiClient | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDesc, setNewClientDesc] = useState('');
  const [newClientScopes, setNewClientScopes] = useState<string[]>([]);
  const [newClientGrants, setNewClientGrants] = useState<string[]>(['client_credentials']);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);

  const activeClients = clients.filter(c => c.status === 'active').length;
  const activeKeys = apiKeys.filter(k => k.status === 'active').length;

  const handleRevokeClient = (id: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, status: 'revoked' as const } : c));
    toast.success('Client revoked');
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' as const } : k));
    toast.success('API key revoked');
  };

  const handleCreateClient = () => {
    if (!newClientName) return;
    const client: ApiClient = {
      id: `cli-${Date.now()}`, name: newClientName, description: newClientDesc,
      clientId: newClientName.toLowerCase().replaceAll(/\s+/g, '-').replaceAll(/[^a-z0-9-]/g, ''),
      clientSecret: `aegis_sk_live_${Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 62)]).join('')}`,
      grantTypes: newClientGrants, scopes: newClientScopes, redirectUris: [],
      tokenLifetime: 3600, refreshTokenLifetime: 86400,
      status: 'active', createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      lastUsed: null, createdBy: 'admin@acme.com', rateLimitRpm: 500, allowedIps: [],
    };
    setClients(prev => [client, ...prev]);
    setShowCreateClient(false);
    setNewClientName('');
    setNewClientDesc('');
    setNewClientScopes([]);
    toast.success('OAuth client created');
  };

  const handleCreateKey = () => {
    if (!newKeyName) return;
    const key: ApiKey = {
      id: `ak-${Date.now()}`, name: newKeyName, prefix: 'aegis_ak',
      scopes: newKeyScopes, status: 'active',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      lastUsed: null, expiresAt: '2027-03-14', createdBy: 'admin@acme.com',
      rateLimitRpm: 500, allowedIps: [],
    };
    setApiKeys(prev => [key, ...prev]);
    setShowCreateKey(false);
    setNewKeyName('');
    setNewKeyScopes([]);
    toast.success('API key created');
  };

  const toggleScope = (scope: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key size={24} className="text-amber-400" />
          <div>
            <h1 className="text-xl font-semibold">OAuth 2.0 & API Authorization Server</h1>
            <p className="text-sm text-gray-500">Manage OAuth 2.0 clients, API keys, token issuance, and scope-based access control</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreateKey(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Create API Key
          </button>
          <button onClick={() => setShowCreateClient(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Register Client
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'OAuth Clients', value: clients.length, icon: Globe, color: 'text-amber-400' },
          { label: 'Active Clients', value: activeClients, icon: CheckCircle, color: 'text-green-400' },
          { label: 'API Keys', value: apiKeys.length, icon: Key, color: 'text-blue-400' },
          { label: 'Active Keys', value: activeKeys, icon: Shield, color: 'text-emerald-400' },
          { label: 'Available Scopes', value: availableScopes.reduce((s, g) => s + g.scopes.length, 0), icon: Lock, color: 'text-purple-400' },
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
          { key: 'clients' as const, label: 'OAuth 2.0 Clients', icon: Globe },
          { key: 'api-keys' as const, label: 'API Keys', icon: Key },
          { key: 'tokens' as const, label: 'Token Issuance Log', icon: Clock },
          { key: 'server-config' as const, label: 'Server Configuration', icon: Server },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ CLIENTS TAB ═══ */}
      {activeTab === 'clients' && (
        <div className="space-y-3">
          {clients.map(client => (
            <div key={client.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Globe size={16} className="text-amber-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{client.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${statusColors[client.status]}`}>{client.status.toUpperCase()}</span>
                      {!client.clientSecret && <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-900/30 text-cyan-400 border border-cyan-800">PUBLIC (PKCE)</span>}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{client.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {client.status === 'active' && (
                    <button onClick={() => handleRevokeClient(client.id)}
                      className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-xs border border-red-800 transition-colors">
                      Revoke
                    </button>
                  )}
                  <button onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors">
                    {selectedClient?.id === client.id ? 'Collapse' : 'Details'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="text-gray-500 mb-1">Client ID</div>
                  <div className="font-mono text-gray-300 flex items-center gap-1">
                    {client.clientId}
                    <button onClick={() => { navigator.clipboard.writeText(client.clientId); toast.success('Copied'); }}
                      className="text-gray-600 hover:text-gray-300"><Copy size={10} /></button>
                  </div>
                </div>
                <div className="p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="text-gray-500 mb-1">Grant Types</div>
                  <div className="flex flex-wrap gap-1">
                    {client.grantTypes.map(g => (
                      <span key={g} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px] border border-gray-700">{g}</span>
                    ))}
                  </div>
                </div>
                <div className="p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="text-gray-500 mb-1">Rate Limit</div>
                  <span className="text-gray-300">{client.rateLimitRpm} req/min</span>
                </div>
                <div className="p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="text-gray-500 mb-1">Last Used</div>
                  <span className="text-gray-300">{client.lastUsed ?? 'Never'}</span>
                </div>
              </div>

              {selectedClient?.id === client.id && (
                <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
                  {client.clientSecret && (
                    <div className="p-2.5 bg-gray-800/30 rounded-lg">
                      <div className="text-[10px] text-gray-500 mb-1">Client Secret</div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-gray-300">
                          {revealSecret === client.id ? client.clientSecret : '••••••••••••••••••••••••••••••••••••••'}
                        </code>
                        <button onClick={() => setRevealSecret(revealSecret === client.id ? null : client.id)}
                          className="text-gray-600 hover:text-gray-300">
                          {revealSecret === client.id ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(client.clientSecret); toast.success('Secret copied'); }}
                          className="text-gray-600 hover:text-gray-300"><Copy size={10} /></button>
                      </div>
                    </div>
                  )}
                  <div className="p-2.5 bg-gray-800/30 rounded-lg">
                    <div className="text-[10px] text-gray-500 mb-1">Scopes</div>
                    <div className="flex flex-wrap gap-1">
                      {client.scopes.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded bg-purple-900/20 text-purple-300 text-[10px] border border-purple-800/50">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Token Lifetime:</span> <span className="text-gray-300">{client.tokenLifetime}s</span></div>
                    <div className="p-2.5 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Refresh Lifetime:</span> <span className="text-gray-300">{client.refreshTokenLifetime > 0 ? `${client.refreshTokenLifetime}s` : 'Disabled'}</span></div>
                    <div className="p-2.5 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Created By:</span> <span className="text-gray-300">{client.createdBy}</span></div>
                  </div>
                  {client.allowedIps.length > 0 && (
                    <div className="p-2.5 bg-gray-800/30 rounded-lg">
                      <div className="text-[10px] text-gray-500 mb-1">Allowed IPs</div>
                      <div className="flex gap-1">{client.allowedIps.map(ip => (
                        <span key={ip} className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px] font-mono border border-gray-700">{ip}</span>
                      ))}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ API KEYS TAB ═══ */}
      {activeTab === 'api-keys' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Prefix</th>
                <th className="px-4 py-3 text-left">Scopes</th>
                <th className="px-4 py-3 text-center">Rate Limit</th>
                <th className="px-4 py-3 text-left">Last Used</th>
                <th className="px-4 py-3 text-left">Expires</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {apiKeys.map(key => (
                <tr key={key.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-medium">{key.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{key.prefix}_••••••••</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.map(s => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-purple-900/20 text-purple-300 text-[10px] border border-purple-800/50">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400">{key.rateLimitRpm}/min</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{key.lastUsed ?? 'Never'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{key.expiresAt}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${statusColors[key.status]}`}>{key.status.toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {key.status === 'active' && (
                      <button onClick={() => handleRevokeKey(key.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Revoke">
                        <XCircle size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ TOKENS TAB ═══ */}
      {activeTab === 'tokens' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Grant Type</th>
                <th className="px-4 py-3 text-left">Issued At</th>
                <th className="px-4 py-3 text-left">Expires At</th>
                <th className="px-4 py-3 text-left">Scopes</th>
                <th className="px-4 py-3 text-left">IP</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {demoTokens.map(token => (
                <tr key={token.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-medium">{token.clientName}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px] border border-gray-700">{token.grantType}</span></td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{token.issuedAt}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{token.expiresAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {token.scopes.map(s => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-purple-900/20 text-purple-300 text-[10px] border border-purple-800/50">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{token.ip}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${statusColors[token.status]}`}>{token.status.toUpperCase()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ SERVER CONFIG TAB ═══ */}
      {activeTab === 'server-config' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Server size={16} className="text-amber-400" /> Authorization Server Endpoints</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Issuer', value: 'https://auth.apexaegis.io' },
                { label: 'Authorization Endpoint', value: 'https://auth.apexaegis.io/oauth2/authorize' },
                { label: 'Token Endpoint', value: 'https://auth.apexaegis.io/oauth2/token' },
                { label: 'Revocation Endpoint', value: 'https://auth.apexaegis.io/oauth2/revoke' },
                { label: 'Introspection Endpoint', value: 'https://auth.apexaegis.io/oauth2/introspect' },
                { label: 'JWKS URI', value: 'https://auth.apexaegis.io/.well-known/jwks.json' },
                { label: 'OpenID Configuration', value: 'https://auth.apexaegis.io/.well-known/openid-configuration' },
                { label: 'UserInfo Endpoint', value: 'https://auth.apexaegis.io/oauth2/userinfo' },
              ].map(ep => (
                <div key={ep.label} className="p-3 bg-gray-800/30 rounded-lg">
                  <div className="text-gray-500 mb-1">{ep.label}</div>
                  <code className="text-gray-300 font-mono text-[11px] break-all">{ep.value}</code>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Shield size={16} className="text-green-400" /> Server Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {[
                { label: 'Token Signing Algorithm', value: 'RS256 (RSA-SHA256)' },
                { label: 'PKCE Required for Public Clients', value: 'Yes (S256)' },
                { label: 'Client Authentication', value: 'client_secret_post, client_secret_basic, private_key_jwt' },
                { label: 'Access Token Format', value: 'JWT (signed + encrypted)' },
                { label: 'Refresh Token Rotation', value: 'Enabled (one-time use)' },
                { label: 'Token Encryption', value: 'A256GCM (AES-256-GCM)' },
                { label: 'mTLS Token Binding', value: 'Supported (RFC 8705)' },
                { label: 'DPoP (Demonstrating Proof of Possession)', value: 'Supported (RFC 9449)' },
                { label: 'Key Rotation Interval', value: '90 days (next rotation: 2026-06-01)' },
              ].map(s => (
                <div key={s.label} className="p-3 bg-gray-800/30 rounded-lg">
                  <div className="text-gray-500 mb-1">{s.label}</div>
                  <span className="text-gray-300">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateClient && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" role="button" tabIndex={0} aria-label="Close" onClick={() => setShowCreateClient(false)} onKeyDown={e => e.key === 'Escape' && setShowCreateClient(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-h-[80vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Globe size={16} className="text-amber-400" /> Register OAuth 2.0 Client</h3>
              <button onClick={() => setShowCreateClient(false)} className="text-gray-400 hover:text-gray-200"><X size={16} /></button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs text-gray-400 mb-1" htmlFor="oc-name">Client Name</label>
                <input id="oc-name" value={newClientName} onChange={e => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-amber-500/50"
                  placeholder="e.g. Partner SCION Gateway" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1" htmlFor="oc-desc">Description</label>
                <input id="oc-desc" value={newClientDesc} onChange={e => setNewClientDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-amber-500/50"
                  placeholder="Purpose of this client" />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Grant Types</div>
                <div className="flex gap-2">
                  {['client_credentials', 'authorization_code', 'refresh_token'].map(g => (
                    <button key={g} onClick={() => toggleScope(g, setNewClientGrants)}
                      className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${newClientGrants.includes(g) ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-2">Scopes</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableScopes.map(group => (
                    <div key={group.group}>
                      <div className="text-[10px] text-gray-600 uppercase mb-1">{group.group}</div>
                      <div className="flex flex-wrap gap-1">
                        {group.scopes.map(s => (
                          <button key={s} onClick={() => toggleScope(s, setNewClientScopes)}
                            className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${newClientScopes.includes(s) ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreateClient(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleCreateClient} disabled={!newClientName.trim()} className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors">Register Client</button>
            </div>
          </div>
        </>
      )}

      {/* Create API Key Modal */}
      {showCreateKey && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" role="button" tabIndex={0} aria-label="Close" onClick={() => setShowCreateKey(false)} onKeyDown={e => e.key === 'Escape' && setShowCreateKey(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Key size={16} className="text-blue-400" /> Create API Key</h3>
              <button onClick={() => setShowCreateKey(false)} className="text-gray-400 hover:text-gray-200"><X size={16} /></button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs text-gray-400 mb-1" htmlFor="ak-name">Key Name</label>
                <input id="ak-name" value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
                  placeholder="e.g. Monitoring Dashboard" />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-2">Scopes</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableScopes.map(group => (
                    <div key={group.group}>
                      <div className="text-[10px] text-gray-600 uppercase mb-1">{group.group}</div>
                      <div className="flex flex-wrap gap-1">
                        {group.scopes.map(s => (
                          <button key={s} onClick={() => toggleScope(s, setNewKeyScopes)}
                            className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${newKeyScopes.includes(s) ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreateKey(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleCreateKey} disabled={!newKeyName.trim()} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors">Create Key</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
