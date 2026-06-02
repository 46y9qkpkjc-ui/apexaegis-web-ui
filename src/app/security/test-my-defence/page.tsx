'use client';
import { useState, useCallback } from 'react';
import {
  Shield, Play, CheckCircle2, XCircle, AlertTriangle, Clock,
  RefreshCw, Download, Server, Trash2, Box, Activity,
  Wifi, Bug, Globe, Zap, FileText, ChevronDown, ChevronRight,
  Crosshair, Search, Eye, Flame, ShieldAlert,
  ArrowRight, Layers,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────── */

type TestStatus = 'idle' | 'provisioning' | 'running' | 'passed' | 'failed' | 'warning' | 'skipped';
type ContainerState = 'none' | 'provisioning' | 'ready' | 'testing' | 'destroying' | 'destroyed';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  technique?: string; // MITRE or OWASP ref
  status: TestStatus;
  duration_ms: number | null;
  result_detail: string | null;
  container_services: string[];
}

interface TestCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  source: string;
  tests: TestCase[];
}

interface ContainerEnv {
  state: ContainerState;
  id: string | null;
  services: ContainerService[];
  started_at: string | null;
  ttl_seconds: number;
}

interface ContainerService {
  name: string;
  image: string;
  port: number;
  status: 'pending' | 'running' | 'stopped';
  purpose: string;
}

/* ─── Demo Container Services ────────────────────────────────────── */

const defaultServices: ContainerService[] = [
  { name: 'malware-host', image: 'apexaegis/test-malware-host:latest', port: 8081, status: 'pending', purpose: 'Serves EICAR & simulated malware samples' },
  { name: 'phishing-server', image: 'apexaegis/test-phish-sim:latest', port: 8082, status: 'pending', purpose: 'Simulates phishing page & credential harvest' },
  { name: 'c2-callback', image: 'apexaegis/test-c2-beacon:latest', port: 8083, status: 'pending', purpose: 'Simulates C2 callback & DNS tunneling' },
  { name: 'ransomware-sim', image: 'apexaegis/test-ransom-sim:latest', port: 8084, status: 'pending', purpose: 'Simulates ransomware behavior indicators' },
  { name: 'vuln-webapp', image: 'apexaegis/test-owasp-app:latest', port: 8085, status: 'pending', purpose: 'OWASP Top 10 vulnerable web application' },
  { name: 'ddos-gen', image: 'apexaegis/test-ddos-gen:latest', port: 8086, status: 'pending', purpose: 'Generates DDoS traffic patterns at low volume' },
  { name: 'dns-tunnel', image: 'apexaegis/test-dns-tunnel:latest', port: 5353, status: 'pending', purpose: 'DNS tunneling & exfiltration test server' },
  { name: 'sandbox-payloads', image: 'apexaegis/test-sandbox:latest', port: 8087, status: 'pending', purpose: 'Serves sandbox evasion & detonation payloads' },
  { name: 'exploit-server', image: 'apexaegis/test-exploit-srv:latest', port: 8088, status: 'pending', purpose: 'Serves exploit kits & drive-by downloads' },
  { name: 'data-exfil', image: 'apexaegis/test-exfil:latest', port: 8089, status: 'pending', purpose: 'DLP exfiltration endpoint (HTTP/DNS/ICMP)' },
];

/* ─── Test Suite Definition ──────────────────────────────────────── */

