'use client';
import { useEffect, useState, useCallback, Fragment } from 'react';
import { clsx } from 'clsx';
import { Brain, ShieldPlus, TicketPlus, CheckCircle2, RefreshCw, ChevronRight, ChevronDown, Users } from 'lucide-react';
import { toast } from 'sonner';
import { listDomains, listDomainDecisions, promotePolicy, createTicketFromDecision, type RiskDomain, type RiskDecision } from '@/lib/risk-decisions-api';
import { RiskScoreCard } from '@/components/risk/risk-score-card';

const decisionChip: Record<string, string> = {
  allow: 'text-green-400 border-green-800 bg-green-900/20',
  monitor: 'text-amber-400 border-amber-800 bg-amber-900/20',
  deny: 'text-red-400 border-red-800 bg-red-900/20',
};

function timeAgo(iso: string): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return iso;
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function RiskDecisionsPage() {
  const [domains, setDomains] = useState<RiskDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [expanded, setExpanded] = useState('');
  const [detail, setDetail] = useState<Record<string, RiskDecision[]>>({});
  const [detailLoading, setDetailLoading] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await listDomains();
      setDomains(d);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const onToggle = async (domain: string) => {
    if (expanded === domain) { setExpanded(''); return; }
    setExpanded(domain);
    if (!detail[domain]) {
      setDetailLoading(domain);
      try {
        const hits = await listDomainDecisions(domain);
        setDetail(prev => ({ ...prev, [domain]: hits }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load domain detail');
      } finally {
        setDetailLoading('');
      }
    }
  };

  // Actions operate on a single decision (they promote/ticket by cache_key, shared
  // across a domain's hits). We act on the latest hit and refresh the detail after.
  const onPromote = async (domain: string, d: RiskDecision) => {
    setBusy(d.id);
    try {
      await promotePolicy(d.id);
      toast.success(`Promoted ${d.cache_key} to a standing allow policy`);
      setDetail(prev => { const n = { ...prev }; delete n[domain]; return n; });
      onToggle(domain); onToggle(domain);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Promote failed');
    } finally {
      setBusy('');
    }
  };

  const onTicket = async (domain: string, d: RiskDecision) => {
    setBusy(d.id);
    try {
      const t = await createTicketFromDecision(d.id, d.decision === 'allow' ? 'change_request' : 'service_request');
      toast.success(`Internal ticket ${t.ticket_key} created`);
      setDetail(prev => { const n = { ...prev }; delete n[domain]; return n; });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ticket failed');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="text-cyan-400" size={24} /> Risk Decisions
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            One row per domain the SWG has adjudicated. Expand to see every user/device hit and the AI verdict; promote an allowed domain to a standing policy or raise a ticket.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 rounded-lg text-xs">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="text-left font-medium px-4 py-2">Domain</th>
                <th className="text-left font-medium px-4 py-2">Tenant</th>
                <th className="text-left font-medium px-4 py-2">Decision</th>
                <th className="text-right font-medium px-4 py-2">Score</th>
                <th className="text-right font-medium px-4 py-2">Hits</th>
                <th className="text-right font-medium px-4 py-2">Users</th>
                <th className="text-left font-medium px-4 py-2">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>}
              {!loading && domains.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No risk decisions yet — they appear as the SWG adjudicates new domains.</td></tr>
              )}
              {domains.map(row => (
                <Fragment key={row.tenant_id + '|' + row.domain}>
                <tr
                  onClick={() => onToggle(row.domain)}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 align-top cursor-pointer">
                  <td className="px-4 py-2.5 font-mono text-[12px] text-gray-200">
                    <span className="inline-flex items-center gap-1.5">
                      {expanded === row.domain ? <ChevronDown size={13} className="text-gray-500" /> : <ChevronRight size={13} className="text-gray-500" />}
                      {row.domain}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-300">{row.tenant_name}</td>
                  <td className="px-4 py-2.5">
                    <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border capitalize', decisionChip[row.decision])}>{row.decision}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-300">{row.risk_score}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-300">{row.hit_count}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-400">{row.distinct_users}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-[12px]">{timeAgo(row.last_seen)}</td>
                </tr>
                {expanded === row.domain && (
                  <tr className="border-b border-gray-800/50 bg-gray-900/20">
                    <td colSpan={7} className="px-4 py-3">
                      {detailLoading === row.domain && <div className="text-gray-500 text-xs">Loading activity…</div>}
                      {detail[row.domain] && detail[row.domain].length > 0 && (
                        <div className="space-y-4">
                          <RiskScoreCard d={detail[row.domain][0]} />
                          <div>
                            <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                              <Users size={12} /> Per-user / device activity ({detail[row.domain].length})
                            </div>
                            <div className="border border-gray-800 rounded-lg overflow-hidden">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-[10px] uppercase tracking-wider text-gray-600 border-b border-gray-800">
                                    <th className="text-left font-medium px-3 py-1.5">User</th>
                                    <th className="text-left font-medium px-3 py-1.5">Decision</th>
                                    <th className="text-right font-medium px-3 py-1.5">Score</th>
                                    <th className="text-left font-medium px-3 py-1.5">Source</th>
                                    <th className="text-left font-medium px-3 py-1.5">When</th>
                                    <th className="text-right font-medium px-3 py-1.5">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {detail[row.domain].map(h => (
                                    <tr key={h.id} className="border-b border-gray-800/40">
                                      <td className="px-3 py-1.5 text-gray-300">{h.actor_user || '—'}</td>
                                      <td className="px-3 py-1.5"><span className={clsx('text-[10px] px-1.5 py-0.5 rounded border capitalize', decisionChip[h.decision])}>{h.decision}</span></td>
                                      <td className="px-3 py-1.5 text-right font-mono text-gray-300">{h.risk_score}</td>
                                      <td className="px-3 py-1.5 text-gray-400">{h.source}</td>
                                      <td className="px-3 py-1.5 text-gray-400">{timeAgo(h.created_at)}</td>
                                      <td className="px-3 py-1.5 text-right whitespace-nowrap">
                                        {h.actioned_as ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] text-green-400">
                                            <CheckCircle2 size={11} /> {h.actioned_as === 'policy' ? 'Promoted' : 'Ticketed'}
                                          </span>
                                        ) : (
                                          <div className="inline-flex gap-1.5">
                                            {h.decision === 'allow' && (
                                              <button disabled={busy === h.id} onClick={(e) => { e.stopPropagation(); onPromote(row.domain, h); }}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-900/30 hover:bg-green-900/50 border border-green-800/50 rounded text-[10px] text-green-300 disabled:opacity-50">
                                                <ShieldPlus size={11} /> Policy
                                              </button>
                                            )}
                                            <button disabled={busy === h.id} onClick={(e) => { e.stopPropagation(); onTicket(row.domain, h); }}
                                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800/50 rounded text-[10px] text-blue-300 disabled:opacity-50">
                                              <TicketPlus size={11} /> Ticket
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                      {detail[row.domain] && detail[row.domain].length === 0 && !detailLoading && (
                        <div className="text-gray-500 text-xs">No individual hits found.</div>
                      )}
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
