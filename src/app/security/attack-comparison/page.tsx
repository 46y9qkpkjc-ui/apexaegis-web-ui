'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, ShieldOff, Zap, Play, Pause, RotateCcw,
  CheckCircle2, XCircle, AlertTriangle,
  Users, Server, Key, Database, Globe, MonitorSmartphone,
  Network, Lock, Bug, Eye,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ───────────────────────────────────────────────────── */
interface AttackStep {
  id: number;
  label: string;
  technique: string;
  mitre: string;
  icon: typeof Shield;
  detail: string;
}

interface ApexControl {
  layer: string;
  control: string;
  verdict: 'blocked' | 'inspected' | 'detected';
  detail: string;
}

interface ComparisonScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  impactWithout: number;
  impactWith: number;
  steps: AttackStep[];
  withoutResult: string;
  withControls: ApexControl[];
  blockedAtStep: number; // 0-based index in steps[], -1 = not blocked
}

/* ─── Scenario Data ───────────────────────────────────────────── */
const SCENARIOS: ComparisonScenario[] = [
  {
    id: 'cmp-1',
    name: 'Phishing → Domain Compromise',
    category: 'Credential Theft',
    description: 'Attacker sends spearphishing email → user clicks → credentials harvested → Kerberoast → DCSync → Domain Admin.',
    impactWithout: 98,
    impactWith: 5,
    steps: [
      { id: 1, label: 'Phishing Email', technique: 'Spearphishing Link', mitre: 'T1566.002', icon: Users, detail: 'User clicks credential-harvest link in email' },
      { id: 2, label: 'Credential Entry', technique: 'Phishing Page', mitre: 'T1056', icon: Key, detail: 'User enters credentials on fake login page' },
      { id: 3, label: 'Initial Access', technique: 'Valid Credentials', mitre: 'T1078', icon: MonitorSmartphone, detail: 'Attacker authenticates with stolen creds' },
      { id: 4, label: 'Kerberoasting', technique: 'Kerberoast SPN', mitre: 'T1558.003', icon: Key, detail: 'Service account TGS cracked offline' },
      { id: 5, label: 'Lateral Movement', technique: 'Pass-the-Hash', mitre: 'T1550.002', icon: Server, detail: 'Pivot to SQL server with cracked creds' },
      { id: 6, label: 'Domain Admin', technique: 'DCSync', mitre: 'T1003.006', icon: Shield, detail: 'Extract KRBTGT hash → full domain compromise' },
    ],
    withoutResult: 'Full domain compromise — all credentials extracted, persistent backdoor via Golden Ticket.',
    withControls: [
      { layer: 'DNS Filter', control: 'Phishing domain sinkholed', verdict: 'blocked', detail: 'evil-login.com blocked by DNS threat intelligence feed — category: Phishing (confidence 97%)' },
      { layer: 'SSL Inspection', control: 'TLS decryption enabled', verdict: 'inspected', detail: 'Inline SSL proxy decrypts traffic for content inspection' },
      { layer: 'URL Filter', control: 'Phishing URL blocked', verdict: 'blocked', detail: 'URL matched phishing pattern — block page served to user' },
      { layer: 'MFA Enforcement', control: 'Step-up authentication', verdict: 'blocked', detail: 'Even if credentials were stolen, FIDO2 MFA prevents login' },
    ],
    blockedAtStep: 0,
  },
  {
    id: 'cmp-2',
    name: 'Malware Download via Drive-By',
    category: 'Malware Delivery',
    description: 'Compromised website serves malicious JavaScript → downloads trojan → C2 callback → data exfiltration.',
    impactWithout: 85,
    impactWith: 3,
    steps: [
      { id: 1, label: 'Compromised Site', technique: 'Drive-By Download', mitre: 'T1189', icon: Globe, detail: 'Legitimate site compromised with malicious iframe' },
      { id: 2, label: 'JS Exploit', technique: 'Exploitation', mitre: 'T1203', icon: Bug, detail: 'Browser exploit drops executable via JS' },
      { id: 3, label: 'Trojan Install', technique: 'Trojan Execution', mitre: 'T1204.002', icon: MonitorSmartphone, detail: 'Trojan installed on endpoint, evades AV' },
      { id: 4, label: 'C2 Callback', technique: 'C2 Communication', mitre: 'T1071.001', icon: Network, detail: 'Beacon to C2 over HTTPS every 30 seconds' },
      { id: 5, label: 'Data Exfil', technique: 'Exfiltration over C2', mitre: 'T1041', icon: Database, detail: 'Sensitive files exfiltrated via encrypted channel' },
    ],
    withoutResult: 'Corporate data exfiltrated — documents, credentials, and PII sent to attacker infrastructure.',
    withControls: [
      { layer: 'SSL Inspection', control: 'Full content inspection', verdict: 'inspected', detail: 'TLS session decrypted, payload visible to AV engine' },
      { layer: 'ATP Engine', control: 'Malicious payload detected', verdict: 'blocked', detail: 'Content scan detected EICAR/Cobalt Strike beacon in HTTP response — dropped' },
      { layer: 'DNS Filter', control: 'C2 domain blocked', verdict: 'blocked', detail: 'C2 domain flagged by threat feed — DNS sinkhole applied' },
      { layer: 'DLP Engine', control: 'Data exfil prevented', verdict: 'blocked', detail: 'Outbound content matched PII pattern — transfer blocked' },
    ],
    blockedAtStep: 1,
  },
  {
    id: 'cmp-3',
    name: 'DNS Tunnel Data Exfiltration',
    category: 'Data Exfiltration',
    description: 'Insider or compromised host encodes data in DNS TXT queries → bypasses HTTP inspection → exfiltrates to external server.',
    impactWithout: 78,
    impactWith: 2,
    steps: [
      { id: 1, label: 'Data Collection', technique: 'Data Staging', mitre: 'T1074', icon: Database, detail: 'Sensitive files compressed and staged' },
      { id: 2, label: 'DNS Encoding', technique: 'DNS Tunneling', mitre: 'T1071.004', icon: Network, detail: 'Data base64-encoded into DNS TXT queries' },
      { id: 3, label: 'Exfil via DNS', technique: 'DNS Exfil', mitre: 'T1048.003', icon: Globe, detail: 'High-entropy queries sent to attacker DNS server' },
      { id: 4, label: 'Data Received', technique: 'Collection', mitre: 'T1119', icon: Server, detail: 'Attacker reassembles data from DNS responses' },
    ],
    withoutResult: 'Sensitive data exfiltrated via DNS — invisible to HTTP-only inspection tools.',
    withControls: [
      { layer: 'DNS Tunnel Detection', control: 'Anomaly detected', verdict: 'detected', detail: 'Query entropy 4.8 bits/char, length 180 chars — tunnel signature matched' },
      { layer: 'DNS Filter', control: 'Tunnel queries blocked', verdict: 'blocked', detail: 'DNS tunnel mitigation — queries to non-approved resolvers dropped' },
      { layer: 'DoH Intercept', control: 'Fallback blocked', verdict: 'blocked', detail: 'DNS-over-HTTPS to external resolvers intercepted and redirected' },
    ],
    blockedAtStep: 1,
  },
  {
    id: 'cmp-4',
    name: 'Lateral Movement (Flat Network)',
    category: 'Lateral Movement',
    description: 'Compromised VPN → RDP to admin workstation → Pass-the-Hash → access financial database across flat network.',
    impactWithout: 92,
    impactWith: 8,
    steps: [
      { id: 1, label: 'VPN Access', technique: 'VPN Compromise', mitre: 'T1133', icon: Network, detail: 'Compromised VPN credentials — no MFA' },
      { id: 2, label: 'RDP to Admin WS', technique: 'Remote Desktop', mitre: 'T1021.001', icon: MonitorSmartphone, detail: 'RDP access to admin workstation (flat network)' },
      { id: 3, label: 'Credential Dump', technique: 'Pass-the-Hash', mitre: 'T1550.002', icon: Key, detail: 'NTLM hash extracted via Mimikatz' },
      { id: 4, label: 'Financial DB', technique: 'Database Access', mitre: 'T1213', icon: Database, detail: 'SAP HANA financial data accessed' },
    ],
    withoutResult: 'Financial data breach — SAP records with payment details exfiltrated.',
    withControls: [
      { layer: 'ZTNA', control: 'MFA enforced on VPN', verdict: 'blocked', detail: 'FIDO2 MFA required — stolen password alone insufficient' },
      { layer: 'SGT Microsegmentation', control: 'Segment boundary enforced', verdict: 'blocked', detail: 'SGT-300 (User) → SGT-200 (DB) = DENY at switch ASIC' },
      { layer: 'Device Posture', control: 'Non-compliant device', verdict: 'blocked', detail: 'Device posture check failed — unknown device blocked from network' },
    ],
    blockedAtStep: 0,
  },
];

