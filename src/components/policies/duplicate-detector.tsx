'use client';
import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Shield, Copy } from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ─────────────────────────────────────────────────── */
export interface PolicyFingerprint {
  name: string;
  action: string;
  sourceUsers: string[];
  sourceAddresses: string[];
  destUrlCategories: string[];
  destCloudApps: string[];
  destAddresses: string[];
  services: string[];
  dnsFilterList: string | null;
}

export interface DuplicateMatch {
  existingName: string;
  overlapScore: number;          // 0–100
  overlapFields: string[];       // which fields overlap
  type: 'exact' | 'high' | 'partial';
}

/* ─── Overlap detection engine ──────────────────────────────── */
function arraysOverlap(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.map(s => s.toLowerCase()));
  const setB = new Set(b.map(s => s.toLowerCase()));
  const intersection = [...setA].filter(x => setB.has(x));
  const union = new Set([...setA, ...setB]);
  return (intersection.length / union.size) * 100;
}

export function detectDuplicates(
  draft: PolicyFingerprint,
  existingPolicies: PolicyFingerprint[],
  editingName?: string,
): DuplicateMatch[] {
  const results: DuplicateMatch[] = [];

  for (const existing of existingPolicies) {
    // Skip the policy being edited
    if (editingName && existing.name === editingName) continue;

    const fields: { name: string; score: number }[] = [];

    const srcUserScore = arraysOverlap(draft.sourceUsers, existing.sourceUsers);
    if (srcUserScore > 0) fields.push({ name: 'Source Users', score: srcUserScore });

    const srcAddrScore = arraysOverlap(draft.sourceAddresses, existing.sourceAddresses);
    if (srcAddrScore > 0) fields.push({ name: 'Source Addresses', score: srcAddrScore });

    const dstCatScore = arraysOverlap(draft.destUrlCategories, existing.destUrlCategories);
    if (dstCatScore > 0) fields.push({ name: 'URL Categories', score: dstCatScore });

    const dstAppScore = arraysOverlap(draft.destCloudApps, existing.destCloudApps);
    if (dstAppScore > 0) fields.push({ name: 'Cloud Apps', score: dstAppScore });

    const dstAddrScore = arraysOverlap(draft.destAddresses, existing.destAddresses);
    if (dstAddrScore > 0) fields.push({ name: 'Dest Addresses', score: dstAddrScore });

    const svcScore = arraysOverlap(draft.services, existing.services);
    if (svcScore > 0) fields.push({ name: 'Services', score: svcScore });

    const dnsMatch = draft.dnsFilterList && existing.dnsFilterList &&
      draft.dnsFilterList.toLowerCase() === existing.dnsFilterList.toLowerCase();
    if (dnsMatch) fields.push({ name: 'DNS Filter', score: 100 });

    const actionMatch = draft.action === existing.action;
    if (actionMatch) fields.push({ name: 'Action', score: 100 });

    if (fields.length === 0) continue;

    // Weighted overall score
    const weights: Record<string, number> = {
      'Source Users': 15, 'Source Addresses': 10, 'URL Categories': 25,
      'Cloud Apps': 25, 'Dest Addresses': 10, 'Services': 5,
      'DNS Filter': 5, 'Action': 5,
    };
    let totalWeight = 0, weightedSum = 0;
    for (const f of fields) {
      const w = weights[f.name] ?? 5;
      totalWeight += w;
      weightedSum += f.score * w;
    }
    const overallScore = Math.round(weightedSum / Math.max(totalWeight, 1));

    if (overallScore < 20) continue;

    results.push({
      existingName: existing.name,
      overlapScore: overallScore,
      overlapFields: fields.map(f => f.name),
      type: overallScore >= 90 ? 'exact' : overallScore >= 60 ? 'high' : 'partial',
    });
  }

  return results.sort((a, b) => b.overlapScore - a.overlapScore);
}

/* ─── Visual Component ──────────────────────────────────────── */
interface DuplicatePolicyAlertProps {
  matches: DuplicateMatch[];
}

const typeStyles = {
  exact: { bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-300', badge: 'bg-red-500', label: 'DUPLICATE' },
  high: { bg: 'bg-yellow-900/25', border: 'border-yellow-700', text: 'text-yellow-300', badge: 'bg-yellow-500', label: 'HIGH OVERLAP' },
  partial: { bg: 'bg-blue-900/20', border: 'border-blue-700/50', text: 'text-blue-300', badge: 'bg-blue-500', label: 'PARTIAL' },
};

export function DuplicatePolicyAlert({ matches }: DuplicatePolicyAlertProps) {
  if (matches.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-900/20 border border-green-800/40 text-green-300 text-sm">
        <CheckCircle2 size={16} />
        <span>No duplicate policies detected</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((m, i) => {
        const style = typeStyles[m.type];
        return (
          <div key={i} className={`rounded-lg border p-3 ${style.bg} ${style.border}`}>
            <div className="flex items-center gap-2 mb-2">
              {m.type === 'exact' ? (
                <AlertTriangle size={16} className="text-red-400 shrink-0" />
              ) : (
                <Copy size={16} className={`${style.text} shrink-0`} />
              )}
              <span className={`text-sm font-medium ${style.text}`}>
                Overlaps with &ldquo;{m.existingName}&rdquo;
              </span>
              <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${style.badge} text-white`}>
                {style.label}
              </span>
            </div>

            {/* Visual overlap bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Overlap</span>
                <span className="font-mono">{m.overlapScore}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={clsx('h-full rounded-full transition-all duration-500', {
                    'bg-red-500': m.type === 'exact',
                    'bg-yellow-500': m.type === 'high',
                    'bg-blue-500': m.type === 'partial',
                  })}
                  style={{ width: `${m.overlapScore}%` }}
                />
              </div>
            </div>

            {/* Overlapping fields */}
            <div className="flex flex-wrap gap-1">
              {m.overlapFields.map(f => (
                <span key={f} className="px-2 py-0.5 rounded bg-white/5 text-xs text-gray-300">
                  {f}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
