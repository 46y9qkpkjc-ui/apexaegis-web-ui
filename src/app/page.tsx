'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  Building2, Shield, Users, AlertTriangle, ChevronRight, Layers,
  Clock, Activity, TrendingUp, TrendingDown, Timer, CheckCircle,
  BarChart3, Zap, Target,
} from 'lucide-react';
import { fetchTenantSummaries, fetchGhostedApps, type TenantSummary, type GhostedApp } from '@/lib/tenants-api';
import { GhostedAppsCard } from '@/components/dashboard/ghosted-apps-card';
import { ReportToolbar } from '@/components/dashboard/report-toolbar';
import { TenantDashboard } from '@/components/dashboard/tenant-dashboard';
import { useTenantContext } from '@/lib/tenant-context';
import { useAuthStore, isMspUser } from '@/lib/auth-store';

// SLI / MTTR / MTTD mock data for service level indicators
const SERVICE_LEVEL_DATA = {
  sli: {
    availability: 99.97,
    targetAvailability: 99.95,
    latencyP99: 42,
    latencyTarget: 50,
    throughputGbps: 12.4,
    errorRate: 0.03,
  },
  mttr: {
    current: 4.2,
    target: 5.0,
    trend: -12,
    p50: 3.1,
    p95: 8.7,
    p99: 14.2,
    last30Days: [4.8, 4.5, 4.2, 3.9, 4.1, 3.8, 4.2, 4.0, 3.7, 4.2, 3.5, 4.2, 3.9, 4.1, 3.8, 4.0, 3.6, 4.2, 3.9, 4.1, 3.8, 4.0, 3.6, 4.2, 3.9, 4.1, 3.8, 4.0, 3.6, 4.2],
  },
  mttd: {
    current: 1.8,
    target: 2.0,
    trend: -18,
    p50: 1.4,
    p95: 3.2,
    p99: 5.1,
    last30Days: [2.1, 1.9, 1.8, 1.7, 1.9, 1.6, 1.8, 1.7, 1.5, 1.8, 1.4, 1.8, 1.7, 1.9, 1.6, 1.7, 1.5, 1.8, 1.7, 1.9, 1.6, 1.7, 1.5, 1.8, 1.7, 1.9, 1.6, 1.7, 1.5, 1.8],
  },
  incidents: {
    total: 127,
    critical: 3,
    high: 12,
    medium: 45,
    low: 67,
    autoRemediated: 89,
    escalated: 18,
    meanTimeToEscalate: 2.4,
  },
};

