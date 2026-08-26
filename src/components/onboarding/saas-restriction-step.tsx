'use client';

/**
 * SaaS Access & Tenant Restriction Step — Per-app tenant-scoped access configuration.
 * For each discovered SaaS app, configures the appropriate tenant restriction header.
 * Includes the custom header approval list for vendor-specific headers.
 */

import { useState } from 'react';
import {
  ArrowRight, ArrowLeft, Shield, CheckCircle2, AlertTriangle,
  Lock, Globe2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
  Settings2, Plus, Trash2, X
} from 'lucide-react';

const ACCENT = '#6D4AFF';

interface SaaSRestrictionStepProps {
  tenantData: {
    domain: string;
    provider: string;
    tenantId: string;
    tenantName: string;
    discoveredServices: string[];
  };
  onNext: (data: SaaSAccessConfig) => void;
  onBack: () => void;
}

export interface SaaSAccessConfig {
  enabledApps: AppRestriction[];
  customHeaders: CustomHeader[];
  enforcementMode: 'block' | 'warn' | 'log';
}

interface AppRestriction {
  id: string;
  name: string;
  enabled: boolean;
  header: string;
  headerValue: string;
  autoFilled: boolean;
  trustLevel: 'required' | 'recommended' | 'optional';
}

interface CustomHeader {
  name: string;
  valuePattern: string;
  trustLevel: 'required' | 'recommended' | 'optional';
}

const VENDOR_HEADERS: Record<string, { header: string; trustLevel: 'required' | 'recommended' | 'optional'; autoFill: (tenantId: string, domain: string) => string }> = {
  'Microsoft 365': {
    header: 'Restrict-Access-To-Tenants',
    trustLevel: 'required',
    autoFill: (tenantId) => tenantId,
  },
  'Google Workspace': {
    header: 'X-GoogApps-Allowed-Domains',
    trustLevel: 'required',
    autoFill: (_, domain) => domain,
  },
  'Slack Enterprise': {
    header: 'X-Slack-Allowed-Workspaces-Requester',
    trustLevel: 'recommended',
    autoFill: () => '',
  },
  'Dropbox Business': {
    header: 'X-Dropbox-allowed-Team-Ids',
    trustLevel: 'recommended',
    autoFill: () => '',
  },
  'Box Enterprise': {
    header: 'X-Box-Allowed-Enterprise-IDs',
    trustLevel: 'recommended',
    autoFill: () => '',
  },
  'GitHub Enterprise': {
    header: 'X-GitHub-Allowed-Orgs',
    trustLevel: 'recommended',
    autoFill: () => '',
  },
  'Cisco Webex': {
    header: 'X-Cisco-Allowed-Orgs',
    trustLevel: 'optional',
    autoFill: () => '',
  },
  'Salesforce': {
    header: 'X-Salesforce-Allowed-Org-Ids',
    trustLevel: 'optional',
    autoFill: () => '',
  },
  'Zoom Meetings': {
    header: 'X-Zoom-Allowed-Accounts',
    trustLevel: 'optional',
    autoFill: () => '',
  },
  'ChatGPT Enterprise': {
    header: 'X-OpenAI-Allowed-Orgs',
    trustLevel: 'optional',
    autoFill: () => '',
  },
  'Workday': {
    header: 'X-Workday-Allowed-Tenants',
    trustLevel: 'optional',
    autoFill: () => '',
  },
  'AWS Console': {
    header: 'aws:PrincipalOrgID',
    trustLevel: 'optional',
    autoFill: () => '',
  },
};

