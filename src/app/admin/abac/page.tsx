'use client';
import { useState } from 'react';
import { ShieldCheck, Plus, Pencil, Trash2, X, Lock, Users, Eye } from 'lucide-react';

interface AbacRule {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  subjectAttributes: { role: string[]; department: string[]; clearance: string };
  resourceAttributes: { type: string[]; sensitivity: string };
  environmentAttributes: { timeRestriction: string; ipRange: string; mfaRequired: boolean };
  action: 'allow' | 'deny';
  permissions: string[];
}

const demoRules: AbacRule[] = [
  {
    id: '1', name: 'Super Admin Full Access', enabled: true,
    description: 'Full platform access for super administrators',
    subjectAttributes: { role: ['super-admin'], department: ['IT Security'], clearance: 'top-secret' },
    resourceAttributes: { type: ['all'], sensitivity: 'any' },
    environmentAttributes: { timeRestriction: 'none', ipRange: 'any', mfaRequired: true },
    action: 'allow',
    permissions: ['read', 'write', 'delete', 'admin', 'audit'],
  },
  {
    id: '2', name: 'Security Admin Policy Mgmt', enabled: true,
    description: 'Security admins can manage policies and profiles but not system settings',
    subjectAttributes: { role: ['security-admin'], department: ['IT Security', 'SOC'], clearance: 'secret' },
    resourceAttributes: { type: ['policies', 'profiles', 'identity'], sensitivity: 'high' },
    environmentAttributes: { timeRestriction: 'business-hours', ipRange: '10.0.0.0/8', mfaRequired: true },
    action: 'allow',
    permissions: ['read', 'write', 'delete'],
  },
  {
    id: '3', name: 'Network Admin Gateway Access', enabled: true,
    description: 'Network admins can manage gateways and tunnel configurations',
    subjectAttributes: { role: ['network-admin'], department: ['Network Ops'], clearance: 'confidential' },
    resourceAttributes: { type: ['gateways', 'tunnels', 'sdwan'], sensitivity: 'medium' },
    environmentAttributes: { timeRestriction: 'none', ipRange: 'any', mfaRequired: true },
    action: 'allow',
    permissions: ['read', 'write'],
  },
  {
    id: '4', name: 'Auditor Read-Only', enabled: true,
    description: 'Auditors have read-only access to logs, policies, and reports',
    subjectAttributes: { role: ['auditor'], department: ['Compliance', 'Legal'], clearance: 'confidential' },
    resourceAttributes: { type: ['logs', 'policies', 'reports', 'identity'], sensitivity: 'any' },
    environmentAttributes: { timeRestriction: 'business-hours', ipRange: '10.0.0.0/8', mfaRequired: false },
    action: 'allow',
    permissions: ['read', 'audit'],
  },
  {
    id: '5', name: 'Block External Admin Access', enabled: true,
    description: 'Deny admin actions from non-corporate IPs without MFA',
    subjectAttributes: { role: ['any'], department: ['any'], clearance: 'any' },
    resourceAttributes: { type: ['system-settings', 'admin'], sensitivity: 'critical' },
    environmentAttributes: { timeRestriction: 'none', ipRange: 'external', mfaRequired: false },
    action: 'deny',
    permissions: ['write', 'delete', 'admin'],
  },
];

const clearanceBadge: Record<string, string> = {
  'top-secret': 'bg-red-900/40 text-red-400 border-red-800',
  secret: 'bg-orange-900/40 text-orange-400 border-orange-800',
  confidential: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  any: 'bg-gray-800 text-gray-400 border-gray-700',
};

const permissionColors: Record<string, string> = {
  read: 'bg-green-900/30 text-green-400 border-green-800/30',
  write: 'bg-blue-900/30 text-blue-400 border-blue-800/30',
  delete: 'bg-red-900/30 text-red-400 border-red-800/30',
  admin: 'bg-purple-900/30 text-purple-400 border-purple-800/30',
  audit: 'bg-cyan-900/30 text-cyan-400 border-cyan-800/30',
};

