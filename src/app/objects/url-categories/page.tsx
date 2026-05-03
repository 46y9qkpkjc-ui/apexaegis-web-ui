'use client';
import { useState } from 'react';
import { Network, Plus, Pencil, Trash2, Search, Shield, X } from 'lucide-react';

interface UrlCategory {
  id: string;
  name: string;
  type: 'builtin' | 'custom';
  action: 'allow' | 'block' | 'monitor';
  domainCount: number;
  description: string;
  usedInPolicies: number;
}

const demoCategories: UrlCategory[] = [
  { id: '1', name: 'Malware', type: 'builtin', action: 'block', domainCount: 248500, description: 'Known malware distribution and C2 domains', usedInPolicies: 3 },
  { id: '2', name: 'Phishing', type: 'builtin', action: 'block', domainCount: 185200, description: 'Credential phishing and social engineering sites', usedInPolicies: 3 },
  { id: '3', name: 'Spyware', type: 'builtin', action: 'block', domainCount: 42300, description: 'Spyware and adware distribution', usedInPolicies: 2 },
  { id: '4', name: 'Cryptomining', type: 'builtin', action: 'block', domainCount: 18700, description: 'Browser-based cryptocurrency mining', usedInPolicies: 2 },
  { id: '5', name: 'Newly Registered Domains', type: 'builtin', action: 'block', domainCount: 1250000, description: 'Domains registered within the last 30 days', usedInPolicies: 1 },
  { id: '6', name: 'Newly Observed Domains', type: 'builtin', action: 'block', domainCount: 890000, description: 'Domains first seen in DNS within 7 days', usedInPolicies: 1 },
  { id: '7', name: 'Adult Content', type: 'builtin', action: 'block', domainCount: 520000, description: 'Adult and explicit content', usedInPolicies: 0 },
  { id: '8', name: 'Gambling', type: 'builtin', action: 'monitor', domainCount: 95000, description: 'Online gambling and betting sites', usedInPolicies: 0 },
  { id: '9', name: 'Social Media', type: 'builtin', action: 'monitor', domainCount: 2400, description: 'Social networking platforms', usedInPolicies: 0 },
  { id: '10', name: 'Blocked Vendors', type: 'custom', action: 'block', domainCount: 15, description: 'Competitor and restricted vendor domains', usedInPolicies: 1 },
];

const actionBadge: Record<string, string> = {
  allow: 'bg-green-900/40 text-green-400 border-green-800',
  block: 'bg-red-900/40 text-red-400 border-red-800',
  monitor: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
};

export default function UrlCategoriesPage() {
  const [categories, setCategories] = useState<UrlCategory[]>(demoCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editCat, setEditCat] = useState<UrlCategory | null>(null);
  const [newCat, setNewCat] = useState({ name: '', action: 'block', description: '', domains: '' });

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (!newCat.name) return;
    const domainLines = newCat.domains.split('\n').filter(Boolean);
    setCategories(prev => [...prev, {
      id: crypto.randomUUID(),
      name: newCat.name,
      type: 'custom',
      action: newCat.action as UrlCategory['action'],
      domainCount: domainLines.length,
      description: newCat.description,
      usedInPolicies: 0,
    }]);
    setNewCat({ name: '', action: 'block', description: '', domains: '' });
    setShowCreate(false);
  };

  const saveCat = () => {
    if (!editCat) return;
    setCategories(prev => prev.map(c => c.id === editCat.id ? editCat : c));
    setEditCat(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network size={24} className="text-orange-400" />
          <div>
            <h1 className="text-xl font-semibold">URL Categories</h1>
            <p className="text-sm text-gray-500">Built-in threat categories and custom URL lists for web filtering</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Custom Category
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full pl-9 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-center">Default Action</th>
              <th className="px-4 py-3 text-right">Domains</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-center">Type</th>
              <th className="px-4 py-3 text-center">Used In</th>
              <th className="w-20 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filtered.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className={cat.action === 'block' ? 'text-red-400' : cat.action === 'monitor' ? 'text-yellow-400' : 'text-green-400'} />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${actionBadge[cat.action]}`}>
                    {cat.action.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-gray-400">{cat.domainCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[250px] truncate">{cat.description}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${cat.type === 'builtin' ? 'bg-gray-800 text-gray-400' : 'bg-green-900/30 text-green-400'}`}>
                    {cat.type === 'builtin' ? 'Built-in' : 'Custom'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 text-xs">{cat.usedInPolicies}</span>
                </td>
                <td className="px-4 py-3">
                  {cat.type === 'custom' && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditCat({ ...cat })} className="p-1 text-gray-500 hover:text-blue-400 transition-colors" title="Edit"><Pencil size={14} /></button>
                      <button className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  )}
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
            <h3 className="text-lg font-semibold mb-4">New Custom URL Category</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="e.g. Blocked Vendors" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Default Action</label>
                <select value={newCat.action} onChange={e => setNewCat({ ...newCat, action: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="block">Block</option>
                  <option value="monitor">Monitor</option>
                  <option value="allow">Allow</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <input value={newCat.description} onChange={e => setNewCat({ ...newCat, description: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="Category description" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Domains (one per line)</label>
                <textarea value={newCat.domains} onChange={e => setNewCat({ ...newCat, domains: e.target.value })} rows={5} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50 resize-none" placeholder={"example.com\n*.malicious.net"} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Create</button>
            </div>
          </div>
        </>
      )}

      {/* Edit modal */}
      {editCat && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditCat(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Category</h3>
              <button onClick={() => setEditCat(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={editCat.name} onChange={e => setEditCat({ ...editCat, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Default Action</label>
                <select value={editCat.action} onChange={e => setEditCat({ ...editCat, action: e.target.value as UrlCategory['action'] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="block">Block</option>
                  <option value="monitor">Monitor</option>
                  <option value="allow">Allow</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <input value={editCat.description} onChange={e => setEditCat({ ...editCat, description: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditCat(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={saveCat} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Save</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
