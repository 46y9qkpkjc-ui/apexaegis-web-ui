'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Monitor, Shield, Plus, Pencil, Trash2, X, Eye,
  CheckCircle, XCircle, Smartphone, Laptop, AlertTriangle,
} from 'lucide-react';
import { fetchProfiles, createProfile, deleteProfile, toggleProfile, type ApiProfile } from '@/lib/profile-api';

/* ─── Types ─────────────────────────────────────────────────── */
interface PostureCheck {
  id: string;
  type: 'os-version' | 'disk-encryption' | 'firewall' | 'antivirus' | 'screen-lock' | 'jailbreak' | 'patch-level' | 'certificate' | 'domain-joined' | 'mfa-enrolled';
  enabled: boolean;
  operator?: 'gte' | 'lte' | 'eq' | 'neq';
  value?: string;
  action: 'block' | 'warn' | 'log';
}

interface DevicePostureProfile {
  id: string;
  name: string;
  description: string;
  platforms: ('windows' | 'macos' | 'linux' | 'ios' | 'android')[];
  checks: PostureCheck[];
  enabled: boolean;
  assignedGroups: string[];
  matchType: 'all' | 'any';
  lastEvaluated: string;
  compliantDevices: number;
  totalDevices: number;
}

/* ─── Demo data ─────────────────────────────────────────────── */
const checkTypes: Record<string, { label: string; description: string }> = {
  'os-version': { label: 'OS Version', description: 'Require minimum operating system version' },
  'disk-encryption': { label: 'Disk Encryption', description: 'Require BitLocker / FileVault / LUKS' },
  'firewall': { label: 'Firewall Enabled', description: 'Host firewall must be active' },
  'antivirus': { label: 'Antivirus Running', description: 'Endpoint protection must be active and updated' },
  'screen-lock': { label: 'Screen Lock', description: 'Screen lock within specified timeout' },
  'jailbreak': { label: 'Jailbreak Detection', description: 'Block jailbroken / rooted devices' },
  'patch-level': { label: 'Patch Level', description: 'Security patches within specified window' },
  'certificate': { label: 'Client Certificate', description: 'Valid client certificate installed' },
  'domain-joined': { label: 'Domain Joined', description: 'Device must be joined to corporate domain' },
  'mfa-enrolled': { label: 'MFA Enrolled', description: 'User MFA enrollment required on device' },
};

function fromApi(p: ApiProfile): DevicePostureProfile {
  const c = p.config as Record<string, unknown>;
  return {
    id: p.id, name: p.name, enabled: p.enabled,
    description: (c.description as string) ?? '',
    platforms: (c.platforms as DevicePostureProfile['platforms']) ?? [],
    matchType: (c.matchType as DevicePostureProfile['matchType']) ?? 'all',
    checks: (c.checks as PostureCheck[]) ?? [],
    assignedGroups: (c.assignedGroups as string[]) ?? [],
    lastEvaluated: (c.lastEvaluated as string) ?? 'Never',
    compliantDevices: (c.compliantDevices as number) ?? 0,
    totalDevices: (c.totalDevices as number) ?? 0,
  };
}

function toConfig(p: DevicePostureProfile): Record<string, unknown> {
  return {
    description: p.description, platforms: p.platforms, matchType: p.matchType,
    checks: p.checks, assignedGroups: p.assignedGroups,
    lastEvaluated: p.lastEvaluated, compliantDevices: p.compliantDevices, totalDevices: p.totalDevices,
  };
}

