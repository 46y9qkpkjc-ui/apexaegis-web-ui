'use client';

/**
 * Tenant Lookup Step — Auto-discovers tenant ID from organization domain.
 * Calls the MP API to reverse-lookup the tenant GUID from the domain name.
 * Supports Microsoft Entra ID, Google Workspace, Okta, and OneLogin.
 */

import { useState, useCallback } from 'react';
import { Building2, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Search, Globe2, RefreshCw } from 'lucide-react';

const ACCENT = '#6D4AFF';

interface TenantLookupStepProps {
  onNext: (data: TenantLookupResult) => void;
  onBack: () => void;
}

export interface TenantLookupResult {
  domain: string;
  provider: string;
  tenantId: string;
  tenantName: string;
  discoveredServices: string[];
}

const PROVIDERS = [
  { id: 'entra', name: 'Microsoft Entra ID', icon: '🏢', desc: 'Azure AD / Microsoft 365', discoverUrl: 'https://login.microsoftonline.com/{domain}/.well-known/openid-configuration' },
  { id: 'google', name: 'Google Workspace', icon: '🔷', desc: 'Google Cloud Identity', discoverUrl: 'https://accounts.google.com/.well-known/openid-configuration' },
  { id: 'okta', name: 'Okta', icon: '🔐', desc: 'Okta Identity Cloud', discoverUrl: 'https://{domain}/.well-known/openid-configuration' },
  { id: 'onelogin', name: 'OneLogin', icon: '🟢', desc: 'OneLogin SSO', discoverUrl: 'https://{domain}/.well-known/openid-configuration' },
];

// Tenant lookup — calls the MP API to reverse-lookup the tenant GUID
async function lookupTenant(domain: string, provider: string): Promise<TenantLookupResult> {
  const res = await fetch('/api/tenant/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, provider }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Tenant lookup failed');
  }
  return res.json();
}

export function TenantLookupStep({ onNext, onBack }: TenantLookupStepProps) {
  const [domain, setDomain] = useState('');
  const [provider, setProvider] = useState('entra');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TenantLookupResult | null>(null);
  const [error, setError] = useState('');

  const handleLookup = useCallback(async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await lookupTenant(domain.trim(), provider);
      setResult(res);
    } catch (err) {
      setError('Failed to lookup tenant. Please check the domain and try again.');
    } finally {
      setLoading(false);
    }
  }, [domain, provider]);

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Building2 size={18} style={{ color: ACCENT }} /> Organization Lookup
        </h2>
        <p className="text-sm text-gray-400">
          Enter your organization's domain and we'll automatically fetch your Tenant ID and discover your SaaS stack.
        </p>
      </div>

      {/* Domain Input */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Organization Domain</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="e.g. apexadversary.com"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#6D4AFF]/50 transition-colors"
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
            />
          </div>
          <button
            onClick={handleLookup}
            disabled={!domain.trim() || loading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all inline-flex items-center gap-2"
            style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            {loading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
      </div>

      {/* Provider Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Identity Provider</label>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`text-left p-3 rounded-xl border transition-all text-sm ${
                provider === p.id
                  ? 'border-[#6D4AFF]/50 bg-[#6D4AFF]/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <span className="text-lg mr-2">{p.icon}</span>
              <span className="text-white font-medium">{p.name}</span>
              <p className="text-gray-500 text-xs mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={15} className="text-red-400 shrink-0" />
          <span className="text-red-300 text-xs">{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-green-400" />
            <span className="text-green-300 text-sm font-medium">Tenant discovered successfully</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Tenant Name</span>
              <p className="text-white text-sm font-medium">{result.tenantName}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Tenant ID</span>
              <p className="text-white text-sm font-mono truncate">{result.tenantId}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Domain</span>
              <p className="text-white text-sm">{result.domain}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Provider</span>
              <p className="text-white text-sm">{PROVIDERS.find(p => p.id === result.provider)?.name}</p>
            </div>
          </div>

          {/* Discovered Services */}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 block">Discovered Services</span>
            <div className="flex flex-wrap gap-1.5">
              {result.discoveredServices.map(svc => (
                <span key={svc} className="text-[11px] px-2 py-0.5 rounded-full bg-[#6D4AFF]/15 text-[#a88bff] border border-[#6D4AFF]/25">
                  {svc}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNext(result)}
            className="w-full mt-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white inline-flex items-center justify-center gap-2 transition-all"
            style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}
          >
            Continue with this tenant <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200">
          <ArrowLeft size={15} /> Back
        </button>
        {result && (
          <button
            onClick={() => setResult(null)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200"
          >
            <RefreshCw size={14} /> Lookup different domain
          </button>
        )}
      </div>
    </div>
  );
}
