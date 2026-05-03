'use client';
import { useState, useEffect, useCallback } from 'react';
import { Bug, Plus, Pencil, Trash2, Shield, AlertTriangle, Eye, X } from 'lucide-react';
import { fetchProfiles, createProfile, updateProfile, deleteProfile, toggleProfile, type ApiProfile } from '@/lib/profile-api';

interface AtpProfile {
  id: string;
  name: string;
  enabled: boolean;
  antivirusAction: 'block' | 'alert' | 'allow';
  sandboxAction: 'block' | 'alert' | 'allow';
  ipsAction: 'block' | 'alert' | 'allow';
  fileTypeBlocking: string[];
  scanProtocols: string[];
  sandboxFileTypes: string[];
  usedInPolicies: number;
  builtin: boolean;
}

function fromApi(p: ApiProfile): AtpProfile {
  const c = p.config as Record<string, unknown>;
  return {
    id: p.id, name: p.name, enabled: p.enabled, builtin: p.builtin,
    antivirusAction: (c.antivirusAction as AtpProfile['antivirusAction']) ?? 'block',
    sandboxAction: (c.sandboxAction as AtpProfile['sandboxAction']) ?? 'alert',
    ipsAction: (c.ipsAction as AtpProfile['ipsAction']) ?? 'block',
    fileTypeBlocking: (c.fileTypeBlocking as string[]) ?? [],
    scanProtocols: (c.scanProtocols as string[]) ?? [],
    sandboxFileTypes: (c.sandboxFileTypes as string[]) ?? [],
    usedInPolicies: 0,
  };
}

function toConfig(p: AtpProfile): Record<string, unknown> {
  return {
    antivirusAction: p.antivirusAction,
    sandboxAction: p.sandboxAction,
    ipsAction: p.ipsAction,
    fileTypeBlocking: p.fileTypeBlocking,
    scanProtocols: p.scanProtocols,
    sandboxFileTypes: p.sandboxFileTypes,
  };
}

const actionBadge: Record<string, string> = {
  block: 'bg-red-900/30 text-red-400 border-red-800',
  alert: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  allow: 'bg-green-900/30 text-green-400 border-green-800',
};

