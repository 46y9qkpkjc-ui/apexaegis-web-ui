'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Key, Copy, CheckCircle, XCircle, Clock, RefreshCw, Plus, X,
  Shield, Globe, Server, AlertTriangle, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchTenantSummaries, type TenantSummary } from '@/lib/tenants-api';
import {
  generateRegistrationCode,
  fetchRegistrationCodes,
  revokeRegistrationCode,
  type RegistrationCode,
} from '@/lib/gateway-reg-api';

/* ─── Demo data (shown when API is unreachable) ─────────────── */
const DEMO_CODES: RegistrationCode[] = [
  {
    id: 'rc-1', code: 'AXG-9K2M-P4X7-QW3N', tenant_id: 'aspire', tenant_name: 'Aspire',
    gateway_type: 'internet-swg', description: 'ad-gw.apexaegis.app — AD gateway for Aspire',
    created_at: '2026-08-22T10:00:00Z', expires_at: '2026-08-23T10:00:00Z',
    status: 'active',
  },
  {
    id: 'rc-2', code: 'AXG-7H5L-M2R9-TY6B', tenant_id: 'aspire', tenant_name: 'Aspire',
    gateway_type: 'private-access', description: 'SYD gateway — Sydney POP for Aspire',
    created_at: '2026-08-22T11:00:00Z', expires_at: '2026-08-23T11:00:00Z',
    status: 'active',
  },
  {
    id: 'rc-3', code: 'AXG-3N8K-W6P1-VJ4D', tenant_id: 'starhub', tenant_name: 'StarHub',
    gateway_type: 'internet-swg', description: 'Regional SWG — StarHub APAC',
    created_at: '2026-08-20T08:00:00Z', expires_at: '2026-08-21T08:00:00Z',
    status: 'used', used_by_gateway_id: 'gw-sg-starhub-01', used_at: '2026-08-20T09:15:00Z',
  },
  {
    id: 'rc-4', code: 'AXG-1Q4Z-X8C5-NK7Y', tenant_id: 'singtel', tenant_name: 'Singtel',
    gateway_type: 'private-access', description: 'Private access gateway — Singtel DC',
    created_at: '2026-08-19T14:00:00Z', expires_at: '2026-08-20T14:00:00Z',
    status: 'expired',
  },
];

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  'private-access': { label: 'Private Access SWG', color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-800' },
  'internet-swg': { label: 'Internet SWG', color: 'text-cyan-400', bg: 'bg-cyan-900/30 border-cyan-800' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', color: 'text-green-400', bg: 'bg-green-900/30 border-green-800', icon: CheckCircle },
  used: { label: 'Used', color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-800', icon: CheckCircle },
  expired: { label: 'Expired', color: 'text-gray-400', bg: 'bg-gray-800 border-gray-700', icon: Clock },
  revoked: { label: 'Revoked', color: 'text-red-400', bg: 'bg-red-900/30 border-red-800', icon: XCircle },
};

function maskCode(code: string): string {
  const parts = code.split('-');
  if (parts.length === 4) return `${parts[0]}-****-****-${parts[3]}`;
  return code.slice(0, 4) + '****' + code.slice(-4);
}

/* ─── Component ─────────────────────────────────────────────── */
export default function GatewayRegistrationPage() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [selectedTenant, setSelectedTenant] = useState('');
  const [gatewayType, setGatewayType] = useState<'private-access' | 'internet-swg'>('internet-swg');
  const [description, setDescription] = useState('');
  const [generatedCode, setGeneratedCode] = useState<RegistrationCode | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, c] = await Promise.all([fetchTenantSummaries(), fetchRegistrationCodes()]);
      setTenants(t);
      setCodes(c);
    } catch {
      // Fallback to demo data
      setTenants([
        { tenant_id: 'aspire', tenant_name: 'Aspire', tenant_type: 'consumer', operator: 'StarHub', plan: 'enterprise', region: 'APAC', status: 'active', admins: 3, client_users: 120, policies: 18, devices: 85, dns_total: 45000, dns_blocked: 320 },
        { tenant_id: 'starhub', tenant_name: 'StarHub', tenant_type: 'operator', operator: 'StarHub', plan: 'enterprise', region: 'APAC', status: 'active', admins: 5, client_users: 340, policies: 42, devices: 210, dns_total: 120000, dns_blocked: 890 },
        { tenant_id: 'singtel', tenant_name: 'Singtel', tenant_type: 'operator', operator: 'Singtel', plan: 'enterprise', region: 'APAC', status: 'active', admins: 4, client_users: 280, policies: 35, devices: 180, dns_total: 95000, dns_blocked: 670 },
      ]);
      setCodes(DEMO_CODES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    if (!selectedTenant) { toast.error('Select a tenant'); return; }
    setGenerating(true);
    try {
      const code = await generateRegistrationCode({
        tenant_id: selectedTenant,
        gateway_type: gatewayType,
        description,
      });
      setGeneratedCode(code);
      setCodes(prev => [code, ...prev]);
      toast.success('Registration code generated');
      setDescription('');
    } catch {
      // Demo fallback
      const tenant = tenants.find(t => t.tenant_id === selectedTenant);
      const demo: RegistrationCode = {
        id: `rc-${Date.now()}`,
        code: `AXG-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        tenant_id: selectedTenant,
        tenant_name: tenant?.tenant_name ?? selectedTenant,
        gateway_type: gatewayType,
        description: description || 'Manually generated registration code',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
        status: 'active',
      };
      setGeneratedCode(demo);
      setCodes(prev => [demo, ...prev]);
      toast.success('Registration code generated (demo)');
      setDescription('');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Code copied to clipboard');
  };

  const handleRevoke = async (id: string) => {
    try { await revokeRegistrationCode(id); } catch { /* demo: proceed */ }
    setCodes(prev => prev.map(c => c.id === id ? { ...c, status: 'revoked' as const } : c));
    toast.success('Code revoked');
  };

  const activeCount = codes.filter(c => c.status === 'active').length;
  const usedCount = codes.filter(c => c.status === 'used').length;
  const expiredCount = codes.filter(c => c.status === 'expired' || c.status === 'revoked').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key size={24} className="text-cyan-400" />
          <div>
            <h1 className="text-xl font-semibold">Gateway Registration</h1>
            <p className="text-sm text-gray-500">
              Generate one-time registration codes for gateways to join the MP-plane as private or internet SWG
            </p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Codes', value: codes.length, icon: Key, color: 'text-cyan-400' },
          { label: 'Active Codes', value: activeCount, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Registered Gateways', value: usedCount, icon: Server, color: 'text-blue-400' },
          { label: 'Expired / Revoked', value: expiredCount, icon: Clock, color: 'text-gray-400' },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <k.icon size={14} className={k.color} />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">{k.label}</span>
            </div>
            <span className="text-lg font-semibold">{k.value}</span>
          </div>
        ))}
      </div>

      {/* Generate Code */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Plus size={16} className="text-cyan-400" /> Generate Registration Code
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1" htmlFor="reg-tenant">Tenant</label>
            <select
              id="reg-tenant"
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">Select tenant...</option>
              {tenants.map(t => (
                <option key={t.tenant_id} value={t.tenant_id}>{t.tenant_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1" htmlFor="reg-type">Gateway Type</label>
            <select
              id="reg-type"
              value={gatewayType}
              onChange={e => setGatewayType(e.target.value as typeof gatewayType)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50"
            >
              <option value="internet-swg">Internet SWG</option>
              <option value="private-access">Private Access SWG</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-400 mb-1" htmlFor="reg-desc">Description (optional)</label>
            <div className="flex gap-2">
              <input
                id="reg-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50"
                placeholder="e.g. ad-gw.apexaegis.app — Aspire AD gateway"
              />
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedTenant}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors"
              >
                {generating ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* Generated code display */}
        {generatedCode && (
          <div className="mt-4 p-4 bg-cyan-950/20 border border-cyan-800/30 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cyan-400 font-medium">Registration Code Generated</span>
              <button onClick={() => setGeneratedCode(null)} className="text-gray-500 hover:text-gray-300"><X size={14} /></button>
            </div>
            <div className="flex items-center gap-3">
              <code className="text-lg font-mono font-bold text-white tracking-wider">{generatedCode.code}</code>
              <button
                onClick={() => handleCopy(generatedCode.code, generatedCode.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors"
              >
                {copiedId === generatedCode.id ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                {copiedId === generatedCode.id ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
              <span>Tenant: <span className="text-gray-200">{generatedCode.tenant_name}</span></span>
              <span>Type: <span className={typeConfig[generatedCode.gateway_type].color}>{typeConfig[generatedCode.gateway_type].label}</span></span>
              <span>Expires: <span className="text-gray-200">{new Date(generatedCode.expires_at).toLocaleString()}</span></span>
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              Provide this code to the gateway. The gateway will call the MP-plane API with this code to register as a {typeConfig[generatedCode.gateway_type].label} for the {generatedCode.tenant_name} tenant.
            </p>
          </div>
        )}
      </div>

      {/* Codes table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Shield size={16} className="text-cyan-400" /> Registration Codes
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <RefreshCw size={16} className="animate-spin mr-2" /> Loading...
          </div>
        ) : codes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Key size={24} className="mb-2 opacity-40" />
            <p className="text-sm">No registration codes yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800 bg-gray-800/30">
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Tenant</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="text-left px-4 py-3 font-medium">Expires</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {codes.map(c => {
                const st = statusConfig[c.status];
                const StatusIcon = st.icon;
                const tc = typeConfig[c.gateway_type];
                return (
                  <tr key={c.id} className="hover:bg-gray-800/20">
                    <td className="px-4 py-3">
                      <code className="font-mono text-xs text-gray-200">{c.status === 'active' ? c.code : maskCode(c.code)}</code>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{c.tenant_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${tc.bg} ${tc.color}`}>{tc.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">{c.description || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.expires_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${st.bg} ${st.color}`}>
                        <StatusIcon size={10} /> {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {c.status === 'active' && (
                          <>
                            <button onClick={() => handleCopy(c.code, c.id)} className="p-1.5 hover:bg-gray-800 rounded transition-colors" title="Copy code">
                              {copiedId === c.id ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-400" />}
                            </button>
                            <button onClick={() => handleRevoke(c.id)} className="p-1.5 hover:bg-gray-800 rounded transition-colors" title="Revoke code">
                              <Trash2 size={12} className="text-red-400" />
                            </button>
                          </>
                        )}
                        {c.status === 'used' && (
                          <span className="text-[10px] text-gray-500">Used {c.used_at ? new Date(c.used_at).toLocaleDateString() : ''}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-cyan-950/20 via-gray-900 to-purple-950/20 border border-cyan-800/20 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-cyan-400 mb-3">How Gateway Registration Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {[
            { step: 1, title: 'Generate Code', desc: 'Admin selects a tenant and gateway type (Private or Internet SWG), then generates a one-time registration code.', color: 'text-cyan-400' },
            { step: 2, title: 'Provide to Gateway', desc: 'The registration code is provided to the gateway appliance (physical or virtual) via secure channel.', color: 'text-amber-400' },
            { step: 3, title: 'Gateway Registers', desc: 'The gateway calls the MP-plane API with the code. MP-plane validates the code, associates the gateway with the tenant, and provisions routes.', color: 'text-green-400' },
            { step: 4, title: 'Gateway Online', desc: 'The registered gateway appears in the Gateway Nodes page, ready to serve Private Access or Internet SWG traffic for the tenant.', color: 'text-purple-400' },
          ].map(s => (
            <div key={s.step} className="p-3 bg-gray-800/30 rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 text-[10px] font-bold ${s.color}`}>{s.step}</span>
              </div>
              <div className="font-medium text-gray-200 text-[11px] mb-1">{s.title}</div>
              <p className="text-[10px] text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