const buildTestCategories = (): TestCategory[] => [
  {
    id: 'checkme',
    name: 'AegisValidate — Security CheckUp',
    description: 'Simulate cyber-attacks (malware, phishing, ransomware) to verify security solutions block threats correctly',
    icon: ShieldAlert,
    source: 'AegisValidate',
    tests: [
      { id: 'CM-01', name: 'EICAR Anti-Malware Download', description: 'Download EICAR test file through gateway to verify malware blocking', category: 'checkme', severity: 'critical', technique: 'T1204.002', status: 'idle', duration_ms: null, result_detail: null, container_services: ['malware-host'] },
      { id: 'CM-02', name: 'Phishing Page Detection', description: 'Attempt to load a simulated phishing page and verify it is blocked', category: 'checkme', severity: 'critical', technique: 'T1566.002', status: 'idle', duration_ms: null, result_detail: null, container_services: ['phishing-server'] },
      { id: 'CM-03', name: 'Ransomware Behavior Simulation', description: 'Simulate ransomware file encryption patterns and verify detection', category: 'checkme', severity: 'critical', technique: 'T1486', status: 'idle', duration_ms: null, result_detail: null, container_services: ['ransomware-sim'] },
      { id: 'CM-04', name: 'C2 Callback Attempt', description: 'Attempt outbound C2 beacon callback to test DNS/HTTP blocking', category: 'checkme', severity: 'critical', technique: 'T1071.001', status: 'idle', duration_ms: null, result_detail: null, container_services: ['c2-callback'] },
      { id: 'CM-05', name: 'Exploit Kit Landing Page', description: 'Load simulated exploit kit landing page and verify blocking', category: 'checkme', severity: 'high', technique: 'T1189', status: 'idle', duration_ms: null, result_detail: null, container_services: ['exploit-server'] },
      { id: 'CM-06', name: 'Cryptomining Script Detection', description: 'Load page with cryptomining JavaScript and verify blocking', category: 'checkme', severity: 'medium', technique: 'T1496', status: 'idle', duration_ms: null, result_detail: null, container_services: ['vuln-webapp'] },
    ],
  },
  {
    id: 'threatcloud',
    name: 'AegisThreat AI Validation',
    description: 'Validate AI-driven intelligence engine: real-time malware analysis, sandbox static analysis, zero-day phishing behavioral detection',
    icon: Zap,
    source: 'AegisThreat AI',
    tests: [
      { id: 'TC-01', name: 'AI Malware Classification', description: 'Submit polymorphic malware variant to verify real-time AI classification', category: 'threatcloud', severity: 'critical', technique: 'T1027', status: 'idle', duration_ms: null, result_detail: null, container_services: ['malware-host', 'sandbox-payloads'] },
      { id: 'TC-02', name: 'Sandbox Static Analysis', description: 'Submit PE with obfuscated payload for static analysis detonation', category: 'threatcloud', severity: 'critical', status: 'idle', duration_ms: null, result_detail: null, container_services: ['sandbox-payloads'] },
      { id: 'TC-03', name: 'Zero-Day Phishing Detection', description: 'Test behavioral analysis against never-before-seen phishing page', category: 'threatcloud', severity: 'high', technique: 'T1566.003', status: 'idle', duration_ms: null, result_detail: null, container_services: ['phishing-server'] },
      { id: 'TC-04', name: 'DNS Tunneling Detection', description: 'Attempt DNS-over-HTTPS tunneling and verify AI detection', category: 'threatcloud', severity: 'high', technique: 'T1572', status: 'idle', duration_ms: null, result_detail: null, container_services: ['dns-tunnel'] },
    ],
  },
  {
    id: 'mitre-endpoint',
    name: 'MITRE ATT&CK Endpoint Validation',
    description: 'Advanced Threat Protection validated against MITRE ATT&CK framework — target 100% detection coverage',
    icon: Crosshair,
    source: 'AegisEndpoint',
    tests: [
      { id: 'ME-01', name: 'Initial Access — Spearphishing Link', description: 'Simulate spearphishing link click and payload delivery', category: 'mitre-endpoint', severity: 'critical', technique: 'T1566.002', status: 'idle', duration_ms: null, result_detail: null, container_services: ['phishing-server', 'malware-host'] },
      { id: 'ME-02', name: 'Execution — PowerShell Cradle', description: 'Simulate PowerShell download cradle execution', category: 'mitre-endpoint', severity: 'critical', technique: 'T1059.001', status: 'idle', duration_ms: null, result_detail: null, container_services: ['c2-callback'] },
      { id: 'ME-03', name: 'Persistence — Registry Run Key', description: 'Simulate registry persistence mechanism creation', category: 'mitre-endpoint', severity: 'high', technique: 'T1547.001', status: 'idle', duration_ms: null, result_detail: null, container_services: ['malware-host'] },
      { id: 'ME-04', name: 'Defense Evasion — Process Injection', description: 'Simulate process injection technique', category: 'mitre-endpoint', severity: 'critical', technique: 'T1055', status: 'idle', duration_ms: null, result_detail: null, container_services: ['sandbox-payloads'] },
      { id: 'ME-05', name: 'Lateral Movement — Pass the Hash', description: 'Simulate pass-the-hash lateral movement', category: 'mitre-endpoint', severity: 'critical', technique: 'T1550.002', status: 'idle', duration_ms: null, result_detail: null, container_services: ['exploit-server'] },
      { id: 'ME-06', name: 'Exfiltration — DNS Exfiltration', description: 'Attempt data exfiltration via DNS queries', category: 'mitre-endpoint', severity: 'high', technique: 'T1048.003', status: 'idle', duration_ms: null, result_detail: null, container_services: ['dns-tunnel', 'data-exfil'] },
    ],
  },
  {
    id: 'waf-owasp',
    name: 'AegisWAF (OWASP Top 10)',
    description: 'Validate web application & API security with AI anomaly detection — SQL injection, XSS, SSRF, and full OWASP Top 10',
    icon: Globe,
    source: 'AegisWAF',
    tests: [
      { id: 'WF-01', name: 'SQL Injection (A03:2021)', description: 'Attempt SQL injection via query parameter and POST body', category: 'waf-owasp', severity: 'critical', technique: 'OWASP A03', status: 'idle', duration_ms: null, result_detail: null, container_services: ['vuln-webapp'] },
      { id: 'WF-02', name: 'Cross-Site Scripting — Reflected (A03:2021)', description: 'Inject reflected XSS payload via URL parameter', category: 'waf-owasp', severity: 'high', technique: 'OWASP A03', status: 'idle', duration_ms: null, result_detail: null, container_services: ['vuln-webapp'] },
      { id: 'WF-03', name: 'Cross-Site Scripting — Stored (A03:2021)', description: 'Submit stored XSS payload via form field', category: 'waf-owasp', severity: 'high', technique: 'OWASP A03', status: 'idle', duration_ms: null, result_detail: null, container_services: ['vuln-webapp'] },
      { id: 'WF-04', name: 'Broken Access Control (A01:2021)', description: 'Attempt IDOR and privilege escalation via API', category: 'waf-owasp', severity: 'critical', technique: 'OWASP A01', status: 'idle', duration_ms: null, result_detail: null, container_services: ['vuln-webapp'] },
      { id: 'WF-05', name: 'SSRF (A10:2021)', description: 'Attempt server-side request forgery via URL parameter', category: 'waf-owasp', severity: 'critical', technique: 'OWASP A10', status: 'idle', duration_ms: null, result_detail: null, container_services: ['vuln-webapp'] },
      { id: 'WF-06', name: 'Security Misconfiguration (A05:2021)', description: 'Probe for exposed admin endpoints, default creds, verbose errors', category: 'waf-owasp', severity: 'medium', technique: 'OWASP A05', status: 'idle', duration_ms: null, result_detail: null, container_services: ['vuln-webapp'] },
    ],
  },
  {
    id: 'ddos-protection',
    name: 'AegisShield DDoS Protector',
    description: 'Automated DDoS protection validation — high-volume network layer attack handling without disrupting legitimate traffic',
    icon: Flame,
    source: 'AegisShield DDoS',
    tests: [
      { id: 'DD-01', name: 'SYN Flood Mitigation', description: 'Generate controlled SYN flood and verify mitigation without service impact', category: 'ddos-protection', severity: 'critical', status: 'idle', duration_ms: null, result_detail: null, container_services: ['ddos-gen'] },
      { id: 'DD-02', name: 'UDP Amplification Attack', description: 'Simulate DNS amplification attack and verify rate limiting', category: 'ddos-protection', severity: 'critical', status: 'idle', duration_ms: null, result_detail: null, container_services: ['ddos-gen'] },
      { id: 'DD-03', name: 'HTTP Slowloris', description: 'Open many slow HTTP connections to verify timeout enforcement', category: 'ddos-protection', severity: 'high', status: 'idle', duration_ms: null, result_detail: null, container_services: ['ddos-gen'] },
      { id: 'DD-04', name: 'Legitimate Traffic During Attack', description: 'Verify legitimate requests are served while mitigation is active', category: 'ddos-protection', severity: 'critical', status: 'idle', duration_ms: null, result_detail: null, container_services: ['ddos-gen', 'vuln-webapp'] },
    ],
  },
  {
    id: 'ctem',
    name: 'CTEM (Cyber Threat Exposure Management)',
    description: 'Runtime security analysis — identify which vulnerabilities are actually exploitable in production and validate security posture',
    icon: Eye,
    source: 'AegisCTEM',
    tests: [
      { id: 'CT-01', name: 'Runtime Exploitability Check', description: 'Cross-reference CVEs with runtime container/process state', category: 'ctem', severity: 'critical', status: 'idle', duration_ms: null, result_detail: null, container_services: ['vuln-webapp'] },
      { id: 'CT-02', name: 'Attack Surface Enumeration', description: 'Map exposed services, open ports, and API endpoints', category: 'ctem', severity: 'high', status: 'idle', duration_ms: null, result_detail: null, container_services: ['vuln-webapp', 'exploit-server'] },
      { id: 'CT-03', name: 'Vulnerability Prioritization', description: 'Rank CVEs by actual exploitability vs. theoretical risk', category: 'ctem', severity: 'medium', status: 'idle', duration_ms: null, result_detail: null, container_services: ['vuln-webapp'] },
    ],
  },
  {
    id: 'assessment',
    name: 'Testing & Assessment Services',
    description: 'Compromise assessment, penetration testing, and AegisSandbox threat emulation',
    icon: Search,
    source: 'Professional Services',
    tests: [
      { id: 'AS-01', name: 'Compromise Assessment — Hidden Infection Scan', description: 'Scan network for active hidden infections, dormant backdoors, and beaconing', category: 'assessment', severity: 'critical', status: 'idle', duration_ms: null, result_detail: null, container_services: ['c2-callback', 'dns-tunnel'] },
      { id: 'AS-02', name: 'Network Penetration Test', description: 'Simulate sophisticated network-level attack — port scan, service exploit, privilege escalation', category: 'assessment', severity: 'critical', status: 'idle', duration_ms: null, result_detail: null, container_services: ['exploit-server', 'vuln-webapp'] },
      { id: 'AS-03', name: 'Web Application Penetration Test', description: 'Full OWASP methodology pentest against target web application', category: 'assessment', severity: 'high', status: 'idle', duration_ms: null, result_detail: null, container_services: ['vuln-webapp'] },
      { id: 'AS-04', name: 'Threat Emulation (AegisSandbox)', description: 'Execute file in virtual sandbox — detect zero-day malicious behavior via emulation', category: 'assessment', severity: 'critical', status: 'idle', duration_ms: null, result_detail: null, container_services: ['sandbox-payloads'] },
    ],
  },
  {
    id: 'aegis-av',
    name: 'Antivirus & IPS Verification',
    description: 'AV profile testing and IPS signature verification',
    icon: Bug,
    source: 'AegisAV/IPS',
    tests: [
      { id: 'AV-01', name: 'AV Profile — HTTPS EICAR (SSL Inspection)', description: 'Download EICAR via HTTPS through SSL inspection and verify block', category: 'aegis-av', severity: 'critical', status: 'idle', duration_ms: null, result_detail: null, container_services: ['malware-host'] },
      { id: 'AV-02', name: 'IPS Signature Match — ShellShock', description: 'Send ShellShock exploit headers to verify IPS signature match', category: 'aegis-av', severity: 'critical', status: 'idle', duration_ms: null, result_detail: null, container_services: ['vuln-webapp'] },
      { id: 'AV-03', name: 'DLP — Credit Card Number Exfiltration', description: 'Attempt to POST PCI test credit card numbers and verify DLP block', category: 'aegis-av', severity: 'high', status: 'idle', duration_ms: null, result_detail: null, container_services: ['data-exfil'] },
    ],
  },
];

