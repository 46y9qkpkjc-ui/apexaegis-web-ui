'use client';

/**
 * ApexAegis First-Time Setup Wizard
 * Configures:
 * 1. Governance & Regulatory Frameworks
 * 2. 0-100 Continuous Adaptive Trust & Dynamic Enforcement
 * 3. Top Sanctioned SaaS & Agentic AI App Catalog
 * 4. Predictive QoE & Local Physical NIC Optimization
 * 5. Sovereign Micro-Cells, Hardware Geocoding & Private In-Country Hiero aBFT Ledger
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, ArrowRight, ArrowLeft, Check, Loader2, Sparkles,
  Landmark, Globe2, CreditCard, HeartPulse, Building2, ListChecks, X,
  Activity, Sliders, Database, Network, Zap, MapPin, Lock, Server, Cpu
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

const ACCENT = '#6D4AFF';
const CONFIG_KEY = 'aa_governance_config';
const COMPLETED_KEY = 'aa_governance_completed';

// Step flow definition
const STEP_WELCOME = 0;
const STEP_FRAMEWORKS = 1;
const STEP_RISK_TAXONOMY = 2;
const STEP_APPS_DISCOVERY = 3;
const STEP_QOE_NIC = 4;
const STEP_SOVEREIGN_CELL = 5;
const STEP_PROVISION = 6;
const STEP_DONE = 7;

const CONFIG_STEPS = [
  STEP_FRAMEWORKS,
  STEP_RISK_TAXONOMY,
  STEP_APPS_DISCOVERY,
  STEP_QOE_NIC,
  STEP_SOVEREIGN_CELL
];

interface Framework {
  id: string;
  name: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

const FRAMEWORKS: Framework[] = [
  { id: 'nist-800-53', name: 'NIST 800-53 / 800-207', desc: 'Federal & Zero Trust control catalog', icon: Landmark },
  { id: 'iso-27001',   name: 'ISO/IEC 27001',          desc: 'Global ISMS information security standard', icon: Globe2 },
  { id: 'soc2',        name: 'SOC 2 Type II',           desc: 'Trust services criteria (Security & Availability)', icon: ShieldCheck },
  { id: 'pci-dss',     name: 'PCI-DSS 4.0',             desc: 'Cardholder Data Environment (CDE) protection', icon: CreditCard },
  { id: 'gdpr',        name: 'GDPR / DPDP Sovereign',   desc: 'In-country jurisdictional data routing', icon: Building2 },
  { id: 'fedramp',     name: 'FedRAMP (High/Mod)',      desc: 'US cloud authorization & FIPS 140-3 baseline', icon: Landmark },
  { id: 'cis',         name: 'CIS Controls v8',         desc: 'Essential cyber defense hygiene', icon: ListChecks },
  { id: 'hipaa',       name: 'HIPAA Security Rule',     desc: 'ePHI healthcare data & DLP controls', icon: HeartPulse },
];

const SANCTIONED_PRESETS = [
  'Microsoft 365', 'Google Workspace', 'Salesforce', 'GitHub Enterprise',
  'Slack Enterprise', 'Zoom Meetings', 'ChatGPT Enterprise', 'Claude Team',
  'Atlassian Suite', 'ServiceNow', 'Workday', 'AWS Console'
];

const SOVEREIGN_CELL_REGIONS = [
  { id: 'in-ap-south-1', name: 'India Enclave (AWS ap-south-1)', desc: 'Strict DPDP Act compliance · In-Country Private Hiero Node' },
  { id: 'eu-eu-central-1', name: 'EU Enclave (AWS eu-central-1)', desc: 'GDPR sovereign data residency · Dedicated EU Ledger' },
  { id: 'us-govcloud', name: 'US GovCloud / East (us-gov-west-1)', desc: 'FedRAMP / NIST isolation · FIPS CloudHSM KMS' },
  { id: 'sg-ap-southeast-1', name: 'Singapore Enclave (AWS ap-southeast-1)', desc: 'MAS TRM compliance · Regional sovereign vault' },
];

export function FirstTimeSetup() {
  const { user, accessToken } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(STEP_WELCOME);
  const [provisionIdx, setProvisionIdx] = useState(0);

  // Posture States
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['nist-800-53', 'iso-27001', 'soc2']);
  const [riskSensitivity, setRiskSensitivity] = useState<'strict' | 'balanced' | 'adaptive'>('adaptive');
  const [sanctionedApps, setSanctionedApps] = useState<string[]>(['Microsoft 365', 'GitHub Enterprise', 'ChatGPT Enterprise', 'Slack Enterprise']);
  const [qoeOptimization, setQoeOptimization] = useState(true);
  const [nicBackoffThreshold, setNicBackoffThreshold] = useState('80');
  
  // Sovereign Cell & Distributed Ledger States
  const [sovereignRegion, setSovereignRegion] = useState('in-ap-south-1');
  const [geofenceEnforcement, setGeofenceEnforcement] = useState<'strict_hw' | 'bgp_path' | 'permissive'>('strict_hw');
  const [enablePrivateHiero, setEnablePrivateHiero] = useState(true);
  const [hieroConsensusMode, setHieroConsensusMode] = useState<'private_cluster' | 'public_anchor'>('private_cluster');
  const [logRetentionPeriod, setLogRetentionPeriod] = useState('180-days');
  const [telemetryMode, setTelemetryMode] = useState<'webhook' | 'apikey'>('webhook');
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  const applyPersisted = useCallback(() => {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const c = JSON.parse(raw) as Record<string, unknown>;
        if (Array.isArray(c.selectedFrameworks)) setSelectedFrameworks(c.selectedFrameworks as string[]);
        if (typeof c.riskSensitivity === 'string') setRiskSensitivity(c.riskSensitivity as 'strict' | 'balanced' | 'adaptive');
        if (Array.isArray(c.sanctionedApps)) setSanctionedApps(c.sanctionedApps as string[]);
        if (typeof c.qoeOptimization === 'boolean') setQoeOptimization(c.qoeOptimization);
        if (typeof c.nicBackoffThreshold === 'string') setNicBackoffThreshold(c.nicBackoffThreshold);
        if (typeof c.sovereignRegion === 'string') setSovereignRegion(c.sovereignRegion);
        if (typeof c.geofenceEnforcement === 'string') setGeofenceEnforcement(c.geofenceEnforcement as 'strict_hw' | 'bgp_path' | 'permissive');
        if (typeof c.enablePrivateHiero === 'boolean') setEnablePrivateHiero(c.enablePrivateHiero);
        if (typeof c.hieroConsensusMode === 'string') setHieroConsensusMode(c.hieroConsensusMode as 'private_cluster' | 'public_anchor');
        if (typeof c.logRetentionPeriod === 'string') setLogRetentionPeriod(c.logRetentionPeriod);
        if (typeof c.telemetryMode === 'string') setTelemetryMode(c.telemetryMode as 'webhook' | 'apikey');
      }
      const done = localStorage.getItem(COMPLETED_KEY);
      setCompletedAt(done);
    } catch { /* ignore */ }
  }, []);

  const openNow = useCallback(() => {
    applyPersisted();
    setStep(STEP_WELCOME);
    setProvisionIdx(0);
    setOpen(true);
  }, [applyPersisted]);

  useEffect(() => {
    if (accessToken) openNow();
  }, [accessToken, openNow]);

  const provisionTasks = [
    `Compiling ${selectedFrameworks.length} governance framework control policies`,
    `Initializing Continuous Adaptive Trust engine (0-100 Sensitivity: ${riskSensitivity})`,
    `Governing ${sanctionedApps.length} sanctioned apps with NHI & OAuth boundaries`,
    `Configuring Predictive QoE NIC contention back-off (> ${nicBackoffThreshold}% utilization)`,
    `Isolating Sovereign Cell Enclave in ${SOVEREIGN_CELL_REGIONS.find(r => r.id === sovereignRegion)?.name}`,
    `Activating Hardware/GPS Geocoded Routing Boundary (${geofenceEnforcement})`,
    `Deploying In-Country Private Hiero aBFT Consensus Nodes & S3 WORM (${logRetentionPeriod})`,
  ];

  useEffect(() => {
    if (step !== STEP_PROVISION) return;
    if (provisionIdx >= provisionTasks.length) {
      const t = setTimeout(() => setStep(STEP_DONE), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setProvisionIdx(i => i + 1), 620);
    return () => clearTimeout(t);
  }, [step, provisionIdx, provisionTasks.length]);

  if (!open || !accessToken) return null;

  const toggleArray = (arr: string[], setFn: (v: string[]) => void, id: string) =>
    setFn(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

  const finish = () => {
    const config = {
      selectedFrameworks,
      riskSensitivity,
      sanctionedApps,
      qoeOptimization,
      nicBackoffThreshold,
      sovereignRegion,
      geofenceEnforcement,
      enablePrivateHiero,
      hieroConsensusMode,
      logRetentionPeriod,
      telemetryMode,
    };
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      localStorage.setItem(COMPLETED_KEY, new Date().toISOString());
      setCompletedAt(new Date().toISOString());
    } catch { /* ignore */ }
    setOpen(false);
  };

  const configIdx = CONFIG_STEPS.indexOf(step);
  const firstName = (user?.name || user?.email || 'Admin').split(/[ @]/)[0];

  const sectionHead = (Icon: typeof ShieldCheck, title: string, sub: string) => (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <Icon size={18} style={{ color: ACCENT }} /> {title}
      </h2>
      <p className="text-sm text-gray-400">{sub}</p>
    </div>
  );

  const navRow = (back: number, next: number, nextLabel: string, nextDisabled = false) => (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
      <button onClick={() => setStep(back)} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200">
        <ArrowLeft size={15} /> Back
      </button>
      <button
        onClick={() => setStep(next)}
        disabled={nextDisabled}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all shadow-lg"
        style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}
      >
        {nextLabel} <ArrowRight size={15} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-2xl border overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        style={{ background: 'linear-gradient(180deg,#141033,#0e0a24)', borderColor: 'rgba(109,74,255,0.25)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5">
          <span className="inline-flex items-center gap-2 text-white font-semibold tracking-wide">
            <ShieldCheck size={20} style={{ color: ACCENT }} /> Apex <span style={{ color: ACCENT }}>Aegis</span>
            <span className="ml-2 text-[11px] uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-0.5 rounded">
              {completedAt ? 'Security Posture' : 'Zero Trust Setup'}
            </span>
          </span>
          {completedAt && step !== STEP_PROVISION && (
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-wider text-gray-500">
              {configIdx >= 0 ? `Step ${configIdx + 1} of ${CONFIG_STEPS.length}` : step >= STEP_PROVISION ? 'Applying Posture' : 'Welcome'}
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden bg-white/10">
            <div className="h-full rounded-full transition-all" style={{
              width: `${Math.round((Math.min(step, STEP_PROVISION) / STEP_PROVISION) * 100)}%`,
              background: `linear-gradient(90deg,${ACCENT},#8b6dff)`
            }} />
          </div>
        </div>

        <div className="px-6 py-6 overflow-y-auto flex-1">
          {/* ── 0 · Welcome ── */}
          {step === STEP_WELCOME && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border"
                style={{ background: 'rgba(109,74,255,0.12)', borderColor: 'rgba(109,74,255,0.3)' }}>
                <Sparkles size={30} style={{ color: ACCENT }} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome to ApexAegis, {firstName}.</h1>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                Deploy your adaptive Zero Trust posture: governance frameworks, 0–100 continuous risk scoring, sanctioned AI discovery, predictive QoE, and sovereign micro-cells with in-country distributed ledger auditing.
              </p>
              <button
                onClick={() => setStep(STEP_FRAMEWORKS)}
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white"
                style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}
              >
                {completedAt ? 'Review & Edit Configuration' : 'Launch Posture Setup'} <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── 1 · Frameworks ── */}
          {step === STEP_FRAMEWORKS && (
            <div>
              {sectionHead(Landmark, 'Governance & Regulatory Frameworks', 'Auto-generate baseline access, encryption, and audit controls mapped to selected standards.')}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {FRAMEWORKS.map(f => {
                  const on = selectedFrameworks.includes(f.id);
                  const Icon = f.icon;
                  return (
                    <button key={f.id} onClick={() => toggleArray(selectedFrameworks, setSelectedFrameworks, f.id)}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all"
                      style={{ background: on ? 'rgba(109,74,255,0.12)' : 'rgba(255,255,255,0.02)', borderColor: on ? 'rgba(109,74,255,0.5)' : 'rgba(255,255,255,0.08)' }}>
                      <Icon size={20} style={{ color: on ? ACCENT : '#6b7280' }} />
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-gray-100">{f.name}</span>
                        <span className="block text-[11px] text-gray-500">{f.desc}</span>
                      </span>
                      <span className="w-5 h-5 rounded-md flex items-center justify-center border"
                        style={{ background: on ? ACCENT : 'transparent', borderColor: on ? ACCENT : 'rgba(255,255,255,0.2)' }}>
                        {on && <Check size={13} className="text-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              {navRow(STEP_WELCOME, STEP_RISK_TAXONOMY, `Continue (${selectedFrameworks.length} Selected)`, selectedFrameworks.length === 0)}
            </div>
          )}

          {/* ── 2 · Risk Scoring & Dynamic Enforcement ── */}
          {step === STEP_RISK_TAXONOMY && (
            <div>
              {sectionHead(Activity, '0–100 Risk Engine & Dynamic Enforcement', 'Define how continuous telemetry (EDR, travel velocity, agentic context) triggers automated mid-session controls.')}
              <div className="space-y-3 mb-5">
                {[
                  { id: 'adaptive', name: 'Adaptive Continuous Trust (Recommended)', desc: 'Low (0-25): Native pass-through | Med (26-59): Silent re-auth & DLP | High (60-79): Step-Up/RBI | Crit (80-100): Isolation' },
                  { id: 'strict', name: 'Strict Zero Trust (High Assurance)', desc: 'Immediate Step-Up on minor patch latency or unverified Wi-Fi; blocks Tier 1 banking/PII at score > 40.' },
                  { id: 'balanced', name: 'Audit & Telemetry Mode', desc: 'Evaluates and logs 0-100 risk degradation without dropping active connections; ideal for dry-run rollout.' },
                ].map(opt => {
                  const on = riskSensitivity === opt.id;
                  return (
                    <button key={opt.id} onClick={() => setRiskSensitivity(opt.id as 'strict' | 'balanced' | 'adaptive')}
                      className="w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all"
                      style={{ background: on ? 'rgba(109,74,255,0.1)' : 'rgba(255,255,255,0.02)', borderColor: on ? 'rgba(109,74,255,0.5)' : 'rgba(255,255,255,0.08)' }}>
                      <span className="w-4 h-4 rounded-full border mt-1 flex items-center justify-center flex-shrink-0" style={{ borderColor: on ? ACCENT : 'rgba(255,255,255,0.25)' }}>
                        {on && <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-gray-100">{opt.name}</span>
                        <span className="block text-[11.5px] text-gray-400 mt-0.5 leading-relaxed">{opt.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {navRow(STEP_FRAMEWORKS, STEP_APPS_DISCOVERY, 'Continue')}
            </div>
          )}

          {/* ── 3 · Sanctioned Apps & AI Discovery ── */}
          {step === STEP_APPS_DISCOVERY && (
            <div>
              {sectionHead(Sliders, 'Sanctioned SaaS & Agentic AI Catalog', 'Approve corporate SaaS and AI platforms. Enforces tenant-isolation, prompt DLP, and non-human identity (NHI) token governance.')}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SANCTIONED_PRESETS.map(app => {
                  const on = sanctionedApps.includes(app);
                  return (
                    <button key={app} onClick={() => toggleArray(sanctionedApps, setSanctionedApps, app)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-[12.5px] transition-all"
                      style={{ background: on ? 'rgba(109,74,255,0.12)' : 'rgba(255,255,255,0.02)', borderColor: on ? 'rgba(109,74,255,0.5)' : 'rgba(255,255,255,0.08)', color: on ? '#e7e3ff' : '#9aa0b5' }}>
                      <span className="w-4 h-4 rounded flex items-center justify-center border flex-shrink-0"
                        style={{ background: on ? ACCENT : 'transparent', borderColor: on ? ACCENT : 'rgba(255,255,255,0.2)' }}>
                        {on && <Check size={11} className="text-white" />}
                      </span>
                      {app}
                    </button>
                  );
                })}
              </div>
              {navRow(STEP_RISK_TAXONOMY, STEP_QOE_NIC, `Continue (${sanctionedApps.length} Sanctioned)`)}
            </div>
          )}

          {/* ── 4 · Predictive QoE & NIC Optimization ── */}
          {step === STEP_QOE_NIC && (
            <div>
              {sectionHead(Network, 'Predictive QoE & Physical NIC Optimization', 'Prioritize Teams, Zoom, and WebEx by dynamically throttling noisy background processes across both steered and bypassed flows.')}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/5">
                  <div>
                    <span className="block text-sm font-medium text-gray-100">Dynamic Background Back-Off</span>
                    <span className="block text-[11.5px] text-gray-400">Throttles OS updates and cloud backups on the local NIC during active calls.</span>
                  </div>
                  <input type="checkbox" checked={qoeOptimization} onChange={e => setQoeOptimization(e.target.checked)} className="w-4 h-4 accent-purple-600" />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1.5">
                    NIC Saturation Back-Off Trigger (%)
                  </label>
                  <select
                    value={nicBackoffThreshold}
                    onChange={e => setNicBackoffThreshold(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-gray-100 border outline-none bg-white/5 border-white/10"
                  >
                    <option value="70" className="bg-[#141033]">70% Total Adapter Saturation (Aggressive)</option>
                    <option value="80" className="bg-[#141033]">80% Total Adapter Saturation (Standard)</option>
                    <option value="90" className="bg-[#141033]">90% Total Adapter Saturation (Permissive)</option>
                  </select>
                </div>
              </div>
              {navRow(STEP_APPS_DISCOVERY, STEP_SOVEREIGN_CELL, 'Continue')}
            </div>
          )}

          {/* ── 5 · Sovereign Micro-Cells & In-Country Distributed Ledger ── */}
          {step === STEP_SOVEREIGN_CELL && (
            <div>
              {sectionHead(Database, 'Sovereign Micro-Cells & Immutable DLT Engine', 'Isolate jurisdictions into self-contained private networks with in-country aBFT consensus.')}

              {/* In-Country Enclave Selection */}
              <div className="mb-4">
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Server size={13} /> Sovereign Enclave Region (AWS Private VPC)
                </label>
                <div className="space-y-2">
                  {SOVEREIGN_CELL_REGIONS.map(r => {
                    const on = sovereignRegion === r.id;
                    return (
                      <button key={r.id} onClick={() => setSovereignRegion(r.id)}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all"
                        style={{ background: on ? 'rgba(109,74,255,0.12)' : 'rgba(255,255,255,0.02)', borderColor: on ? 'rgba(109,74,255,0.5)' : 'rgba(255,255,255,0.08)' }}>
                        <span className="w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0" style={{ borderColor: on ? ACCENT : 'rgba(255,255,255,0.25)' }}>
                          {on && <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />}
                        </span>
                        <div className="flex-1">
                          <span className="block text-xs font-medium text-gray-100">{r.name}</span>
                          <span className="block text-[10.5px] text-gray-400">{r.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Geocoding & Hardware Attestation */}
              <div className="mb-4">
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <MapPin size={13} /> Geocoding & Path-Aware Jurisdiction Control
                </label>
                <select
                  value={geofenceEnforcement}
                  onChange={e => setGeofenceEnforcement(e.target.value as 'strict_hw' | 'bgp_path' | 'permissive')}
                  className="w-full px-3.5 py-2 rounded-lg text-xs text-gray-100 bg-white/5 border border-white/10 outline-none"
                >
                  <option value="strict_hw" className="bg-[#141033]">Strict Hardware Geocoding (OS GPS + Wi-Fi BSSID + BGP ASN)</option>
                  <option value="bgp_path" className="bg-[#141033]">Network Path Geocoding (BGP Sovereign Path Traversal)</option>
                  <option value="permissive" className="bg-[#141033]">Permissive (Geo-IP Lookup Only)</option>
                </select>
              </div>

              {/* In-Country Hiero Distributed Ledger */}
              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} style={{ color: ACCENT }} />
                    <div>
                      <span className="block text-xs font-medium text-gray-100">Private Hiero aBFT Consensus Engine</span>
                      <span className="block text-[10.5px] text-gray-400">Deploys in-VPC Linux Foundation Hashgraph nodes for tamper-proof state proofs.</span>
                    </div>
                  </div>
                  <input type="checkbox" checked={enablePrivateHiero} onChange={e => setEnablePrivateHiero(e.target.checked)} className="w-4 h-4 accent-purple-600" />
                </div>

                {enablePrivateHiero && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => setHieroConsensusMode('private_cluster')}
                      className={`px-2.5 py-2 rounded-lg border text-[11px] text-left transition-all ${hieroConsensusMode === 'private_cluster' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/10 text-gray-400'}`}
                    >
                      <span className="font-semibold block">Air-Gapped Private Nodes</span>
                      <span className="text-[9.5px] opacity-70">100% In-Country VPC Isolation</span>
                    </button>
                    <button
                      onClick={() => setHieroConsensusMode('public_anchor')}
                      className={`px-2.5 py-2 rounded-lg border text-[11px] text-left transition-all ${hieroConsensusMode === 'public_anchor' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/10 text-gray-400'}`}
                    >
                      <span className="font-semibold block">Hashgraph HCS Root</span>
                      <span className="text-[9.5px] opacity-70">Zero PII / Cryptographic Merkle only</span>
                    </button>
                  </div>
                )}
              </div>

              {/* S3 WORM & KMS Retention */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                    <Lock size={12} /> S3 WORM Compliance Mode
                  </label>
                  <select value={logRetentionPeriod} onChange={e => setLogRetentionPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs text-gray-100 bg-white/5 border border-white/10 outline-none">
                    <option value="90-days" className="bg-[#141033]">90 Days Hot / 1 Year WORM</option>
                    <option value="180-days" className="bg-[#141033]">180 Days Hot / 3 Years WORM (SOC 2)</option>
                    <option value="365-days" className="bg-[#141033]">365 Days Hot / 7 Years WORM (FedRAMP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                    <Zap size={12} /> SIEM / ITDR Ingestion
                  </label>
                  <select value={telemetryMode} onChange={e => setTelemetryMode(e.target.value as 'webhook' | 'apikey')}
                    className="w-full px-3 py-2 rounded-lg text-xs text-gray-100 bg-white/5 border border-white/10 outline-none">
                    <option value="webhook" className="bg-[#141033]">Real-Time Webhook (HMAC-SHA256)</option>
                    <option value="apikey" className="bg-[#141033]">REST API Pull (SIEM / EDR Keys)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <button onClick={() => setStep(STEP_QOE_NIC)} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200">
                  <ArrowLeft size={15} /> Back
                </button>
                <button onClick={() => { setProvisionIdx(0); setStep(STEP_PROVISION); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all shadow-lg"
                  style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}>
                  Enforce Sovereign Posture <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── 6 · Provisioning ── */}
          {step === STEP_PROVISION && (
            <div className="py-4">
              <h2 className="text-lg font-bold text-white mb-1">Deploying Sovereign Zero Trust Posture…</h2>
              <p className="text-sm text-gray-500 mb-5">Binding sovereign enclave VPCs, private Hiero nodes, and adaptive risk gates.</p>
              <div className="space-y-2.5 max-w-md mx-auto">
                {provisionTasks.map((taskText, i) => {
                  const done = i < provisionIdx;
                  const active = i === provisionIdx;
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all"
                      style={{
                        background: done ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
                        borderColor: done ? 'rgba(34,197,94,0.3)' : active ? 'rgba(109,74,255,0.4)' : 'rgba(255,255,255,0.06)'
                      }}>
                      {done ? <Check size={16} className="text-green-400" /> : active ? <Loader2 size={16} className="animate-spin" style={{ color: ACCENT }} /> : <span className="w-4 h-4 rounded-full border border-gray-700" />}
                      <span className={`text-sm ${done ? 'text-green-300' : active ? 'text-gray-200' : 'text-gray-600'}`}>{taskText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 7 · Completion ── */}
          {step === STEP_DONE && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border"
                style={{ background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' }}>
                <Check size={32} className="text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Sovereign Architecture Online</h1>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                {selectedFrameworks.length} Frameworks Active · {sanctionedApps.length} Apps Governed · Predictive QoE Online ·
                {' '}{SOVEREIGN_CELL_REGIONS.find(r => r.id === sovereignRegion)?.name} Enclave Isolated · Private Hiero aBFT Ledger Locked.
              </p>
              <button onClick={finish}
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all shadow-lg"
                style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}>
                Enter Console <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}