'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Sliders, Globe, Bot, Link2, Wifi, AlertTriangle,
  CheckCircle, Lock, Eye, Settings, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, Minus, Plus
} from 'lucide-react';

// Types
interface CARTAThreshold {
  tier: string;
  name: string;
  minScore: number;
  maxScore: number;
  color: string;
  description: string;
}

interface MidSessionEnforcement {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggerThreshold: number;
  action: string;
}

interface SanctionedApp {
  id: string;
  name: string;
  category: string;
  status: 'approved' | 'restricted' | 'blocked';
  oauthScopes: string[];
  aiAgentAccess: boolean;
}

interface NHIConfig {
  id: string;
  name: string;
  type: 'oauth' | 'api_key' | 'service_account';
  maxTokenLifetime: number;
  scopeRestrictions: string[];
  dlpEnabled: boolean;
}

interface SupplyChainRule {
  id: string;
  name: string;
  type: 'ast_analysis' | 'quarantine' | 'provenance';
  enabled: boolean;
  config: Record<string, unknown>;
}

interface QoERule {
  id: string;
  app: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dscpMarking: string;
  bandwidthGuarantee: number;
  nicBackoffThreshold: number;
}

// Mock data
const CARTA_THRESHOLDS: CARTAThreshold[] = [
  { tier: 'Tier 1', name: 'Critical Systems', minScore: 0, maxScore: 25, color: 'red', description: 'Domain controllers, payment systems, production databases' },
  { tier: 'Tier 2', name: 'Internal Apps', minScore: 25, maxScore: 60, color: 'amber', description: 'Internal tools, code repositories, CI/CD pipelines' },
  { tier: 'Tier 3', name: 'SaaS / Web', minScore: 60, maxScore: 80, color: 'green', description: 'Approved SaaS apps, web browsing, GenAI tools' },
];

const MID_SESSION_ENFORCEMENTS: MidSessionEnforcement[] = [
  { id: 'enf_001', name: 'Step-Up Authentication', description: 'Force FIDO2/WebAuthn re-authentication when score drops', enabled: true, triggerThreshold: 40, action: 'FIDO2 Challenge' },
  { id: 'enf_002', name: 'Read-Only Mode', description: 'Restrict to read-only access when score is degraded', enabled: true, triggerThreshold: 30, action: 'Read-Only' },
  { id: 'enf_003', name: 'Remote Browser Isolation', description: 'Route traffic through RBI when risk is elevated', enabled: true, triggerThreshold: 50, action: 'RBI' },
  { id: 'enf_004', name: 'Micro-Isolation', description: 'Isolate endpoint from all private tunnels', enabled: false, triggerThreshold: 20, action: 'Micro-Isolate' },
];

const SANCTIONED_APPS: SanctionedApp[] = [
  { id: 'app_001', name: 'Microsoft 365', category: 'Productivity', status: 'approved', oauthScopes: ['User.Read', 'Mail.Read', 'Files.Read'], aiAgentAccess: true },
  { id: 'app_002', name: 'GitHub Copilot', category: 'AI/GenAI', status: 'approved', oauthScopes: ['repo', 'read:user'], aiAgentAccess: true },
  { id: 'app_003', name: 'ChatGPT Enterprise', category: 'AI/GenAI', status: 'approved', oauthScopes: ['openid', 'profile'], aiAgentAccess: true },
  { id: 'app_004', name: 'Slack', category: 'Communication', status: 'approved', oauthScopes: ['channels:read', 'chat:write'], aiAgentAccess: false },
  { id: 'app_005', name: 'Unknown AI Tool', category: 'AI/GenAI', status: 'blocked', oauthScopes: [], aiAgentAccess: false },
];

const NHI_CONFIGS: NHIConfig[] = [
  { id: 'nhi_001', name: 'GitHub Actions', type: 'oauth', maxTokenLifetime: 3600, scopeRestrictions: ['repo:read', 'actions:read'], dlpEnabled: true },
  { id: 'nhi_002', name: 'Jenkins CI', type: 'service_account', maxTokenLifetime: 7200, scopeRestrictions: ['build:read', 'artifact:read'], dlpEnabled: true },
  { id: 'nhi_003', name: 'Datadog Agent', type: 'api_key', maxTokenLifetime: 86400, scopeRestrictions: ['metrics:write', 'logs:write'], dlpEnabled: false },
];

