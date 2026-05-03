'use client';
import { useState } from 'react';
import {
  Workflow, CheckCircle2, XCircle, ArrowRight,
  RefreshCw, Download, Play, Pause, Settings, Zap, Bell, FileText,
  Shield, Lock, Activity, ChevronDown, ChevronRight,
  Target, Key, Eye, EyeOff, ExternalLink, Plug,
} from 'lucide-react';

/* ─── ITSM Integration Types ───────────────────────────────────────── */

type ITSMPlatform = 'servicenow' | 'jira' | 'pagerduty';

interface ITSMIntegration {
  platform: ITSMPlatform;
  enabled: boolean;
  instance_url: string;
  api_key: string;
  username: string;          // ServiceNow / Jira email
  routing_key: string;       // PagerDuty routing key
  service_id: string;        // PagerDuty service
  last_synced: string | null;
  status: 'connected' | 'error' | 'not_configured';
  tickets_synced_24h: number;
}

const platformMeta: Record<ITSMPlatform, { name: string; color: string; fields: string[] }> = {
  servicenow: { name: 'ServiceNow', color: 'text-green-400', fields: ['instance_url', 'username', 'api_key'] },
  jira:       { name: 'Jira',       color: 'text-blue-400',  fields: ['instance_url', 'username', 'api_key'] },
  pagerduty:  { name: 'PagerDuty',  color: 'text-emerald-400', fields: ['instance_url', 'routing_key', 'service_id'] },
};

const demoIntegrations: ITSMIntegration[] = [
  { platform: 'servicenow', enabled: true, instance_url: 'https://acme.service-now.com', api_key: 'snk_8f4a2c1d-e9b7-4ace-...-a1b2c3d4e5f6', username: 'apexaegis-svc@acme.com', routing_key: '', service_id: '', last_synced: '2025-01-15T08:32:00Z', status: 'connected', tickets_synced_24h: 23 },
  { platform: 'jira', enabled: true, instance_url: 'https://acme.atlassian.net', api_key: 'ATATT3x-...-jira-api-token-2025', username: 'security-bot@acme.com', routing_key: '', service_id: '', last_synced: '2025-01-15T08:28:00Z', status: 'connected', tickets_synced_24h: 11 },
  { platform: 'pagerduty', enabled: false, instance_url: 'https://api.pagerduty.com', api_key: '', username: '', routing_key: 'R04F...KEXAMPLE', service_id: 'P1A2B3C', last_synced: null, status: 'not_configured', tickets_synced_24h: 0 },
];

/* ─── Types ─────────────────────────────────────────────────────────── */

type SignalSeverity = 'critical' | 'high' | 'medium' | 'low';
type SignalStatus = 'open' | 'acknowledged' | 'remediated' | 'escalated' | 'suppressed';
type TicketStatus = 'new' | 'in_progress' | 'resolved' | 'closed' | 'sla_breach';

interface TechnicalSignal {
  id: string;
  source: string; // ApexAegis module
  signal_type: string;
  title: string;
  severity: SignalSeverity;
  status: SignalStatus;
  detected_at: string;
  details: string;
  mapped_controls: string[]; // NIST / SOC 2 / PCI controls
  mapped_regulations: string[];
  auto_ticket: ITSMTicket | null;
}

interface ITSMTicket {
  ticket_id: string;
  platform: 'ServiceNow' | 'Jira' | 'PagerDuty';
  status: TicketStatus;
  assignee: string;
  sla_target_hours: number;
  sla_remaining_hours: number;
  created_at: string;
  resolved_at: string | null;
}

interface ControlMapping {
  control_id: string;
  framework: string;
  description: string;
  signal_sources: string[];
  test_frequency: string;
  last_tested: string;
  passing: boolean;
  auto_remediation: boolean;
}

interface AutomationPipeline {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
  executions_24h: number;
  last_triggered: string | null;
  avg_resolution_mins: number;
}

/* ─── Demo Data ─────────────────────────────────────────────────────── */

