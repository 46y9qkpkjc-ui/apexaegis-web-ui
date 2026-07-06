'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  Building2, Shield, Users, AlertTriangle, MonitorSmartphone, ArrowLeft, FileText,
} from 'lucide-react';
import { fetchTenantDetail, type TenantDetail } from '@/lib/tenants-api';
import { GhostedAppsCard } from '@/components/dashboard/ghosted-apps-card';
import { ReportToolbar } from '@/components/dashboard/report-toolbar';

// TenantDashboard renders one tenant's scoped dashboard. Used by the /tenants/[id]
// route and by the Overview when a tenant is active in the switcher.
export function TenantDashboard({ tenantId, showBackLink = false }: { tenantId: string; showBackLink?: boolean }) {
  const [detail, setDetail] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchTenantDetail(tenantId)
      .then(d => { if (alive) { setDetail(d); setError(''); } })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : 'Failed to load'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tenantId]);

  const s = detail?.summary;

  function buildReport(): string {
    if (!detail) return '';
    const d = detail;
    const lines: string[] = [
      `TENANT REPORT — ${d.summary.tenant_name} (${tenantId})`, '',
      `Type ${d.summary.tenant_type}/${d.summary.plan} · region ${d.summary.region}`,
      `Client users ${d.summary.client_users} · policies ${d.summary.policies} · devices ${d.summary.devices} · DNS blocked ${d.summary.dns_blocked}`,
      '', `GHOSTED APPS & SERVICES (${d.ghosted_apps.length})`,
    ];
    d.ghosted_apps.forEach(g => lines.push(`  ${g.name} [${g.risk_level}] — ${g.device_count} devices`));
    lines.push('', `RECENT DNS ACTIVITY (${d.recent_blocks.length})`);
    d.recent_blocks.slice(0, 20).forEach(r => lines.push(`  ${r.domain} — ${r.verdict} (${r.policy_name || '—'})`));
    return lines.join('\n');
  }

  return (
    <div className="space-y-6">
      {showBackLink && (
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300">
          <ArrowLeft size={13} /> Consolidated Overview
        </Link>
      )}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="text-cyan-400" size={24} />
            {s?.tenant_name ?? 'Tenant'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            <span className="text-gray-400">Tenant ID:</span> <span className="font-mono">{tenantId}</span>
            {s && <> · <span className="capitalize">{s.tenant_type}</span> · {s.plan} · {s.region}</>}
          </p>
        </div>
        {detail && <ReportToolbar title={`Tenant Report — ${detail.summary.tenant_name}`} buildBody={buildReport} />}
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}
      {loading && <div className="text-gray-500 text-sm">Loading…</div>}

      {s && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={Users} label="Client Users" value={s.client_users} color="text-purple-400" />
            <Stat icon={Shield} label="Policies" value={s.policies} color="text-blue-400" />
            <Stat icon={MonitorSmartphone} label="Devices" value={s.devices} color="text-cyan-400" />
            <Stat icon={AlertTriangle} label="DNS Blocked" value={s.dns_blocked} color="text-red-400" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 text-sm font-semibold flex items-center gap-2">
                <AlertTriangle size={15} className="text-orange-400" /> Recent DNS Activity
              </div>
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800 sticky top-0 bg-gray-900">
                      <th className="text-left font-medium px-3 py-2">Domain</th>
                      <th className="text-left font-medium px-3 py-2">Verdict</th>
                      <th className="text-left font-medium px-3 py-2">Policy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail!.recent_blocks.length === 0 && (
                      <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-500">No activity yet.</td></tr>
                    )}
                    {detail!.recent_blocks.map((r, i) => (
                      <tr key={i} className="border-b border-gray-800/50">
                        <td className="px-3 py-2 font-mono text-xs text-gray-300">{r.domain}</td>
                        <td className="px-3 py-2">
                          <span className={clsx('text-[11px] px-1.5 py-0.5 rounded',
                            r.verdict === 'blocked' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400')}>
                            {r.verdict}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-400">{r.policy_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 text-sm font-semibold flex items-center gap-2">
                <FileText size={15} className="text-blue-400" /> Policies
              </div>
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800 sticky top-0 bg-gray-900">
                      <th className="text-left font-medium px-3 py-2">Seq</th>
                      <th className="text-left font-medium px-3 py-2">Name</th>
                      <th className="text-left font-medium px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail!.policies.length === 0 && (
                      <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-500">No policies yet.</td></tr>
                    )}
                    {detail!.policies.map(p => (
                      <tr key={p.id} className="border-b border-gray-800/50">
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{p.sequence}</td>
                        <td className="px-3 py-2 text-xs text-gray-300">{p.name}</td>
                        <td className="px-3 py-2">
                          <span className={clsx('text-[11px] px-1.5 py-0.5 rounded',
                            p.action === 'deny' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400')}>
                            {p.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <GhostedAppsCard apps={detail!.ghosted_apps} showTenant={false} />
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: {
  icon: typeof Shield; label: string; value: number; color: string;
}) {
  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Icon size={15} className={color} /> {label}
      </div>
      <div className="text-2xl font-bold mt-2">{value.toLocaleString()}</div>
    </div>
  );
}
