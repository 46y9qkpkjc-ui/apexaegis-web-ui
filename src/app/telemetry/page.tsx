'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineDocumentText, HiOutlineClock, HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineArrowPath, HiOutlineShieldCheck, HiOutlineChatBubbleLeftRight, HiOutlinePaperAirplane, HiOutlineXMark } from 'react-icons/hi2';
import { FiSend, FiRefreshCw } from 'react-icons/fi';

interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: 'security' | 'risk' | 'ai-agentic' | 'endpoint' | 'network' | 'isolation' | 'endpoint-dlp' | 'transit-dlp';
  userId: string;
  host: string;
  target: string;
  context: 'human' | 'ai-agent';
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  details: {
    cateScore: number;
    edrHealth: string;
    nicSaturation: number;
    dlpTriggers: string[];
    containment: string;
  };
  affectedCIs: Array<{ name: string; type: string; status: 'healthy' | 'degraded' | 'down' }>;
  userImpact: string;
  businessImpact: string;
}

interface ITSMTicket {
  id: string;
  templateId: string;
  title: string;
  description: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  severity: 'S1' | 'S2' | 'S3' | 'S4';
  impact: 'Enterprise' | 'Department' | 'Workgroup' | 'Individual';
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  affectedCIs: string[];
  assignee: string;
  status: 'draft' | 'submitted' | 'in_progress' | 'resolved';
  aiReasoning: string;
}

const MOCK_EVENTS: TelemetryEvent[] = [
  {
    id: 'EVT-8f92a1',
    timestamp: '2024-01-15T14:32:18Z',
    type: 'ai-agentic',
    userId: 'claude-agent-001',
    host: '10.0.4.12',
    target: 'api.openai.com',
    context: 'ai-agent',
    severity: 'high',
    summary: 'Autonomous AI agent attempted unauthorized API call to external LLM endpoint. CATE score degraded from 85 to 42 due to unexpected outbound connection pattern.',
    details: {
      cateScore: 42,
      edrHealth: 'Healthy',
      nicSaturation: 34,
      dlpTriggers: ['PII detection in prompt payload'],
      containment: 'Session isolated, OAuth token revoked',
    },
    affectedCIs: [
      { name: 'claude-agent-001', type: 'AI Agent', status: 'degraded' },
      { name: 'api.openai.com', type: 'External API', status: 'down' },
    ],
    userImpact: 'AI agent functionality suspended pending review',
    businessImpact: 'Automated workflows dependent on AI agent halted',
  },
  {
    id: 'EVT-7e81b2',
    timestamp: '2024-01-15T14:28:05Z',
    type: 'security',
    userId: 'john.doe@corp.com',
    host: 'workstation-042',
    target: 'suspicious-domain.ru',
    context: 'human',
    severity: 'critical',
    summary: 'User attempted to access known malware distribution domain. DNS blocked at resolver level with live threat intelligence scoring.',
    details: {
      cateScore: 12,
      edrHealth: 'Healthy',
      nicSaturation: 28,
      dlpTriggers: [],
      containment: 'DNS blocked, user redirected to coach page',
    },
    affectedCIs: [
      { name: 'workstation-042', type: 'Endpoint', status: 'healthy' },
      { name: 'suspicious-domain.ru', type: 'External Domain', status: 'down' },
    ],
    userImpact: 'User redirected to security coach page for remediation',
    businessImpact: 'Potential security breach contained at DNS level',
  },
  {
    id: 'EVT-6d72c3',
    timestamp: '2024-01-15T14:25:33Z',
    type: 'endpoint',
    userId: 'sarah.smith@corp.com',
    host: 'macbook-pro-018',
    target: 'internal-fileshare',
    context: 'human',
    severity: 'medium',
    summary: 'Endpoint NIC contention detected. Background process consuming 78% of physical NIC bandwidth during active Teams call.',
    details: {
      cateScore: 65,
      edrHealth: 'Healthy',
      nicSaturation: 78,
      dlpTriggers: [],
      containment: 'Dynamic throttling applied, call quality restored',
    },
    affectedCIs: [
      { name: 'macbook-pro-018', type: 'Endpoint', status: 'degraded' },
      { name: 'internal-fileshare', type: 'File Server', status: 'healthy' },
    ],
    userImpact: 'Teams call quality degraded for 45 seconds',
    businessImpact: 'Minimal - auto-remediated',
  },
  {
    id: 'EVT-5c63d4',
    timestamp: '2024-01-15T14:22:10Z',
    type: 'transit-dlp',
    userId: 'api-service-account',
    host: 'backend-server-03',
    target: 's3.amazonaws.com',
    context: 'ai-agent',
    severity: 'low',
    summary: 'Automated backup service transferring encrypted data to S3 bucket. Transit DLP scan clean, no PII detected.',
    details: {
      cateScore: 92,
      edrHealth: 'Healthy',
      nicSaturation: 45,
      dlpTriggers: [],
      containment: 'None required',
    },
    affectedCIs: [
      { name: 'backend-server-03', type: 'Server', status: 'healthy' },
      { name: 's3.amazonaws.com', type: 'Cloud Storage', status: 'healthy' },
    ],
    userImpact: 'None',
    businessImpact: 'None - routine backup',
  },
];

