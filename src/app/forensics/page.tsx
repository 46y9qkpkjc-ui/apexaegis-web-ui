'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiSearch, FiDownload, FiSend, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { 
  HiOutlineExclamationTriangle, 
  HiOutlineCheckCircle, 
  HiOutlineXCircle, 
  HiOutlineArrowPath, 
  HiOutlineShieldCheck, 
  HiOutlineClock, 
  HiOutlineCpuChip, 
  HiOutlineSignal, 
  HiOutlineGlobeAlt, 
  HiOutlineDocumentText, 
  HiOutlineCommandLine, 
  HiOutlineChatBubbleLeftRight, 
  HiOutlineEnvelope, 
  HiOutlineArrowUturnLeft 
} from 'react-icons/hi2';
// Types
interface ForensicEvidence {
  pillar: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  score: number;
  icon: string;
}

interface RemediationAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  type: 'isolate' | 'revoke' | 'restart' | 'challenge' | 'throttle' | 'reroute';
  status: 'available' | 'executing' | 'completed' | 'failed';
}

interface ForensicRecord {
  id: string;
  timestamp: string;
  sessionId: string;
  userId: string;
  userName: string;
  host: string;
  ipAddress: string;
  domain: string;
  status: 'resolving' | 'resolved' | 'escalated';
  causalRootCause: string;
  evidenceChain: ForensicEvidence[];
  remediations: RemediationAction[];
  hieroTxHash: string;
  rollbackSnapshotId: string;
  blastRadius: number;
  confidenceScore: number;
}

