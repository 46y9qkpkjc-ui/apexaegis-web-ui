'use client';

import { useState } from 'react';

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
  },
  {
    id: 'EVT-7e81b2',
    timestamp: '2024-01-15T14:28:05Z',
    type: 'security',
    userId: 'john.doe@corp.com',
    host: ' workstation-042',
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
  },
];

const EVENT_TYPE_COLORS: Record<string, string> = {
  'security': 'bg-red-500/20 text-red-400',
  'risk': 'bg-amber-500/20 text-amber-400',
  'ai-agentic': 'bg-purple-500/20 text-purple-400',
  'endpoint': 'bg-cyan-500/20 text-cyan-400',
  'network': 'bg-blue-500/20 text-blue-400',
  'isolation': 'bg-orange-500/20 text-orange-400',
  'endpoint-dlp': 'bg-pink-500/20 text-pink-400',
  'transit-dlp': 'bg-teal-500/20 text-teal-400',
};

const SEVERITY_COLORS: Record<string, string> = {
  'low': 'bg-green-500/20 text-green-400',
  'medium': 'bg-amber-500/20 text-amber-400',
  'high': 'bg-orange-500/20 text-orange-400',
  'critical': 'bg-red-500/20 text-red-400',
};

export default function TelemetryPage() {
  const [selectedEvent, setSelectedEvent] = useState<TelemetryEvent | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filteredEvents = filter === 'all' 
    ? MOCK_EVENTS 
    : MOCK_EVENTS.filter(e => e.type === filter);

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
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === type
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
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
            <div
              key={event.id}
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
                    <span className={`px-2 py-0.5 rounded text-xs ${EVENT_TYPE_COLORS[event.type]}`}>
                      {event.type.replace(/-/g, ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${SEVERITY_COLORS[event.severity]}`}>
                      {event.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      event.context === 'ai-agent' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
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
            </div>
          ))}
        </div>

        {/* Event Detail Panel */}
        <div className="lg:col-span-1">
          {selectedEvent ? (
            <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-sm text-gray-400">{selectedEvent.id}</span>
                <span className={`px-2 py-1 rounded text-xs ${SEVERITY_COLORS[selectedEvent.severity]}`}>
                  {selectedEvent.severity.toUpperCase()}
                </span>
              </div>

              {/* Entity Context Pill */}
              <div className="p-3 rounded-lg bg-gray-800/50 mb-4">
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
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 mb-4">
                <div className="text-xs text-purple-400 mb-2 font-medium">AI Narrative Summary</div>
                <p className="text-sm text-gray-300">{selectedEvent.summary}</p>
              </div>

              {/* Drill-Down Causal Trace */}
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-500 font-medium">Causal Trace</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-gray-800/50">
                    <div className="text-xs text-gray-500">CATE Score</div>
                    <div className="font-mono text-cyan-400">{selectedEvent.details.cateScore}</div>
                  </div>
                  <div className="p-2 rounded bg-gray-800/50">
                    <div className="text-xs text-gray-500">EDR Health</div>
                    <div className="text-green-400">{selectedEvent.details.edrHealth}</div>
                  </div>
                  <div className="p-2 rounded bg-gray-800/50">
                    <div className="text-xs text-gray-500">NIC Saturation</div>
                    <div className="font-mono text-amber-400">{selectedEvent.details.nicSaturation}%</div>
                  </div>
                  <div className="p-2 rounded bg-gray-800/50">
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

              {/* Action Hub */}
              <div className="space-y-2">
                <div className="text-xs text-gray-500 font-medium">Actions</div>
                <button className="w-full py-2 px-3 rounded-lg bg-cyan-600/20 text-cyan-400 text-sm hover:bg-cyan-600/30 transition-colors">
                  📋 Auto-Draft ITSM CR
                </button>
                <button className="w-full py-2 px-3 rounded-lg bg-amber-600/20 text-amber-400 text-sm hover:bg-amber-600/30 transition-colors">
                  📨 Escalate to CISO
                </button>
                <button className="w-full py-2 px-3 rounded-lg bg-red-600/20 text-red-400 text-sm hover:bg-red-600/30 transition-colors">
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
    </div>
  );
}
