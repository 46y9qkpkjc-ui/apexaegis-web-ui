'use client';
import { useState } from 'react';
import { Key, Shield, Upload, Download, RefreshCw, CheckCircle, XCircle, X, Eye, EyeOff, Copy, Plus } from 'lucide-react';

type IdpType = 'saml' | 'oidc' | 'ldap' | 'radius';

interface IdpConfig {
  id: string;
  name: string;
  type: IdpType;
  enabled: boolean;
  // SAML fields
  samlEntityId?: string;
  samlSsoUrl?: string;
  samlSloUrl?: string;
  samlCertificate?: string;
  samlMetadataUrl?: string;
  samlNameIdFormat?: string;
  samlSignRequests?: boolean;
  // OIDC fields
  oidcClientId?: string;
  oidcClientSecret?: string;
  oidcDiscoveryUrl?: string;
  oidcAuthorizationEndpoint?: string;
  oidcTokenEndpoint?: string;
  oidcUserInfoEndpoint?: string;
  oidcScopes?: string[];
  oidcResponseType?: string;
  // LDAP fields
  ldapHost?: string;
  ldapPort?: number;
  ldapBaseDn?: string;
  ldapBindDn?: string;
  ldapBindPassword?: string;
  ldapUserFilter?: string;
  ldapGroupFilter?: string;
  ldapUseSsl?: boolean;
  // RADIUS fields
  radiusHost?: string;
  radiusPort?: number;
  radiusSecret?: string;
  radiusTimeout?: number;
  radiusRetries?: number;
  // Common
  domain: string;
  mfaEnforced: boolean;
  autoProvision: boolean;
  groupMapping: { idpGroup: string; localGroup: string }[];
  attributeMapping: { idpAttribute: string; localAttribute: string }[];
  lastTestResult?: 'success' | 'failed' | 'untested';
}

const demoConfigs: IdpConfig[] = [
  {
    id: '1', name: 'Okta Production', type: 'saml', enabled: true,
    samlEntityId: 'https://acme.okta.com/app/exk1234567890',
    samlSsoUrl: 'https://acme.okta.com/app/exk1234567890/sso/saml',
    samlSloUrl: 'https://acme.okta.com/app/exk1234567890/slo/saml',
    samlCertificate: '-----BEGIN CERTIFICATE-----\nMIIDpDCCAoygAwIBAgIGAX...\n-----END CERTIFICATE-----',
    samlMetadataUrl: 'https://acme.okta.com/app/exk1234567890/sso/saml/metadata',
    samlNameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    samlSignRequests: true,
    domain: 'acme.okta.com', mfaEnforced: true, autoProvision: true,
    groupMapping: [
      { idpGroup: 'Engineering', localGroup: 'Engineering' },
      { idpGroup: 'IT-Security', localGroup: 'Security' },
    ],
    attributeMapping: [
      { idpAttribute: 'email', localAttribute: 'email' },
      { idpAttribute: 'firstName', localAttribute: 'name' },
      { idpAttribute: 'department', localAttribute: 'department' },
    ],
    lastTestResult: 'success',
  },
  {
    id: '2', name: 'Entra ID', type: 'oidc', enabled: true,
    oidcClientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    oidcClientSecret: '••••••••••••••••••••••••••••••',
    oidcDiscoveryUrl: 'https://login.microsoftonline.com/tenant-id/v2.0/.well-known/openid-configuration',
    oidcAuthorizationEndpoint: 'https://login.microsoftonline.com/tenant-id/oauth2/v2.0/authorize',
    oidcTokenEndpoint: 'https://login.microsoftonline.com/tenant-id/oauth2/v2.0/token',
    oidcUserInfoEndpoint: 'https://graph.microsoft.com/oidc/userinfo',
    oidcScopes: ['openid', 'profile', 'email', 'offline_access'],
    oidcResponseType: 'code',
    domain: 'login.microsoftonline.com', mfaEnforced: true, autoProvision: true,
    groupMapping: [
      { idpGroup: 'AAD-Engineering', localGroup: 'Engineering' },
      { idpGroup: 'AAD-Marketing', localGroup: 'Marketing' },
    ],
    attributeMapping: [
      { idpAttribute: 'preferred_username', localAttribute: 'email' },
      { idpAttribute: 'name', localAttribute: 'name' },
    ],
    lastTestResult: 'success',
  },
  {
    id: '3', name: 'Corporate LDAP', type: 'ldap', enabled: true,
    ldapHost: 'ldap.corp.acme.io', ldapPort: 636, ldapBaseDn: 'dc=acme,dc=io',
    ldapBindDn: 'cn=svc-apexaegis,ou=ServiceAccounts,dc=acme,dc=io',
    ldapBindPassword: '••••••••••••••••',
    ldapUserFilter: '(&(objectClass=user)(sAMAccountName={0}))',
    ldapGroupFilter: '(&(objectClass=group)(member={0}))',
    ldapUseSsl: true,
    domain: 'ldap.corp.acme.io', mfaEnforced: false, autoProvision: false,
    groupMapping: [],
    attributeMapping: [
      { idpAttribute: 'mail', localAttribute: 'email' },
      { idpAttribute: 'cn', localAttribute: 'name' },
    ],
    lastTestResult: 'success',
  },
];

