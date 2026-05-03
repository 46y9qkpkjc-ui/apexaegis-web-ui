'use client';
import { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, GripVertical, ChevronDown, ChevronUp, Pencil, Trash2, Copy, Power, Play } from 'lucide-react';
import { InlineObjectCreator } from '@/components/policies/inline-object-creator';
import { PolicyEditor } from '@/components/policies/policy-editor';
import { PolicyEngineVisualization } from '@/components/policies/policy-engine-viz';
import { toast } from 'sonner';
import {
  fetchPolicies,
  createPolicy as apiCreatePolicy,
  updatePolicy as apiUpdatePolicy,
  deletePolicy as apiDeletePolicy,
} from '@/lib/policy-api';

interface SecurityPolicy {
  id: string;
  seq: number;
  name: string;
  enabled: boolean;
  trafficSteering: string;
  accessMethod: string[];
  sourceUsers: string[];
  sourceDeviceGroups: string[];
  sourceAddresses: string[];
  destAddresses: string[];
  destCloudApps: string[];
  destUrlCategories: string[];
  services: string[];
  httpMethods: string[];
  atpProfile: string | null;
  sslProfile: string | null;
  dnsFilterList: string | null;
  contentInspection: any | null;
  activityControls: any | null;
  wafConfig: any | null;
  iapConfig: any | null;
  action: 'allow' | 'deny' | 'monitor';
  logTraffic: boolean;
}

