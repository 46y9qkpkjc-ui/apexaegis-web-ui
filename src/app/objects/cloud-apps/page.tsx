'use client';
import { useState } from 'react';
import { Globe, Plus, Pencil, Trash2, Search, Shield, X, Brain, AlertTriangle, CheckCircle } from 'lucide-react';

interface RiskCriteria {
  dataSovereignty: number;
  dataPrivacySecurity: number;
  dlpStrategy: number;
  compliance: number;
}

interface CloudApp {
  id: string;
  name: string;
  vendor: string;
  category: string;
  riskScore: number;
  riskCriteria: RiskCriteria;
  sanctioned: boolean;
  domains: string[];
  usersAccessing: number;
  usedInPolicies: number;
}

const RISK_PRESET_APPS: Omit<CloudApp, 'id' | 'sanctioned' | 'usersAccessing' | 'usedInPolicies'>[] = [
  { name: 'Microsoft 365', vendor: 'Microsoft', category: 'Productivity', riskScore: 18, riskCriteria: { dataSovereignty: 15, dataPrivacySecurity: 20, dlpStrategy: 12, compliance: 25 }, domains: ['*.office365.com', '*.microsoft.com', '*.office.com'] },
  { name: 'Google Workspace', vendor: 'Google', category: 'Productivity', riskScore: 22, riskCriteria: { dataSovereignty: 25, dataPrivacySecurity: 18, dlpStrategy: 20, compliance: 25 }, domains: ['*.google.com', '*.googleapis.com'] },
  { name: 'Slack', vendor: 'Salesforce', category: 'Collaboration', riskScore: 25, riskCriteria: { dataSovereignty: 20, dataPrivacySecurity: 28, dlpStrategy: 22, compliance: 30 }, domains: ['*.slack.com', '*.slack-edge.com'] },
  { name: 'Zoom', vendor: 'Zoom Video', category: 'Video Conferencing', riskScore: 28, riskCriteria: { dataSovereignty: 30, dataPrivacySecurity: 25, dlpStrategy: 26, compliance: 31 }, domains: ['*.zoom.us', '*.zoom.com'] },
  { name: 'Salesforce', vendor: 'Salesforce', category: 'CRM', riskScore: 20, riskCriteria: { dataSovereignty: 18, dataPrivacySecurity: 22, dlpStrategy: 18, compliance: 22 }, domains: ['*.salesforce.com', '*.force.com'] },
  { name: 'AWS', vendor: 'Amazon', category: 'IaaS', riskScore: 15, riskCriteria: { dataSovereignty: 12, dataPrivacySecurity: 14, dlpStrategy: 16, compliance: 18 }, domains: ['*.amazonaws.com'] },
  { name: 'Azure', vendor: 'Microsoft', category: 'IaaS', riskScore: 16, riskCriteria: { dataSovereignty: 14, dataPrivacySecurity: 15, dlpStrategy: 17, compliance: 18 }, domains: ['*.azure.com', '*.windows.net'] },
  { name: 'GCP', vendor: 'Google', category: 'IaaS', riskScore: 19, riskCriteria: { dataSovereignty: 18, dataPrivacySecurity: 20, dlpStrategy: 18, compliance: 20 }, domains: ['*.googleapis.com', '*.cloud.google.com'] },
  { name: 'GitHub', vendor: 'Microsoft', category: 'Development', riskScore: 22, riskCriteria: { dataSovereignty: 20, dataPrivacySecurity: 24, dlpStrategy: 20, compliance: 24 }, domains: ['*.github.com', '*.githubusercontent.com'] },
  { name: 'Jira', vendor: 'Atlassian', category: 'Project Management', riskScore: 24, riskCriteria: { dataSovereignty: 22, dataPrivacySecurity: 26, dlpStrategy: 22, compliance: 26 }, domains: ['*.atlassian.net', '*.jira.com'] },
  { name: 'ServiceNow', vendor: 'ServiceNow', category: 'ITSM', riskScore: 21, riskCriteria: { dataSovereignty: 20, dataPrivacySecurity: 22, dlpStrategy: 20, compliance: 22 }, domains: ['*.service-now.com'] },
  { name: 'Dropbox', vendor: 'Dropbox', category: 'File Sharing', riskScore: 42, riskCriteria: { dataSovereignty: 45, dataPrivacySecurity: 40, dlpStrategy: 44, compliance: 39 }, domains: ['*.dropbox.com', '*.dropboxapi.com'] },
  { name: 'ChatGPT', vendor: 'OpenAI', category: 'AI/ML', riskScore: 68, riskCriteria: { dataSovereignty: 72, dataPrivacySecurity: 65, dlpStrategy: 70, compliance: 65 }, domains: ['chat.openai.com', '*.openai.com'] },
];

