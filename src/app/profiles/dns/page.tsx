'use client';
import { useState, useEffect, useCallback } from 'react';
import { Network, Plus, Pencil, Trash2, Shield, Eye, X } from 'lucide-react';
import { fetchProfiles, createProfile, updateProfile, deleteProfile, toggleProfile, type ApiProfile } from '@/lib/profile-api';

interface DnsFilterProfile {
  id: string;
  name: string;
  enabled: boolean;
  mode: 'blocklist' | 'allowlist' | 'monitor';
  blockCategories: string[];
  customBlockDomains: string[];
  customAllowDomains: string[];
  safesearch: boolean;
  logQueries: boolean;
  usedInPolicies: number;
  builtin: boolean;
}

function fromApi(p: ApiProfile): DnsFilterProfile {
  const c = p.config as Record<string, unknown>;
  return {
    id: p.id, name: p.name, enabled: p.enabled, builtin: p.builtin,
    mode: (c.mode as DnsFilterProfile['mode']) ?? 'blocklist',
    blockCategories: (c.blockCategories as string[]) ?? [],
    customBlockDomains: (c.customBlockDomains as string[]) ?? [],
    customAllowDomains: (c.customAllowDomains as string[]) ?? [],
    safesearch: (c.safesearch as boolean) ?? false,
    logQueries: (c.logQueries as boolean) ?? true,
    usedInPolicies: 0,
  };
}

function toConfig(p: DnsFilterProfile): Record<string, unknown> {
  return {
    mode: p.mode, blockCategories: p.blockCategories,
    customBlockDomains: p.customBlockDomains, customAllowDomains: p.customAllowDomains,
    safesearch: p.safesearch, logQueries: p.logQueries,
  };
}

const modeBadge: Record<string, { label: string; color: string }> = {
  blocklist: { label: 'Blocklist', color: 'bg-red-900/40 text-red-400 border-red-800' },
  allowlist: { label: 'Allowlist', color: 'bg-green-900/40 text-green-400 border-green-800' },
  monitor: { label: 'Monitor', color: 'bg-yellow-900/40 text-yellow-400 border-yellow-800' },
};