const technicalSignals: TechnicalSignal[] = [
  {
    id: 'SIG-001', source: 'DNS Filter', signal_type: 'threat_detection',
    title: 'C2 Domain Resolution Blocked', severity: 'critical', status: 'remediated',
    detected_at: '2026-03-14T07:12:00Z',
    details: 'Gateway eu-west-1 blocked DNS resolution for known C2 domain: evil-c2[.]badactor[.]ru. Source: 10.0.4.28 (user: jsmith@corp.com).',
    mapped_controls: ['NIST SI-4', 'NIST SC-7', 'PCI-DSS 11.4'],
    mapped_regulations: ['SOC 2 CC7.1', 'ISO 27001 A.12.6'],
    auto_ticket: { ticket_id: 'INC-4821', platform: 'ServiceNow', status: 'resolved', assignee: 'SOC Team', sla_target_hours: 4, sla_remaining_hours: 0, created_at: '2026-03-14T07:12:05Z', resolved_at: '2026-03-14T07:14:30Z' },
  },
  {
    id: 'SIG-002', source: 'Identity Broker', signal_type: 'auth_anomaly',
    title: 'Impossible Travel Detected', severity: 'high', status: 'acknowledged',
    detected_at: '2026-03-14T06:45:00Z',
    details: 'User mwilliams@corp.com authenticated from Singapore (10:43 SGT) and New York (06:45 EST) within 12 minutes. Risk score elevated to 78.',
    mapped_controls: ['NIST AC-7', 'NIST IA-5'],
    mapped_regulations: ['SOC 2 CC6.1', 'GDPR Art. 32'],
    auto_ticket: { ticket_id: 'INC-4819', platform: 'ServiceNow', status: 'in_progress', assignee: 'Identity Team', sla_target_hours: 8, sla_remaining_hours: 5.2, created_at: '2026-03-14T06:45:10Z', resolved_at: null },
  },
  {
    id: 'SIG-003', source: 'SSL Inspection', signal_type: 'policy_violation',
    title: 'Expired SSL Inspection CA Certificate', severity: 'critical', status: 'escalated',
    detected_at: '2026-03-14T02:00:00Z',
    details: 'SSL inspection signing CA certificate expires in 7 days. All SSL inspection profiles will become non-functional after 2026-03-21.',
    mapped_controls: ['NIST SC-17', 'NIST SC-8'],
    mapped_regulations: ['PCI-DSS 4.2.1', 'SOC 2 CC6.6'],
    auto_ticket: { ticket_id: 'INC-4815', platform: 'PagerDuty', status: 'sla_breach', assignee: 'Platform Engineering', sla_target_hours: 24, sla_remaining_hours: -4, created_at: '2026-03-14T02:00:15Z', resolved_at: null },
  },
  {
    id: 'SIG-004', source: 'Device Posture', signal_type: 'compliance_drift',
    title: '14 BYOD Devices Missing Posture Policy', severity: 'high', status: 'open',
    detected_at: '2026-03-14T08:00:00Z',
    details: '14 unmanaged devices connected without device posture restrictions. No BYOD-specific security policy exists. Continuous control CCM-01 failed.',
    mapped_controls: ['NIST AC-19', 'NIST CM-6'],
    mapped_regulations: ['SOC 2 CC6.3', 'ISO 27001 A.6.2'],
    auto_ticket: { ticket_id: 'SEC-891', platform: 'Jira', status: 'new', assignee: 'Security Engineering', sla_target_hours: 48, sla_remaining_hours: 46, created_at: '2026-03-14T08:00:05Z', resolved_at: null },
  },
  {
    id: 'SIG-005', source: 'ATP Engine', signal_type: 'malware_blocked',
    title: 'Zero-Day Payload Blocked via Sandbox', severity: 'critical', status: 'remediated',
    detected_at: '2026-03-14T05:33:00Z',
    details: 'ATP sandbox detonated suspicious attachment (Invoice_Q1.docx.exe) — detected Cobalt Strike beacon stager. Quarantined on gateway us-east-1.',
    mapped_controls: ['NIST SI-3', 'NIST SI-8'],
    mapped_regulations: ['SOC 2 CC7.1', 'PCI-DSS 5.3'],
    auto_ticket: { ticket_id: 'INC-4817', platform: 'ServiceNow', status: 'closed', assignee: 'SOC Team', sla_target_hours: 2, sla_remaining_hours: 0, created_at: '2026-03-14T05:33:08Z', resolved_at: '2026-03-14T05:45:00Z' },
  },
  {
    id: 'SIG-006', source: 'Web Filter', signal_type: 'policy_block',
    title: 'Cryptomining URL Category Surge', severity: 'medium', status: 'remediated',
    detected_at: '2026-03-14T04:15:00Z',
    details: '47 cryptomining URL blocks in 30 minutes from subnet 10.0.12.0/24 — possible browser-based cryptojacking. Web filter blocked all requests.',
    mapped_controls: ['NIST SI-4'],
    mapped_regulations: ['SOC 2 CC7.2'],
    auto_ticket: null,
  },
  {
    id: 'SIG-007', source: 'TPRM Scanner', signal_type: 'vendor_risk',
    title: 'Vendor Security Re-Assessment Overdue', severity: 'medium', status: 'open',
    detected_at: '2026-03-14T00:00:00Z',
    details: '5 vendors have not been re-assessed in 12+ months. TPRM continuous monitoring flagged SLA breach for vendor audit cycle.',
    mapped_controls: ['NIST SR-3'],
    mapped_regulations: ['SOC 2 CC9.2', 'FFIEC IT Booklet'],
    auto_ticket: { ticket_id: 'SEC-890', platform: 'Jira', status: 'new', assignee: 'GRC Team', sla_target_hours: 168, sla_remaining_hours: 144, created_at: '2026-03-14T00:00:15Z', resolved_at: null },
  },
];

