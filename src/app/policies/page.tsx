'use client';

import { useState } from 'react';

const CATE_TIERS = [
  { id: 'tier1', label: 'Tier 1 Critical', threshold: 25, color: '#ef4444', description: 'Critical assets, financial systems, PII databases' },
  { id: 'tier2', label: 'Tier 2 Internal', threshold: 60, color: '#f59e0b', description: 'Internal applications, email, collaboration tools' },
  { id: 'tier3', label: 'Tier 3 SaaS/Web', threshold: 80, color: '#22c55e', description: 'Public SaaS, web browsing, GenAI tools' },
];

const ENFORCEMENT_ACTIONS = [
  { id: 'fido2', label: 'FIDO2/WebAuthn Step-Up', icon: '🔑', description: 'Force re-authentication with hardware key' },
  { id: 'readonly', label: 'Read-Only Mode', icon: '👁️', description: 'Restrict to view-only access' },
  { id: 'rbi', label: 'Remote Browser Isolation', icon: '🌐', description: 'Isolate session in cloud browser' },
  { id: 'micro', label: 'Micro-Isolation', icon: '🔒', description: 'Isolate to specific network segment' },
];

const SANCTIONED_APPS = [
  { name: 'Microsoft 365', category: 'Productivity', status: 'approved', oauth: 'inline', dlp: 'enabled' },
  { name: 'Slack', category: 'Communication', status: 'approved', oauth: 'inline', dlp: 'enabled' },
  { name: 'GitHub Enterprise', category: 'Development', status: 'approved', oauth: 'inline', dlp: 'enabled' },
  { name: 'ChatGPT Enterprise', category: 'GenAI', status: 'approved', oauth: 'intercept', dlp: 'strict' },
  { name: 'Claude Enterprise', category: 'GenAI', status: 'approved', oauth: 'intercept', dlp: 'strict' },
  { name: 'Notion', category: 'Productivity', status: 'approved', oauth: 'inline', dlp: 'enabled' },
  { name: 'Figma', category: 'Design', status: 'approved', oauth: 'inline', dlp: 'standard' },
  { name: 'Salesforce', category: 'CRM', status: 'approved', oauth: 'inline', dlp: 'enabled' },
];

const QOE_APPS = [
  { name: 'Microsoft Teams', priority: 'critical', bandwidth: 'guaranteed', nicQos: 'enabled' },
  { name: 'Zoom', priority: 'critical', bandwidth: 'guaranteed', nicQos: 'enabled' },
  { name: 'Webex', priority: 'critical', bandwidth: 'guaranteed', nicQos: 'enabled' },
  { name: 'Google Meet', priority: 'high', bandwidth: 'priority', nicQos: 'enabled' },
  { name: 'Slack Huddles', priority: 'high', bandwidth: 'priority', nicQos: 'enabled' },
];

