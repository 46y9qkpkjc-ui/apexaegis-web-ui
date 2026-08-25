'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, Shield, AlertTriangle, Clock, CheckCircle,
  XCircle, User, FileText, Database, Lock, ChevronDown, ChevronUp,
  Play, Pause, RefreshCw
} from 'lucide-react';

// Types
interface EphemeralOverride {
  id: string;
  policyId: string;
  policyName: string;
  requestedBy: string;
  approvedBy?: string;
  reason: string;
  expiresAt: string;
  status: 'active' | 'pending' | 'expired' | 'revoked';
  remainingTime: number;
}

interface CISOReviewQueue {
  id: string;
  type: 'high_risk_access' | 'operational_block' | 'override_request';
  title: string;
  description: string;
  requestedBy: string;
  riskScore: number;
  timestamp: string;
  hieroTxHash: string;
  status: 'pending' | 'approved' | 'denied';
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  type: 'policy_change' | 'rollback' | 'override' | 'grant' | 'config_edit';
  action: string;
  actor: string;
  target: string;
  hieroTxHash: string;
  complianceFrameworks: string[];
}

interface RollbackState {
  id: string;
  timestamp: string;
  description: string;
  hieroTxHash: string;
  blockHeight: number;
}

// Mock data
const OVERRIDES: EphemeralOverride[] = [
  { id: 'ov_001', policyId: 'POL-CATE-003', policyName: 'CATE Threshold Bypass', requestedBy: 'admin@apexastute.com', approvedBy: 'ciso@apexastute.com', reason: 'Emergency production deployment', expiresAt: new Date(Date.now() + 3600000).toISOString(), status: 'active', remainingTime: 3600 },
  { id: 'ov_002', policyId: 'POL-DNS-001', policyName: 'DNS Sinkhole Override', requestedBy: 'dev@apexastute.com', reason: 'Testing legitimate external API', expiresAt: new Date(Date.now() + 900000).toISOString(), status: 'pending', remainingTime: 900 },
];

const CISO_QUEUE: CISOReviewQueue[] = [
  { id: 'cr_001', type: 'high_risk_access', title: 'Emergency DB Access Request', description: 'Production database emergency access for critical data migration', requestedBy: 'dba@apexastute.com', riskScore: 85, timestamp: new Date(Date.now() - 600000).toISOString(), hieroTxHash: '0x8f92a1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2', status: 'pending' },
  { id: 'cr_002', type: 'operational_block', title: 'Supply Chain Package Override', description: 'Request to allow fast-logger package after security review', requestedBy: 'secops@apexastute.com', riskScore: 72, timestamp: new Date(Date.now() - 1200000).toISOString(), hieroTxHash: '0x7e3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b', status: 'pending' },
];

const AUDIT_LOG: AuditLogEntry[] = [
  { id: 'tx_001', timestamp: new Date(Date.now() - 60000).toISOString(), type: 'policy_change', action: 'Deployed CATE threshold update: NIC contention threshold reduced from 85% to 75%', actor: 'admin@apexastute.com', target: 'ap-south-1-enclave', hieroTxHash: '0x8f92a1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2', complianceFrameworks: ['NIST SP 800-207', 'SOC 2 Type II'] },
  { id: 'tx_002', timestamp: new Date(Date.now() - 300000).toISOString(), type: 'rollback', action: 'State rollback to pre-deviation state for BGP routing', actor: 'admin@apexastute.com', target: 'ap-south-1-enclave', hieroTxHash: '0x7e3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b', complianceFrameworks: ['NIST SP 800-207', 'ISO 27001'] },
  { id: 'tx_003', timestamp: new Date(Date.now() - 600000).toISOString(), type: 'override', action: 'Emergency break-glass override for host 10.0.4.12 (30-minute window)', actor: 'ciso@apexastute.com', target: 'az-sql-batch-03', hieroTxHash: '0x9d2f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f', complianceFrameworks: ['SOC 2 Type II'] },
];

const ROLLBACK_STATES: RollbackState[] = [
  { id: 'snap_001', timestamp: new Date(Date.now() - 3600000).toISOString(), description: 'Pre-CATE-threshold-update state', hieroTxHash: '0x4910270000x_old_state_hash', blockHeight: 1847285 },
  { id: 'snap_002', timestamp: new Date(Date.now() - 7200000).toISOString(), description: 'Pre-BGP-routing-change state', hieroTxHash: '0x4910260000x_old_state_hash', blockHeight: 1847280 },
  { id: 'snap_003', timestamp: new Date(Date.now() - 86400000).toISOString(), description: 'Pre-package-quarantine state', hieroTxHash: '0x4910250000x_old_state_hash', blockHeight: 1847200 },
];

