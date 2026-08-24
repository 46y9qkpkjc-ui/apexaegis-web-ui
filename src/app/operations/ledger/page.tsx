'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCube, HiOutlineArrowPath, HiOutlineCheckCircle, HiOutlineClock, HiOutlineExclamationTriangle, HiOutlineShieldCheck, HiOutlineDocumentText, HiOutlineFunnel, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { FiDownload, FiFilter, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// Types
interface LedgerTransaction {
  id: string;
  timestamp: string;
  type: 'policy_deploy' | 'admin_override' | 'session_drop' | 'config_edit' | 'remediation' | 'rollback' | 'compliance_scan' | 'access_grant';
  action: string;
  actor: string;
  actorRole: string;
  target: string;
  domain: string;
  merkleRoot: string;
  hieroTxHash: string;
  consensusNode: string;
  blockHeight: number;
  status: 'confirmed' | 'pending' | 'failed';
  complianceFrameworks: string[];
  rollbackAvailable: boolean;
  previousStateHash: string | null;
}

// Mock data
const MOCK_LEDGER: LedgerTransaction[] = [
  {
    id: 'TX-491028',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    type: 'policy_deploy',
    action: 'Deployed CATE threshold update: NIC contention threshold reduced from 85% to 75%',
    actor: 'admin@apexastute.com',
    actorRole: 'Platform Admin',
    target: 'ap-south-1-enclave',
    domain: 'SECURITY',
    merkleRoot: '0x8f92a1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    hieroTxHash: '0x4910280001a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8',
    consensusNode: 'hiero-validator-01.ap-south-1',
    blockHeight: 1847291,
    status: 'confirmed',
    complianceFrameworks: ['NIST SP 800-207', 'SOC 2 Type II', 'ISO 27001'],
    rollbackAvailable: true,
    previousStateHash: '0x4910270000x_old_state_hash_here',
  },
  {
    id: 'TX-491027',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    type: 'admin_override',
    action: 'Emergency override: Temporarily elevated break-glass access for host 10.0.4.12 (30-minute window)',
    actor: 'ciso@apexastute.com',
    actorRole: 'CISO',
    target: 'az-sql-batch-03',
    domain: 'ACCESS',
    merkleRoot: '0x7e3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b',
    hieroTxHash: '0x4910270001b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9',
    consensusNode: 'hiero-validator-02.ap-south-1',
    blockHeight: 1847290,
    status: 'confirmed',
    complianceFrameworks: ['SOC 2 Type II', 'ISO 27001'],
    rollbackAvailable: true,
    previousStateHash: '0x4910260000x_old_state_hash_here',
  },
  {
    id: 'TX-491026',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    type: 'remediation',
    action: 'Auto-remediation: Dynamic NIC backoff applied to PID 4912; EDR daemon restarted',
    actor: 'ai-engine@apexaegis',
    actorRole: 'Autonomous AI',
    target: 'dev-box-linux-wsl',
    domain: 'SECURITY_AND_NETWORK',
    merkleRoot: '0x9d2f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
    hieroTxHash: '0x4910260001c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
    consensusNode: 'hiero-validator-01.ap-south-1',
    blockHeight: 1847289,
    status: 'confirmed',
    complianceFrameworks: ['NIST SP 800-207', 'SOC 2 Type II'],
    rollbackAvailable: true,
    previousStateHash: '0x4910250000x_old_state_hash_here',
  },
  {
    id: 'TX-491025',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    type: 'session_drop',
    action: 'Session terminated: Impossible travel velocity detected (Singapore → London in 3 minutes)',
    actor: 'ai-engine@apexaegis',
    actorRole: 'Autonomous AI',
    target: 'sess_7e3b4c',
    domain: 'SECURITY',
    merkleRoot: '0x6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d',
    hieroTxHash: '0x4910250001d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
    consensusNode: 'hiero-validator-02.ap-south-1',
    blockHeight: 1847288,
    status: 'confirmed',
    complianceFrameworks: ['NIST SP 800-207', 'ISO 27001'],
    rollbackAvailable: false,
    previousStateHash: null,
  },
  {
    id: 'TX-491024',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    type: 'config_edit',
    action: 'Sovereign cell configuration updated: AWS ap-south-1 PrivateLink bandwidth increased to 10Gbps',
    actor: 'netops@apexastute.com',
    actorRole: 'Network Ops',
    target: 'ap-south-1-enclave',
    domain: 'NETWORK',
    merkleRoot: '0x5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c',
    hieroTxHash: '0x4910240001e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    consensusNode: 'hiero-validator-01.ap-south-1',
    blockHeight: 1847287,
    status: 'confirmed',
    complianceFrameworks: ['SOC 2 Type II'],
    rollbackAvailable: true,
    previousStateHash: '0x4910230000x_old_state_hash_here',
  },
  {
    id: 'TX-491023',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: 'compliance_scan',
    action: 'Automated compliance scan completed: All 12 jurisdictions passed NIST SP 800-207 controls',
    actor: 'compliance-engine@apexaegis',
    actorRole: 'Autonomous AI',
    target: 'global',
    domain: 'COMPLIANCE',
    merkleRoot: '0x4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b',
    hieroTxHash: '0x4910230001f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3',
    consensusNode: 'hiero-validator-02.ap-south-1',
    blockHeight: 1847286,
    status: 'confirmed',
    complianceFrameworks: ['NIST SP 800-207', 'SOC 2 Type II', 'ISO 27001', 'PCI DSS v4.0'],
    rollbackAvailable: false,
    previousStateHash: null,
  },
  {
    id: 'TX-491022',
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    type: 'rollback',
    action: 'State rollback executed: Reverted BGP routing table to pre-deviation state (TX-491018)',
    actor: 'admin@apexastute.com',
    actorRole: 'Platform Admin',
    target: 'ap-south-1-enclave',
    domain: 'NETWORK',
    merkleRoot: '0x3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d',
    hieroTxHash: '0x491022000108a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4',
    consensusNode: 'hiero-validator-01.ap-south-1',
    blockHeight: 1847285,
    status: 'confirmed',
    complianceFrameworks: ['NIST SP 800-207', 'SOC 2 Type II', 'ISO 27001'],
    rollbackAvailable: true,
    previousStateHash: '0x4910210000x_old_state_hash_here',
  },
  {
    id: 'TX-491021',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    type: 'access_grant',
    action: 'FIDO2/WebAuthn challenge completed: Elevated access granted for emergency database migration',
    actor: 'dba@apexastute.com',
    actorRole: 'Database Admin',
    target: 'az-sql-prod-01',
    domain: 'ACCESS',
    merkleRoot: '0x2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c',
    hieroTxHash: '0x491021000119b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
    consensusNode: 'hiero-validator-02.ap-south-1',
    blockHeight: 1847284,
    status: 'confirmed',
    complianceFrameworks: ['SOC 2 Type II', 'ISO 27001'],
    rollbackAvailable: true,
    previousStateHash: '0x4910200000x_old_state_hash_here',
  },
];

