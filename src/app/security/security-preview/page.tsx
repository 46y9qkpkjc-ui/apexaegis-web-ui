'use client';
import { useState } from 'react';
import {
  Search, Shield, Globe, ArrowRight,
  CheckCircle2, XCircle, Eye, ChevronDown, ChevronRight,
  Activity, FileText,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────── */

interface PolicyMatch {
  policy_id: string;
  policy_name: string;
  action: 'allow' | 'deny' | 'inspect' | 'isolate';
  order: number;
  matched_criteria: string[];
  security_profiles: ProfileMatch[];
}

interface ProfileMatch {
  type: string;
  name: string;
  verdict: 'pass' | 'block' | 'inspect' | 'log' | 'not_applicable';
  detail: string;
}

interface SimulationInput {
  url: string;
  domain: string;
  source_ip: string;
  dest_ip: string;
  user: string;
  group: string;
  protocol: string;
  port: string;
  application: string;
}

interface SimulationResult {
  input: SimulationInput;
  final_action: 'allow' | 'deny' | 'inspect' | 'isolate';
  matched_policies: PolicyMatch[];
  threat_intel: ThreatIntelResult;
  url_category: string;
  cloud_app_risk: string | null;
  sgt_classification: string | null;
  total_eval_ms: number;
}

interface ThreatIntelResult {
  reputation_score: number;
  categories: string[];
  known_malicious: boolean;
  last_seen: string | null;
}

/* ─── Demo Data ──────────────────────────────────────────────────── */

const demoResults: SimulationResult[] = [
  {
    input: { url: 'https://evil-phish.badsite.ru/login.html', domain: 'evil-phish.badsite.ru', source_ip: '10.0.4.28', dest_ip: '185.143.223.12', user: 'jsmith@corp.com', group: 'Engineering', protocol: 'HTTPS', port: '443', application: 'Web Browser' },
    final_action: 'deny',
    matched_policies: [
      {
        policy_id: 'POL-003', policy_name: 'Block Malicious URLs', action: 'deny', order: 3,
        matched_criteria: ['URL Category: Phishing', 'Threat Intel: Known Malicious', 'Reputation < 20'],
        security_profiles: [
          { type: 'DNS Filter', name: 'Strict DNS', verdict: 'block', detail: 'Domain in phishing blocklist — AegisThreat hash match' },
          { type: 'Web Filter', name: 'Corporate Web', verdict: 'block', detail: 'URL category "Phishing" is blocked per policy' },
          { type: 'ATP', name: 'Advanced Threat', verdict: 'block', detail: 'AegisThreat AI: Known credential harvesting page' },
          { type: 'SSL Inspection', name: 'Full Inspect', verdict: 'inspect', detail: 'Certificate would be intercepted for deep inspection' },
        ],
      },
    ],
    threat_intel: { reputation_score: 5, categories: ['Phishing', 'Credential Harvesting'], known_malicious: true, last_seen: '2026-03-13T22:00:00Z' },
    url_category: 'Phishing',
    cloud_app_risk: null,
    sgt_classification: null,
    total_eval_ms: 12,
  },
  {
    input: { url: 'https://slack.com/api/chat.postMessage', domain: 'slack.com', source_ip: '10.0.8.15', dest_ip: '34.233.42.187', user: 'alee@corp.com', group: 'Marketing', protocol: 'HTTPS', port: '443', application: 'Slack' },
    final_action: 'allow',
    matched_policies: [
      {
        policy_id: 'POL-010', policy_name: 'Allow SaaS Collaboration', action: 'allow', order: 10,
        matched_criteria: ['Cloud App: Slack (Sanctioned)', 'User Group: Marketing', 'Protocol: HTTPS'],
        security_profiles: [
          { type: 'DNS Filter', name: 'Strict DNS', verdict: 'pass', detail: 'Domain is whitelisted as sanctioned SaaS' },
          { type: 'Web Filter', name: 'Corporate Web', verdict: 'pass', detail: 'URL category "Collaboration" is allowed' },
          { type: 'DLP', name: 'PII Scanner', verdict: 'inspect', detail: 'API body inspected for PII patterns — no match' },
          { type: 'SSL Inspection', name: 'SaaS Bypass', verdict: 'not_applicable', detail: 'Slack SSL is bypassed per sanctioned app policy' },
        ],
      },
    ],
    threat_intel: { reputation_score: 98, categories: ['Sanctioned SaaS', 'Collaboration'], known_malicious: false, last_seen: null },
    url_category: 'Collaboration',
    cloud_app_risk: 'Low (Sanctioned)',
    sgt_classification: 'SGT-200 (Corporate-SaaS)',
    total_eval_ms: 4,
  },
];

/* ─── Helpers ────────────────────────────────────────────────────── */

const actionBadge: Record<string, string> = {
  allow: 'text-green-400 bg-green-900/30 border-green-700/40',
  deny: 'text-red-400 bg-red-900/30 border-red-700/40',
  inspect: 'text-blue-400 bg-blue-900/30 border-blue-700/40',
  isolate: 'text-purple-400 bg-purple-900/30 border-purple-700/40',
};

const verdictIcon: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  pass: { icon: CheckCircle2, color: 'text-green-400' },
  block: { icon: XCircle, color: 'text-red-400' },
  inspect: { icon: Eye, color: 'text-blue-400' },
  log: { icon: FileText, color: 'text-amber-400' },
  not_applicable: { icon: Activity, color: 'text-gray-600' },
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  SECURITY PREVIEW PAGE                                              */
/* ═══════════════════════════════════════════════════════════════════ */

export default function SecurityPreviewPage() {
  const [input, setInput] = useState<SimulationInput>({
    url: '', domain: '', source_ip: '10.0.4.28', dest_ip: '', user: 'jsmith@corp.com',
    group: 'Engineering', protocol: 'HTTPS', port: '443', application: '',
  });
  const [results, setResults] = useState<SimulationResult[]>(demoResults);
  const [expandedResult, setExpandedResult] = useState<number | null>(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    if (!input.url && !input.domain) return;
    setIsSimulating(true);

    // Demo — simulate API call delay and return a result
    setTimeout(() => {
      const newResult: SimulationResult = {
        input: { ...input, domain: input.domain || new URL(input.url.startsWith('http') ? input.url : `https://${input.url}`).hostname },
        final_action: Math.random() > 0.3 ? 'deny' : 'allow',
        matched_policies: [{
          policy_id: `POL-${String(Math.floor(Math.random() * 50)).padStart(3, '0')}`,
          policy_name: 'Custom Simulation Match',
          action: Math.random() > 0.3 ? 'deny' : 'allow',
          order: Math.floor(Math.random() * 20) + 1,
          matched_criteria: ['URL Match', `User: ${input.user}`, `Protocol: ${input.protocol}`],
          security_profiles: [
            { type: 'DNS Filter', name: 'Strict DNS', verdict: Math.random() > 0.5 ? 'block' : 'pass', detail: 'Checked against DNS blocklist' },
            { type: 'Web Filter', name: 'Corporate Web', verdict: Math.random() > 0.5 ? 'block' : 'pass', detail: 'URL category evaluated' },
            { type: 'ATP', name: 'Advanced Threat', verdict: 'pass', detail: 'No known threat signature' },
            { type: 'SSL Inspection', name: 'Full Inspect', verdict: 'inspect', detail: 'SSL interception active' },
          ],
        }],
        threat_intel: { reputation_score: Math.floor(Math.random() * 100), categories: ['Unknown'], known_malicious: Math.random() > 0.7, last_seen: null },
        url_category: 'Uncategorized',
        cloud_app_risk: null,
        sgt_classification: null,
        total_eval_ms: 3 + Math.floor(Math.random() * 20),
      };
      setResults(prev => [newResult, ...prev]);
      setExpandedResult(0);
      setIsSimulating(false);
    }, 800);
  };

  const updateField = (field: keyof SimulationInput, value: string) => {
    setInput(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Search size={24} className="text-cyan-400" />
        <div>
          <h1 className="text-xl font-semibold">Security Preview</h1>
          <p className="text-sm text-gray-500">
            Simulate traffic against all active policies — see which rules match and what action would be taken
          </p>
        </div>
      </div>

      {/* Input form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Globe size={14} className="text-blue-400" /> Simulation Input
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <div>
            <label htmlFor="sim-url" className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">URL</label>
            <input id="sim-url" value={input.url} onChange={e => updateField('url', e.target.value)}
              placeholder="https://example.com/path"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-blue-500/60" />
          </div>
          <div>
            <label htmlFor="sim-domain" className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Domain</label>
            <input id="sim-domain" value={input.domain} onChange={e => updateField('domain', e.target.value)}
              placeholder="example.com"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-blue-500/60" />
          </div>
          <div>
            <label htmlFor="sim-app" className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Application</label>
            <input id="sim-app" value={input.application} onChange={e => updateField('application', e.target.value)}
              placeholder="Slack, Zoom, Chrome..."
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-blue-500/60" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <div>
            <label htmlFor="sim-srcip" className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Source IP</label>
            <input id="sim-srcip" value={input.source_ip} onChange={e => updateField('source_ip', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-blue-500/60" />
          </div>
          <div>
            <label htmlFor="sim-user" className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">User</label>
            <input id="sim-user" value={input.user} onChange={e => updateField('user', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-blue-500/60" />
          </div>
          <div>
            <label htmlFor="sim-group" className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Group</label>
            <input id="sim-group" value={input.group} onChange={e => updateField('group', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-blue-500/60" />
          </div>
          <div>
            <label htmlFor="sim-protocol" className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Protocol</label>
            <select id="sim-protocol" value={input.protocol} onChange={e => updateField('protocol', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-blue-500/60">
              <option>HTTPS</option><option>HTTP</option><option>DNS</option><option>SSH</option><option>RDP</option><option>SMB</option>
            </select>
          </div>
          <div>
            <label htmlFor="sim-port" className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Port</label>
            <input id="sim-port" value={input.port} onChange={e => updateField('port', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-blue-500/60" />
          </div>
        </div>
        <button onClick={handleSimulate} disabled={isSimulating || (!input.url && !input.domain)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {isSimulating ? <Activity size={14} className="animate-spin" /> : <Search size={14} />}
          {isSimulating ? 'Simulating...' : 'Run Policy Simulation'}
        </button>
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {results.map((result, idx) => {
          const isExpanded = expandedResult === idx;
          return (
            <div key={`${result.input.url}-${idx}`} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <button onClick={() => setExpandedResult(isExpanded ? null : idx)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors text-left">
                <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase ${actionBadge[result.final_action]}`}>
                  {result.final_action}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{result.input.url || result.input.domain}</span>
                  <span className="text-[10px] text-gray-500">
                    {result.input.user} · {result.input.protocol}:{result.input.port} · {result.url_category}
                  </span>
                </div>
                <span className="text-[9px] text-gray-600 font-mono">{result.total_eval_ms}ms</span>
                {isExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
              </button>

              {isExpanded && (
                <div className="border-t border-gray-800/60 px-5 py-4 space-y-4">
                  {/* Input summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'Source IP', value: result.input.source_ip },
                      { label: 'Dest IP', value: result.input.dest_ip || 'Resolved via DNS' },
                      { label: 'User / Group', value: `${result.input.user} (${result.input.group})` },
                      { label: 'Application', value: result.input.application || 'N/A' },
                    ].map(f => (
                      <div key={f.label} className="p-2 bg-gray-800/30 rounded-lg">
                        <div className="text-[9px] text-gray-600 uppercase">{f.label}</div>
                        <div className="text-xs text-white/70 mt-0.5 truncate">{f.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Threat Intel */}
                  <div className="p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
                    <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-2">Threat Intelligence</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-600 block text-[9px]">Reputation</span>
                        <span className={(() => {
                          if (result.threat_intel.reputation_score < 30) return 'text-red-400 font-bold';
                          if (result.threat_intel.reputation_score < 60) return 'text-amber-400';
                          return 'text-green-400';
                        })()}>
                          {result.threat_intel.reputation_score}/100
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 block text-[9px]">Known Malicious</span>
                        <span className={result.threat_intel.known_malicious ? 'text-red-400' : 'text-green-400'}>
                          {result.threat_intel.known_malicious ? 'YES' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 block text-[9px]">Categories</span>
                        <div className="flex gap-1 flex-wrap">
                          {result.threat_intel.categories.map(c => (
                            <span key={c} className="px-1 py-0.5 bg-gray-800 text-gray-400 rounded text-[8px]">{c}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 block text-[9px]">Enrichment</span>
                        <div className="flex gap-1 flex-wrap">
                          {result.cloud_app_risk && <span className="px-1 py-0.5 bg-blue-900/20 text-blue-400 rounded text-[8px]">{result.cloud_app_risk}</span>}
                          {result.sgt_classification && <span className="px-1 py-0.5 bg-purple-900/20 text-purple-400 rounded text-[8px]">{result.sgt_classification}</span>}
                          {!result.cloud_app_risk && !result.sgt_classification && <span className="text-gray-600 text-[8px]">None</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Matched Policies */}
                  {result.matched_policies.map(pol => (
                    <div key={pol.policy_id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Shield size={12} className="text-blue-400" />
                        <span className="text-xs font-semibold">{pol.policy_name}</span>
                        <span className="px-1 py-0.5 bg-gray-800 text-gray-500 rounded text-[9px] font-mono">{pol.policy_id}</span>
                        <span className="text-[9px] text-gray-600">Order: {pol.order}</span>
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-medium ml-auto ${actionBadge[pol.action]}`}>
                          {pol.action.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 ml-5">
                        {pol.matched_criteria.map(c => (
                          <span key={c} className="px-1.5 py-0.5 bg-amber-900/20 text-amber-400 border border-amber-700/30 rounded text-[9px]">{c}</span>
                        ))}
                      </div>

                      {/* Security profile verdicts */}
                      <div className="ml-5 space-y-1">
                        {pol.security_profiles.map(prof => {
                          const vi = verdictIcon[prof.verdict];
                          const VIcon = vi.icon;
                          return (
                            <div key={prof.type} className="flex items-center gap-2 p-2 bg-gray-800/20 rounded-lg">
                              <VIcon size={12} className={vi.color} />
                              <span className="text-[10px] font-medium text-white/70 w-24">{prof.type}</span>
                              <span className="text-[9px] text-gray-500">{prof.name}</span>
                              <ArrowRight size={8} className="text-gray-700" />
                              <span className={`text-[9px] ${vi.color}`}>{prof.verdict.toUpperCase()}</span>
                              <span className="text-[9px] text-gray-600 ml-2 flex-1">{prof.detail}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-700 text-center">
        Security Preview · Policy Simulation Engine · Dry-run against all active security policies
      </p>
    </div>
  );
}