const VERDICT_STYLE: Record<string, string> = {
  blocked: 'text-red-400 bg-red-900/30 border-red-700/40',
  inspected: 'text-blue-400 bg-blue-900/30 border-blue-700/40',
  detected: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/40',
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Style Helpers                                                    */
/* ═══════════════════════════════════════════════════════════════ */

function getWithStepStyle(isBlocked: boolean, isReached: boolean, isPastBlock: boolean): string {
  if (isBlocked) return 'bg-green-900/20 border-green-700/50 shadow-lg shadow-green-900/20';
  if (isReached) return 'bg-yellow-900/10 border-yellow-700/30';
  if (isPastBlock) return 'bg-gray-800/10 border-gray-800/20 opacity-40';
  return 'bg-gray-800/20 border-gray-800/40';
}

function getIconStyle(isBlocked: boolean, isReached: boolean): string {
  if (isBlocked) return 'bg-green-900/40 text-green-400';
  if (isReached) return 'bg-yellow-900/30 text-yellow-400';
  return 'bg-gray-800/50 text-gray-600';
}

function getLabelStyle(isBlocked: boolean, isReached: boolean, isPastBlock: boolean): string {
  if (isBlocked) return 'text-green-300';
  if (isReached) return 'text-yellow-300';
  if (isPastBlock) return 'text-gray-600';
  return 'text-gray-500';
}

/* ═══════════════════════════════════════════════════════════════ */
/*  ATTACK COMPARISON PAGE                                         */
/* ═══════════════════════════════════════════════════════════════ */

export default function AttackComparisonPage() {
  const [selected, setSelected] = useState<ComparisonScenario>(SCENARIOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animStep, setAnimStep] = useState(-1);
  const [showWith, setShowWith] = useState(false);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const resetAnimation = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    setAnimStep(-1);
    setShowWith(false);
    setIsPlaying(false);
  }, []);

  const playAnimation = useCallback(() => {
    if (isPlaying) return;
    resetAnimation();
    setIsPlaying(true);
    setShowWith(false);

    const totalSteps = selected.steps.length;
    // Phase 1: animate WITHOUT ApexAegis (all steps reach target)
    for (let i = 0; i < totalSteps; i++) {
      const t = setTimeout(() => setAnimStep(i), (i + 1) * 700);
      timerRefs.current.push(t);
    }
    // Phase 2: pause, then switch to WITH ApexAegis
    const switchTime = (totalSteps + 1) * 700 + 800;
    const t1 = setTimeout(() => {
      setAnimStep(-1);
      setShowWith(true);
    }, switchTime);
    timerRefs.current.push(t1);

    // Phase 3: animate WITH ApexAegis (blocked at specific step)
    const blockedAt = selected.blockedAtStep;
    for (let i = 0; i <= blockedAt; i++) {
      const t = setTimeout(() => setAnimStep(i), switchTime + 500 + (i + 1) * 700);
      timerRefs.current.push(t);
    }
    // End
    const endTime = switchTime + 500 + (blockedAt + 2) * 700 + 1000;
    const t2 = setTimeout(() => setIsPlaying(false), endTime);
    timerRefs.current.push(t2);
  }, [isPlaying, selected, resetAnimation]);

  // Cleanup timers on unmount
  useEffect(() => () => timerRefs.current.forEach(clearTimeout), []);

  const riskReduction = selected.impactWithout - selected.impactWith;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShieldOff size={24} className="text-red-400" />
            <Shield size={12} className="text-green-400 absolute -bottom-1 -right-1" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Attack Path Comparison</h1>
            <p className="text-sm text-gray-500">
              See how attacks propagate <span className="text-red-400 font-medium">without</span> vs <span className="text-green-400 font-medium">with</span> ApexAegis protection
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetAnimation}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            title="Reset"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={playAnimation}
            disabled={isPlaying}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Simulating...' : 'Run Comparison'}
          </button>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => { setSelected(s); resetAnimation(); }}
            className={clsx(
              'px-4 py-2 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors',
              selected.id === s.id
                ? 'bg-blue-900/40 border-blue-700 text-blue-300'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200',
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Impact Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-red-800/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldOff size={16} className="text-red-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Without ApexAegis</span>
          </div>
          <div className="text-3xl font-bold text-red-400">{selected.impactWithout}</div>
          <div className="text-[10px] text-gray-500 mt-1">Impact Score — {selected.steps.length} steps to compromise</div>
        </div>
        <div className="bg-gray-900 border border-green-800/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-green-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">With ApexAegis</span>
          </div>
          <div className="text-3xl font-bold text-green-400">{selected.impactWith}</div>
          <div className="text-[10px] text-gray-500 mt-1">Impact Score — blocked at step {selected.blockedAtStep + 1}</div>
        </div>
        <div className="bg-gray-900 border border-cyan-800/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-cyan-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Risk Reduction</span>
          </div>
          <div className="text-3xl font-bold text-cyan-400">{riskReduction}%</div>
          <div className="h-2 bg-gray-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all duration-1000"
              style={{ width: `${riskReduction}%` }}
            />
          </div>
        </div>
      </div>

      {/* Split Comparison View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* WITHOUT ApexAegis */}
        <div className={clsx(
          'bg-gray-900 border rounded-xl overflow-hidden transition-all duration-300',
          showWith ? 'border-gray-800' : 'border-red-800/60 ring-1 ring-red-500/20',
        )}>
          <div className="flex items-center gap-2 px-4 py-3 bg-red-900/10 border-b border-red-800/30">
            <ShieldOff size={16} className="text-red-400" />
            <span className="text-sm font-semibold text-red-300">Without ApexAegis</span>
            <span className="ml-auto text-[10px] text-red-400/60 font-mono uppercase">Unprotected</span>
          </div>
          <div className="p-4 space-y-2">
            {selected.steps.map((step, idx) => {
              const Icon = step.icon;
              const isReached = !showWith && animStep >= idx;
              const isCurrent = !showWith && animStep === idx && isPlaying;

              return (
                <div key={step.id} className="flex items-center gap-3">
                  {/* Step connector */}
                  {idx > 0 && (
                    <div className="w-6 flex justify-center">
                      <div className={clsx(
                        'w-0.5 h-4 -my-1 transition-colors duration-500',
                        isReached ? 'bg-red-500' : 'bg-gray-800',
                      )} />
                    </div>
                  )}
                  {idx > 0 && <div className="-ml-9" />}
                  {/* Step node */}
                  <div className={clsx(
                    'flex items-center gap-3 flex-1 px-3 py-2.5 rounded-lg border transition-all duration-500',
                    isReached
                      ? 'bg-red-900/20 border-red-700/50 shadow-lg shadow-red-900/20'
                      : 'bg-gray-800/20 border-gray-800/40',
                    isCurrent && 'animate-pulse ring-2 ring-red-500/40',
                  )}>
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-500',
                      isReached ? 'bg-red-900/40 text-red-400' : 'bg-gray-800/50 text-gray-600',
                    )}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={clsx('text-xs font-medium', isReached ? 'text-red-300' : 'text-gray-500')}>
                          {step.label}
                        </span>
                        <span className="text-[9px] text-gray-600 font-mono">{step.mitre}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{step.detail}</p>
                    </div>
                    {isReached && (
                      <XCircle size={14} className="text-red-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
            {/* Result */}
            {!showWith && animStep >= selected.steps.length - 1 && (
              <div className="mt-3 p-3 bg-red-900/20 border border-red-700/40 rounded-lg animate-in fade-in duration-500">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} className="text-red-400" />
                  <span className="text-xs font-semibold text-red-300">COMPROMISED</span>
                </div>
                <p className="text-[10px] text-red-400/80">{selected.withoutResult}</p>
              </div>
            )}
          </div>
        </div>

        {/* WITH ApexAegis */}
        <div className={clsx(
          'bg-gray-900 border rounded-xl overflow-hidden transition-all duration-300',
          showWith ? 'border-green-800/60 ring-1 ring-green-500/20' : 'border-gray-800',
        )}>
          <div className="flex items-center gap-2 px-4 py-3 bg-green-900/10 border-b border-green-800/30">
            <Shield size={16} className="text-green-400" />
            <span className="text-sm font-semibold text-green-300">With ApexAegis</span>
            <span className="ml-auto text-[10px] text-green-400/60 font-mono uppercase">Protected</span>
          </div>
          <div className="p-4 space-y-2">
            {selected.steps.map((step, idx) => {
              const Icon = step.icon;
              const isReached = showWith && animStep >= idx;
              const isCurrent = showWith && animStep === idx && isPlaying;
              const isBlocked = showWith && idx === selected.blockedAtStep && animStep >= idx;
              const isPastBlock = showWith && idx > selected.blockedAtStep;

              const stepBorder = getWithStepStyle(isBlocked, isReached, isPastBlock);
              const iconStyle = getIconStyle(isBlocked, isReached);
              const labelStyle = getLabelStyle(isBlocked, isReached, isPastBlock);

              return (
                <div key={step.id}>
                  <div className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-500',
                    stepBorder,
                    isCurrent && !isBlocked && 'animate-pulse',
                  )}>
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-500',
                      iconStyle,
                    )}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={clsx('text-xs font-medium', labelStyle)}>
                          {step.label}
                        </span>
                        <span className="text-[9px] text-gray-600 font-mono">{step.mitre}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{step.detail}</p>
                    </div>
                    {isBlocked && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-green-900/40 rounded text-[9px] text-green-400 font-bold flex-shrink-0">
                        <Lock size={10} /> BLOCKED
                      </div>
                    )}
                    {isPastBlock && (
                      <span className="text-[9px] text-gray-600 flex-shrink-0">Prevented</span>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Controls that blocked it */}
            {showWith && animStep >= selected.blockedAtStep && (
              <div className="mt-3 space-y-1.5 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={14} className="text-green-400" />
                  <span className="text-xs font-semibold text-green-300">ATTACK NEUTRALIZED — Security Controls</span>
                </div>
                {selected.withControls.map((ctrl) => (
                  <div key={ctrl.layer} className="flex items-center gap-2 px-3 py-2 bg-gray-800/30 rounded-lg border border-gray-800/40">
                    <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border ${VERDICT_STYLE[ctrl.verdict]}`}>
                      {ctrl.verdict}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-medium text-gray-300">{ctrl.layer}</span>
                      <span className="text-[10px] text-gray-500 mx-1">—</span>
                      <span className="text-[10px] text-gray-400">{ctrl.control}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scenario Description */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Eye size={14} className="text-blue-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Scenario Detail</span>
        </div>
        <p className="text-sm text-gray-300">{selected.description}</p>
        <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-500">
          <span>Category: <span className="text-gray-300">{selected.category}</span></span>
          <span>Steps: <span className="text-gray-300">{selected.steps.length}</span></span>
          <span>MITRE Techniques: <span className="text-gray-300">{selected.steps.map(s => s.mitre).join(', ')}</span></span>
        </div>
      </div>
    </div>
  );
}