const controlMappings: ControlMapping[] = [
  { control_id: 'NIST AC-7', framework: 'NIST 800-53', description: 'Unsuccessful Logon Attempts', signal_sources: ['Identity Broker', 'Auth Middleware'], test_frequency: '15 min', last_tested: '2026-03-14T08:30:00Z', passing: true, auto_remediation: true },
  { control_id: 'NIST SI-3', framework: 'NIST 800-53', description: 'Malicious Code Protection', signal_sources: ['ATP Engine', 'Gateway'], test_frequency: '15 min', last_tested: '2026-03-14T08:30:00Z', passing: true, auto_remediation: true },
  { control_id: 'NIST SC-17', framework: 'NIST 800-53', description: 'Public Key Infrastructure Certificates', signal_sources: ['SSL Engine', 'Certificate Manager'], test_frequency: '1 hour', last_tested: '2026-03-14T08:00:00Z', passing: false, auto_remediation: false },
  { control_id: 'NIST AC-19', framework: 'NIST 800-53', description: 'Access Control for Mobile Devices', signal_sources: ['Device Posture', 'Policy Engine'], test_frequency: '15 min', last_tested: '2026-03-14T08:30:00Z', passing: false, auto_remediation: false },
  { control_id: 'SOC 2 CC6.1', framework: 'SOC 2', description: 'Logical and Physical Access Controls', signal_sources: ['Identity Broker', 'MFA', 'Biometric'], test_frequency: '15 min', last_tested: '2026-03-14T08:30:00Z', passing: true, auto_remediation: true },
  { control_id: 'SOC 2 CC7.1', framework: 'SOC 2', description: 'Detecting and Monitoring Activities', signal_sources: ['DNS Filter', 'ATP Engine', 'Web Filter', 'SIEM'], test_frequency: '5 min', last_tested: '2026-03-14T08:30:00Z', passing: true, auto_remediation: true },
  { control_id: 'PCI-DSS 4.2.1', framework: 'PCI-DSS', description: 'Strong Cryptography for Transmission', signal_sources: ['SSL Engine', 'Gateway TLS'], test_frequency: '1 hour', last_tested: '2026-03-14T08:00:00Z', passing: true, auto_remediation: false },
  { control_id: 'PCI-DSS 11.4', framework: 'PCI-DSS', description: 'Intrusion-Detection / Prevention', signal_sources: ['ATP Engine', 'DNS Filter'], test_frequency: '5 min', last_tested: '2026-03-14T08:30:00Z', passing: true, auto_remediation: true },
  { control_id: 'NIST SR-3', framework: 'NIST 800-53', description: 'Supply Chain Risk Management', signal_sources: ['TPRM Scanner', 'SCA'], test_frequency: '24 hours', last_tested: '2026-03-14T00:00:00Z', passing: false, auto_remediation: false },
];

