'use client';
import { useState } from 'react';
import {
  Globe, Plus, Search, Shield, CheckCircle2, XCircle,
  AlertTriangle, Building2, Users, Lock, Eye, X,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ──────────────────────────────────────────────────── */

type TenantStatus = 'sanctioned' | 'unsanctioned' | 'unmanaged';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface CloudAppTenant {
  id: string;
  app_name: string;
  app_icon: string;
  tenant_id: string;
  tenant_name: string;
  domain: string;
  status: TenantStatus;
  risk: RiskLevel;
  category: string;
  owner: string;
  users_active: number;
  data_uploaded_gb: number;
  data_downloaded_gb: number;
  dlp_violations: number;
  last_activity: string;
  sso_enforced: boolean;
  casb_inline: boolean;
  api_connected: boolean;
  compliance: string[];
}

/* ─── Demo Data ──────────────────────────────────────────────── */

const demoTenants: CloudAppTenant[] = [
  {
    id: '1', app_name: 'Microsoft 365', app_icon: 'M365', tenant_id: 'f8cdef78-1234-4abc-9def-567890abcdef',
    tenant_name: 'ApexAegis Corp (Production)', domain: 'apexaegis.onmicrosoft.com', status: 'sanctioned',
    risk: 'low', category: 'Productivity', owner: 'IT Operations', users_active: 487,
    data_uploaded_gb: 142.7, data_downloaded_gb: 89.3, dlp_violations: 2, last_activity: '1 min ago',
    sso_enforced: true, casb_inline: true, api_connected: true, compliance: ['SOC2', 'ISO27001', 'GDPR'],
  },
  {
    id: '2', app_name: 'Microsoft 365', app_icon: 'M365', tenant_id: 'a1b2c3d4-5678-4ef0-abcd-ef0123456789',
    tenant_name: 'ApexAegis Sandbox (Dev/Test)', domain: 'apexaegis-dev.onmicrosoft.com', status: 'sanctioned',
    risk: 'medium', category: 'Productivity', owner: 'DevOps Team', users_active: 34,
    data_uploaded_gb: 8.1, data_downloaded_gb: 5.2, dlp_violations: 0, last_activity: '15 min ago',
    sso_enforced: true, casb_inline: false, api_connected: true, compliance: ['SOC2'],
  },
  {
    id: '3', app_name: 'Salesforce', app_icon: 'SF', tenant_id: '00D5g000007kXmQ',
    tenant_name: 'APAC Sales Org', domain: 'apexaegis.my.salesforce.com', status: 'sanctioned',
    risk: 'low', category: 'CRM', owner: 'Sales Ops', users_active: 120,
    data_uploaded_gb: 23.4, data_downloaded_gb: 67.8, dlp_violations: 5, last_activity: '3 min ago',
    sso_enforced: true, casb_inline: true, api_connected: true, compliance: ['SOC2', 'ISO27001'],
  },
  {
    id: '4', app_name: 'Salesforce', app_icon: 'SF', tenant_id: '00D7g000009LMNOP',
    tenant_name: 'Partner Portal (External)', domain: 'apexaegis-partners.my.salesforce.com', status: 'sanctioned',
    risk: 'medium', category: 'CRM', owner: 'Partner Enablement', users_active: 45,
    data_uploaded_gb: 3.1, data_downloaded_gb: 12.9, dlp_violations: 1, last_activity: '1 hr ago',
    sso_enforced: true, casb_inline: true, api_connected: false, compliance: ['SOC2'],
  },
  {
    id: '5', app_name: 'Slack', app_icon: 'SL', tenant_id: 'T04QZAA00BB',
    tenant_name: 'ApexAegis Engineering', domain: 'apexaegis-eng.slack.com', status: 'sanctioned',
    risk: 'low', category: 'Collaboration', owner: 'Engineering', users_active: 210,
    data_uploaded_gb: 34.2, data_downloaded_gb: 18.7, dlp_violations: 3, last_activity: '30 sec ago',
    sso_enforced: true, casb_inline: true, api_connected: true, compliance: ['SOC2', 'ISO27001'],
  },
  {
    id: '6', app_name: 'Google Workspace', app_icon: 'GW', tenant_id: 'C02abc123',
    tenant_name: 'Unknown Google Org (Shadow IT)', domain: 'apexaegis-mktg.google.com', status: 'unsanctioned',
    risk: 'high', category: 'Productivity', owner: 'Marketing (Unverified)', users_active: 18,
    data_uploaded_gb: 11.4, data_downloaded_gb: 7.8, dlp_violations: 8, last_activity: '22 min ago',
    sso_enforced: false, casb_inline: false, api_connected: false, compliance: [],
  },
  {
    id: '7', app_name: 'AWS', app_icon: 'AWS', tenant_id: '123456789012',
    tenant_name: 'ApexAegis Production Account', domain: 'aws.amazon.com', status: 'sanctioned',
    risk: 'low', category: 'IaaS', owner: 'Cloud Infra', users_active: 52,
    data_uploaded_gb: 890.0, data_downloaded_gb: 450.3, dlp_violations: 0, last_activity: '5 sec ago',
    sso_enforced: true, casb_inline: false, api_connected: true, compliance: ['SOC2', 'ISO27001', 'PCI-DSS'],
  },
  {
    id: '8', app_name: 'Dropbox', app_icon: 'DB', tenant_id: 'dbmid:AAF0wLq_example',
    tenant_name: 'Personal Dropbox (Shadow IT)', domain: 'dropbox.com', status: 'unsanctioned',
    risk: 'critical', category: 'File Sharing', owner: 'Unknown', users_active: 7,
    data_uploaded_gb: 4.7, data_downloaded_gb: 0.9, dlp_violations: 12, last_activity: '4 hr ago',
    sso_enforced: false, casb_inline: false, api_connected: false, compliance: [],
  },
  {
    id: '9', app_name: 'ServiceNow', app_icon: 'SN', tenant_id: 'apexaegisprod',
    tenant_name: 'ApexAegis ITSM', domain: 'apexaegis.service-now.com', status: 'sanctioned',
    risk: 'low', category: 'ITSM', owner: 'IT Service Desk', users_active: 89,
    data_uploaded_gb: 5.3, data_downloaded_gb: 14.1, dlp_violations: 0, last_activity: '10 min ago',
    sso_enforced: true, casb_inline: true, api_connected: true, compliance: ['SOC2', 'ISO27001'],
  },
  {
    id: '10', app_name: 'ChatGPT Enterprise', app_icon: 'AI', tenant_id: 'org-Xk4mP9example',
    tenant_name: 'Unmanaged ChatGPT Usage', domain: 'chat.openai.com', status: 'unmanaged',
    risk: 'high', category: 'AI/ML', owner: 'Various', users_active: 64,
    data_uploaded_gb: 1.2, data_downloaded_gb: 0.3, dlp_violations: 14, last_activity: '8 min ago',
    sso_enforced: false, casb_inline: false, api_connected: false, compliance: [],
  },
];

const statusConfig: Record<TenantStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  sanctioned: { label: 'Sanctioned', color: 'bg-green-900/30 text-green-400 border-green-800/40', icon: CheckCircle2 },
  unsanctioned: { label: 'Unsanctioned', color: 'bg-red-900/30 text-red-400 border-red-800/40', icon: XCircle },
  unmanaged: { label: 'Unmanaged', color: 'bg-amber-900/30 text-amber-400 border-amber-800/40', icon: AlertTriangle },
};

