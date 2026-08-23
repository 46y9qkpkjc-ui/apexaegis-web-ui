'use client';

/**
 * First-time setup wizard — shown after SSO login to let the operator stand up a full
 * governance posture and watch the workspace configure itself. Covers: governance
 * frameworks, DNS/URL deny categories, DPI depth, sanctioned apps & AI, private-access
 * tenant + connector + discovered apps, and IDS/IPS/WAF + AV profiles.
 *
 * Demo re-trigger: every Guacamole viewer signs in as the same demo user from the same
 * VDI egress IP, so neither email nor IP can distinguish viewers. The wizard is TIMER-
 * gated (re-shows if not shown in the last 45 min, even if completed), plus an
 * `aa:open-setup` window event / header button forces it open, plus it polls the /vdi
 * gate's "latest access" signal to auto-open for each fresh self-serve viewer.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, ArrowRight, ArrowLeft, Check, Loader2, Sparkles,
  Landmark, Globe2, CreditCard, HeartPulse, Building2, ListChecks, X,
  Ban, ScanSearch, Boxes, Server, Bug, ShieldAlert, KeyRound,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

const ACCENT = '#6D4AFF';
const SHOWN_KEY = 'aa_setup_shown_at';
const FRAMEWORKS_KEY = 'aa_governance_frameworks';
const CONFIG_KEY = 'aa_governance_config';        // full persisted posture (all selections)
const COMPLETED_KEY = 'aa_governance_completed';   // ISO timestamp when setup was completed
const REDISPLAY_MS = 45 * 60 * 1000; // 45 minutes

// Self-serve auto-trigger: the /vdi gate records each OTP-verified viewer; the wizard
// polls this signal and opens for each fresh viewer (no presenter needed).
const ACCESS_ENDPOINT = 'https://apexastute.com/api/demo-access/latest';
const ACCESS_SEEN_KEY = 'aa_last_access_seen';
const ACCESS_POLL_MS = 20000;

// Step model. 1..5 are the config screens; 6 provisions; 7 is done.
const STEP_WELCOME = 0, STEP_FRAMEWORKS = 1, STEP_CONTENT = 2, STEP_APPS = 3,
  STEP_PRIVATE = 4, STEP_PROFILES = 5, STEP_PROVISION = 6, STEP_DONE = 7;
const CONFIG_STEPS = [STEP_FRAMEWORKS, STEP_CONTENT, STEP_APPS, STEP_PRIVATE, STEP_PROFILES];

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

const DENY_CATS = [
  'Malware & Phishing', 'Newly-registered domains', 'Command & Control', 'Anonymizers / Proxies',
  'Cryptomining', 'Adult content', 'Gambling', 'P2P / Torrents', 'Remote-access tools', 'Unrated / Unknown',
];
const DPI_LEVELS = [
  { id: 'meta',    name: 'Metadata only',      desc: 'IP / port / volume — no payload' },
  { id: 'sni',     name: 'SNI + certificate',  desc: 'Domain visibility, no decryption' },
  { id: 'tls',     name: 'Full TLS inspection', desc: 'Decrypt & inspect via the signing CA' },
  { id: 'tls-dlp', name: 'Full + file / DLP',  desc: 'TLS + file reconstruction & DLP' },
];
const SANCTIONED = [
  'Microsoft 365', 'Google Workspace', 'Salesforce', 'GitHub', 'Slack', 'Zoom',
  'ChatGPT Enterprise', 'Claude', 'Atlassian', 'Box', 'Notion', 'Perplexity',
];
const DISCOVERED_APPS = [
  { id: 'aws-rdp',    name: 'AWS Windows server', proto: 'RDP' },
  { id: 'wsl-ssh',    name: 'Ubuntu (WSL)',       proto: 'SSH' },
  { id: 'legacy-web', name: 'Legacy web service', proto: 'HTTP' },
];
const IDS_PROFILES = [
  { id: 'balanced', name: 'Balanced',     desc: 'Block high/critical; alert medium' },
  { id: 'strict',   name: 'Strict',       desc: 'Block medium+; WAF virtual-patching' },
  { id: 'monitor',  name: 'Monitor-only', desc: 'Alert, do not block' },
];
const AV_PROFILES = [
  { id: 'cloud',  name: 'Cloud AV',  desc: 'Inline scan + sandbox detonation' },
  { id: 'strict', name: 'Strict',    desc: 'Block on suspicion; quarantine' },
  { id: 'off',    name: 'Off',       desc: 'No outbound AV (not recommended)' },
];

export function FirstTimeSetup() {
  const { user, accessToken } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(STEP_WELCOME);
  const [provisionIdx, setProvisionIdx] = useState(0);

  // selections
  const [selected, setSelected] = useState<string[]>(['nist-800-53', 'iso-27001', 'soc2']);
  const [denyCats, setDenyCats] = useState<string[]>(['Malware & Phishing', 'Newly-registered domains', 'Command & Control', 'Anonymizers / Proxies', 'Cryptomining']);
  const [dpi, setDpi] = useState('tls');
  const [sanctioned, setSanctioned] = useState<string[]>(['Microsoft 365', 'GitHub', 'Slack', 'Claude']);
  const [tenantId, setTenantId] = useState('');
  const [discovered, setDiscovered] = useState<string[]>(DISCOVERED_APPS.map(a => a.id));
  const [ids, setIds] = useState('balanced');
  const [av, setAv] = useState('cloud');
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  // Load any previously-saved posture so a returning admin sees their real config.
  const applyPersisted = useCallback(() => {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const c = JSON.parse(raw) as Record<string, unknown>;
        if (Array.isArray(c.selected)) setSelected(c.selected as string[]);
        if (Array.isArray(c.denyCats)) setDenyCats(c.denyCats as string[]);
        if (typeof c.dpi === 'string') setDpi(c.dpi);
        if (Array.isArray(c.sanctioned)) setSanctioned(c.sanctioned as string[]);
        if (typeof c.tenantId === 'string' && c.tenantId) setTenantId(c.tenantId);
        if (Array.isArray(c.discovered)) setDiscovered(c.discovered as string[]);
        if (typeof c.ids === 'string') setIds(c.ids);
        if (typeof c.av === 'string') setAv(c.av);
      }
      setCompletedAt(localStorage.getItem(COMPLETED_KEY));
    } catch { /* ignore */ }
  }, []);

  const openNow = useCallback(() => {
    applyPersisted();
    setStep(STEP_WELCOME); setProvisionIdx(0); setOpen(true);
    try { localStorage.setItem(SHOWN_KEY, String(Date.now())); } catch { /* private mode */ }
  }, [applyPersisted]);

  // Prefill tenant ID from the signed-in session if available.
  useEffect(() => {
    const t = (user as { tenant_id?: string; org_id?: string } | null)?.tenant_id
      || (user as { tenant_id?: string; org_id?: string } | null)?.org_id;
    if (t && !tenantId) setTenantId(t);
  }, [user, tenantId]);

  // Auto-open: always show until the admin COMPLETES setup; once completed, re-show only
  // on the 45-min demo timer (pre-filled + closable) so each fresh CIO/CISO session gets
  // the experience without nagging a returning admin.
  useEffect(() => {
    if (!accessToken) return;
    let completed: string | null = null, last = 0;
    try { completed = localStorage.getItem(COMPLETED_KEY); last = Number(localStorage.getItem(SHOWN_KEY) || 0); } catch { /* ignore */ }
    if (!completed) { openNow(); return; }
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

  const chosen = FRAMEWORKS.filter(f => selected.includes(f.id));
  const provisionTasks = [
    `Mapping ${chosen.length} governance framework${chosen.length === 1 ? '' : 's'}`,
    `Enabling ${denyCats.length} DNS / URL deny categories`,
    `Setting DPI depth — ${DPI_LEVELS.find(d => d.id === dpi)?.name}`,
    `Sanctioning ${sanctioned.length} apps & AI services`,
    `Wiring private connector — ${discovered.length} discovered app${discovered.length === 1 ? '' : 's'}`,
    `Loading IDS / IPS / WAF — ${IDS_PROFILES.find(p => p.id === ids)?.name}`,
    `Enabling outbound AV — ${AV_PROFILES.find(p => p.id === av)?.name}`,
  ];

  // Provisioning animation → advances through the tasks, then to "done".
  useEffect(() => {
    if (step !== STEP_PROVISION) return;
    if (provisionIdx >= provisionTasks.length) { const t = setTimeout(() => setStep(STEP_DONE), 500); return () => clearTimeout(t); }
    const t = setTimeout(() => setProvisionIdx(i => i + 1), 620);
    return () => clearTimeout(t);
  }, [step, provisionIdx, provisionTasks.length]);

  if (!open || !accessToken) return null;

  const toggle = (arr: string[], set: (v: string[]) => void, id: string) =>
    set(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

  const finish = () => {
    const config = { selected, denyCats, dpi, sanctioned, tenantId, discovered, ids, av };
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      localStorage.setItem(FRAMEWORKS_KEY, JSON.stringify(selected));
      localStorage.setItem(COMPLETED_KEY, new Date().toISOString());
    } catch { /* ignore */ }
    setOpen(false);
  };

  const firstName = (user?.name || user?.email || 'there').split(/[ @]/)[0];
  const configIdx = CONFIG_STEPS.indexOf(step); // 0-based within the config screens

  // ── small render helpers ───────────────────────────────────────────────────
  const chip = (label: string, on: boolean, onClick: () => void) => (
    <button key={label} onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-[12.5px] transition-all"
      style={{ background: on ? 'rgba(109,74,255,0.12)' : 'rgba(255,255,255,0.02)', borderColor: on ? 'rgba(109,74,255,0.5)' : 'rgba(255,255,255,0.08)', color: on ? '#e7e3ff' : '#9aa0b5' }}>
      <span className="w-4 h-4 rounded flex items-center justify-center border flex-shrink-0"
        style={{ background: on ? ACCENT : 'transparent', borderColor: on ? ACCENT : 'rgba(255,255,255,0.2)' }}>
        {on && <Check size={11} className="text-white" />}
      </span>
      {label}
    </button>
  );
  const radio = (opts: { id: string; name: string; desc: string }[], val: string, set: (v: string) => void) => (
    <div className="space-y-2">
      {opts.map(o => {
        const on = val === o.id;
        return (
          <button key={o.id} onClick={() => set(o.id)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all"
            style={{ background: on ? 'rgba(109,74,255,0.1)' : 'rgba(255,255,255,0.02)', borderColor: on ? 'rgba(109,74,255,0.5)' : 'rgba(255,255,255,0.08)' }}>
            <span className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0" style={{ borderColor: on ? ACCENT : 'rgba(255,255,255,0.25)' }}>
              {on && <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-gray-100">{o.name}</span>
              <span className="block text-[11px] text-gray-500">{o.desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
  const navRow = (back: number, next: number, nextLabel: string, nextDisabled = false) => (
    <div className="flex items-center justify-between mt-6">
      <button onClick={() => setStep(back)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300"><ArrowLeft size={15} /> Back</button>
      <button onClick={() => setStep(next)} disabled={nextDisabled}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all"
        style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}>
        {nextLabel} <ArrowRight size={15} />
      </button>
    </div>
  );
  const sectionHead = (Icon: typeof Ban, title: string, sub: string) => (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><Icon size={18} style={{ color: ACCENT }} /> {title}</h2>
      <p className="text-sm text-gray-500">{sub}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(6,4,20,0.72)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-2xl rounded-2xl border overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(180deg,#141033,#0e0a24)', borderColor: 'rgba(109,74,255,0.25)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5">
          <span className="inline-flex items-center gap-2 text-white font-semibold" style={{ fontFamily: "'Outfit',sans-serif" }}>
            <ShieldCheck size={20} style={{ color: ACCENT }} /> Apex <span style={{ color: ACCENT }}>Aegis</span>
            <span className="ml-2 text-[11px] uppercase tracking-wider text-gray-500">First-time setup</span>
          </span>
          {step < STEP_PROVISION && (
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300" aria-label="Skip for now"><X size={18} /></button>
          )}
        </div>

        {/* Progress bar (config screens only) */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-wider text-gray-500">
              {configIdx >= 0 ? `Step ${configIdx + 1} of ${CONFIG_STEPS.length}` : step >= STEP_PROVISION ? 'Applying' : 'Welcome'}
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((Math.min(step, STEP_PROVISION) / STEP_PROVISION) * 100)}%`, background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }} />
          </div>
        </div>

        <div className="px-6 py-6 min-h-[360px]">
          {/* ── 0 · Welcome ── */}
          {step === STEP_WELCOME && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(109,74,255,0.12)', border: '1px solid rgba(109,74,255,0.3)' }}>
                <Sparkles size={30} style={{ color: ACCENT }} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome, {firstName}.</h1>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                Let&apos;s stand up your ApexAegis posture — governance frameworks, content controls, inspection depth,
                sanctioned apps &amp; AI, private access, and your IDS/IPS/WAF + AV profiles. The console configures itself around your choices.
              </p>
              {completedAt && (
                <div className="mt-5 mx-auto max-w-md px-4 py-2.5 rounded-xl text-[12.5px] flex items-center gap-2 justify-center"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }}>
                  <Check size={14} /> Setup already completed on {new Date(completedAt).toLocaleDateString()} — review your posture or close.
                </div>
              )}
              <button onClick={() => setStep(STEP_FRAMEWORKS)}
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all"
                style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}>
                {completedAt ? 'Review posture' : 'Get started'} <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── 1 · Frameworks ── */}
          {step === STEP_FRAMEWORKS && (
            <div>
              {sectionHead(ShieldCheck, 'Governance frameworks', "Select every standard you're held to — dashboards, controls and reports map to these.")}
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
              {navRow(STEP_WELCOME, STEP_CONTENT, `Continue (${selected.length})`, selected.length === 0)}
            </div>
          )}

          {/* ── 2 · Content & inspection ── */}
          {step === STEP_CONTENT && (
            <div>
              {sectionHead(Ban, 'Content controls & inspection', 'Deny risky DNS/URL categories and set how deep the gateway inspects traffic.')}
              <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">DNS / URL categories to deny</div>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {DENY_CATS.map(c => chip(c, denyCats.includes(c), () => toggle(denyCats, setDenyCats, c)))}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5"><ScanSearch size={13} /> Deep-packet / SSL inspection</div>
              {radio(DPI_LEVELS, dpi, setDpi)}
              {navRow(STEP_FRAMEWORKS, STEP_APPS, 'Continue')}
            </div>
          )}

          {/* ── 3 · Sanctioned apps & AI ── */}
          {step === STEP_APPS && (
            <div>
              {sectionHead(Boxes, 'Sanctioned apps & AI', 'Approve the SaaS and AI services your org allows. Everything else is treated as Shadow-IT and risk-scored.')}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SANCTIONED.map(a => chip(a, sanctioned.includes(a), () => toggle(sanctioned, setSanctioned, a)))}
              </div>
              {navRow(STEP_CONTENT, STEP_PRIVATE, `Continue (${sanctioned.length})`)}
            </div>
          )}

          {/* ── 4 · Private access ── */}
          {step === STEP_PRIVATE && (
            <div>
              {sectionHead(Server, 'Private access', 'Bind your tenant, confirm the connector you deployed, and pick the private apps it discovered.')}
              <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5"><KeyRound size={13} /> Tenant ID</div>
              <input value={tenantId} onChange={e => setTenantId(e.target.value)} placeholder="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
                className="w-full mb-4 px-3.5 py-2.5 rounded-xl text-sm text-gray-100 border outline-none font-mono"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }} />
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border mb-4"
                style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.3)' }}>
                <Check size={15} className="text-green-400" />
                <span className="text-[12.5px] text-green-200">Connector <span className="font-mono">hyd-connector-01</span> detected &amp; healthy</span>
                <span className="ml-auto text-[10.5px] text-green-500/70">SDP · online</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Discovered private apps</div>
              <div className="space-y-2">
                {DISCOVERED_APPS.map(a => {
                  const on = discovered.includes(a.id);
                  return (
                    <button key={a.id} onClick={() => toggle(discovered, setDiscovered, a.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all"
                      style={{ background: on ? 'rgba(109,74,255,0.1)' : 'rgba(255,255,255,0.02)', borderColor: on ? 'rgba(109,74,255,0.5)' : 'rgba(255,255,255,0.08)' }}>
                      <span className="flex-1"><span className="text-sm font-medium text-gray-100">{a.name}</span></span>
                      <span className="text-[10.5px] px-1.5 py-0.5 rounded border font-mono" style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#9aa0b5' }}>{a.proto}</span>
                      <span className="w-5 h-5 rounded-md flex items-center justify-center border" style={{ background: on ? ACCENT : 'transparent', borderColor: on ? ACCENT : 'rgba(255,255,255,0.2)' }}>{on && <Check size={13} className="text-white" />}</span>
                    </button>
                  );
                })}
              </div>
              {navRow(STEP_APPS, STEP_PROFILES, 'Continue')}
            </div>
          )}

          {/* ── 5 · Protection profiles ── */}
          {step === STEP_PROFILES && (
            <div>
              {sectionHead(ShieldAlert, 'Protection profiles', 'Choose enforcement for private access (IDS/IPS/WAF) and outbound internet (AV).')}
              <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5"><Bug size={13} /> IDS / IPS / WAF (private access)</div>
              <div className="mb-4">{radio(IDS_PROFILES, ids, setIds)}</div>
              <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5"><ShieldCheck size={13} /> Antivirus (outbound internet)</div>
              {radio(AV_PROFILES, av, setAv)}
              <div className="flex items-center justify-between mt-6">
                <button onClick={() => setStep(STEP_PRIVATE)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300"><ArrowLeft size={15} /> Back</button>
                <button onClick={() => { setProvisionIdx(0); setStep(STEP_PROVISION); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                  style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}>
                  Submit &amp; configure <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── 6 · Provisioning ── */}
          {step === STEP_PROVISION && (
            <div className="py-4">
              <h2 className="text-lg font-bold text-white mb-1">Configuring your workspace…</h2>
              <p className="text-sm text-gray-500 mb-5">Applying your governance posture across the control plane.</p>
              <div className="space-y-2.5 max-w-md mx-auto">
                {provisionTasks.map((t, i) => {
                  const done = i < provisionIdx; const active = i === provisionIdx;
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border"
                      style={{ background: done ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)', borderColor: done ? 'rgba(34,197,94,0.3)' : active ? 'rgba(109,74,255,0.4)' : 'rgba(255,255,255,0.06)' }}>
                      {done ? <Check size={16} className="text-green-400" /> : active ? <Loader2 size={16} className="animate-spin" style={{ color: ACCENT }} /> : <span className="w-4 h-4 rounded-full border border-gray-700" />}
                      <span className={`text-sm ${done ? 'text-green-300' : active ? 'text-gray-200' : 'text-gray-600'}`}>{t}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 7 · Done ── */}
          {step === STEP_DONE && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <Check size={32} className="text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Your workspace is ready.</h1>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                {chosen.length} framework{chosen.length === 1 ? '' : 's'} · {denyCats.length} deny categories · {DPI_LEVELS.find(d => d.id === dpi)?.name} inspection ·
                {' '}{sanctioned.length} sanctioned apps · {discovered.length} private apps · {IDS_PROFILES.find(p => p.id === ids)?.name} IDS/IPS/WAF · {AV_PROFILES.find(p => p.id === av)?.name} AV.
                Your console is now tailored to this posture.
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