function MiniSparkline({ data, color = '#06b6d4', height = 32 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 120;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

export default function OverviewPage() {
  const { active, setActive } = useTenantContext();
  const user = useAuthStore(s => s.user);
  const isMsp = isMspUser(user);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [ghosted, setGhosted] = useState<GhostedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [opFilter, setOpFilter] = useState('all');     // service provider / operator
  const [poolFilter, setPoolFilter] = useState('all'); // dedicated | shared resource pool

  // Preset the operator filter when arriving from the Partner Ladder (/?operator=…).
  useEffect(() => {
    const op = new URLSearchParams(window.location.search).get('operator');
    if (op) setOpFilter(op);
  }, []);

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

  // A single-tenant consumer (e.g. Samuel/Aspire) has no fleet view: land straight
  // on their own tenant's dashboard. There is no switcher and no consolidated
  // overview — the console only ever shows their org's data.
  if (!isMsp && user?.org_id) {
    return <TenantDashboard tenantId={user.org_id} />;
  }

  // When a tenant is active in the switcher, the home page shows that tenant's
  // dashboard (consistent with the scope banner) instead of the consolidated view.
  if (active) {
    return <TenantDashboard tenantId={active.id} />;
  }

  const firstName = user?.name?.split(' ')[0] ?? '';
  const welcome = user?.operator_scope
    ? `Welcome ${user.name} from ${user.operator_scope} — our most precious multitenant SASE customer.`
    : firstName
      ? `Welcome ${firstName} — ApexAegis platform overview across every operator.`
      : '';

  return (
    <div className="space-y-6">
      {welcome && (
        <div className="rounded-xl border border-cyan-600/40 bg-gradient-to-r from-cyan-600/10 to-transparent px-4 py-3">
          <p className="text-sm text-cyan-100 font-medium">{welcome}</p>
          {user?.operator_scope && (
            <p className="text-[11px] text-cyan-300/70 mt-0.5">
              You are managing the {user.operator_scope} fleet — every tenant below is yours to operate.
            </p>
          )}
        </div>
      )}
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

      {/* Service Level Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SLI Card */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target size={12} className="text-cyan-400" /> Service Level Indicator
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              SLA MET
            </span>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Availability</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${SERVICE_LEVEL_DATA.sli.availability}%` }} />
                </div>
                <span className="text-xs font-mono text-emerald-400">{SERVICE_LEVEL_DATA.sli.availability}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Latency P99</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(SERVICE_LEVEL_DATA.sli.latencyP99 / SERVICE_LEVEL_DATA.sli.latencyTarget) * 100}%` }} />
                </div>
                <span className="text-xs font-mono text-cyan-400">{SERVICE_LEVEL_DATA.sli.latencyP99}ms</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Throughput</span>
              <span className="text-xs font-mono text-purple-400">{SERVICE_LEVEL_DATA.sli.throughputGbps} Gbps</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Error Rate</span>
              <span className="text-xs font-mono text-green-400">{SERVICE_LEVEL_DATA.sli.errorRate}%</span>
            </div>
          </div>
        </div>

        {/* MTTR Card */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Timer size={12} className="text-amber-400" /> Mean Time to Resolve (MTTR)
            </h3>
            <span className={clsx(
              'text-[10px] px-1.5 py-0.5 rounded border',
              SERVICE_LEVEL_DATA.mttr.current <= SERVICE_LEVEL_DATA.mttr.target
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            )}>
              {SERVICE_LEVEL_DATA.mttr.trend}% vs last month
            </span>
          </div>
          <div className="flex items-end gap-3 mb-2">
            <span className="text-2xl font-bold text-white">{SERVICE_LEVEL_DATA.mttr.current}</span>
            <span className="text-xs text-gray-400 mb-1">min avg</span>
          </div>
          <MiniSparkline data={SERVICE_LEVEL_DATA.mttr.last30Days} color="#f59e0b" />
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center">
              <div className="text-[10px] text-gray-500">P50</div>
              <div className="text-xs font-mono text-gray-300">{SERVICE_LEVEL_DATA.mttr.p50}m</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-gray-500">P95</div>
              <div className="text-xs font-mono text-gray-300">{SERVICE_LEVEL_DATA.mttr.p95}m</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-gray-500">P99</div>
              <div className="text-xs font-mono text-gray-300">{SERVICE_LEVEL_DATA.mttr.p99}m</div>
            </div>
          </div>
        </div>

        {/* MTTD Card */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={12} className="text-purple-400" /> Mean Time to Detect (MTTD)
            </h3>
            <span className={clsx(
              'text-[10px] px-1.5 py-0.5 rounded border',
              SERVICE_LEVEL_DATA.mttd.current <= SERVICE_LEVEL_DATA.mttd.target
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            )}>
              {SERVICE_LEVEL_DATA.mttd.trend}% vs last month
            </span>
          </div>
          <div className="flex items-end gap-3 mb-2">
            <span className="text-2xl font-bold text-white">{SERVICE_LEVEL_DATA.mttd.current}</span>
            <span className="text-xs text-gray-400 mb-1">min avg</span>
          </div>
          <MiniSparkline data={SERVICE_LEVEL_DATA.mttd.last30Days} color="#a855f7" />
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center">
              <div className="text-[10px] text-gray-500">P50</div>
              <div className="text-xs font-mono text-gray-300">{SERVICE_LEVEL_DATA.mttd.p50}m</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-gray-500">P95</div>
              <div className="text-xs font-mono text-gray-300">{SERVICE_LEVEL_DATA.mttd.p95}m</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-gray-500">P99</div>
              <div className="text-xs font-mono text-gray-300">{SERVICE_LEVEL_DATA.mttd.p99}m</div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Summary */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={12} className="text-blue-400" /> Incident Summary (Last 30 Days)
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{SERVICE_LEVEL_DATA.incidents.total}</div>
            <div className="text-[10px] text-gray-500 uppercase">Total Incidents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{SERVICE_LEVEL_DATA.incidents.critical}</div>
            <div className="text-[10px] text-gray-500 uppercase">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{SERVICE_LEVEL_DATA.incidents.high}</div>
            <div className="text-[10px] text-gray-500 uppercase">High</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{SERVICE_LEVEL_DATA.incidents.medium}</div>
            <div className="text-[10px] text-gray-500 uppercase">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{SERVICE_LEVEL_DATA.incidents.low}</div>
            <div className="text-[10px] text-gray-500 uppercase">Low</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{SERVICE_LEVEL_DATA.incidents.autoRemediated}</div>
            <div className="text-[10px] text-gray-500 uppercase">Auto-Remediated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{SERVICE_LEVEL_DATA.incidents.meanTimeToEscalate}m</div>
            <div className="text-[10px] text-gray-500 uppercase">MTTE</div>
          </div>
        </div>
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
