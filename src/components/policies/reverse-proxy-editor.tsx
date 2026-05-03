'use client';
import { useState } from 'react';
import { Globe, ChevronDown, ChevronRight, Shield, Monitor, Fingerprint, Laptop, Smartphone, Key, AlertTriangle } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   IDENTITY-AWARE PROXY
   ─────────────────────────────────────────
   Zero-trust reverse proxy: every request is authenticated,
   authorized by identity + device posture + context signals.
   No VPN needed — the proxy IS the perimeter.
   ═══════════════════════════════════════════════════════════════ */

/* ─── Types ────────────────────────────────────────────────── */
export interface ProtectedResource {
  id: string;
  name: string;
  externalUrl: string;
  backendUrl: string;
  protocol: 'http' | 'https' | 'tcp' | 'ssh' | 'rdp';
  port: number;
  healthCheckPath: string;
  corsAllowed: boolean;
}

export interface AccessLevel {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: AccessCondition[];
}

export interface AccessCondition {
  type: 'device_policy' | 'ip_range' | 'geo_location' | 'time_window' | 'device_os' | 'device_encryption' | 'screen_lock' | 'os_version' | 'mfa_age' | 'corp_owned';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: string;
}

export type DeviceTrustTier = 'fully_trusted' | 'corp_managed' | 'byod_verified' | 'unmanaged';

export interface IapConfig {
  enabled: boolean;
  mode: 'iap_web' | 'iap_tcp' | 'browser_isolation' | 'app_portal';
  resources: ProtectedResource[];
  accessLevels: AccessLevel[];
  // Identity & Auth
  identityProvider: string;
  requireMfa: boolean;
  mfaMaxAge: number;
  allowServiceAccounts: boolean;
  // Device Trust
  deviceTrustTiers: { tier: DeviceTrustTier; action: 'allow' | 'browser_isolation' | 'read_only' | 'block' }[];
  // Context-Aware settings
  reauthOnSensitiveAction: boolean;
  continuousAuthEval: boolean;
  riskBasedStepUp: boolean;
  // Signed Headers (like x-goog-iap-jwt-assertion)
  signedHeaders: boolean;
  headerPrefix: string;
  jwtAudience: string;
  // Session
  sessionDuration: number;
  idleTimeout: number;
  // Network
  rewriteHostHeader: boolean;
  addSecurityHeaders: boolean;
  websocketSupport: boolean;
  loadBalancing: 'round-robin' | 'least-connections' | 'ip-hash';
  tlsMinVersion: '1.2' | '1.3';
  customDomain: string;
}

/* ─── Defaults ─────────────────────────────────────────────── */
const DEFAULT_RESOURCES: ProtectedResource[] = [
  { id: 'r1', name: 'Internal Wiki', externalUrl: 'wiki.company.com', backendUrl: 'https://10.0.1.20', protocol: 'https', port: 443, healthCheckPath: '/health', corsAllowed: false },
  { id: 'r2', name: 'Admin Console', externalUrl: 'admin.company.com', backendUrl: 'https://10.0.1.30', protocol: 'https', port: 443, healthCheckPath: '/', corsAllowed: true },
];

const DEFAULT_ACCESS_LEVELS: AccessLevel[] = [
  {
    id: 'al-corp', name: 'Corporate Device', description: 'Requires corp-managed device with encryption',
    enabled: true,
    conditions: [
      { type: 'corp_owned', operator: 'equals', value: 'true' },
      { type: 'device_encryption', operator: 'equals', value: 'true' },
      { type: 'screen_lock', operator: 'equals', value: 'true' },
    ],
  },
  {
    id: 'al-byod', name: 'BYOD Verified', description: 'Personal device with certificate and OS requirements',
    enabled: true,
    conditions: [
      { type: 'device_os', operator: 'in', value: 'macOS,Windows,ChromeOS' },
      { type: 'os_version', operator: 'greater_than', value: '12.0' },
      { type: 'screen_lock', operator: 'equals', value: 'true' },
    ],
  },
  {
    id: 'al-loc', name: 'Allowed Regions', description: 'Restrict access to specific countries',
    enabled: false,
    conditions: [
      { type: 'geo_location', operator: 'in', value: 'US,CA,GB,DE,AU' },
    ],
  },
  {
    id: 'al-time', name: 'Business Hours', description: 'Restrict to weekday business hours',
    enabled: false,
    conditions: [
      { type: 'time_window', operator: 'in', value: 'Mon-Fri 06:00-22:00 UTC' },
    ],
  },
  {
    id: 'al-mfa', name: 'Recent MFA', description: 'MFA must have been performed within timeout',
    enabled: true,
    conditions: [
      { type: 'mfa_age', operator: 'less_than', value: '3600' },
    ],
  },
];

