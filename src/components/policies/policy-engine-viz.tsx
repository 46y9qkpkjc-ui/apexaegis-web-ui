'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  Shield, Lock, Bug, Network, Globe, FileText, Zap,
  Fingerprint, Eye, Play, RotateCcw, Pause,
  CheckCircle2, XCircle, ArrowRight, SkipForward,
} from 'lucide-react';

/* ─── Engine Types ──────────────────────────────────────────── */
export type EngineId =
  | 'dns_filter'
  | 'ssl_inspection'
  | 'atp_scan'
  | 'web_filter'
  | 'content_inspection'
  | 'waf'
  | 'iap'
  | 'policy_match';

export type EngineVerdict = 'pending' | 'processing' | 'pass' | 'drop' | 'skip';

export interface EngineStep {
  id: EngineId;
  verdict: EngineVerdict;
  detail: string;
  duration: number; /* ms for animation */
}

export interface PolicySimulation {
  id: string;
  label: string;
  description: string;
  steps: EngineStep[];
  finalAction: 'allow' | 'deny' | 'monitor';
}

/* ─── Engine Metadata ────────────────────────────────────────── */
const ENGINE_META: Record<EngineId, {
  label: string;
  icon: React.ElementType;
  passColor: string;
  dropColor: string;
  bgPass: string;
  bgDrop: string;
  bgProcessing: string;
}> = {
  dns_filter: {
    label: 'DNS Filter',
    icon: Network,
    passColor: 'text-green-400',
    dropColor: 'text-red-400',
    bgPass: 'bg-green-500/15 border-green-500/40',
    bgDrop: 'bg-red-500/15 border-red-500/40',
    bgProcessing: 'bg-green-500/5 border-green-500/20',
  },
  ssl_inspection: {
    label: 'SSL Inspection',
    icon: Lock,
    passColor: 'text-yellow-400',
    dropColor: 'text-red-400',
    bgPass: 'bg-yellow-500/15 border-yellow-500/40',
    bgDrop: 'bg-red-500/15 border-red-500/40',
    bgProcessing: 'bg-yellow-500/5 border-yellow-500/20',
  },
  atp_scan: {
    label: 'ATP Scan',
    icon: Bug,
    passColor: 'text-orange-400',
    dropColor: 'text-red-400',
    bgPass: 'bg-orange-500/15 border-orange-500/40',
    bgDrop: 'bg-red-500/15 border-red-500/40',
    bgProcessing: 'bg-orange-500/5 border-orange-500/20',
  },
  web_filter: {
    label: 'Web Filter',
    icon: Shield,
    passColor: 'text-blue-400',
    dropColor: 'text-red-400',
    bgPass: 'bg-blue-500/15 border-blue-500/40',
    bgDrop: 'bg-red-500/15 border-red-500/40',
    bgProcessing: 'bg-blue-500/5 border-blue-500/20',
  },
  content_inspection: {
    label: 'Content Inspection',
    icon: Eye,
    passColor: 'text-purple-400',
    dropColor: 'text-red-400',
    bgPass: 'bg-purple-500/15 border-purple-500/40',
    bgDrop: 'bg-red-500/15 border-red-500/40',
    bgProcessing: 'bg-purple-500/5 border-purple-500/20',
  },
  waf: {
    label: 'WAF',
    icon: Zap,
    passColor: 'text-rose-400',
    dropColor: 'text-red-400',
    bgPass: 'bg-rose-500/15 border-rose-500/40',
    bgDrop: 'bg-red-500/15 border-red-500/40',
    bgProcessing: 'bg-rose-500/5 border-rose-500/20',
  },
  iap: {
    label: 'IAP',
    icon: Fingerprint,
    passColor: 'text-teal-400',
    dropColor: 'text-red-400',
    bgPass: 'bg-teal-500/15 border-teal-500/40',
    bgDrop: 'bg-red-500/15 border-red-500/40',
    bgProcessing: 'bg-teal-500/5 border-teal-500/20',
  },
  policy_match: {
    label: 'Policy Match',
    icon: FileText,
    passColor: 'text-emerald-400',
    dropColor: 'text-red-400',
    bgPass: 'bg-emerald-500/15 border-emerald-500/40',
    bgDrop: 'bg-red-500/15 border-red-500/40',
    bgProcessing: 'bg-emerald-500/5 border-emerald-500/20',
  },
};

