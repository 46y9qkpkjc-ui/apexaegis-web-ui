'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Cpu, Wifi, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Download, Lock, Eye, Server, Database,
  ChevronDown, ChevronUp, Play, Pause, RotateCcw
} from 'lucide-react';

// Types
interface ForensicEvidence {
  pillar: string;
  weight: number;
  score: number;
  status: 'pass' | 'fail' | 'warning';
  details: string[];
}

interface RemediationAction {
  id: string;
  label: string;
  icon: string;
  type: 'restart' | 'revoke' | 'kill' | 'purge' | 'isolate' | 'challenge';
  status: 'available' | 'executing' | 'completed' | 'failed';
}

interface SupplyChainInsight {
  packageName: string;
  controlFlow: string[];
  taintPaths: string[];
  deobfuscatedPayload: string;
}

interface ForensicRecord {
  id: string;
  timestamp: string;
  sessionId: string;
  userId: string;
  host: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  overallScore: number;
  pillars: ForensicEvidence[];
  remediations: RemediationAction[];
  supplyChainInsight?: SupplyChainInsight;
  hieroTxHash: string;
}

// Mock data
const MOCK_FORENSICS: ForensicRecord[] = [
  {
    id: 'REM-8821',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    sessionId: 'sess_8f92a1',
    userId: 'claude-agent-001',
    host: '10.0.4.12',
    severity: 'critical',
    overallScore: 28,
    pillars: [
      {
        pillar: 'Device Hygiene',
        weight: 30,
        score: 45,
        status: 'warning',
        details: [
          'CrowdStrike sensor heartbeat stale for 12m',
          'OS patches 45 days overdue',
          'Secure Boot: Verified',
          'BitLocker: Verified',
        ],
      },
      {
        pillar: 'User/Agent Behavior',
        weight: 30,
        score: 15,
        status: 'fail',
        details: [
          'AI agent spawned detached PowerShell process',
          'Impossible travel velocity detected',
          'Unauthorized outbound connection pattern',
          'Agent token used for mutating actions',
        ],
      },
      {
        pillar: 'Threat Telemetry & ITDR',
        weight: 25,
        score: 20,
        status: 'fail',
        details: [
          'Anomalous OAuth grant detected',
          'Credential stuffing signal from 3 IPs',
          'Software supply chain trojan detection',
        ],
      },
      {
        pillar: 'Network / Environmental',
        weight: 15,
        score: 65,
        status: 'warning',
        details: [
          'NIC saturation at 91% during incident',
          'BGP path normal (14ms latency)',
          'Sovereign routing verified',
        ],
      },
    ],
    remediations: [
      { id: 'rem_001', label: 'Restart EDR Sensor', icon: 'RefreshCw', type: 'restart', status: 'available' },
      { id: 'rem_002', label: 'Revoke Active Token', icon: 'Lock', type: 'revoke', status: 'available' },
      { id: 'rem_003', label: 'Kill Agent Subprocess', icon: 'XCircle', type: 'kill', status: 'completed' },
      { id: 'rem_004', label: 'Purge Poisoned Cache', icon: 'Database', type: 'purge', status: 'available' },
      { id: 'rem_005', label: 'Apply Host Isolation', icon: 'Server', type: 'isolate', status: 'available' },
      { id: 'rem_006', label: 'Push FIDO2 Challenge', icon: 'Shield', type: 'challenge', status: 'available' },
    ],
    supplyChainInsight: {
      packageName: 'fast-logger@2.1.4',
      controlFlow: [
        'require("fast-logger")',
        'Logger.init()',
        'Socket.connect("185.234.112.45:443")',
        'process.env → Buffer → socket.write()',
      ],
      taintPaths: [
        'process.env.AWS_SECRET_ACCESS_KEY → socket.write()',
        'process.env.DATABASE_URL → socket.write()',
      ],
      deobfuscatedPayload: 'Base64-encoded exfiltration routine disguised as "log formatting". Decoded: socket to external IP with env var payload.',
    },
    hieroTxHash: '0x8f92a1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
  },
];

