'use client';
import { useMemo } from 'react';
import { clsx } from 'clsx';
import {
  Globe, Lock, Shield, Bug, Network, FileText,
  CheckCircle2, XCircle, ArrowRight, Eye,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
export type InspectionLayer =
  | 'dns_filter'
  | 'ssl_inspection'
  | 'atp_scan'
  | 'web_filter'
  | 'policy_match'
  | 'forwarded';

export type LayerVerdict = 'pass' | 'drop' | 'skip' | 'pending';

export interface LayerResult {
  layer: InspectionLayer;
  verdict: LayerVerdict;
  detail: string;
  profile?: string;
}

export interface TrafficFlowData {
  logId: string;
  user: string;
  destination: string;
  protocol: string;
  layers: LayerResult[];
  finalAction: 'allow' | 'deny' | 'dns-block' | 'monitor';
}

/* ─── Layer metadata ────────────────────────────────────────── */
const LAYER_META: Record<InspectionLayer, {
  label: string;
  icon: React.ElementType;
  color: string;
  dropColor: string;
}> = {
  dns_filter:     { label: 'DNS Filter',       icon: Network,  color: 'text-green-400',  dropColor: 'text-red-400' },
  ssl_inspection: { label: 'SSL Inspection',    icon: Lock,     color: 'text-yellow-400', dropColor: 'text-red-400' },
  atp_scan:       { label: 'ATP Scan',          icon: Bug,      color: 'text-orange-400', dropColor: 'text-red-400' },
  web_filter:     { label: 'Web Filter',        icon: Shield,   color: 'text-blue-400',   dropColor: 'text-red-400' },
  policy_match:   { label: 'Policy Match',      icon: FileText, color: 'text-purple-400', dropColor: 'text-red-400' },
  forwarded:      { label: 'Forwarded',         icon: Globe,    color: 'text-emerald-400',dropColor: 'text-red-400' },
};

/* ─── Simulate inspection flow from a log event ─────────────── */
export function simulateInspectionFlow(log: {
  id: string;
  user: string;
  destination: string;
  action: string;
  category: string;
  policyName: string;
  severity: string;
}): TrafficFlowData {
  const layers: LayerResult[] = [];
  const cat = log.category.toLowerCase();
  const action = log.action;
  const dest = log.destination.toLowerCase();

  // ── Layer 1: DNS Filter ──────────────────────────────────
  if (action === 'dns-block') {
    layers.push({ layer: 'dns_filter', verdict: 'drop', detail: `DNS query for ${log.destination} blocked — category: ${log.category}`, profile: 'Block-NRD-NOD' });
    return { logId: log.id, user: log.user, destination: log.destination, protocol: 'DNS', layers, finalAction: 'dns-block' };
  }
  if (['nrd', 'newly registered domains', 'newly observed domains'].some(k => cat.includes(k))) {
    layers.push({ layer: 'dns_filter', verdict: 'drop', detail: `Newly registered domain detected: ${log.destination}`, profile: 'Block-NRD-NOD' });
    return { logId: log.id, user: log.user, destination: log.destination, protocol: 'DNS', layers, finalAction: 'dns-block' };
  }
  layers.push({ layer: 'dns_filter', verdict: 'pass', detail: 'DNS resolution allowed' });

  // ── Layer 2: SSL Inspection ──────────────────────────────
  const isTls = dest.endsWith('.com') || dest.endsWith('.net') || dest.endsWith('.io') || dest.endsWith('.ru') || dest.endsWith('.cc') || dest.endsWith('.xyz');
  if (isTls) {
    layers.push({ layer: 'ssl_inspection', verdict: 'pass', detail: 'TLS handshake intercepted — certificate inspected', profile: 'Certificate Inspection' });
  } else {
    layers.push({ layer: 'ssl_inspection', verdict: 'skip', detail: 'Non-TLS traffic — SSL inspection skipped' });
  }

  // ── Layer 3: ATP Scan ────────────────────────────────────
  if (['malware', 'spyware', 'ransomware', 'trojan'].some(k => cat.includes(k))) {
    layers.push({ layer: 'atp_scan', verdict: 'drop', detail: `Threat detected: ${log.category} — destination flagged as malicious`, profile: 'Default-ATP' });
    return { logId: log.id, user: log.user, destination: log.destination, protocol: 'HTTPS', layers, finalAction: 'deny' };
  }
  if (['cryptomining'].some(k => cat.includes(k))) {
    layers.push({ layer: 'atp_scan', verdict: 'drop', detail: `Cryptominer communication detected: ${log.destination}`, profile: 'Default-ATP' });
    return { logId: log.id, user: log.user, destination: log.destination, protocol: 'HTTPS', layers, finalAction: 'deny' };
  }
  layers.push({ layer: 'atp_scan', verdict: 'pass', detail: 'No threats detected in payload' });

  // ── Layer 4: Web Filter ──────────────────────────────────
  if (['phishing', 'fraud', 'adult', 'gambling', 'hacking'].some(k => cat.includes(k))) {
    layers.push({ layer: 'web_filter', verdict: 'drop', detail: `URL category "${log.category}" is blocked by web filter policy`, profile: 'Default-Web-Filter' });
    return { logId: log.id, user: log.user, destination: log.destination, protocol: 'HTTPS', layers, finalAction: 'deny' };
  }
  layers.push({ layer: 'web_filter', verdict: 'pass', detail: `Category "${log.category}" is allowed` });

  // ── Layer 5: Policy Match ────────────────────────────────
  if (action === 'deny') {
    layers.push({ layer: 'policy_match', verdict: 'drop', detail: `Matched policy: "${log.policyName}" → DENY`, profile: log.policyName });
    return { logId: log.id, user: log.user, destination: log.destination, protocol: 'HTTPS', layers, finalAction: 'deny' };
  }
  if (action === 'monitor') {
    layers.push({ layer: 'policy_match', verdict: 'pass', detail: `Matched policy: "${log.policyName}" → MONITOR (logged)`, profile: log.policyName });
  } else {
    layers.push({ layer: 'policy_match', verdict: 'pass', detail: `Matched policy: "${log.policyName}" → ALLOW`, profile: log.policyName });
  }

  // ── Layer 6: Forwarded ───────────────────────────────────
  layers.push({ layer: 'forwarded', verdict: 'pass', detail: 'Traffic forwarded to destination' });

  return {
    logId: log.id,
    user: log.user,
    destination: log.destination,
    protocol: isTls ? 'HTTPS' : 'HTTP',
    layers,
    finalAction: action as TrafficFlowData['finalAction'],
  };
}

/* ─── Visual Component ──────────────────────────────────────── */
interface TrafficInspectionFlowProps {
  flow: TrafficFlowData;
  onClose?: () => void;
}

export function TrafficInspectionFlow({ flow, onClose }: TrafficInspectionFlowProps) {
  const droppedAt = flow.layers.find(l => l.verdict === 'drop');

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-800/30">
        <div className="flex items-center gap-3">
          <Eye size={16} className="text-blue-400" />
          <div>
            <span className="text-sm font-semibold text-gray-200">Inspection Flow</span>
            <span className="text-xs text-gray-500 ml-2">
              {flow.user} → {flow.destination}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400">
            {flow.protocol}
          </span>
          <span className={clsx(
            'text-[10px] font-bold px-2 py-0.5 rounded',
            flow.finalAction === 'allow' && 'bg-green-600 text-white',
            flow.finalAction === 'deny' && 'bg-red-600 text-white',
            flow.finalAction === 'dns-block' && 'bg-purple-600 text-white',
            flow.finalAction === 'monitor' && 'bg-yellow-600 text-white',
          )}>
            {flow.finalAction.toUpperCase()}
          </span>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-white text-xs ml-1">✕</button>
          )}
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="px-4 py-5">
        {/* Connection line */}
        <div className="relative">
          {flow.layers.map((layer, idx) => {
            const meta = LAYER_META[layer.layer];
            const Icon = meta.icon;
            const isLast = idx === flow.layers.length - 1;
            const isDrop = layer.verdict === 'drop';
            const isSkip = layer.verdict === 'skip';
            const isPast = idx < flow.layers.findIndex(l => l.verdict === 'drop');
            const isAfterDrop = droppedAt && flow.layers.indexOf(layer) > flow.layers.indexOf(droppedAt);

            return (
              <div key={layer.layer} className="flex items-start gap-0 mb-0">
                {/* Node + connector line */}
                <div className="flex flex-col items-center w-10 shrink-0">
                  {/* Circle */}
                  <div className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all relative z-10',
                    isDrop && 'border-red-500 bg-red-500/20',
                    !isDrop && !isSkip && !isAfterDrop && 'border-green-500 bg-green-500/10',
                    isSkip && 'border-gray-600 bg-gray-800',
                    isAfterDrop && 'border-gray-700 bg-gray-900 opacity-40',
                  )}>
                    {isDrop ? (
                      <XCircle size={16} className="text-red-400" />
                    ) : isSkip ? (
                      <ArrowRight size={14} className="text-gray-500" />
                    ) : isAfterDrop ? (
                      <Icon size={14} className="text-gray-600" />
                    ) : (
                      <CheckCircle2 size={16} className="text-green-400" />
                    )}
                  </div>
                  {/* Vertical connector */}
                  {!isLast && (
                    <div className={clsx(
                      'w-0.5 h-8',
                      isDrop ? 'bg-red-800' : isAfterDrop ? 'bg-gray-800' : 'bg-green-800',
                    )} />
                  )}
                </div>

                {/* Layer info card */}
                <div className={clsx(
                  'flex-1 rounded-lg px-3 py-2 mb-2 border transition-all',
                  isDrop && 'bg-red-900/20 border-red-800/60',
                  !isDrop && !isSkip && !isAfterDrop && 'bg-gray-800/40 border-gray-700/50',
                  isSkip && 'bg-gray-800/20 border-gray-800/30',
                  isAfterDrop && 'bg-gray-900/40 border-gray-800/20 opacity-40',
                )}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon size={13} className={isDrop ? 'text-red-400' : isAfterDrop ? 'text-gray-600' : meta.color} />
                    <span className={clsx(
                      'text-xs font-semibold uppercase tracking-wide',
                      isDrop ? 'text-red-300' : isAfterDrop ? 'text-gray-600' : 'text-gray-300',
                    )}>
                      {meta.label}
                    </span>
                    {layer.profile && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 font-mono">
                        {layer.profile}
                      </span>
                    )}
                    {isDrop && (
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-white">
                        DROPPED
                      </span>
                    )}
                    {isSkip && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                        SKIPPED
                      </span>
                    )}
                  </div>
                  <p className={clsx(
                    'text-xs',
                    isDrop ? 'text-red-300/80' : isAfterDrop ? 'text-gray-700' : 'text-gray-500',
                  )}>
                    {layer.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final verdict banner */}
        <div className={clsx(
          'mt-2 flex items-center gap-3 px-4 py-2.5 rounded-lg border',
          flow.finalAction === 'allow' && 'bg-green-900/20 border-green-800/40',
          flow.finalAction === 'deny' && 'bg-red-900/20 border-red-800/40',
          flow.finalAction === 'dns-block' && 'bg-purple-900/20 border-purple-800/40',
          flow.finalAction === 'monitor' && 'bg-yellow-900/20 border-yellow-800/40',
        )}>
          {flow.finalAction === 'allow' && <CheckCircle2 size={18} className="text-green-400" />}
          {(flow.finalAction === 'deny' || flow.finalAction === 'dns-block') && <XCircle size={18} className="text-red-400" />}
          {flow.finalAction === 'monitor' && <Eye size={18} className="text-yellow-400" />}
          <div>
            <span className="text-sm font-medium">
              {flow.finalAction === 'allow' && 'Traffic allowed — passed all inspection layers'}
              {flow.finalAction === 'deny' && `Traffic blocked at ${droppedAt ? LAYER_META[droppedAt.layer].label : 'policy'} layer`}
              {flow.finalAction === 'dns-block' && `DNS query blocked at ${droppedAt ? LAYER_META[droppedAt.layer].label : 'DNS'} layer`}
              {flow.finalAction === 'monitor' && 'Traffic allowed with monitoring — logged for review'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