export default function DnsFilterPage() {
  const [profiles, setProfiles] = useState<DnsFilterProfile[]>([]);
  const [viewProfile, setViewProfile] = useState<DnsFilterProfile | null>(null);
  const [editProfile, setEditProfile] = useState<DnsFilterProfile | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newProfile, setNewProfile] = useState<DnsFilterProfile>({
    id: '', name: '', enabled: true, mode: 'blocklist',
    blockCategories: [], customBlockDomains: [], customAllowDomains: [],
    safesearch: false, logQueries: true, usedInPolicies: 0, builtin: false,
  });

  const load = useCallback(async () => {
    try {
      const data = await fetchProfiles('dns');
      setProfiles(data.map(fromApi));
    } catch { /* backend unavailable */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id: string) => {
    const p = profiles.find(x => x.id === id);
    if (!p) return;
    try {
      await toggleProfile('dns', id, !p.enabled);
      setProfiles(prev => prev.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
    } catch { /* ignore */ }
  };

  const saveProfile = async () => {
    if (!editProfile) return;
    try {
      await updateProfile('dns', editProfile.id, {
        name: editProfile.name, enabled: editProfile.enabled,
        config: toConfig(editProfile),
      });
      setProfiles(prev => prev.map(p => p.id === editProfile.id ? editProfile : p));
      setEditProfile(null);
    } catch { /* ignore */ }
  };

  const handleCreate = async () => {
    if (!newProfile.name.trim()) return;
    try {
      const created = await createProfile('dns', {
        name: newProfile.name, enabled: newProfile.enabled,
        config: toConfig(newProfile),
      });
      setProfiles(prev => [...prev, fromApi(created)]);
      setNewProfile({
        id: '', name: '', enabled: true, mode: 'blocklist',
        blockCategories: [], customBlockDomains: [], customAllowDomains: [],
        safesearch: false, logQueries: true, usedInPolicies: 0, builtin: false,
      });
      setShowCreate(false);
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProfile('dns', id);
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network size={24} className="text-green-400" />
          <div>
            <h1 className="text-xl font-semibold">DNS Filter</h1>
            <p className="text-sm text-gray-500">DNS-layer filtering profiles — block malicious and unwanted domains at resolution</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          New Profile
        </button>
      </div>

      {/* Profile cards */}
      <div className="grid grid-cols-1 gap-4">
        {profiles.map(profile => (
          <div key={profile.id} className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${!profile.enabled ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-green-400" />
                <div>
                  <h3 className="font-semibold">{profile.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${modeBadge[profile.mode].color}`}>
                      {modeBadge[profile.mode].label}
                    </span>
                    <span className={`text-xs ${profile.builtin ? 'text-gray-500' : 'text-green-400'}`}>
                      {profile.builtin ? 'Built-in' : 'Custom'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 text-xs">
                  {profile.usedInPolicies} policies
                </span>
                <button
                  onClick={() => handleToggle(profile.id)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${profile.enabled ? 'bg-green-600' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${profile.enabled ? 'left-4' : 'left-0.5'}`} />
                </button>
                <button onClick={() => setViewProfile(profile)} className="p-1 text-gray-500 hover:text-blue-400 transition-colors"><Eye size={14} /></button>
                {!profile.builtin && (
                  <>
                    <button onClick={() => setEditProfile({ ...profile })} className="p-1 text-gray-500 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(profile.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Block Categories</div>
                <span className="text-sm text-gray-300">{profile.blockCategories.length || '—'}</span>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Custom Domains</div>
                <span className="text-sm text-gray-300">{profile.customBlockDomains.length || '—'}</span>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">SafeSearch</div>
                <span className={`text-sm ${profile.safesearch ? 'text-green-400' : 'text-gray-600'}`}>
                  {profile.safesearch ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {profile.blockCategories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {profile.blockCategories.map(cat => (
                  <span key={cat} className="px-2 py-0.5 rounded bg-red-900/20 text-red-300 text-xs border border-red-800/30">{cat}</span>
                ))}
              </div>
            )}

            {profile.customBlockDomains.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-gray-500 mr-1">Custom blocks:</span>
                {profile.customBlockDomains.map(d => (
                  <span key={d} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-xs font-mono">{d}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {viewProfile && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setViewProfile(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Network size={18} className="text-green-400" />
              {viewProfile.name}
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Block Categories</h4>
                <div className="flex flex-wrap gap-1">
                  {viewProfile.blockCategories.length > 0
                    ? viewProfile.blockCategories.map(c => (
                        <span key={c} className="px-2 py-0.5 rounded bg-red-900/30 text-red-300 text-xs">{c}</span>
                      ))
                    : <span className="text-gray-600">None</span>
                  }
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Custom Block Domains</h4>
                <div className="flex flex-wrap gap-1">
                  {viewProfile.customBlockDomains.length > 0
                    ? viewProfile.customBlockDomains.map(d => (
                        <span key={d} className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-xs font-mono">{d}</span>
                      ))
                    : <span className="text-gray-600">None</span>
                  }
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Allow Exceptions</h4>
                <div className="flex flex-wrap gap-1">
                  {viewProfile.customAllowDomains.length > 0
                    ? viewProfile.customAllowDomains.map(d => (
                        <span key={d} className="px-2 py-0.5 rounded bg-green-900/30 text-green-300 text-xs font-mono">{d}</span>
                      ))
                    : <span className="text-gray-600">None</span>
                  }
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-500">SafeSearch: <span className={viewProfile.safesearch ? 'text-green-400' : 'text-gray-600'}>{viewProfile.safesearch ? 'Enabled' : 'Disabled'}</span></span>
                <span className="text-gray-500">Log queries: <span className={viewProfile.logQueries ? 'text-green-400' : 'text-gray-600'}>{viewProfile.logQueries ? 'Yes' : 'No'}</span></span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setViewProfile(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Close</button>
            </div>
          </div>
        </>
      )}

      {/* Edit modal */}
      {editProfile && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditProfile(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit DNS Filter Profile</h3>
              <button onClick={() => setEditProfile(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={editProfile.name} onChange={e => setEditProfile({ ...editProfile, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mode</label>
                <select value={editProfile.mode} onChange={e => setEditProfile({ ...editProfile, mode: e.target.value as DnsFilterProfile['mode'] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="blocklist">Blocklist</option>
                  <option value="allowlist">Allowlist</option>
                  <option value="monitor">Monitor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Block categories (comma-separated)</label>
                <input value={editProfile.blockCategories.join(', ')} onChange={e => setEditProfile({ ...editProfile, blockCategories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Custom block domains (one per line)</label>
                <textarea value={editProfile.customBlockDomains.join('\n')} onChange={e => setEditProfile({ ...editProfile, customBlockDomains: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} rows={3} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50 resize-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Allow exceptions (one per line)</label>
                <textarea value={editProfile.customAllowDomains.join('\n')} onChange={e => setEditProfile({ ...editProfile, customAllowDomains: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} rows={3} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50 resize-none" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">SafeSearch</span>
                <button onClick={() => setEditProfile({ ...editProfile, safesearch: !editProfile.safesearch })} className={`w-8 h-4 rounded-full transition-colors relative ${editProfile.safesearch ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${editProfile.safesearch ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Log queries</span>
                <button onClick={() => setEditProfile({ ...editProfile, logQueries: !editProfile.logQueries })} className={`w-8 h-4 rounded-full transition-colors relative ${editProfile.logQueries ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${editProfile.logQueries ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditProfile(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={saveProfile} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Save</button>
            </div>
          </div>
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowCreate(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create DNS Filter Profile</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Profile Name</label>
                <input value={newProfile.name} onChange={e => setNewProfile({ ...newProfile, name: e.target.value })} placeholder="e.g. Custom-DNS-Block" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mode</label>
                <select value={newProfile.mode} onChange={e => setNewProfile({ ...newProfile, mode: e.target.value as DnsFilterProfile['mode'] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="blocklist">Blocklist</option>
                  <option value="allowlist">Allowlist</option>
                  <option value="monitor">Monitor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Block Categories (comma-separated)</label>
                <input value={newProfile.blockCategories.join(', ')} onChange={e => setNewProfile({ ...newProfile, blockCategories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Malware, Phishing, C2" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Custom Block Domains (one per line)</label>
                <textarea value={newProfile.customBlockDomains.join('\n')} onChange={e => setNewProfile({ ...newProfile, customBlockDomains: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} rows={3} placeholder="banned-site.com\n*.sketchy-domain.xyz" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50 resize-none" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">SafeSearch</span>
                <button onClick={() => setNewProfile({ ...newProfile, safesearch: !newProfile.safesearch })} className={`w-8 h-4 rounded-full transition-colors relative ${newProfile.safesearch ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${newProfile.safesearch ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={!newProfile.name.trim()} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors">Create Profile</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
