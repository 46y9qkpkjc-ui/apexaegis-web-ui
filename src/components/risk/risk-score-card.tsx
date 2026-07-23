'use client';
import { clsx } from 'clsx';
import { Wrench, AlertTriangle } from 'lucide-react';
import type { RiskDecision } from '@/lib/risk-decisions-api';

// Band boundaries mirror the engine contract: allow 0-24, monitor 25-64, deny 65-100.
const bandColor = (score: number) =>
  score <= 24 ? 'text-green-400' : score <= 64 ? 'text-amber-400' : 'text-red-400';

// A signal value is "bad" when it names a risk-increasing state — those chips go red.
const badSignal = new Set(['nrd', 'recent', 'poor', 'malicious', 'high', 'med', 'medium']);
const signalTone = (v: string | boolean) =>
  v === true || (typeof v === 'string' && badSignal.has(v.toLowerCase()))
    ? 'text-red-300 border-red-800/60 bg-red-900/20'
    : v === false
      ? 'text-gray-400 border-gray-700 bg-gray-800/40'
      : 'text-gray-300 border-gray-700 bg-gray-800/40';

const confidenceChip: Record<string, string> = {
  high: 'text-green-300 border-green-800 bg-green-900/20',
  medium: 'text-amber-300 border-amber-800 bg-amber-900/20',
  low: 'text-gray-300 border-gray-700 bg-gray-800/40',
};

// RiskScoreCard renders one adjudication as the contract's "risk-score card":
// score meter, decision/category/confidence, the emit_verdict signals, the ranked
// top_factors, which enrichment tools ran, and the full rationale. Rich fields come
// from the live verdict cache and may be absent once a verdict expires — the card
// degrades to the core decision in that case.
export function RiskScoreCard({ d }: { d: RiskDecision }) {
  const signals = d.signals ?? {};
  const signalEntries = Object.entries(signals).filter(([, v]) => v !== undefined && v !== '');
  const hasRich = (d.top_factors?.length ?? 0) > 0 || signalEntries.length > 0 || !!d.confidence;

  return (
    <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-4">
      {/* Score meter + headline */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-baseline gap-1">
          <span className={clsx('text-3xl font-bold tabular-nums', bandColor(d.risk_score))}>{d.risk_score}</span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
        <div className="flex-1 min-w-[180px]">
          {/* three-zone band meter with a marker at the score */}
          <div className="relative h-2 rounded-full overflow-hidden flex">
            <div className="bg-green-600/50" style={{ width: '25%' }} />
            <div className="bg-amber-600/50" style={{ width: '40%' }} />
            <div className="bg-red-600/50" style={{ width: '35%' }} />
            <div
              className="absolute top-[-3px] w-1 h-3.5 bg-white rounded-full shadow"
              style={{ left: `calc(${Math.min(100, Math.max(0, d.risk_score))}% - 2px)` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-gray-600 mt-1">
            <span>allow</span><span>monitor</span><span>deny</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] px-1.5 py-0.5 rounded border border-gray-700 bg-gray-800/40 text-gray-300 capitalize">
            {d.category?.replace(/_/g, ' ') || 'unknown'}
          </span>
          {d.confidence && (
            <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border capitalize', confidenceChip[d.confidence] ?? confidenceChip.low)}>
              {d.confidence} confidence
            </span>
          )}
          <span className="text-[11px] px-1.5 py-0.5 rounded border border-gray-700 bg-gray-800/40 text-gray-400">
            source: {d.source}
          </span>
        </div>
      </div>

      {/* Signals */}
      {signalEntries.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Signals</div>
          <div className="flex flex-wrap gap-1.5">
            {signalEntries.map(([k, v]) => (
              <span key={k} className={clsx('text-[11px] px-1.5 py-0.5 rounded border', signalTone(v as string | boolean))}>
                {k.replace(/_/g, ' ')}: <span className="font-medium">{String(v)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top factors */}
      {(d.top_factors?.length ?? 0) > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
            <AlertTriangle size={11} /> Top factors
          </div>
          <ol className="space-y-1">
            {d.top_factors!.map((f, i) => (
              <li key={i} className="text-[12px] text-gray-300 flex gap-2">
                <span className="text-gray-600 tabular-nums">{i + 1}.</span> {f}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Rationale */}
      {d.rationale && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Rationale</div>
          <p className="text-[12px] text-gray-300 leading-relaxed">{d.rationale}</p>
        </div>
      )}

      {/* Tools ran + cache key */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-gray-800/60">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(d.tools_ran?.length ?? 0) > 0 && (
            <>
              <Wrench size={11} className="text-gray-600" />
              {d.tools_ran!.map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800/60 text-gray-400 font-mono">{t}</span>
              ))}
            </>
          )}
          {!hasRich && <span className="text-[11px] text-gray-600">Deterministic verdict — no AI enrichment cached.</span>}
        </div>
        <div className="text-[10px] text-gray-600 font-mono">
          {d.key_scope} · {d.cache_key}
        </div>
      </div>
    </div>
  );
}