const typeConfig: Record<IdpType, { label: string; color: string; fields: string[] }> = {
  saml: { label: 'SAML 2.0', color: 'bg-purple-900/40 text-purple-400 border-purple-800', fields: ['entityId', 'ssoUrl', 'sloUrl', 'certificate', 'metadataUrl', 'nameIdFormat'] },
  oidc: { label: 'OIDC', color: 'bg-blue-900/40 text-blue-400 border-blue-800', fields: ['clientId', 'clientSecret', 'discoveryUrl', 'scopes', 'responseType'] },
  ldap: { label: 'LDAP', color: 'bg-yellow-900/40 text-yellow-400 border-yellow-800', fields: ['host', 'port', 'baseDn', 'bindDn', 'userFilter', 'groupFilter'] },
  radius: { label: 'RADIUS', color: 'bg-gray-800 text-gray-400 border-gray-700', fields: ['host', 'port', 'secret', 'timeout', 'retries'] },
};

export default function IdpConfigurationPage() {
  const [configs, setConfigs] = useState<IdpConfig[]>(demoConfigs);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<IdpConfig | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const selected = configs.find(c => c.id === selectedConfig);

  const toggleSecret = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleToggle = (id: string) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  const handleTestConnection = (id: string) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, lastTestResult: 'success' } : c));
  };

  const handleSave = () => {
    if (!editConfig) return;
    setConfigs(prev => prev.map(c => c.id === editConfig.id ? editConfig : c));
    setEditConfig(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key size={24} className="text-yellow-400" />
          <div>
            <h1 className="text-xl font-semibold">IDP Configuration</h1>
            <p className="text-sm text-gray-500">Detailed identity provider setup — SAML metadata, OIDC clients, LDAP binds, certificates</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Provider list */}
        <div className="col-span-4 space-y-3">
          {configs.map(config => (
            <button
              key={config.id}
              onClick={() => { setSelectedConfig(config.id); setEditConfig(null); }}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                selectedConfig === config.id
                  ? 'bg-gray-800 border-blue-600'
                  : 'bg-gray-900 border-gray-800 hover:border-gray-700'
              } ${!config.enabled ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{config.name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${typeConfig[config.type].color}`}>
                  {typeConfig[config.type].label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 font-mono">{config.domain}</span>
                {config.lastTestResult === 'success' && <CheckCircle size={12} className="text-green-400" />}
                {config.lastTestResult === 'failed' && <XCircle size={12} className="text-red-400" />}
              </div>
            </button>
          ))}
        </div>

        {/* Config detail */}
        <div className="col-span-8">
          {selected ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{selected.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${typeConfig[selected.type].color}`}>
                    {typeConfig[selected.type].label}
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${selected.lastTestResult === 'success' ? 'text-green-400' : selected.lastTestResult === 'failed' ? 'text-red-400' : 'text-gray-500'}`}>
                    {selected.lastTestResult === 'success' ? <><CheckCircle size={12} /> Connected</> : selected.lastTestResult === 'failed' ? <><XCircle size={12} /> Failed</> : 'Untested'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleTestConnection(selected.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors">
                    <RefreshCw size={12} /> Test Connection
                  </button>
                  <button onClick={() => setEditConfig({ ...selected })} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium transition-colors">
                    Edit Configuration
                  </button>
                  <button onClick={() => handleToggle(selected.id)} className={`w-8 h-4 rounded-full transition-colors relative ${selected.enabled ? 'bg-green-600' : 'bg-gray-700'}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${selected.enabled ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Type-specific config display */}
              {selected.type === 'saml' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">SAML Configuration</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Entity ID</div>
                      <div className="text-sm text-gray-300 font-mono break-all">{selected.samlEntityId}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">SSO URL</div>
                      <div className="text-sm text-gray-300 font-mono break-all">{selected.samlSsoUrl}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">SLO URL</div>
                      <div className="text-sm text-gray-300 font-mono break-all">{selected.samlSloUrl}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Metadata URL</div>
                      <div className="text-sm text-gray-300 font-mono break-all">{selected.samlMetadataUrl}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">NameID Format</div>
                      <div className="text-sm text-gray-300 font-mono text-xs">{selected.samlNameIdFormat}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Certificate</div>
                      <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">{selected.samlCertificate}</pre>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">Sign Requests:</span>
                      <span className={selected.samlSignRequests ? 'text-green-400' : 'text-gray-600'}>{selected.samlSignRequests ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              )}

              {selected.type === 'oidc' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">OIDC Configuration</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Client ID</div>
                      <div className="text-sm text-gray-300 font-mono">{selected.oidcClientId}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 mb-1">Client Secret</div>
                        <button onClick={() => toggleSecret('oidcSecret')} className="text-gray-500 hover:text-gray-300">
                          {showSecrets['oidcSecret'] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                      <div className="text-sm text-gray-300 font-mono">{showSecrets['oidcSecret'] ? selected.oidcClientSecret : '••••••••••••••••'}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Discovery URL</div>
                      <div className="text-sm text-gray-300 font-mono break-all text-xs">{selected.oidcDiscoveryUrl}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-800/30 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Scopes</div>
                        <div className="flex flex-wrap gap-1">{selected.oidcScopes?.map(s => <span key={s} className="px-1.5 py-0.5 rounded bg-blue-900/20 text-blue-300 text-xs">{s}</span>)}</div>
                      </div>
                      <div className="p-3 bg-gray-800/30 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Response Type</div>
                        <div className="text-sm text-gray-300">{selected.oidcResponseType}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selected.type === 'ldap' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">LDAP Configuration</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Host</div>
                      <div className="text-sm text-gray-300 font-mono">{selected.ldapHost}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Port</div>
                      <div className="text-sm text-gray-300 font-mono">{selected.ldapPort}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg col-span-2">
                      <div className="text-xs text-gray-500 mb-1">Base DN</div>
                      <div className="text-sm text-gray-300 font-mono">{selected.ldapBaseDn}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg col-span-2">
                      <div className="text-xs text-gray-500 mb-1">Bind DN</div>
                      <div className="text-sm text-gray-300 font-mono text-xs">{selected.ldapBindDn}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg col-span-2">
                      <div className="text-xs text-gray-500 mb-1">User Filter</div>
                      <div className="text-sm text-gray-300 font-mono text-xs">{selected.ldapUserFilter}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg col-span-2">
                      <div className="text-xs text-gray-500 mb-1">Group Filter</div>
                      <div className="text-sm text-gray-300 font-mono text-xs">{selected.ldapGroupFilter}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500">SSL/TLS:</span>
                    <span className={selected.ldapUseSsl ? 'text-green-400' : 'text-gray-600'}>{selected.ldapUseSsl ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              )}

              {/* Common settings */}
              <div className="space-y-4 border-t border-gray-800 pt-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Common Settings</h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="p-3 bg-gray-800/30 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Organization ID</div>
                    <div className="font-mono text-sm text-blue-400 break-all">550e8400-e29b-41d4-a716-446655440000</div>
                    <div className="text-xs text-gray-600 mt-1">Used for desktop-client registration</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <span className="text-gray-400">MFA Enforced</span>
                    <span className={selected.mfaEnforced ? 'text-green-400' : 'text-gray-600'}>{selected.mfaEnforced ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <span className="text-gray-400">Auto-provision</span>
                    <span className={selected.autoProvision ? 'text-green-400' : 'text-gray-600'}>{selected.autoProvision ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Group mapping */}
              {selected.groupMapping.length > 0 && (
                <div className="space-y-3 border-t border-gray-800 pt-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Group Mapping</h3>
                  <div className="space-y-1">
                    {selected.groupMapping.map((gm, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm p-2 bg-gray-800/20 rounded-lg">
                        <span className="px-2 py-0.5 rounded bg-purple-900/20 text-purple-300 text-xs">{gm.idpGroup}</span>
                        <span className="text-gray-600">&rarr;</span>
                        <span className="px-2 py-0.5 rounded bg-blue-900/20 text-blue-300 text-xs">{gm.localGroup}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attribute mapping */}
              {selected.attributeMapping.length > 0 && (
                <div className="space-y-3 border-t border-gray-800 pt-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Attribute Mapping</h3>
                  <div className="space-y-1">
                    {selected.attributeMapping.map((am, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm p-2 bg-gray-800/20 rounded-lg">
                        <span className="font-mono text-xs text-gray-400">{am.idpAttribute}</span>
                        <span className="text-gray-600">&rarr;</span>
                        <span className="font-mono text-xs text-gray-300">{am.localAttribute}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500">
              <Key size={40} className="mx-auto mb-3 text-gray-700" />
              <p className="text-sm">Select a provider to view its configuration</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editConfig && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditConfig(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit {editConfig.name}</h3>
              <button onClick={() => setEditConfig(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={editConfig.name} onChange={e => setEditConfig({ ...editConfig, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Domain</label>
                <input value={editConfig.domain} onChange={e => setEditConfig({ ...editConfig, domain: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
              </div>

              {editConfig.type === 'saml' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Entity ID</label>
                    <input value={editConfig.samlEntityId || ''} onChange={e => setEditConfig({ ...editConfig, samlEntityId: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">SSO URL</label>
                    <input value={editConfig.samlSsoUrl || ''} onChange={e => setEditConfig({ ...editConfig, samlSsoUrl: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Metadata URL</label>
                    <input value={editConfig.samlMetadataUrl || ''} onChange={e => setEditConfig({ ...editConfig, samlMetadataUrl: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Certificate (PEM)</label>
                    <textarea value={editConfig.samlCertificate || ''} onChange={e => setEditConfig({ ...editConfig, samlCertificate: e.target.value })} rows={4} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50 resize-none" />
                  </div>
                </>
              )}

              {editConfig.type === 'oidc' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Client ID</label>
                    <input value={editConfig.oidcClientId || ''} onChange={e => setEditConfig({ ...editConfig, oidcClientId: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Client Secret</label>
                    <input type="password" value={editConfig.oidcClientSecret || ''} onChange={e => setEditConfig({ ...editConfig, oidcClientSecret: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Discovery URL</label>
                    <input value={editConfig.oidcDiscoveryUrl || ''} onChange={e => setEditConfig({ ...editConfig, oidcDiscoveryUrl: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Scopes (comma-separated)</label>
                    <input value={editConfig.oidcScopes?.join(', ') || ''} onChange={e => setEditConfig({ ...editConfig, oidcScopes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
                  </div>
                </>
              )}

              {editConfig.type === 'ldap' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Host</label>
                      <input value={editConfig.ldapHost || ''} onChange={e => setEditConfig({ ...editConfig, ldapHost: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Port</label>
                      <input type="number" value={editConfig.ldapPort || 389} onChange={e => setEditConfig({ ...editConfig, ldapPort: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Base DN</label>
                    <input value={editConfig.ldapBaseDn || ''} onChange={e => setEditConfig({ ...editConfig, ldapBaseDn: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Bind DN</label>
                    <input value={editConfig.ldapBindDn || ''} onChange={e => setEditConfig({ ...editConfig, ldapBindDn: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">User Filter</label>
                    <input value={editConfig.ldapUserFilter || ''} onChange={e => setEditConfig({ ...editConfig, ldapUserFilter: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Enforce MFA</span>
                <button onClick={() => setEditConfig({ ...editConfig, mfaEnforced: !editConfig.mfaEnforced })} className={`w-8 h-4 rounded-full transition-colors relative ${editConfig.mfaEnforced ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${editConfig.mfaEnforced ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Auto-provision</span>
                <button onClick={() => setEditConfig({ ...editConfig, autoProvision: !editConfig.autoProvision })} className={`w-8 h-4 rounded-full transition-colors relative ${editConfig.autoProvision ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${editConfig.autoProvision ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditConfig(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Save</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
