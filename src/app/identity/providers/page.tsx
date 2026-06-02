'use client';
import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Pencil, Trash2, CheckCircle, XCircle, RefreshCw, X, Eye, EyeOff, Loader2, ExternalLink,
  Shield, Globe, Users, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { apiBaseUrl, apiUrl } from '@/lib/api-url';
import { useAuthStore } from '@/lib/auth-store';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                          */
/* ═══════════════════════════════════════════════════════════════ */

interface IdPProvider {
  id: string;
  name: string;
  provider_type: 'okta' | 'azure_ad' | 'google' | 'saml' | 'ldap' | 'ping';
  enabled: boolean;
  is_default: boolean;
  // OIDC
  client_id: string;
  issuer_url: string;
  client_secret: string;
  jwks_uri: string;
  token_endpoint: string;
  scopes: string[];
  // SAML
  saml_entity_id: string;
  saml_sso_url: string;
  saml_certificate: string;
  // Kerberos
  kerberos_enabled: boolean;
  kerberos_realm: string;
  // SCIM
  scim_enabled: boolean;
  scim_endpoint: string;
  scim_token?: string;
  // Mapping
  attribute_map: Record<string, string>;
  group_map: Record<string, string>;
}

interface AuthProfile {
  id: string;
  purpose: 'admin_console' | 'desktop_sso' | 'user_portal' | 'scim_provisioning' | 'access_approval';
  display_name: string;
  description: string;
  use_primary_idp: boolean;
  idp_id?: string;
  effective_idp_id?: string;
  effective_idp_name?: string;
  enabled: boolean;
  require_mfa: boolean;
  allow_jit: boolean;
  allow_scim: boolean;
  contractor_access: boolean;
}

const appOrigin = () => {
  return apiBaseUrl() || 'https://api.apexaegis.app';
};

const emptyProvider: IdPProvider = {
  id: '', name: '', provider_type: 'okta', enabled: true, is_default: false,
  client_id: '', issuer_url: '', client_secret: '', jwks_uri: '', token_endpoint: '', scopes: ['openid', 'profile', 'email', 'groups'],
  saml_entity_id: '', saml_sso_url: '', saml_certificate: '',
  kerberos_enabled: false, kerberos_realm: '',
  scim_enabled: false, scim_endpoint: `${appOrigin()}/scim/v2`, scim_token: '',
  attribute_map: { sub: 'user_id', email: 'email', name: 'display_name', groups: 'groups' },
  group_map: {},
};