const DEFAULT_DEVICE_TIERS: IapConfig['deviceTrustTiers'] = [
  { tier: 'fully_trusted', action: 'allow' },
  { tier: 'corp_managed', action: 'allow' },
  { tier: 'byod_verified', action: 'browser_isolation' },
  { tier: 'unmanaged', action: 'read_only' },
];

export const DEFAULT_IAP_CONFIG: IapConfig = {
  enabled: false,
  mode: 'iap_web',
  resources: DEFAULT_RESOURCES,
  accessLevels: DEFAULT_ACCESS_LEVELS,
  identityProvider: 'OIDC',
  requireMfa: true,
  mfaMaxAge: 3600,
  allowServiceAccounts: false,
  deviceTrustTiers: DEFAULT_DEVICE_TIERS,
  reauthOnSensitiveAction: true,
  continuousAuthEval: true,
  riskBasedStepUp: true,
  signedHeaders: true,
  headerPrefix: 'X-ApexAegis-IAP',
  jwtAudience: '/projects/apexaegis/global/backendServices',
  sessionDuration: 480,
  idleTimeout: 30,
  rewriteHostHeader: true,
  addSecurityHeaders: true,
  websocketSupport: true,
  loadBalancing: 'round-robin',
  tlsMinVersion: '1.2',
  customDomain: '',
};

