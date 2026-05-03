'use client';
import {
  Globe, Shield, ShieldAlert, ShieldCheck, ShieldX,
  Tag, Building2, ExternalLink, AlertTriangle, CheckCircle2,
  Eye, Link2,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { UrlLookupResult } from '@/lib/ai-engine';

/* ─── Threat-level styling ──────────────────────────────────── */
const THREAT_STYLE: Record<
  UrlLookupResult['threatLevel'],
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  safe:      { label: 'Safe',       color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-700', icon: ShieldCheck },
  caution:   { label: 'Caution',    color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-700', icon: ShieldAlert },
  dangerous: { label: 'Dangerous',  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-700',   icon: ShieldX },
  unknown:   { label: 'Unknown',    color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-700',  icon: Shield },
};

const ACTION_STYLE: Record<string, string> = {
  allow:   'bg-green-900/40 text-green-400 border-green-800',
  block:   'bg-red-900/40 text-red-400 border-red-800',
  monitor: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
};

const RISK_STYLE: Record<string, string> = {
  low:    'bg-green-900/40 text-green-400',
  medium: 'bg-yellow-900/40 text-yellow-400',
  high:   'bg-red-900/40 text-red-400',
};

/* ═══════════════════════════════════════════════════════════════
   URL LOOKUP RESULT CARD
   ═══════════════════════════════════════════════════════════════ */
interface Props {
  result: UrlLookupResult;
  onClose?: () => void;
}

export function UrlLookupResultCard({ result, onClose }: Props) {
  const threat = THREAT_STYLE[result.threatLevel];
  const ThreatIcon = threat.icon;

  return (
    <div className={clsx('rounded-xl border overflow-hidden text-xs', threat.border, threat.bg)}>
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-blue-400" />
          <span className="font-semibold text-sm text-gray-100">{result.domain}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', threat.color, threat.bg)}>
            <ThreatIcon size={12} />
            {threat.label.toUpperCase()}
          </span>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-white ml-1">✕</button>
          )}
        </div>
      </div>

      <div className="px-3 py-2.5 space-y-3">
        {/* ── URL Categories ──────────────────────────────── */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
            <Tag size={10} />
            URL Categories
          </div>
          <div className="space-y-1">
            {result.categories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between rounded-lg bg-gray-800/60 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <span className={clsx('px-1.5 py-0.5 rounded border text-[10px] font-medium', ACTION_STYLE[cat.action])}>
                    {cat.action.toUpperCase()}
                  </span>
                  <span className="text-gray-200 font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full',
                        cat.confidence >= 90 ? 'bg-green-500' : cat.confidence >= 70 ? 'bg-yellow-500' : 'bg-gray-500',
                      )}
                      style={{ width: `${cat.confidence}%` }}
                    />
                  </div>
                  <span className="text-gray-500 text-[10px] w-8 text-right">{cat.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Cloud App ───────────────────────────────────── */}
        {result.cloudApp ? (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
              <Building2 size={10} />
              Cloud Application
            </div>
            <div className="rounded-lg bg-gray-800/60 px-2.5 py-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-100 font-semibold text-sm">{result.cloudApp.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-medium', RISK_STYLE[result.cloudApp.risk])}>
                    {result.cloudApp.risk.toUpperCase()} RISK
                  </span>
                  {result.cloudApp.sanctioned ? (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-900/40 text-green-400 text-[10px]">
                      <CheckCircle2 size={9} /> Sanctioned
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-400 text-[10px]">
                      <AlertTriangle size={9} /> Unsanctioned
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <span>Vendor: <span className="text-gray-300">{result.cloudApp.vendor}</span></span>
                <span>Category: <span className="text-gray-300">{result.cloudApp.category}</span></span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {result.cloudApp.domains.map(d => (
                  <span key={d} className="px-1.5 py-0.5 rounded bg-gray-700/60 text-gray-400 font-mono text-[10px]">{d}</span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
              <Building2 size={10} />
              Cloud Application
            </div>
            <div className="rounded-lg bg-gray-800/60 px-2.5 py-2 text-gray-500 italic">
              No known cloud application matches this domain.
            </div>
          </div>
        )}

        {/* ── Related URLs ────────────────────────────────── */}
        {result.relatedUrls.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
              <Link2 size={10} />
              Related URLs ({result.relatedUrls.length})
            </div>
            <div className="rounded-lg bg-gray-800/60 divide-y divide-gray-700/40 max-h-32 overflow-y-auto">
              {result.relatedUrls.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-2.5 py-1.5">
                  <span className="text-gray-300 font-mono">{r.domain}</span>
                  <span className="text-gray-500 text-[10px] ml-2 truncate max-w-[140px]">{r.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
