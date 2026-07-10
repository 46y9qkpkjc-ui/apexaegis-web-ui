'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  Building2, Shield, Users, AlertTriangle, ChevronRight, Layers,
} from 'lucide-react';
import { fetchTenantSummaries, fetchGhostedApps, type TenantSummary, type GhostedApp } from '@/lib/tenants-api';
import { GhostedAppsCard } from '@/components/dashboard/ghosted-apps-card';
import { ReportToolbar } from '@/components/dashboard/report-toolbar';
import { TenantDashboard } from '@/components/dashboard/tenant-dashboard';
import { useTenantContext } from '@/lib/tenant-context';

export default function OverviewPage() {
  const { active, setActive } = useTenantContext();
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [ghosted, setGhosted] = useState<GhostedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [opFilter, setOpFilter] = useState('all');     // service provider / operator
  const [poolFilter, setPoolFilter] = useState('all'); // dedicated | shared resource pool

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [t, g] = await Promise.all([fetchTenantSummaries(), fetchGhostedApps().catch(() => [])]);
        if (alive) { setTenants(t); setGhosted(g); setError(''); }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 30000); // auto-refresh as tenants onboard
    return () => { alive = false; clearInterval(t); };
  }, []);

  // Operators present in the data drive the level-1 (service provider) filter.
  const operators = useMemo(
    () => Array.from(new Set(tenants.map(t => t.operator).filter(Boolean))).sort(),
    [tenants],
  );
  // Level-1 (operator) + level-2 (dedicated/shared resource pool) filtering.
  const visible = useMemo(
    () => tenants.filter(t =>
      (opFilter === 'all' || t.operator === opFilter) &&
      (poolFilter === 'all' || t.tenant_type === poolFilter)),
    [tenants, opFilter, poolFilter],
  );

  const totals = useMemo(() => visible.reduce(
    (a, t) => ({
      clientUsers: a.clientUsers + t.client_users,
      policies: a.policies + t.policies,
      devices: a.devices + t.devices,
      blocked: a.blocked + t.dns_blocked,
    }),
    { clientUsers: 0, policies: 0, devices: 0, blocked: 0 },
  ), [visible]);

  function buildReport(): string {
    const lines: string[] = [];
    lines.push('CONSOLIDATED REPORT — ALL TENANTS');
    const scope = [opFilter !== 'all' ? `operator=${opFilter}` : '', poolFilter !== 'all' ? `pool=${poolFilter}` : ''].filter(Boolean).join(' · ');
    if (scope) lines.push(`Filter: ${scope}`);
    lines.push('');
    lines.push(`Tenants: ${visible.length}`);
    lines.push(`Total client users: ${totals.clientUsers} · policies: ${totals.policies} · DNS blocked: ${totals.blocked}`);
    lines.push('');
    lines.push('PER-TENANT SUMMARY');
    visible.forEach(t => lines.push(
      `  ${t.tenant_name} (${t.tenant_id}) — ${t.operator} · ${t.tenant_type}/${t.plan} · users ${t.client_users} · policies ${t.policies} · devices ${t.devices} · blocked ${t.dns_blocked}`));
    lines.push('');
    lines.push(`GHOSTED APPS & SERVICES (${ghosted.length})`);
    ghosted.forEach(g => lines.push(`  ${g.name} [${g.risk_level}] — ${g.device_count} devices · ${g.tenant_name}`));
    return lines.join('\n');
  }

  // When a tenant is active in the switcher, the home page shows that tenant's
  // dashboard (consistent with the scope banner) instead of the consolidated view.
  if (active) {
    return <TenantDashboard tenantId={active.id} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="order-2 sm:order-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="text-cyan-400" size={24} />
            Consolidated Overview
          </h1>
          <p className="text-sm text-gray-400 mt-1">Activity across all tenants. Select a tenant to drill into its dashboard.</p>
        </div>
        <div className="order-1 sm:order-2">
          <ReportToolbar title="Consolidated Report — All Tenants" buildBody={buildReport} />
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>
      )}

      {/* Aggregate stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Tenants" value={visible.length} color="cyan" />
        <StatCard icon={Users} label="Client Users" value={totals.clientUsers} color="purple" />
        <StatCard icon={Shield} label="Policies" value={totals.policies} color="blue" />
        <StatCard icon={AlertTriangle} label="DNS Blocked" value={totals.blocked} color="red" />
      </div>

      {/* Consolidated per-tenant table */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold flex items-center gap-2">
            <Building2 size={16} className="text-cyan-400" /> Tenants
          </span>
          <span className="text-[11px] text-gray-500">{visible.length} of {tenants.length}</span>
          <div className="ml-auto flex items-center gap-2">
            {/* Level 1 — service provider / operator (the "overall apexastute" view) */}
            <select value={opFilter} onChange={e => setOpFilter(e.target.value)} aria-label="Filter by operator"
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/60">
              <option value="all">All operators</option>
              {operators.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
            {/* Level 2 — dedicated / shared resource pool */}
            <select value={poolFilter} onChange={e => setPoolFilter(e.target.value)} aria-label="Filter by resource pool"
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/60">
              <option value="all">All resource pools</option>
              <option value="dedicated">Dedicated</option>
              <option value="shared">Shared</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="text-left font-medium px-4 py-2">Tenant Name</th>
                <th className="text-left font-medium px-4 py-2">Tenant ID</th>
                <th className="text-left font-medium px-4 py-2">Type</th>
                <th className="text-left font-medium px-4 py-2">Operator</th>
                <th className="text-left font-medium px-4 py-2">Plan</th>
                <th className="text-right font-medium px-4 py-2">Client Users</th>
                <th className="text-right font-medium px-4 py-2">Policies</th>
                <th className="text-right font-medium px-4 py-2">Devices</th>
                <th className="text-right font-medium px-4 py-2">DNS Blocked</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>
              )}
              {!loading && visible.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-6 text-center text-gray-500">{tenants.length === 0 ? 'No tenants yet.' : 'No tenants match the filters.'}</td></tr>
              )}
              {visible.map(t => (
                <tr key={t.tenant_id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-2.5">
                    <button onClick={() => setActive({ id: t.tenant_id, name: t.tenant_name })}
                      className="font-medium text-gray-200 hover:text-cyan-400 flex items-center gap-2">
                      <Building2 size={13} className="text-gray-500" /> {t.tenant_name}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-gray-500">{t.tenant_id}</td>
                  <td className="px-4 py-2.5">
                    <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border',
                      t.tenant_type === 'dedicated'
                        ? 'bg-purple-900/30 text-purple-300 border-purple-800'
                        : 'bg-gray-800 text-gray-300 border-gray-700')}>
                      {t.tenant_type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-300">{t.operator}</td>
                  <td className="px-4 py-2.5 text-gray-400">{t.plan}</td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{t.client_users}</td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{t.policies}</td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{t.devices}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={clsx('font-mono', t.dns_blocked > 0 ? 'text-red-400' : 'text-gray-500')}>{t.dns_blocked}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => setActive({ id: t.tenant_id, name: t.tenant_name })}
                      className="text-gray-500 hover:text-cyan-400 inline-flex">
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ghosted apps across all tenants */}
      <GhostedAppsCard apps={ghosted} showTenant />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Shield; label: string; value: number; color: 'cyan' | 'purple' | 'blue' | 'red';
}) {
  const colors: Record<string, string> = {
    cyan: 'text-cyan-400', purple: 'text-purple-400', blue: 'text-blue-400', red: 'text-red-400',
  };
  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Icon size={15} className={colors[color]} /> {label}
      </div>
      <div className="text-2xl font-bold mt-2">{value.toLocaleString()}</div>
    </div>
  );
}