export default function AtpProfilesPage() {
  const [profiles, setProfiles] = useState<AtpProfile[]>([]);
  const [viewProfile, setViewProfile] = useState<AtpProfile | null>(null);
  const [editProfile, setEditProfile] = useState<AtpProfile | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newProfile, setNewProfile] = useState<AtpProfile>({
    id: '', name: '', enabled: true,
    antivirusAction: 'block', sandboxAction: 'alert', ipsAction: 'block',
    fileTypeBlocking: ['exe', 'dll', 'bat'],
    scanProtocols: ['HTTP', 'HTTPS'],
    sandboxFileTypes: ['exe', 'dll', 'pdf'],
    usedInPolicies: 0, builtin: false,
  });

  const load = useCallback(async () => {
    try {
      const data = await fetchProfiles('atp');
      setProfiles(data.map(fromApi));
    } catch { /* backend unavailable — keep empty */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id: string) => {
    const p = profiles.find(x => x.id === id);
    if (!p) return;
    try {
      await toggleProfile('atp', id, !p.enabled);
      setProfiles(prev => prev.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
    } catch { /* ignore */ }
  };

  const handleCreate = async () => {
    if (!newProfile.name.trim()) return;
    try {
      const created = await createProfile('atp', {
        name: newProfile.name,
        enabled: newProfile.enabled,
        config: toConfig(newProfile) as unknown as Record<string, unknown>,
      });
      setProfiles(prev => [...prev, fromApi(created)]);
      setNewProfile({ id: '', name: '', enabled: true, antivirusAction: 'block', sandboxAction: 'alert', ipsAction: 'block', fileTypeBlocking: ['exe', 'dll', 'bat'], scanProtocols: ['HTTP', 'HTTPS'], sandboxFileTypes: ['exe', 'dll', 'pdf'], usedInPolicies: 0, builtin: false });
      setShowCreate(false);
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProfile('atp', id);
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch { /* ignore */ }
  };

  const saveProfile = async () => {
    if (!editProfile) return;
    try {
      await updateProfile('atp', editProfile.id, {
        name: editProfile.name,
        enabled: editProfile.enabled,
        config: toConfig(editProfile) as unknown as Record<string, unknown>,
      });
      setProfiles(prev => prev.map(p => p.id === editProfile.id ? editProfile : p));
      setEditProfile(null);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bug size={24} className="text-red-400" />
          <div>
            <h1 className="text-xl font-semibold">ATP Profiles</h1>
            <p className="text-sm text-gray-500">Advanced Threat Protection — antivirus, sandbox, and IPS configuration</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          New Profile
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-red-900/10 border border-red-800/30 rounded-xl">
        <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="text-red-300 font-medium">ATP protects against zero-day and advanced threats</p>
          <p className="text-red-500/70 mt-1">
            Each profile controls antivirus scanning, cloud sandbox detonation, and intrusion prevention.
            Attach profiles to security policies to enable threat inspection on matching traffic.
          </p>
        </div>
      </div>

      {/* Profile cards */}
      <div className="grid grid-cols-1 gap-4">
        {profiles.map(profile => (
          <div key={profile.id} className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${!profile.enabled ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-red-400" />
                <div>
                  <h3 className="font-semibold">{profile.name}</h3>
                  <span className={`text-xs ${profile.builtin ? 'text-gray-500' : 'text-green-400'}`}>
                    {profile.builtin ? 'Built-in' : 'Custom'}
                  </span>
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
                <button onClick={() => setViewProfile(profile)} className="p-1 text-gray-500 hover:text-blue-400 transition-colors" title="View Details"><Eye size={14} /></button>
                {!profile.builtin && (
                  <>
                    <button onClick={() => setEditProfile({ ...profile })} className="p-1 text-gray-500 hover:text-blue-400 transition-colors" title="Edit"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(profile.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Antivirus</div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${actionBadge[profile.antivirusAction]}`}>
                  {profile.antivirusAction.toUpperCase()}
                </span>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Sandbox</div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${actionBadge[profile.sandboxAction]}`}>
                  {profile.sandboxAction.toUpperCase()}
                </span>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">IPS</div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${actionBadge[profile.ipsAction]}`}>
                  {profile.ipsAction.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              <span className="text-xs text-gray-500 mr-1">Blocked file types:</span>
              {profile.fileTypeBlocking.length > 0
                ? profile.fileTypeBlocking.map(ft => (
                    <span key={ft} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-xs font-mono">.{ft}</span>
                  ))
                : <span className="text-xs text-gray-600">None</span>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {viewProfile && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setViewProfile(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bug size={18} className="text-red-400" />
              {viewProfile.name}
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Scan Protocols</h4>
                <div className="flex flex-wrap gap-1">
                  {viewProfile.scanProtocols.map(p => (
                    <span key={p} className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 text-xs">{p}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Sandbox File Types</h4>
                <div className="flex flex-wrap gap-1">
                  {viewProfile.sandboxFileTypes.map(ft => (
                    <span key={ft} className="px-2 py-0.5 rounded bg-yellow-900/30 text-yellow-300 text-xs font-mono">.{ft}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Blocked File Extensions</h4>
                <div className="flex flex-wrap gap-1">
                  {viewProfile.fileTypeBlocking.length > 0
                    ? viewProfile.fileTypeBlocking.map(ft => (
                        <span key={ft} className="px-2 py-0.5 rounded bg-red-900/30 text-red-300 text-xs font-mono">.{ft}</span>
                      ))
                    : <span className="text-gray-600">No file type blocking configured</span>
                  }
                </div>
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
              <h3 className="text-lg font-semibold">Edit ATP Profile</h3>
              <button onClick={() => setEditProfile(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={editProfile.name} onChange={e => setEditProfile({ ...editProfile, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Antivirus</label>
                  <select value={editProfile.antivirusAction} onChange={e => setEditProfile({ ...editProfile, antivirusAction: e.target.value as AtpProfile['antivirusAction'] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="block">Block</option>
                    <option value="alert">Alert</option>
                    <option value="allow">Allow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sandbox</label>
                  <select value={editProfile.sandboxAction} onChange={e => setEditProfile({ ...editProfile, sandboxAction: e.target.value as AtpProfile['sandboxAction'] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="block">Block</option>
                    <option value="alert">Alert</option>
                    <option value="allow">Allow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">IPS</label>
                  <select value={editProfile.ipsAction} onChange={e => setEditProfile({ ...editProfile, ipsAction: e.target.value as AtpProfile['ipsAction'] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="block">Block</option>
                    <option value="alert">Alert</option>
                    <option value="allow">Allow</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Blocked file types (comma-separated)</label>
                <input value={editProfile.fileTypeBlocking.join(', ')} onChange={e => setEditProfile({ ...editProfile, fileTypeBlocking: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Scan protocols (comma-separated)</label>
                <input value={editProfile.scanProtocols.join(', ')} onChange={e => setEditProfile({ ...editProfile, scanProtocols: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sandbox file types (comma-separated)</label>
                <input value={editProfile.sandboxFileTypes.join(', ')} onChange={e => setEditProfile({ ...editProfile, sandboxFileTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
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
              <h3 className="text-lg font-semibold">Create ATP Profile</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Profile Name</label>
                <input value={newProfile.name} onChange={e => setNewProfile({ ...newProfile, name: e.target.value })} placeholder="e.g. Custom-ATP-Strict" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(['antivirusAction', 'sandboxAction', 'ipsAction'] as const).map(field => (
                  <div key={field}>
                    <label className="block text-sm text-gray-400 mb-1">{field === 'antivirusAction' ? 'Antivirus' : field === 'sandboxAction' ? 'Sandbox' : 'IPS'}</label>
                    <select value={newProfile[field]} onChange={e => setNewProfile({ ...newProfile, [field]: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                      <option value="block">Block</option>
                      <option value="alert">Alert</option>
                      <option value="allow">Allow</option>
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">File Type Blocking (comma-separated)</label>
                <input value={newProfile.fileTypeBlocking.join(', ')} onChange={e => setNewProfile({ ...newProfile, fileTypeBlocking: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="exe, dll, bat, ps1" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Scan Protocols (comma-separated)</label>
                <input value={newProfile.scanProtocols.join(', ')} onChange={e => setNewProfile({ ...newProfile, scanProtocols: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="HTTP, HTTPS, FTP, SMTP" />
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