export default function AbacControlPage() {
  const [rules, setRules] = useState<AbacRule[]>(demoRules);
  const [viewRule, setViewRule] = useState<AbacRule | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState<AbacRule>({
    id: '', name: '', enabled: true, description: '',
    subjectAttributes: { role: [], department: [], clearance: 'confidential' },
    resourceAttributes: { type: [], sensitivity: 'medium' },
    environmentAttributes: { timeRestriction: 'none', ipRange: 'any', mfaRequired: true },
    action: 'allow', permissions: [],
  });

  const handleToggle = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleCreate = () => {
    if (!newRule.name.trim()) return;
    setRules(prev => [...prev, { ...newRule, id: String(Date.now()) }]);
    setNewRule({
      id: '', name: '', enabled: true, description: '',
      subjectAttributes: { role: [], department: [], clearance: 'confidential' },
      resourceAttributes: { type: [], sensitivity: 'medium' },
      environmentAttributes: { timeRestriction: 'none', ipRange: 'any', mfaRequired: true },
      action: 'allow', permissions: [],
    });
    setShowCreate(false);
  };

  const handleDelete = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const togglePermission = (perm: string) => {
    setNewRule(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} className="text-purple-400" />
          <div>
            <h1 className="text-xl font-semibold">Admin ABAC Control</h1>
            <p className="text-sm text-gray-500">Attribute-Based Access Control — define fine-grained admin permissions</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          New Rule
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-purple-900/15 border border-purple-800/30 rounded-xl p-4 flex items-start gap-3 text-sm text-purple-300">
        <Lock size={18} className="mt-0.5 shrink-0" />
        <div>
          <span className="font-medium">ABAC policies</span> evaluate subject attributes (role, department, clearance), resource attributes (type, sensitivity), and environment conditions (time, IP, MFA) to make access decisions. Rules are evaluated top-to-bottom — first match wins.
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3">
        <span className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm">
          Total Rules: <span className="text-white font-medium">{rules.length}</span>
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-green-900/20 border border-green-800/30 text-sm text-green-400">
          Allow: {rules.filter(r => r.action === 'allow').length}
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-800/30 text-sm text-red-400">
          Deny: {rules.filter(r => r.action === 'deny').length}
        </span>
      </div>

      {/* Rule cards */}
      <div className="space-y-4">
        {rules.map(rule => (
          <div key={rule.id} className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${!rule.enabled ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className={rule.action === 'allow' ? 'text-green-400' : 'text-red-400'} />
                <div>
                  <h3 className="font-semibold">{rule.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${rule.action === 'allow' ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-red-900/40 text-red-400 border-red-800'}`}>
                  {rule.action.toUpperCase()}
                </span>
                <button onClick={() => handleToggle(rule.id)} className={`w-8 h-4 rounded-full transition-colors relative ${rule.enabled ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${rule.enabled ? 'left-4' : 'left-0.5'}`} />
                </button>
                <button onClick={() => setViewRule(rule)} className="p-1 text-gray-500 hover:text-blue-400 transition-colors"><Eye size={14} /></button>
                <button onClick={() => handleDelete(rule.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1"><Users size={10} /> Subject</div>
                <div className="flex flex-wrap gap-1">
                  {rule.subjectAttributes.role.map(r => (
                    <span key={r} className="px-1.5 py-0.5 rounded bg-purple-900/20 text-purple-300 text-xs border border-purple-800/30">{r}</span>
                  ))}
                </div>
                <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs border ${clearanceBadge[rule.subjectAttributes.clearance]}`}>
                  {rule.subjectAttributes.clearance}
                </span>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-500 mb-1.5">Resource</div>
                <div className="flex flex-wrap gap-1">
                  {rule.resourceAttributes.type.map(t => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-blue-900/20 text-blue-300 text-xs border border-blue-800/30">{t}</span>
                  ))}
                </div>
                <span className="block mt-1 text-xs text-gray-500">Sensitivity: {rule.resourceAttributes.sensitivity}</span>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-500 mb-1.5">Environment</div>
                <div className="space-y-0.5 text-xs">
                  <div className="text-gray-400">Time: {rule.environmentAttributes.timeRestriction}</div>
                  <div className="text-gray-400">IP: {rule.environmentAttributes.ipRange}</div>
                  <div className={rule.environmentAttributes.mfaRequired ? 'text-green-400' : 'text-gray-600'}>
                    MFA: {rule.environmentAttributes.mfaRequired ? 'Required' : 'Not required'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              <span className="text-xs text-gray-500 mr-1">Permissions:</span>
              {rule.permissions.map(p => (
                <span key={p} className={`px-1.5 py-0.5 rounded text-xs border ${permissionColors[p] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>{p}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* View modal */}
      {viewRule && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setViewRule(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck size={18} className={viewRule.action === 'allow' ? 'text-green-400' : 'text-red-400'} />
                {viewRule.name}
              </h3>
              <button onClick={() => setViewRule(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">{viewRule.description}</p>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Subject Attributes</h4>
                <div className="space-y-1 text-gray-300">
                  <div>Roles: {viewRule.subjectAttributes.role.join(', ')}</div>
                  <div>Departments: {viewRule.subjectAttributes.department.join(', ')}</div>
                  <div>Clearance: {viewRule.subjectAttributes.clearance}</div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Resource Attributes</h4>
                <div className="space-y-1 text-gray-300">
                  <div>Types: {viewRule.resourceAttributes.type.join(', ')}</div>
                  <div>Sensitivity: {viewRule.resourceAttributes.sensitivity}</div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Environment Conditions</h4>
                <div className="space-y-1 text-gray-300">
                  <div>Time: {viewRule.environmentAttributes.timeRestriction}</div>
                  <div>IP Range: {viewRule.environmentAttributes.ipRange}</div>
                  <div>MFA: {viewRule.environmentAttributes.mfaRequired ? 'Required' : 'Not required'}</div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Permissions</h4>
                <div className="flex flex-wrap gap-1">
                  {viewRule.permissions.map(p => (
                    <span key={p} className={`px-2 py-0.5 rounded text-xs border ${permissionColors[p]}`}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setViewRule(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Close</button>
            </div>
          </div>
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowCreate(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create ABAC Rule</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Rule Name</label>
                <input value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })} placeholder="e.g. SOC Analyst Read-Only" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <input value={newRule.description} onChange={e => setNewRule({ ...newRule, description: e.target.value })} placeholder="What this rule controls..." className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Action</label>
                  <select value={newRule.action} onChange={e => setNewRule({ ...newRule, action: e.target.value as 'allow' | 'deny' })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="allow">Allow</option>
                    <option value="deny">Deny</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Clearance Level</label>
                  <select value={newRule.subjectAttributes.clearance} onChange={e => setNewRule({ ...newRule, subjectAttributes: { ...newRule.subjectAttributes, clearance: e.target.value } })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="top-secret">Top Secret</option>
                    <option value="secret">Secret</option>
                    <option value="confidential">Confidential</option>
                    <option value="any">Any</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Roles (comma-separated)</label>
                <input value={newRule.subjectAttributes.role.join(', ')} onChange={e => setNewRule({ ...newRule, subjectAttributes: { ...newRule.subjectAttributes, role: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} placeholder="super-admin, security-admin" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Resource Types (comma-separated)</label>
                <input value={newRule.resourceAttributes.type.join(', ')} onChange={e => setNewRule({ ...newRule, resourceAttributes: { ...newRule.resourceAttributes, type: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} placeholder="policies, profiles, identity" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Time Restriction</label>
                  <select value={newRule.environmentAttributes.timeRestriction} onChange={e => setNewRule({ ...newRule, environmentAttributes: { ...newRule.environmentAttributes, timeRestriction: e.target.value } })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="none">None</option>
                    <option value="business-hours">Business Hours</option>
                    <option value="after-hours">After Hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">IP Range</label>
                  <input value={newRule.environmentAttributes.ipRange} onChange={e => setNewRule({ ...newRule, environmentAttributes: { ...newRule.environmentAttributes, ipRange: e.target.value } })} placeholder="10.0.0.0/8 or any" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {['read', 'write', 'delete', 'admin', 'audit'].map(p => (
                    <button key={p} onClick={() => togglePermission(p)} className={`px-2.5 py-1 rounded text-xs border transition-colors ${newRule.permissions.includes(p) ? permissionColors[p] : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">MFA Required</span>
                <button onClick={() => setNewRule({ ...newRule, environmentAttributes: { ...newRule.environmentAttributes, mfaRequired: !newRule.environmentAttributes.mfaRequired } })} className={`w-8 h-4 rounded-full transition-colors relative ${newRule.environmentAttributes.mfaRequired ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${newRule.environmentAttributes.mfaRequired ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={!newRule.name.trim()} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors">Create Rule</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
