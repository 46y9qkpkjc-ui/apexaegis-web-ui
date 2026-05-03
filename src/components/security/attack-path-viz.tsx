'use client';
import { useState } from 'react';
import {
  Target, Shield, Server, Users, Key, Database, Globe,
  AlertTriangle, ChevronRight, ArrowRight, Zap, Eye,
  ChevronDown, Lock, MonitorSmartphone, Network,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ─────────────────────────────────────────────────── */
interface AttackNode {
  id: string;
  label: string;
  type: 'user' | 'device' | 'credential' | 'server' | 'database' | 'application' | 'domain_admin' | 'cloud_asset' | 'network_segment';
  compromised: boolean;
  criticalAsset: boolean;
  risk: 'critical' | 'high' | 'medium' | 'low';
  details: string;
}

interface AttackEdge {
  from: string;
  to: string;
  technique: string;
  mitre: string;
  exploitability: 'proven' | 'likely' | 'possible';
}

interface AttackPath {
  id: string;
  name: string;
  description: string;
  complexity: 'trivial' | 'easy' | 'moderate' | 'hard';
  steps: number;
  nodes: AttackNode[];
  edges: AttackEdge[];
  impactScore: number;
  remediations: string[];
}

/* ─── Node Icons & Colors ───────────────────────────────────── */
const NODE_META: Record<AttackNode['type'], { icon: typeof Shield; color: string; bg: string }> = {
  user: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-700' },
  device: { icon: MonitorSmartphone, color: 'text-cyan-400', bg: 'bg-cyan-900/30 border-cyan-700' },
  credential: { icon: Key, color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-700' },
  server: { icon: Server, color: 'text-green-400', bg: 'bg-green-900/30 border-green-700' },
  database: { icon: Database, color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-700' },
  application: { icon: Globe, color: 'text-indigo-400', bg: 'bg-indigo-900/30 border-indigo-700' },
  domain_admin: { icon: Shield, color: 'text-red-400', bg: 'bg-red-900/30 border-red-700' },
  cloud_asset: { icon: Globe, color: 'text-teal-400', bg: 'bg-teal-900/30 border-teal-700' },
  network_segment: { icon: Network, color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-700' },
};

const COMPLEXITY_STYLE: Record<string, string> = {
  trivial: 'bg-red-900/40 text-red-400 border-red-700',
  easy: 'bg-orange-900/40 text-orange-400 border-orange-700',
  moderate: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
  hard: 'bg-green-900/40 text-green-400 border-green-700',
};

const EXPLOITABILITY_STYLE: Record<string, string> = {
  proven: 'text-red-400',
  likely: 'text-yellow-400',
  possible: 'text-blue-400',
};

/* ─── Demo Attack Paths ─────────────────────────────────────── */
const DEMO_PATHS: AttackPath[] = [
  {
    id: 'path1',
    name: 'Phishing → Domain Admin',
    description: 'Attacker phishes low-privilege user, escalates through Kerberoasting to Domain Admin via vulnerable service account.',
    complexity: 'easy',
    steps: 5,
    impactScore: 98,
    nodes: [
      { id: 'n1', label: 'jdoe@acme.com', type: 'user', compromised: true, criticalAsset: false, risk: 'medium', details: 'Phished via credential harvest email' },
      { id: 'n2', label: 'LAPTOP-JD01', type: 'device', compromised: true, criticalAsset: false, risk: 'high', details: 'Initial access — Cobalt Strike beacon installed' },
      { id: 'n3', label: 'svc-sql@acme.local', type: 'credential', compromised: true, criticalAsset: false, risk: 'critical', details: 'SPN Kerberoast → cracked weak password (P@ssw0rd1)' },
      { id: 'n4', label: 'SQL-PROD-01', type: 'server', compromised: true, criticalAsset: true, risk: 'critical', details: 'SQL Server admin via service account credentials' },
      { id: 'n5', label: 'Domain Admin', type: 'domain_admin', compromised: true, criticalAsset: true, risk: 'critical', details: 'DCSync via SQL Server → extracted KRBTGT hash' },
    ],
    edges: [
      { from: 'n1', to: 'n2', technique: 'Spearphishing Link', mitre: 'T1566.002', exploitability: 'proven' },
      { from: 'n2', to: 'n3', technique: 'Kerberoasting', mitre: 'T1558.003', exploitability: 'proven' },
      { from: 'n3', to: 'n4', technique: 'Valid Credentials', mitre: 'T1078', exploitability: 'proven' },
      { from: 'n4', to: 'n5', technique: 'DCSync', mitre: 'T1003.006', exploitability: 'likely' },
    ],
    remediations: [
      'Enforce MFA for all user accounts to block initial phishing',
      'Rotate service accounts to 25+ character managed passwords',
      'Remove unnecessary SPNs from service accounts',
      'Network-segment SQL server from domain controllers',
      'Deploy endpoint detection (EDR) on all workstations',
    ],
  },
  {
    id: 'path2',
    name: 'Exposed App → Cloud Takeover',
    description: 'Vulnerable web application exposes AWS credentials in environment variables, attacker pivots to S3 and then IAM admin.',
    complexity: 'moderate',
    steps: 4,
    impactScore: 92,
    nodes: [
      { id: 'n6', label: 'api.acme.com', type: 'application', compromised: true, criticalAsset: false, risk: 'high', details: 'SSRF vulnerability in image proxy endpoint' },
      { id: 'n7', label: 'EC2 Instance Metadata', type: 'cloud_asset', compromised: true, criticalAsset: false, risk: 'high', details: 'IMDSv1 enabled — role credentials extracted via SSRF' },
      { id: 'n8', label: 's3://acme-customer-data', type: 'database', compromised: true, criticalAsset: true, risk: 'critical', details: 'S3 bucket with 2M customer records — no encryption at rest' },
      { id: 'n9', label: 'IAM Admin Role', type: 'domain_admin', compromised: true, criticalAsset: true, risk: 'critical', details: 'iam:PassRole escalation from EC2 role to admin' },
    ],
    edges: [
      { from: 'n6', to: 'n7', technique: 'SSRF to Cloud Metadata', mitre: 'T1552.005', exploitability: 'proven' },
      { from: 'n7', to: 'n8', technique: 'Cloud Storage Access', mitre: 'T1530', exploitability: 'proven' },
      { from: 'n7', to: 'n9', technique: 'IAM Privilege Escalation', mitre: 'T1548', exploitability: 'likely' },
    ],
    remediations: [
      'Patch SSRF vulnerability in api.acme.com image proxy',
      'Enforce IMDSv2 on all EC2 instances',
      'Apply least-privilege IAM policies — remove iam:PassRole',
      'Enable S3 encryption at rest and restrict bucket policies',
    ],
  },
  {
    id: 'path3',
    name: 'Lateral Move via RDP',
    description: 'Compromised VPN credential enables RDP lateral movement through flat network to financial database.',
    complexity: 'trivial',
    steps: 4,
    impactScore: 85,
    nodes: [
      { id: 'n10', label: 'VPN Gateway', type: 'network_segment', compromised: true, criticalAsset: false, risk: 'high', details: 'Compromised VPN credentials — no MFA required' },
      { id: 'n11', label: 'IT-ADMIN-WS', type: 'device', compromised: true, criticalAsset: false, risk: 'high', details: 'RDP enabled, local admin password reuse across hosts' },
      { id: 'n12', label: 'FILE-SERVER-02', type: 'server', compromised: true, criticalAsset: false, risk: 'medium', details: 'Flat network — no segmentation between workstations and servers' },
      { id: 'n13', label: 'Financial DB (SAP)', type: 'database', compromised: true, criticalAsset: true, risk: 'critical', details: 'SAP HANA with financial data accessible from FILE-SERVER-02' },
    ],
    edges: [
      { from: 'n10', to: 'n11', technique: 'Remote Desktop (RDP)', mitre: 'T1021.001', exploitability: 'proven' },
      { from: 'n11', to: 'n12', technique: 'Pass-the-Hash', mitre: 'T1550.002', exploitability: 'proven' },
      { from: 'n12', to: 'n13', technique: 'Database Access', mitre: 'T1213', exploitability: 'likely' },
    ],
    remediations: [
      'Enforce MFA on VPN gateway',
      'Deploy LAPS (Local Administrator Password Solution)',
      'Implement network microsegmentation between tiers',
      'Restrict RDP access via firewall rules and jump servers',
    ],
  },
  {
    id: 'path4',
    name: 'Supply Chain → Internal Network',
    description: 'Compromised third-party vendor software update delivers backdoor, pivoting into internal network.',
    complexity: 'hard',
    steps: 5,
    impactScore: 78,
    nodes: [
      { id: 'n14', label: 'Vendor Update Server', type: 'application', compromised: true, criticalAsset: false, risk: 'high', details: 'Compromised software update mechanism' },
      { id: 'n15', label: 'WORKSTATION-POOL', type: 'device', compromised: true, criticalAsset: false, risk: 'high', details: '47 workstations received backdoored update' },
      { id: 'n16', label: 'admin@acme.local', type: 'credential', compromised: true, criticalAsset: false, risk: 'critical', details: 'NTLM hash captured via Mimikatz on admin workstation' },
      { id: 'n17', label: 'DC-01.acme.local', type: 'server', compromised: true, criticalAsset: true, risk: 'critical', details: 'Domain controller accessed via admin credentials' },
      { id: 'n18', label: 'All Domain Assets', type: 'domain_admin', compromised: true, criticalAsset: true, risk: 'critical', details: 'Golden Ticket — persistent domain compromise' },
    ],
    edges: [
      { from: 'n14', to: 'n15', technique: 'Supply Chain Compromise', mitre: 'T1195.002', exploitability: 'possible' },
      { from: 'n15', to: 'n16', technique: 'Credential Dumping', mitre: 'T1003.001', exploitability: 'proven' },
      { from: 'n16', to: 'n17', technique: 'Pass-the-Hash', mitre: 'T1550.002', exploitability: 'proven' },
      { from: 'n17', to: 'n18', technique: 'Golden Ticket', mitre: 'T1558.001', exploitability: 'likely' },
    ],
    remediations: [
      'Verify vendor software integrity (code signing, hash checks)',
      'Application allowlisting on endpoints',
      'Deploy Credential Guard on domain-joined systems',
      'Monitor for abnormal DC authentication patterns',
      'Implement tiered administration model',
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function AttackPathVisualization() {
  const [selectedPath, setSelectedPath] = useState<AttackPath>(DEMO_PATHS[0]);
  const [animating, setAnimating] = useState(false);
  const [animStep, setAnimStep] = useState(-1);
  const [showRemediations, setShowRemediations] = useState(false);

  function playAnimation() {
    if (animating) return;
    setAnimating(true);
    setAnimStep(-1);

    const edgeCount = selectedPath.edges.length;
    for (let i = 0; i <= edgeCount; i++) {
      setTimeout(() => {
        setAnimStep(i);
        if (i === edgeCount) {
          setTimeout(() => setAnimating(false), 1000);
        }
      }, i * 900);
    }
  }

  return (
    <div className="space-y-6">
      {/* Path selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DEMO_PATHS.map(path => (
          <button
            key={path.id}
            onClick={() => { setSelectedPath(path); setAnimStep(-1); setAnimating(false); }}
            className={clsx(
              'px-4 py-2 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors',
              selectedPath.id === path.id
                ? 'bg-red-900/40 border-red-700 text-red-300'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
            )}
          >
            <div className="flex items-center gap-2">
              <Target size={12} />
              {path.name}
              <span className="text-[10px] text-gray-500">({path.steps} steps)</span>
            </div>
          </button>
        ))}
      </div>

      {/* Path info bar */}
      <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
        <div>
          <p className="text-sm font-medium">{selectedPath.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{selectedPath.description}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-center">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Impact</span>
            <span className={clsx('text-lg font-bold', selectedPath.impactScore >= 90 ? 'text-red-400' : selectedPath.impactScore >= 70 ? 'text-orange-400' : 'text-yellow-400')}>
              {selectedPath.impactScore}
            </span>
          </div>
          <span className={`px-2 py-1 rounded text-[10px] font-medium border ${COMPLEXITY_STYLE[selectedPath.complexity]}`}>
            {selectedPath.complexity.toUpperCase()}
          </span>
          <button
            onClick={playAnimation}
            disabled={animating}
            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors"
          >
            <Zap size={12} />
            {animating ? 'Simulating...' : 'Simulate Attack'}
          </button>
        </div>
      </div>

      {/* Attack path graph — horizontal chain */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {selectedPath.nodes.map((node, idx) => {
            const meta = NODE_META[node.type];
            const Icon = meta.icon;
            const edge = idx > 0 ? selectedPath.edges[idx - 1] : null;
            const isReached = animStep >= idx;
            const edgeActive = edge && animStep >= idx;

            return (
              <div key={node.id} className="flex items-center gap-1">
                {/* Edge arrow */}
                {edge && (
                  <div className="flex flex-col items-center mx-1 min-w-[120px]">
                    <span className={clsx('text-[9px] font-mono mb-1 text-center', edgeActive ? EXPLOITABILITY_STYLE[edge.exploitability] : 'text-gray-600')}>
                      {edge.mitre}
                    </span>
                    <div className="relative w-full h-[2px] bg-gray-800 rounded">
                      <div
                        className={clsx(
                          'absolute inset-y-0 left-0 rounded transition-all duration-700',
                          edgeActive
                            ? edge.exploitability === 'proven' ? 'bg-red-500 w-full' : edge.exploitability === 'likely' ? 'bg-yellow-500 w-full' : 'bg-blue-500 w-full'
                            : 'bg-gray-700 w-0'
                        )}
                      />
                      {edgeActive && (
                        <div className="absolute -right-1 -top-1 w-2 h-2">
                          <ArrowRight size={10} className={EXPLOITABILITY_STYLE[edge.exploitability]} />
                        </div>
                      )}
                    </div>
                    <span className={clsx('text-[9px] mt-1 text-center max-w-[110px] truncate', edgeActive ? 'text-gray-300' : 'text-gray-600')}>
                      {edge.technique}
                    </span>
                  </div>
                )}

                {/* Node */}
                <div
                  className={clsx(
                    'relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-500 min-w-[110px]',
                    isReached
                      ? `${meta.bg} shadow-lg shadow-${meta.color.replace('text-', '')}/10`
                      : 'border-gray-800 bg-gray-900/50',
                    node.criticalAsset && isReached && 'ring-2 ring-red-500/50 ring-offset-1 ring-offset-gray-950',
                    animStep === idx && animating && 'animate-pulse'
                  )}
                >
                  {node.criticalAsset && (
                    <span className="absolute -top-2 -right-2 px-1 py-0.5 rounded bg-red-600 text-[8px] font-bold text-white">
                      CRITICAL
                    </span>
                  )}
                  <Icon size={20} className={isReached ? meta.color : 'text-gray-600'} />
                  <span className={clsx('text-[10px] font-medium mt-1.5 text-center max-w-[100px] truncate', isReached ? 'text-gray-200' : 'text-gray-600')}>
                    {node.label}
                  </span>
                  <span className="text-[9px] text-gray-500 mt-0.5">{node.type.replace('_', ' ')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Remediations */}
      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowRemediations(r => !r)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-green-400" />
            <span className="text-sm font-medium">Remediations ({selectedPath.remediations.length})</span>
          </div>
          {showRemediations ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
        </button>
        {showRemediations && (
          <div className="p-4 space-y-2 border-t border-gray-800">
            {selectedPath.remediations.map((rem, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-green-900/30 text-green-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs text-gray-300">{rem}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
