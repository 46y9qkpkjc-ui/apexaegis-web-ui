'use client';
import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Plus, Pencil, Trash2, Shield, Eye, X } from 'lucide-react';
import { fetchProfiles, createProfile, updateProfile, deleteProfile, toggleProfile, type ApiProfile } from '@/lib/profile-api';

interface WebFilterProfile {
  id: string;
  name: string;
  enabled: boolean;
  action: 'block' | 'allow' | 'monitor' | 'warn';
  categories: string[];
  blockPages: boolean;
  blockFileTypes: string[];
  customBlockUrls: string[];
  customAllowUrls: string[];
  logAccess: boolean;
  usedInPolicies: number;
  builtin: boolean;
}

function fromApi(p: ApiProfile): WebFilterProfile {
  const c = p.config as Record<string, unknown>;
  return {
    id: p.id, name: p.name, enabled: p.enabled, builtin: p.builtin,
    action: (c.action as WebFilterProfile['action']) ?? 'block',
    categories: (c.categories as string[]) ?? [],
    blockPages: (c.blockPages as boolean) ?? true,
    blockFileTypes: (c.blockFileTypes as string[]) ?? [],
    customBlockUrls: (c.customBlockUrls as string[]) ?? [],
    customAllowUrls: (c.customAllowUrls as string[]) ?? [],
    logAccess: (c.logAccess as boolean) ?? true,
    usedInPolicies: 0,
  };
}

function toConfig(p: WebFilterProfile): Record<string, unknown> {
  return {
    action: p.action, categories: p.categories, blockPages: p.blockPages,
    blockFileTypes: p.blockFileTypes, customBlockUrls: p.customBlockUrls,
    customAllowUrls: p.customAllowUrls, logAccess: p.logAccess,
  };
}

const actionBadge: Record<string, { label: string; color: string }> = {
  block: { label: 'Block', color: 'bg-red-900/40 text-red-400 border-red-800' },
  allow: { label: 'Allow', color: 'bg-green-900/40 text-green-400 border-green-800' },
  monitor: { label: 'Monitor', color: 'bg-yellow-900/40 text-yellow-400 border-yellow-800' },
  warn: { label: 'Warn', color: 'bg-orange-900/40 text-orange-400 border-orange-800' },
};