export function SaaSRestrictionStep({ tenantData, onNext, onBack }: SaaSRestrictionStepProps) {
  const [apps, setApps] = useState<AppRestriction[]>(() =>
    VENDOR_HEADERS
      ? Object.entries(VENDOR_HEADERS).map(([name, config]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          enabled: tenantData.discoveredServices.some(s =>
            name.toLowerCase().includes(s.toLowerCase()) ||
            s.toLowerCase().includes(name.toLowerCase().split(' ')[0])
          ),
          header: config.header,
          headerValue: config.autoFill(tenantData.tenantId, tenantData.domain),
          autoFilled: config.autoFill(tenantData.tenantId, tenantData.domain) !== '',
          trustLevel: config.trustLevel,
        }))
      : []
  );
  const [customHeaders, setCustomHeaders] = useState<CustomHeader[]>([]);
  const [enforcementMode, setEnforcementMode] = useState<'block' | 'warn' | 'log'>('block');
  const [showCustomHeaderForm, setShowCustomHeaderForm] = useState(false);
  const [newHeaderName, setNewHeaderName] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  const toggleApp = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const updateHeaderValue = (id: string, value: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, headerValue: value, autoFilled: false } : a));
  };

  const addCustomHeader = () => {
    if (!newHeaderName.trim()) return;
    setCustomHeaders(prev => [...prev, {
      name: newHeaderName.trim(),
      valuePattern: newHeaderValue.trim(),
      trustLevel: 'recommended',
    }]);
    setNewHeaderName('');
    setNewHeaderValue('');
    setShowCustomHeaderForm(false);
  };

  const removeCustomHeader = (idx: number) => {
    setCustomHeaders(prev => prev.filter((_, i) => i !== idx));
  };

  const enabledCount = apps.filter(a => a.enabled).length;

  return (
    <div className="space-y-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Shield size={18} style={{ color: ACCENT }} /> Tenant-Scoped SaaS Access
        </h2>
        <p className="text-sm text-gray-400">
          Configure per-app tenant restriction headers for <span className="text-white font-medium">{tenantData.tenantName}</span>.
          This ensures users can only access corporate SaaS instances, not personal accounts.
        </p>
      </div>

      {/* Enforcement Mode */}
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
        <label className="block text-xs font-medium text-gray-400 mb-2">Enforcement Mode</label>
        <div className="flex gap-2">
          {[
            { id: 'block', label: 'Block', desc: 'Block non-corporate access', icon: Lock },
            { id: 'warn', label: 'Warn', desc: 'Allow with warning', icon: AlertTriangle },
            { id: 'log', label: 'Log Only', desc: 'Audit mode, no enforcement', icon: Settings2 },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setEnforcementMode(mode.id as typeof enforcementMode)}
              className={`flex-1 p-2.5 rounded-lg border text-center transition-all ${
                enforcementMode === mode.id
                  ? 'border-[#6D4AFF]/50 bg-[#6D4AFF]/10'
                  : 'border-white/5 bg-white/[0.02] hover:border-white/10'
              }`}
            >
              <mode.icon size={14} className={`mx-auto mb-1 ${enforcementMode === mode.id ? 'text-[#6D4AFF]' : 'text-gray-500'}`} />
              <p className={`text-xs font-medium ${enforcementMode === mode.id ? 'text-white' : 'text-gray-400'}`}>{mode.label}</p>
              <p className="text-[10px] text-gray-500">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* App List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {apps.map(app => (
          <div key={app.id} className={`rounded-xl border transition-all ${
            app.enabled ? 'border-[#6D4AFF]/30 bg-[#6D4AFF]/5' : 'border-white/5 bg-white/[0.02]'
          }`}>
            <div className="flex items-center gap-3 p-3">
              <button
                onClick={() => toggleApp(app.id)}
                className="shrink-0"
              >
                {app.enabled ? (
                  <ToggleRight size={22} className="text-[#6D4AFF]" />
                ) : (
                  <ToggleLeft size={22} className="text-gray-600" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${app.enabled ? 'text-white' : 'text-gray-400'}`}>{app.name}</span>
                  {app.autoFilled && app.enabled && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20">AUTO</span>
                  )}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                    app.trustLevel === 'required' ? 'bg-red-500/15 text-red-400' :
                    app.trustLevel === 'recommended' ? 'bg-yellow-500/15 text-yellow-400' :
                    'bg-gray-500/15 text-gray-400'
                  }`}>
                    {app.trustLevel.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-mono truncate">{app.header}</p>
              </div>
              <button
                onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                className="shrink-0 text-gray-500 hover:text-gray-300"
              >
                {expandedApp === app.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Expanded: Header Value */}
            {expandedApp === app.id && app.enabled && (
              <div className="px-3 pb-3 space-y-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                    Header Value {app.autoFilled ? '(auto-filled from tenant lookup)' : ''}
                  </label>
                  <input
                    type="text"
                    value={app.headerValue}
                    onChange={e => updateHeaderValue(app.id, e.target.value)}
                    placeholder={app.trustLevel === 'required' ? 'Required — must set to enable this app' : 'Optional — leave empty to skip'}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono placeholder:text-gray-600 focus:outline-none focus:border-[#6D4AFF]/50"
                  />
                </div>
                <p className="text-[10px] text-gray-500">
                  {app.name === 'Microsoft 365' && 'The header value is your Entra ID Tenant GUID. Auto-fetched from the previous step.'}
                  {app.name === 'Google Workspace' && 'The header value is your primary Google Workspace domain.'}
                  {!['Microsoft 365', 'Google Workspace'].includes(app.name) && 'This value must be obtained from your admin console. Check the vendor documentation.'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom Headers */}
      <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-400">Custom Tenant Restriction Headers</span>
          <button
            onClick={() => setShowCustomHeaderForm(true)}
            className="text-[11px] px-2 py-1 rounded-lg bg-[#6D4AFF]/10 text-[#a88bff] hover:bg-[#6D4AFF]/20 transition-colors inline-flex items-center gap-1"
          >
            <Plus size={11} /> Add Header
          </button>
        </div>

        {customHeaders.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {customHeaders.map((h, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-xs text-white font-mono flex-1 truncate">{h.name}</span>
                <span className="text-[10px] text-gray-500 font-mono flex-1 truncate">{h.valuePattern || '(pattern)'}</span>
                <button onClick={() => removeCustomHeader(idx)} className="text-gray-500 hover:text-red-400 shrink-0">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showCustomHeaderForm && (
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 space-y-2">
            <input
              type="text"
              value={newHeaderName}
              onChange={e => setNewHeaderName(e.target.value)}
              placeholder="Header name (e.g. X-Custom-Tenant-Id)"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#6D4AFF]/50"
            />
            <input
              type="text"
              value={newHeaderValue}
              onChange={e => setNewHeaderValue(e.target.value)}
              placeholder="Value pattern (e.g. {tenant_id})"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#6D4AFF]/50"
            />
            <div className="flex gap-2">
              <button
                onClick={addCustomHeader}
                disabled={!newHeaderName.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40"
                style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}
              >
                Add
              </button>
              <button
                onClick={() => setShowCustomHeaderForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {customHeaders.length === 0 && !showCustomHeaderForm && (
          <p className="text-[11px] text-gray-600">No custom headers added. Use this for vendor-specific headers not in the list above.</p>
        )}
      </div>

      {/* Summary */}
      <div className="p-3 rounded-xl bg-[#6D4AFF]/5 border border-[#6D4AFF]/20">
        <p className="text-xs text-gray-300">
          <span className="font-medium text-white">{enabledCount}</span> apps configured for tenant restriction ·{' '}
          <span className="font-medium text-white">{customHeaders.length}</span> custom headers ·{' '}
          Mode: <span className="font-medium text-white capitalize">{enforcementMode}</span>
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200">
          <ArrowLeft size={15} /> Back
        </button>
        <button
          onClick={() => onNext({ enabledApps: apps, customHeaders, enforcementMode })}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all shadow-lg"
          style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}
        >
          Continue <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
