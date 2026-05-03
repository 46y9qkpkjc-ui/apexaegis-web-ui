'use client';
import { useState } from 'react';
import {
  Crosshair, Play, Pause, CheckCircle, XCircle, AlertTriangle, Shield,
  ChevronRight, BarChart3, Zap, Clock, Target, Layers, GitBranch,
  Cpu, Eye, Lock, RefreshCw, Download, X,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detectionCoverage: number; // 0-100
  preventionCoverage: number;
  automatedTest: boolean;
  lastTested: string | null;
  testResult: 'passed' | 'failed' | 'partial' | 'not-tested';
  apexAegisModule: string;
}

interface AttackSimulation {
  id: string;
  name: string;
  description: string;
  techniques: string[]; // technique IDs
  status: 'ready' | 'running' | 'completed' | 'failed';
  startedAt: string | null;
  completedAt: string | null;
  score: number | null; // percentage blocked
  findings: number;
  category: 'apt' | 'ransomware' | 'insider' | 'lateral' | 'exfiltration' | 'persistence';
}

interface ThreatIntelFeed {
  id: string;
  name: string;
  provider: string;
  type: 'commercial' | 'proprietary' | 'government' | 'isac';
  category: string;
  indicators: number;
  freshness: string;
  status: 'active' | 'pending' | 'recommended';
  cost: string;
  coverage: string;
}