export default function WebFilterPage() {
  const [profiles, setProfiles] = useState<WebFilterProfile[]>([]);
  const [viewProfile, setViewProfile] = useState<WebFilterProfile | null>(null);
  const [editProfile, setEditProfile] = useState<WebFilterProfile | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newProfile, setNewProfile] = useState<WebFilterProfile>({
    id: '', name: '', enabled: true, action: 'block',
    categories: [], blockPages: true, blockFileTypes: [],
    customBlockUrls: [], customAllowUrls: [],
    logAccess: true, usedInPolicies: 0, builtin: false,
  });

  const load = useCallback(async () => {
    try {
      const data = await fetchProfiles('web');
      setProfiles(data.map(fromApi));
    } catch { /* backend unavailable */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id: string) => {
    const p = profiles.find(x => x.id === id);
    if (!p) return;
    try {
      await toggleProfile('web', id, !p.enabled);
      setProfiles(prev => prev.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
    } catch { /* ignore */ }
  };

  const saveProfile = async () => {
    if (!editProfile) return;
    try {
      await updateProfile('web', editProfile.id, {
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
      const created = await createProfile('web', {
        name: newProfile.name, enabled: newProfile.enabled,
        config: toConfig(newProfile),
      });
      setProfiles(prev => [...prev, fromApi(created)]);
      setNewProfile({
        id: '', name: '', enabled: true, action: 'block',
        categories: [], blockPages: true, blockFileTypes: [],
        customBlockUrls: [], customAllowUrls: [],
        logAccess: true, usedInPolicies: 0, builtin: false,
      });
      setShowCreate(false);
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProfile('web', id);
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle size={24} className="text-orange-400" />
          <div>
            <h1 className="text-xl font-semibold">Web Filter</h1>
            <p className="text-sm text-gray-500">URL & content filtering profiles — control web access by category, URL, and file type</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          New Profile
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-orange-900/20 border border-orange-800/40 rounded-xl p-4 flex items-start gap-3 text-sm text-orange-300">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <div>
          <span className="font-medium">Web Filter profiles</span> inspect HTTP/HTTPS traffic to enforce acceptable use policies.
          Combine with <span className="text-white font-medium">SSL Inspection</span> for full visibility into encrypted traffic.
        </div>
      </div>

      {/* Profile cards */}
      <div className="grid grid-cols-1 gap-4">
        {profiles.map(profile => (
          <div key={profile.id} className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${!profile.enabled ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-orange-400" />
                <div>
                  <h3 className="font-semibold">{profile.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${actionBadge[profile.action].color}`}>
                      {actionBadge[profile.action].label}
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
                <div className="text-xs text-gray-500 mb-1">Categories</div>
                <span className="text-sm text-gray-300">{profile.categories.length}</span>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Blocked File Types</div>
                <span className="text-sm text-gray-300">{profile.blockFileTypes.length || '—'}</span>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Block Page</div>
                <span className={`text-sm ${profile.blockPages ? 'text-green-400' : 'text-gray-600'}`}>
                  {profile.blockPages ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {profile.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {profile.categories.map(cat => (
                  <span key={cat} className="px-2 py-0.5 rounded bg-red-900/20 text-red-300 text-xs border border-red-800/30">{cat}</span>
                ))}
              </div>
            )}

            {profile.blockFileTypes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-gray-500 mr-1">Blocked extensions:</span>
                {profile.blockFileTypes.map(ft => (
                  <span key={ft} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-xs font-mono">.{ft}</span>
                ))}
              </div>
            )}

            {profile.customBlockUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-gray-500 mr-1">Custom blocks:</span>
                {profile.customBlockUrls.map(u => (
                  <span key={u} className="px-1.5 py-0.5 rounded bg-red-900/20 text-red-300 text-xs font-mono">{u}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {viewProfile && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setViewProfile(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-400" />
              {viewProfile.name}
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Filtered Categories</h4>
                <div className="flex flex-wrap gap-1">
                  {viewProfile.categories.length > 0
                    ? viewProfile.categories.map(c => (
                        <span key={c} className="px-2 py-0.5 rounded bg-red-900/30 text-red-300 text-xs">{c}</span>
                      ))
                    : <span className="text-gray-600">None</span>
                  }
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Blocked File Types</h4>
                <div className="flex flex-wrap gap-1">
                  {viewProfile.blockFileTypes.length > 0
                    ? viewProfile.blockFileTypes.map(ft => (
                        <span key={ft} className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-xs font-mono">.{ft}</span>
                      ))
                    : <span className="text-gray-600">None</span>
                  }
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Custom Block URLs</h4>
                <div className="flex flex-wrap gap-1">
                  {viewProfile.customBlockUrls.length > 0
                    ? viewProfile.customBlockUrls.map(u => (
                        <span key={u} className="px-2 py-0.5 rounded bg-red-900/30 text-red-300 text-xs font-mono">{u}</span>
                      ))
                    : <span className="text-gray-600">None</span>
                  }
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Allow Exceptions</h4>
                <div className="flex flex-wrap gap-1">
                  {viewProfile.customAllowUrls.length > 0
                    ? viewProfile.customAllowUrls.map(u => (
                        <span key={u} className="px-2 py-0.5 rounded bg-green-900/30 text-green-300 text-xs font-mono">{u}</span>
                      ))
                    : <span className="text-gray-600">None</span>
                  }
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-500">Block page: <span className={viewProfile.blockPages ? 'text-green-400' : 'text-gray-600'}>{viewProfile.blockPages ? 'Enabled' : 'Disabled'}</span></span>
                <span className="text-gray-500">Log access: <span className={viewProfile.logAccess ? 'text-green-400' : 'text-gray-600'}>{viewProfile.logAccess ? 'Yes' : 'No'}</span></span>
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
              <h3 className="text-lg font-semibold">Edit Web Filter Profile</h3>
              <button onClick={() => setEditProfile(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={editProfile.name} onChange={e => setEditProfile({ ...editProfile, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Action</label>
                <select value={editProfile.action} onChange={e => setEditProfile({ ...editProfile, action: e.target.value as WebFilterProfile['action'] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="block">Block</option>
                  <option value="allow">Allow</option>
                  <option value="monitor">Monitor</option>
                  <option value="warn">Warn</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Categories (comma-separated)</label>
                <input value={editProfile.categories.join(', ')} onChange={e => setEditProfile({ ...editProfile, categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Blocked file types (comma-separated)</label>
                <input value={editProfile.blockFileTypes.join(', ')} onChange={e => setEditProfile({ ...editProfile, blockFileTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Custom block URLs (one per line)</label>
                <textarea value={editProfile.customBlockUrls.join('\n')} onChange={e => setEditProfile({ ...editProfile, customBlockUrls: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} rows={3} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50 resize-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Allow exceptions (one per line)</label>
                <textarea value={editProfile.customAllowUrls.join('\n')} onChange={e => setEditProfile({ ...editProfile, customAllowUrls: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} rows={3} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50 resize-none" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Show block page</span>
                <button onClick={() => setEditProfile({ ...editProfile, blockPages: !editProfile.blockPages })} className={`w-8 h-4 rounded-full transition-colors relative ${editProfile.blockPages ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${editProfile.blockPages ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Log access</span>
                <button onClick={() => setEditProfile({ ...editProfile, logAccess: !editProfile.logAccess })} className={`w-8 h-4 rounded-full transition-colors relative ${editProfile.logAccess ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${editProfile.logAccess ? 'left-4' : 'left-0.5'}`} />
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
              <h3 className="text-lg font-semibold">Create Web Filter Profile</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Profile Name</label>
                <input value={newProfile.name} onChange={e => setNewProfile({ ...newProfile, name: e.target.value })} placeholder="e.g. Custom-Web-Policy" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Action</label>
                <select value={newProfile.action} onChange={e => setNewProfile({ ...newProfile, action: e.target.value as WebFilterProfile['action'] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="block">Block</option>
                  <option value="allow">Allow</option>
                  <option value="monitor">Monitor</option>
                  <option value="warn">Warn</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Categories (comma-separated)</label>
                <input value={newProfile.categories.join(', ')} onChange={e => setNewProfile({ ...newProfile, categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Malware, Phishing, Social Media" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Blocked File Types (comma-separated)</label>
                <input value={newProfile.blockFileTypes.join(', ')} onChange={e => setNewProfile({ ...newProfile, blockFileTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="exe, bat, msi" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Custom Block URLs (one per line)</label>
                <textarea value={newProfile.customBlockUrls.join('\n')} onChange={e => setNewProfile({ ...newProfile, customBlockUrls: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} rows={3} placeholder="*.tiktok.com\n*.reddit.com" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50 resize-none" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Show Block Page</span>
                <button onClick={() => setNewProfile({ ...newProfile, blockPages: !newProfile.blockPages })} className={`w-8 h-4 rounded-full transition-colors relative ${newProfile.blockPages ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${newProfile.blockPages ? 'left-4' : 'left-0.5'}`} />
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
