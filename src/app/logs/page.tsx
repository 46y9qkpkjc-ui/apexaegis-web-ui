'use client';
import React, { useState, useMemo } from 'react';
import {
  FileText, Search, Filter, Download, RefreshCw, ChevronDown, ChevronRight,
  Sparkles, TicketIcon, Loader2, X, Mic, MicOff, Bot,
  TrendingUp, AlertTriangle, Users, Globe, ShieldPlus, Activity, Clock,
  MapPin, Server, Lock, Fingerprint, Layers, ExternalLink, Eye,
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { ItsmTicketModal } from '@/components/itsm/itsm-ticket-modal';
import { useVoiceControl } from '@/hooks/use-voice-control';
import { TrafficInspectionFlow, simulateInspectionFlow, type TrafficFlowData } from '@/components/logs/traffic-inspection-flow';
import { PageEventsTracker } from '@/components/logs/page-events-tracker';
import { TrafficTimingWaterfall } from '@/components/logs/traffic-timing-waterfall';

/* ─── Types ─────────────────────────────────────────────────── */
interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  sourceIp: string;
  action: 'allow' | 'deny' | 'monitor' | 'dns-block';
  destination: string;
  category: string;
  policyName: string;
  bytesIn: number;
  bytesOut: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  gatewayRegion: string;
}

/* ─── Demo data ─────────────────────────────────────────────── */
const demoLogs: LogEntry[] = [
  { id: '1', timestamp: '2026-03-10 14:32:05', user: 'jdoe@acme.com', sourceIp: '10.0.1.42', action: 'deny', destination: 'malware-c2.evil.com', category: 'Malware', policyName: 'Block Malware & Phishing', bytesIn: 0, bytesOut: 342, severity: 'critical', gatewayRegion: 'us-east-1' },
  { id: '2', timestamp: '2026-03-10 14:31:58', user: 'alice@acme.com', sourceIp: '10.0.2.18', action: 'deny', destination: 'phishing-login.net', category: 'Phishing', policyName: 'Block Malware & Phishing', bytesIn: 0, bytesOut: 518, severity: 'high', gatewayRegion: 'us-east-1' },
  { id: '3', timestamp: '2026-03-10 14:31:45', user: 'bob@acme.com', sourceIp: '10.0.1.87', action: 'allow', destination: 'slack.com', category: 'SaaS', policyName: 'Allow Sanctioned SaaS', bytesIn: 24300, bytesOut: 1820, severity: 'info', gatewayRegion: 'us-west-2' },
  { id: '4', timestamp: '2026-03-10 14:31:32', user: 'charlie@acme.com', sourceIp: '10.0.3.11', action: 'deny', destination: 'crypto-miner.cc', category: 'Cryptomining', policyName: 'Block Malware & Phishing', bytesIn: 0, bytesOut: 290, severity: 'high', gatewayRegion: 'eu-west-1' },
  { id: '5', timestamp: '2026-03-10 14:31:20', user: 'jdoe@acme.com', sourceIp: '10.0.1.42', action: 'dns-block', destination: 'new-domain-3day.xyz', category: 'NRD', policyName: 'Block NRD & NOD', bytesIn: 0, bytesOut: 64, severity: 'medium', gatewayRegion: 'us-east-1' },
  { id: '6', timestamp: '2026-03-10 14:31:05', user: 'eve@acme.com', sourceIp: '10.0.2.55', action: 'allow', destination: 'github.com', category: 'SaaS', policyName: 'Allow Sanctioned SaaS', bytesIn: 185200, bytesOut: 4200, severity: 'info', gatewayRegion: 'us-east-1' },
  { id: '7', timestamp: '2026-03-10 14:30:50', user: 'dave@acme.com', sourceIp: '10.0.4.23', action: 'allow', destination: 'outlook.office365.com', category: 'SaaS', policyName: 'Allow Sanctioned SaaS', bytesIn: 52100, bytesOut: 3100, severity: 'info', gatewayRegion: 'eu-west-1' },
  { id: '8', timestamp: '2026-03-10 14:30:38', user: 'alice@acme.com', sourceIp: '10.0.2.18', action: 'deny', destination: 'spyware-drop.ru', category: 'Spyware', policyName: 'Block Malware & Phishing', bytesIn: 0, bytesOut: 410, severity: 'critical', gatewayRegion: 'us-east-1' },
  { id: '9', timestamp: '2026-03-10 14:30:22', user: 'frank@acme.com', sourceIp: '10.0.1.91', action: 'monitor', destination: 'unknown-saas.io', category: 'Uncategorized', policyName: 'Default Allow', bytesIn: 12800, bytesOut: 880, severity: 'low', gatewayRegion: 'ap-southeast-1' },
  { id: '10', timestamp: '2026-03-10 14:30:10', user: 'bob@acme.com', sourceIp: '10.0.1.87', action: 'allow', destination: 'jira.atlassian.com', category: 'SaaS', policyName: 'Allow Sanctioned SaaS', bytesIn: 33400, bytesOut: 2500, severity: 'info', gatewayRegion: 'us-west-2' },
];