const automationPipelines: AutomationPipeline[] = [
  { id: 'pipe-1', name: 'Threat → ITSM Ticket', description: 'Auto-create ServiceNow incident for critical/high threat detections with enrichment', trigger: 'Signal severity ≥ high', actions: ['Enrich with MITRE ATT&CK', 'Create ITSM ticket', 'Assign to SOC', 'Notify on-call'], enabled: true, executions_24h: 8, last_triggered: '2026-03-14T07:12:05Z', avg_resolution_mins: 14 },
  { id: 'pipe-2', name: 'Control Drift → Alert & Ticket', description: 'When a continuous control fails, create a ticket and alert the control owner', trigger: 'Control status: failing', actions: ['Generate finding', 'Map to framework', 'Create Jira issue', 'PagerDuty alert'], enabled: true, executions_24h: 3, last_triggered: '2026-03-14T08:00:05Z', avg_resolution_mins: 180 },
  { id: 'pipe-3', name: 'Certificate Expiry → Rotation', description: 'Auto-rotate certificates with <30 day validity via internal CA', trigger: 'Certificate TTL < 30 days', actions: ['Generate new cert', 'Deploy to gateway', 'Revoke old cert', 'Update ITSM CMDB'], enabled: true, executions_24h: 0, last_triggered: '2026-03-11T02:00:00Z', avg_resolution_mins: 5 },
  { id: 'pipe-4', name: 'Vendor Risk → GRC Review', description: 'Trigger vendor re-assessment workflow when risk score changes or annual review is due', trigger: 'TPRM scan overdue / risk Δ > 10', actions: ['Queue assessment', 'Notify GRC team', 'Create Jira epic', 'Schedule meeting'], enabled: true, executions_24h: 1, last_triggered: '2026-03-14T00:00:15Z', avg_resolution_mins: 2880 },
  { id: 'pipe-5', name: 'SCA CVE → Patch Pipeline', description: 'When SCA detects a high/critical CVE, auto-create a PR or patch request', trigger: 'SCA CVE severity ≥ high', actions: ['Identify affected repos', 'Check fix availability', 'Create Jira ticket', 'Trigger CI pipeline'], enabled: true, executions_24h: 2, last_triggered: '2026-03-13T14:22:00Z', avg_resolution_mins: 360 },
  { id: 'pipe-6', name: 'Auth Anomaly → Step-Up MFA', description: 'Force step-up authentication and session review on impossible travel or risk score spike', trigger: 'Risk score > 70 or impossible travel', actions: ['Revoke session', 'Force MFA re-auth', 'Notify user via email', 'Log to SIEM'], enabled: true, executions_24h: 1, last_triggered: '2026-03-14T06:45:10Z', avg_resolution_mins: 8 },
];

/* ─── Helpers ──────────────────────────────────────────────────────── */

const severityColor: Record<SignalSeverity, string> = {
  critical: 'text-red-400 bg-red-900/30 border-red-700/40',
  high: 'text-orange-400 bg-orange-900/30 border-orange-700/40',
  medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/40',
  low: 'text-blue-400 bg-blue-900/30 border-blue-700/40',
};

const signalStatusConfig: Record<SignalStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'text-red-400 bg-red-900/30 border-red-700/40' },
  acknowledged: { label: 'Ack', color: 'text-blue-400 bg-blue-900/30 border-blue-700/40' },
  remediated: { label: 'Remediated', color: 'text-green-400 bg-green-900/30 border-green-700/40' },
  escalated: { label: 'Escalated', color: 'text-purple-400 bg-purple-900/30 border-purple-700/40' },
  suppressed: { label: 'Suppressed', color: 'text-gray-400 bg-gray-800/30 border-gray-700/40' },
};