function getRiskBadge(score: number) {
  if (score < 30) return 'bg-green-900/40 text-green-400 border-green-800';
  if (score <= 60) return 'bg-yellow-900/40 text-yellow-400 border-yellow-800';
  return 'bg-red-900/40 text-red-400 border-red-800';
}

function getRiskLabel(score: number) {
  if (score < 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  return 'HIGH';
}

export default function CloudAppsPage() {
  const [apps, setApps] = useState<CloudApp[]>([
    { id: '1', name: 'Microsoft 365', vendor: 'Microsoft', category: 'Productivity', riskScore: 18, riskCriteria: { dataSovereignty: 15, dataPrivacySecurity: 20, dlpStrategy: 12, compliance: 25 }, sanctioned: true, domains: ['*.office365.com', '*.microsoft.com', '*.office.com'], usersAccessing: 245, usedInPolicies: 2 },
    { id: '2', name: 'Slack', vendor: 'Salesforce', category: 'Collaboration', riskScore: 25, riskCriteria: { dataSovereignty: 20, dataPrivacySecurity: 28, dlpStrategy: 22, compliance: 30 }, sanctioned: true, domains: ['*.slack.com', '*.slack-edge.com'], usersAccessing: 198, usedInPolicies: 2 },
    { id: '3', name: 'GitHub', vendor: 'Microsoft', category: 'Development', riskScore: 22, riskCriteria: { dataSovereignty: 20, dataPrivacySecurity: 24, dlpStrategy: 20, compliance: 24 }, sanctioned: true, domains: ['*.github.com', '*.githubusercontent.com'], usersAccessing: 87, usedInPolicies: 2 },
    { id: '4', name: 'Jira', vendor: 'Atlassian', category: 'Project Management', riskScore: 24, riskCriteria: { dataSovereignty: 22, dataPrivacySecurity: 26, dlpStrategy: 22, compliance: 26 }, sanctioned: true, domains: ['*.atlassian.net', '*.jira.com'], usersAccessing: 112, usedInPolicies: 2 },
    { id: '5', name: 'Salesforce', vendor: 'Salesforce', category: 'CRM', riskScore: 20, riskCriteria: { dataSovereignty: 18, dataPrivacySecurity: 22, dlpStrategy: 18, compliance: 22 }, sanctioned: true, domains: ['*.salesforce.com', '*.force.com'], usersAccessing: 65, usedInPolicies: 0 },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editApp, setEditApp] = useState<CloudApp | null>(null);
  const [customApp, setCustomApp] = useState({ name: '', vendor: '', category: 'SaaS', domains: '', aiAnalyzing: false, aiScore: 0 });

  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addedAppNames = new Set(apps.map(a => a.name));

  const handleAddPreset = (preset: typeof RISK_PRESET_APPS[number]) => {
    setApps(prev => [...prev, {
      ...preset,
      id: crypto.randomUUID(),
      sanctioned: true,
      usersAccessing: 0,
      usedInPolicies: 0,
    }]);
  };

  const handleAddCustom = () => {
    if (!customApp.name) return;
    setCustomApp(prev => ({ ...prev, aiAnalyzing: true }));
    setTimeout(() => {
      const score = Math.floor(Math.random() * 40) + 20;
      setApps(prev => [...prev, {
        id: crypto.randomUUID(),
        name: customApp.name,
        vendor: customApp.vendor,
        category: customApp.category,
        riskScore: score,
        riskCriteria: { dataSovereignty: score, dataPrivacySecurity: score, dlpStrategy: score, compliance: score },
        sanctioned: false,
        domains: customApp.domains.split('\n').map(d => d.trim()).filter(Boolean),
        usersAccessing: 0,
        usedInPolicies: 0,
      }]);
      setCustomApp({ name: '', vendor: '', category: 'SaaS', domains: '', aiAnalyzing: false, aiScore: 0 });
      setShowCustomForm(false);
      setShowAddModal(false);
    }, 2000);
  };

  const toggleSanctioned = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, sanctioned: !a.sanctioned } : a));
  };

  const saveApp = () => {
    if (!editApp) return;
    setApps(prev => prev.map(a => a.id === editApp.id ? editApp : a));
    setEditApp(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe size={24} className="text-purple-400" />
          <div>
            <h1 className="text-xl font-semibold">Cloud Applications</h1>
            <p className="text-sm text-gray-500">SaaS application inventory, risk rating, and sanctioning</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Application
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3">
        {[
          { label: 'Total Apps', count: apps.length, color: 'bg-gray-800 text-gray-300' },
          { label: 'Sanctioned', count: apps.filter(a => a.sanctioned).length, color: 'bg-green-900/30 text-green-400' },
          { label: 'Unsanctioned', count: apps.filter(a => !a.sanctioned).length, color: 'bg-yellow-900/30 text-yellow-400' },
          { label: 'High Risk', count: apps.filter(a => a.riskScore > 60).length, color: 'bg-red-900/30 text-red-400' },
        ].map(chip => (
          <div key={chip.label} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${chip.color}`}>
            {chip.label}: {chip.count}
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search applications..."
          className="w-full pl-9 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Application</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-center">Risk Score</th>
              <th className="px-4 py-3 text-center">Sanctioned</th>
              <th className="px-4 py-3 text-right">Users</th>
              <th className="px-4 py-3 text-center">Policies</th>
              <th className="w-20 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filtered.map(app => (
              <tr key={app.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-blue-400" />
                    <span className="font-medium">{app.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{app.vendor}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-xs">{app.category}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${getRiskBadge(app.riskScore)}`}>
                    {app.riskScore} — {getRiskLabel(app.riskScore)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleSanctioned(app.id)}
                    className={`w-8 h-4 rounded-full transition-colors relative ${app.sanctioned ? 'bg-green-600' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${app.sanctioned ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-right text-gray-400">{app.usersAccessing}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 text-xs">{app.usedInPolicies}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditApp({ ...app })} className="p-1 text-gray-500 hover:text-blue-400 transition-colors" title="Edit"><Pencil size={14} /></button>
                    <button className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Risk-Scored Add Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setShowAddModal(false); setShowCustomForm(false); }} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] max-h-[85vh] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain size={18} className="text-purple-400" />
                  <h3 className="text-lg font-semibold">Add Cloud Application</h3>
                </div>
                <button onClick={() => { setShowAddModal(false); setShowCustomForm(false); }} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Risk-scored by the <span className="text-purple-400">Continuous Risk & Trust Scored Adaptive Engine</span>
              </p>
              <div className="flex gap-4 mt-3 text-[10px]">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-gray-400">Low Risk (&lt;30)</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-gray-400">Medium Risk (30-60)</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-gray-400">High Risk (&gt;60)</span></div>
              </div>
            </div>

            {/* Scrollable App List */}
            <div className="flex-1 overflow-y-auto px-6 py-3">
              {!showCustomForm ? (
                <div className="space-y-2">
                  {RISK_PRESET_APPS.map((preset) => {
                    const isAdded = addedAppNames.has(preset.name);
                    return (
                      <div key={preset.name} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-700/50 hover:border-gray-600 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-200">{preset.name}</span>
                            <span className="text-[10px] text-gray-500">{preset.vendor}</span>
                            <span className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 text-[9px]">{preset.category}</span>
                          </div>
                          {/* Risk Criteria Breakdown */}
                          <div className="flex gap-3 mt-1.5">
                            {[
                              { label: 'Data Sovereignty', value: preset.riskCriteria.dataSovereignty },
                              { label: 'Data Privacy & Security', value: preset.riskCriteria.dataPrivacySecurity },
                              { label: 'DLP Strategy', value: preset.riskCriteria.dlpStrategy },
                              { label: 'Compliance', value: preset.riskCriteria.compliance },
                            ].map(c => (
                              <div key={c.label} className="flex items-center gap-1 text-[9px]">
                                <span className="text-gray-500">{c.label}:</span>
                                <span className={c.value < 30 ? 'text-green-400' : c.value <= 60 ? 'text-yellow-400' : 'text-red-400'}>{c.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Risk Score Badge */}
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getRiskBadge(preset.riskScore)}`}>
                          {preset.riskScore}
                        </span>
                        <button
                          onClick={() => handleAddPreset(preset)}
                          disabled={isAdded}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isAdded
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                        >
                          {isAdded ? 'Added' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Custom App Form with AI Analysis */
                <div className="space-y-3 py-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={14} className="text-purple-400" />
                    <span className="text-xs font-medium text-purple-400">AI Risk Analysis</span>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">App Name</label>
                    <input value={customApp.name} onChange={e => setCustomApp({ ...customApp, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="e.g. Notion" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Vendor</label>
                    <input value={customApp.vendor} onChange={e => setCustomApp({ ...customApp, vendor: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="e.g. Notion Labs" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Category</label>
                      <select value={customApp.category} onChange={e => setCustomApp({ ...customApp, category: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                        <option>Productivity</option>
                        <option>Collaboration</option>
                        <option>Development</option>
                        <option>CRM</option>
                        <option>File Sharing</option>
                        <option>AI/ML</option>
                        <option>SaaS</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Domains (one per line)</label>
                      <textarea value={customApp.domains} onChange={e => setCustomApp({ ...customApp, domains: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50 resize-none" placeholder={"*.notion.so\nnotion.com"} />
                    </div>
                  </div>
                  {customApp.aiAnalyzing && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <Brain size={14} className="text-purple-400 animate-pulse" />
                      <span className="text-xs text-purple-300">AI analyzing risk score across Data Sovereignty, Privacy, DLP, and Compliance...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              {!showCustomForm ? (
                <>
                  <button onClick={() => { setShowAddModal(false); }} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
                  <button onClick={() => setShowCustomForm(true)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5">
                    <Plus size={14} />
                    Can&apos;t find your app?
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setShowCustomForm(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Back to List</button>
                  <button onClick={handleAddCustom} disabled={!customApp.name.trim() || customApp.aiAnalyzing} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5">
                    <Brain size={14} />
                    {customApp.aiAnalyzing ? 'Analyzing...' : 'Add with AI Risk Score'}
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Edit modal */}
      {editApp && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditApp(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Application</h3>
              <button onClick={() => setEditApp(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={editApp.name} onChange={e => setEditApp({ ...editApp, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Vendor</label>
                <input value={editApp.vendor} onChange={e => setEditApp({ ...editApp, vendor: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <select value={editApp.category} onChange={e => setEditApp({ ...editApp, category: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option>Productivity</option>
                    <option>Collaboration</option>
                    <option>Development</option>
                    <option>CRM</option>
                    <option>File Sharing</option>
                    <option>AI/ML</option>
                    <option>Project Management</option>
                    <option>SaaS</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Risk Score</label>
                  <input type="number" value={editApp.riskScore} onChange={e => setEditApp({ ...editApp, riskScore: Number(e.target.value) })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Domains (one per line)</label>
                <textarea value={editApp.domains.join('\n')} onChange={e => setEditApp({ ...editApp, domains: e.target.value.split('\n').map(d => d.trim()).filter(Boolean) })} rows={4} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50 resize-none" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Sanctioned</span>
                <button onClick={() => setEditApp({ ...editApp, sanctioned: !editApp.sanctioned })} className={`w-8 h-4 rounded-full transition-colors relative ${editApp.sanctioned ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${editApp.sanctioned ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditApp(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={saveApp} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Save</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