// Mock data
const MOCK_FORENSICS: ForensicRecord[] = [
  {
    id: 'REM-8821',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    sessionId: 'sess_8f92a1',
    userId: 'user_2847',
    userName: 'priya.sharma@apexastute.com',
    host: 'dev-box-linux-wsl',
    ipAddress: '10.14.2.88',
    domain: 'apexastute.com',
    status: 'resolved',
    causalRootCause: 'High-priority Teams call degraded due to unapproved Docker image pull saturating local NIC adapter at 94%. Simultaneous EDR sensor timeout raised CATE risk score from 12 to 64.',
    evidenceChain: [
      { pillar: 'Network / QoE', status: 'fail', details: 'Local physical NIC adapter saturated at 94%; BGP ISP path latency normal (14ms)', score: 15, icon: 'HiOutlineSignal' },
      { pillar: 'Process Context', status: 'fail', details: 'PID 4912 (docker daemon) consuming 82% egress bandwidth on unauthorized image pull', score: 10, icon: 'HiOutlineCpuChip' },
      { pillar: 'Device Hygiene', status: 'warning', details: 'CrowdStrike sensor heartbeat stale for 12m; EDR daemon suspended', score: 45, icon: 'HiOutlineShieldCheck' },
      { pillar: 'ITDR / Behavior', status: 'pass', details: 'No anomalous OAuth grants or credential-stuffing signals detected', score: 92, icon: 'HiOutlineCheckCircle' },
    ],
    remediations: [
      { id: 'rem_001', label: 'Restart EDR Sensor', description: 'Restart local CrowdStrike/Defender daemon', icon: 'HiOutlineRefresh', type: 'restart', status: 'completed' },
      { id: 'rem_002', label: 'Throttle Background PID', description: 'Cap PID 4912 NIC bandwidth to 5%', icon: 'HiOutlineArrowPath', type: 'throttle', status: 'completed' },
      { id: 'rem_003', label: 'Revoke Active Token', description: 'Revoke compromised OAuth session token', icon: 'HiOutlineXCircle', type: 'revoke', status: 'available' },
      { id: 'rem_004', label: 'Apply Host Isolation', description: 'Micro-isolate endpoint from ZTNA tunnels', icon: 'HiOutlineShieldCheck', type: 'isolate', status: 'available' },
      { id: 'rem_005', label: 'Push FIDO2 Challenge', description: 'Force biometric re-authentication', icon: 'HiOutlineCommandLine', type: 'challenge', status: 'available' },
      { id: 'rem_006', label: 'Reroute via Sovereign VPC', description: 'Force traffic through in-country AWS PrivateLink', icon: 'HiOutlineGlobeAlt', type: 'reroute', status: 'available' },
    ],
    hieroTxHash: '0x8f92a1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    rollbackSnapshotId: 'snap_tx_491028_hiero',
    blastRadius: 12,
    confidenceScore: 0.98,
  },
  {
    id: 'REM-8822',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    sessionId: 'sess_7e3b4c',
    userId: 'user_1029',
    userName: 'james.wong@apexastute.com',
    host: 'macbook-pro-jw',
    ipAddress: '172.16.5.23',
    domain: 'apexastute.com',
    status: 'resolving',
    causalRootCause: 'Impossible travel velocity detected: OAuth token used from Singapore (09:42 SGT) and London (09:45 GMT) within 3 minutes. Suspected credential compromise or VPN tunneling abuse.',
    evidenceChain: [
      { pillar: 'Network / QoE', status: 'pass', details: 'BGP routing normal; latency within expected bounds for both locations', score: 88, icon: 'HiOutlineSignal' },
      { pillar: 'Process Context', status: 'warning', details: 'Anomalous PowerShell invocation from unapproved child process detected', score: 35, icon: 'HiOutlineCpuChip' },
      { pillar: 'Device Hygiene', status: 'pass', details: 'EDR sensor active; BitLocker verified; OS patches current', score: 95, icon: 'HiOutlineShieldCheck' },
      { pillar: 'ITDR / Behavior', status: 'fail', details: 'Impossible travel velocity (3 min gap between SG and London); token reuse from distinct subnets', score: 8, icon: 'HiOutlineExclamationTriangle' },
    ],
    remediations: [
      { id: 'rem_007', label: 'Revoke Active Token', description: 'Revoke compromised OAuth session token', icon: 'HiOutlineXCircle', type: 'revoke', status: 'available' },
      { id: 'rem_008', label: 'Push FIDO2 Challenge', description: 'Force biometric re-authentication', icon: 'HiOutlineCommandLine', type: 'challenge', status: 'available' },
      { id: 'rem_009', label: 'Apply Host Isolation', description: 'Micro-isolate endpoint from ZTNA tunnels', icon: 'HiOutlineShieldCheck', type: 'isolate', status: 'available' },
    ],
    hieroTxHash: '0x7e3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b',
    rollbackSnapshotId: 'snap_tx_491029_hiero',
    blastRadius: 3,
    confidenceScore: 0.92,
  },
  {
    id: 'REM-8823',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    sessionId: 'sess_9d2f1a',
    userId: 'user_5567',
    userName: 'system batch job',
    host: 'az-sql-batch-03',
    ipAddress: '10.0.4.12',
    domain: 'internal.apexastute.com',
    status: 'escalated',
    causalRootCause: 'Sovereign boundary route deviation detected: BGP ASN path includes foreign intermediate node (AS13335 - Cloudflare) while user device confirmed inside India boundary via GPS and Wi-Fi BSSID.',
    evidenceChain: [
      { pillar: 'Network / QoE', status: 'fail', details: 'BGP ASN hops indicate transit via foreign intermediate node (AS13335)', score: 22, icon: 'HiOutlineGlobeAlt' },
      { pillar: 'Process Context', status: 'pass', details: 'Legitimate SQL batch job; no anomalous process execution', score: 85, icon: 'HiOutlineCpuChip' },
      { pillar: 'Device Hygiene', status: 'pass', details: 'Azure-managed VM; all compliance checks passed', score: 100, icon: 'HiOutlineShieldCheck' },
      { pillar: 'ITDR / Behavior', status: 'warning', details: 'Non-sovereign egress path detected; potential data residency violation', score: 30, icon: 'HiOutlineExclamationTriangle' },
    ],
    remediations: [
      { id: 'rem_010', label: 'Drop Non-Sovereign Path', description: 'Block foreign BGP ASN egress path', icon: 'HiOutlineXCircle', type: 'reroute', status: 'executing' },
      { id: 'rem_011', label: 'Force Sovereign VPC', description: 'Route through AWS In-Country Sovereign VPC PrivateLink', icon: 'HiOutlineGlobeAlt', type: 'reroute', status: 'available' },
    ],
    hieroTxHash: '0x9d2f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
    rollbackSnapshotId: 'snap_tx_491030_hiero',
    blastRadius: 1,
    confidenceScore: 0.87,
  },
];

