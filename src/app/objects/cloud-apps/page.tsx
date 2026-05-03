'use client';
import { useState } from 'react';
import { Globe, Plus, Pencil, Trash2, Search, Shield, X } from 'lucide-react';

interface CloudApp {
  id: string;
  name: string;
  vendor: string;
  category: string;
  risk: 'low' | 'medium' | 'high';
  sanctioned: boolean;
  domains: string[];
  usersAccessing: number;
  usedInPolicies: number;
}

const demoApps: CloudApp[] = [
  { id: '1', name: 'Microsoft 365', vendor: 'Microsoft', category: 'Productivity', risk: 'low', sanctioned: true, domains: ['*.office365.com', '*.microsoft.com', '*.office.com'], usersAccessing: 245, usedInPolicies: 2 },
  { id: '2', name: 'Slack', vendor: 'Salesforce', category: 'Collaboration', risk: 'low', sanctioned: true, domains: ['*.slack.com', '*.slack-edge.com'], usersAccessing: 198, usedInPolicies: 2 },
  { id: '3', name: 'GitHub', vendor: 'Microsoft', category: 'Development', risk: 'low', sanctioned: true, domains: ['*.github.com', '*.githubusercontent.com'], usersAccessing: 87, usedInPolicies: 2 },
  { id: '4', name: 'Jira', vendor: 'Atlassian', category: 'Project Management', risk: 'low', sanctioned: true, domains: ['*.atlassian.net', '*.jira.com'], usersAccessing: 112, usedInPolicies: 2 },
  { id: '5', name: 'Salesforce', vendor: 'Salesforce', category: 'CRM', risk: 'low', sanctioned: true, domains: ['*.salesforce.com', '*.force.com'], usersAccessing: 65, usedInPolicies: 0 },
  { id: '6', name: 'Dropbox', vendor: 'Dropbox', category: 'File Sharing', risk: 'medium', sanctioned: false, domains: ['*.dropbox.com', '*.dropboxapi.com'], usersAccessing: 34, usedInPolicies: 0 },
  { id: '7', name: 'Google Drive', vendor: 'Google', category: 'File Sharing', risk: 'medium', sanctioned: false, domains: ['drive.google.com', '*.googleapis.com'], usersAccessing: 42, usedInPolicies: 0 },
  { id: '8', name: 'ChatGPT', vendor: 'OpenAI', category: 'AI/ML', risk: 'high', sanctioned: false, domains: ['chat.openai.com', '*.openai.com'], usersAccessing: 78, usedInPolicies: 0 },
];

const riskBadge: Record<string, string> = {
  low: 'bg-green-900/40 text-green-400 border-green-800',
  medium: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  high: 'bg-red-900/40 text-red-400 border-red-800',
};

export default function CloudAppsPage() {
  const [apps, setApps] = useState<CloudApp[]>(demoApps);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editApp, setEditApp] = useState<CloudApp | null>(null);
  const [newApp, setNewApp] = useState({ name: '', vendor: '', category: 'SaaS', risk: 'medium', domains: '' });

  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (!newApp.name) return;
    const domainList = newApp.domains.split('\n').map(d => d.trim()).filter(Boolean);
    setApps(prev => [...prev, {
      id: crypto.randomUUID(),
      name: newApp.name,
      vendor: newApp.vendor,
      category: newApp.category,
      risk: newApp.risk as CloudApp['risk'],
      sanctioned: false,
      domains: domainList,
      usersAccessing: 0,
      usedInPolicies: 0,
    }]);
    setNewApp({ name: '', vendor: '', category: 'SaaS', risk: 'medium', domains: '' });
    setShowCreate(false);
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
          onClick={() => setShowCreate(true)}
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
          { label: 'High Risk', count: apps.filter(a => a.risk === 'high').length, color: 'bg-red-900/30 text-red-400' },
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
              <th className="px-4 py-3 text-center">Risk</th>
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
                  <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${riskBadge[app.risk]}`}>
                    {app.risk.toUpperCase()}
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

      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowCreate(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <h3 className="text-lg font-semibold mb-4">Add Cloud Application</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={newApp.name} onChange={e => setNewApp({ ...newApp, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="e.g. Notion" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Vendor</label>
                <input value={newApp.vendor} onChange={e => setNewApp({ ...newApp, vendor: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="e.g. Notion Labs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <select value={newApp.category} onChange={e => setNewApp({ ...newApp, category: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
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
                  <label className="block text-sm text-gray-400 mb-1">Risk</label>
                  <select value={newApp.risk} onChange={e => setNewApp({ ...newApp, risk: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Domains (one per line)</label>
                <textarea value={newApp.domains} onChange={e => setNewApp({ ...newApp, domains: e.target.value })} rows={4} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50 resize-none" placeholder={"*.notion.so\nnotion.com"} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Add</button>
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
                  <label className="block text-sm text-gray-400 mb-1">Risk</label>
                  <select value={editApp.risk} onChange={e => setEditApp({ ...editApp, risk: e.target.value as CloudApp['risk'] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
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