/* ─── Helpers ────────────────────────────────────────────────────── */

const severityBadge: Record<string, string> = {
  critical: 'text-red-400 bg-red-900/30 border-red-700/40',
  high: 'text-orange-400 bg-orange-900/30 border-orange-700/40',
  medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/40',
  low: 'text-blue-400 bg-blue-900/30 border-blue-700/40',
};

const statusConfig: Record<TestStatus, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  idle: { label: 'Ready', color: 'text-gray-500', icon: Clock },
  provisioning: { label: 'Provisioning', color: 'text-blue-400', icon: RefreshCw },
  running: { label: 'Running', color: 'text-amber-400', icon: Activity },
  passed: { label: 'Blocked', color: 'text-green-400', icon: CheckCircle2 },
  failed: { label: 'Not Blocked', color: 'text-red-400', icon: XCircle },
  warning: { label: 'Partial', color: 'text-amber-400', icon: AlertTriangle },
  skipped: { label: 'Skipped', color: 'text-gray-600', icon: Clock },
};

const containerStateBadge: Record<ContainerState, { label: string; color: string }> = {
  none: { label: 'Not Provisioned', color: 'text-gray-500 bg-gray-800/50 border-gray-700/40' },
  provisioning: { label: 'Provisioning...', color: 'text-blue-400 bg-blue-900/30 border-blue-500/40' },
  ready: { label: 'Ready', color: 'text-green-400 bg-green-900/30 border-green-500/40' },
  testing: { label: 'Tests Running', color: 'text-amber-400 bg-amber-900/30 border-amber-500/40' },
  destroying: { label: 'Destroying...', color: 'text-red-400 bg-red-900/30 border-red-500/40' },
  destroyed: { label: 'Destroyed', color: 'text-gray-500 bg-gray-800/50 border-gray-700/40' },
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  TEST MY DEFENCE PAGE                                               */
/* ═══════════════════════════════════════════════════════════════════ */

export default function TestMyDefencePage() {
  const [categories, setCategories] = useState<TestCategory[]>(buildTestCategories);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['checkme']));
  const [containerEnv, setContainerEnv] = useState<ContainerEnv>({
    state: 'none', id: null, services: defaultServices, started_at: null, ttl_seconds: 900,
  });
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set(buildTestCategories().map(c => c.id)));

  const allTests = categories.flatMap(c => c.tests);
  const totalTests = allTests.length;
  const passedTests = allTests.filter(t => t.status === 'passed').length;
  const failedTests = allTests.filter(t => t.status === 'failed').length;
  const warningTests = allTests.filter(t => t.status === 'warning').length;
  const runningTests = allTests.filter(t => t.status === 'running' || t.status === 'provisioning').length;

  const toggleCat = (id: string) => {
    setExpandedCats(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  };

  const toggleCatSelection = (id: string) => {
    setSelectedCats(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  };

  /* ── Simulate provisioning containers ─────────────────────────── */
  const markServiceRunning = (index: number) => {
    setContainerEnv(prev => {
      const services = [...prev.services];
      services[index] = { ...services[index], status: 'running' };
      const allRunning = services.every(s => s.status === 'running');
      return {
        ...prev,
        services,
        state: allRunning ? 'ready' : 'provisioning',
        id: allRunning ? `test-env-${Date.now().toString(36)}` : prev.id,
        started_at: allRunning ? new Date().toISOString() : prev.started_at,
      };
    });
  };

  const provisionContainers = useCallback(() => {
    setContainerEnv(prev => ({ ...prev, state: 'provisioning' }));

    const svcCount = defaultServices.length;
    defaultServices.forEach((_, i) => {
      setTimeout(() => markServiceRunning(i), 600 * (i + 1));
    });

    // Set auto-destroy timer display
    setTimeout(() => {
      setContainerEnv(prev => prev.state === 'provisioning' ? { ...prev, state: 'ready', id: `test-env-${Date.now().toString(36)}`, started_at: new Date().toISOString() } : prev);
    }, 600 * (svcCount + 1));
  }, []);

  const updateTestInCategory = (cat: TestCategory, testId: string, patch: Partial<TestCase>): TestCategory => ({
    ...cat,
    tests: cat.tests.map(t => t.id === testId ? { ...t, ...patch } : t),
  });

  const markTestRunning = (testId: string) => {
    setCategories(prev => prev.map(cat => updateTestInCategory(cat, testId, { status: 'running' as TestStatus })));
  };

  const markTestComplete = (testId: string, status: TestStatus, duration: number, detail: string) => {
    setCategories(prev => prev.map(cat => updateTestInCategory(cat, testId, { status, duration_ms: duration, result_detail: detail })));
  };

  /* ── Simulate running selected tests ──────────────────────────── */
  const runAllTests = useCallback(() => {
    if (containerEnv.state !== 'ready' && containerEnv.state !== 'testing') return;
    setContainerEnv(prev => ({ ...prev, state: 'testing' }));

    const selectedTests = categories
      .filter(c => selectedCats.has(c.id))
      .flatMap(c => c.tests);

    selectedTests.forEach((test, i) => {
      setTimeout(() => markTestRunning(test.id), i * 350);

      setTimeout(() => {
        const rng = Math.random();
        let status: TestStatus = 'failed';
        if (rng > 0.15) status = 'passed';
        else if (rng > 0.05) status = 'warning';
        const duration = 200 + Math.floor(Math.random() * 1800);
        let detail: string;
        if (status === 'passed') {
          detail = `Threat blocked by ${['DNS Filter', 'ATP Engine', 'SSL Inspection', 'Web Filter', 'IPS', 'DLP Engine'][Math.floor(Math.random() * 6)]}`;
        } else if (status === 'warning') {
          detail = 'Partially blocked — secondary control triggered after initial bypass';
        } else {
          detail = 'Threat was NOT blocked — review security profile configuration';
        }
        markTestComplete(test.id, status, duration, detail);
      }, i * 350 + 800 + Math.floor(Math.random() * 600));
    });

    // Mark env back to ready after all tests
    setTimeout(() => {
      setContainerEnv(prev => ({ ...prev, state: 'ready' }));
    }, selectedTests.length * 350 + 2000);
  }, [containerEnv.state, categories, selectedCats]);

  /* ── Destroy containers ────────────────────────────────────────── */
  const destroyContainers = useCallback(() => {
    setContainerEnv(prev => ({ ...prev, state: 'destroying' }));
    setTimeout(() => {
      setContainerEnv({
        state: 'destroyed',
        id: null,
        services: defaultServices.map(s => ({ ...s, status: 'stopped' as const })),
        started_at: null,
        ttl_seconds: 900,
      });
    }, 2000);
  }, []);

  /* ── Reset ─────────────────────────────────────────────────────── */
  const resetAll = useCallback(() => {
    setCategories(buildTestCategories());
    setContainerEnv({ state: 'none', id: null, services: defaultServices, started_at: null, ttl_seconds: 900 });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-cyan-400" />
          <div>
            <h1 className="text-xl font-semibold">Security CheckUp</h1>
            <p className="text-sm text-gray-500">
              Security CheckUp — simulate cyber-attacks against ApexAegis to validate your defence posture
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetAll} className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-sm transition-colors overflow-x-auto">
            <RefreshCw size={14} /> Reset
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-sm transition-colors overflow-x-auto">
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Tests', value: totalTests, color: 'text-white/80', icon: Layers },
          { label: 'Blocked', value: passedTests, color: 'text-green-400', icon: CheckCircle2 },
          { label: 'Not Blocked', value: failedTests, color: 'text-red-400', icon: XCircle },
          { label: 'Partial', value: warningTests, color: 'text-amber-400', icon: AlertTriangle },
          { label: 'Running', value: runningTests, color: 'text-blue-400', icon: Activity },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={card.color} />
                <span className="text-xs text-gray-500 uppercase tracking-wider">{card.label}</span>
              </div>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* ── Container Environment Panel ─────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Box size={18} className="text-purple-400" />
            <div>
              <h3 className="text-sm font-semibold">Ephemeral Test Environment</h3>
              <p className="text-[10px] text-gray-500">
                Container-based dummy servers provisioned on demand — auto-destroyed after testing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md border text-[10px] font-medium ${containerStateBadge[containerEnv.state].color}`}>
              {containerStateBadge[containerEnv.state].label}
            </span>
            {containerEnv.id && (
              <span className="px-2 py-1 bg-gray-800 text-gray-500 rounded text-[9px] font-mono">{containerEnv.id}</span>
            )}
          </div>
        </div>

        {/* Service grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
          {containerEnv.services.map(svc => (
            <div key={svc.name} className="p-2 bg-gray-800/40 border border-gray-700/30 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${(() => {
                  if (svc.status === 'running') return 'bg-green-400 shadow-sm shadow-green-400/50';
                  if (svc.status === 'pending') return 'bg-gray-600';
                  return 'bg-red-400';
                })()}`} />
                <span className="text-[9px] font-semibold text-white/70 truncate">{svc.name}</span>
              </div>
              <div className="text-[8px] text-gray-600 truncate">{svc.purpose}</div>
              <div className="text-[8px] text-gray-700 font-mono mt-0.5">:{svc.port}</div>
            </div>
          ))}
        </div>

        {/* Container actions */}
        <div className="flex items-center gap-2">
          {(containerEnv.state === 'none' || containerEnv.state === 'destroyed') && (
            <button onClick={provisionContainers}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-400 rounded-lg text-sm transition-colors">
              <Server size={14} /> Provision Test Environment
            </button>
          )}
          {containerEnv.state === 'ready' && (
            <>
              <button onClick={runAllTests}
                className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 text-green-400 rounded-lg text-sm transition-colors">
                <Play size={14} /> Run Selected Tests
              </button>
              <button onClick={destroyContainers}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 rounded-lg text-sm transition-colors">
                <Trash2 size={14} /> Destroy Environment
              </button>
            </>
          )}
          {containerEnv.state === 'testing' && (
            <button disabled className="flex items-center gap-2 px-4 py-2 bg-amber-600/20 border border-amber-500/40 text-amber-400 rounded-lg text-sm opacity-60 cursor-wait">
              <Activity size={14} className="animate-pulse" /> Tests Running...
            </button>
          )}
          {containerEnv.state === 'provisioning' && (
            <button disabled className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/40 text-blue-400 rounded-lg text-sm opacity-60 cursor-wait">
              <RefreshCw size={14} className="animate-spin" /> Provisioning...
            </button>
          )}
          {containerEnv.state === 'destroying' && (
            <button disabled className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/40 text-red-400 rounded-lg text-sm opacity-60 cursor-wait">
              <Trash2 size={14} className="animate-pulse" /> Destroying...
            </button>
          )}

          <div className="ml-auto text-[10px] text-gray-600">
            TTL: {Math.floor(containerEnv.ttl_seconds / 60)}min auto-destroy · 10 containers · Isolated validation sandbox
          </div>
        </div>
      </div>

      {/* ── Pipeline flow ───────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {[
            { label: 'Provision', sub: 'Container env', icon: Server, color: 'border-purple-500/40 bg-purple-900/20' },
            { label: 'Configure', sub: 'Gateway routing', icon: Wifi, color: 'border-blue-500/40 bg-blue-900/20' },
            { label: 'Execute', sub: 'Attack simulations', icon: Crosshair, color: 'border-red-500/40 bg-red-900/20' },
            { label: 'Validate', sub: 'Block / detect', icon: Shield, color: 'border-green-500/40 bg-green-900/20' },
            { label: 'Report', sub: 'Evidence & score', icon: FileText, color: 'border-amber-500/40 bg-amber-900/20' },
            { label: 'Destroy', sub: 'Tear down env', icon: Trash2, color: 'border-gray-500/40 bg-gray-800/20' },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center gap-3 flex-shrink-0">
                <div className={`p-3 rounded-xl border ${step.color} min-w-[110px]`}>
                  <Icon size={14} className="mb-1" />
                  <div className="text-[10px] font-semibold text-white/80">{step.label}</div>
                  <div className="text-[8px] text-gray-500">{step.sub}</div>
                </div>
                {i < 5 && <ArrowRight size={12} className="text-gray-700 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Test Category Select ────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const CatIcon = cat.icon;
          const selected = selectedCats.has(cat.id);
          const catPassed = cat.tests.filter(t => t.status === 'passed').length;
          const catFailed = cat.tests.filter(t => t.status === 'failed').length;
          return (
            <button key={cat.id} onClick={() => toggleCatSelection(cat.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                selected ? 'bg-blue-600/15 text-blue-400 border-blue-500/40' : 'text-gray-500 border-gray-700/40 hover:text-gray-300'
              }`}>
              <CatIcon size={12} />
              {cat.name.length > 25 ? cat.name.substring(0, 25) + '...' : cat.name}
              {catPassed > 0 && <span className="text-[9px] text-green-400">{catPassed}✓</span>}
              {catFailed > 0 && <span className="text-[9px] text-red-400">{catFailed}✗</span>}
            </button>
          );
        })}
      </div>

      {/* ── Test Categories ─────────────────────────────────────────── */}
      {categories.map(cat => {
        const CatIcon = cat.icon;
        const isExpanded = expandedCats.has(cat.id);
        const catPassed = cat.tests.filter(t => t.status === 'passed').length;
        const catTotal = cat.tests.length;

        return (
          <div key={cat.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <button onClick={() => toggleCat(cat.id)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-800/30 transition-colors text-left">
              <CatIcon size={18} className="text-cyan-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold block">{cat.name}</span>
                <span className="text-[10px] text-gray-500">{cat.description}</span>
              </div>
              <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-[9px]">{cat.source}</span>
              {catPassed > 0 && (
                <span className="text-xs text-green-400 font-mono">{catPassed}/{catTotal}</span>
              )}
              {isExpanded ? <ChevronDown size={14} className="text-gray-600" /> : <ChevronRight size={14} className="text-gray-600" />}
            </button>

            {isExpanded && (
              <div className="border-t border-gray-800/60">
                {cat.tests.map(test => {
                  const stCfg = statusConfig[test.status];
                  const StIcon = stCfg.icon;
                  return (
                    <div key={test.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-800/30 last:border-b-0 hover:bg-gray-800/20 transition-colors">
                      <StIcon size={14} className={`flex-shrink-0 ${stCfg.color} ${test.status === 'running' ? 'animate-pulse' : ''}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-600">{test.id}</span>
                          <span className="text-sm text-white/80">{test.name}</span>
                          {test.technique && (
                            <span className="px-1 py-0.5 bg-purple-900/20 text-purple-400 border border-purple-700/30 rounded text-[8px] font-mono">{test.technique}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{test.description}</div>
                        {test.result_detail && (
                          <div className={`text-[10px] mt-1 ${(() => {
                            if (test.status === 'passed') return 'text-green-400/80';
                            if (test.status === 'failed') return 'text-red-400/80';
                            return 'text-amber-400/80';
                          })()}`}>
                            → {test.result_detail}
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${severityBadge[test.severity]}`}>
                        {test.severity.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-[60px] justify-end">
                        {test.duration_ms !== null && (
                          <span className="text-[9px] text-gray-600 font-mono">{test.duration_ms}ms</span>
                        )}
                        <span className={`text-[10px] ${stCfg.color}`}>{stCfg.label}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {test.container_services.map(svc => (
                          <span key={svc} className="px-1 py-0.5 bg-gray-800/50 text-gray-600 rounded text-[7px]" title={svc}>{svc.split('-')[0]}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <p className="text-[10px] text-gray-700 text-center">
        Security CheckUp · ApexAegis SSE · Container-based ephemeral test infrastructure · Auto-destroyed after validation
      </p>
    </div>
  );
}