// Pillar color mapping
const PILLAR_COLORS: Record<string, string> = {
  'Network / QoE': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  'Process Context': 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  'Device Hygiene': 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
  'ITDR / Behavior': 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
};

const PILLAR_BORDER_COLORS: Record<string, string> = {
  'Network / QoE': 'border-blue-500/40',
  'Process Context': 'border-purple-500/40',
  'Device Hygiene': 'border-emerald-500/40',
  'ITDR / Behavior': 'border-amber-500/40',
};

const STATUS_STYLES = {
  resolving: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: HiOutlineClock },
  resolved: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: HiOutlineCheckCircle },
  escalated: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: HiOutlineExclamationTriangle },
};

export default function ForensicsPage() {
  const [records, setRecords] = useState<ForensicRecord[]>(MOCK_FORENSICS);
  const [selectedRecord, setSelectedRecord] = useState<ForensicRecord | null>(MOCK_FORENSICS[0]);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'resolving' | 'resolved' | 'escalated'>('all');
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('noc-team@apexastute.com,soc-team@apexastute.com');

  const filteredRecords = records.filter(r => filterStatus === 'all' || r.status === filterStatus);

  const handleRemediation = useCallback(async (recordId: string, actionId: string) => {
    setIsExecuting(actionId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          remediations: r.remediations.map(rem =>
            rem.id === actionId ? { ...rem, status: 'completed' as const } : rem
          ),
        };
      }
      return r;
    }));
    setIsExecuting(null);
  }, []);

  const handleChat = useCallback(async () => {
    if (!chatMessage.trim() || !selectedRecord) return;
    const userMsg = chatMessage.trim();
    setChatHistory(prev => [...prev, { role: 'user', message: userMsg }]);
    setChatMessage('');

    await new Promise(resolve => setTimeout(resolve, 800));

    let aiResponse = '';
    const lowerMsg = userMsg.toLowerCase();

    if (lowerMsg.includes('evidence') || lowerMsg.includes('what caused')) {
      aiResponse = `Based on the forensic analysis of incident ${selectedRecord.id}:\n\n${selectedRecord.evidenceChain.map(e => `• ${e.pillar}: ${e.details}`).join('\n')}\n\nConfidence Score: ${(selectedRecord.confidenceScore * 100).toFixed(0)}%`;
    } else if (lowerMsg.includes('rollback') || lowerMsg.includes('revert')) {
      aiResponse = `I'll initiate rollback to snapshot ${selectedRecord.rollbackSnapshotId}. This will restore the system to the state before remediation ${selectedRecord.id} was applied.\n\nHiero TX Hash: ${selectedRecord.hieroTxHash.slice(0, 20)}...`;
    } else if (lowerMsg.includes('escalate') || lowerMsg.includes('noc') || lowerMsg.includes('soc')) {
      aiResponse = `Escalating incident ${selectedRecord.id} to NOC/SOC review queue with full forensic evidence package.\n\nEvidence chain includes ${selectedRecord.evidenceChain.length} corroborated signals across ${selectedRecord.evidenceChain.filter(e => e.status === 'fail').length} failed pillars.`;
    } else if (lowerMsg.includes('suppress') || lowerMsg.includes('ignore')) {
      aiResponse = `I can suppress this alert for a specified duration, but I'll need admin justification for the immutable audit trail.\n\nWarning: Suppression is recorded as a new Hiero DLT transaction and is non-repudiable.`;
    } else {
      aiResponse = `I can help you analyze incident ${selectedRecord.id}. Try asking:\n• "What evidence caused this alert?"\n• "Rollback to previous state"\n• "Escalate to NOC/SOC"\n• "Suppress alert for 30 minutes"`;
    }

    setChatHistory(prev => [...prev, { role: 'ai', message: aiResponse }]);
  }, [chatMessage, selectedRecord]);

  const handleSendEvidenceEmail = useCallback(() => {
    if (!selectedRecord) return;
    const subject = `[${selectedRecord.id}] ${selectedRecord.causalRootCause.slice(0, 80)}...`;
    const body = `
Forensic Evidence Report - ${selectedRecord.id}
================================================
Session: ${selectedRecord.sessionId}
User: ${selectedRecord.userName}
Host: ${selectedRecord.host} (${selectedRecord.ipAddress})
Timestamp: ${selectedRecord.timestamp}

CAUSAL ROOT CAUSE:
${selectedRecord.causalRootCause}

EVIDENCE CHAIN:
${selectedRecord.evidenceChain.map(e => `[${e.status.toUpperCase()}] ${e.pillar}: ${e.details} (Score: ${e.score}/100)`).join('\n')}

REMEDIATIONS APPLIED:
${selectedRecord.remediations.filter(r => r.status === 'completed').map(r => `✓ ${r.label}: ${r.description}`).join('\n')}

HIERO DLT TX: ${selectedRecord.hieroTxHash}
ROLLBACK SNAPSHOT: ${selectedRecord.rollbackSnapshotId}
BLAST RADIUS: ${selectedRecord.blastRadius} entities
CONFIDENCE: ${(selectedRecord.confidenceScore * 100).toFixed(0)}%
    `.trim();

    const mailtoLink = `mailto:${emailRecipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
    setShowEmailModal(false);
  }, [selectedRecord, emailRecipients]);

  return (
    <div className="min-h-screen bg-[#0a0819] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-400" />
              Causal Forensics & Autonomous Remediation Hub
            </h1>
            <p className="text-sm text-gray-400 mt-1">Evidence-gated remediation with rollback verification</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors">
              <HiOutlineCommandLine className="w-4 h-4" />
              Voice Command
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors">
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Records List */}
        <div className="w-80 border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <div className="flex gap-2">
              {(['all', 'resolving', 'resolved', 'escalated'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredRecords.map(record => {
              const statusStyle = STATUS_STYLES[record.status];
              const StatusIcon = statusStyle.icon;
              const isExpanded = expandedRecord === record.id;
              return (
                <div key={record.id} className="border-b border-white/5">
                  <button
                    onClick={() => {
                      setSelectedRecord(record);
                      setExpandedRecord(isExpanded ? null : record.id);
                    }}
                    className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{record.id}</span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text} border`}>
                        <StatusIcon className="w-3 h-3" />
                        {record.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{record.userName}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(record.timestamp).toLocaleTimeString()}</p>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      <p className="text-xs text-gray-300 line-clamp-2">{record.causalRootCause}</p>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">
                          Confidence: {(record.confidenceScore * 100).toFixed(0)}%
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">
                          Blast: {record.blastRadius}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Panel - Detail View */}
        <div className="flex-1 overflow-y-auto">
          {selectedRecord ? (
            <div className="p-6 space-y-6">
              {/* Record Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="text-indigo-400">{selectedRecord.id}</span>
                    <span className={`px-3 py-1 rounded-full text-sm ${STATUS_STYLES[selectedRecord.status].bg} ${STATUS_STYLES[selectedRecord.status].border} ${STATUS_STYLES[selectedRecord.status].text} border`}>
                      {selectedRecord.status.toUpperCase()}
                    </span>
                  </h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <span>Session: {selectedRecord.sessionId}</span>
                    <span>User: {selectedRecord.userName}</span>
                    <span>Host: {selectedRecord.host}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    <HiOutlineEnvelope className="w-4 h-4" />
                    Send Evidence
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors">
                    <FiDownload className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>
              </div>

              {/* Causal Root Cause */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-2">
                  <FiSearch className="w-4 h-4" />
                  Causal Root Cause
                </h3>
                <p className="text-gray-200">{selectedRecord.causalRootCause}</p>
              </div>

              {/* 4-Pillar Evidence */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <HiOutlineShieldCheck className="w-4 h-4" />
                  4-Pillar Forensic Breakdown
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedRecord.evidenceChain.map((evidence, idx) => (
                    <motion.div
                      key={evidence.pillar}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`rounded-xl border bg-gradient-to-br ${PILLAR_COLORS[evidence.pillar]} p-4`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">{evidence.pillar}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          evidence.status === 'pass' ? 'bg-emerald-500/20 text-emerald-400' :
                          evidence.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {evidence.status === 'pass' ? 'PASS' : evidence.status === 'warning' ? 'WARN' : 'FAIL'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{evidence.details}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${evidence.score}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className={`h-full rounded-full ${
                              evidence.score >= 80 ? 'bg-emerald-500' :
                              evidence.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-10 text-right">{evidence.score}/100</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Remediation Actions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <HiOutlineArrowPath className="w-4 h-4" />
                  Executed & Available Remediation Actions
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {selectedRecord.remediations.map((action, idx) => (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => action.status === 'available' && handleRemediation(selectedRecord.id, action.id)}
                      disabled={action.status !== 'available' || isExecuting === action.id}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        action.status === 'completed'
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : action.status === 'executing' || isExecuting === action.id
                          ? 'bg-amber-500/10 border-amber-500/30 animate-pulse'
                          : action.status === 'available'
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/30 cursor-pointer'
                          : 'bg-white/5 border-white/10 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {action.status === 'completed' ? (
                          <HiOutlineCheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : isExecuting === action.id ? (
                          <FiRefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                        ) : (
                          <HiOutlineArrowPath className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-white">{action.label}</span>
                      </div>
                      <p className="text-xs text-gray-400">{action.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Ledger & Rollback */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">Hiero DLT Ledger Snapshot</h4>
                  <p className="text-sm text-gray-300 font-mono break-all">{selectedRecord.hieroTxHash}</p>
                  <button className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-sm text-indigo-400 hover:bg-indigo-500/30 transition-colors">
                    <HiOutlineArrowUturnLeft className="w-4 h-4" />
                    Rollback to Snapshot
                  </button>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">Blast Radius & Confidence</h4>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-2xl font-bold text-white">{selectedRecord.blastRadius}</p>
                      <p className="text-xs text-gray-400">Entities Affected</p>
                    </div>
                    <div className="h-12 w-px bg-white/10" />
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">{(selectedRecord.confidenceScore * 100).toFixed(0)}%</p>
                      <p className="text-xs text-gray-400">Confidence</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a forensic record to view details
            </div>
          )}
        </div>

        {/* Right Panel - AI Chat */}
        <div className="w-96 border-l border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <HiOutlineChatBubbleLeftRight className="w-4 h-4 text-indigo-400" />
              AI Forensic Assistant
            </h3>
            <p className="text-xs text-gray-400 mt-1">Ask about evidence, rollbacks, or escalation</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                <HiOutlineChatBubbleLeftRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Ask about the current incident</p>
                <div className="mt-4 space-y-2">
                  {['What evidence caused this alert?', 'Escalate to NOC/SOC', 'Rollback to previous state'].map(q => (
                    <button
                      key={q}
                      onClick={() => { setChatMessage(q); }}
                      className="block w-full text-left px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-white/10 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-500/20 border border-indigo-500/30 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-300'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-white/5">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder="Ask about evidence, rollback, escalate..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
              />
              <button
                onClick={handleChat}
                disabled={!chatMessage.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#12101f] border border-white/10 rounded-2xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Send Forensic Evidence</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Recipients</label>
                  <input
                    type="text"
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Subject</label>
                  <p className="text-sm text-gray-300 bg-white/5 rounded-lg px-4 py-2">
                    [{selectedRecord?.id}] {selectedRecord?.causalRootCause.slice(0, 60)}...
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEvidenceEmail}
                    className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                  >
                    Send Evidence
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