export default function PoliciesPage() {
  const [cateScore, setCateScore] = useState(45);
  const [enforceStepUp, setEnforceStepUp] = useState(true);
  const [enforceReadOnly, setEnforceReadOnly] = useState(false);
  const [enforceRbi, setEnforceRbi] = useState(false);
  const [nicBackoff, setNicBackoff] = useState(80);

  const getActiveTier = (score: number) => {
    if (score < CATE_TIERS[0].threshold) return CATE_TIERS[0];
    if (score < CATE_TIERS[1].threshold) return CATE_TIERS[1];
    return CATE_TIERS[2];
  };

  const activeTier = getActiveTier(cateScore);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">CATE Policies & Access Gates</h1>
        <p className="text-sm text-gray-400 mt-1">
          Single interface to govern continuous trust, dynamic mid-session actions, sanctioned applications, and local NIC QoS rules.
        </p>
      </div>

      {/* CATE Threshold Slider */}
      <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Continuous Adaptive Trust (CARTA) Thresholds</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Trust Score Threshold</span>
              <span className="text-sm font-mono" style={{ color: activeTier.color }}>{cateScore}/100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={cateScore}
              onChange={(e) => setCateScore(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${CATE_TIERS[0].color} 0%, ${CATE_TIERS[0].color} 25%, ${CATE_TIERS[1].color} 25%, ${CATE_TIERS[1].color} 60%, ${CATE_TIERS[2].color} 60%, ${CATE_TIERS[2].color} 100%)`,
              }}
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0</span>
              <span>25</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            {CATE_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`p-4 rounded-lg border transition-all ${
                  activeTier.id === tier.id
                    ? 'border-opacity-50 bg-opacity-10'
                    : 'border-gray-700/50 bg-gray-800/30'
                }`}
                style={{
                  borderColor: activeTier.id === tier.id ? tier.color : undefined,
                  backgroundColor: activeTier.id === tier.id ? `${tier.color}15` : undefined,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                  <span className="font-medium text-gray-200">{tier.label}</span>
                </div>
                <div className="text-xs text-gray-400">Threshold: &lt;{tier.threshold}</div>
                <div className="text-xs text-gray-500 mt-1">{tier.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mid-Session Dynamic Enforcements */}
      <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Mid-Session Dynamic Enforcements</h2>
        <p className="text-sm text-gray-400 mb-4">
          Configure automated actions when trust score degrades below threshold during active sessions.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {ENFORCEMENT_ACTIONS.map((action) => (
            <div key={action.id} className="p-4 rounded-lg border border-gray-700/50 bg-gray-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{action.icon}</span>
                  <div>
                    <div className="font-medium text-gray-200">{action.label}</div>
                    <div className="text-xs text-gray-400">{action.description}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (action.id === 'fido2') setEnforceStepUp(!enforceStepUp);
                    if (action.id === 'readonly') setEnforceReadOnly(!enforceReadOnly);
                    if (action.id === 'rbi') setEnforceRbi(!enforceRbi);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    (action.id === 'fido2' && enforceStepUp) ||
                    (action.id === 'readonly' && enforceReadOnly) ||
                    (action.id === 'rbi' && enforceRbi)
                      ? 'bg-cyan-600'
                      : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    (action.id === 'fido2' && enforceStepUp) ||
                    (action.id === 'readonly' && enforceReadOnly) ||
                    (action.id === 'rbi' && enforceRbi)
                      ? 'translate-x-6'
                      : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sanctioned Apps & NHI Catalog */}
      <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Sanctioned Apps & NHI Catalog</h2>
        <p className="text-sm text-gray-400 mb-4">
          Approved enterprise SaaS and GenAI tools with inline OAuth consent interception and backend API scope controls.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Application</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Category</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">OAuth Mode</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">DLP Policy</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {SANCTIONED_APPS.map((app) => (
                <tr key={app.name} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-3 px-4 font-medium text-gray-200">{app.name}</td>
                  <td className="py-3 px-4 text-gray-400">{app.category}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      app.oauth === 'intercept' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      {app.oauth === 'intercept' ? 'Intercept' : 'Inline'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      app.dlp === 'strict' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {app.dlp}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">{app.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Predictive QoE & NIC Contention */}
      <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Predictive QoE & NIC Contention</h2>
        <p className="text-sm text-gray-400 mb-4">
          Real-time collaboration app priorities and dynamic physical NIC background back-off trigger percentage.
        </p>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">NIC Background Back-Off Trigger</span>
            <span className="text-sm font-mono text-cyan-400">{nicBackoff}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            value={nicBackoff}
            onChange={(e) => setNicBackoff(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>50%</span>
            <span>70%</span>
            <span>80%</span>
            <span>90%</span>
            <span>95%</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Application</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Priority</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Bandwidth</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">NIC QoS</th>
              </tr>
            </thead>
            <tbody>
              {QOE_APPS.map((app) => (
                <tr key={app.name} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-3 px-4 font-medium text-gray-200">{app.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      app.priority === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {app.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{app.bandwidth}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">{app.nicQos}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