const TX_TYPE_CONFIG = {
  policy_deploy: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', icon: HiOutlineCube },
  admin_override: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: HiOutlineExclamationTriangle },
  session_drop: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: HiOutlineExclamationTriangle },
  config_edit: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: HiOutlineCube },
  remediation: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: HiOutlineCheckCircle },
  rollback: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: HiOutlineArrowPath },
  compliance_scan: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: HiOutlineShieldCheck },
  access_grant: { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30', icon: HiOutlineDocumentText },
};

const DOMAIN_COLORS: Record<string, string> = {
  SECURITY: 'bg-red-500/20 text-red-400 border-red-500/30',
  NETWORK: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  ACCESS: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  COMPLIANCE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SECURITY_AND_NETWORK: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export default function LedgerPage() {
  const [records, setRecords] = useState<LedgerTransaction[]>(MOCK_LEDGER);
  const [selectedRecord, setSelectedRecord] = useState<LedgerTransaction | null>(MOCK_LEDGER[0]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const filteredRecords = records.filter(r => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (filterDomain !== 'all' && r.domain !== filterDomain) return false;
    if (searchQuery && !r.action.toLowerCase().includes(searchQuery.toLowerCase()) && !r.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleRollback = async (txId: string) => {
    setIsRollingBack(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRollingBack(false);
    setShowRollbackModal(false);
    alert(`Rolled back to state before ${txId}. New transaction created.`);
  };

  return (
    <div className="min-h-screen bg-[#0a0819] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <HiOutlineCube className="w-5 h-5 text-indigo-400" />
              Ledger Operations & State Rollback
            </h1>
            <p className="text-sm text-gray-400 mt-1">Immutable audit trail with Hiero aBFT consensus and deterministic rollback</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors">
              <FiDownload className="w-4 h-4" />
              Export Ledger
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors">
              <HiOutlineShieldCheck className="w-4 h-4" />
              Verify Integrity
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Types</option>
              <option value="policy_deploy">Policy Deploy</option>
              <option value="admin_override">Admin Override</option>
              <option value="session_drop">Session Drop</option>
              <option value="config_edit">Config Edit</option>
              <option value="remediation">Remediation</option>
              <option value="rollback">Rollback</option>
              <option value="compliance_scan">Compliance Scan</option>
              <option value="access_grant">Access Grant</option>
            </select>
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Domains</option>
              <option value="SECURITY">Security</option>
              <option value="NETWORK">Network</option>
              <option value="ACCESS">Access</option>
              <option value="COMPLIANCE">Compliance</option>
              <option value="SECURITY_AND_NETWORK">Security & Network</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Panel - Ledger Records */}
        <div className="w-1/2 border-r border-white/5 overflow-y-auto">
          <div className="divide-y divide-white/5">
            {filteredRecords.map((record, idx) => {
              const typeConfig = TX_TYPE_CONFIG[record.type];
              const TypeIcon = typeConfig.icon;
              return (
                <motion.button
                  key={record.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedRecord(record)}
                  className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                    selectedRecord?.id === record.id ? 'bg-white/5 border-l-2 border-indigo-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig.bg} ${typeConfig.border} ${typeConfig.color} border`}>
                        {record.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{record.id}</span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(record.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-gray-200 line-clamp-2 mb-2">{record.action}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{record.actor}</span>
                    <span>•</span>
                    <span>{record.target}</span>
                    <span>•</span>
                    <span className={`px-1.5 py-0.5 rounded border ${DOMAIN_COLORS[record.domain] || 'bg-white/5 text-gray-400 border-white/10'}`}>
                      {record.domain}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Detail View */}
        <div className="w-1/2 overflow-y-auto">
          {selectedRecord ? (
            <div className="p-6 space-y-6">
              {/* Transaction Header */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-white">{selectedRecord.id}</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${TX_TYPE_CONFIG[selectedRecord.type].bg} ${TX_TYPE_CONFIG[selectedRecord.type].border} ${TX_TYPE_CONFIG[selectedRecord.type].color} border`}>
                    {selectedRecord.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    selectedRecord.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    selectedRecord.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {selectedRecord.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-300">{selectedRecord.action}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span>Actor: {selectedRecord.actor} ({selectedRecord.actorRole})</span>
                  <span>Target: {selectedRecord.target}</span>
                </div>
              </div>

              {/* Hiero DLT Details */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                  <HiOutlineCube className="w-4 h-4" />
                  Hiero aBFT Consensus Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Transaction Hash</p>
                    <p className="text-sm text-gray-200 font-mono break-all">{selectedRecord.hieroTxHash}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Merkle Root (SHA-256)</p>
                    <p className="text-sm text-gray-200 font-mono break-all">{selectedRecord.merkleRoot}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Consensus Node</p>
                    <p className="text-sm text-gray-200">{selectedRecord.consensusNode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Block Height</p>
                    <p className="text-sm text-gray-200">#{selectedRecord.blockHeight.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Compliance Frameworks */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <HiOutlineShieldCheck className="w-4 h-4" />
                  Compliance Frameworks
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRecord.complianceFrameworks.map(fw => (
                    <span key={fw} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300">
                      {fw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rollback */}
              {selectedRecord.rollbackAvailable && (
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <HiOutlineArrowPath className="w-4 h-4" />
                    Deterministic Configuration Rollback
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Roll back to the state before this transaction. The rollback itself will be recorded as a new immutable transaction, preserving complete auditability.
                  </p>
                  {selectedRecord.previousStateHash && (
                    <p className="text-xs text-gray-500 mb-3">
                      Previous State Hash: <span className="font-mono">{selectedRecord.previousStateHash}</span>
                    </p>
                  )}
                  <button
                    onClick={() => setShowRollbackModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-sm text-purple-400 hover:bg-purple-500/30 transition-colors"
                  >
                    <HiOutlineArrowPath className="w-4 h-4" />
                    Rollback to This State
                  </button>
                </div>
              )}

              {/* Ledger Non-Repudiation */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <HiOutlineDocumentText className="w-4 h-4" />
                  Ledger Non-Repudiation
                </h3>
                <p className="text-sm text-gray-400">
                  This transaction is cryptographically sealed and cannot be altered or deleted. Any rollback operation creates a new transaction, preserving complete auditability for SOC 2, NIST SP 800-207, and ISO 27001 compliance.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a transaction to view details
            </div>
          )}
        </div>
      </div>

      {/* Rollback Modal */}
      {showRollbackModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowRollbackModal(false)}>
          <div className="bg-[#12101f] border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Confirm State Rollback</h3>
            <p className="text-sm text-gray-400 mb-4">
              You are about to roll back to the state before transaction <span className="text-white font-mono">{selectedRecord.id}</span>. This action will:
            </p>
            <ul className="text-sm text-gray-400 space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">1.</span>
                Restore all configurations to the previous state
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">2.</span>
                Create a new immutable rollback transaction on the Hiero DLT
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">3.</span>
                Preserve complete auditability for compliance
              </li>
            </ul>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRollbackModal(false)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRollback(selectedRecord.id)}
                disabled={isRollingBack}
                className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isRollingBack ? (
                  <>
                    <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                    Rolling back...
                  </>
                ) : (
                  <>
                    <HiOutlineArrowPath className="w-4 h-4" />
                    Confirm Rollback
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
