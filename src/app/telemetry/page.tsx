'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Brain, AlertTriangle, CheckCircle, Clock, Shield,
  ChevronDown, ChevronUp, FileText, Send, Lock, Ban,
  Globe, Cpu, Activity, Network
} from 'lucide-react';

// Types
interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: 'security' | 'risk' | 'ai-agentic' | 'endpoint' | 'network' | 'isolation' | 'endpoint-dlp' | 'transit-dlp';
  userId: string;
  host: string;
  target: string;
  executionContext: 'human' | 'ai-agent';
  agentType?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  aiSynthesis: string;
  supplyChainAlert?: {
    packageName: string;
    claimedPurpose: string;
    actualBehavior: string;
    divergenceType: string;
  };
  causalTrace: {
    cateScoreDelta: string;
    edrHealth: string;
    nicSaturation: number;
    dlpTriggers: string[];
    containment: string;
  };
  affectedCIs: Array<{ name: string; type: string; status: 'healthy' | 'degraded' | 'down' }>;
  userImpact: string;
  businessImpact: string;
  hieroTxHash?: string;
}

// Mock data
const MOCK_EVENTS: TelemetryEvent[] = [
  {
    id: 'EVT-8f92a1',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    type: 'ai-agentic',
    userId: 'claude-agent-001',
    host: '10.0.4.12',
    target: 'api.openai.com',
    executionContext: 'ai-agent',
    agentType: 'Claude',
    severity: 'high',
    summary: 'Autonomous AI agent attempted unauthorized API call to external LLM endpoint.',
    aiSynthesis: 'CATE score degraded from 85 to 42 due to unexpected outbound connection pattern. Agent token spawned detached PowerShell process attempting to exfiltrate prompt context containing PCI data.',
    supplyChainAlert: {
      packageName: 'fast-logger',
      claimedPurpose: 'Utility logger for Node.js applications',
      actualBehavior: 'Constant-propagated socket opening to unapproved external IP 185.234.xx.xx',
      divergenceType: 'AST Semantic Divergence',
    },
    causalTrace: {
      cateScoreDelta: '85 → 42 (-43)',
      edrHealth: 'Healthy',
      nicSaturation: 34,
      dlpTriggers: ['PII detection in prompt payload', 'PCI card number regex match'],
      containment: 'Session isolated, OAuth token revoked, Agent subprocess killed',
    },
    affectedCIs: [
      { name: 'claude-agent-001', type: 'AI Agent', status: 'down' },
      { name: 'api.openai.com', type: 'External API', status: 'degraded' },
    ],
    userImpact: 'AI agent functionality suspended pending review',
    businessImpact: 'Automated workflows dependent on AI agent halted',
    hieroTxHash: '0x8f92a1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
  },
  {
    id: 'EVT-7e81b2',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    type: 'security',
    userId: 'john.doe@corp.com',
    host: 'workstation-042',
    target: 'suspicious-domain.ru',
    executionContext: 'human',
    severity: 'critical',
    summary: 'User attempted to access known malware distribution domain. DNS blocked at resolver level.',
    aiSynthesis: 'DNS sinkhole intercepted query for C2 domain. User redirected to coach page. Risk score: 95/100. No data exfiltration detected.',
    causalTrace: {
      cateScoreDelta: '92 → 12 (-80)',
      edrHealth: 'Healthy',
      nicSaturation: 28,
      dlpTriggers: [],
      containment: 'DNS blocked, user redirected to coach page',
    },
    affectedCIs: [
      { name: 'workstation-042', type: 'Endpoint', status: 'healthy' },
      { name: 'suspicious-domain.ru', type: 'External Domain', status: 'down' },
    ],
    userImpact: 'User redirected to security coach page',
    businessImpact: 'Potential security breach contained at DNS level',
    hieroTxHash: '0x7e81b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
  },
  {
    id: 'EVT-supply-001',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    type: 'endpoint',
    userId: 'dev-pipeline',
    host: 'ci-runner-03',
    target: 'npm-registry',
    executionContext: 'ai-agent',
    agentType: 'GitHub Actions',
    severity: 'high',
    summary: 'Supply chain attack detected: npm package fast-logger contains malicious socket exfiltration.',
    aiSynthesis: 'Blocked npm install fast-logger: Manifest claimed utility logger, but AST analysis identified constant-propagated socket opening to unapproved external IP. Package hash quarantined across fleet.',
    supplyChainAlert: {
      packageName: 'fast-logger@2.1.4',
      claimedPurpose: 'Lightweight logging utility',
      actualBehavior: 'Establishes persistent TCP socket to 185.234.112.45:443, exfiltrates environment variables',
      divergenceType: 'Taint Path Analysis',
    },
    causalTrace: {
      cateScoreDelta: 'N/A (CI Pipeline)',
      edrHealth: 'Healthy',
      nicSaturation: 15,
      dlpTriggers: ['Socket connection to unapproved IP'],
      containment: 'Package installation blocked, hash quarantined across fleet',
    },
    affectedCIs: [
      { name: 'ci-runner-03', type: 'CI/CD Runner', status: 'healthy' },
      { name: 'fast-logger@2.1.4', type: 'NPM Package', status: 'down' },
    ],
    userImpact: 'CI pipeline paused for package verification',
    businessImpact: 'Build pipeline delayed, no production impact',
    hieroTxHash: '0xsupply001a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
  },
];

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const TYPE_COLORS: Record<string, string> = {
  security: 'bg-red-500/20 text-red-400 border-red-500/30',
  risk: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'ai-agentic': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  endpoint: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  network: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  isolation: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'endpoint-dlp': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'transit-dlp': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

export default function TelemetryPage() {
  const [selectedEvent, setSelectedEvent] = useState<TelemetryEvent | null>(null);
  const [expandedTrace, setExpandedTrace] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [showITSMModal, setShowITSMModal] = useState(false);

  const filteredEvents = filter === 'all' 
    ? MOCK_EVENTS 
    : MOCK_EVENTS.filter(e => e.type === filter);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-100">Unified AI Telemetry & Ledger</h1>
        <p className="text-xs text-gray-400 mt-1">
          AI-synthesized narrative feed consolidating all 8 legacy event streams into a single chronological story.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {['all', 'security', 'ai-agentic', 'endpoint', 'network', 'supply'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors border ${
              filter === type
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
            }`}
          >
            {type === 'all' ? 'All Events' : type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Event List */}
        <div className="lg:col-span-2 space-y-2">
          {filteredEvents.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedEvent(event)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedEvent?.id === event.id
                  ? 'border-indigo-500/50 bg-indigo-500/5'
                  : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="font-mono text-[10px] text-gray-500">{event.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${TYPE_COLORS[event.type]}`}>
                      {event.type.replace(/-/g, ' ')}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${SEVERITY_COLORS[event.severity]}`}>
                      {event.severity}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                      event.executionContext === 'ai-agent' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}>
                      {event.executionContext === 'ai-agent' ? `🤖 ${event.agentType || 'AI Agent'}` : '👤 Human'}
                    </span>
                    {event.supplyChainAlert && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] border bg-red-500/20 text-red-400 border-red-500/30">
                        ⛓️ Supply Chain
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-1">{event.summary}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                    <span>{event.host}</span>
                    <span>→</span>
                    <span>{event.target}</span>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 whitespace-nowrap">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Event Detail Panel */}
        <div className="lg:col-span-1">
          {selectedEvent ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 sticky top-4 space-y-3">
              {/* Event Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-gray-400">{selectedEvent.id}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] border ${SEVERITY_COLORS[selectedEvent.severity]}`}>
                  {selectedEvent.severity.toUpperCase()}
                </span>
              </div>

              {/* Entity Context */}
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <div className="text-[10px] text-gray-500 mb-1.5">Entity Context</div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div><span className="text-gray-500">User: </span><span className="text-gray-300">{selectedEvent.userId}</span></div>
                  <div><span className="text-gray-500">Host: </span><span className="text-gray-300">{selectedEvent.host}</span></div>
                  <div><span className="text-gray-500">Target: </span><span className="text-gray-300">{selectedEvent.target}</span></div>
                  <div><span className="text-gray-500">Context: </span>
                    <span className={selectedEvent.executionContext === 'ai-agent' ? 'text-purple-400' : 'text-blue-400'}>
                      {selectedEvent.executionContext === 'ai-agent' ? `AI: ${selectedEvent.agentType}` : 'Human Interactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Synthesis */}
              <div className="p-2.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
                <div className="text-[10px] text-purple-400 mb-1 font-medium">AI Narrative Summary</div>
                <p className="text-xs text-gray-300">{selectedEvent.aiSynthesis}</p>
              </div>

              {/* Supply Chain Alert */}
              {selectedEvent.supplyChainAlert && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-[10px] text-red-400 mb-1.5 font-medium flex items-center gap-1">
                    <Lock size={10} /> Supply Chain Alert
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div><span className="text-gray-500">Package: </span><span className="text-white font-mono">{selectedEvent.supplyChainAlert.packageName}</span></div>
                    <div><span className="text-gray-500">Claimed: </span><span className="text-gray-300">{selectedEvent.supplyChainAlert.claimedPurpose}</span></div>
                    <div><span className="text-gray-500">Actual: </span><span className="text-red-400">{selectedEvent.supplyChainAlert.actualBehavior}</span></div>
                    <div><span className="text-gray-500">Detection: </span><span className="text-amber-400">{selectedEvent.supplyChainAlert.divergenceType}</span></div>
                  </div>
                </div>
              )}

              {/* Drill-Down Causal Trace */}
              <div>
                <button
                  onClick={() => setExpandedTrace(!expandedTrace)}
                  className="flex items-center justify-between w-full text-[10px] text-gray-500 font-medium mb-1.5"
                >
                  <span>Causal Trace</span>
                  {expandedTrace ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="p-1.5 rounded bg-white/5 border border-white/10">
                    <div className="text-gray-500">CATE Score</div>
                    <div className="font-mono text-cyan-400">{selectedEvent.causalTrace.cateScoreDelta}</div>
                  </div>
                  <div className="p-1.5 rounded bg-white/5 border border-white/10">
                    <div className="text-gray-500">EDR Health</div>
                    <div className="text-emerald-400">{selectedEvent.causalTrace.edrHealth}</div>
                  </div>
                  <div className="p-1.5 rounded bg-white/5 border border-white/10">
                    <div className="text-gray-500">NIC Saturation</div>
                    <div className="font-mono text-amber-400">{selectedEvent.causalTrace.nicSaturation}%</div>
                  </div>
                  <div className="p-1.5 rounded bg-white/5 border border-white/10">
                    <div className="text-gray-500">Containment</div>
                    <div className="text-gray-300 truncate">{selectedEvent.causalTrace.containment}</div>
                  </div>
                </div>
                {expandedTrace && selectedEvent.causalTrace.dlpTriggers.length > 0 && (
                  <div className="mt-1.5 p-2 rounded bg-red-500/10 border border-red-500/20">
                    <div className="text-[10px] text-red-400 mb-1">DLP Triggers</div>
                    {selectedEvent.causalTrace.dlpTriggers.map((trigger, i) => (
                      <div key={i} className="text-[10px] text-gray-300">• {trigger}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Hub */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-gray-500 font-medium">Actions</div>
                <button 
                  onClick={() => setShowITSMModal(true)}
                  className="w-full py-1.5 px-2 rounded-lg bg-indigo-500/20 text-indigo-400 text-[10px] hover:bg-indigo-500/30 transition-colors border border-indigo-500/30 flex items-center justify-center gap-1"
                >
                  <FileText size={10} /> Auto-Draft ITSM CR
                </button>
                <button className="w-full py-1.5 px-2 rounded-lg bg-amber-500/20 text-amber-400 text-[10px] hover:bg-amber-500/30 transition-colors border border-amber-500/30 flex items-center justify-center gap-1">
                  <Send size={10} /> Escalate to CISO
                </button>
                <button className="w-full py-1.5 px-2 rounded-lg bg-red-500/20 text-red-400 text-[10px] hover:bg-red-500/30 transition-colors border border-red-500/30 flex items-center justify-center gap-1">
                  <Zap size={10} /> Quick Break-Glass
                </button>
                {selectedEvent.supplyChainAlert && (
                  <button className="w-full py-1.5 px-2 rounded-lg bg-orange-500/20 text-orange-400 text-[10px] hover:bg-orange-500/30 transition-colors border border-orange-500/30 flex items-center justify-center gap-1">
                    <Ban size={10} /> Quarantine Package
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center text-gray-500 text-xs">
              Select an event to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Zap(props: { size: number; className?: string }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
