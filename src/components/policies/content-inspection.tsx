'use client';
import { useState } from 'react';
import { Shield, ChevronDown, ChevronRight, AlertTriangle, Cloud } from 'lucide-react';

/* ─── Types ────────────────────────────────────────────────── */
export interface TunnelProtocol {
  id: string;
  label: string;
  description: string;
  action: 'detect' | 'block' | 'alert' | 'off';
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface HeaderRule {
  id: string;
  headerName: string;
  condition: 'contains' | 'equals' | 'matches_regex' | 'not_contains' | 'exists';
  value: string;
  action: 'block' | 'alert' | 'strip' | 'allow';
}

export interface ContentInspectionConfig {
  enabled: boolean;
  tunnelProtocols: TunnelProtocol[];
  headerRules: HeaderRule[];
  inspectEncryptedPayloads: boolean;
  maxInspectionDepth: number;
  bypassForSanctionedApps: boolean;
}

/* ─── Defaults ─────────────────────────────────────────────── */
const DEFAULT_TUNNEL_PROTOCOLS: TunnelProtocol[] = [
  { id: 'ssh-over-https', label: 'SSH over HTTPS', description: 'Detects SSH handshake patterns inside TLS/HTTPS sessions', action: 'block', severity: 'critical' },
  { id: 'dns-tunnel', label: 'DNS Tunneling', description: 'Identifies DNS queries with encoded payload data (base32/base64, high entropy)', action: 'block', severity: 'critical' },
  { id: 'icmp-tunnel', label: 'ICMP Tunneling', description: 'Detects data exfiltration via oversized or abnormal ICMP packets', action: 'block', severity: 'high' },
  { id: 'websocket-tunnel', label: 'WebSocket Tunnel', description: 'Identifies unauthorized protocols being tunneled inside WebSocket frames', action: 'detect', severity: 'high' },
  { id: 'http-connect-abuse', label: 'HTTP CONNECT Abuse', description: 'Detects non-HTTP protocols being proxied via HTTP CONNECT method', action: 'block', severity: 'high' },
  { id: 'ssl-vpn-tunnel', label: 'SSL VPN over HTTPS', description: 'Identifies third-party SSL VPN clients tunneling through port 443', action: 'block', severity: 'critical' },
  { id: 'http2-multiplex', label: 'HTTP/2 Multiplex Abuse', description: 'Detects hidden streams within HTTP/2 multiplexed connections', action: 'detect', severity: 'medium' },
  { id: 'grpc-tunnel', label: 'gRPC Covert Channel', description: 'Identifies unauthorized gRPC streams carrying non-standard payloads', action: 'detect', severity: 'medium' },
  { id: 'quic-tunnel', label: 'QUIC/UDP Tunnel', description: 'Detects encrypted QUIC connections used to bypass HTTP inspection', action: 'detect', severity: 'high' },
  { id: 'rdp-over-https', label: 'RDP over HTTPS', description: 'Detects Remote Desktop Protocol encapsulated in HTTPS traffic', action: 'block', severity: 'critical' },
];

const DEFAULT_HEADER_RULES: HeaderRule[] = [
  { id: 'h1', headerName: 'X-Forwarded-For', condition: 'exists', value: '', action: 'alert' },
  { id: 'h2', headerName: 'Upgrade', condition: 'equals', value: 'websocket', action: 'alert' },
];

export const DEFAULT_CONTENT_INSPECTION: ContentInspectionConfig = {
  enabled: false,
  tunnelProtocols: DEFAULT_TUNNEL_PROTOCOLS,
  headerRules: DEFAULT_HEADER_RULES,
  inspectEncryptedPayloads: true,
  maxInspectionDepth: 3,
  bypassForSanctionedApps: true,
};

/* ─── CSP / CDN Header Presets ─────────────────────────────── */
interface CspPreset {
  id: string;
  label: string;
  description: string;
  headers: { name: string; condition: string; value: string }[];
}

const CSP_CDN_PRESETS: CspPreset[] = [
  {
    id: 'aws',
    label: 'Amazon Web Services (AWS)',
    description: 'Custom headers used by AWS services, S3, API Gateway, ALB',
    headers: [
      { name: 'X-Amz-Security-Token', condition: 'exists', value: '' },
      { name: 'X-Amz-Date', condition: 'exists', value: '' },
      { name: 'X-Amz-Content-Sha256', condition: 'exists', value: '' },
      { name: 'X-Amz-Target', condition: 'exists', value: '' },
      { name: 'X-Amz-Request-Id', condition: 'exists', value: '' },
      { name: 'X-Amzn-Trace-Id', condition: 'exists', value: '' },
      { name: 'X-Amzn-RequestId', condition: 'exists', value: '' },
    ],
  },
  {
    id: 'cloudfront',
    label: 'Amazon CloudFront',
    description: 'CloudFront CDN viewer and distribution headers',
    headers: [
      { name: 'X-Amz-Cf-Id', condition: 'exists', value: '' },
      { name: 'X-Amz-Cf-Pop', condition: 'exists', value: '' },
      { name: 'CloudFront-Viewer-Country', condition: 'exists', value: '' },
      { name: 'CloudFront-Is-Mobile-Viewer', condition: 'exists', value: '' },
      { name: 'CloudFront-Is-Desktop-Viewer', condition: 'exists', value: '' },
      { name: 'CloudFront-Forwarded-Proto', condition: 'exists', value: '' },
    ],
  },
  {
    id: 'cloudflare',
    label: 'Cloudflare',
    description: 'Cloudflare CDN, WAF, and Workers headers',
    headers: [
      { name: 'CF-Connecting-IP', condition: 'exists', value: '' },
      { name: 'CF-Ray', condition: 'exists', value: '' },
      { name: 'CF-IPCountry', condition: 'exists', value: '' },
      { name: 'CF-Visitor', condition: 'exists', value: '' },
      { name: 'CF-Worker', condition: 'exists', value: '' },
      { name: 'CF-Access-Client-Id', condition: 'exists', value: '' },
      { name: 'CF-Access-Client-Secret', condition: 'exists', value: '' },
    ],
  },
  {
    id: 'akamai',
    label: 'Akamai',
    description: 'Akamai CDN, EdgeWorkers, and security headers',
    headers: [
      { name: 'X-Akamai-Edgescape', condition: 'exists', value: '' },
      { name: 'X-Akamai-Session-Info', condition: 'exists', value: '' },
      { name: 'X-Akamai-Config-Log-Detail', condition: 'exists', value: '' },
      { name: 'Akamai-Origin-Hop', condition: 'exists', value: '' },
      { name: 'True-Client-IP', condition: 'exists', value: '' },
    ],
  },
  {
    id: 'azure-cdn',
    label: 'Azure CDN / Front Door',
    description: 'Azure CDN, Front Door, and Application Gateway headers',
    headers: [
      { name: 'X-Azure-Ref', condition: 'exists', value: '' },
      { name: 'X-Azure-RequestChain', condition: 'exists', value: '' },
      { name: 'X-FD-HealthProbe', condition: 'exists', value: '' },
      { name: 'X-Azure-FDID', condition: 'exists', value: '' },
      { name: 'X-Azure-SocketIP', condition: 'exists', value: '' },
      { name: 'X-Ms-Client-Principal', condition: 'exists', value: '' },
    ],
  },
  {
    id: 'fastly',
    label: 'Fastly',
    description: 'Fastly CDN edge and Compute@Edge headers',
    headers: [
      { name: 'Fastly-Client-IP', condition: 'exists', value: '' },
      { name: 'X-Fastly-Request-ID', condition: 'exists', value: '' },
      { name: 'Fastly-FF', condition: 'exists', value: '' },
      { name: 'X-Timer', condition: 'exists', value: '' },
      { name: 'X-Served-By', condition: 'exists', value: '' },
    ],
  },
  {
    id: 'gcp',
    label: 'Google Cloud Platform',
    description: 'GCP Load Balancer, IAP, and Cloud CDN headers',
    headers: [
      { name: 'X-Cloud-Trace-Context', condition: 'exists', value: '' },
      { name: 'X-Goog-Iap-Jwt-Assertion', condition: 'exists', value: '' },
      { name: 'X-Goog-Authenticated-User-Email', condition: 'exists', value: '' },
      { name: 'X-Goog-Authenticated-User-Id', condition: 'exists', value: '' },
      { name: 'X-Google-Real-IP', condition: 'exists', value: '' },
    ],
  },
];

/* ─── Component ────────────────────────────────────────────── */
export function ContentInspectionEditor({
  config,
  onChange,
}: {
  config: ContentInspectionConfig;
  onChange: (c: ContentInspectionConfig) => void;
}) {
  const [expandTunnels, setExpandTunnels] = useState(true);
  const [expandHeaders, setExpandHeaders] = useState(false);
  const [expandCspPresets, setExpandCspPresets] = useState(false);
  const [newHeader, setNewHeader] = useState<Partial<HeaderRule>>({});

  const updateTunnelAction = (id: string, action: TunnelProtocol['action']) => {
    onChange({
      ...config,
      tunnelProtocols: config.tunnelProtocols.map(t =>
        t.id === id ? { ...t, action } : t
      ),
    });
  };

  const addHeaderRule = () => {
    if (!newHeader.headerName) return;
    const rule: HeaderRule = {
      id: `h${Date.now()}`,
      headerName: newHeader.headerName || '',
      condition: newHeader.condition || 'contains',
      value: newHeader.value || '',
      action: newHeader.action || 'alert',
    };
    onChange({ ...config, headerRules: [...config.headerRules, rule] });
    setNewHeader({});
  };

  const removeHeaderRule = (id: string) => {
    onChange({ ...config, headerRules: config.headerRules.filter(r => r.id !== id) });
  };

  const severityColor: Record<string, string> = {
    critical: 'text-red-400 bg-red-900/30 border-red-800/50',
    high: 'text-orange-400 bg-orange-900/30 border-orange-800/50',
    medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50',
    low: 'text-blue-400 bg-blue-900/30 border-blue-800/50',
  };

  const actionColor: Record<string, string> = {
    block: 'bg-red-600 text-white',
    detect: 'bg-blue-600 text-white',
    alert: 'bg-yellow-600 text-white',
    off: 'bg-gray-700 text-gray-400',
    allow: 'bg-green-600 text-white',
    strip: 'bg-orange-600 text-white',
  };

  const activeCount = config.tunnelProtocols.filter(t => t.action !== 'off').length;

  return (
    <div className="space-y-4">
      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-purple-400" />
          <span className="text-sm font-medium">Content & Header Inspection</span>
        </div>
        <button
          onClick={() => onChange({ ...config, enabled: !config.enabled })}
          className={`w-9 h-5 rounded-full transition-colors relative ${config.enabled ? 'bg-purple-600' : 'bg-gray-700'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.enabled ? 'left-4' : 'left-0.5'}`} />
        </button>
      </div>

      {config.enabled && (
        <div className="space-y-4 pl-1">
          {/* ── Tunnel Protocol Detection ─────────────────────── */}
          <div>
            <button
              onClick={() => setExpandTunnels(!expandTunnels)}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 w-full"
            >
              {expandTunnels ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Tunnel-in-Tunnel Detection
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 font-normal normal-case">
                {activeCount}/{config.tunnelProtocols.length} active
              </span>
            </button>

            {expandTunnels && (
              <div className="mt-2 space-y-1.5">
                {config.tunnelProtocols.map(tp => (
                  <div
                    key={tp.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                      tp.action === 'off'
                        ? 'bg-gray-800/30 border-gray-800 opacity-50'
                        : 'bg-gray-800/50 border-gray-700'
                    }`}
                  >
                    {/* Severity badge */}
                    <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium border ${severityColor[tp.severity]}`}>
                      {tp.severity.toUpperCase()}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-200 truncate">{tp.label}</div>
                      <div className="text-[10px] text-gray-500 truncate">{tp.description}</div>
                    </div>

                    {/* Action selector */}
                    <div className="flex gap-0.5 flex-shrink-0">
                      {(['block', 'detect', 'alert', 'off'] as const).map(a => (
                        <button
                          key={a}
                          onClick={() => updateTunnelAction(tp.id, a)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                            tp.action === a ? actionColor[a] : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          {a.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Header Rules ──────────────────────────────────── */}
          <div>
            <button
              onClick={() => setExpandHeaders(!expandHeaders)}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 w-full"
            >
              {expandHeaders ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              HTTP Header Rules
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 font-normal normal-case">
                {config.headerRules.length} rules
              </span>
            </button>

            {expandHeaders && (
              <div className="mt-2 space-y-2">
                {/* Existing rules */}
                {config.headerRules.map(rule => (
                  <div key={rule.id} className="flex items-center gap-2 p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs overflow-x-auto">
                    <code className="text-blue-300 font-mono">{rule.headerName}</code>
                    <span className="text-gray-500">{rule.condition.replace('_', ' ')}</span>
                    {rule.value && <code className="text-green-300 font-mono">{rule.value}</code>}
                    <span className="text-gray-500">→</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${actionColor[rule.action]}`}>
                      {rule.action.toUpperCase()}
                    </span>
                    <button
                      onClick={() => removeHeaderRule(rule.id)}
                      className="ml-auto text-gray-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* New rule form */}
                <div className="flex items-center gap-1.5 p-2 bg-gray-900/50 border border-gray-700 border-dashed rounded-lg">
                  <input
                    placeholder="Header name"
                    value={newHeader.headerName || ''}
                    onChange={e => setNewHeader({ ...newHeader, headerName: e.target.value })}
                    className="w-28 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs placeholder:text-gray-500 focus:outline-none"
                  />
                  <select
                    value={newHeader.condition || 'contains'}
                    onChange={e => setNewHeader({ ...newHeader, condition: e.target.value as HeaderRule['condition'] })}
                    className="px-1 py-1 bg-gray-800 border border-gray-600 rounded text-xs focus:outline-none"
                  >
                    <option value="contains">contains</option>
                    <option value="equals">equals</option>
                    <option value="matches_regex">matches regex</option>
                    <option value="not_contains">not contains</option>
                    <option value="exists">exists</option>
                  </select>
                  <input
                    placeholder="Value"
                    value={newHeader.value || ''}
                    onChange={e => setNewHeader({ ...newHeader, value: e.target.value })}
                    className="w-24 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs placeholder:text-gray-500 focus:outline-none"
                  />
                  <select
                    value={newHeader.action || 'alert'}
                    onChange={e => setNewHeader({ ...newHeader, action: e.target.value as HeaderRule['action'] })}
                    className="px-1 py-1 bg-gray-800 border border-gray-600 rounded text-xs focus:outline-none"
                  >
                    <option value="block">Block</option>
                    <option value="alert">Alert</option>
                    <option value="strip">Strip</option>
                    <option value="allow">Allow</option>
                  </select>
                  <button
                    onClick={addHeaderRule}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── CSP / CDN Custom Header Presets ─────────────── */}
          <div>
            <button
              onClick={() => setExpandCspPresets(!expandCspPresets)}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 w-full"
            >
              {expandCspPresets ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              CSP / CDN Header Presets
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-300 font-normal normal-case">
                <Cloud size={10} className="inline mr-0.5" />one-click
              </span>
            </button>
            {expandCspPresets && (
              <div className="mt-2 space-y-1.5">
                <p className="text-[10px] text-gray-500 mb-2">
                  Instantly allow custom headers used by major cloud providers and CDNs. Click a preset to add all its headers as &quot;allow&quot; rules.
                </p>
                {CSP_CDN_PRESETS.map(preset => {
                  const alreadyAdded = preset.headers.every(h =>
                    config.headerRules.some(r => r.headerName === h.name)
                  );
                  return (
                    <button
                      key={preset.id}
                      disabled={alreadyAdded}
                      onClick={() => {
                        const newRules: HeaderRule[] = preset.headers
                          .filter(h => !config.headerRules.some(r => r.headerName === h.name))
                          .map(h => ({
                            id: `csp-${Date.now()}-${h.name}`,
                            headerName: h.name,
                            condition: h.condition as HeaderRule['condition'],
                            value: h.value,
                            action: 'allow' as const,
                          }));
                        onChange({ ...config, headerRules: [...config.headerRules, ...newRules] });
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                        alreadyAdded
                          ? 'bg-green-900/20 border-green-800/40 text-green-400/60'
                          : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-cyan-700 hover:bg-cyan-900/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium">{preset.label}</span>
                        {alreadyAdded && <span className="text-[10px] text-green-400">✓ Added</span>}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {preset.headers.map(h => (
                          <code key={h.name} className="text-[10px] px-1 py-0.5 rounded bg-gray-700/60 text-cyan-300 font-mono">
                            {h.name}
                          </code>
                        ))}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{preset.description}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Advanced Options ───────────────────────────────── */}
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Inspect encrypted payloads (requires SSL Inspection)</span>
              <button
                onClick={() => onChange({ ...config, inspectEncryptedPayloads: !config.inspectEncryptedPayloads })}
                className={`w-8 h-4 rounded-full transition-colors relative ${config.inspectEncryptedPayloads ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${config.inspectEncryptedPayloads ? 'left-4' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Max inspection depth (nested tunnels)</span>
              <select
                value={config.maxInspectionDepth}
                onChange={e => onChange({ ...config, maxInspectionDepth: Number(e.target.value) })}
                className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map(d => (
                  <option key={d} value={d}>{d} layer{d > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Bypass inspection for sanctioned apps</span>
              <button
                onClick={() => onChange({ ...config, bypassForSanctionedApps: !config.bypassForSanctionedApps })}
                className={`w-8 h-4 rounded-full transition-colors relative ${config.bypassForSanctionedApps ? 'bg-green-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${config.bypassForSanctionedApps ? 'left-4' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Warning if no SSL inspection */}
          <div className="flex items-start gap-2 p-2 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
            <AlertTriangle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-yellow-300/80">
              Tunnel detection is most effective with SSL Inspection enabled. Without it, only unencrypted tunnel patterns (DNS tunneling, ICMP) can be detected.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