const PILLAR_CONFIG: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  'Device Hygiene': { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  'User/Agent Behavior': { color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  'Threat Telemetry & ITDR': { color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
  'Network / Environmental': { color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' },
};

const REMEDIATION_ICONS: Record<string, typeof RefreshCw> = {
  RefreshCw, Lock, XCircle, Database, Server, Shield,
};

export default function ForensicsPage() {
  const [selectedRecord, setSelectedRecord] = useState<ForensicRecord | null>(MOCK_FORENSICS[0]);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const [showASTModal, setShowASTModal] = useState(false);
  const [executingRemediation, setExecutingRemediation] = useState<string | null>(null);

  const handleRemediation = useCallback(async (remId: string) => {
    setExecutingRemediation(remId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setExecutingRemediation(null);
  }, []);

  const getPillarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-100">Causal Forensic & Remediation Hub</h1>
        <p className="text-xs text-gray-400 mt-1">
          Forensic investigation and deterministic recovery engine across the 4 core risk pillars.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Record List */}
        <div className="lg:col-span-1 space-y-2">
          {MOCK_FORENSICS.map((record) => (
            <div
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedRecord?.id === record.id
                  ? 'border-indigo-500/50 bg-indigo-500/5'
                  : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] text-gray-400">{record.id}</span>
                <span className={`text-lg font-bold ${
                  record.overallScore >= 80 ? 'text-emerald-400' :
                  record.overallScore >= 50 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {record.overallScore}
                </span>
              </div>
              <div className="text-[10px] text-gray-500">{record.host} • {record.userId}</div>
            </div>
          ))}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
          {selectedRecord ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedRecord.id}</h2>
                    <p className="text-xs text-gray-400">Session: {selectedRecord.sessionId} • {selectedRecord.userId} @ {selectedRecord.host}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${
                      selectedRecord.overallScore >= 80 ? 'text-emerald-400' :
                      selectedRecord.overallScore >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {selectedRecord.overallScore}/100
                    </div>
                    <div className="text-[10px] text-gray-500">Overall Score</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-gray-500">
                  <span>Hiero TX: <span className="font-mono text-gray-400">{selectedRecord.hieroTxHash.slice(0, 20)}...</span></span>
                  <span>{new Date(selectedRecord.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* 4-Pillar Scoring */}
              <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">4-Pillar Shortfall Scoring</h3>
                <div className="space-y-2">
                  {selectedRecord.pillars.map((pillar) => {
                    const config = PILLAR_CONFIG[pillar.pillar] || { color: 'text-gray-400', bgColor: 'bg-white/5', borderColor: 'border-white/10' };
                    const isExpanded = expandedPillar === pillar.pillar;
                    return (
                      <div key={pillar.pillar} className={`${config.bgColor} border ${config.borderColor} rounded-lg overflow-hidden`}>
                        <div 
                          className="p-3 flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedPillar(isExpanded ? null : pillar.pillar)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-xs font-medium text-white">{pillar.pillar}</div>
                            <div className="text-[10px] text-gray-400">({pillar.weight}%)</div>
                            {pillar.status === 'fail' && <XCircle size={12} className="text-red-400" />}
                            {pillar.status === 'warning' && <AlertTriangle size={12} className="text-amber-400" />}
                            {pillar.status === 'pass' && <CheckCircle size={12} className="text-emerald-400" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div className={`h-full ${getPillarColor(pillar.score)} rounded-full`} style={{ width: `${pillar.score}%` }} />
                            </div>
                            <span className="text-xs font-mono text-white w-8 text-right">{pillar.score}</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-3 pb-3 border-t border-white/5 pt-2">
                            <ul className="space-y-1">
                              {pillar.details.map((detail, i) => (
                                <li key={i} className="text-[10px] text-gray-300 flex items-start gap-1.5">
                                  <span className="text-gray-500 mt-0.5">•</span>
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Supply Chain Inspector */}
              {selectedRecord.supplyChainInsight && (
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock size={12} className="text-red-400" /> Supply Chain AST Inspector
                    </h3>
                    <button
                      onClick={() => setShowASTModal(true)}
                      className="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    >
                      View Full Analysis
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] text-gray-500 mb-1">Package</div>
                      <div className="text-xs text-white font-mono">{selectedRecord.supplyChainInsight.packageName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 mb-1">Control Flow</div>
                      <div className="text-[10px] text-gray-300 font-mono">
                        {selectedRecord.supplyChainInsight.controlFlow.length} nodes
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Remediation Actions */}
              <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">AI-Guided Single-Click Remediation</h3>
                <div className="grid grid-cols-3 gap-2">
                  {selectedRecord.remediations.map((rem) => {
                    const Icon = REMEDIATION_ICONS[rem.icon] || RefreshCw;
                    return (
                      <button
                        key={rem.id}
                        onClick={() => rem.status === 'available' && handleRemediation(rem.id)}
                        disabled={rem.status !== 'available'}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          rem.status === 'completed'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : rem.status === 'executing' || executingRemediation === rem.id
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                            : rem.status === 'available'
                            ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-indigo-500/30 cursor-pointer'
                            : 'bg-white/5 border-white/10 text-gray-500 opacity-50'
                        }`}
                      >
                        <Icon size={16} className="mx-auto mb-1" />
                        <div className="text-[10px]">{rem.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center text-gray-500 text-xs">
              Select a forensic record to view details
            </div>
          )}
        </div>
      </div>

      {/* AST Modal */}
      <AnimatePresence>
        {showASTModal && selectedRecord?.supplyChainInsight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowASTModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#12101f] border border-white/10 rounded-2xl p-5 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-white mb-4">Supply Chain AST Analysis</h3>
              
              <div className="space-y-4">
                {/* Control Flow Graph */}
                <div>
                  <div className="text-[10px] text-gray-500 mb-2">Decompiled Control-Flow Graph</div>
                  <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs">
                    {selectedRecord.supplyChainInsight.controlFlow.map((node, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {i > 0 && <span className="text-gray-600">↓</span>}
                        <span className="text-cyan-400">{node}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Taint Paths */}
                <div>
                  <div className="text-[10px] text-gray-500 mb-2">Taint Path Analysis</div>
                  <div className="bg-gray-900 rounded-lg p-3 space-y-1">
                    {selectedRecord.supplyChainInsight.taintPaths.map((path, i) => (
                      <div key={i} className="text-xs font-mono text-red-400">{path}</div>
                    ))}
                  </div>
                </div>

                {/* Deobfuscated Payload */}
                <div>
                  <div className="text-[10px] text-gray-500 mb-2">Deobfuscated Payload</div>
                  <div className="bg-gray-900 rounded-lg p-3 text-xs text-amber-400 font-mono">
                    {selectedRecord.supplyChainInsight.deobfuscatedPayload}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowASTModal(false)}
                className="mt-4 w-full py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