/* ─── Component ────────────────────────────────────────────── */
export function IapEditor({
  config,
  onChange,
}: {
  config: IapConfig;
  onChange: (c: IapConfig) => void;
}) {
  const [expandResources, setExpandResources] = useState(true);
  const [expandAccessLevels, setExpandAccessLevels] = useState(true);
  const [expandDeviceTrust, setExpandDeviceTrust] = useState(true);
  const [expandContext, setExpandContext] = useState(false);
  const [expandHeaders, setExpandHeaders] = useState(false);
  const [expandAdvanced, setExpandAdvanced] = useState(false);
  const [newResource, setNewResource] = useState({ name: '', external: '', backend: '' });

  const addResource = () => {
    if (!newResource.name || !newResource.external || !newResource.backend) return;
    const resource: ProtectedResource = {
      id: `r-${Date.now()}`,
      name: newResource.name,
      externalUrl: newResource.external,
      backendUrl: newResource.backend,
      protocol: newResource.backend.startsWith('https') ? 'https' : 'http',
      port: newResource.backend.startsWith('https') ? 443 : 80,
      healthCheckPath: '/health',
      corsAllowed: false,
    };
    onChange({ ...config, resources: [...config.resources, resource] });
    setNewResource({ name: '', external: '', backend: '' });
  };

  const removeResource = (id: string) => {
    onChange({ ...config, resources: config.resources.filter(r => r.id !== id) });
  };

  const toggleAccessLevel = (id: string) => {
    onChange({ ...config, accessLevels: config.accessLevels.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l) });
  };

  const updateDeviceTier = (tier: DeviceTrustTier, action: string) => {
    onChange({ ...config, deviceTrustTiers: config.deviceTrustTiers.map(t => t.tier === tier ? { ...t, action: action as typeof t.action } : t) });
  };

  const protocolIcon: Record<string, string> = {
    https: 'text-green-400',
    http: 'text-yellow-400',
    tcp: 'text-blue-400',
    ssh: 'text-purple-400',
    rdp: 'text-orange-400',
  };

  const tierLabels: Record<DeviceTrustTier, { label: string; icon: React.ReactNode; color: string }> = {
    fully_trusted: { label: 'Fully Trusted (Corp-owned, compliant)', icon: <Shield size={14} className="text-green-400" />, color: 'border-green-800' },
    corp_managed: { label: 'Corporate Managed (MDM enrolled)', icon: <Laptop size={14} className="text-blue-400" />, color: 'border-blue-800' },
    byod_verified: { label: 'BYOD Verified (Certificate present)', icon: <Smartphone size={14} className="text-yellow-400" />, color: 'border-yellow-800' },
    unmanaged: { label: 'Unmanaged / Unknown Device', icon: <AlertTriangle size={14} className="text-red-400" />, color: 'border-red-800' },
  };

  const deviceActionOptions: { value: string; label: string; color: string }[] = [
    { value: 'allow', label: 'Full Access', color: 'bg-green-900/40 text-green-300 border-green-700' },
    { value: 'browser_isolation', label: 'Browser Isolation', color: 'bg-blue-900/40 text-blue-300 border-blue-700' },
    { value: 'read_only', label: 'Read-Only', color: 'bg-yellow-900/40 text-yellow-300 border-yellow-700' },
    { value: 'block', label: 'Block', color: 'bg-red-900/40 text-red-300 border-red-700' },
  ];

  const activeAccessLevels = config.accessLevels.filter(l => l.enabled).length;

  return (
    <div className="space-y-4">
      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Fingerprint size={16} className="text-teal-400" />
          <span className="text-sm font-medium">Identity-Aware Proxy</span>
        </div>
        <button
          onClick={() => onChange({ ...config, enabled: !config.enabled })}
          className={`w-9 h-5 rounded-full transition-colors relative ${config.enabled ? 'bg-teal-600' : 'bg-gray-700'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.enabled ? 'left-4' : 'left-0.5'}`} />
        </button>
      </div>

      {config.enabled && (
        <div className="space-y-4 pl-1">
          {/* ── Proxy Mode ─────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2">
            {([
              { value: 'iap_web', label: 'IAP for Web', icon: <Globe size={12} />, desc: 'HTTPS reverse proxy' },
              { value: 'iap_tcp', label: 'IAP for TCP', icon: <Key size={12} />, desc: 'SSH / RDP tunneling' },
              { value: 'browser_isolation', label: 'Remote Browser', icon: <Monitor size={12} />, desc: 'Pixel-stream isolation' },
              { value: 'app_portal', label: 'App Portal', icon: <Shield size={12} />, desc: 'Self-service catalog' },
            ] as const).map(m => (
              <button
                key={m.value}
                onClick={() => onChange({ ...config, mode: m.value })}
                className={`flex flex-col items-start px-3 py-2 rounded-lg text-xs border transition-colors ${
                  config.mode === m.value
                    ? 'bg-teal-900/40 border-teal-600 text-teal-300'
                    : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium">{m.icon} {m.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>

          {/* IAP for TCP hint */}
          {config.mode === 'iap_tcp' && (
            <div className="flex items-start gap-2 p-2 bg-blue-900/20 border border-blue-800/30 rounded-lg">
              <Key size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-blue-300/80">
                IAP TCP Forwarding tunnels SSH, RDP, and custom TCP through the identity proxy — no VPN, no public IP exposure. Users authenticate via IAP before a tunnel is established.
              </p>
            </div>
          )}

          {/* ── Protected Resources ───────────────────────────── */}
          <div>
            <button onClick={() => setExpandResources(!expandResources)} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 w-full">
              {expandResources ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Protected Resources
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-teal-900/40 text-teal-300 font-normal normal-case">
                {config.resources.length} backend{config.resources.length !== 1 ? 's' : ''}
              </span>
            </button>
            {expandResources && (
              <div className="mt-2 space-y-2">
                {config.resources.map(resource => (
                  <div key={resource.id} className="p-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-200">{resource.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border border-gray-700 ${protocolIcon[resource.protocol]}`}>
                          {resource.protocol.toUpperCase()}
                        </span>
                        <button onClick={() => removeResource(resource.id)} className="text-gray-500 hover:text-red-400">×</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <code className="text-teal-300 font-mono">{resource.externalUrl}</code>
                      <span className="text-gray-600">→</span>
                      <code className="text-green-300 font-mono">{resource.backendUrl}:{resource.port}</code>
                    </div>
                    {resource.healthCheckPath && (
                      <div className="text-[10px] text-gray-500 mt-1">
                        Health: {resource.healthCheckPath} · CORS: {resource.corsAllowed ? 'Yes' : 'No'}
                      </div>
                    )}
                  </div>
                ))}
                <div className="p-2.5 bg-gray-900/50 border border-gray-700 border-dashed rounded-lg space-y-1.5">
                  <input placeholder="Resource name (e.g., Jenkins CI)" value={newResource.name} onChange={e => setNewResource({ ...newResource, name: e.target.value })}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs placeholder:text-gray-500 focus:outline-none" />
                  <div className="flex items-center gap-1.5">
                    <input placeholder="External: ci.company.com" value={newResource.external} onChange={e => setNewResource({ ...newResource, external: e.target.value })}
                      className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs placeholder:text-gray-500 focus:outline-none" />
                    <span className="text-gray-600 text-xs">→</span>
                    <input placeholder="Backend: https://10.0.2.10" value={newResource.backend} onChange={e => setNewResource({ ...newResource, backend: e.target.value })}
                      className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs placeholder:text-gray-500 focus:outline-none" />
                    <button onClick={addResource} className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white transition-colors">Add</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Access Levels (Context-Aware Conditions) ──────── */}
          <div>
            <button onClick={() => setExpandAccessLevels(!expandAccessLevels)} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 w-full">
              {expandAccessLevels ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Access Levels (Context-Aware)
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-teal-900/40 text-teal-300 font-normal normal-case">
                {activeAccessLevels}/{config.accessLevels.length} active
              </span>
            </button>
            {expandAccessLevels && (
              <div className="mt-2 space-y-1.5">
                {config.accessLevels.map(level => (
                  <div
                    key={level.id}
                    className={`p-2.5 rounded-lg border transition-colors ${
                      level.enabled
                        ? 'bg-gray-800/50 border-gray-700'
                        : 'bg-gray-800/20 border-gray-800 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-xs font-medium text-gray-200">{level.name}</span>
                        <p className="text-[10px] text-gray-500">{level.description}</p>
                      </div>
                      <Toggle value={level.enabled} onChange={() => toggleAccessLevel(level.id)} />
                    </div>
                    {level.enabled && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {level.conditions.map((cond, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/80 text-gray-300 border border-gray-600">
                            {conditionLabel(cond)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Device Trust Tiers ────────────────────────────── */}
          <div>
            <button onClick={() => setExpandDeviceTrust(!expandDeviceTrust)} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 w-full">
              {expandDeviceTrust ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Device Trust Tiers
            </button>
            {expandDeviceTrust && (
              <div className="mt-2 space-y-1.5">
                {config.deviceTrustTiers.map(dt => {
                  const info = tierLabels[dt.tier];
                  return (
                    <div key={dt.tier} className={`flex items-center gap-3 p-2.5 rounded-lg border bg-gray-800/50 ${info.color}`}>
                      {info.icon}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-200 truncate">{info.label}</div>
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        {deviceActionOptions.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => updateDeviceTier(dt.tier, opt.value)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
                              dt.action === opt.value ? opt.color : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Identity & Auth ────────────────────────────────── */}
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Identity & Authentication</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Identity Provider</span>
              <select value={config.identityProvider} onChange={e => onChange({ ...config, identityProvider: e.target.value })}
                className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs focus:outline-none">
                <option value="OIDC">OpenID Connect</option>
                <option value="SAML">SAML 2.0</option>
                <option value="Google">Google Workspace</option>
                <option value="Azure AD">Azure AD / Entra ID</option>
                <option value="Okta">Okta</option>
                <option value="Ping">PingFederate</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div><span className="text-xs text-gray-300">Require MFA</span><p className="text-[10px] text-gray-500">Step-up auth before granting access</p></div>
              <Toggle value={config.requireMfa} onChange={v => onChange({ ...config, requireMfa: v })} />
            </div>
            {config.requireMfa && (
              <div className="flex items-center justify-between pl-4">
                <span className="text-xs text-gray-400">MFA max age</span>
                <select value={config.mfaMaxAge} onChange={e => onChange({ ...config, mfaMaxAge: Number(e.target.value) })}
                  className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs focus:outline-none">
                  {[300, 900, 1800, 3600, 7200, 14400, 28800].map(s => (
                    <option key={s} value={s}>{s < 3600 ? `${s / 60}m` : `${s / 3600}h`}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div><span className="text-xs text-gray-300">Service Account Access</span><p className="text-[10px] text-gray-500">Allow programmatic access via signed JWT</p></div>
              <Toggle value={config.allowServiceAccounts} onChange={v => onChange({ ...config, allowServiceAccounts: v })} />
            </div>
          </div>

          {/* ── Context-Aware Policies ─────────────────────────── */}
          <div>
            <button onClick={() => setExpandContext(!expandContext)} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 w-full">
              {expandContext ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Continuous Context Evaluation
            </button>
            {expandContext && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div><span className="text-xs text-gray-300">Re-auth on sensitive actions</span><p className="text-[10px] text-gray-500">Force re-authentication for destructive or admin operations</p></div>
                  <Toggle value={config.reauthOnSensitiveAction} onChange={v => onChange({ ...config, reauthOnSensitiveAction: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><span className="text-xs text-gray-300">Continuous Auth Evaluation</span><p className="text-[10px] text-gray-500">Revoke sessions if context signals change (e.g., IP, location)</p></div>
                  <Toggle value={config.continuousAuthEval} onChange={v => onChange({ ...config, continuousAuthEval: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><span className="text-xs text-gray-300">Risk-Based Step-Up</span><p className="text-[10px] text-gray-500">Automatically escalate auth requirements when risk score increases</p></div>
                  <Toggle value={config.riskBasedStepUp} onChange={v => onChange({ ...config, riskBasedStepUp: v })} />
                </div>
              </div>
            )}
          </div>

          {/* ── Signed Headers (IAP JWT) ──────────────────────── */}
          <div>
            <button onClick={() => setExpandHeaders(!expandHeaders)} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 w-full">
              {expandHeaders ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Signed Identity Headers
            </button>
            {expandHeaders && (
              <div className="mt-2 space-y-2">
                <div className="flex items-start gap-2 p-2 bg-teal-900/20 border border-teal-800/30 rounded-lg mb-2">
                  <Fingerprint size={13} className="text-teal-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-teal-300/80">
                    Every proxied request gets a signed JWT header ({config.headerPrefix}-JWT-Assertion) containing the verified user identity, device info, and access level. Backends can validate this header to enforce fine-grained authorization without their own auth layer.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Enable signed headers</span>
                  <Toggle value={config.signedHeaders} onChange={v => onChange({ ...config, signedHeaders: v })} />
                </div>
                {config.signedHeaders && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Header prefix</span>
                      <input value={config.headerPrefix} onChange={e => onChange({ ...config, headerPrefix: e.target.value })}
                        className="w-40 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs font-mono focus:outline-none" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">JWT audience claim</span>
                      <input value={config.jwtAudience} onChange={e => onChange({ ...config, jwtAudience: e.target.value })}
                        className="w-52 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs font-mono focus:outline-none" />
                    </div>
                    {/* Example injected headers */}
                    <div className="mt-1 p-2 bg-gray-950 border border-gray-800 rounded-lg">
                      <div className="text-[10px] text-gray-500 mb-1">Headers injected to backend:</div>
                      <code className="text-[10px] text-teal-300 font-mono block">{config.headerPrefix}-JWT-Assertion: eyJhb...<span className="text-gray-600">(signed JWT)</span></code>
                      <code className="text-[10px] text-teal-300 font-mono block">{config.headerPrefix}-User-Email: user@company.com</code>
                      <code className="text-[10px] text-teal-300 font-mono block">{config.headerPrefix}-User-ID: accounts.example.com:uid-123</code>
                      <code className="text-[10px] text-teal-300 font-mono block">{config.headerPrefix}-Device-Trust: corp_managed</code>
                      <code className="text-[10px] text-teal-300 font-mono block">{config.headerPrefix}-Access-Level: Corporate Device</code>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Session ────────────────────────────────────────── */}
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Session Controls</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Session duration (minutes)</span>
              <select value={config.sessionDuration} onChange={e => onChange({ ...config, sessionDuration: Number(e.target.value) })}
                className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs focus:outline-none">
                {[15, 30, 60, 120, 240, 480, 720, 1440].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Idle timeout (minutes)</span>
              <select value={config.idleTimeout} onChange={e => onChange({ ...config, idleTimeout: Number(e.target.value) })}
                className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs focus:outline-none">
                {[5, 10, 15, 30, 60, 120].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
          </div>

          {/* ── Advanced Network ───────────────────────────────── */}
          <div>
            <button onClick={() => setExpandAdvanced(!expandAdvanced)} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 w-full">
              {expandAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Network & Transport
            </button>
            {expandAdvanced && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Custom domain</span>
                  <input value={config.customDomain} onChange={e => onChange({ ...config, customDomain: e.target.value })}
                    placeholder="app.company.com"
                    className="w-40 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs placeholder:text-gray-500 focus:outline-none" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Rewrite Host header</span>
                  <Toggle value={config.rewriteHostHeader} onChange={v => onChange({ ...config, rewriteHostHeader: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Security headers (HSTS, CSP, X-Frame)</span>
                  <Toggle value={config.addSecurityHeaders} onChange={v => onChange({ ...config, addSecurityHeaders: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">WebSocket support</span>
                  <Toggle value={config.websocketSupport} onChange={v => onChange({ ...config, websocketSupport: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Load balancing</span>
                  <select value={config.loadBalancing} onChange={e => onChange({ ...config, loadBalancing: e.target.value as IapConfig['loadBalancing'] })}
                    className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs focus:outline-none">
                    <option value="round-robin">Round Robin</option>
                    <option value="least-connections">Least Connections</option>
                    <option value="ip-hash">IP Hash</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Min TLS version</span>
                  <select value={config.tlsMinVersion} onChange={e => onChange({ ...config, tlsMinVersion: e.target.value as '1.2' | '1.3' })}
                    className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs focus:outline-none">
                    <option value="1.2">TLS 1.2</option>
                    <option value="1.3">TLS 1.3</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Zero trust reminder */}
          <div className="flex items-start gap-2 p-2 bg-teal-900/20 border border-teal-800/30 rounded-lg">
            <Shield size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-teal-300/80">
              <strong>Zero Trust:</strong> Every request is individually authenticated and authorized based on identity + device trust + context signals. No implicit trust from network location.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────── */
function conditionLabel(c: AccessCondition): string {
  const labels: Record<AccessCondition['type'], string> = {
    device_policy: 'Device Policy',
    ip_range: 'IP Range',
    geo_location: 'Geo',
    time_window: 'Time',
    device_os: 'OS',
    device_encryption: 'Encryption',
    screen_lock: 'Screen Lock',
    os_version: 'OS Version',
    mfa_age: 'MFA Age',
    corp_owned: 'Corp-Owned',
  };
  const op = c.operator === 'equals' ? '=' : c.operator === 'in' ? '∈' : c.operator === 'not_in' ? '∉' : c.operator === 'greater_than' ? '>' : c.operator === 'less_than' ? '<' : '≠';
  const val = c.type === 'mfa_age' ? `${Number(c.value) / 60}m` : c.value === 'true' ? '✓' : c.value === 'false' ? '✗' : c.value;
  return `${labels[c.type]} ${op} ${val}`;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`w-8 h-4 rounded-full transition-colors relative ${value ? 'bg-blue-600' : 'bg-gray-700'}`}>
      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${value ? 'left-4' : 'left-0.5'}`} />
    </button>
  );
}