/* ─── Demo data ─────────────────────────────────────────────── */
const techniques: MitreTechnique[] = [
  { id: 'T1566.001', name: 'Spearphishing Attachment', tactic: 'Initial Access', description: 'Adversary sends targeted email with malicious attachment', severity: 'high', detectionCoverage: 92, preventionCoverage: 88, automatedTest: true, lastTested: '2026-03-13', testResult: 'passed', apexAegisModule: 'ATP Engine + SWG' },
  { id: 'T1566.002', name: 'Spearphishing Link', tactic: 'Initial Access', description: 'Adversary sends email with malicious URL', severity: 'high', detectionCoverage: 95, preventionCoverage: 93, automatedTest: true, lastTested: '2026-03-13', testResult: 'passed', apexAegisModule: 'DNS Filter + Web Filter' },
  { id: 'T1059.001', name: 'PowerShell Execution', tactic: 'Execution', description: 'Abuse of PowerShell for execution and scripting', severity: 'critical', detectionCoverage: 78, preventionCoverage: 65, automatedTest: true, lastTested: '2026-03-12', testResult: 'partial', apexAegisModule: 'ATP Engine (UEBA)' },
  { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', description: 'Ransomware encryption of victim data', severity: 'critical', detectionCoverage: 85, preventionCoverage: 80, automatedTest: true, lastTested: '2026-03-13', testResult: 'passed', apexAegisModule: 'ATP Engine + DLP' },
  { id: 'T1071.001', name: 'Web Protocols (C2)', tactic: 'Command & Control', description: 'C2 communication over HTTP/HTTPS', severity: 'high', detectionCoverage: 90, preventionCoverage: 87, automatedTest: true, lastTested: '2026-03-13', testResult: 'passed', apexAegisModule: 'SWG + SSL Inspection' },
  { id: 'T1048', name: 'Exfiltration Over C2 Channel', tactic: 'Exfiltration', description: 'Data exfiltration through existing C2 channel', severity: 'critical', detectionCoverage: 82, preventionCoverage: 78, automatedTest: true, lastTested: '2026-03-12', testResult: 'partial', apexAegisModule: 'DLP + SWG + SSL' },
  { id: 'T1078', name: 'Valid Accounts', tactic: 'Defense Evasion', description: 'Compromise of valid credentials for access', severity: 'high', detectionCoverage: 70, preventionCoverage: 85, automatedTest: true, lastTested: '2026-03-13', testResult: 'passed', apexAegisModule: 'UEBA + Identity Provider' },
  { id: 'T1090', name: 'Proxy (Connection Proxy)', tactic: 'Command & Control', description: 'Use of proxy to mask C2 traffic origin', severity: 'medium', detectionCoverage: 88, preventionCoverage: 85, automatedTest: true, lastTested: '2026-03-11', testResult: 'passed', apexAegisModule: 'SWG + AegisRoute™' },
  { id: 'T1027', name: 'Obfuscated Files or Information', tactic: 'Defense Evasion', description: 'Encoding/encryption of payloads to evade detection', severity: 'high', detectionCoverage: 72, preventionCoverage: 68, automatedTest: true, lastTested: '2026-03-12', testResult: 'partial', apexAegisModule: 'ATP Engine + AI/ML' },
  { id: 'T1021.001', name: 'Remote Desktop Protocol', tactic: 'Lateral Movement', description: 'Lateral movement via RDP sessions', severity: 'medium', detectionCoverage: 94, preventionCoverage: 92, automatedTest: true, lastTested: '2026-03-13', testResult: 'passed', apexAegisModule: 'Microsegmentation + ZTNA' },
  { id: 'T1557', name: 'Adversary-in-the-Middle', tactic: 'Credential Access', description: 'AitM attacks to intercept credentials', severity: 'critical', detectionCoverage: 96, preventionCoverage: 95, automatedTest: true, lastTested: '2026-03-13', testResult: 'passed', apexAegisModule: 'AegisRoute™ SCION + SSL' },
  { id: 'T1583.001', name: 'Acquire Infrastructure: Domains', tactic: 'Resource Development', description: 'Acquisition of domains for phishing/C2', severity: 'medium', detectionCoverage: 91, preventionCoverage: 89, automatedTest: true, lastTested: '2026-03-13', testResult: 'passed', apexAegisModule: 'DNS Filter (NRD/NOD)' },
];

const simulations: AttackSimulation[] = [
  { id: 'sim-1', name: 'APT29 (Cozy Bear) Full Chain', description: 'Simulates SolarWinds-style supply chain compromise with SUNBURST-like C2 beaconing, lateral movement via Golden SAML, and data exfiltration', techniques: ['T1566.001', 'T1059.001', 'T1071.001', 'T1078', 'T1048'], status: 'completed', startedAt: '2026-03-13 14:00', completedAt: '2026-03-13 14:23', score: 87, findings: 3, category: 'apt' },
  { id: 'sim-2', name: 'LockBit 3.0 Ransomware', description: 'Ransomware simulation: initial access via phishing, privilege escalation, lateral movement, and mass encryption attempt', techniques: ['T1566.002', 'T1059.001', 'T1486', 'T1021.001'], status: 'completed', startedAt: '2026-03-12 09:00', completedAt: '2026-03-12 09:18', score: 94, findings: 1, category: 'ransomware' },
  { id: 'sim-3', name: 'Insider Data Exfiltration', description: 'Simulates malicious insider copying sensitive data via cloud apps, USB, and encrypted channels', techniques: ['T1078', 'T1048', 'T1027'], status: 'completed', startedAt: '2026-03-11 16:00', completedAt: '2026-03-11 16:12', score: 82, findings: 4, category: 'insider' },
  { id: 'sim-4', name: 'BGP Hijack + AitM Attack', description: 'Simulates BGP route manipulation to redirect traffic through hostile AS, then AitM credential harvesting — tests AegisRoute™ SCION protection', techniques: ['T1557', 'T1090'], status: 'completed', startedAt: '2026-03-13 10:00', completedAt: '2026-03-13 10:08', score: 99, findings: 0, category: 'lateral' },
  { id: 'sim-5', name: 'ALPHV/BlackCat Extortion', description: 'Triple extortion: ransomware + data theft + DDoS threat with credential harvesting and cloud persistence', techniques: ['T1566.001', 'T1486', 'T1048', 'T1078'], status: 'ready', startedAt: null, completedAt: null, score: null, findings: 0, category: 'ransomware' },
  { id: 'sim-6', name: 'Cloud App Shadow IT Discovery', description: 'Tests detection of data leakage through unsanctioned SaaS apps with obfuscated traffic', techniques: ['T1071.001', 'T1027', 'T1048'], status: 'ready', startedAt: null, completedAt: null, score: null, findings: 0, category: 'exfiltration' },
];

const threatIntelFeeds: ThreatIntelFeed[] = [
  { id: 'ti-1', name: 'AegisThreat IOC Platform', provider: 'ApexAegis', type: 'proprietary', category: 'IOC Sharing', indicators: 2800000, freshness: 'Real-time', status: 'active', cost: 'Included', coverage: 'Malware hashes, IPs, domains, URLs — curated by AegisThreat research team' },
  { id: 'ti-2', name: 'AegisThreat URL Intelligence', provider: 'ApexAegis', type: 'proprietary', category: 'Malware URLs', indicators: 980000, freshness: 'Every 5 min', status: 'active', cost: 'Included', coverage: 'Malware distribution URLs — high precision feed from proprietary crawlers' },
  { id: 'ti-3', name: 'AegisThreat IOC Database', provider: 'ApexAegis', type: 'proprietary', category: 'IOC Database', indicators: 1400000, freshness: 'Real-time', status: 'active', cost: 'Included', coverage: 'C2 IPs, botnet domains, malware configs — structured IOCs from proprietary sensors' },
  { id: 'ti-4', name: 'AegisThreat Pulse Network', provider: 'ApexAegis', type: 'proprietary', category: 'Threat Pulses', indicators: 3200000, freshness: 'Hourly', status: 'active', cost: 'Included', coverage: 'Aggregated threat pulses with STIX/TAXII interoperability' },
  { id: 'ti-5', name: 'CrowdStrike Falcon Intelligence', provider: 'CrowdStrike', type: 'commercial', category: 'APT / Threat Actor', indicators: 15000000, freshness: 'Real-time', status: 'recommended', cost: '$25k–50k/yr', coverage: 'APT tracking, adversary profiles, IOCs — largest threat intel DB. Recommended partnership.' },
  { id: 'ti-6', name: 'Recorded Future', provider: 'Recorded Future', type: 'commercial', category: 'Predictive Intel', indicators: 12000000, freshness: 'Real-time', status: 'recommended', cost: '$100k+/yr', coverage: 'NLP-analyzed OSINT, dark web, paste sites — predictive risk scoring' },
  { id: 'ti-7', name: 'Mandiant Advantage', provider: 'Google Cloud', type: 'commercial', category: 'IR / Forensics', indicators: 8000000, freshness: 'Daily', status: 'recommended', cost: '$50k–100k/yr', coverage: 'Incident forensics, threat actor TTPs, breach intel — addresses forensic timeline gap' },
  { id: 'ti-8', name: 'VirusTotal Enterprise', provider: 'Google', type: 'commercial', category: 'Malware Analysis', indicators: 4000000, freshness: 'Real-time', status: 'recommended', cost: '$10k–50k/yr', coverage: 'Multi-scanner verdicts, behavioral sandbox, retrohunt — enhances ATP engine' },
  { id: 'ti-9', name: 'CISA AIS (Gov)', provider: 'US CISA', type: 'government', category: 'Government Advisories', indicators: 250000, freshness: 'Daily', status: 'active', cost: 'Free', coverage: 'STIX/TAXII automated indicator sharing from US Government' },
  { id: 'ti-10', name: 'CSA STAR CASB Catalog', provider: 'Cloud Security Alliance', type: 'commercial', category: 'CASB App Catalog', indicators: 40000, freshness: 'Weekly', status: 'recommended', cost: 'Partnership', coverage: 'Cloud app risk scores, API connectors — licensed catalog to accelerate CASB coverage to 40k+ apps' },
  { id: 'ti-11', name: 'DigitalShadows SearchLight', provider: 'ReliaQuest', type: 'commercial', category: 'Digital Risk', indicators: 5000000, freshness: 'Real-time', status: 'recommended', cost: '$30k–75k/yr', coverage: 'Dark web monitoring, credential leak detection, brand impersonation — enhances UEBA' },
  { id: 'ti-12', name: 'EclecticIQ EU Intel', provider: 'EclecticIQ', type: 'commercial', category: 'European IOC', indicators: 1100000, freshness: 'Real-time', status: 'recommended', cost: '$20k–60k/yr', coverage: 'EU-focused threat intelligence sharing with GDPR compliance' },
  { id: 'ti-13', name: 'Opswat MetaDefender', provider: 'Opswat', type: 'commercial', category: 'Document Fingerprinting', indicators: 0, freshness: 'Real-time', status: 'recommended', cost: '$15k–40k/yr', coverage: 'Deep CDR, document sanitization, hash-based fingerprinting — closes doc fingerprinting gap for DLP' },
];

const tacticOrder = ['Resource Development', 'Initial Access', 'Execution', 'Defense Evasion', 'Credential Access', 'Lateral Movement', 'Command & Control', 'Exfiltration', 'Impact'];

const severityColors: Record<string, string> = {
  critical: 'bg-red-900/40 text-red-400 border-red-800',
  high: 'bg-orange-900/40 text-orange-400 border-orange-800',
  medium: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  low: 'bg-blue-900/40 text-blue-400 border-blue-800',
};

const resultColors: Record<string, { color: string; bg: string }> = {
  passed: { color: 'text-green-400', bg: 'bg-green-900/30 border-green-800' },
  failed: { color: 'text-red-400', bg: 'bg-red-900/30 border-red-800' },
  partial: { color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-800' },
  'not-tested': { color: 'text-gray-500', bg: 'bg-gray-800 border-gray-700' },
};

const simStatusColors: Record<string, string> = {
  ready: 'bg-blue-900/30 text-blue-400 border-blue-800',
  running: 'bg-amber-900/30 text-amber-400 border-amber-800',
  completed: 'bg-green-900/30 text-green-400 border-green-800',
  failed: 'bg-red-900/30 text-red-400 border-red-800',
};

const categoryColors: Record<string, string> = {
  apt: 'text-red-400', ransomware: 'text-orange-400', insider: 'text-purple-400',
  lateral: 'text-cyan-400', exfiltration: 'text-amber-400', persistence: 'text-pink-400',
};

export default function MitreAttackPage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'simulations' | 'threat-intel'>('matrix');
  const [sims, setSims] = useState(simulations);
  const [expandedSim, setExpandedSim] = useState<string | null>(null);
  const [selectedFeed, setSelectedFeed] = useState<ThreatIntelFeed | null>(null);

  const avgDetection = Math.round(techniques.reduce((s, t) => s + t.detectionCoverage, 0) / techniques.length);
  const avgPrevention = Math.round(techniques.reduce((s, t) => s + t.preventionCoverage, 0) / techniques.length);
  const passedCount = techniques.filter(t => t.testResult === 'passed').length;
  const partialCount = techniques.filter(t => t.testResult === 'partial').length;
  const completedSims = sims.filter(s => s.status === 'completed').length;
  const avgSimScore = sims.filter(s => s.score !== null).reduce((s, sim) => s + (sim.score ?? 0), 0) / (completedSims || 1);

  const handleRunSim = (id: string) => {
    setSims(prev => prev.map(s => {
      if (s.id !== id || s.status !== 'ready') return s;
      return { ...s, status: 'running' as const, startedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') };
    }));
    // Simulate completion after a delay
    setTimeout(() => {
      setSims(prev => prev.map(s => {
        if (s.id !== id || s.status !== 'running') return s;
        const score = 75 + Math.floor(Math.random() * 25);
        return { ...s, status: 'completed' as const, completedAt: new Date().toISOString().slice(0, 16).replace('T', ' '), score, findings: Math.floor(Math.random() * 5) };
      }));
    }, 3000);
  };

  // Group techniques by tactic
  const byTactic = tacticOrder.map(tactic => ({
    tactic,
    techniques: techniques.filter(t => t.tactic === tactic),
  })).filter(g => g.techniques.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crosshair size={24} className="text-red-400" />
          <div>
            <h1 className="text-xl font-semibold">Advanced Persistent Threat Simulation</h1>
            <p className="text-sm text-gray-500">MITRE ATT&CK-based continuous validation, attack simulation, and threat intel partnership roadmap</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
          <Download size={16} /> Export Report
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Techniques Covered', value: techniques.length, icon: Target, color: 'text-red-400' },
          { label: 'Avg Detection', value: `${avgDetection}%`, icon: Eye, color: 'text-blue-400' },
          { label: 'Avg Prevention', value: `${avgPrevention}%`, icon: Shield, color: 'text-green-400' },
          { label: 'Tests Passed', value: `${passedCount}/${techniques.length}`, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Simulations Run', value: completedSims, icon: Play, color: 'text-purple-400' },
          { label: 'Avg Sim Block Rate', value: `${Math.round(avgSimScore)}%`, icon: Zap, color: 'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <k.icon size={14} className={k.color} />
              <span className="text-xs text-gray-500">{k.label}</span>
            </div>
            <span className="text-lg font-semibold">{k.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-800/50 rounded-lg border border-gray-700/50 w-fit overflow-x-auto">
        {[
          { key: 'matrix' as const, label: 'ATT&CK Matrix', icon: Layers },
          { key: 'simulations' as const, label: 'Attack Simulations', icon: Play },
          { key: 'threat-intel' as const, label: 'Threat Intel & Partnerships', icon: GitBranch },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ MATRIX TAB ═══ */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {byTactic.map(group => (
            <div key={group.tactic}>
              <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">{group.tactic}</h3>
              <div className="grid grid-cols-1 gap-2">
                {group.techniques.map(tech => {
                  const rc = resultColors[tech.testResult];
                  return (
                    <div key={tech.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center gap-4">
                      <div className="w-24 shrink-0">
                        <span className="font-mono text-xs text-red-400">{tech.id}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{tech.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] border ${severityColors[tech.severity]}`}>{tech.severity}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{tech.description}</p>
                        <span className="text-[10px] text-gray-600">Module: {tech.apexAegisModule}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center w-20">
                          <div className="text-[10px] text-gray-500 mb-1">Detection</div>
                          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${tech.detectionCoverage}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400">{tech.detectionCoverage}%</span>
                        </div>
                        <div className="text-center w-20">
                          <div className="text-[10px] text-gray-500 mb-1">Prevention</div>
                          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${tech.preventionCoverage}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400">{tech.preventionCoverage}%</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${rc.bg} ${rc.color}`}>{tech.testResult}</span>
                        {tech.lastTested && <span className="text-[10px] text-gray-600">{tech.lastTested}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ SIMULATIONS TAB ═══ */}
      {activeTab === 'simulations' && (
        <div className="space-y-3">
          {sims.map(sim => (
            <div key={sim.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Crosshair size={16} className={categoryColors[sim.category]} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{sim.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${simStatusColors[sim.status]}`}>{sim.status}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 border border-gray-700">{sim.category}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 max-w-2xl">{sim.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {sim.score !== null && (
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500">Block Rate</div>
                      <span className={`text-lg font-bold ${sim.score >= 90 ? 'text-green-400' : sim.score >= 75 ? 'text-amber-400' : 'text-red-400'}`}>{sim.score}%</span>
                    </div>
                  )}
                  {sim.status === 'ready' && (
                    <button onClick={() => handleRunSim(sim.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-medium transition-colors">
                      <Play size={12} /> Run Simulation
                    </button>
                  )}
                  {sim.status === 'running' && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/30 text-amber-400 rounded-lg text-xs border border-amber-800">
                      <RefreshCw size={12} className="animate-spin" /> Running...
                    </span>
                  )}
                  <button onClick={() => setExpandedSim(expandedSim === sim.id ? null : sim.id)}
                    className="p-1 text-gray-500 hover:text-gray-200">
                    <ChevronRight size={16} className={`transition-transform ${expandedSim === sim.id ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>
              {expandedSim === sim.id && (
                <div className="border-t border-gray-800 p-4">
                  <div className="text-xs text-gray-500 mb-2">Techniques Tested:</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {sim.techniques.map(tid => {
                      const tech = techniques.find(t => t.id === tid);
                      return tech ? (
                        <span key={tid} className="px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700">
                          <span className="text-red-400 font-mono">{tech.id}</span> <span className="text-gray-400">{tech.name}</span>
                        </span>
                      ) : null;
                    })}
                  </div>
                  {sim.completedAt && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="p-2 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Started:</span> <span className="text-gray-300">{sim.startedAt}</span></div>
                      <div className="p-2 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Completed:</span> <span className="text-gray-300">{sim.completedAt}</span></div>
                      <div className="p-2 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Findings:</span> <span className="text-gray-300">{sim.findings}</span></div>
                      <div className="p-2 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Block Rate:</span> <span className={`font-bold ${(sim.score ?? 0) >= 90 ? 'text-green-400' : 'text-amber-400'}`}>{sim.score}%</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ THREAT INTEL & PARTNERSHIPS TAB ═══ */}
      {activeTab === 'threat-intel' && (
        <>
          {/* Partnership banner */}
          <div className="bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-red-900/20 border border-blue-800/30 rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><GitBranch size={16} className="text-blue-400" /> Threat Intel Partnership Roadmap</h3>
            <p className="text-xs text-gray-400 mb-3">ApexAegis integrates proprietary and commercial threat intelligence feeds to close coverage gaps identified in competitive analysis. Recommended partnerships are flagged below.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg border border-gray-800 overflow-x-auto">
                <Shield size={12} className="text-green-400" />
                <div><span className="text-green-400 font-medium">Behavioral Analysis:</span> <span className="text-gray-300">CrowdStrike Falcon Intel + Mandiant — closes CrowdStrike gap</span></div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg border border-gray-800 overflow-x-auto">
                <Eye size={12} className="text-blue-400" />
                <div><span className="text-blue-400 font-medium">Forensic Timeline:</span> <span className="text-gray-300">Mandiant Advantage — IR forensics + incident replay</span></div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg border border-gray-800 overflow-x-auto">
                <Lock size={12} className="text-purple-400" />
                <div><span className="text-purple-400 font-medium">Doc Fingerprinting:</span> <span className="text-gray-300">Opswat MetaDefender — deep CDR + hash fingerprinting for DLP</span></div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg border border-gray-800 overflow-x-auto">
                <Layers size={12} className="text-amber-400" />
                <div><span className="text-amber-400 font-medium">CASB Catalog:</span> <span className="text-gray-300">CSA STAR catalog license — accelerate to 40k+ app coverage</span></div>
              </div>
            </div>
          </div>

          {/* Feed table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Feed / Partnership</th>
                  <th className="px-4 py-3 text-left">Provider</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Indicators</th>
                  <th className="px-4 py-3 text-left">Freshness</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {threatIntelFeeds.map(feed => (
                  <tr key={feed.id}
                    className={`hover:bg-gray-800/30 cursor-pointer transition-colors ${feed.status === 'recommended' ? 'bg-blue-900/5' : ''}`}
                    onClick={() => setSelectedFeed(selectedFeed?.id === feed.id ? null : feed)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {feed.status === 'recommended' && <Zap size={12} className="text-amber-400" />}
                        <span className="font-medium">{feed.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{feed.provider}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${
                        feed.type === 'proprietary' ? 'bg-green-900/30 text-green-400 border-green-800' :
                        feed.type === 'commercial' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                        feed.type === 'government' ? 'bg-purple-900/30 text-purple-400 border-purple-800' :
                        'bg-cyan-900/30 text-cyan-400 border-cyan-800'
                      }`}>{feed.type}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{feed.category}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-gray-300">{feed.indicators > 0 ? feed.indicators.toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{feed.freshness}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${
                        feed.status === 'active' ? 'bg-green-900/30 text-green-400 border-green-800' :
                        feed.status === 'recommended' ? 'bg-amber-900/30 text-amber-400 border-amber-800' :
                        'bg-gray-800 text-gray-400 border-gray-700'
                      }`}>{feed.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300">{feed.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected feed detail */}
          {selectedFeed && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GitBranch size={16} className="text-blue-400" />
                  <h3 className="text-sm font-semibold">{selectedFeed.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] border ${
                    selectedFeed.status === 'active' ? 'bg-green-900/30 text-green-400 border-green-800' :
                    'bg-amber-900/30 text-amber-400 border-amber-800'
                  }`}>{selectedFeed.status}</span>
                </div>
                <button onClick={() => setSelectedFeed(null)} className="text-gray-400 hover:text-gray-200"><X size={16} /></button>
              </div>
              <p className="text-xs text-gray-400 mb-3">{selectedFeed.coverage}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Provider:</span> <span className="text-gray-300">{selectedFeed.provider}</span></div>
                <div className="p-3 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Type:</span> <span className="text-gray-300">{selectedFeed.type}</span></div>
                <div className="p-3 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Cost:</span> <span className="text-gray-300">{selectedFeed.cost}</span></div>
                <div className="p-3 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Indicators:</span> <span className="text-gray-300">{selectedFeed.indicators > 0 ? selectedFeed.indicators.toLocaleString() : 'N/A'}</span></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
