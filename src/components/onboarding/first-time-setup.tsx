'use client';

/**
 * ApexAegis First-Time Setup Wizard
 * Configures:
 * 1. Governance & Regulatory Frameworks
 * 2. IdP Onboarding & SCIM Directory Sync (Entra, Okta, Ping, Google)
 * 3. Autonomous AI vs. Human Disambiguation & RCE Defense
 * 4. Software Supply Chain & LLM Discrepancy Quarantine Sandbox
 * 5. 0-100 Continuous Adaptive Trust & Dynamic Enforcement
 * 6. Top Sanctioned SaaS & Agentic AI App Catalog
 * 7. Predictive QoE & Local Physical NIC Optimization
 * 8. Sovereign Micro-Cells, ITDR Ingestion & Private In-Country Hiero aBFT Ledger
 */

import { useState, useEffect, useCallback } from 'react';
import {
  type LucideIcon,
  ShieldCheck, ArrowRight, ArrowLeft, Check, Loader2, Sparkles,
  Landmark, Globe2, CreditCard, HeartPulse, Building2, ListChecks, X,
  Activity, Sliders, Database, Network, Zap, MapPin, Lock, Server, Cpu,
  Fingerprint, FileText, Download, Bot, Box, ShieldAlert
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { SetupTypeStep } from './setup-type-step';
import { TenantLookupStep, type TenantLookupResult } from './tenant-lookup-step';
import { SaaSRestrictionStep, type SaaSAccessConfig } from './saas-restriction-step';
import { MigrationSourceStep, type MigrationConfig } from './migration-source-step';

const ACCENT = '#6D4AFF';
const CONFIG_KEY = 'aa_governance_config';
const COMPLETED_KEY = 'aa_governance_completed';

// Wizard Step Sequence
const STEP_WELCOME = 0;
const STEP_SETUP_TYPE = 1;
const STEP_TENANT_LOOKUP = 2;
const STEP_FRAMEWORKS = 3;
const STEP_IDP_ONBOARDING = 4;
const STEP_AGENTIC_DEFENSE = 5;
const STEP_SUPPLY_CHAIN_SANDBOX = 6;
const STEP_RISK_TAXONOMY = 7;
const STEP_APPS_DISCOVERY = 8;
const STEP_SAAS_RESTRICTION = 9;
const STEP_QOE_NIC = 10;
const STEP_INLINE_PROXY_CERT = 11;
const STEP_SOVEREIGN_CELL = 12;
const STEP_MIGRATION_SOURCE = 13;
const STEP_PROVISION = 14;
const STEP_DONE = 15;

const CONFIG_STEPS = [
  STEP_FRAMEWORKS,
  STEP_IDP_ONBOARDING,
  STEP_AGENTIC_DEFENSE,
  STEP_SUPPLY_CHAIN_SANDBOX,
  STEP_RISK_TAXONOMY,
  STEP_APPS_DISCOVERY,
  STEP_SAAS_RESTRICTION,
  STEP_QOE_NIC,
  STEP_INLINE_PROXY_CERT,
  STEP_SOVEREIGN_CELL
];

interface Framework {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
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

const IDP_PROVIDERS = [
  { id: 'entra', name: 'Microsoft Entra ID (Azure AD)', desc: 'OIDC / SAML 2.0 + SCIM 2.0 Graph API Sync' },
  { id: 'okta',  name: 'Okta Identity Cloud',          desc: 'Universal Directory + Push SCIM Groups' },
  { id: 'ping',  name: 'PingFederate / PingOne',       desc: 'Enterprise SAML 2.0 Bridge & NHI Scopes' },
  { id: 'google',name: 'Google Workspace',             desc: 'Secure Web Identity & Workspace Directory' },
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

const TELEMETRY_PARTNERS = [
  { id: 'crowdstrike', name: 'CrowdStrike Falcon', type: 'EDR / ITDR Webhook' },
  { id: 'defender',    name: 'Microsoft Defender XDR', type: 'Graph Security API' },
  { id: 'sentinelone', name: 'SentinelOne Singularity', type: 'Cloud-to-Cloud API' },
  { id: 'splunk',      name: 'Splunk / HEC Streaming', type: 'HTTP Event Collector' },
];

export function FirstTimeSetup() {
  const { user, accessToken } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(STEP_WELCOME);
  const [provisionIdx, setProvisionIdx] = useState(0);

  // Core Configuration States
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['nist-800-53', 'iso-27001', 'soc2']);
  const [selectedIdp, setSelectedIdp] = useState('entra');
  const [idpIssuerUrl, setIdpIssuerUrl] = useState('');
  const [idpClientId, setIdpClientId] = useState('');
  const [idpClientSecret, setIdpClientSecret] = useState('');

  // Agentic AI vs Human States
  const [agentIsolationMode, setAgentIsolationMode] = useState<'strict_rce_block' | 'adaptive_stepup' | 'monitor'>('strict_rce_block');
  const [agentPromptDlp, setAgentPromptDlp] = useState(true);
  const [agentTerminalGating, setAgentTerminalGating] = useState(true);

  // Supply Chain & LLM Discrepancy States
  const [sandboxQuarantineMode, setSandboxQuarantineMode] = useState<'llm_discrepancy' | 'strict_90_days' | 'hybrid_instant'>('llm_discrepancy');
  const [quarantineObservationDays, setQuarantineObservationDays] = useState('90');

  // Risk, SaaS & QoE
  const [riskSensitivity, setRiskSensitivity] = useState<'strict' | 'balanced' | 'adaptive'>('adaptive');
  const [sanctionedApps, setSanctionedApps] = useState<string[]>(['Microsoft 365', 'GitHub Enterprise', 'ChatGPT Enterprise', 'Slack Enterprise']);
  const [qoeOptimization, setQoeOptimization] = useState(true);
  const [nicBackoffThreshold, setNicBackoffThreshold] = useState('80');

  // Sovereign & Ledger
  const [sovereignRegion, setSovereignRegion] = useState('in-ap-south-1');
  const [geofenceEnforcement, setGeofenceEnforcement] = useState<'strict_hw' | 'bgp_path' | 'permissive'>('strict_hw');
  const [enablePrivateHiero, setEnablePrivateHiero] = useState(true);
  const [logRetentionPeriod, setLogRetentionPeriod] = useState('180-days');
  const [selectedTelemetryPartner, setSelectedTelemetryPartner] = useState('crowdstrike');
  const [webhookUrl] = useState('https://ingest.apexaegis.app/v1/telemetry/wh_live_9f82d018c');

  // Inline Proxy MITM Signing Certificate
  const [proxyCertMode, setProxyCertMode] = useState<'generate' | 'upload'>('generate');
  const [proxyCertFile, setProxyCertFile] = useState<File | null>(null);
  const [proxyKeyFile, setProxyKeyFile] = useState<File | null>(null);
  const [proxyCaFile, setProxyCaFile] = useState<File | null>(null);
  const [proxyCertCn, setProxyCertCn] = useState('apexaegis-inline-proxy');
  const [proxyCertOrg, setProxyCertOrg] = useState('ApexAegis');
  const [proxyCertExpiry, setProxyCertExpiry] = useState('365');
  const [proxyCertGenerated, setProxyCertGenerated] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  // New wizard states: Setup Type, Tenant Lookup, SaaS Restriction
  const [setupType, setSetupType] = useState<'new' | 'migration' | null>(null);
  const [tenantData, setTenantData] = useState<TenantLookupResult | null>(null);
  const [saasConfig, setSaaSConfig] = useState<SaaSAccessConfig | null>(null);
  const [migrationConfig, setMigrationConfig] = useState<MigrationConfig | null>(null);

  const applyPersisted = useCallback(() => {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const c = JSON.parse(raw) as Record<string, unknown>;
        if (Array.isArray(c.selectedFrameworks)) setSelectedFrameworks(c.selectedFrameworks as string[]);
        if (typeof c.selectedIdp === 'string') setSelectedIdp(c.selectedIdp);
        if (typeof c.idpIssuerUrl === 'string') setIdpIssuerUrl(c.idpIssuerUrl);
        if (typeof c.idpClientId === 'string') setIdpClientId(c.idpClientId);
        if (typeof c.agentIsolationMode === 'string') setAgentIsolationMode(c.agentIsolationMode as 'strict_rce_block' | 'adaptive_stepup' | 'monitor');
        if (typeof c.agentPromptDlp === 'boolean') setAgentPromptDlp(c.agentPromptDlp);
        if (typeof c.agentTerminalGating === 'boolean') setAgentTerminalGating(c.agentTerminalGating);
        if (typeof c.sandboxQuarantineMode === 'string') setSandboxQuarantineMode(c.sandboxQuarantineMode as 'llm_discrepancy' | 'strict_90_days' | 'hybrid_instant');
        if (typeof c.quarantineObservationDays === 'string') setQuarantineObservationDays(c.quarantineObservationDays);
        if (typeof c.riskSensitivity === 'string') setRiskSensitivity(c.riskSensitivity as 'strict' | 'balanced' | 'adaptive');
        if (Array.isArray(c.sanctionedApps)) setSanctionedApps(c.sanctionedApps as string[]);
        if (typeof c.qoeOptimization === 'boolean') setQoeOptimization(c.qoeOptimization);
        if (typeof c.nicBackoffThreshold === 'string') setNicBackoffThreshold(c.nicBackoffThreshold);
        if (typeof c.sovereignRegion === 'string') setSovereignRegion(c.sovereignRegion);
        if (typeof c.geofenceEnforcement === 'string') setGeofenceEnforcement(c.geofenceEnforcement as 'strict_hw' | 'bgp_path' | 'permissive');
        if (typeof c.enablePrivateHiero === 'boolean') setEnablePrivateHiero(c.enablePrivateHiero);
        if (typeof c.logRetentionPeriod === 'string') setLogRetentionPeriod(c.logRetentionPeriod);
        if (typeof c.proxyCertMode === 'string') setProxyCertMode(c.proxyCertMode as 'generate' | 'upload');
        if (typeof c.proxyCertCn === 'string') setProxyCertCn(c.proxyCertCn);
        if (typeof c.proxyCertOrg === 'string') setProxyCertOrg(c.proxyCertOrg);
        if (typeof c.proxyCertExpiry === 'string') setProxyCertExpiry(c.proxyCertExpiry);
        if (typeof c.proxyCertGenerated === 'boolean') setProxyCertGenerated(c.proxyCertGenerated);
      }
      const done = localStorage.getItem(COMPLETED_KEY);
      setCompletedAt(done);
      return done;
    } catch {
      return null;
    }
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
    `Binding IdP Connector (${IDP_PROVIDERS.find(i => i.id === selectedIdp)?.name}) & SCIM Directory`,
    `Arming Autonomous Agent RCE Prevention & Shell Jail Engine (${agentIsolationMode})`,
    `Deploying LLM Discrepancy Analysis & Supply Chain Sandbox (${quarantineObservationDays}-day gate)`,
    `Initializing Continuous Adaptive Trust engine (0-100 Sensitivity: ${riskSensitivity})`,
    `Governing ${sanctionedApps.length} sanctioned apps with NHI & OAuth boundaries`,
    `Configuring Predictive QoE NIC contention back-off (> ${nicBackoffThreshold}% utilization)`,
    `${proxyCertGenerated ? 'Uploading' : 'Generating'} inline proxy MITM signing certificate (${proxyCertCn})`,
    `Isolating Sovereign Cell in ${SOVEREIGN_CELL_REGIONS.find(r => r.id === sovereignRegion)?.name}`,
    `Deploying In-Country Private Hiero aBFT Nodes & S3 WORM (${logRetentionPeriod})`,
  ];

  useEffect(() => {
    if (step !== STEP_PROVISION) return;
    if (provisionIdx >= provisionTasks.length) {
      const t = setTimeout(() => setStep(STEP_DONE), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setProvisionIdx(i => i + 1), 580);
    return () => clearTimeout(t);
  }, [step, provisionIdx, provisionTasks.length]);

  if (!open || !accessToken) return null;

  const toggleArray = (arr: string[], setFn: (v: string[]) => void, id: string) =>
    setFn(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

  const finish = () => {
    const config = {
      setupType,
      tenantData,
      saasConfig,
      migrationConfig,
      selectedFrameworks,
      selectedIdp,
      idpIssuerUrl,
      idpClientId,
      agentIsolationMode,
      agentPromptDlp,
      agentTerminalGating,
      sandboxQuarantineMode,
      quarantineObservationDays,
      riskSensitivity,
      sanctionedApps,
      qoeOptimization,
      nicBackoffThreshold,
      sovereignRegion,
      geofenceEnforcement,
      enablePrivateHiero,
      logRetentionPeriod,
      proxyCertMode,
      proxyCertCn,
      proxyCertOrg,
      proxyCertExpiry,
      proxyCertGenerated,
    };
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      const nowIso = new Date().toISOString();
      localStorage.setItem(COMPLETED_KEY, nowIso);
      setCompletedAt(nowIso);
    } catch { /* ignore */ }
    setOpen(false);
  };

  const configIdx = CONFIG_STEPS.indexOf(step);
  const firstName = (user?.name || user?.email || 'Admin').split(/[ @]/)[0];

  const sectionHead = (Icon: LucideIcon, title: string, sub: string) => (
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

        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5">
          <span className="inline-flex items-center gap-2 text-white font-semibold tracking-wide">
            <ShieldCheck size={20} style={{ color: ACCENT }} /> Apex <span style={{ color: ACCENT }}>Aegis</span>
            <span className="ml-2 text-[11px] uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-0.5 rounded">
              {completedAt ? 'Security Posture Configured' : 'Zero Trust Onboarding'}
            </span>
          </span>
          {completedAt && step !== STEP_PROVISION && (
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Dynamic Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-wider text-gray-500">
              {configIdx >= 0 ? `Step ${configIdx + 1} of ${CONFIG_STEPS.length}` : step >= STEP_PROVISION ? 'Applying Changes' : 'Welcome'}
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
          {/* ── 0 · Welcome Screen ── */}
          {step === STEP_WELCOME && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border"
                style={{ background: 'rgba(109,74,255,0.12)', borderColor: 'rgba(109,74,255,0.3)' }}>
                <Sparkles size={30} style={{ color: ACCENT }} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome to ApexAegis, {firstName}.</h1>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                Initialize your Zero Trust posture: governance frameworks, IdP sync, Agentic AI vs. Human RCE isolation, software supply chain LLM discrepancy sandbox, predictive QoE, and in-country sovereign ledger governance.
              </p>

              {completedAt && (
                <div className="mt-5 mx-auto max-w-md px-4 py-2.5 rounded-xl text-[12.5px] flex items-center gap-2 justify-center"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }}>
                  <Check size={14} /> Posture active since {new Date(completedAt).toLocaleDateString()} at {new Date(completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                </div>
              )}

              <div className="mt-8 flex items-center justify-center gap-3">
                {completedAt && (
                  <button
                    onClick={() => setOpen(false)}
                    className="px-5 py-3 rounded-xl text-sm font-medium text-gray-300 border border-white/10 hover:bg-white/5 transition-all"
                  >
                    Enter Console Directly
                  </button>
                )}
                <button
                  onClick={() => setStep(STEP_SETUP_TYPE)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all shadow-lg"
                  style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}
                >
                  {completedAt ? 'Review & Edit Configuration' : 'Launch Posture Setup'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── 1 · Setup Type ── */}
          {step === STEP_SETUP_TYPE && (
            <SetupTypeStep
              onSelect={(type) => {
                setSetupType(type);
                if (type === 'new') setStep(STEP_TENANT_LOOKUP);
                else setStep(STEP_MIGRATION_SOURCE);
              }}
              onBack={() => setStep(STEP_WELCOME)}
            />
          )}

          {/* ── 2 · Tenant Lookup (New Setup only) ── */}
          {step === STEP_TENANT_LOOKUP && (
            <TenantLookupStep
              onNext={(data) => {
                setTenantData(data);
                setStep(STEP_FRAMEWORKS);
              }}
              onBack={() => setStep(STEP_SETUP_TYPE)}
            />
          )}

          {/* ── Migration Source (Migration only) ── */}
          {step === STEP_MIGRATION_SOURCE && (
            <MigrationSourceStep
              onNext={(data) => {
                setMigrationConfig(data);
                setStep(STEP_PROVISION);
              }}
              onBack={() => setStep(STEP_SETUP_TYPE)}
            />
          )}

          {/* ── 1 · Governance Frameworks ── */}
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
              {navRow(setupType === 'new' ? STEP_TENANT_LOOKUP : STEP_SETUP_TYPE, STEP_IDP_ONBOARDING, `Continue (${selectedFrameworks.length} Selected)`, selectedFrameworks.length === 0)}
            </div>
          )}

          {/* ── 2 · IdP Onboarding ── */}
          {step === STEP_IDP_ONBOARDING && (
            <div>
              {sectionHead(Fingerprint, 'Identity Provider (IdP) & SCIM Onboarding', 'Bind your enterprise identity provider for single sign-on, non-human identity (NHI) delegation, and directory sync.')}
              
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {IDP_PROVIDERS.map(idp => {
                  const on = selectedIdp === idp.id;
                  return (
                    <button key={idp.id} onClick={() => setSelectedIdp(idp.id)}
                      className="p-3 rounded-xl border text-left transition-all"
                      style={{ background: on ? 'rgba(109,74,255,0.12)' : 'rgba(255,255,255,0.02)', borderColor: on ? 'rgba(109,74,255,0.5)' : 'rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-100">{idp.name}</span>
                        {on && <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />}
                      </div>
                      <span className="block text-[10.5px] text-gray-400 leading-tight">{idp.desc}</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1">IdP Issuer URL / Domain Endpoint</label>
                  <input
                    value={idpIssuerUrl}
                    onChange={e => setIdpIssuerUrl(e.target.value)}
                    placeholder={selectedIdp === 'entra' ? 'https://login.microsoftonline.com/{tenant-id}/v2.0' : 'https://your-org.okta.com'}
                    className="w-full px-3.5 py-2 rounded-lg text-xs font-mono text-white bg-black/40 border border-white/10 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1">Application (Client) ID</label>
                    <input
                      value={idpClientId}
                      onChange={e => setIdpClientId(e.target.value)}
                      placeholder="client-app-id-guid"
                      className="w-full px-3.5 py-2 rounded-lg text-xs font-mono text-white bg-black/40 border border-white/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1">Client Secret</label>
                    <input
                      type="password"
                      value={idpClientSecret}
                      onChange={e => setIdpClientSecret(e.target.value)}
                      placeholder="••••••••••••••••••••••••"
                      className="w-full px-3.5 py-2 rounded-lg text-xs font-mono text-white bg-black/40 border border-white/10 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-gray-300 text-xs">
                  <FileText size={14} style={{ color: ACCENT }} />
                  <span>Step-by-Step {IDP_PROVIDERS.find(i => i.id === selectedIdp)?.name} Integration Guide</span>
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Downloading ApexAegis_${selectedIdp.toUpperCase()}_Integration_Guide.pdf`)}
                  className="inline-flex items-center gap-1.5 text-[11px] text-purple-300 hover:text-purple-200"
                >
                  <Download size={12} /> Download PDF Guide
                </button>
              </div>

              {navRow(STEP_FRAMEWORKS, STEP_AGENTIC_DEFENSE, 'Continue to Agentic Defense')}
            </div>
          )}

          {/* ── 3 · Autonomous AI vs Human & RCE Prevention ── */}
          {step === STEP_AGENTIC_DEFENSE && (
            <div>
              {sectionHead(Bot, 'Autonomous AI Operation vs. Human Activity & RCE Defense', 'Classify non-human identity (NHI) telemetry, isolate autonomous agent sessions, and prevent Remote Code Execution (RCE) shell escapes.')}
              
              <div className="space-y-3 mb-5">
                {[
                  {
                    id: 'strict_rce_block',
                    name: 'Strict Jail & Deterministic RCE Blocking (Recommended)',
                    desc: 'Differentiates AI agent tokens from interactive human keystrokes. Blocks child process spawning (bash/cmd), unapproved terminal execs, and direct socket calls from agentic workflows.'
                  },
                  {
                    id: 'adaptive_stepup',
                    name: 'Adaptive Agentic Step-Up & Dual Authorization',
                    desc: 'Allows autonomous agents to perform routine read/query actions; mandates human FIDO2 cryptographic sign-off for mutating code changes, database writes, or outbound shell execution.'
                  },
                  {
                    id: 'monitor',
                    name: 'Audit & Behavioral Profiling Mode',
                    desc: 'Continuously logs AI agent execution lineages and calculates discrepancy scores without enforcing real-time micro-isolation.'
                  }
                ].map(opt => {
                  const on = agentIsolationMode === opt.id;
                  return (
                    <button key={opt.id} onClick={() => setAgentIsolationMode(opt.id as 'strict_rce_block' | 'adaptive_stepup' | 'monitor')}
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

              <div className="space-y-2.5 bg-white/5 p-3.5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-medium text-gray-200">Terminal & Subprocess Gating</span>
                    <span className="block text-[11px] text-gray-400">Jails autonomous coding assistants (Claude Code, Devin, Cursor) from executing unvetted local binaries.</span>
                  </div>
                  <input type="checkbox" checked={agentTerminalGating} onChange={e => setAgentTerminalGating(e.target.checked)} className="w-4 h-4 accent-purple-600" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <span className="block text-xs font-medium text-gray-200">Non-Human Identity (NHI) Prompt DLP</span>
                    <span className="block text-[11px] text-gray-400">Prevents agents from leaking API keys, private keys, or PII into public LLM context windows.</span>
                  </div>
                  <input type="checkbox" checked={agentPromptDlp} onChange={e => setAgentPromptDlp(e.target.checked)} className="w-4 h-4 accent-purple-600" />
                </div>
              </div>

              {navRow(STEP_IDP_ONBOARDING, STEP_SUPPLY_CHAIN_SANDBOX, 'Continue to Supply Chain Sandbox')}
            </div>
          )}

          {/* ── 4 · Software Supply Chain & LLM Discrepancy Sandbox ── */}
          {step === STEP_SUPPLY_CHAIN_SANDBOX && (
            <div>
              {sectionHead(Box, 'Software Supply Chain & Package Governance', 'Prevent malicious open-source packages from dropping backdoors or unauthorized remote C2 channels. Sandbox unverified sources for observation or verify instantly with LLM Discrepancy Analysis.')}

              <div className="space-y-3 mb-4">
                {[
                  {
                    id: 'llm_discrepancy',
                    name: 'Proprietary LLM Discrepancy Analysis (Instant Verification)',
                    desc: 'Performs semantic intent-vs-code AST analysis, deobfuscating hidden payloads, constant propagation, and taint paths to clear clean packages in seconds without a long observation delay.'
                  },
                  {
                    id: 'strict_90_days',
                    name: 'Strict Zero-Trust Quarantine Sandbox',
                    desc: 'Holds newly released npm, PyPI, and RubyGems packages from unidentified/untrusted maintainers in a sandboxed staging registry for a full observation cycle before developer release.'
                  },
                  {
                    id: 'hybrid_instant',
                    name: 'Hybrid: Observation Gate with Automated LLM Discrepancy Bypass',
                    desc: 'Defaults to quarantine for zero-reputation packages; automatically releases packages that pass 100% LLM AST semantic verification and taint path lineage tests.'
                  }
                ].map(opt => {
                  const on = sandboxQuarantineMode === opt.id;
                  return (
                    <button key={opt.id} onClick={() => setSandboxQuarantineMode(opt.id as 'llm_discrepancy' | 'strict_90_days' | 'hybrid_instant')}
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

              <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-purple-400" />
                    <div>
                      <span className="block text-xs font-medium text-gray-100">AST Control-Flow Tracing & Semantic Verification</span>
                      <span className="block text-[10.5px] text-gray-400">Flags execution lineages that diverge from declared package manifests across npm, PyPI, and Go modules.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-gray-300">Unidentified Source Observation Window</span>
                  <select
                    value={quarantineObservationDays}
                    onChange={e => setQuarantineObservationDays(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg text-xs text-gray-200 bg-[#141033] border border-white/10 outline-none"
                  >
                    <option value="30">30 Days Observation</option>
                    <option value="60">60 Days Observation</option>
                    <option value="90">90 Days Observation (Recommended)</option>
                    <option value="180">180 Days (High-Assurance Banking)</option>
                  </select>
                </div>
              </div>

              {navRow(STEP_AGENTIC_DEFENSE, STEP_RISK_TAXONOMY, 'Continue to Risk Engine')}
            </div>
          )}

          {/* ── 5 · Risk Engine & Dynamic Enforcement ── */}
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
              {navRow(STEP_SUPPLY_CHAIN_SANDBOX, STEP_APPS_DISCOVERY, 'Continue')}
            </div>
          )}

          {/* ── 6 · Sanctioned Apps Catalog ── */}
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
              {navRow(STEP_RISK_TAXONOMY, STEP_SAAS_RESTRICTION, `Continue (${sanctionedApps.length} Sanctioned)`)}
            </div>
          )}

          {/* ── 7 · Tenant-Scoped SaaS Access ── */}
          {step === STEP_SAAS_RESTRICTION && tenantData && (
            <SaaSRestrictionStep
              tenantData={tenantData}
              onNext={(config) => {
                setSaaSConfig(config);
                setStep(STEP_QOE_NIC);
              }}
              onBack={() => setStep(STEP_APPS_DISCOVERY)}
            />
          )}

          {/* ── 7 · Predictive QoE & NIC Optimization ── */}
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
              {navRow(STEP_APPS_DISCOVERY, STEP_INLINE_PROXY_CERT, 'Continue')}
            </div>
          )}

          {/* ── 8 · Inline Proxy MITM Signing Certificate ── */}
          {step === STEP_INLINE_PROXY_CERT && (
            <div>
              {sectionHead(FileText, 'Inline Proxy Signing Certificate', 'The inline proxy acts as a MITM for SSL/TLS inspection. It needs a signing certificate to generate leaf certs for inspected domains on the fly.')}
              
              <div className="space-y-4">
                {/* Mode Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setProxyCertMode('generate'); setProxyCertGenerated(false); }}
                    className="p-4 rounded-xl border text-left transition-all"
                    style={{ background: proxyCertMode === 'generate' ? 'rgba(109,74,255,0.12)' : 'rgba(255,255,255,0.02)', borderColor: proxyCertMode === 'generate' ? 'rgba(109,74,255,0.5)' : 'rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={18} style={{ color: proxyCertMode === 'generate' ? ACCENT : '#6b7280' }} />
                      <span className="text-sm font-semibold text-gray-200">Generate Self-Signed</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">Quick setup — generates a CA + leaf cert pair for the inline proxy. Best for POC and evaluation environments.</p>
                  </button>
                  <button
                    onClick={() => { setProxyCertMode('upload'); setProxyCertGenerated(false); }}
                    className="p-4 rounded-xl border text-left transition-all"
                    style={{ background: proxyCertMode === 'upload' ? 'rgba(109,74,255,0.12)' : 'rgba(255,255,255,0.02)', borderColor: proxyCertMode === 'upload' ? 'rgba(109,74,255,0.5)' : 'rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Download size={18} style={{ color: proxyCertMode === 'upload' ? ACCENT : '#6b7280' }} />
                      <span className="text-sm font-semibold text-gray-200">Upload Existing</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">Upload your enterprise CA certificate + private key for production SSL inspection signing.</p>
                  </button>
                </div>

                {/* Generate Mode */}
                {proxyCertMode === 'generate' && (
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Common Name (CN)</label>
                        <input value={proxyCertCn} onChange={e => setProxyCertCn(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm text-gray-100 bg-black/40 border border-white/10 outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Organization (O)</label>
                        <input value={proxyCertOrg} onChange={e => setProxyCertOrg(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm text-gray-100 bg-black/40 border border-white/10 outline-none focus:border-purple-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Validity Period</label>
                      <select value={proxyCertExpiry} onChange={e => setProxyCertExpiry(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm text-gray-100 bg-black/40 border border-white/10 outline-none">
                        <option value="90" className="bg-[#141033]">90 Days (POC)</option>
                        <option value="365" className="bg-[#141033]">1 Year (Standard)</option>
                        <option value="730" className="bg-[#141033]">2 Years (Extended)</option>
                        <option value="1095" className="bg-[#141033]">3 Years (Enterprise)</option>
                      </select>
                    </div>
                    <button
                      onClick={() => setProxyCertGenerated(true)}
                      disabled={proxyCertGenerated}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                      style={{ background: proxyCertGenerated ? 'rgba(34,197,94,0.2)' : `linear-gradient(90deg,${ACCENT},#8b6dff)` }}
                    >
                      {proxyCertGenerated ? (
                        <><Check size={15} className="inline mr-2" /> Certificate Generated & Ready</>
                      ) : (
                        <><Zap size={15} className="inline mr-2" /> Generate CA + Leaf Certificate</>
                      )}
                    </button>
                  </div>
                )}

                {/* Upload Mode */}
                {proxyCertMode === 'upload' && (
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">CA / Root Certificate (PEM, CRT, CER)</label>
                      <input type="file" accept=".pem,.crt,.cer,.p7b"
                        onChange={e => setProxyCaFile(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 rounded-lg text-sm text-gray-300 bg-black/40 border border-white/10 outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:text-white" style={{ backgroundClip: 'padding-box' }} />
                      {proxyCaFile && <span className="text-[11px] text-green-400 mt-1 block"><Check size={12} className="inline mr-1" /> {proxyCaFile.name}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Signing Certificate (PEM, CRT)</label>
                      <input type="file" accept=".pem,.crt,.cer"
                        onChange={e => setProxyCertFile(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 rounded-lg text-sm text-gray-300 bg-black/40 border border-white/10 outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:text-white" style={{ backgroundClip: 'padding-box' }} />
                      {proxyCertFile && <span className="text-[11px] text-green-400 mt-1 block"><Check size={12} className="inline mr-1" /> {proxyCertFile.name}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Private Key (PEM, KEY)</label>
                      <input type="file" accept=".pem,.key"
                        onChange={e => setProxyKeyFile(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 rounded-lg text-sm text-gray-300 bg-black/40 border border-white/10 outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:text-white" style={{ backgroundClip: 'padding-box' }} />
                      {proxyKeyFile && <span className="text-[11px] text-green-400 mt-1 block"><Check size={12} className="inline mr-1" /> {proxyKeyFile.name}</span>}
                    </div>
                    <button
                      onClick={() => setProxyCertGenerated(true)}
                      disabled={proxyCertGenerated || !proxyCaFile || !proxyCertFile || !proxyKeyFile}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-40"
                      style={{ background: proxyCertGenerated ? 'rgba(34,197,94,0.2)' : `linear-gradient(90deg,${ACCENT},#8b6dff)` }}
                    >
                      {proxyCertGenerated ? (
                        <><Check size={15} className="inline mr-2" /> Certificate Uploaded & Verified</>
                      ) : (
                        <><Download size={15} className="inline mr-2" /> Upload & Verify Certificate</>
                      )}
                    </button>
                  </div>
                )}

                {/* Info Box */}
                <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
                  <p className="text-[11.5px] text-purple-300 leading-relaxed">
                    <ShieldAlert size={13} className="inline mr-1.5" />
                    The inline proxy uses this certificate to dynamically sign leaf certificates for domains during SSL/TLS inspection. 
                    Browsers will trust these certificates if the CA is installed in the endpoint&apos;s trust store via the ApexAegis agent or GPO.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <button onClick={() => setStep(STEP_QOE_NIC)} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200">
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  onClick={() => { setProxyCertGenerated(true); setStep(STEP_SOVEREIGN_CELL); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all shadow-lg"
                  style={{ background: `linear-gradient(90deg,${ACCENT},#8b6dff)` }}
                >
                  {proxyCertGenerated ? 'Continue' : 'Skip (Use Default)'} <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── 9 · Sovereignty, ITDR & Ledger ── */}
          {step === STEP_SOVEREIGN_CELL && (
            <div>
              {sectionHead(Database, 'Sovereignty, ITDR Ingestion & Immutable Ledger', 'Configure in-country enclave boundaries, telemetry streaming guides, and private Hiero aBFT state verification.')}

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

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Zap size={13} /> Third-Party Telemetry & ITDR Partner Integration
                  </span>
                  <button
                    type="button"
                    onClick={() => alert(`Downloading ApexAegis_${selectedTelemetryPartner.toUpperCase()}_Ingest_Guide.pdf`)}
                    className="inline-flex items-center gap-1 text-[10.5px] text-purple-300 hover:text-purple-200"
                  >
                    <Download size={11} /> Guide PDF
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {TELEMETRY_PARTNERS.map(tp => (
                    <button
                      key={tp.id}
                      onClick={() => setSelectedTelemetryPartner(tp.id)}
                      className={`px-3 py-2 rounded-lg border text-left text-xs transition-all ${selectedTelemetryPartner === tp.id ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/10 text-gray-400'}`}
                    >
                      <span className="font-semibold block">{tp.name}</span>
                      <span className="text-[10px] opacity-70">{tp.type}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/5">
                  <label className="block text-[10.5px] text-gray-400 mb-1">Generated Real-Time Ingest Webhook (HMAC-SHA256)</label>
                  <input readOnly value={webhookUrl}
                    className="w-full px-3 py-1.5 rounded-lg text-xs font-mono text-purple-300 bg-black/40 border border-white/10 outline-none select-all" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} style={{ color: ACCENT }} />
                    <div>
                      <span className="block text-xs font-medium text-gray-100">Private In-Country Hiero aBFT Ledger</span>
                      <span className="block text-[10.5px] text-gray-400">Air-gapped Linux Foundation Hashgraph validator nodes inside sovereign AWS VPC.</span>
                    </div>
                  </div>
                  <input type="checkbox" checked={enablePrivateHiero} onChange={e => setEnablePrivateHiero(e.target.checked)} className="w-4 h-4 accent-purple-600" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                  <Lock size={12} /> S3 WORM Compliance Mode Retention
                </label>
                <select value={logRetentionPeriod} onChange={e => setLogRetentionPeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs text-gray-100 bg-white/5 border border-white/10 outline-none">
                  <option value="90-days" className="bg-[#141033]">90 Days Hot / 1 Year WORM</option>
                  <option value="180-days" className="bg-[#141033]">180 Days Hot / 3 Years WORM (SOC 2 Type II)</option>
                  <option value="365-days" className="bg-[#141033]">365 Days Hot / 7 Years WORM (FedRAMP / Banking)</option>
                </select>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <button onClick={() => setStep(STEP_INLINE_PROXY_CERT)} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200">
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

          {/* ── 9 · Provisioning Pipeline ── */}
          {step === STEP_PROVISION && (
            <div className="py-4">
              <h2 className="text-lg font-bold text-white mb-1">Deploying Sovereign Zero Trust Posture…</h2>
              <p className="text-sm text-gray-500 mb-5">Arming agentic RCE boundaries, supply chain sandbox, and in-country aBFT consensus.</p>
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

          {/* ── 10 · Completed Screen ── */}
          {step === STEP_DONE && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border"
                style={{ background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' }}>
                <Check size={32} className="text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Sovereign Architecture Online</h1>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                {selectedFrameworks.length} Frameworks Active · {IDP_PROVIDERS.find(i => i.id === selectedIdp)?.name} Bound · Agentic RCE Defense Active · LLM Supply Chain Sandbox Armed ·
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