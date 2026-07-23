'use client';
import { useEffect, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Brain, ShieldPlus, TicketPlus, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { listDecisions, promotePolicy, createTicketFromDecision, type RiskDecision } from '@/lib/risk-decisions-api';

const decisionChip: Record<string, string> = {
  allow: 'text-green-400 border-green-800 bg-green-900/20',
  monitor: 'text-amber-400 border-amber-800 bg-amber-900/20',
  deny: 'text-red-400 border-red-800 bg-red-900/20',
};

export default function RiskDecisionsPage() {
  const [rows, setRows] = useState<RiskDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string>('');

  const load = useCallback(async () => {
    try {
      const d = await listDecisions();
      setRows(d);
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

  const onPromote = async (d: RiskDecision) => {
    setBusy(d.id);
    try {
      await promotePolicy(d.id);
      toast.success(`Promoted ${d.cache_key} to a standing allow policy`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Promote failed');
    } finally {
      setBusy('');
    }
  };

  const onTicket = async (d: RiskDecision) => {
    setBusy(d.id);
    try {
      const t = await createTicketFromDecision(d.id, d.decision === 'allow' ? 'change_request' : 'service_request');
      toast.success(`Internal ticket ${t.ticket_key} created`);
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
            Every AI allow / deny verdict, logged. Promote an allowed domain to a standing policy, or raise an ITSM ticket.
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
                <th className="text-left font-medium px-4 py-2">User</th>
                <th className="text-left font-medium px-4 py-2">Decision</th>
                <th className="text-right font-medium px-4 py-2">Score</th>
                <th className="text-left font-medium px-4 py-2">Source</th>
                <th className="text-left font-medium px-4 py-2 max-w-xs">Rationale</th>
                <th className="text-right font-medium px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">No risk decisions yet — they appear as the SWG adjudicates new domains.</td></tr>
              )}
              {rows.map(d => (
                <tr key={d.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 align-top">
                  <td className="px-4 py-2.5 font-mono text-[12px] text-gray-200">{d.domain}</td>
                  <td className="px-4 py-2.5 text-gray-300">{d.tenant_name}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-[12px]">{d.actor_user || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border capitalize', decisionChip[d.decision])}>{d.decision}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-300">{d.risk_score}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-[12px]">{d.source}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-[12px] max-w-xs truncate" title={d.rationale}>{d.rationale || '—'}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {d.actioned_as ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-green-400">
                        <CheckCircle2 size={12} /> {d.actioned_as === 'policy' ? 'Promoted' : 'Ticketed'}
                      </span>
                    ) : (
                      <div className="inline-flex gap-1.5">
                        {d.decision === 'allow' && (
                          <button disabled={busy === d.id} onClick={() => onPromote(d)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 hover:bg-green-900/50 border border-green-800/50 rounded text-[11px] text-green-300 disabled:opacity-50">
                            <ShieldPlus size={12} /> Policy
                          </button>
                        )}
                        <button disabled={busy === d.id} onClick={() => onTicket(d)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800/50 rounded text-[11px] text-blue-300 disabled:opacity-50">
                          <TicketPlus size={12} /> Ticket
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
  );
}