const ticketStatusConfig: Record<TicketStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'text-blue-400' },
  in_progress: { label: 'In Progress', color: 'text-amber-400' },
  resolved: { label: 'Resolved', color: 'text-green-400' },
  closed: { label: 'Closed', color: 'text-gray-500' },
  sla_breach: { label: 'SLA Breach', color: 'text-red-400' },
};

/* ═══════════════════════════════════════════════════════════════════════ */
/*  ITSM COMPLIANCE AUTOMATION PAGE                                       */
/* ═══════════════════════════════════════════════════════════════════════ */
export default function ITSMAutomationPage() {
  const [expandedSignals, setExpandedSignals] = useState<Set<string>>(new Set());
  const [signalFilter, setSignalFilter] = useState<SignalStatus | 'all'>('all');
  const [activeSection, setActiveSection] = useState<'signals' | 'controls' | 'pipelines' | 'integrations'>('signals');
  const [itsmIntegrations, setItsmIntegrations] = useState(demoIntegrations);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const toggleKeyVisibility = (platform: string) => {
    setVisibleKeys(prev => {
      const n = new Set(prev);
      n.has(platform) ? n.delete(platform) : n.add(platform);
      return n;
    });
  };

  const maskKey = (key: string) => key.length > 12 ? key.slice(0, 8) + '••••••••' + key.slice(-4) : '••••••••••••';

  const filteredSignals = signalFilter === 'all' ? technicalSignals : technicalSignals.filter(s => s.status === signalFilter);
  const openSignals = technicalSignals.filter(s => s.status === 'open' || s.status === 'escalated').length;
  const failingControls = controlMappings.filter(c => !c.passing).length;
  const ticketsCreated24h = automationPipelines.reduce((sum, p) => sum + p.executions_24h, 0);

  const toggleSignal = (id: string) => {
    setExpandedSignals(prev => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Workflow size={24} className="text-cyan-400" />
          <div>
            <h1 className="text-xl font-semibold">ITSM Compliance Automation</h1>
            <p className="text-sm text-gray-500">ApexAegis signals → regulatory mapping → ITSM ticket lifecycle</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveSection('integrations')} className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
            activeSection === 'integrations' ? 'bg-blue-600/15 text-blue-400 border-blue-500/40' : 'bg-gray-800/50 hover:bg-gray-800 border-gray-700/60'
          }`}>
            <Key size={14} /> API Keys & Integrations
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-sm transition-colors overflow-x-auto">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-cyan-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Signals (24h)</span>
          </div>
          <div className="text-2xl font-bold">{technicalSignals.length}</div>
          <div className="text-[10px] text-gray-600 mt-0.5">{openSignals} open / escalated</div>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-purple-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Control Tests</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{controlMappings.length}</div>
          <div className="text-[10px] text-gray-600 mt-0.5">{failingControls} failing</div>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={16} className="text-amber-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">ITSM Tickets (24h)</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{ticketsCreated24h}</div>
          <div className="text-[10px] text-gray-600 mt-0.5">Auto-generated from pipelines</div>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-green-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">MTTR</span>
          </div>
          <div className="text-2xl font-bold text-green-400">14m</div>
          <div className="text-[10px] text-gray-600 mt-0.5">Critical signals avg resolution</div>
        </div>
      </div>

      {/* Signal → Regulation flow diagram */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <ArrowRight size={16} className="text-cyan-400" />
          Signal-to-Compliance Pipeline
        </h3>
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {[
            { label: 'Technical Signal', sub: 'DNS, ATP, SSL, Identity, Posture', icon: Zap, color: 'border-cyan-500/40 bg-cyan-900/20' },
            { label: 'Control Mapping', sub: 'NIST, SOC 2, PCI, ISO', icon: Target, color: 'border-purple-500/40 bg-purple-900/20' },
            { label: 'Risk Assessment', sub: 'Severity + Impact + Context', icon: Shield, color: 'border-amber-500/40 bg-amber-900/20' },
            { label: 'ITSM Ticketing', sub: 'ServiceNow, Jira, PagerDuty', icon: FileText, color: 'border-blue-500/40 bg-blue-900/20' },
            { label: 'Auto-Remediation', sub: 'Rotate, Block, Revoke, Patch', icon: RefreshCw, color: 'border-green-500/40 bg-green-900/20' },
            { label: 'Audit Evidence', sub: 'Immutable log + WORM storage', icon: Lock, color: 'border-gray-500/40 bg-gray-800/20' },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center gap-3 flex-shrink-0">
                <div className={`p-3 rounded-xl border ${step.color} min-w-[140px]`}>
                  <Icon size={16} className="mb-1.5" />
                  <div className="text-[11px] font-semibold text-white/80">{step.label}</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">{step.sub}</div>
                </div>
                {i < 5 && <ArrowRight size={14} className="text-gray-700 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
        {([
          { key: 'signals' as const, label: 'Live Signals', icon: Zap },
          { key: 'controls' as const, label: 'Control Mapping', icon: Target },
          { key: 'pipelines' as const, label: 'Automation Pipelines', icon: Workflow },
          { key: 'integrations' as const, label: 'API Keys & Integrations', icon: Key },
        ]).map(tab => {
          const TabIcon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveSection(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all ${
                activeSection === tab.key ? 'bg-blue-600/15 text-blue-400' : 'text-gray-500 hover:text-gray-300'
              }`}>
              <TabIcon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Signals Section ──────────────────────────────────────────── */}
      {activeSection === 'signals' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2">
            {(['all', 'open', 'acknowledged', 'escalated', 'remediated'] as const).map(s => (
              <button key={s} onClick={() => setSignalFilter(s)}
                className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                  signalFilter === s ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40' : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {filteredSignals.map(signal => {
            const isExpanded = expandedSignals.has(signal.id);
            const stCfg = signalStatusConfig[signal.status];
            return (
              <div key={signal.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button onClick={() => toggleSignal(signal.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors text-left">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${severityColor[signal.severity]}`}>
                    {signal.severity.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{signal.title}</span>
                    <span className="text-xs text-gray-500">{signal.source} · {new Date(signal.detected_at).toLocaleTimeString()}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${stCfg.color}`}>{stCfg.label}</span>
                  {signal.auto_ticket && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      <FileText size={10} /> {signal.auto_ticket.ticket_id}
                    </span>
                  )}
                  {isExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800/60 px-5 py-4 space-y-3 text-sm">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-gray-600">Details</span>
                      <p className="text-gray-300 mt-0.5 text-xs">{signal.details}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-600">Mapped Controls</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {signal.mapped_controls.map(c => (
                            <span key={c} className="px-1.5 py-0.5 bg-purple-900/20 text-purple-400 border border-purple-700/30 rounded text-[10px] font-mono">{c}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-600">Regulations</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {signal.mapped_regulations.map(r => (
                            <span key={r} className="px-1.5 py-0.5 bg-blue-900/20 text-blue-400 border border-blue-700/30 rounded text-[10px] font-mono">{r}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {signal.auto_ticket && (
                      <div className="p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText size={12} className="text-blue-400" />
                            <span className="text-xs font-semibold">{signal.auto_ticket.ticket_id}</span>
                            <span className="px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded text-[9px]">{signal.auto_ticket.platform}</span>
                          </div>
                          <span className={`text-[10px] font-medium ${ticketStatusConfig[signal.auto_ticket.status].color}`}>
                            {ticketStatusConfig[signal.auto_ticket.status].label}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[10px]">
                          <div><span className="text-gray-600">Assignee</span><br /><span className="text-gray-400">{signal.auto_ticket.assignee}</span></div>
                          <div><span className="text-gray-600">SLA Target</span><br /><span className="text-gray-400">{signal.auto_ticket.sla_target_hours}h</span></div>
                          <div>
                            <span className="text-gray-600">SLA Remaining</span><br />
                            <span className={(() => {
                              if (signal.auto_ticket.sla_remaining_hours < 0) return 'text-red-400 font-semibold';
                              if (signal.auto_ticket.sla_remaining_hours < signal.auto_ticket.sla_target_hours * 0.2) return 'text-amber-400';
                              return 'text-green-400';
                            })()}>
                              {signal.auto_ticket.sla_remaining_hours < 0 ? `${Math.abs(signal.auto_ticket.sla_remaining_hours).toFixed(1)}h overdue` : `${signal.auto_ticket.sla_remaining_hours.toFixed(1)}h`}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Control Mapping Section ──────────────────────────────────── */}
      {activeSection === 'controls' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Control</th>
                <th className="px-4 py-3 text-left">Framework</th>
                <th className="px-4 py-3 text-left">Signal Sources</th>
                <th className="px-4 py-3 text-center">Frequency</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Auto-Fix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {controlMappings.map(ctrl => (
                <tr key={ctrl.control_id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-blue-400">{ctrl.control_id}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{ctrl.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded text-[10px]">{ctrl.framework}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ctrl.signal_sources.map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-cyan-900/20 text-cyan-400 rounded text-[9px] border border-cyan-700/30">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">{ctrl.test_frequency}</td>
                  <td className="px-4 py-3 text-center">
                    {ctrl.passing
                      ? <CheckCircle2 size={16} className="text-green-400 mx-auto" />
                      : <XCircle size={16} className="text-red-400 mx-auto" />
                    }
                  </td>
                  <td className="px-4 py-3 text-center">
                    {ctrl.auto_remediation
                      ? <span className="px-1.5 py-0.5 bg-green-900/20 text-green-400 rounded text-[9px] border border-green-700/30">Auto</span>
                      : <span className="px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded text-[9px]">Manual</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Automation Pipelines Section ─────────────────────────────── */}
      {activeSection === 'pipelines' && (
        <div className="space-y-3">
          {automationPipelines.map(pipe => (
            <div key={pipe.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Workflow size={16} className={pipe.enabled ? 'text-cyan-400' : 'text-gray-600'} />
                  <div>
                    <div className="text-sm font-semibold">{pipe.name}</div>
                    <div className="text-[10px] text-gray-500">{pipe.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1 text-[10px] ${pipe.enabled ? 'text-green-400' : 'text-gray-600'}`}>
                    {pipe.enabled ? <Play size={10} /> : <Pause size={10} />}
                    {pipe.enabled ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 bg-amber-900/20 text-amber-400 border border-amber-700/30 rounded-lg text-[10px]">
                  Trigger: {pipe.trigger}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                {pipe.actions.map((action, i) => (
                  <div key={action} className="flex items-center gap-1.5">
                    <span className="px-2 py-1 bg-gray-800/50 border border-gray-700/40 rounded text-[10px] text-gray-300">{action}</span>
                    {i < pipe.actions.length - 1 && <ArrowRight size={10} className="text-gray-700" />}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-2 bg-gray-800/30 rounded-lg text-center">
                  <div className="text-[9px] text-gray-600 uppercase">Executions (24h)</div>
                  <div className="text-sm font-bold text-white/80">{pipe.executions_24h}</div>
                </div>
                <div className="p-2 bg-gray-800/30 rounded-lg text-center">
                  <div className="text-[9px] text-gray-600 uppercase">Avg Resolution</div>
                  <div className="text-sm font-bold text-white/80">
                    {pipe.avg_resolution_mins < 60 ? `${pipe.avg_resolution_mins}m` : `${(pipe.avg_resolution_mins / 60).toFixed(1)}h`}
                  </div>
                </div>
                <div className="p-2 bg-gray-800/30 rounded-lg text-center">
                  <div className="text-[9px] text-gray-600 uppercase">Last Triggered</div>
                  <div className="text-[10px] text-white/60">
                    {pipe.last_triggered ? new Date(pipe.last_triggered).toLocaleTimeString() : 'Never'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Integrations / API Keys Section ──────────────────────── */}
      {activeSection === 'integrations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Configure API keys for your ITSM platforms to enable automated ticket creation, status sync, and incident escalation.</p>
          </div>

          {itsmIntegrations.map(integ => {
            const meta = platformMeta[integ.platform];
            const keyField = integ.platform === 'pagerduty' ? integ.routing_key : integ.api_key;
            const keyVisible = visibleKeys.has(integ.platform);
            return (
              <div key={integ.platform} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Plug size={18} className={meta.color} />
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-2">
                        {meta.name}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          integ.status === 'connected' ? 'bg-green-900/30 text-green-400 border border-green-700/40' :
                          integ.status === 'error' ? 'bg-red-900/30 text-red-400 border border-red-700/40' :
                          'bg-gray-800/50 text-gray-500 border border-gray-700/40'
                        }`}>
                          {integ.status === 'connected' ? '● Connected' : integ.status === 'error' ? '● Error' : '○ Not Configured'}
                        </span>
                      </div>
                      {integ.last_synced && (
                        <div className="text-[10px] text-gray-600">Last synced {new Date(integ.last_synced).toLocaleString()} · {integ.tickets_synced_24h} tickets (24h)</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2.5 py-1.5 bg-gray-800/50 border border-gray-700/40 rounded-lg text-[10px] hover:bg-gray-800 transition-colors flex items-center gap-1">
                      <RefreshCw size={10} /> Test Connection
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={integ.enabled}
                        onChange={() => setItsmIntegrations(prev => prev.map(p => p.platform === integ.platform ? { ...p, enabled: !p.enabled } : p))} />
                      <div className="w-8 h-4 rounded-full peer bg-gray-700 peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Instance URL */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Instance URL</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value={integ.instance_url} readOnly
                        className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/40 rounded-lg text-sm text-gray-300 font-mono" />
                      {integ.instance_url && (
                        <a href={integ.instance_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800/50 border border-gray-700/40 rounded-lg hover:bg-gray-800 transition-colors">
                          <ExternalLink size={12} className="text-gray-500" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Username / Email (ServiceNow & Jira) */}
                  {integ.platform !== 'pagerduty' && (
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Service Account Email</label>
                      <input type="text" value={integ.username} readOnly
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/40 rounded-lg text-sm text-gray-300 font-mono" />
                    </div>
                  )}

                  {/* API Key / Token */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">
                      {integ.platform === 'pagerduty' ? 'Routing Key' : integ.platform === 'jira' ? 'API Token' : 'API Key'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input type={keyVisible ? 'text' : 'password'} value={keyVisible ? keyField : maskKey(keyField)} readOnly
                        className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/40 rounded-lg text-sm text-gray-300 font-mono" />
                      <button onClick={() => toggleKeyVisibility(integ.platform)}
                        className="p-2 bg-gray-800/50 border border-gray-700/40 rounded-lg hover:bg-gray-800 transition-colors">
                        {keyVisible ? <EyeOff size={12} className="text-gray-500" /> : <Eye size={12} className="text-gray-500" />}
                      </button>
                    </div>
                  </div>

                  {/* PagerDuty Service ID */}
                  {integ.platform === 'pagerduty' && (
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Service ID</label>
                      <input type="text" value={integ.service_id} readOnly
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/40 rounded-lg text-sm text-gray-300 font-mono" />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-800">
                  <button className="px-3 py-1.5 bg-blue-600/15 text-blue-400 border border-blue-500/30 rounded-lg text-[11px] hover:bg-blue-600/25 transition-colors">
                    Edit Credentials
                  </button>
                  <button className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/40 rounded-lg text-[11px] text-gray-400 hover:bg-gray-800 transition-colors">
                    Rotate Key
                  </button>
                  <button className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/40 rounded-lg text-[11px] text-gray-400 hover:bg-gray-800 transition-colors">
                    View Audit Log
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add new integration */}
          <button className="w-full p-4 border-2 border-dashed border-gray-800 rounded-xl text-gray-600 hover:border-gray-700 hover:text-gray-500 transition-colors text-sm flex items-center justify-center gap-2">
            <Key size={14} /> Add ITSM Integration
          </button>
        </div>
      )}

      <p className="text-[10px] text-gray-700 text-center">
        Policy & Compliance Management Module · ApexAegis SSE · Continuous compliance automation
      </p>
    </div>
  );
}