/* ─── Pre-built Scenarios ───────────────────────────────────── */
export const DEMO_SIMULATIONS: PolicySimulation[] = [
  {
    id: 'malware-blocked',
    label: 'Malware C2 Blocked',
    description: 'User visits a known malware C2 domain — blocked by ATP engine',
    finalAction: 'deny',
    steps: [
      { id: 'dns_filter', verdict: 'pass', detail: 'DNS resolved: malware-c2.evil.com → 198.51.100.1', duration: 400 },
      { id: 'ssl_inspection', verdict: 'pass', detail: 'TLS 1.3 handshake intercepted, certificate inspected', duration: 600 },
      { id: 'atp_scan', verdict: 'drop', detail: 'THREAT DETECTED: Trojan.GenericKD.46947 — C2 callback pattern', duration: 800 },
      { id: 'web_filter', verdict: 'skip', detail: 'Skipped — traffic already dropped', duration: 100 },
      { id: 'content_inspection', verdict: 'skip', detail: 'Skipped — traffic already dropped', duration: 100 },
      { id: 'waf', verdict: 'skip', detail: 'Skipped — traffic already dropped', duration: 100 },
      { id: 'iap', verdict: 'skip', detail: 'Skipped — not an IAP-protected resource', duration: 100 },
      { id: 'policy_match', verdict: 'skip', detail: 'Skipped — traffic already dropped', duration: 100 },
    ],
  },
  {
    id: 'phishing-web-filter',
    label: 'Phishing Blocked by Web Filter',
    description: 'User clicks a phishing link — blocked by web filter after SSL inspection',
    finalAction: 'deny',
    steps: [
      { id: 'dns_filter', verdict: 'pass', detail: 'DNS resolved: login-secure-update.net → 203.0.113.42', duration: 350 },
      { id: 'ssl_inspection', verdict: 'pass', detail: 'TLS decrypted via Inline Proxy, certificate: login-secure-update.net', duration: 550 },
      { id: 'atp_scan', verdict: 'pass', detail: 'No known malware signatures in payload', duration: 500 },
      { id: 'web_filter', verdict: 'drop', detail: 'URL category "Phishing" blocked by policy "Block Malware & Phishing"', duration: 400 },
      { id: 'content_inspection', verdict: 'skip', detail: 'Skipped — traffic already dropped', duration: 100 },
      { id: 'waf', verdict: 'skip', detail: 'Skipped — traffic already dropped', duration: 100 },
      { id: 'iap', verdict: 'skip', detail: 'Skipped — not an IAP-protected resource', duration: 100 },
      { id: 'policy_match', verdict: 'skip', detail: 'Matched: "Block Malware & Phishing" → DENY', duration: 200 },
    ],
  },
  {
    id: 'nrd-dns-block',
    label: 'NRD Blocked at DNS',
    description: 'Newly registered domain blocked at DNS layer before any connection',
    finalAction: 'deny',
    steps: [
      { id: 'dns_filter', verdict: 'drop', detail: 'BLOCKED: new-domain-3day.xyz — Newly Registered Domain (3 days old)', duration: 500 },
      { id: 'ssl_inspection', verdict: 'skip', detail: 'Skipped — DNS query blocked', duration: 100 },
      { id: 'atp_scan', verdict: 'skip', detail: 'Skipped — no connection established', duration: 100 },
      { id: 'web_filter', verdict: 'skip', detail: 'Skipped — no connection established', duration: 100 },
      { id: 'content_inspection', verdict: 'skip', detail: 'Skipped — no connection established', duration: 100 },
      { id: 'waf', verdict: 'skip', detail: 'Skipped — no connection established', duration: 100 },
      { id: 'iap', verdict: 'skip', detail: 'Skipped — no connection established', duration: 100 },
      { id: 'policy_match', verdict: 'skip', detail: 'Skipped — DNS already blocked', duration: 100 },
    ],
  },
  {
    id: 'waf-sqli',
    label: 'SQL Injection Blocked by WAF',
    description: 'Attacker sends SQL injection payload — WAF engine detects and blocks',
    finalAction: 'deny',
    steps: [
      { id: 'dns_filter', verdict: 'pass', detail: 'DNS resolved: app.company.com → 10.0.1.50', duration: 300 },
      { id: 'ssl_inspection', verdict: 'pass', detail: 'TLS terminated, inspecting HTTP payload', duration: 500 },
      { id: 'atp_scan', verdict: 'pass', detail: 'No malware signatures detected', duration: 400 },
      { id: 'web_filter', verdict: 'pass', detail: 'URL allowed — internal application', duration: 300 },
      { id: 'content_inspection', verdict: 'pass', detail: 'Content-Type: application/x-www-form-urlencoded', duration: 300 },
      { id: 'waf', verdict: 'drop', detail: 'OWASP CRS 942100: SQL Injection detected in parameter "id": \' OR 1=1 --', duration: 700 },
      { id: 'iap', verdict: 'skip', detail: 'Skipped — traffic already dropped', duration: 100 },
      { id: 'policy_match', verdict: 'skip', detail: 'Skipped — WAF blocked request', duration: 100 },
    ],
  },
  {
    id: 'iap-device-trust',
    label: 'IAP — Untrusted Device Blocked',
    description: 'Unmanaged device tries to access internal app — IAP denies access',
    finalAction: 'deny',
    steps: [
      { id: 'dns_filter', verdict: 'pass', detail: 'DNS resolved: wiki.company.com → IAP edge', duration: 300 },
      { id: 'ssl_inspection', verdict: 'pass', detail: 'TLS 1.3 mutual auth with IAP', duration: 400 },
      { id: 'atp_scan', verdict: 'pass', detail: 'No threats — HTTPS request to internal resource', duration: 300 },
      { id: 'web_filter', verdict: 'pass', detail: 'Allowed — internal corporate application', duration: 200 },
      { id: 'content_inspection', verdict: 'pass', detail: 'Standard GET request — no suspicious content', duration: 200 },
      { id: 'waf', verdict: 'pass', detail: 'No attack patterns detected', duration: 200 },
      { id: 'iap', verdict: 'drop', detail: 'ACCESS DENIED: Device trust tier "unmanaged" — requires "corp_managed" or higher', duration: 800 },
      { id: 'policy_match', verdict: 'skip', detail: 'Skipped — IAP denied access', duration: 100 },
    ],
  },
  {
    id: 'saas-allowed',
    label: 'Sanctioned SaaS Allowed',
    description: 'User accesses GitHub.com — all engines pass, traffic forwarded',
    finalAction: 'allow',
    steps: [
      { id: 'dns_filter', verdict: 'pass', detail: 'DNS resolved: github.com → 140.82.121.3', duration: 300 },
      { id: 'ssl_inspection', verdict: 'pass', detail: 'Certificate inspection: github.com — valid, DigiCert Root', duration: 400 },
      { id: 'atp_scan', verdict: 'pass', detail: 'No threats detected', duration: 300 },
      { id: 'web_filter', verdict: 'pass', detail: 'Category: "Developer Tools" — allowed', duration: 250 },
      { id: 'content_inspection', verdict: 'pass', detail: 'No policy violations in request body', duration: 200 },
      { id: 'waf', verdict: 'skip', detail: 'Skipped — outbound SaaS, not reverse-proxy traffic', duration: 100 },
      { id: 'iap', verdict: 'skip', detail: 'Skipped — external SaaS, not IAP-protected', duration: 100 },
      { id: 'policy_match', verdict: 'pass', detail: 'Matched: "Allow Sanctioned SaaS" → ALLOW', duration: 250 },
    ],
  },
];