/* ─── Style maps ────────────────────────────────────────────── */
const severityColor: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  info: 'bg-gray-500',
};
const actionBadge: Record<string, string> = {
  allow: 'bg-green-900/40 text-green-400 border-green-800',
  deny: 'bg-red-900/40 text-red-400 border-red-800',
  monitor: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  'dns-block': 'bg-purple-900/40 text-purple-400 border-purple-800',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/* ─── AI log analysis (simulated) ───────────────────────────── */
interface AiInsight {
  id: string;
  icon: 'trend' | 'alert' | 'user' | 'geo';
  title: string;
  detail: string;
  severity: 'critical' | 'warning' | 'info';
  relatedLogIds: string[];
  recommendation?: string;
  suggestedAction?: 'deny' | 'allow' | 'monitor';
  suggestedPolicyName?: string;
}

function analyzeLogsAi(logs: LogEntry[], query: string): AiInsight[] {
  const insights: AiInsight[] = [];

  /* Pattern: repeated blocks for one user */
  const deniedByUser: Record<string, LogEntry[]> = {};
  logs.filter(l => l.action === 'deny').forEach(l => {
    (deniedByUser[l.user] ??= []).push(l);
  });
  for (const [user, entries] of Object.entries(deniedByUser)) {
    if (entries.length >= 2) {
      insights.push({
        id: `repeat-block-${user}`,
        icon: 'alert',
        title: `${user} blocked ${entries.length}× in 2 min`,
        detail: `User attempted to reach ${entries.map(e => e.destination).join(', ')}. Possible compromised device or credential.`,
        severity: 'critical',
        relatedLogIds: entries.map(e => e.id),
        recommendation: `Quarantine ${user}'s device, revoke session tokens, and enforce MFA re-enrollment. Create a DENY policy for these destinations.`,
        suggestedAction: 'deny',
        suggestedPolicyName: `Block suspicious destinations for ${user}`,
      });
    }
  }

  /* Pattern: high-severity spike */
  const crits = logs.filter(l => l.severity === 'critical');
  if (crits.length >= 2) {
    insights.push({
      id: 'crit-spike',
      icon: 'trend',
      title: `${crits.length} critical events detected`,
      detail: 'Multiple critical-severity events within a short window. Review for coordinated attack patterns.',
      severity: 'critical',
      relatedLogIds: crits.map(l => l.id),
      recommendation: 'Escalate to SOC. Enable enhanced logging and enable ATP Strict profile on all policies. Consider blocking all NRD/NOD traffic.',
      suggestedAction: 'deny',
      suggestedPolicyName: `Emergency Block — ${crits.length} Critical Events`,
    });
  }

  /* Pattern: geographic anomaly */
  const regions = new Set(logs.map(l => l.gatewayRegion));
  if (regions.size >= 3) {
    insights.push({
      id: 'geo-spread',
      icon: 'geo',
      title: `Traffic from ${regions.size} regions`,
      detail: `Events across ${[...regions].join(', ')}. Verify user travel patterns or check for credential sharing.`,
      severity: 'warning',
      relatedLogIds: [],
      recommendation: 'Enable geo-fencing policies to restrict access from unexpected regions. Review device posture compliance for traveling users.',
    });
  }

  /* Pattern: uncategorized / shadow-IT */
  const uncategorized = logs.filter(l => l.category === 'Uncategorized');
  if (uncategorized.length > 0) {
    insights.push({
      id: 'shadow-it',
      icon: 'user',
      title: `${uncategorized.length} uncategorized destination(s)`,
      detail: `Potential shadow IT: ${uncategorized.map(l => l.destination).join(', ')}. Consider adding to a URL category.`,
      severity: 'info',
      relatedLogIds: uncategorized.map(l => l.id),
      recommendation: 'Add to URL category or create a MONITOR policy to track usage before deciding to block.',
      suggestedAction: 'monitor',
      suggestedPolicyName: `Monitor uncategorized — ${uncategorized.map(l => l.destination).join(', ')}`,
    });
  }

  /* NLP query-based narrowing */
  if (query) {
    const q = query.toLowerCase();
    if (q.includes('critical') || q.includes('severe')) {
      return insights.filter(i => i.severity === 'critical');
    }
    if (q.includes('user') || q.includes('who')) {
      return insights.filter(i => i.icon === 'user' || i.icon === 'alert');
    }
  }

  return insights;
}

const insightIcons = {
  trend: TrendingUp,
  alert: AlertTriangle,
  user: Users,
  geo: Globe,
};
const insightColors = {
  critical: 'border-red-700 bg-red-900/20',
  warning: 'border-yellow-700 bg-yellow-900/20',
  info: 'border-blue-700 bg-blue-900/20',
};

/* ── Enriched detail data for expanded view ──────────────── */
function getEnrichedLogDetail(log: LogEntry) {
  const threatIntelMap: Record<string, { score: number; tags: string[]; firstSeen: string; registrar: string }> = {
    'malware-c2.darknet.io': { score: 98, tags: ['C2', 'APT-29', 'Cobalt Strike'], firstSeen: '2025-08-12', registrar: 'Namecheap (Panama)' },
    'free-vpn-proxy.xyz': { score: 72, tags: ['Proxy', 'Data Exfil', 'NRD'], firstSeen: '2026-01-29', registrar: 'GoDaddy' },
    'pastebin.com': { score: 35, tags: ['File Sharing', 'Potential Exfil'], firstSeen: '2002-09-01', registrar: 'Tucows' },
    'unknown-saas.io': { score: 45, tags: ['Uncategorized', 'Shadow IT', 'NOD'], firstSeen: '2026-02-20', registrar: 'Cloudflare' },
  };

  const tlsVersions = ['TLS 1.3', 'TLS 1.2', 'TLS 1.3'];
  const cipherSuites = ['TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256', 'TLS_AES_128_GCM_SHA256'];
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Safari/605.1.15',
    'curl/8.4.0',
  ];
  const seed = log.id.codePointAt(log.id.length - 1) ?? 0;
  const threat = threatIntelMap[log.destination];

  return {
    httpMethod: ['GET', 'POST', 'GET', 'PUT', 'GET'][seed % 5],
    httpStatus: log.action === 'deny' ? 403 : log.action === 'dns-block' ? 0 : [200, 301, 200, 204, 200][seed % 5],
    urlPath: ['/', '/api/v2/data', '/login', '/upload', '/dashboard'][seed % 5],
    tlsVersion: tlsVersions[seed % 3],
    cipherSuite: cipherSuites[seed % 3],
    sniHostname: log.destination,
    certIssuer: ['DigiCert Inc', 'Let\'s Encrypt', 'Cloudflare Inc', 'Self-Signed'][seed % 4],
    certExpiry: '2027-04-15',
    userAgent: userAgents[seed % 3],
    requestHeaders: { 'Accept': 'text/html,application/json', 'Accept-Language': 'en-US', 'Accept-Encoding': 'gzip, br' },
    responseHeaders: { 'Content-Type': 'text/html; charset=utf-8', 'X-Frame-Options': 'DENY', 'Strict-Transport-Security': 'max-age=31536000' },
    dnsResolvedIp: `${104 + (seed % 50)}.${seed % 256}.${(seed * 7) % 256}.${(seed * 13) % 256}`,
    dnsResponseTime: `${2 + (seed % 15)}ms`,
    geoCity: ['Ashburn', 'Frankfurt', 'Singapore', 'Tokyo', 'London'][seed % 5],
    geoCountry: ['US', 'DE', 'SG', 'JP', 'GB'][seed % 5],
    geoAsn: `AS${13335 + (seed % 500)}`,
    geoOrg: ['Cloudflare', 'AWS', 'Google Cloud', 'Akamai', 'Fastly'][seed % 5],
    matchedRuleId: `rule-${100 + seed}`,
    matchedRuleOrder: seed % 20 + 1,
    inspectionChain: [
      { engine: 'DNS Filter', result: log.action === 'dns-block' ? 'BLOCKED' : 'PASS', latency: '1ms' },
      { engine: 'SSL Inspection', result: 'DECRYPTED', latency: '3ms' },
      { engine: 'URL Categorization', result: log.category, latency: '2ms' },
      { engine: 'ATP / Malware Scan', result: log.severity === 'critical' ? 'THREAT DETECTED' : 'CLEAN', latency: '8ms' },
      { engine: 'DLP Engine', result: 'NO MATCH', latency: '5ms' },
      { engine: 'Policy Engine', result: log.action.toUpperCase(), latency: '1ms' },
    ],
    threatIntel: threat ?? null,
    sessionDuration: `${(seed % 120) + 1}s`,
    connectionType: ['HTTP/2', 'HTTP/3 (QUIC)', 'HTTP/1.1'][seed % 3],
  };
}

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function LogsPage() {
  const [logs] = useState<LogEntry[]>(demoLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  /* AI analysis state */
  const [aiQuery, setAiQuery] = useState('');
  const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [highlightedLogIds, setHighlightedLogIds] = useState<Set<string>>(new Set());

  /* ITSM ticket modal */
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketPrefill, setTicketPrefill] = useState<{ title?: string; description?: string; severity?: string; logIds?: string[] }>({});

  /* Traffic inspection flow */
  const [inspectionFlow, setInspectionFlow] = useState<TrafficFlowData | null>(null);

  /* Create policy from log */
  const [createPolicyFrom, setCreatePolicyFrom] = useState<LogEntry | null>(null);

  /* Expanded log detail */
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  /* Page events panel */
  const [showPageEvents, setShowPageEvents] = useState(false);

  /* Traffic timing waterfall */
  const [timingDestination, setTimingDestination] = useState<string | null>(null);

  /* Category & region filters */
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  /* Policy-from-log form state */
  const [policyFromLogName, setPolicyFromLogName] = useState('');
  const [policyFromLogAction, setPolicyFromLogAction] = useState<'allow' | 'deny' | 'monitor'>('deny');
  const [policyFromLogProfiles, setPolicyFromLogProfiles] = useState<Record<string, boolean>>({ atp: true, ssl: false, dns: false });
  const [policyFromLogTraffic, setPolicyFromLogTraffic] = useState(true);

  /* Voice control for log search */
  const { isListening, interimTranscript, isSupported, toggleListening } = useVoiceControl((text) => {
    setAiQuery(text);
    runAiAnalysis(text);
  });

  /* ── Filtered logs ──────────────────────────────────────── */
  const filtered = useMemo(() => logs.filter(log => {
    const matchSearch = !searchQuery ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    const matchSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchRegion = regionFilter === 'all' || log.gatewayRegion === regionFilter;
    return matchSearch && matchAction && matchSeverity && matchCategory && matchRegion;
  }), [logs, searchQuery, actionFilter, severityFilter, categoryFilter, regionFilter]);

  /* ── AI analysis runner ─────────────────────────────────── */
  function runAiAnalysis(query?: string) {
    setAiLoading(true);
    setShowAiPanel(true);
    setTimeout(() => {
      const results = analyzeLogsAi(logs, query ?? aiQuery);
      setAiInsights(results);
      setAiLoading(false);
      toast.success(`AI found ${results.length} insight(s)`);
    }, 800);
  }

  /* ── Highlight related logs ─────────────────────────────── */
  function highlightInsight(insight: AiInsight) {
    setHighlightedLogIds(new Set(insight.relatedLogIds));
  }

  /* ── Create ticket from insight ─────────────────────────── */
  function createTicketFromInsight(insight: AiInsight) {
    setTicketPrefill({
      title: insight.title,
      description: insight.detail,
      severity: insight.severity === 'critical' ? 'critical' : insight.severity === 'warning' ? 'high' : 'medium',
      logIds: insight.relatedLogIds,
    });
    setTicketOpen(true);
  }

  /* ── Inspect traffic flow ────────────────────────────────── */
  function inspectTrafficFlow(log: LogEntry) {
    setInspectionFlow(simulateInspectionFlow(log));
  }

  /* ── Create ticket from selected log ────────────────────── */
  function createTicketFromLog(log: LogEntry) {
    setTicketPrefill({
      title: `[${log.severity.toUpperCase()}] ${log.action.toUpperCase()} — ${log.destination}`,
      description: `User: ${log.user}\nSource IP: ${log.sourceIp}\nDestination: ${log.destination}\nCategory: ${log.category}\nPolicy: ${log.policyName}\nTimestamp: ${log.timestamp}\nGateway: ${log.gatewayRegion}`,
      severity: log.severity,
      logIds: [log.id],
    });
    setTicketOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={24} className="text-blue-400" />
          <div>
            <h1 className="text-xl font-semibold">Logs &amp; Events</h1>
            <p className="text-sm text-gray-500">Real-time traffic logs, security events, and audit trail</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowAiPanel(p => !p); if (!showAiPanel) runAiAnalysis(); }}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              showAiPanel ? 'bg-indigo-600 text-white' : 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30',
            )}
          >
            <Sparkles size={14} />
            AI Analyze
          </button>
          <button
            onClick={() => setShowPageEvents(p => !p)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              showPageEvents ? 'bg-cyan-600 text-white' : 'bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30',
            )}
          >
            <Activity size={14} />
            Page Events
          </button>
          <button
            onClick={() => setTicketOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 rounded-lg text-sm transition-colors"
          >
            <TicketIcon size={14} />
            Create Ticket
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
            <Download size={14} />
            Export
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── AI Insights Panel ──────────────────────────────── */}
      {showAiPanel && (
        <div className="bg-gray-900 border border-indigo-800/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-300">AI Log Analysis</span>
            </div>
            <button onClick={() => setShowAiPanel(false)} className="p-1 hover:bg-gray-800 rounded">
              <X size={14} className="text-gray-400" />
            </button>
          </div>

          {/* AI query bar with voice */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Sparkles size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
              <input
                type="text"
                value={isListening ? interimTranscript || aiQuery : aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runAiAnalysis()}
                placeholder="Ask AI: 'Why is jdoe getting blocked?' or 'Show critical threats'…"
                className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-indigo-700/40 rounded-lg text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/60"
              />
            </div>
            {isSupported && (
              <button
                onClick={toggleListening}
                className={clsx(
                  'px-3 py-2 rounded-lg transition-colors',
                  isListening
                    ? 'bg-red-500/20 text-red-400 animate-pulse'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700',
                )}
                title={isListening ? 'Stop' : 'Voice search'}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
            )}
            <button
              onClick={() => runAiAnalysis()}
              disabled={aiLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : 'Analyze'}
            </button>
          </div>

          {/* Insight cards */}
          {aiInsights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {aiInsights.map(insight => {
                const Icon = insightIcons[insight.icon];
                return (
                  <div key={insight.id} className={`border rounded-lg p-3 space-y-1 ${insightColors[insight.severity]}`}>
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="shrink-0" />
                      <span className="text-sm font-medium">{insight.title}</span>
                    </div>
                    <p className="text-xs text-gray-400">{insight.detail}</p>
                    <div className="flex gap-2 pt-1">
                      {insight.relatedLogIds.length > 0 && (
                        <button
                          onClick={() => highlightInsight(insight)}
                          className="text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                        >
                          Show logs ({insight.relatedLogIds.length})
                        </button>
                      )}
                      <button
                        onClick={() => createTicketFromInsight(insight)}
                        className="text-[11px] px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors flex items-center gap-1"
                      >
                        <TicketIcon size={10} /> Create Ticket
                      </button>
                      {insight.suggestedPolicyName && (
                        <button
                          onClick={() => {
                            const relatedLog = logs.find(l => insight.relatedLogIds.includes(l.id));
                            if (relatedLog) {
                              setPolicyFromLogName(insight.suggestedPolicyName || '');
                              setPolicyFromLogAction(insight.suggestedAction || 'deny');
                              setCreatePolicyFrom(relatedLog);
                            }
                          }}
                          className="text-[11px] px-2 py-0.5 rounded bg-green-500/20 hover:bg-green-500/30 text-green-300 transition-colors flex items-center gap-1"
                        >
                          <ShieldPlus size={10} /> Create Policy
                        </button>
                      )}
                    </div>
                    {insight.recommendation && (
                      <div className="mt-1.5 pt-1.5 border-t border-white/5">
                        <p className="text-[11px] text-amber-300/80 flex items-start gap-1"><Sparkles size={10} className="shrink-0 mt-0.5" /> {insight.recommendation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {aiInsights.length === 0 && !aiLoading && (
            <p className="text-xs text-gray-500 text-center py-2">No insights yet — click Analyze or ask a question.</p>
          )}
        </div>
      )}

      {/* ─── Filters ────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search user, destination, category..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm appearance-none focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Actions</option>
            <option value="allow">Allow</option>
            <option value="deny">Deny</option>
            <option value="monitor">Monitor</option>
            <option value="dns-block">DNS Block</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="pl-3 pr-8 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm appearance-none focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="pl-3 pr-8 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm appearance-none focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Categories</option>
            {[...new Set(logs.map(l => l.category))].sort().map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            className="pl-3 pr-8 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm appearance-none focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Regions</option>
            {[...new Set(logs.map(l => l.gatewayRegion))].sort().map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        {(actionFilter !== 'all' || severityFilter !== 'all' || categoryFilter !== 'all' || regionFilter !== 'all') && (
          <button
            onClick={() => { setActionFilter('all'); setSeverityFilter('all'); setCategoryFilter('all'); setRegionFilter('all'); }}
            className="text-xs text-red-400 hover:text-red-300 underline"
          >
            Clear filters
          </button>
        )}
        {highlightedLogIds.size > 0 && (
          <button
            onClick={() => setHighlightedLogIds(new Set())}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
          >
            Clear highlights
          </button>
        )}
        <span className="text-xs text-gray-500">{filtered.length} events</span>
      </div>

      {/* Summary chips — clickable to filter */}
      <div className="flex gap-3">
        {[
          { label: 'Total', count: logs.length, color: 'bg-gray-800 text-gray-300', onClick: () => { setActionFilter('all'); setSeverityFilter('all'); setCategoryFilter('all'); setRegionFilter('all'); } },
          { label: 'Blocked', count: logs.filter(l => l.action === 'deny' || l.action === 'dns-block').length, color: 'bg-red-900/30 text-red-400', onClick: () => { setActionFilter('deny'); setSeverityFilter('all'); } },
          { label: 'Allowed', count: logs.filter(l => l.action === 'allow').length, color: 'bg-green-900/30 text-green-400', onClick: () => { setActionFilter('allow'); setSeverityFilter('all'); } },
          { label: 'Critical', count: logs.filter(l => l.severity === 'critical').length, color: 'bg-red-900/30 text-red-300', onClick: () => { setSeverityFilter('critical'); setActionFilter('all'); } },
        ].map(chip => (
          <button key={chip.label} onClick={chip.onClick} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:ring-1 hover:ring-white/20 transition-all ${chip.color}`}>
            {chip.label}: {chip.count}
          </button>
        ))}
      </div>

      {/* ─── Log table ──────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
              <th className="w-6 px-3 py-3"></th>
              <th className="px-3 py-3 text-left">Timestamp</th>
              <th className="px-3 py-3 text-left">User</th>
              <th className="px-3 py-3 text-left">Source IP</th>
              <th className="px-3 py-3 text-center">Action</th>
              <th className="px-3 py-3 text-left">Destination</th>
              <th className="px-3 py-3 text-left">Category</th>
              <th className="px-3 py-3 text-left">Policy</th>
              <th className="px-3 py-3 text-right">Traffic</th>
              <th className="px-3 py-3 text-left">Region</th>
              <th className="px-3 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filtered.map(log => {
              const isExpanded = expandedLogId === log.id;
              const detail = isExpanded ? getEnrichedLogDetail(log) : null;
              return (
                <React.Fragment key={log.id}>
                <tr
                  className={clsx(
                    'transition-colors cursor-pointer',
                    highlightedLogIds.has(log.id)
                      ? 'bg-indigo-900/30 ring-1 ring-indigo-600/40'
                      : isExpanded ? 'bg-gray-800/40' : 'hover:bg-gray-800/30',
                  )}
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                >
                  <td className="px-3 py-2.5">
                    <span className={`w-2 h-2 rounded-full block ${severityColor[log.severity]}`} />
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 font-mono text-xs whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-3 py-2.5 text-gray-300 truncate max-w-[140px]">{log.user}</td>
                  <td className="px-3 py-2.5 text-gray-500 font-mono text-xs">{log.sourceIp}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${actionBadge[log.action]}`}>
                      {log.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-300 font-mono text-xs truncate max-w-[180px]">{log.destination}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-xs">{log.category}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 text-xs truncate max-w-[160px]">{log.policyName}</td>
                  <td className="px-3 py-2.5 text-right text-xs text-gray-500 whitespace-nowrap">
                    {formatBytes(log.bytesIn)} / {formatBytes(log.bytesOut)}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs">{log.gatewayRegion}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); inspectTrafficFlow(log); }}
                        className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-blue-400 transition-colors"
                        title="Inspect traffic flow"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setTimingDestination(log.destination); }}
                        className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-cyan-400 transition-colors"
                        title="Traffic timing waterfall"
                      >
                        <Clock size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCreatePolicyFrom(log); }}
                        className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-green-400 transition-colors"
                        title="Create policy from this log"
                      >
                        <ShieldPlus size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); createTicketFromLog(log); }}
                        className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-purple-400 transition-colors"
                        title="Create ticket from this event"
                      >
                        <TicketIcon size={13} />
                      </button>
                      <ChevronRight size={13} className={clsx('text-gray-600 transition-transform', isExpanded && 'rotate-90')} />
                    </div>
                  </td>
                </tr>

                {/* ── Expanded Detail Panel ──────────────────── */}
                {isExpanded && detail && (
                  <tr className="bg-gray-850">
                    <td colSpan={11} className="px-0 py-0">
                      <div className="bg-gray-800/60 border-y border-gray-700/50 px-6 py-5 space-y-4 overflow-hidden">
                        {/* Top action bar */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <h4 className="text-sm font-semibold text-gray-200 flex items-center gap-2 min-w-0">
                            <Layers size={14} className="text-blue-400 shrink-0" />
                            <span className="truncate">Log Detail — {log.destination}</span>
                          </h4>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); setCreatePolicyFrom(log); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-700/40 rounded-lg text-xs font-medium transition-colors"
                            >
                              <ShieldPlus size={12} /> Create Policy from Log
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); createTicketFromLog(log); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-700/40 rounded-lg text-xs font-medium transition-colors"
                            >
                              <TicketIcon size={12} /> Create Ticket
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); inspectTrafficFlow(log); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-700/40 rounded-lg text-xs font-medium transition-colors"
                            >
                              <Eye size={12} /> Inspect Flow
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden">
                          {/* Request Info */}
                          <div className="space-y-2 min-w-0">
                            <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><ExternalLink size={11} /> Request</h5>
                            <div className="bg-gray-900/60 rounded-lg p-3 space-y-1.5 text-xs border border-gray-700/30">
                              <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="text-gray-300 font-mono">{detail.httpMethod}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">URL Path</span><span className="text-gray-300 font-mono truncate max-w-[120px]">{detail.urlPath}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Status</span>
                                <span className={clsx('font-mono', detail.httpStatus === 0 ? 'text-gray-500' : detail.httpStatus < 300 ? 'text-green-400' : detail.httpStatus < 400 ? 'text-yellow-400' : 'text-red-400')}>
                                  {detail.httpStatus === 0 ? 'N/A (DNS)' : detail.httpStatus}
                                </span>
                              </div>
                              <div className="flex justify-between"><span className="text-gray-500">Protocol</span><span className="text-gray-300">{detail.connectionType}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="text-gray-300">{detail.sessionDuration}</span></div>
                              <div className="pt-1 border-t border-gray-700/30">
                                <span className="text-gray-500 text-[10px]">User Agent</span>
                                <p className="text-gray-400 font-mono text-[10px] break-all mt-0.5">{detail.userAgent}</p>
                              </div>
                            </div>
                          </div>

                          {/* TLS / Encryption */}
                          <div className="space-y-2 min-w-0">
                            <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Lock size={11} /> TLS / Encryption</h5>
                            <div className="bg-gray-900/60 rounded-lg p-3 space-y-1.5 text-xs border border-gray-700/30">
                              <div className="flex justify-between"><span className="text-gray-500">TLS Version</span><span className="text-green-400 font-mono">{detail.tlsVersion}</span></div>
                              <div className="flex justify-between gap-1"><span className="text-gray-500 shrink-0">Cipher Suite</span><span className="text-gray-300 font-mono text-[10px] truncate">{detail.cipherSuite}</span></div>
                              <div className="flex justify-between gap-1"><span className="text-gray-500 shrink-0">SNI</span><span className="text-gray-300 font-mono truncate">{detail.sniHostname}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Cert Issuer</span><span className={clsx('text-gray-300', detail.certIssuer === 'Self-Signed' && 'text-red-400')}>{detail.certIssuer}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Cert Expiry</span><span className="text-gray-300">{detail.certExpiry}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">DNS Resolved</span><span className="text-gray-300 font-mono">{detail.dnsResolvedIp}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">DNS Time</span><span className="text-gray-300">{detail.dnsResponseTime}</span></div>
                            </div>
                          </div>

                          {/* Geolocation & Network */}
                          <div className="space-y-2 min-w-0">
                            <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><MapPin size={11} /> Geo & Network</h5>
                            <div className="bg-gray-900/60 rounded-lg p-3 space-y-1.5 text-xs border border-gray-700/30">
                              <div className="flex justify-between"><span className="text-gray-500">City</span><span className="text-gray-300">{detail.geoCity}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Country</span><span className="text-gray-300">{detail.geoCountry}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">ASN</span><span className="text-gray-300 font-mono">{detail.geoAsn}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Organization</span><span className="text-gray-300">{detail.geoOrg}</span></div>
                              <div className="pt-1 border-t border-gray-700/30">
                                <span className="text-gray-500">Source IP</span><span className="text-gray-300 font-mono ml-2">{log.sourceIp}</span>
                              </div>
                              <div className="flex justify-between"><span className="text-gray-500">Gateway</span><span className="text-gray-300">{log.gatewayRegion}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Traffic</span><span className="text-gray-300">{formatBytes(log.bytesIn)} ↓ / {formatBytes(log.bytesOut)} ↑</span></div>
                            </div>
                          </div>

                          {/* Policy & Threat Intel */}
                          <div className="space-y-2 min-w-0">
                            <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Fingerprint size={11} /> Threat Intel</h5>
                            <div className="bg-gray-900/60 rounded-lg p-3 space-y-1.5 text-xs border border-gray-700/30">
                              <div className="flex justify-between"><span className="text-gray-500">Policy</span><span className="text-gray-300">{log.policyName}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Rule ID</span><span className="text-gray-300 font-mono">{detail.matchedRuleId}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Rule Order</span><span className="text-gray-300">#{detail.matchedRuleOrder}</span></div>
                              {detail.threatIntel ? (
                                <>
                                  <div className="pt-1 border-t border-gray-700/30">
                                    <div className="flex justify-between"><span className="text-gray-500">Threat Score</span>
                                      <span className={clsx('font-bold', detail.threatIntel.score >= 80 ? 'text-red-400' : detail.threatIntel.score >= 50 ? 'text-yellow-400' : 'text-green-400')}>
                                        {detail.threatIntel.score}/100
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {detail.threatIntel.tags.map(tag => (
                                      <span key={tag} className="px-1.5 py-0.5 rounded bg-red-900/30 text-red-300 text-[10px] border border-red-800/30">{tag}</span>
                                    ))}
                                  </div>
                                  <div className="flex justify-between"><span className="text-gray-500">First Seen</span><span className="text-gray-300">{detail.threatIntel.firstSeen}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">Registrar</span><span className="text-gray-300">{detail.threatIntel.registrar}</span></div>
                                </>
                              ) : (
                                <div className="pt-1 border-t border-gray-700/30">
                                  <span className="text-gray-500 text-[10px]">No threat intelligence data</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Inspection Chain */}
                        <div className="space-y-2">
                          <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Server size={11} /> Inspection Chain</h5>
                          <div className="flex items-center gap-1">
                            {detail.inspectionChain.map((step, i) => (
                              <React.Fragment key={step.engine}>
                                <div className={clsx(
                                  'flex-1 px-3 py-2 rounded-lg border text-xs text-center',
                                  step.result === 'BLOCKED' || step.result === 'THREAT DETECTED'
                                    ? 'bg-red-900/30 border-red-800/40 text-red-300'
                                    : step.result === 'DECRYPTED'
                                      ? 'bg-yellow-900/20 border-yellow-800/30 text-yellow-300'
                                      : step.result === log.action.toUpperCase()
                                        ? log.action === 'deny' ? 'bg-red-900/30 border-red-800/40 text-red-300' : 'bg-green-900/30 border-green-800/40 text-green-300'
                                        : 'bg-gray-900/60 border-gray-700/30 text-gray-400',
                                )}>
                                  <div className="font-medium">{step.engine}</div>
                                  <div className="text-[10px] mt-0.5">{step.result}</div>
                                  <div className="text-[9px] text-gray-500 mt-0.5">{step.latency}</div>
                                </div>
                                {i < detail.inspectionChain.length - 1 && (
                                  <ChevronRight size={12} className="text-gray-600 shrink-0" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        {/* Response Headers */}
                        <div className="grid grid-cols-2 gap-4 overflow-hidden">
                          <div className="space-y-2 min-w-0">
                            <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Request Headers</h5>
                            <div className="bg-gray-900/60 rounded-lg p-3 text-xs font-mono space-y-1 border border-gray-700/30 overflow-hidden">
                              {Object.entries(detail.requestHeaders).map(([k, v]) => (
                                <div key={k} className="truncate"><span className="text-cyan-400">{k}:</span> <span className="text-gray-400">{v}</span></div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2 min-w-0">
                            <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Response Headers</h5>
                            <div className="bg-gray-900/60 rounded-lg p-3 text-xs font-mono space-y-1 border border-gray-700/30 overflow-hidden">
                              {Object.entries(detail.responseHeaders).map(([k, v]) => (
                                <div key={k} className="truncate"><span className="text-cyan-400">{k}:</span> <span className="text-gray-400">{v}</span></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Page Events Tracker Panel */}
      {showPageEvents && (
        <PageEventsTracker onClose={() => setShowPageEvents(false)} />
      )}

      {/* Create Policy from Log Modal */}
      {createPolicyFrom && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setCreatePolicyFrom(null)} />
          <div className="fixed inset-x-0 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-gray-900 border border-gray-700 rounded-xl z-50 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <ShieldPlus size={18} className="text-green-400" />
                <h3 className="text-sm font-semibold">Create Policy from Log Entry</h3>
              </div>
              <button onClick={() => setCreatePolicyFrom(null)} className="p-1 hover:bg-gray-800 rounded text-gray-400">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Log summary */}
              <div className="text-xs space-y-2 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex justify-between"><span className="text-gray-500">User</span><span className="text-gray-300">{createPolicyFrom.user}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Destination</span><span className="text-gray-300 font-mono">{createPolicyFrom.destination}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="text-gray-300">{createPolicyFrom.category}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Source IP</span><span className="text-gray-300 font-mono">{createPolicyFrom.sourceIp}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Original Action</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${actionBadge[createPolicyFrom.action]}`}>
                    {createPolicyFrom.action.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Policy Name */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Policy Name</label>
                <input
                  value={policyFromLogName}
                  onChange={e => setPolicyFromLogName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
                  placeholder={`Block ${createPolicyFrom.category} — ${createPolicyFrom.destination}`}
                />
              </div>

              {/* Action */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Policy Action</label>
                <div className="flex gap-2">
                  {(['deny', 'allow', 'monitor'] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => setPolicyFromLogAction(a)}
                      className={clsx(
                        'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                        policyFromLogAction === a
                          ? a === 'deny' ? 'bg-red-600 border-red-500 text-white' : a === 'allow' ? 'bg-green-600 border-green-500 text-white' : 'bg-yellow-600 border-yellow-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                      )}
                    >
                      {a.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Security Profiles */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Security Profiles</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <button
                    onClick={() => setPolicyFromLogProfiles(prev => ({ ...prev, atp: !prev.atp }))}
                    className={clsx('py-1.5 rounded-lg text-xs font-medium border transition-colors', policyFromLogProfiles.atp ? 'bg-red-900/40 border-red-700 text-red-300' : 'bg-gray-800 border-gray-700 text-gray-500')}
                  >ATP</button>
                  <button
                    onClick={() => setPolicyFromLogProfiles(prev => ({ ...prev, ssl: !prev.ssl }))}
                    className={clsx('py-1.5 rounded-lg text-xs font-medium border transition-colors', policyFromLogProfiles.ssl ? 'bg-yellow-900/40 border-yellow-700 text-yellow-300' : 'bg-gray-800 border-gray-700 text-gray-500')}
                  >SSL</button>
                  <button
                    onClick={() => setPolicyFromLogProfiles(prev => ({ ...prev, dns: !prev.dns }))}
                    className={clsx('py-1.5 rounded-lg text-xs font-medium border transition-colors', policyFromLogProfiles.dns ? 'bg-green-900/40 border-green-700 text-green-300' : 'bg-gray-800 border-gray-700 text-gray-500')}
                  >DNS</button>
                </div>
              </div>

              {/* Log Traffic */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Log Traffic</span>
                <button
                  onClick={() => setPolicyFromLogTraffic(v => !v)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${policyFromLogTraffic ? 'bg-green-600' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${policyFromLogTraffic ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Create button */}
              <button
                onClick={() => {
                  const name = policyFromLogName || `Block ${createPolicyFrom.category} — ${createPolicyFrom.destination}`;
                  const profiles = Object.entries(policyFromLogProfiles).filter(([,v]) => v).map(([k]) => k.toUpperCase()).join(', ');
                  toast.success(`Policy "${name}" created — Action: ${policyFromLogAction.toUpperCase()}, Profiles: ${profiles || 'None'}, Log: ${policyFromLogTraffic ? 'Yes' : 'No'}`);
                  setCreatePolicyFrom(null);
                  setPolicyFromLogName('');
                  setPolicyFromLogAction('deny');
                  setPolicyFromLogProfiles({ atp: true, ssl: false, dns: false });
                  setPolicyFromLogTraffic(true);
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
              >
                Create Policy
              </button>

              <p className="text-[11px] text-gray-500">
                Auto-populates source user ({createPolicyFrom.user}), destination category ({createPolicyFrom.category}), and services from this log entry.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Traffic Inspection Flow Panel */}
      {inspectionFlow && (
        <TrafficInspectionFlow flow={inspectionFlow} onClose={() => setInspectionFlow(null)} />
      )}

      {/* Traffic Timing Waterfall */}
      {timingDestination && (
        <TrafficTimingWaterfall destination={timingDestination} onClose={() => setTimingDestination(null)} />
      )}

      {/* ITSM Modal */}
      <ItsmTicketModal open={ticketOpen} onClose={() => { setTicketOpen(false); setTicketPrefill({}); }} prefill={ticketPrefill} />
    </div>
  );
}