// Demo data
const demoPolicies: SecurityPolicy[] = [
  {
    id: '1', seq: 1, name: 'Block Malware & Phishing', enabled: true,
    trafficSteering: 'internet', accessMethod: ['browser', 'api'],
    sourceUsers: ['All Users'], sourceDeviceGroups: ['Managed Devices'],
    sourceAddresses: ['Internal Subnets'],
    destAddresses: ['any'], destCloudApps: [],
    destUrlCategories: ['Malware', 'Phishing', 'Spyware', 'Cryptomining'],
    services: ['HTTPS', 'HTTP'], httpMethods: [],
    atpProfile: 'Default-ATP', sslProfile: 'Certificate Inspection',
    dnsFilterList: 'Block-Malicious', contentInspection: null, activityControls: null, wafConfig: null, iapConfig: null, action: 'deny', logTraffic: true,
  },
  {
    id: '2', seq: 2, name: 'Allow Sanctioned SaaS', enabled: true,
    trafficSteering: 'internet', accessMethod: ['browser'],
    sourceUsers: ['Engineering', 'Product'], sourceDeviceGroups: ['All Devices'],
    sourceAddresses: ['any'],
    destAddresses: [], destCloudApps: ['Microsoft 365', 'Slack', 'GitHub', 'Jira'],
    destUrlCategories: [],
    services: ['HTTPS'], httpMethods: [],
    atpProfile: 'Default-ATP', sslProfile: 'Full Inspection',
    dnsFilterList: null, contentInspection: { enabled: true }, activityControls: { enabled: true }, wafConfig: null, iapConfig: null, action: 'allow', logTraffic: true,
  },
  {
    id: '3', seq: 3, name: 'Block NRD & NOD', enabled: true,
    trafficSteering: 'internet', accessMethod: ['browser', 'api', 'agent'],
    sourceUsers: ['All Users'], sourceDeviceGroups: ['All Devices'],
    sourceAddresses: ['any'],
    destAddresses: ['any'], destCloudApps: [],
    destUrlCategories: ['Newly Registered Domains', 'Newly Observed Domains'],
    services: ['HTTPS', 'HTTP', 'DNS'], httpMethods: [],
    atpProfile: null, sslProfile: null,
    dnsFilterList: 'Block-NRD-NOD', contentInspection: null, activityControls: null, wafConfig: null, iapConfig: null, action: 'deny', logTraffic: true,
  },
  {
    id: '4', seq: 4, name: 'Default Allow', enabled: true,
    trafficSteering: 'internet', accessMethod: ['browser', 'api', 'agent'],
    sourceUsers: ['All Users'], sourceDeviceGroups: ['All Devices'],
    sourceAddresses: ['any'],
    destAddresses: ['any'], destCloudApps: [],
    destUrlCategories: [],
    services: ['any'], httpMethods: [],
    atpProfile: 'Default-ATP', sslProfile: 'Certificate Inspection',
    dnsFilterList: null, contentInspection: null, activityControls: null, wafConfig: null, iapConfig: null, action: 'allow', logTraffic: true,
  },
];

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<SecurityPolicy[]>(demoPolicies);
  const [editingPolicy, setEditingPolicy] = useState<SecurityPolicy | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showEngineViz, setShowEngineViz] = useState(false);
  const [insertPosition, setInsertPosition] = useState<{ refId: string; position: 'before' | 'after' } | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);

  // Load policies from management plane API on mount, fallback to demo data
  const loadPolicies = useCallback(async () => {
    try {
      const { policies: apiPolicies } = await fetchPolicies();
      if (apiPolicies.length > 0) {
        setPolicies(apiPolicies);
        setApiConnected(true);
      }
    } catch {
      // Backend unreachable — use demo policies
      setApiConnected(false);
    }
  }, []);

  useEffect(() => { loadPolicies(); }, [loadPolicies]);

  // Persist sequence numbers to backend after reorder
  const syncSequences = useCallback(async (reordered: SecurityPolicy[]) => {
    if (!apiConnected) return;
    try {
      await Promise.all(
        reordered.map(p => apiUpdatePolicy(p.id, p))
      );
    } catch {
      toast.error('Failed to save policy order');
      loadPolicies();
    }
  }, [apiConnected, loadPolicies]);

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return; }
    setPolicies(prev => {
      const fromIdx = prev.findIndex(p => p.id === draggedId);
      const toIdx = prev.findIndex(p => p.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      const reordered = updated.map((p, i) => ({ ...p, seq: i + 1 }));
      syncSequences(reordered);
      return reordered;
    });
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleToggle = async (id: string) => {
    const target = policies.find(p => p.id === id);
    setPolicies(prev =>
      prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
    );
    if (apiConnected && target) {
      try {
        await apiUpdatePolicy(id, { ...target, enabled: !target.enabled });
      } catch {
        toast.error('Failed to update policy on server');
        loadPolicies();
      }
    }
  };

  const handleNewPolicy = () => {
    setEditingPolicy(null);
    setInsertPosition(null);
    setShowEditor(true);
  };

  const handleEdit = (policy: SecurityPolicy) => {
    setEditingPolicy(policy);
    setShowEditor(true);
  };

  const handleClone = async (policy: SecurityPolicy) => {
    const cloned: SecurityPolicy = {
      ...policy,
      id: String(Date.now()),
      name: policy.name + ' (Copy)',
      seq: policies.length + 1,
    };
    const idx = policies.findIndex(p => p.id === policy.id);
    const updated = [...policies];
    updated.splice(idx + 1, 0, cloned);
    setPolicies(updated.map((p, i) => ({ ...p, seq: i + 1 })));
    if (apiConnected) {
      try {
        const { policyId } = await apiCreatePolicy(cloned);
        setPolicies(prev => prev.map(p => p.id === cloned.id ? { ...p, id: policyId } : p));
        toast.success('Policy cloned');
      } catch {
        toast.error('Failed to clone policy on server');
        loadPolicies();
      }
    }
  };

  const handleDeletePolicy = async (id: string) => {
    setPolicies(prev => prev.filter(p => p.id !== id).map((p, i) => ({ ...p, seq: i + 1 })));
    if (apiConnected) {
      try {
        await apiDeletePolicy(id);
        toast.success('Policy deleted');
      } catch {
        toast.error('Failed to delete policy on server');
        loadPolicies();
      }
    }
  };

  const handleInsertBeforeAfter = (refId: string, position: 'before' | 'after') => {
    setEditingPolicy(null);
    setInsertPosition({ refId, position });
    setShowEditor(true);
  };

  const handleMoveUp = (id: string) => {
    const idx = policies.findIndex(p => p.id === id);
    if (idx <= 0) return;
    const updated = [...policies];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    const reordered = updated.map((p, i) => ({ ...p, seq: i + 1 }));
    setPolicies(reordered);
    syncSequences(reordered);
  };

  const handleMoveDown = (id: string) => {
    const idx = policies.findIndex(p => p.id === id);
    if (idx < 0 || idx >= policies.length - 1) return;
    const updated = [...policies];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    const reordered = updated.map((p, i) => ({ ...p, seq: i + 1 }));
    setPolicies(reordered);
    syncSequences(reordered);
  };

  const actionBadge = (action: string) => {
    const colors: Record<string, string> = {
      allow: 'bg-green-900/40 text-green-400 border-green-800',
      deny: 'bg-red-900/40 text-red-400 border-red-800',
      monitor: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
    };
    return colors[action] || 'bg-gray-800 text-gray-400';
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-blue-400" />
          <div>
            <h1 className="text-xl font-semibold">Security Policies</h1>
            <p className="text-sm text-gray-500">
              Unified DNS, Web, and Threat policies — evaluated top-to-bottom, first match wins
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEngineViz(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showEngineViz ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            <Play size={16} />
            Engine Visualizer
          </button>
          <button
            onClick={handleNewPolicy}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Create Policy
          </button>
        </div>
      </div>

      {/* Engine Visualization */}
      {showEngineViz && (
        <div className="mb-6">
          <PolicyEngineVisualization />
        </div>
      )}

      {/* Policy table — FortiGate-style */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
              <th className="w-8 px-3 py-3"></th>
              <th className="px-3 py-3 text-left">Seq</th>
              <th className="px-3 py-3 text-left">Name</th>
              <th className="px-3 py-3 text-left">Source</th>
              <th className="px-3 py-3 text-left">Destination</th>
              <th className="px-3 py-3 text-left">Service</th>
              <th className="px-3 py-3 text-left">Security Profiles</th>
              <th className="px-3 py-3 text-center">Action</th>
              <th className="px-3 py-3 text-center">Status</th>
              <th className="w-20 px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {policies.map((policy) => (
              <tr
                key={policy.id}
                className={`hover:bg-gray-800/30 transition-colors ${!policy.enabled ? 'opacity-40' : ''} ${draggedId === policy.id ? 'opacity-30' : ''} ${dragOverId === policy.id && draggedId !== policy.id ? 'border-t-2 border-t-blue-500' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOverId(policy.id); }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={e => { e.preventDefault(); handleDrop(policy.id); }}
              >
                <td
                  className="px-3 py-3 text-gray-600 cursor-grab"
                  draggable
                  onDragStart={() => setDraggedId(policy.id)}
                  onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                >
                  <GripVertical size={14} />
                </td>
                <td className="px-3 py-3 text-gray-500 font-mono text-xs">{policy.seq}</td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => handleEdit(policy)}
                    className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {policy.name}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <div className="space-y-0.5">
                    {policy.sourceUsers.map(u => (
                      <span key={u} className="inline-block mr-1 px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 text-xs border border-purple-800/50">
                        {u}
                      </span>
                    ))}
                    {policy.sourceDeviceGroups.map(d => (
                      <span key={d} className="inline-block mr-1 px-2 py-0.5 rounded bg-cyan-900/30 text-cyan-300 text-xs border border-cyan-800/50">
                        {d}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="space-y-0.5">
                    {policy.destUrlCategories.map(c => (
                      <span key={c} className="inline-block mr-1 px-2 py-0.5 rounded bg-orange-900/30 text-orange-300 text-xs border border-orange-800/50">
                        {c}
                      </span>
                    ))}
                    {policy.destCloudApps.map(a => (
                      <span key={a} className="inline-block mr-1 px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 text-xs border border-blue-800/50">
                        {a}
                      </span>
                    ))}
                    {policy.destUrlCategories.length === 0 && policy.destCloudApps.length === 0 && (
                      <span className="text-gray-500 text-xs">any</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {policy.services.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {policy.atpProfile && (
                      <span className="px-2 py-0.5 rounded bg-red-900/20 text-red-300 text-xs border border-red-800/30">
                        ATP
                      </span>
                    )}
                    {policy.sslProfile && (
                      <span className="px-2 py-0.5 rounded bg-yellow-900/20 text-yellow-300 text-xs border border-yellow-800/30">
                        SSL
                      </span>
                    )}
                    {policy.dnsFilterList && (
                      <span className="px-2 py-0.5 rounded bg-green-900/20 text-green-300 text-xs border border-green-800/30">
                        DNS
                      </span>
                    )}
                    {policy.contentInspection?.enabled && (
                      <span className="px-2 py-0.5 rounded bg-purple-900/20 text-purple-300 text-xs border border-purple-800/30">
                        DPI
                      </span>
                    )}
                    {policy.activityControls?.enabled && (
                      <span className="px-2 py-0.5 rounded bg-amber-900/20 text-amber-300 text-xs border border-amber-800/30">
                        ACL
                      </span>
                    )}
                    {policy.wafConfig?.enabled && (
                      <span className="px-2 py-0.5 rounded bg-red-900/20 text-red-300 text-xs border border-red-800/30">
                        WAF
                      </span>
                    )}
                    {policy.iapConfig?.enabled && (
                      <span className="px-2 py-0.5 rounded bg-teal-900/20 text-teal-300 text-xs border border-teal-800/30">
                        IAP
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${actionBadge(policy.action)}`}>
                    {policy.action.toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => handleToggle(policy.id)}
                    className={`w-8 h-4 rounded-full transition-colors relative ${policy.enabled ? 'bg-green-600' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${policy.enabled ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(policy)}
                      className="p-1 text-gray-500 hover:text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleClone(policy)} className="p-1 text-gray-500 hover:text-yellow-400 transition-colors" title="Clone">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => handleDeletePolicy(policy.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                    <button onClick={() => handleMoveUp(policy.id)} className="p-1 text-gray-500 hover:text-green-400 transition-colors" title="Move Up">
                      <ChevronUp size={14} />
                    </button>
                    <button onClick={() => handleMoveDown(policy.id)} className="p-1 text-gray-500 hover:text-green-400 transition-colors" title="Move Down">
                      <ChevronDown size={14} />
                    </button>
                    <div className="relative group">
                      <button className="p-1 text-gray-500 hover:text-purple-400 transition-colors" title="Insert policy">
                        <Plus size={14} />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-36 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-30 hidden group-hover:block">
                        <button onClick={() => handleInsertBeforeAfter(policy.id, 'before')} className="w-full px-3 py-2 text-left text-xs hover:bg-gray-800 rounded-t-lg transition-colors">Insert Before</button>
                        <button onClick={() => handleInsertBeforeAfter(policy.id, 'after')} className="w-full px-3 py-2 text-left text-xs hover:bg-gray-800 rounded-b-lg transition-colors">Insert After</button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Policy Editor Drawer */}
      {showEditor && (
        <PolicyEditor
          policy={editingPolicy}
          onClose={() => setShowEditor(false)}
          onSave={async (saved) => {
            if (saved.id) {
              // Update existing — preserve current seq
              const existing = policies.find(p => p.id === saved.id);
              const merged = { ...existing, ...saved, seq: existing?.seq ?? saved.seq };
              setPolicies(prev => prev.map(p => p.id === saved.id ? { ...p, ...merged } : p));
              if (apiConnected) {
                try {
                  await apiUpdatePolicy(saved.id, merged);
                  toast.success('Policy saved');
                } catch {
                  toast.error('Failed to save policy on server');
                  loadPolicies();
                }
              }
            } else {
              // Create new
              const newId = String(Date.now());
              const newPolicy = {
                id: newId,
                seq: 0,
                httpMethods: [] as string[],
                ...saved,
              };
              // Insert at specific position if requested
              const insertCtx: { reordered: SecurityPolicy[] | null } = { reordered: null };
              setPolicies(prev => {
                if (insertPosition) {
                  const refIdx = prev.findIndex(p => p.id === insertPosition.refId);
                  if (refIdx >= 0) {
                    const insertIdx = insertPosition.position === 'before' ? refIdx : refIdx + 1;
                    const updated = [...prev];
                    updated.splice(insertIdx, 0, newPolicy);
                    setInsertPosition(null);
                    insertCtx.reordered = updated.map((p, i) => ({ ...p, seq: i + 1 }));
                    return insertCtx.reordered;
                  }
                }
                const newSeq = prev.length + 1;
                return [...prev, { ...newPolicy, seq: newSeq }];
              });
              if (apiConnected) {
                try {
                  const { policyId } = await apiCreatePolicy(newPolicy);
                  setPolicies(prev => prev.map(p => p.id === newId ? { ...p, id: policyId } : p));
                  // Sync surrounding sequences when inserted at a position
                  if (insertCtx.reordered) {
                    await Promise.all(
                      insertCtx.reordered.filter((p: SecurityPolicy) => p.id !== newId).map((p: SecurityPolicy) => apiUpdatePolicy(p.id, p))
                    );
                  }
                  toast.success('Policy created');
                } catch {
                  toast.error('Failed to create policy on server');
                  loadPolicies();
                }
              }
            }
            setShowEditor(false);
            setInsertPosition(null);
          }}
          existingPolicies={policies.map(p => ({
            name: p.name,
            action: p.action,
            sourceUsers: p.sourceUsers,
            sourceAddresses: p.sourceAddresses,
            destUrlCategories: p.destUrlCategories,
            destCloudApps: p.destCloudApps,
            destAddresses: p.destAddresses,
            services: p.services,
            dnsFilterList: p.dnsFilterList,
          }))}
        />
      )}
    </div>
  );
}