const QOE_RULES: QoERule[] = [
  { id: 'qoe_001', app: 'Microsoft Teams', priority: 'critical', dscpMarking: 'EF (46)', bandwidthGuarantee: 30, nicBackoffThreshold: 80 },
  { id: 'qoe_002', app: 'Zoom', priority: 'critical', dscpMarking: 'EF (46)', bandwidthGuarantee: 25, nicBackoffThreshold: 80 },
  { id: 'qoe_003', app: 'Webex', priority: 'high', dscpMarking: 'AF41 (34)', bandwidthGuarantee: 20, nicBackoffThreshold: 85 },
  { id: 'qoe_004', app: 'Background Sync', priority: 'low', dscpMarking: 'BE (0)', bandwidthGuarantee: 5, nicBackoffThreshold: 70 },
];

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState<'carta' | 'midsession' | 'apps' | 'agent' | 'supply' | 'qoe'>('carta');
  const [cartaScore, setCartaScore] = useState(50);
  const [enforcements, setEnforcements] = useState(MID_SESSION_ENFORCEMENTS);
  const [apps, setApps] = useState(SANCTIONED_APPS);
  const [qoeRules, setQoeRules] = useState(QOE_RULES);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [astEnabled, setAstEnabled] = useState(true);
  const [quarantineDays, setQuarantineDays] = useState(60);

  const handleEnforcementToggle = useCallback((id: string) => {
    setEnforcements(prev => prev.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  }, []);

  const handleAppStatusChange = useCallback((id: string, status: SanctionedApp['status']) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }, []);

  const handleQoEBackoffChange = useCallback((id: string, threshold: number) => {
    setQoeRules(prev => prev.map(q => q.id === id ? { ...q, nicBackoffThreshold: threshold } : q));
  }, []);

  const getThresholdColor = (score: number) => {
    if (score < 25) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (score < 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const tabs = [
    { id: 'carta', label: 'CARTA Thresholds', icon: Sliders },
    { id: 'midsession', label: 'Mid-Session Enforcements', icon: AlertTriangle },
    { id: 'apps', label: 'Sanctioned Apps & NHI', icon: Globe },
    { id: 'agent', label: 'Agent RCE Boundaries', icon: Bot },
    { id: 'supply', label: 'Supply Chain Governance', icon: Lock },
    { id: 'qoe', label: 'Predictive QoE & NIC', icon: Wifi },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-100">CATE Policies & Access Gates</h1>
        <p className="text-xs text-gray-400 mt-1">
          Single interface to govern continuous adaptive trust, mid-session dynamic controls, sanctioned SaaS/AI tools, and physical NIC QoS rules.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-gray-800 pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CARTA Thresholds Tab */}
      {activeTab === 'carta' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Interactive Threshold Slider */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">Continuous Adaptive Trust (CARTA) Threshold</h3>
            
            {/* Score Display */}
            <div className="flex items-center justify-center mb-6">
              <div className={`text-5xl font-bold px-6 py-3 rounded-xl border ${getThresholdColor(cartaScore)}`}>
                {cartaScore}
              </div>
            </div>

            {/* Slider */}
            <div className="relative px-4 mb-6">
              <input
                type="range"
                min="0"
                max="100"
                value={cartaScore}
                onChange={(e) => setCartaScore(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                <span>0 (Critical)</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100 (Trusted)</span>
              </div>
            </div>

            {/* Threshold Tiers */}
            <div className="grid grid-cols-3 gap-3">
              {CARTA_THRESHOLDS.map((tier) => (
                <div key={tier.tier} className={`p-3 rounded-lg border ${
                  cartaScore >= tier.minScore && cartaScore < tier.maxScore
                    ? `bg-${tier.color}-500/10 border-${tier.color}-500/30`
                    : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{tier.tier}</span>
                    <span className="text-[10px] text-gray-400">{tier.minScore}-{tier.maxScore}</span>
                  </div>
                  <div className="text-[10px] text-gray-400">{tier.name}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{tier.description}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Mid-Session Enforcements Tab */}
      {activeTab === 'midsession' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {enforcements.map((enf) => (
            <div key={enf.id} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-200">{enf.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Trigger: &lt;{enf.triggerThreshold}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{enf.description}</p>
              </div>
              <button
                onClick={() => handleEnforcementToggle(enf.id)}
                className="flex items-center gap-1"
              >
                {enf.enabled ? (
                  <ToggleRight size={24} className="text-emerald-400" />
                ) : (
                  <ToggleLeft size={24} className="text-gray-500" />
                )}
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {/* Sanctioned Apps & NHI Tab */}
      {activeTab === 'apps' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/30"
                onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
              >
                <div className="flex items-center gap-3">
                  <Globe size={16} className="text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-200">{app.name}</span>
                    <span className="text-[10px] text-gray-500 ml-2">{app.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={app.status}
                    onChange={(e) => handleAppStatusChange(app.id, e.target.value as SanctionedApp['status'])}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300"
                  >
                    <option value="approved">Approved</option>
                    <option value="restricted">Restricted</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  {expandedApp === app.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>
              {expandedApp === app.id && (
                <div className="px-4 pb-4 border-t border-gray-800 pt-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-gray-500 mb-1">OAuth Scopes</div>
                      <div className="flex flex-wrap gap-1">
                        {app.oauthScopes.map(scope => (
                          <span key={scope} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{scope}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 mb-1">AI Agent Access</div>
                      <span className={`text-xs ${app.aiAgentAccess ? 'text-emerald-400' : 'text-red-400'}`}>
                        {app.aiAgentAccess ? 'Allowed' : 'Blocked'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* NHI Config */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Non-Human Identity (NHI) Governance</h3>
            {NHI_CONFIGS.map((nhi) => (
              <div key={nhi.id} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Link2 size={14} className="text-purple-400" />
                    <span className="text-sm font-medium text-gray-200">{nhi.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">{nhi.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">Token Lifetime: {nhi.maxTokenLifetime}s</span>
                    {nhi.dlpEnabled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">DLP</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {nhi.scopeRestrictions.map(scope => (
                    <span key={scope} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{scope}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Agent RCE Boundaries Tab */}
      {activeTab === 'agent' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Bot size={16} className="text-purple-400" />
              Autonomous Agent RCE Boundaries
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <div className="text-sm text-gray-200">Block Detached Child Processes</div>
                  <div className="text-xs text-gray-400">Block bash, cmd, powershell spawned by AI agent tokens</div>
                </div>
                <ToggleRight size={24} className="text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <div className="text-sm text-gray-200">Human FIDO2 Step-Up for Mutating Actions</div>
                  <div className="text-xs text-gray-400">Require biometric auth for terminal writes, DB mutations, socket connections</div>
                </div>
                <ToggleRight size={24} className="text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <div className="text-sm text-gray-200">NHI Prompt DLP</div>
                  <div className="text-xs text-gray-400">Scope backend OAuth tokens and restrict credentials from AI context windows</div>
                </div>
                <ToggleRight size={24} className="text-emerald-400" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Supply Chain Governance Tab */}
      {activeTab === 'supply' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* LLM Discrepancy Analysis */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-200">LLM Discrepancy Analysis (AST)</h3>
                <p className="text-xs text-gray-400">Instant AST intent-vs-code analysis for inbound packages</p>
              </div>
              <button onClick={() => setAstEnabled(!astEnabled)}>
                {astEnabled ? <ToggleRight size={28} className="text-emerald-400" /> : <ToggleLeft size={28} className="text-gray-500" />}
              </button>
            </div>
            {astEnabled && (
              <div className="grid grid-cols-4 gap-2">
                {['npm', 'PyPI', 'RubyGems', 'crates.io'].map(registry => (
                  <div key={registry} className="text-center p-2 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-gray-300">{registry}</div>
                    <div className="text-[10px] text-emerald-400 mt-1">Active</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zero-Reputation Quarantine */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Zero-Reputation Quarantine</h3>
            <p className="text-xs text-gray-400 mb-4">Observation window for packages from unverified maintainers</p>
            <div className="flex items-center gap-3">
              {[30, 60, 90, 180].map(days => (
                <button
                  key={days}
                  onClick={() => setQuarantineDays(days)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                    quarantineDays === days
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {days} days
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Predictive QoE Tab */}
      {activeTab === 'qoe' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {qoeRules.map((rule) => (
            <div key={rule.id} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wifi size={14} className="text-cyan-400" />
                  <span className="text-sm font-medium text-gray-200">{rule.app}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    rule.priority === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    rule.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    'bg-white/5 text-gray-400 border-white/10'
                  }`}>
                    {rule.priority}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>DSCP: {rule.dscpMarking}</span>
                  <span>Guarantee: {rule.bandwidthGuarantee}%</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500 w-32">NIC Backoff Trigger:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQoEBackoffChange(rule.id, Math.max(50, rule.nicBackoffThreshold - 5))}
                    className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="text-sm font-mono text-white w-12 text-center">{rule.nicBackoffThreshold}%</span>
                  <button
                    onClick={() => handleQoEBackoffChange(rule.id, Math.min(95, rule.nicBackoffThreshold + 5))}
                    className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