const EVENT_TYPE_COLORS: Record<string, string> = {
  'security': 'bg-red-500/20 text-red-400 border-red-500/30',
  'risk': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'ai-agentic': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'endpoint': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'network': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'isolation': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'endpoint-dlp': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'transit-dlp': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

const SEVERITY_COLORS: Record<string, string> = {
  'low': 'bg-green-500/20 text-green-400 border-green-500/30',
  'medium': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'high': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'critical': 'bg-red-500/20 text-red-400 border-red-500/30',
};

const PRIORITY_CONFIG = {
  P1: { label: 'P1 - Emergency', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  P2: { label: 'P2 - High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  P3: { label: 'P3 - Medium', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  P4: { label: 'P4 - Low', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

const SEVERITY_CONFIG = {
  S1: { label: 'S1 - Critical', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  S2: { label: 'S2 - High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  S3: { label: 'S3 - Medium', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  S4: { label: 'S4 - Low', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

export default function TelemetryPage() {
  const [selectedEvent, setSelectedEvent] = useState<TelemetryEvent | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [showITSMModal, setShowITSMModal] = useState(false);
  const [itsmTicket, setItsmTicket] = useState<ITSMTicket | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([]);

  const filteredEvents = filter === 'all' 
    ? MOCK_EVENTS 
    : MOCK_EVENTS.filter(e => e.type === filter);

  const computeAIPriority = useCallback((event: TelemetryEvent): { priority: ITSMTicket['priority']; severity: ITSMTicket['severity']; impact: ITSMTicket['impact']; urgency: ITSMTicket['urgency']; reasoning: string } => {
    let priority: ITSMTicket['priority'] = 'P4';
    let severity: ITSMTicket['severity'] = 'S4';
    let impact: ITSMTicket['impact'] = 'Individual';
    let urgency: ITSMTicket['urgency'] = 'Low';
    let reasoning = '';

    // Compute based on severity
    if (event.severity === 'critical') {
      priority = 'P1';
      severity = 'S1';
      urgency = 'Critical';
      reasoning += 'Critical severity event detected. ';
    } else if (event.severity === 'high') {
      priority = 'P2';
      severity = 'S2';
      urgency = 'High';
      reasoning += 'High severity event detected. ';
    } else if (event.severity === 'medium') {
      priority = 'P3';
      severity = 'S3';
      urgency = 'Medium';
      reasoning += 'Medium severity event detected. ';
    } else {
      priority = 'P4';
      severity = 'S4';
      urgency = 'Low';
      reasoning += 'Low severity event detected. ';
    }

    // Compute based on user impact
    if (event.userImpact.includes('suspended') || event.userImpact.includes('breach')) {
      impact = 'Enterprise';
      reasoning += 'Enterprise-wide impact detected. ';
    } else if (event.userImpact.includes('halted') || event.userImpact.includes('degraded')) {
      impact = 'Department';
      reasoning += 'Department-level impact. ';
    } else if (event.userImpact.includes('auto-remediated')) {
      impact = 'Workgroup';
      reasoning += 'Workgroup impact, auto-remediated. ';
    } else {
      impact = 'Individual';
      reasoning += 'Individual impact. ';
    }

    // Compute based on business impact
    if (event.businessImpact.includes('potential security breach') || event.businessImpact.includes('halted')) {
      priority = 'P1';
      urgency = 'Critical';
      reasoning += 'Business-critical function affected. ';
    } else if (event.businessImpact.includes('degraded')) {
      if (priority === 'P4') priority = 'P3';
      reasoning += 'Business function degraded. ';
    }

    // Compute based on CATE score
    if (event.details.cateScore < 30) {
      severity = 'S1';
      reasoning += `CATE score critically low (${event.details.cateScore}/100). `;
    } else if (event.details.cateScore < 60) {
      if (severity === 'S4') severity = 'S3';
      reasoning += `CATE score below threshold (${event.details.cateScore}/100). `;
    }

    // Compute based on DLP triggers
    if (event.details.dlpTriggers.length > 0) {
      priority = 'P1';
      severity = 'S1';
      reasoning += `DLP triggers detected: ${event.details.dlpTriggers.join(', ')}. `;
    }

    return { priority, severity, impact, urgency, reasoning };
  }, []);

  const handleCreateITSM = useCallback(async () => {
    if (!selectedEvent) return;
    setIsCreating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const aiMetrics = computeAIPriority(selectedEvent);
    const ticket: ITSMTicket = {
      id: `CR-${Date.now().toString(36).toUpperCase()}`,
      templateId: `ITSM-${selectedEvent.type.toUpperCase().replace('-', '_')}`,
      title: `[${selectedEvent.severity.toUpperCase()}] ${selectedEvent.summary.slice(0, 80)}...`,
      description: `Event ID: ${selectedEvent.id}\n\n${selectedEvent.summary}\n\nUser Impact: ${selectedEvent.userImpact}\n\nBusiness Impact: ${selectedEvent.businessImpact}`,
      priority: aiMetrics.priority,
      severity: aiMetrics.severity,
      impact: aiMetrics.impact,
      urgency: aiMetrics.urgency,
      affectedCIs: selectedEvent.affectedCIs.map(ci => ci.name),
      assignee: selectedEvent.severity === 'critical' ? 'SOC Team' : 'IT Operations',
      status: 'draft',
      aiReasoning: aiMetrics.reasoning,
    };

    setItsmTicket(ticket);
    setIsCreating(false);
  }, [selectedEvent, computeAIPriority]);

  const handleSubmitITSM = useCallback(async () => {
    if (!itsmTicket) return;
    setIsCreating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setItsmTicket(prev => prev ? { ...prev, status: 'submitted' } : null);
    setIsCreating(false);
  }, [itsmTicket]);

  const handleChat = useCallback(async () => {
    if (!chatMessage.trim() || !selectedEvent) return;
    const userMsg = chatMessage.trim();
    setChatHistory(prev => [...prev, { role: 'user', message: userMsg }]);
    setChatMessage('');

    await new Promise(resolve => setTimeout(resolve, 800));

    let aiResponse = '';
    const lowerMsg = userMsg.toLowerCase();

    if (lowerMsg.includes('itsm') || lowerMsg.includes('ticket') || lowerMsg.includes('cr')) {
      aiResponse = `I can help you create an ITSM Change Request for event ${selectedEvent.id}. Switch to the "Create ITSM CR" tab to generate a ticket with AI-computed priority and severity.`;
    } else if (lowerMsg.includes('escalate') || lowerMsg.includes('ciso')) {
      aiResponse = `Escalating event ${selectedEvent.id} to CISO review queue with full forensic evidence package.\n\nSeverity: ${selectedEvent.severity.toUpperCase()}\nCATE Score: ${selectedEvent.details.cateScore}/100\nDLP Triggers: ${selectedEvent.details.dlpTriggers.length}`;
    } else if (lowerMsg.includes('remediate') || lowerMsg.includes('fix')) {
      aiResponse = `Remediation for event ${selectedEvent.id}:\n\n${selectedEvent.details.containment}\n\nTo create an ITSM ticket for formal tracking, use the "Create ITSM CR" tab.`;
    } else {
      aiResponse = `I can help you with event ${selectedEvent.id}. Try asking:\n• "Create an ITSM ticket"\n• "Escalate to CISO"\n• "How do I fix this?"`;
    }

    setChatHistory(prev => [...prev, { role: 'ai', message: aiResponse }]);
  }, [chatMessage, selectedEvent]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Unified AI Telemetry & Ledger</h1>
        <p className="text-sm text-gray-400 mt-1">
          AI-synthesized narrative feed consolidating all 8 legacy event streams into a single chronological story.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'security', 'risk', 'ai-agentic', 'endpoint', 'network', 'isolation', 'endpoint-dlp', 'transit-dlp'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filter === type
                ? 'bg-cyan-600 text-white border-cyan-500'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 border-gray-700/50'
            }`}
          >
            {type === 'all' ? 'All Events' : type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredEvents.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedEvent(event)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedEvent?.id === event.id
                  ? 'border-cyan-500/50 bg-cyan-500/5'
                  : 'border-gray-700/50 bg-gray-900/50 hover:border-gray-600/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-gray-500">{event.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs border ${EVENT_TYPE_COLORS[event.type]}`}>
                      {event.type.replace(/-/g, ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs border ${SEVERITY_COLORS[event.severity]}`}>
                      {event.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs border ${
                      event.context === 'ai-agent' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}>
                      {event.context === 'ai-agent' ? '🤖 AI Agent' : '👤 Human'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{event.summary}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Host: {event.host}</span>
                    <span>Target: {event.target}</span>
                    <span>CATE: {event.details.cateScore}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Event Detail Panel */}
        <div className="lg:col-span-1">
          {selectedEvent ? (
            <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-6 sticky top-4 space-y-4">
              {/* Event Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-sm text-gray-400">{selectedEvent.id}</span>
                <span className={`px-2 py-1 rounded text-xs border ${SEVERITY_COLORS[selectedEvent.severity]}`}>
                  {selectedEvent.severity.toUpperCase()}
                </span>
              </div>

              {/* Entity Context Pill */}
              <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                <div className="text-xs text-gray-500 mb-2">Entity Context</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">User: </span>
                    <span className="text-gray-300">{selectedEvent.userId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Host: </span>
                    <span className="text-gray-300">{selectedEvent.host}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Target: </span>
                    <span className="text-gray-300">{selectedEvent.target}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Context: </span>
                    <span className={selectedEvent.context === 'ai-agent' ? 'text-purple-400' : 'text-blue-400'}>
                      {selectedEvent.context === 'ai-agent' ? 'Autonomous AI' : 'Human Interactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Synthesis */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
                <div className="text-xs text-purple-400 mb-2 font-medium">AI Narrative Summary</div>
                <p className="text-sm text-gray-300">{selectedEvent.summary}</p>
              </div>

              {/* Drill-Down Causal Trace */}
              <div className="space-y-2">
                <div className="text-xs text-gray-500 font-medium">Causal Trace</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-gray-800/50 border border-gray-700/50">
                    <div className="text-xs text-gray-500">CATE Score</div>
                    <div className="font-mono text-cyan-400">{selectedEvent.details.cateScore}</div>
                  </div>
                  <div className="p-2 rounded bg-gray-800/50 border border-gray-700/50">
                    <div className="text-xs text-gray-500">EDR Health</div>
                    <div className="text-green-400">{selectedEvent.details.edrHealth}</div>
                  </div>
                  <div className="p-2 rounded bg-gray-800/50 border border-gray-700/50">
                    <div className="text-xs text-gray-500">NIC Saturation</div>
                    <div className="font-mono text-amber-400">{selectedEvent.details.nicSaturation}%</div>
                  </div>
                  <div className="p-2 rounded bg-gray-800/50 border border-gray-700/50">
                    <div className="text-xs text-gray-500">Containment</div>
                    <div className="text-gray-300 text-xs">{selectedEvent.details.containment}</div>
                  </div>
                </div>
                {selectedEvent.details.dlpTriggers.length > 0 && (
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                    <div className="text-xs text-red-400 mb-1">DLP Triggers</div>
                    {selectedEvent.details.dlpTriggers.map((trigger, i) => (
                      <div key={i} className="text-xs text-gray-300">• {trigger}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Affected CIs */}
              <div className="space-y-2">
                <div className="text-xs text-gray-500 font-medium">Affected Configuration Items</div>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.affectedCIs.map((ci, i) => (
                    <span key={i} className={`px-2 py-1 rounded text-xs border ${
                      ci.status === 'healthy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      ci.status === 'degraded' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {ci.name} ({ci.type})
                    </span>
                  ))}
                </div>
              </div>

              {/* User & Business Impact */}
              <div className="space-y-2">
                <div className="text-xs text-gray-500 font-medium">Impact Assessment</div>
                <div className="p-2 rounded bg-gray-800/50 border border-gray-700/50 text-sm">
                  <span className="text-gray-500">User Impact: </span>
                  <span className="text-gray-300">{selectedEvent.userImpact}</span>
                </div>
                <div className="p-2 rounded bg-gray-800/50 border border-gray-700/50 text-sm">
                  <span className="text-gray-500">Business Impact: </span>
                  <span className="text-gray-300">{selectedEvent.businessImpact}</span>
                </div>
              </div>

              {/* Action Hub */}
              <div className="space-y-2">
                <div className="text-xs text-gray-500 font-medium">Actions</div>
                <button
                  onClick={() => { handleCreateITSM(); setShowITSMModal(true); }}
                  disabled={isCreating}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-600/20 text-cyan-400 text-sm hover:bg-cyan-600/30 transition-colors border border-cyan-500/30 flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      Computing...
                    </>
                  ) : (
                    <>
                      <HiOutlineDocumentText className="w-4 h-4" />
                      Create ITSM Change Request
                    </>
                  )}
                </button>
                <button className="w-full py-2 px-3 rounded-lg bg-amber-600/20 text-amber-400 text-sm hover:bg-amber-600/30 transition-colors border border-amber-500/30">
                  📨 Escalate to CISO
                </button>
                <button className="w-full py-2 px-3 rounded-lg bg-red-600/20 text-red-400 text-sm hover:bg-red-600/30 transition-colors border border-red-500/30">
                  ⚡ Quick Break-Glass
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-6 text-center text-gray-500">
              Select an event to view details
            </div>
          )}
        </div>
      </div>

      {/* ITSM Modal */}
      <AnimatePresence>
        {showITSMModal && itsmTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowITSMModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#12101f] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <HiOutlineDocumentText className="w-5 h-5 text-cyan-400" />
                  ITSM Change Request
                </h3>
                <button onClick={() => setShowITSMModal(false)} className="text-gray-400 hover:text-white">
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>

              {itsmTicket.status === 'submitted' ? (
                <div className="text-center py-8">
                  <HiOutlineCheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-white mb-1">Ticket Submitted</h4>
                  <p className="text-sm text-gray-400 mb-2">Your Change Request has been submitted successfully.</p>
                  <p className="text-xs text-gray-500">Ticket ID: {itsmTicket.id}</p>
                  <p className="text-xs text-gray-500 mt-1">Template: {itsmTicket.templateId}</p>
                  <button
                    onClick={() => { setShowITSMModal(false); setItsmTicket(null); }}
                    className="mt-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AI Computed Metrics */}
                  <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-indigo-400 mb-3">AI-Computed Ticket Metrics</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Priority</p>
                        <span className={`px-2 py-1 rounded text-sm font-medium border ${PRIORITY_CONFIG[itsmTicket.priority].color}`}>
                          {itsmTicket.priority}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Severity</p>
                        <span className={`px-2 py-1 rounded text-sm font-medium border ${SEVERITY_CONFIG[itsmTicket.severity].color}`}>
                          {itsmTicket.severity}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Impact</p>
                        <span className="px-2 py-1 rounded text-sm font-medium border bg-white/5 text-white border-white/10">
                          {itsmTicket.impact}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Urgency</p>
                        <span className="px-2 py-1 rounded text-sm font-medium border bg-white/5 text-white border-white/10">
                          {itsmTicket.urgency}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 p-2 rounded bg-indigo-500/5 border border-indigo-500/10">
                      <p className="text-xs text-gray-400 mb-1">AI Reasoning</p>
                      <p className="text-xs text-gray-300">{itsmTicket.aiReasoning}</p>
                    </div>
                  </div>

                  {/* Ticket Details */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Title</label>
                    <input
                      type="text"
                      value={itsmTicket.title}
                      onChange={(e) => setItsmTicket(prev => prev ? { ...prev, title: e.target.value } : null)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Description</label>
                    <textarea
                      value={itsmTicket.description}
                      onChange={(e) => setItsmTicket(prev => prev ? { ...prev, description: e.target.value } : null)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 h-32 resize-none"
                    />
                  </div>

                  {/* Affected CIs */}
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Affected Configuration Items</label>
                    <div className="flex flex-wrap gap-2">
                      {itsmTicket.affectedCIs.map((ci, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300">
                          {ci}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Assignee</label>
                      <select
                        value={itsmTicket.assignee}
                        onChange={(e) => setItsmTicket(prev => prev ? { ...prev, assignee: e.target.value } : null)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/50"
                      >
                        <option>SOC Team</option>
                        <option>IT Operations</option>
                        <option>Network Ops</option>
                        <option>Security Engineering</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Template</label>
                      <input
                        type="text"
                        value={itsmTicket.templateId}
                        readOnly
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowITSMModal(false)}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitITSM}
                      disabled={isCreating}
                      className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <FiRefreshCw className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <HiOutlinePaperAirplane className="w-4 h-4" />
                          Submit Change Request
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