const riskColor: Record<RiskLevel, string> = {
  low: 'bg-green-900/30 text-green-400 border-green-800/40',
  medium: 'bg-amber-900/30 text-amber-400 border-amber-800/40',
  high: 'bg-red-900/30 text-red-400 border-red-800/40',
  critical: 'bg-red-900/50 text-red-300 border-red-700/50',
};

/* ─── Component ──────────────────────────────────────────────── */

export default function CloudAppTenantsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TenantStatus>('all');
  const [selectedTenant, setSelectedTenant] = useState<CloudAppTenant | null>(null);

  const filtered = demoTenants.filter(t => {
    const matchSearch = search === '' || t.app_name.toLowerCase().includes(search.toLowerCase()) || t.tenant_name.toLowerCase().includes(search.toLowerCase()) || t.tenant_id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sanctionedCount = demoTenants.filter(t => t.status === 'sanctioned').length;
  const unsanctionedCount = demoTenants.filter(t => t.status === 'unsanctioned').length;
  const unmanagedCount = demoTenants.filter(t => t.status === 'unmanaged').length;
  const totalDlp = demoTenants.reduce((s, t) => s + t.dlp_violations, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-900/30 rounded-lg"><Building2 size={20} className="text-cyan-400" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cloud Application Tenants</h1>
            <p className="text-xs text-gray-500 mt-0.5">Tenant-aware visibility into SaaS instances — sanctioned, unsanctioned &amp; shadow IT</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 text-cyan-400 border border-cyan-600/30 rounded-lg text-xs hover:bg-cyan-600/30 transition-colors">
          <Plus size={13} /> Register Tenant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Tenants', value: demoTenants.length, color: 'text-blue-400' },
          { label: 'Sanctioned', value: sanctionedCount, color: 'text-green-400' },
          { label: 'Unsanctioned', value: unsanctionedCount, color: 'text-red-400' },
          { label: 'Unmanaged', value: unmanagedCount, color: 'text-amber-400' },
          { label: 'DLP Violations', value: totalDlp, color: totalDlp > 0 ? 'text-red-400' : 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-3">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Shadow IT Alert */}
      {(unsanctionedCount + unmanagedCount > 0) && (
        <div className="bg-red-950/20 border border-red-800/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-red-400">{unsanctionedCount + unmanagedCount} Shadow IT Tenant(s) Detected</div>
            <div className="text-[11px] text-gray-400">
              Unsanctioned or unmanaged cloud app instances are being used outside corporate governance. {demoTenants.filter(t => t.status !== 'sanctioned').reduce((s, t) => s + t.dlp_violations, 0)} DLP violations from these tenants.
            </div>
          </div>
          <button className="px-3 py-1 text-[10px] bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors whitespace-nowrap">
            Review All
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search app, tenant, ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-800/30 border border-gray-700/50 rounded-lg text-xs placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40" />
        </div>
        <div className="flex gap-1">
          {(['all', 'sanctioned', 'unsanctioned', 'unmanaged'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={clsx('px-2 py-1 rounded-md text-[10px] border transition-all capitalize',
                statusFilter === s ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/40' : 'text-gray-500 border-transparent hover:text-gray-300'
              )}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tenant Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="text-left px-3 py-2 font-medium">Application</th>
              <th className="text-left px-3 py-2 font-medium">Tenant / Instance</th>
              <th className="text-center px-3 py-2 font-medium">Status</th>
              <th className="text-center px-3 py-2 font-medium">Risk</th>
              <th className="text-right px-3 py-2 font-medium">Users</th>
              <th className="text-right px-3 py-2 font-medium">Upload</th>
              <th className="text-right px-3 py-2 font-medium">DLP</th>
              <th className="text-center px-3 py-2 font-medium">SSO</th>
              <th className="text-center px-3 py-2 font-medium">CASB</th>
              <th className="text-center px-3 py-2 font-medium">API</th>
              <th className="text-center px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filtered.map(t => {
              const sc = statusConfig[t.status];
              return (
                <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-[9px] font-bold text-gray-400 flex-shrink-0">{t.app_icon}</span>
                      <div>
                        <div className="font-medium text-gray-200">{t.app_name}</div>
                        <div className="text-[9px] text-gray-600">{t.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-gray-300 max-w-[180px] truncate">{t.tenant_name}</div>
                    <div className="text-[9px] text-gray-600 font-mono">{t.tenant_id.slice(0, 20)}{t.tenant_id.length > 20 ? '…' : ''}</div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${sc.color}`}>{sc.label}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] border capitalize ${riskColor[t.risk]}`}>{t.risk}</span>
                  </td>
                  <td className="px-3 py-2 text-right text-gray-300">{t.users_active}</td>
                  <td className="px-3 py-2 text-right text-gray-400">{t.data_uploaded_gb} GB</td>
                  <td className="px-3 py-2 text-right">
                    <span className={t.dlp_violations > 0 ? 'text-red-400 font-medium' : 'text-gray-500'}>{t.dlp_violations}</span>
                  </td>
                  <td className="px-3 py-2 text-center">{t.sso_enforced ? <CheckCircle2 size={13} className="text-green-400 inline-block" /> : <XCircle size={13} className="text-gray-700 inline-block" />}</td>
                  <td className="px-3 py-2 text-center">{t.casb_inline ? <CheckCircle2 size={13} className="text-green-400 inline-block" /> : <XCircle size={13} className="text-gray-700 inline-block" />}</td>
                  <td className="px-3 py-2 text-center">{t.api_connected ? <CheckCircle2 size={13} className="text-green-400 inline-block" /> : <XCircle size={13} className="text-gray-700 inline-block" />}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => setSelectedTenant(t)} className="text-gray-500 hover:text-cyan-400 transition-colors"><Eye size={13} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tenant Detail Slide-over */}
      {selectedTenant && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setSelectedTenant(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-gray-900 border-l border-gray-800 shadow-2xl overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Tenant Detail</h2>
              <button onClick={() => setSelectedTenant(null)} className="text-gray-500 hover:text-white"><X size={16} /></button>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">{selectedTenant.app_icon}</span>
              <div>
                <div className="font-semibold text-lg">{selectedTenant.app_name}</div>
                <div className="text-xs text-gray-500">{selectedTenant.tenant_name}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-gray-500 block">Tenant ID</span><span className="font-mono text-gray-300 break-all">{selectedTenant.tenant_id}</span></div>
              <div><span className="text-gray-500 block">Domain</span><span className="text-gray-300">{selectedTenant.domain}</span></div>
              <div><span className="text-gray-500 block">Category</span><span className="text-gray-300">{selectedTenant.category}</span></div>
              <div><span className="text-gray-500 block">Owner</span><span className="text-gray-300">{selectedTenant.owner}</span></div>
              <div><span className="text-gray-500 block">Status</span><span className={`px-1.5 py-0.5 rounded text-[9px] border ${statusConfig[selectedTenant.status].color}`}>{statusConfig[selectedTenant.status].label}</span></div>
              <div><span className="text-gray-500 block">Risk</span><span className={`px-1.5 py-0.5 rounded text-[9px] border capitalize ${riskColor[selectedTenant.risk]}`}>{selectedTenant.risk}</span></div>
            </div>

            <div className="border-t border-gray-800 pt-3 space-y-2 text-xs">
              <h4 className="text-gray-400 font-medium">Security Posture</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between"><span className="text-gray-500">SSO Enforced</span><span className={selectedTenant.sso_enforced ? 'text-green-400' : 'text-red-400'}>{selectedTenant.sso_enforced ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">CASB Inline</span><span className={selectedTenant.casb_inline ? 'text-green-400' : 'text-red-400'}>{selectedTenant.casb_inline ? 'Active' : 'Inactive'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">API Connected</span><span className={selectedTenant.api_connected ? 'text-green-400' : 'text-red-400'}>{selectedTenant.api_connected ? 'Connected' : 'Not Connected'}</span></div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-3 space-y-2 text-xs">
              <h4 className="text-gray-400 font-medium">Data Activity</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between"><span className="text-gray-500">Active Users</span><span>{selectedTenant.users_active}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Last Activity</span><span>{selectedTenant.last_activity}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Data Uploaded</span><span>{selectedTenant.data_uploaded_gb} GB</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Data Downloaded</span><span>{selectedTenant.data_downloaded_gb} GB</span></div>
                <div className="flex justify-between"><span className="text-gray-500">DLP Violations</span><span className={selectedTenant.dlp_violations > 0 ? 'text-red-400' : 'text-gray-300'}>{selectedTenant.dlp_violations}</span></div>
              </div>
            </div>

            {selectedTenant.compliance.length > 0 && (
              <div className="border-t border-gray-800 pt-3 space-y-2">
                <h4 className="text-xs text-gray-400 font-medium">Compliance</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTenant.compliance.map(c => (
                    <span key={c} className="px-2 py-0.5 rounded text-[9px] bg-blue-900/30 text-blue-400 border border-blue-800/40">{c}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-800 pt-3 flex gap-2">
              {selectedTenant.status === 'unsanctioned' && (
                <button className="flex-1 py-1.5 text-xs bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-600/30 transition-colors">Sanction Tenant</button>
              )}
              {selectedTenant.status !== 'sanctioned' && (
                <button className="flex-1 py-1.5 text-xs bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors">Block Tenant</button>
              )}
              <button className="flex-1 py-1.5 text-xs bg-gray-800 text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors">Edit Policy</button>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="text-[10px] text-gray-600 text-center py-2">
        Cloud Application Tenants &middot; ApexAegis SSE Platform &middot; Tenant discovery via CASB inline + API integration
      </div>
    </div>
  );
}