/* ═══════════════════════════════════════════════════════════════ */
export default function DevicePosturePage() {
  const [profiles, setProfiles] = useState<DevicePostureProfile[]>([]);
  const [viewProfile, setViewProfile] = useState<DevicePostureProfile | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    description: '',
    platforms: [] as string[],
    matchType: 'all' as 'all' | 'any',
    checks: [] as string[],
  });

  const load = useCallback(async () => {
    try {
      const data = await fetchProfiles('device-posture');
      setProfiles(data.map(fromApi));
    } catch { /* backend unavailable */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newProfile.name) return;
    const profile: DevicePostureProfile = {
      id: '',
      name: newProfile.name,
      description: newProfile.description,
      platforms: newProfile.platforms as DevicePostureProfile['platforms'],
      matchType: newProfile.matchType,
      enabled: true,
      assignedGroups: [],
      lastEvaluated: 'Never',
      compliantDevices: 0,
      totalDevices: 0,
      checks: newProfile.checks.map((type, i) => ({
        id: `new-${i}`,
        type: type as PostureCheck['type'],
        enabled: true,
        action: 'block' as const,
      })),
    };
    try {
      const created = await createProfile('device-posture', {
        name: profile.name, enabled: true,
        config: toConfig(profile),
      });
      setProfiles(prev => [...prev, fromApi(created)]);
      setNewProfile({ name: '', description: '', platforms: [], matchType: 'all', checks: [] });
      setShowCreate(false);
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProfile('device-posture', id);
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch { /* ignore */ }
  };

  const handleToggle = async (id: string) => {
    const p = profiles.find(x => x.id === id);
    if (!p) return;
    try {
      await toggleProfile('device-posture', id, !p.enabled);
      setProfiles(prev => prev.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
    } catch { /* ignore */ }
  };

  const togglePlatform = (platform: string) => {
    setNewProfile(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const toggleCheck = (checkType: string) => {
    setNewProfile(prev => ({
      ...prev,
      checks: prev.checks.includes(checkType)
        ? prev.checks.filter(c => c !== checkType)
        : [...prev.checks, checkType],
    }));
  };

  const totalDevices = profiles.reduce((s, p) => s + p.totalDevices, 0);
  const totalCompliant = profiles.reduce((s, p) => s + p.compliantDevices, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monitor size={24} className="text-cyan-400" />
          <div>
            <h1 className="text-xl font-semibold">Device Posture Profiles</h1>
            <p className="text-sm text-gray-500">Define compliance requirements for endpoint devices before granting access</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Profile
        </button>
      </div>

      {/* Summary */}
      <div className="flex gap-3">
        <div className="px-3 py-1.5 rounded-lg bg-gray-800 text-sm">Profiles: <span className="text-white font-medium">{profiles.length}</span></div>
        <div className="px-3 py-1.5 rounded-lg bg-green-900/20 text-green-400 text-sm flex items-center gap-1">
          <CheckCircle size={12} /> Compliant: {totalCompliant}/{totalDevices}
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 text-sm flex items-center gap-1">
          <AlertTriangle size={12} /> Non-compliant: {totalDevices - totalCompliant}
        </div>
      </div>

      {/* Profile cards */}
      <div className="grid grid-cols-1 gap-4">
        {profiles.map(profile => {
          const complianceRate = profile.totalDevices > 0  ? Math.round((profile.compliantDevices / profile.totalDevices) * 100) : 0;
          return (
            <div key={profile.id} className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${!profile.enabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-cyan-400" />
                  <div>
                    <h3 className="font-semibold text-sm">{profile.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{profile.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewProfile(profile)} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors" title="View details"><Eye size={14} /></button>
                  <button onClick={() => handleDelete(profile.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={14} /></button>
                  <button onClick={() => handleToggle(profile.id)} className={`w-8 h-4 rounded-full transition-colors relative ${profile.enabled ? 'bg-green-600' : 'bg-gray-700'}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${profile.enabled ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Platforms + Match + Groups */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {profile.platforms.map(p => (
                  <span key={p} className={`px-2 py-0.5 rounded text-xs font-medium border ${platformIcons[p].color}`}>{platformIcons[p].label}</span>
                ))}
                <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-xs">Match: {profile.matchType.toUpperCase()}</span>
                {profile.assignedGroups.map(g => (
                  <span key={g} className="px-2 py-0.5 rounded bg-purple-900/20 text-purple-300 text-xs border border-purple-800/30">{g}</span>
                ))}
              </div>

              {/* Checks summary */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {profile.checks.filter(c => c.enabled).map(check => (
                  <span key={check.id} className={`px-2 py-0.5 rounded text-xs font-medium border ${actionColor[check.action]}`}>
                    {checkTypes[check.type]?.label || check.type}
                  </span>
                ))}
              </div>

              {/* Compliance bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${complianceRate >= 90 ? 'bg-green-500' : complianceRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${complianceRate}%` }} />
                </div>
                <span className="text-xs text-gray-400">{profile.compliantDevices}/{profile.totalDevices} ({complianceRate}%)</span>
                <span className="text-xs text-gray-600">Evaluated: {profile.lastEvaluated}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* View modal */}
      {viewProfile && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setViewProfile(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{viewProfile.name}</h3>
              <button onClick={() => setViewProfile(null)} className="text-gray-400 hover:text-gray-200"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">{viewProfile.description}</p>
            <div className="space-y-2">
              {viewProfile.checks.map(check => (
                <div key={check.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{checkTypes[check.type]?.label}</div>
                    <div className="text-xs text-gray-500">{checkTypes[check.type]?.description}</div>
                    {check.value && <div className="text-xs text-gray-400 mt-0.5">Requirement: {check.operator} {check.value}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${actionColor[check.action]}`}>{check.action}</span>
                    {check.enabled ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-gray-600" />}
                  </div>
                </div>
              ))}
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
              <h3 className="text-lg font-semibold">New Device Posture Profile</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-200"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Profile Name</label>
                <input value={newProfile.name} onChange={e => setNewProfile(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="e.g. BYOD Mobile" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <input value={newProfile.description} onChange={e => setNewProfile(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(platformIcons).map(([key, val]) => (
                    <button key={key} onClick={() => togglePlatform(key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${newProfile.platforms.includes(key) ? val.color : 'bg-gray-800 border-gray-700 text-gray-500'}`}>{val.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Match Type</label>
                <div className="flex gap-2">
                  {(['all', 'any'] as const).map(m => (
                    <button key={m} onClick={() => setNewProfile(p => ({ ...p, matchType: m }))} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${newProfile.matchType === m ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>{m === 'all' ? 'ALL checks must pass' : 'ANY check can pass'}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Posture Checks</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(checkTypes).map(([key, val]) => (
                    <button key={key} onClick={() => toggleCheck(key)} className={`text-left p-2.5 rounded-lg border transition-colors ${newProfile.checks.includes(key) ? 'bg-cyan-900/20 border-cyan-700 text-cyan-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                      <div className="text-xs font-medium">{val.label}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{val.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
                <button onClick={handleCreate} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Create Profile</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