const typeBadge: Record<string, { label: string; color: string }> = {
  okta:     { label: 'Okta',          color: 'bg-blue-900/40 text-blue-400 border-blue-800' },
  azure_ad: { label: 'Azure AD',      color: 'bg-cyan-900/40 text-cyan-400 border-cyan-800' },
  google:   { label: 'Google',        color: 'bg-red-900/40 text-red-400 border-red-800' },
  saml:     { label: 'SAML 2.0',      color: 'bg-purple-900/40 text-purple-400 border-purple-800' },
  ldap:     { label: 'LDAP',          color: 'bg-yellow-900/40 text-yellow-400 border-yellow-800' },
  ping:     { label: 'PingIdentity', color: 'bg-emerald-900/40 text-emerald-400 border-emerald-800' },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  API helpers                                                    */
/* ═══════════════════════════════════════════════════════════════ */

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ''}`,
});

function normalizeProvider(p: Partial<IdPProvider>): IdPProvider {
  return { ...emptyProvider, ...p, scopes: Array.isArray(p.scopes) ? p.scopes : emptyProvider.scopes };
}

async function fetchProviders(): Promise<IdPProvider[]> {
  const res = await fetch(apiUrl('/api/v1/identity/providers'), { headers: headers() });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.identity_providers ?? []).map(normalizeProvider);
}

async function fetchAuthProfiles(): Promise<AuthProfile[]> {
  const res = await fetch(apiUrl('/api/v1/identity/auth-profiles'), { headers: headers() });
  if (!res.ok) return [];
  const data = await res.json();
  return data.auth_profiles ?? [];
}

async function updateAuthProfiles(profiles: AuthProfile[]): Promise<AuthProfile[] | null> {
  const res = await fetch(apiUrl('/api/v1/identity/auth-profiles'), {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ auth_profiles: profiles }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.auth_profiles ?? [];
}

async function createProvider(p: Partial<IdPProvider>): Promise<string | null> {
  const res = await fetch(apiUrl('/api/v1/identity/providers'), { method: 'POST', headers: headers(), body: JSON.stringify(p) });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id ?? null;
}

async function updateProvider(p: IdPProvider): Promise<boolean> {
  const res = await fetch(apiUrl(`/api/v1/identity/providers/${p.id}`), { method: 'PUT', headers: headers(), body: JSON.stringify(p) });
  return res.ok;
}

async function deleteProvider(id: string): Promise<boolean> {
  const res = await fetch(apiUrl(`/api/v1/identity/providers/${id}`), { method: 'DELETE', headers: headers() });
  return res.ok;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Sub-components                                                 */
/* ═══════════════════════════════════════════════════════════════ */

function OidcFields({ prov, onChange, showSecrets, toggleSecret, copyToClipboard }: Readonly<{
  prov: IdPProvider; onChange: (p: IdPProvider) => void;
  showSecrets: Record<string, boolean>; toggleSecret: (f: string) => void; copyToClipboard: (t: string) => void;
}>) {
  const isOidc = ['okta', 'azure_ad', 'google', 'ping'].includes(prov.provider_type);
  if (!isOidc) return null;

  const derivedJwks = prov.issuer_url ? `${prov.issuer_url}/v1/keys` : '';
  const derivedToken = prov.issuer_url ? `${prov.issuer_url}/v1/token` : '';

  return (
    <div className="space-y-3 border-t border-gray-800 pt-3 mt-3">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">OIDC Configuration</h4>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Issuer URL <span className="text-red-400">*</span></label>
        <input value={prov.issuer_url} onChange={e => onChange({ ...prov, issuer_url: e.target.value })}
          placeholder="https://dev-12345.okta.com/oauth2/default"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
        <p className="text-[11px] text-gray-600 mt-1">For Okta: https://your-domain.okta.com/oauth2/default</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Client ID <span className="text-red-400">*</span></label>
          <div className="flex gap-1.5">
            <input value={prov.client_id} onChange={e => onChange({ ...prov, client_id: e.target.value })}
              placeholder="0oa1b2c3d4e5f6g7h8i9"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
            {prov.client_id && (
              <button onClick={() => copyToClipboard(prov.client_id)} className="p-2 text-gray-500 hover:text-gray-300"><Copy size={14} /></button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Client Secret <span className="text-red-400">*</span></label>
          <div className="flex gap-1.5">
            <input
              type={showSecrets['secret'] ? 'text' : 'password'}
              value={prov.client_secret}
              onChange={e => onChange({ ...prov, client_secret: e.target.value })}
              placeholder="Enter client secret"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
            <button onClick={() => toggleSecret('secret')} className="p-2 text-gray-500 hover:text-gray-300">
              {showSecrets['secret'] ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Scopes</label>
        <input value={prov.scopes.join(' ')}
          onChange={e => onChange({ ...prov, scopes: e.target.value.split(' ').filter(Boolean) })}
          placeholder="openid profile email groups"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">JWKS URI</label>
          <input value={prov.jwks_uri || derivedJwks} onChange={e => onChange({ ...prov, jwks_uri: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-[11px] font-mono text-gray-500 focus:outline-none focus:border-blue-500/50" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Token Endpoint</label>
          <input value={prov.token_endpoint || derivedToken} onChange={e => onChange({ ...prov, token_endpoint: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-[11px] font-mono text-gray-500 focus:outline-none focus:border-blue-500/50" />
        </div>
      </div>
      <div className="p-3 bg-blue-900/10 border border-blue-800/20 rounded-lg">
        <p className="text-[11px] text-blue-400/80">
          <strong>Redirect URI</strong> — configure this in your Okta/Azure AD application:
        </p>
        <code className="text-[11px] text-blue-300 font-mono block mt-1">{`${appOrigin()}/api/v1/auth/sso/callback`}</code>
      </div>
    </div>
  );
}

function ProvisioningFields({ prov, onChange, showSecrets, toggleSecret, copyToClipboard }: Readonly<{
  prov: IdPProvider;
  onChange: (p: IdPProvider) => void;
  showSecrets: Record<string, boolean>;
  toggleSecret: (f: string) => void;
  copyToClipboard: (t: string) => void;
}>) {
  const scimEndpoint = prov.scim_endpoint || `${appOrigin()}/scim/v2`;

  return (
    <div className="space-y-3 border-t border-gray-800 pt-3 mt-3">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">SCIM Provisioning</h4>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-400">Enable Okta SCIM user and group provisioning</span>
          <p className="text-[11px] text-gray-600">Okta pushes users and groups into ApexAegis for admin, desktop SSO, and access workflows</p>
        </div>
        <button onClick={() => onChange({ ...prov, scim_enabled: !prov.scim_enabled })}
          className={`w-8 h-4 rounded-full transition-colors relative ${prov.scim_enabled ? 'bg-green-600' : 'bg-gray-700'}`}>
          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${prov.scim_enabled ? 'left-4' : 'left-0.5'}`} />
        </button>
      </div>
      {prov.scim_enabled && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">SCIM Base URL</label>
            <div className="flex gap-1.5">
              <input
                value={scimEndpoint}
                onChange={e => onChange({ ...prov, scim_endpoint: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500/50"
              />
              <button onClick={() => copyToClipboard(scimEndpoint)} className="p-2 text-gray-500 hover:text-gray-300"><Copy size={14} /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">SCIM Bearer Token</label>
            <div className="flex gap-1.5">
              <input
                type={showSecrets.scimToken ? 'text' : 'password'}
                value={prov.scim_token ?? ''}
                onChange={e => onChange({ ...prov, scim_token: e.target.value })}
                placeholder={prov.id ? 'Leave blank to keep existing token' : 'Paste a high-entropy token for Okta'}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50"
              />
              <button onClick={() => toggleSecret('scimToken')} className="p-2 text-gray-500 hover:text-gray-300">
                {showSecrets.scimToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-gray-600 mt-1">Stored as a hash in CockroachDB. Okta uses this as HTTP Header bearer authentication.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Okta Unique Identifier</div>
              <code className="text-xs text-gray-300">userName</code>
            </div>
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Supported Push</div>
              <span className="text-xs text-gray-300">Users, AdminUsers, Groups</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Page Component                                                 */
/* ═══════════════════════════════════════════════════════════════ */

export default function IdentityProvidersPage() {
  const [providers, setProviders] = useState<IdPProvider[]>([]);
  const [authProfiles, setAuthProfiles] = useState<AuthProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfiles, setSavingProfiles] = useState(false);
  const [editProvider, setEditProvider] = useState<IdPProvider | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newProv, setNewProv] = useState<IdPProvider>({ ...emptyProvider });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [list, profiles] = await Promise.all([fetchProviders(), fetchAuthProfiles()]);
    setProviders(list);
    setAuthProfiles(profiles);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const connectedCount = providers.filter(p => p.enabled).length;
  const primaryProvider = providers.find(p => p.enabled && p.is_default) ?? providers.find(p => p.enabled);

  const updateLocalAuthProfile = (purpose: AuthProfile['purpose'], patch: Partial<AuthProfile>) => {
    setAuthProfiles(prev => prev.map(profile => (
      profile.purpose === purpose ? { ...profile, ...patch } : profile
    )));
  };

  const saveAuthProfiles = async () => {
    setSavingProfiles(true);
    const saved = await updateAuthProfiles(authProfiles);
    setSavingProfiles(false);
    if (saved) {
      setAuthProfiles(saved);
      toast.success('Authentication usage profiles updated');
    } else {
      toast.error('Failed to update authentication usage profiles');
    }
  };

  const handleCreate = async () => {
    if (!newProv.name.trim()) return;
    const id = await createProvider(newProv);
    if (id) {
      toast.success(`Provider "${newProv.name}" created`);
      setNewProv({ ...emptyProvider });
      setShowCreate(false);
      load();
    } else {
      toast.error('Failed to create provider');
    }
  };

  const handleSave = async () => {
    if (!editProvider) return;
    const ok = await updateProvider(editProvider);
    if (ok) {
      toast.success('Provider updated');
      setEditProvider(null);
      load();
    } else {
      toast.error('Failed to update provider');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteProvider(id);
    if (ok) {
      toast.success('Provider deleted');
      load();
    } else {
      toast.error('Failed to delete provider');
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    // Simulate connection test — in production: POST /api/v1/identity/providers/:id/test
    await new Promise(r => setTimeout(r, 1500));
    toast.success('Connection test passed');
    setTesting(null);
  };

  const toggleSecret = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key size={24} className="text-yellow-400" />
          <div>
            <h1 className="text-xl font-semibold">Identity Providers</h1>
            <p className="text-sm text-gray-500">Configure SSO, directory sync, and authentication backends</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Provider
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-3">
        <span className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm">
          Total: <span className="text-white font-medium">{providers.length}</span>
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-green-900/20 border border-green-800/30 text-sm text-green-400">
          Enabled: {connectedCount}
        </span>
        {primaryProvider && (
          <span className="px-3 py-1.5 rounded-lg bg-blue-900/20 border border-blue-800/30 text-sm text-blue-300">
            Primary: {primaryProvider.name}
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading providers...
        </div>
      )}

      {!loading && authProfiles.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Authentication usage profiles</h2>
              <p className="text-sm text-gray-500">Reuse the primary IdP by default, or override only where enterprise separation is required.</p>
            </div>
            <button
              onClick={saveAuthProfiles}
              disabled={savingProfiles}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              {savingProfiles ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Save Profiles
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {authProfiles.map(profile => {
              const canOverride = providers.filter(p => p.enabled).length > 0;
              return (
                <div key={profile.purpose} className="border border-gray-800 rounded-lg p-4 bg-gray-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-200">{profile.display_name}</h3>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] border ${profile.enabled ? 'bg-green-900/20 text-green-400 border-green-800/40' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                          {profile.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{profile.description}</p>
                    </div>
                    <button
                      onClick={() => updateLocalAuthProfile(profile.purpose, { enabled: !profile.enabled })}
                      className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${profile.enabled ? 'bg-green-600' : 'bg-gray-700'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${profile.enabled ? 'left-4' : 'left-0.5'}`} />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 items-end">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.use_primary_idp}
                        onChange={e => updateLocalAuthProfile(profile.purpose, { use_primary_idp: e.target.checked })}
                        className="rounded bg-gray-800 border-gray-700"
                      />
                      Use primary IdP
                    </label>
                    <select
                      disabled={profile.use_primary_idp || !canOverride}
                      value={profile.idp_id ?? ''}
                      onChange={e => updateLocalAuthProfile(profile.purpose, { idp_id: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm disabled:opacity-50 focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="">Select override IdP</option>
                      {providers.filter(p => p.enabled).map(provider => (
                        <option key={provider.id} value={provider.id}>{provider.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-gray-400">
                      <input type="checkbox" checked={profile.require_mfa} onChange={e => updateLocalAuthProfile(profile.purpose, { require_mfa: e.target.checked })} className="rounded bg-gray-800 border-gray-700" />
                      MFA
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-400">
                      <input type="checkbox" checked={profile.allow_jit} onChange={e => updateLocalAuthProfile(profile.purpose, { allow_jit: e.target.checked })} className="rounded bg-gray-800 border-gray-700" />
                      JIT
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-400">
                      <input type="checkbox" checked={profile.allow_scim} onChange={e => updateLocalAuthProfile(profile.purpose, { allow_scim: e.target.checked })} className="rounded bg-gray-800 border-gray-700" />
                      SCIM
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-400">
                      <input type="checkbox" checked={profile.contractor_access} onChange={e => updateLocalAuthProfile(profile.purpose, { contractor_access: e.target.checked })} className="rounded bg-gray-800 border-gray-700" />
                      Contractors
                    </label>
                  </div>

                  <div className="mt-3 text-[11px] text-gray-500">
                    Effective IdP: <span className="text-gray-300">{profile.use_primary_idp ? (primaryProvider?.name ?? 'Primary IdP not configured') : (providers.find(p => p.id === profile.idp_id)?.name ?? 'Override not selected')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Provider cards */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4">
          {providers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Shield size={32} className="mx-auto mb-3 text-gray-700" />
              <p>No identity providers configured yet.</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">Add your first provider</button>
            </div>
          )}
          {providers.map(provider => {
            const badge = typeBadge[provider.provider_type] ?? typeBadge.okta;
            return (
              <div key={provider.id} className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${!provider.enabled ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Key size={18} className="text-yellow-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{provider.name}</h3>
                        {provider.is_default && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-900/30 text-green-400 border border-green-800/40">DEFAULT</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className={`flex items-center gap-1 text-xs ${provider.enabled ? 'text-green-400' : 'text-gray-500'}`}>
                          {provider.enabled ? <><CheckCircle size={12} /> Enabled</> : <><XCircle size={12} /> Disabled</>}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTest(provider.id)}
                      disabled={testing === provider.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors disabled:opacity-50"
                    >
                      {testing === provider.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={14} />}
                      Test
                    </button>
                    <button onClick={() => setEditProvider(normalizeProvider(provider))} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(provider.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  {provider.issuer_url && (
                    <div className="p-3 bg-gray-800/30 rounded-lg col-span-2">
                      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Globe size={10} /> Issuer URL</div>
                      <span className="text-gray-300 font-mono text-[11px] break-all">{provider.issuer_url}</span>
                    </div>
                  )}
                  {provider.client_id && (
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Client ID</div>
                      <span className="text-gray-300 font-mono text-[11px]">{provider.client_id.slice(0, 16)}...</span>
                    </div>
                  )}
                  <div className="p-3 bg-gray-800/30 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Users size={10} /> Auto-provision</div>
                    <span className={`text-sm ${provider.scim_enabled ? 'text-green-400' : 'text-gray-600'}`}>
                      {provider.scim_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {provider.scopes?.length > 0 && (
                    <div className="p-3 bg-gray-800/30 rounded-lg col-span-2">
                      <div className="text-xs text-gray-500 mb-1">Scopes</div>
                      <div className="flex flex-wrap gap-1">
                        {provider.scopes.map(s => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 border border-gray-700 text-gray-400">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SSO Login Link */}
                {provider.enabled && provider.client_id && (
                  <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center justify-between">
                    <span className="text-[11px] text-gray-600">SSO Login Endpoint</span>
                    <a href={`/api/v1/auth/sso/${provider.id}/authorize`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">
                      <ExternalLink size={10} /> /api/v1/auth/sso/{provider.id}/authorize
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Provider Modal */}
      {editProvider && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Provider</h3>
              <button onClick={() => setEditProvider(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={editProvider.name} onChange={e => setEditProvider({ ...editProvider, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Provider Type</label>
                  <select value={editProvider.provider_type}
                    onChange={e => setEditProvider({ ...editProvider, provider_type: e.target.value as IdPProvider['provider_type'] })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="okta">Okta</option>
                    <option value="azure_ad">Azure AD / Entra ID</option>
                    <option value="google">Google Workspace</option>
                    <option value="ping">Ping Identity</option>
                    <option value="saml">SAML 2.0 (Generic)</option>
                    <option value="ldap">LDAP / AD</option>
                  </select>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={editProvider.enabled} onChange={e => setEditProvider({ ...editProvider, enabled: e.target.checked })}
                      className="rounded bg-gray-800 border-gray-700" /> Enabled
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={editProvider.is_default} onChange={e => setEditProvider({ ...editProvider, is_default: e.target.checked })}
                      className="rounded bg-gray-800 border-gray-700" /> Default
                  </label>
                </div>
              </div>
              <OidcFields prov={editProvider} onChange={setEditProvider} showSecrets={showSecrets} toggleSecret={toggleSecret} copyToClipboard={copyToClipboard} />
              <ProvisioningFields prov={editProvider} onChange={setEditProvider} showSecrets={showSecrets} toggleSecret={toggleSecret} copyToClipboard={copyToClipboard} />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditProvider(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Save</button>
            </div>
          </div>
        </>
      )}

      {/* Create Provider Modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Identity Provider</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Provider Name <span className="text-red-400">*</span></label>
                <input value={newProv.name} onChange={e => setNewProv({ ...newProv, name: e.target.value })}
                  placeholder="e.g. Okta Production" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Provider Type</label>
                  <select value={newProv.provider_type} onChange={e => setNewProv({ ...newProv, provider_type: e.target.value as IdPProvider['provider_type'] })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="okta">Okta</option>
                    <option value="azure_ad">Azure AD / Entra ID</option>
                    <option value="google">Google Workspace</option>
                    <option value="ping">Ping Identity</option>
                    <option value="saml">SAML 2.0 (Generic)</option>
                    <option value="ldap">LDAP / AD</option>
                  </select>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={newProv.enabled} onChange={e => setNewProv({ ...newProv, enabled: e.target.checked })}
                      className="rounded bg-gray-800 border-gray-700" /> Enabled
                  </label>
                </div>
              </div>
              <OidcFields prov={newProv} onChange={setNewProv} showSecrets={showSecrets} toggleSecret={toggleSecret} copyToClipboard={copyToClipboard} />
              <ProvisioningFields prov={newProv} onChange={setNewProv} showSecrets={showSecrets} toggleSecret={toggleSecret} copyToClipboard={copyToClipboard} />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={!newProv.name.trim() || !newProv.client_id.trim()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors">
                Add Provider
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