/* ─── Animated Visualization Component ──────────────────────── */
interface PolicyEngineVizProps {
  onClose?: () => void;
}

export function PolicyEngineVisualization({ onClose }: PolicyEngineVizProps) {
  const [selectedSim, setSelectedSim] = useState(DEMO_SIMULATIONS[0]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepStates, setStepStates] = useState<EngineVerdict[]>([]);
  const [packetX, setPacketX] = useState(0);
  const animRef = useRef<NodeJS.Timeout | null>(null);

  const resetAnimation = useCallback(() => {
    if (animRef.current) clearTimeout(animRef.current);
    setCurrentStep(-1);
    setStepStates([]);
    setIsPlaying(false);
    setPacketX(0);
  }, []);

  const playAnimation = useCallback(() => {
    resetAnimation();
    setIsPlaying(true);

    let step = 0;
    const states: EngineVerdict[] = new Array(selectedSim.steps.length).fill('pending');
    setStepStates([...states]);

    const runStep = () => {
      if (step >= selectedSim.steps.length) {
        setIsPlaying(false);
        return;
      }

      const currentStepData = selectedSim.steps[step];
      states[step] = 'processing';
      setStepStates([...states]);
      setCurrentStep(step);
      setPacketX(((step + 0.5) / selectedSim.steps.length) * 100);

      animRef.current = setTimeout(() => {
        states[step] = currentStepData.verdict;
        setStepStates([...states]);

        if (currentStepData.verdict === 'drop') {
          /* Mark remaining as skip */
          for (let i = step + 1; i < states.length; i++) {
            states[i] = 'skip';
          }
          setStepStates([...states]);
          setIsPlaying(false);
          return;
        }

        step++;
        setPacketX((step / selectedSim.steps.length) * 100);
        animRef.current = setTimeout(runStep, 200);
      }, currentStepData.duration);
    };

    animRef.current = setTimeout(runStep, 300);
  }, [selectedSim, resetAnimation]);

  useEffect(() => {
    return () => {
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, []);

  const handleSelectScenario = (sim: PolicySimulation) => {
    resetAnimation();
    setSelectedSim(sim);
  };

  const droppedStep = stepStates.findIndex(s => s === 'drop');
  const isComplete = stepStates.length > 0 && stepStates.every(s => s !== 'pending' && s !== 'processing');

  return (
    <div className="space-y-5">
      {/* Scenario selector */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Traffic Scenario</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {DEMO_SIMULATIONS.map(sim => (
            <button
              key={sim.id}
              onClick={() => handleSelectScenario(sim)}
              className={clsx(
                'text-left p-3 rounded-lg border transition-all text-xs',
                selectedSim.id === sim.id
                  ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                  : 'border-gray-800 bg-gray-900 hover:border-gray-700',
              )}
            >
              <div className="font-medium text-sm mb-0.5">{sim.label}</div>
              <div className="text-gray-500 leading-tight">{sim.description}</div>
              <div className={clsx(
                'mt-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold',
                sim.finalAction === 'allow' && 'bg-green-900/40 text-green-400',
                sim.finalAction === 'deny' && 'bg-red-900/40 text-red-400',
                sim.finalAction === 'monitor' && 'bg-yellow-900/40 text-yellow-400',
              )}>
                {sim.finalAction.toUpperCase()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={playAnimation}
          disabled={isPlaying}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            isPlaying
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white',
          )}
        >
          <Play size={14} />
          {isComplete ? 'Replay' : 'Simulate'}
        </button>
        <button
          onClick={resetAnimation}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          <RotateCcw size={14} />
          Reset
        </button>
        {isPlaying && (
          <span className="flex items-center gap-2 text-xs text-blue-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            Processing...
          </span>
        )}
      </div>

      {/* Engine pipeline visualization */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 overflow-hidden">
        {/* Packet trace bar */}
        <div className="relative h-2 mb-6 bg-gray-800 rounded-full overflow-hidden">
          {stepStates.length > 0 && (
            <div
              className={clsx(
                'absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out',
                droppedStep >= 0 ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-blue-500',
              )}
              style={{ width: `${packetX}%` }}
            />
          )}
          {/* Glow ball */}
          {isPlaying && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 -ml-2 rounded-full transition-all duration-300 ease-out"
              style={{
                left: `${packetX}%`,
                boxShadow: `0 0 12px 4px ${droppedStep >= 0 ? '#ef4444' : '#3b82f6'}`,
                background: droppedStep >= 0 ? '#ef4444' : '#3b82f6',
              }}
            />
          )}
        </div>

        {/* Engine cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {selectedSim.steps.map((step, idx) => {
            const meta = ENGINE_META[step.id];
            const Icon = meta.icon;
            const state = stepStates[idx] || 'pending';
            const isActive = currentStep === idx && isPlaying;
            const isAfterDrop = droppedStep >= 0 && idx > droppedStep;

            return (
              <div
                key={step.id}
                className={clsx(
                  'relative p-3 rounded-lg border transition-all duration-300',
                  state === 'pending' && 'border-gray-800 bg-gray-800/30',
                  state === 'processing' && meta.bgProcessing,
                  state === 'pass' && meta.bgPass,
                  state === 'drop' && meta.bgDrop,
                  state === 'skip' && 'border-gray-800 bg-gray-800/20 opacity-40',
                  isActive && 'ring-2 ring-blue-400/50 scale-[1.02]',
                )}
              >
                {/* Processing pulse */}
                {state === 'processing' && (
                  <div className="absolute inset-0 rounded-lg animate-pulse border-2 border-blue-400/30" />
                )}

                <div className="flex items-center gap-2 mb-2">
                  <div className={clsx(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-300',
                    state === 'pass' && 'bg-green-500/20',
                    state === 'drop' && 'bg-red-500/20',
                    state === 'processing' && 'bg-blue-500/20',
                    state === 'skip' && 'bg-gray-800',
                    state === 'pending' && 'bg-gray-800',
                  )}>
                    {state === 'drop' ? (
                      <XCircle size={14} className="text-red-400" />
                    ) : state === 'pass' ? (
                      <CheckCircle2 size={14} className="text-green-400" />
                    ) : state === 'skip' ? (
                      <SkipForward size={12} className="text-gray-600" />
                    ) : state === 'processing' ? (
                      <Icon size={14} className="text-blue-400 animate-pulse" />
                    ) : (
                      <Icon size={14} className="text-gray-600" />
                    )}
                  </div>
                  <span className={clsx(
                    'text-xs font-semibold transition-colors',
                    state === 'pass' && meta.passColor,
                    state === 'drop' && meta.dropColor,
                    state === 'processing' && 'text-blue-400',
                    state === 'skip' && 'text-gray-600',
                    state === 'pending' && 'text-gray-500',
                  )}>
                    {meta.label}
                  </span>
                </div>

                {/* Verdict detail */}
                <div className={clsx(
                  'text-[11px] leading-relaxed transition-all duration-300',
                  state === 'pending' && 'text-gray-600',
                  state === 'processing' && 'text-blue-300/70',
                  state === 'pass' && 'text-gray-400',
                  state === 'drop' && 'text-red-300/80',
                  state === 'skip' && 'text-gray-600',
                )}>
                  {state === 'pending' && 'Waiting...'}
                  {state === 'processing' && 'Inspecting...'}
                  {(state === 'pass' || state === 'drop' || state === 'skip') && step.detail}
                </div>

                {/* Verdict badge */}
                {state !== 'pending' && state !== 'processing' && (
                  <div className={clsx(
                    'mt-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide',
                    state === 'pass' && 'bg-green-900/40 text-green-400',
                    state === 'drop' && 'bg-red-900/40 text-red-400',
                    state === 'skip' && 'bg-gray-800 text-gray-600',
                  )}>
                    {state.toUpperCase()}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Final verdict */}
        {isComplete && (
          <div className={clsx(
            'mt-5 flex items-center justify-center gap-3 py-3 rounded-lg border font-medium text-sm',
            'animate-in fade-in duration-500',
            selectedSim.finalAction === 'deny' && 'bg-red-900/20 border-red-800/40 text-red-400',
            selectedSim.finalAction === 'allow' && 'bg-green-900/20 border-green-800/40 text-green-400',
            selectedSim.finalAction === 'monitor' && 'bg-yellow-900/20 border-yellow-800/40 text-yellow-400',
          )}>
            {selectedSim.finalAction === 'deny' ? (
              <XCircle size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            Final Verdict: {selectedSim.finalAction.toUpperCase()}
            {droppedStep >= 0 && (
              <span className="text-xs opacity-70 ml-2">
                — dropped by {ENGINE_META[selectedSim.steps[droppedStep].id].label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
