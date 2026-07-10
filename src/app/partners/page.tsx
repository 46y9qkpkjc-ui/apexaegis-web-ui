'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Building2, Network, Server, Users, ChevronRight, Layers } from 'lucide-react';
import { fetchOperators, fetchTenantSummaries, type OperatorSummary } from '@/lib/tenants-api';

export default function PartnersPage() {
  const [operators, setOperators] = useState<OperatorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOperators()
      .then((l) => { setOperators(l.operators ?? []); setError(''); })
      .catch(async () => {
        // Fallback: roll up from the live tenants endpoint until the MP /operators endpoint ships.
        try {
          const tenants = await fetchTenantSummaries();
          const map = new Map<string, OperatorSummary>();
          for (const t of tenants) {
            const op = t.operator || 'ApexAegis (direct)';
            const cur = map.get(op) ?? { operator: op, tenants: 0, dedicated: 0, shared: 0, devices: 0 };
            cur.tenants++;
            if (t.tenant_type === 'dedicated') cur.dedicated++; else if (t.tenant_type === 'shared') cur.shared++;
            cur.devices += t.devices || 0;
            map.set(op, cur);
          }
          setOperators([...map.values()].sort((a, b) => b.tenants - a.tenants));
          setError('');
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to load');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => operators.reduce(
    (a, o) => ({ tenants: a.tenants + o.tenants, dedicated: a.dedicated + o.dedicated, shared: a.shared + o.shared, devices: a.devices + o.devices }),
    { tenants: 0, dedicated: 0, shared: 0, devices: 0 },
  ), [operators]);
  const partnerCount = operators.filter((o) => o.operator !== 'ApexAegis (direct)').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Network className="text-cyan-400" size={24} /> Partner Ladder
        </h1>
        <p className="text-sm text-gray-400 mt-1">ApexAegis → service-provider operators → their tenants.</p>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}
      {loading && <div className="text-sm text-gray-500">Loading…</div>}

      {!loading && !error && (
        <>
          {/* Tier 1 — ApexAegis platform (top of the ladder) */}
          <div className="rounded-2xl border border-cyan-700/50 bg-gradient-to-b from-cyan-900/20 to-gray-900/40 p-6 text-center">
            <div className="inline-flex items-center gap-2 text-lg font-bold">
              <Building2 size={20} className="text-cyan-400" /> ApexAegis
            </div>
            <p className="text-xs text-gray-400 mt-1">White-label SASE platform</p>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm flex-wrap">
              <Stat label="Operators" value={partnerCount} />
              <Stat label="Tenants" value={totals.tenants} />
              <Stat label="Dedicated" value={totals.dedicated} />
              <Stat label="Shared" value={totals.shared} />
              <Stat label="Devices" value={totals.devices} />
            </div>
          </div>

          {/* connector */}
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-gray-700" />
            <span className="text-[11px] uppercase tracking-wider text-gray-500">partners with</span>
            <div className="w-px h-4 bg-gray-700" />
          </div>

          {/* Tier 2 — operators, each managing tenants (tier 3) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {operators.map((o) => {
              const direct = o.operator === 'ApexAegis (direct)';
              return (
                <Link key={o.operator} href={`/?operator=${encodeURIComponent(o.operator)}`}
                  className={clsx('group rounded-xl border p-4 transition-colors',
                    direct ? 'border-gray-700 bg-gray-900/40 hover:bg-gray-800/40'
                           : 'border-gray-800 bg-gray-900/40 hover:border-cyan-700/50 hover:bg-gray-800/40')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-gray-100">
                      <Server size={15} className={direct ? 'text-gray-500' : 'text-cyan-400'} /> {o.operator}
                    </div>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-cyan-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{o.tenants}</span>
                    <span className="text-xs text-gray-500">tenant{o.tenants === 1 ? '' : 's'}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Pill icon={<Layers size={11} />} text={`${o.dedicated} dedicated`} tone="purple" />
                    <Pill icon={<Users size={11} />} text={`${o.shared} shared`} tone="gray" />
                    <Pill icon={<Server size={11} />} text={`${o.devices.toLocaleString()} devices`} tone="cyan" />
                  </div>
                </Link>
              );
            })}
            {operators.length === 0 && <div className="text-sm text-gray-500">No operators yet.</div>}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-xl font-bold text-gray-100">{value.toLocaleString()}</div>
      <div className="text-[11px] uppercase tracking-wider text-gray-500">{label}</div>
    </div>
  );
}

function Pill({ icon, text, tone }: { icon: React.ReactNode; text: string; tone: 'purple' | 'gray' | 'cyan' }) {
  const cls = tone === 'purple' ? 'bg-purple-900/30 text-purple-300 border-purple-800'
    : tone === 'cyan' ? 'bg-cyan-900/20 text-cyan-300 border-cyan-800/50'
    : 'bg-gray-800 text-gray-300 border-gray-700';
  return <span className={clsx('inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border', cls)}>{icon}{text}</span>;
}
