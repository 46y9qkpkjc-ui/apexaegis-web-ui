'use client';

/**
 * First-time setup wizard — shown after SSO login to let the operator choose their
 * governance baseline and see the workspace configure itself.
 *
 * Demo re-trigger: because every Guacamole viewer signs in as the same demo user from
 * the same VDI egress IP, neither email nor public IP can distinguish viewers. So the
 * wizard is TIMER-gated — it re-shows if it hasn't been shown in the last 45 minutes
 * (even if previously completed), giving each demo session the full onboarding. A
 * `aa:open-setup` window event (or the header button) forces it open on demand.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, ArrowRight, ArrowLeft, Check, Loader2, Sparkles,
  Landmark, Globe2, CreditCard, HeartPulse, Building2, ListChecks, X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

const ACCENT = '#6D4AFF';
const SHOWN_KEY = 'aa_setup_shown_at';
const FRAMEWORKS_KEY = 'aa_governance_frameworks';
const REDISPLAY_MS = 45 * 60 * 1000; // 45 minutes

// Self-serve auto-trigger: the /vdi gate records each OTP-verified viewer; the wizard
// polls this signal and opens for each fresh viewer (no presenter needed).
const ACCESS_ENDPOINT = 'https://apexastute.com/api/demo-access/latest';
const ACCESS_SEEN_KEY = 'aa_last_access_seen';
const ACCESS_POLL_MS = 20000;

interface Framework {
  id: string; name: string; desc: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}
const FRAMEWORKS: Framework[] = [
  { id: 'nist-800-53', name: 'NIST 800-53', desc: 'US federal control catalog', icon: Landmark },
  { id: 'iso-27001',   name: 'ISO/IEC 27001', desc: 'International ISMS standard', icon: Globe2 },
  { id: 'soc2',        name: 'SOC 2 Type II', desc: 'Trust-services criteria', icon: ShieldCheck },
  { id: 'pci-dss',     name: 'PCI-DSS 4.0', desc: 'Cardholder-data security', icon: CreditCard },
  { id: 'gdpr',        name: 'GDPR', desc: 'EU data protection', icon: Building2 },
  { id: 'fedramp',     name: 'FedRAMP', desc: 'US cloud authorization', icon: Landmark },
  { id: 'cis',         name: 'CIS Controls v8', desc: 'Prioritized safeguards', icon: ListChecks },
  { id: 'hipaa',       name: 'HIPAA', desc: 'US health-data privacy', icon: HeartPulse },
];

const BASELINE = [
  { id: 'default-deny', label: 'Default-deny egress', desc: 'Block by default; allow by policy' },
  { id: 'device-compliance', label: 'Require device compliance', desc: 'Posture + attestation gate on access' },
  { id: 'ai-risk', label: 'AI domain-risk scoring', desc: 'Score unknown domains inline at the PEP' },
  { id: 'dns-pep', label: 'DNS-layer blocking (DNS-PEP)', desc: 'Sinkhole denied domains at the endpoint' },
];

export function FirstTimeSetup() {
  const { user, accessToken } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0); // 0 welcome · 1 frameworks · 2 baseline · 3 provisioning · 4 done
  const [selected, setSelected] = useState<string[]>(['nist-800-53', 'iso-27001', 'soc2']);
  const [baseline, setBaseline] = useState<string[]>(BASELINE.map(b => b.id));
  const [provisionIdx, setProvisionIdx] = useState(0);

  const openNow = useCallback(() => {
    setStep(0); setProvisionIdx(0); setOpen(true);
    try { localStorage.setItem(SHOWN_KEY, String(Date.now())); } catch { /* private mode */ }
  }, []);

  // Timer-gated auto-open: first authed paint, then only if >45min since last shown.
  useEffect(() => {
    if (!accessToken) return;
    let last = 0;
    try { last = Number(localStorage.getItem(SHOWN_KEY) || 0); } catch { /* ignore */ }
    if (!last || Date.now() - last > REDISPLAY_MS) openNow();
  }, [accessToken, openNow]);

  // Manual re-trigger for the presenter (header button / devtools dispatch).
  useEffect(() => {
    const h = () => openNow();
    window.addEventListener('aa:open-setup', h);
    return () => window.removeEventListener('aa:open-setup', h);
  }, [openNow]);

  // Self-serve auto-trigger: poll the gate's "latest access" timestamp. When a new viewer
  // verifies at apexastute.com/vdi, open the wizard for them. The first poll only syncs a
  // baseline (never opens on historical access); fail-soft if apexastute is unreachable.
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(ACCESS_ENDPOINT, { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const { at } = await res.json() as { at?: number };
        if (!at) return;
        let seen = 0;
        try { seen = Number(localStorage.getItem(ACCESS_SEEN_KEY) || 0); } catch { /* ignore */ }
        if (at > seen) {
          try { localStorage.setItem(ACCESS_SEEN_KEY, String(at)); } catch { /* ignore */ }
          if (seen > 0) openNow(); // only after a baseline exists
        }
      } catch { /* apexastute unreachable — timer + wand button still cover it */ }
    };
    check();
    const id = setInterval(check, ACCESS_POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [accessToken, openNow]);

  // Provisioning animation → advances through the chosen frameworks, then to "done".
  useEffect(() => {
    if (step !== 3) return;
    if (provisionIdx >= selected.length) { const t = setTimeout(() => setStep(4), 500); return () => clearTimeout(t); }
    const t = setTimeout(() => setProvisionIdx(i => i + 1), 650);
    return () => clearTimeout(t);
  }, [step, provisionIdx, selected.length]);

  if (!open || !accessToken) return null;

  const toggle = (arr: string[], set: (v: string[]) => void, id: string) =>
    set(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

  const finish = () => {
    try { localStorage.setItem(FRAMEWORKS_KEY, JSON.stringify(selected)); } catch { /* ignore */ }
    setOpen(false);
  };

  const firstName = (user?.name || user?.email || 'there').split(/[ @]/)[0];
  const chosen = FRAMEWORKS.filter(f => selected.includes(f.id));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(6,4,20,0.72)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-2xl rounded-2xl border overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(180deg,#141033,#0e0a24)', borderColor: 'rgba(109,74,255,0.25)' }}>

        {/* Header / progress */}
        <div className="flex items-center justify-between px-6 pt-5">
          <span className="inline-flex items-center gap-2 text-white font-semibold" style={{ fontFamily: "'Outfit',sans-serif" }}>
            <ShieldCheck size={20} style={{ color: ACCENT }} /> Apex <span style={{ color: ACCENT }}>Aegis</span>
            <span className="ml-2 text-[11px] uppercase tracking-wider text-gray-500">First-time setup</span>
          </span>
          {step < 3 && (
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300" aria-label="Skip for now"><X size={18} /></button>
          )}
        </div>
        <div className="flex gap-1.5 px-6 pt-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-1 flex-1 rounded-full transition-colors"
              style={{ background: step >= i ? ACCENT : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>

        <div className="px-6 py-6 min-h-[340px]">
          {/* ── Step 0 — Welcome ── */}
          {step === 0 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(109,74,255,0.12)', border: '1px solid rgba(109,74,255,0.3)' }}>
                <Sparkles size={30} style={{ color: ACCENT }} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome, {firstName}.</h1>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                Let&apos;s tailor your ApexAegis workspace. In under a minute you&apos;ll pick the governance
                frameworks you report against and confirm your security baseline — the console configures itself around them.
              </p>
              <button onClick={() => setStep(1)}
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all"
                style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}>
                Get started <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step 1 — Frameworks ── */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Choose your governance frameworks</h2>
              <p className="text-sm text-gray-500 mb-4">Select every standard you&apos;re held to — dashboards, controls and reports map to these.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {FRAMEWORKS.map(f => {
                  const on = selected.includes(f.id); const Icon = f.icon;
                  return (
                    <button key={f.id} onClick={() => toggle(selected, setSelected, f.id)}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all"
                      style={{ background: on ? 'rgba(109,74,255,0.1)' : 'rgba(255,255,255,0.02)', borderColor: on ? 'rgba(109,74,255,0.5)' : 'rgba(255,255,255,0.08)' }}>
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
              <div className="flex items-center justify-between mt-6">
                <button onClick={() => setStep(0)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300"><ArrowLeft size={15} /> Back</button>
                <button onClick={() => setStep(2)} disabled={selected.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all"
                  style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}>
                  Continue ({selected.length}) <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2 — Baseline ── */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Confirm your security baseline</h2>
              <p className="text-sm text-gray-500 mb-4">These opinionated defaults apply on day one. Toggle anything off you&apos;re not ready for.</p>
              <div className="space-y-2.5">
                {BASELINE.map(b => {
                  const on = baseline.includes(b.id);
                  return (
                    <button key={b.id} onClick={() => toggle(baseline, setBaseline, b.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all"
                      style={{ background: on ? 'rgba(109,74,255,0.08)' : 'rgba(255,255,255,0.02)', borderColor: on ? 'rgba(109,74,255,0.4)' : 'rgba(255,255,255,0.08)' }}>
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-gray-100">{b.label}</span>
                        <span className="block text-[11px] text-gray-500">{b.desc}</span>
                      </span>
                      <span className="relative w-9 h-5 rounded-full transition-colors" style={{ background: on ? ACCENT : 'rgba(255,255,255,0.15)' }}>
                        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: on ? '18px' : '2px' }} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-6">
                <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300"><ArrowLeft size={15} /> Back</button>
                <button onClick={() => { setProvisionIdx(0); setStep(3); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                  style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}>
                  Configure workspace <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3 — Provisioning ── */}
          {step === 3 && (
            <div className="py-4">
              <h2 className="text-lg font-bold text-white mb-1">Configuring your workspace…</h2>
              <p className="text-sm text-gray-500 mb-5">Mapping controls and enabling your baseline.</p>
              <div className="space-y-2.5 max-w-md mx-auto">
                {chosen.map((f, i) => {
                  const done = i < provisionIdx; const active = i === provisionIdx;
                  return (
                    <div key={f.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border"
                      style={{ background: done ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)', borderColor: done ? 'rgba(34,197,94,0.3)' : active ? 'rgba(109,74,255,0.4)' : 'rgba(255,255,255,0.06)' }}>
                      {done ? <Check size={16} className="text-green-400" /> : active ? <Loader2 size={16} className="animate-spin" style={{ color: ACCENT }} /> : <span className="w-4 h-4 rounded-full border border-gray-700" />}
                      <span className={`text-sm ${done ? 'text-green-300' : active ? 'text-gray-200' : 'text-gray-600'}`}>Applying {f.name} controls</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 4 — Done ── */}
          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <Check size={32} className="text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Your workspace is ready.</h1>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                {chosen.length} framework{chosen.length === 1 ? '' : 's'} active — {chosen.map(f => f.name).join(', ')}.
                Compliance dashboards, policy controls and reporting are now tailored to your baseline.
              </p>
              <button onClick={finish}
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all"
                style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}>
                Enter the console <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