const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  policy_change: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  rollback: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  override: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  grant: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  config_edit: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  high_risk_access: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  operational_block: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  override_request: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
};

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<'rollback' | 'overrides' | 'queue' | 'audit'>('rollback');
  const [overrides, setOverrides] = useState(OVERRIDES);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [selectedState, setSelectedState] = useState<RollbackState | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const handleRollback = useCallback(async (state: RollbackState) => {
    setIsRollingBack(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRollingBack(false);
    setShowRollbackModal(false);
    alert(`Rolled back to state ${state.id}. New transaction created.`);
  }, []);

  const formatRemainingTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const tabs = [
    { id: 'rollback', label: 'State Rollback', icon: RotateCcw },
    { id: 'overrides', label: 'Ephemeral Overrides', icon: Shield },
    { id: 'queue', label: 'CISO Review Queue', icon: AlertTriangle },
    { id: 'audit', label: 'Audit Log', icon: FileText },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-end">
        <div className="text-right">
          <h1 className="text-xl font-bold text-gray-100">Break-Glass & State Rollback</h1>
          <p className="text-xs text-gray-400 mt-1">
            Emergency deterministic bypasses, CISO signature workflows, and cryptographic state reversion.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap border-b border-gray-800 pb-1 justify-end">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* State Rollback Tab */}
      {activeTab === 'rollback' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {ROLLBACK_STATES.map((state) => (
            <div key={state.id} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-200">{state.description}</span>
                  <span className="text-[10px] text-gray-500 font-mono">Block #{state.blockHeight.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-gray-500">
                  {new Date(state.timestamp).toLocaleString()} • TX: <span className="font-mono">{state.hieroTxHash.slice(0, 20)}...</span>
                </div>
              </div>
              <button
                onClick={() => { setSelectedState(state); setShowRollbackModal(true); }}
                className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-[10px] border border-purple-500/30 hover:bg-purple-500/30 flex items-center gap-1"
              >
                <RotateCcw size={10} /> Rollback
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {/* Ephemeral Overrides Tab */}
      {activeTab === 'overrides' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {overrides.map((override) => (
            <div key={override.id} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield size={14} className={override.status === 'active' ? 'text-emerald-400' : 'text-amber-400'} />
                  <span className="text-xs font-medium text-gray-200">{override.policyName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    override.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    override.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}>
                    {override.status}
                  </span>
                </div>
                {override.status === 'active' && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-400">
                    <Clock size={10} />
                    {formatRemainingTime(override.remainingTime)} remaining
                  </div>
                )}
              </div>
              <div className="text-[10px] text-gray-400 mb-1">{override.reason}</div>
              <div className="flex items-center gap-4 text-[10px] text-gray-500">
                <span>By: {override.requestedBy}</span>
                {override.approvedBy && <span>Approved: {override.approvedBy}</span>}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* CISO Review Queue Tab */}
      {activeTab === 'queue' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {CISO_QUEUE.map((item) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.policy_change;
            return (
              <div key={item.id} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${config.bg} ${config.border} ${config.color}`}>
                      {item.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-medium text-gray-200">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-500">Risk:</span>
                    <span className={`text-xs font-bold ${item.riskScore >= 70 ? 'text-red-400' : item.riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {item.riskScore}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mb-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-gray-500">
                    Requested by: {item.requestedBy} • {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-500/30 hover:bg-emerald-500/30">
                      Approve
                    </button>
                    <button className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-[10px] border border-red-500/30 hover:bg-red-500/30">
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800">
                    <th className="text-left font-medium px-3 py-2">Timestamp</th>
                    <th className="text-left font-medium px-3 py-2">Type</th>
                    <th className="text-left font-medium px-3 py-2">Action</th>
                    <th className="text-left font-medium px-3 py-2">Actor</th>
                    <th className="text-left font-medium px-3 py-2">Hiero TX</th>
                    <th className="text-left font-medium px-3 py-2">Frameworks</th>
                  </tr>
                </thead>
                <tbody>
                  {AUDIT_LOG.map((entry) => {
                    const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.policy_change;
                    return (
                      <tr key={entry.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="px-3 py-2 text-gray-400">{new Date(entry.timestamp).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded border ${config.bg} ${config.border} ${config.color}`}>
                            {entry.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-300 max-w-[300px] truncate">{entry.action}</td>
                        <td className="px-3 py-2 text-gray-400">{entry.actor}</td>
                        <td className="px-3 py-2 font-mono text-gray-400 truncate max-w-[150px]">{entry.hieroTxHash}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {entry.complianceFrameworks.map(fw => (
                              <span key={fw} className="text-[8px] px-1 py-0.5 rounded bg-white/5 text-gray-400">{fw}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rollback Modal */}
      <AnimatePresence>
        {showRollbackModal && selectedState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRollbackModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#12101f] border border-white/10 rounded-2xl p-5 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-white mb-4">Confirm State Rollback</h3>
              <p className="text-xs text-gray-400 mb-4">
                Roll back to state from {new Date(selectedState.timestamp).toLocaleString()}?
              </p>
              <div className="bg-white/5 rounded-lg p-3 mb-4 text-[10px] font-mono text-gray-400">
                <div>Block: #{selectedState.blockHeight.toLocaleString()}</div>
                <div>TX: {selectedState.hieroTxHash}</div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowRollbackModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRollback(selectedState)}
                  disabled={isRollingBack}
                  className="px-3 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                >
                  {isRollingBack ? <RefreshCw size={10} className="animate-spin" /> : <RotateCcw size={10} />}
                  Confirm Rollback
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
