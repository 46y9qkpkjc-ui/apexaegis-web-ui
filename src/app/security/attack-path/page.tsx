'use client';
import { useState } from 'react';
import {
  Shield, AlertTriangle, ChevronDown, ChevronRight,
  Globe, Eye, Bug, Crosshair,
  ArrowRight, CheckCircle2, XCircle, Activity,
  Layers,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────── */

interface AttackHop {
  id: number;
  layer: string;       // dns | gateway | swg | ssl_inspect | ips | url_filter | dlp | app_server
  label: string;
  description: string;
  control: string;     // security control at this hop
  verdict: 'blocked' | 'inspected' | 'passed' | 'bypassed' | 'no_control';
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'none';
  detail: string;
}

interface AttackPath {
  id: string;
  name: string;
  category: 'phishing' | 'malware' | 'data_exfil' | 'lateral_move' | 'dns_tunnel' | 'c2';
  source: string;
  target: string;
  hops: AttackHop[];
  overallBlocked: boolean;
  blockingHop: number | null;   // which hop blocks it (null = reaches target)
  defenseDepth: number;         // how many independent controls intercept
  gapCount: number;             // hops with no_control or bypassed
}

/* ─── Demo Data ──────────────────────────────────────────────── */

const demoAttackPaths: AttackPath[] = [
  {
    id: 'ap-001',
    name: 'Phishing Link via Email',
    category: 'phishing',
    source: 'attacker@evil.com',
    target: 'internal-crm.corp.local',
    hops: [
      { id: 1, layer: 'dns', label: 'DNS Resolution', description: 'evil-login-page.com resolves to 185.234.x.x', control: 'DNS Filter', verdict: 'inspected', riskLevel: 'high', detail: 'Domain matched phishing category — DNS sinkhole applied' },
      { id: 2, layer: 'gateway', label: 'Gateway Ingress', description: 'Traffic enters via sg-gw-01', control: 'Gateway ACL', verdict: 'passed', riskLevel: 'low', detail: 'HTTPS traffic on port 443 — permitted by default outbound rule' },
      { id: 3, layer: 'ssl_inspect', label: 'SSL Inspection', description: 'TLS 1.3 session decrypted for content inspection', control: 'SSL Inline Proxy Engine', verdict: 'inspected', riskLevel: 'none', detail: 'Short-lived leaf cert issued, full payload visible to downstream inspectors' },
      { id: 4, layer: 'url_filter', label: 'URL Categorization', description: 'URL matched phishing category with 94% confidence', control: 'SWG URL Filter', verdict: 'blocked', riskLevel: 'critical', detail: 'Category: Phishing — action: DENY with block page displayed to user' },
      { id: 5, layer: 'ips', label: 'IPS Analysis', description: 'Would inspect for credential harvesting patterns', control: 'IPS Engine', verdict: 'passed', riskLevel: 'none', detail: 'Not reached — blocked at URL filter (hop 4)' },
      { id: 6, layer: 'app_server', label: 'Application Server', description: 'internal-crm.corp.local', control: 'None (target)', verdict: 'no_control', riskLevel: 'none', detail: 'Target application — not reached due to block at hop 4' },
    ],
    overallBlocked: true,
    blockingHop: 4,
    defenseDepth: 3,
    gapCount: 0,
  },
  {
    id: 'ap-002',
    name: 'Malware Download (EICAR)',
    category: 'malware',
    source: 'compromised-blog.example.com',
    target: 'user-workstation-01',
    hops: [
      { id: 1, layer: 'dns', label: 'DNS Resolution', description: 'compromised-blog.example.com resolves normally', control: 'DNS Filter', verdict: 'passed', riskLevel: 'low', detail: 'Domain is legitimate blog — not in threat feed (reputation OK)' },
      { id: 2, layer: 'gateway', label: 'Gateway Ingress', description: 'HTTPS GET for blog post with embedded malware link', control: 'Gateway ACL', verdict: 'passed', riskLevel: 'low', detail: 'Outbound HTTPS — standard browsing traffic' },
      { id: 3, layer: 'ssl_inspect', label: 'SSL Inspection', description: 'TLS session decrypted, binary payload extracted', control: 'SSL Inline Proxy Engine', verdict: 'inspected', riskLevel: 'none', detail: 'Content-Type: application/octet-stream detected, forwarded to AV' },
      { id: 4, layer: 'url_filter', label: 'URL Categorization', description: 'Blog category — permitted', control: 'SWG URL Filter', verdict: 'passed', riskLevel: 'low', detail: 'Category: Technology/Blog — action: ALLOW' },
      { id: 5, layer: 'ips', label: 'AV / Content Inspection', description: 'EICAR test signature detected in HTTP response body', control: 'AntiVirus Engine', verdict: 'blocked', riskLevel: 'critical', detail: 'Signature: EICAR-STANDARD-AV-TEST-FILE — action: DROP + alert' },
      { id: 6, layer: 'app_server', label: 'User Workstation', description: 'user-workstation-01', control: 'None (target)', verdict: 'no_control', riskLevel: 'none', detail: 'Target endpoint — not reached due to AV block at hop 5' },
    ],
    overallBlocked: true,
    blockingHop: 5,
    defenseDepth: 2,
    gapCount: 0,
  },
  {
    id: 'ap-003',
    name: 'DNS Tunnel Exfiltration',
    category: 'dns_tunnel',
    source: 'compromised-host-10.0.1.50',
    target: 'c2-server.attacker.xyz',
    hops: [
      { id: 1, layer: 'dns', label: 'DNS Query', description: 'TXT query to encoded.attacker.xyz with base64 payload', control: 'DNS Tunnel Detection', verdict: 'blocked', riskLevel: 'critical', detail: 'High-entropy DNS query detected — query length 180 chars, entropy 4.8 bits/char — tunnel signature matched' },
      { id: 2, layer: 'gateway', label: 'Gateway Egress', description: 'DNS-over-HTTPS fallback attempt', control: 'DoH Intercept', verdict: 'inspected', riskLevel: 'high', detail: 'DoH to non-approved resolver — redirected to protected DNS' },
      { id: 3, layer: 'app_server', label: 'C2 Server', description: 'c2-server.attacker.xyz', control: 'None (target)', verdict: 'no_control', riskLevel: 'none', detail: 'Exfiltration target — not reached due to DNS tunnel block' },
    ],
    overallBlocked: true,
    blockingHop: 1,
    defenseDepth: 2,
    gapCount: 0,
  },
  {
    id: 'ap-004',
    name: 'Lateral Movement via SGT Bypass',
    category: 'lateral_move',
    source: 'compromised-marketing-10.0.3.20 (SGT-300)',
    target: 'production-db.corp.local (SGT-200)',
    hops: [
      { id: 1, layer: 'dns', label: 'Internal DNS', description: 'production-db.corp.local resolves to 10.0.2.50', control: 'Internal DNS', verdict: 'passed', riskLevel: 'low', detail: 'Internal resolution — no external threat feed match' },
      { id: 2, layer: 'gateway', label: 'SGT Enforcement', description: 'Frame tagged SGT-300 attempting to reach SGT-200', control: 'SGT Policy Matrix', verdict: 'blocked', riskLevel: 'critical', detail: 'SGT-300 (Marketing) → SGT-200 (Production) = DENY ALL — dropped at switch ASIC' },
      { id: 3, layer: 'app_server', label: 'Production DB', description: 'production-db.corp.local:5432', control: 'None (target)', verdict: 'no_control', riskLevel: 'none', detail: 'Target — not reached due to SGT matrix enforcement' },
    ],
    overallBlocked: true,
    blockingHop: 2,
    defenseDepth: 1,
    gapCount: 0,
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */

const verdictStyle: Record<string, string> = {
  blocked: 'text-red-400 bg-red-900/30 border-red-700/40',
  inspected: 'text-blue-400 bg-blue-900/30 border-blue-700/40',
  passed: 'text-green-400 bg-green-900/30 border-green-700/40',
  bypassed: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/40',
  no_control: 'text-gray-500 bg-gray-800/30 border-gray-700/40',
};

const categoryStyle: Record<string, { color: string; icon: typeof Globe }> = {
  phishing: { color: 'text-red-400', icon: AlertTriangle },
  malware: { color: 'text-orange-400', icon: Bug },
  data_exfil: { color: 'text-yellow-400', icon: Eye },
  lateral_move: { color: 'text-purple-400', icon: Layers },
  dns_tunnel: { color: 'text-cyan-400', icon: Globe },
  c2: { color: 'text-red-500', icon: Crosshair },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  ATTACK PATH ANALYSIS PAGE                                      */
/* ═══════════════════════════════════════════════════════════════ */

export default function AttackPathPage() {
  const [attackPaths] = useState<AttackPath[]>(demoAttackPaths);
  const [expandedPath, setExpandedPath] = useState<string | null>('ap-001');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filtered = filterCategory === 'all'
    ? attackPaths
    : attackPaths.filter(p => p.category === filterCategory);

  const totalPaths = attackPaths.length;
  const allBlocked = attackPaths.filter(p => p.overallBlocked).length;
  const withGaps = attackPaths.filter(p => p.gapCount > 0).length;
  const avgDepth = attackPaths.length > 0
    ? (attackPaths.reduce((sum, p) => sum + p.defenseDepth, 0) / attackPaths.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Crosshair size={24} className="text-red-400" />
        <div>
          <h1 className="text-xl font-semibold">Attack Path Analysis</h1>
          <p className="text-sm text-gray-500">
            Shows theoretical attacker reachability — every hop an attack takes and which control blocks it.
            Unlike Security Preview (policy verdict simulation), this maps the full kill chain topology.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Attack Paths', value: totalPaths, icon: Activity, color: 'text-blue-400' },
          { label: 'All Blocked', value: allBlocked, icon: Shield, color: 'text-green-400' },
          { label: 'Paths with Gaps', value: withGaps, icon: AlertTriangle, color: withGaps > 0 ? 'text-red-400' : 'text-green-400' },
          { label: 'Avg Defense Depth', value: avgDepth, icon: Layers, color: 'text-cyan-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
            <s.icon size={20} className={s.color} />
            <div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'phishing', 'malware', 'dns_tunnel', 'lateral_move', 'data_exfil', 'c2'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              filterCategory === cat
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            {cat === 'all' ? 'All' : cat.replaceAll('_', ' ').replaceAll(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Attack Paths */}
      <div className="space-y-3">
        {filtered.map(path => {
          const isExpanded = expandedPath === path.id;
          const catInfo = categoryStyle[path.category] || categoryStyle.phishing;
          const CatIcon = catInfo.icon;

          return (
            <div key={path.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* Path header */}
              <button
                onClick={() => setExpandedPath(isExpanded ? null : path.id)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-800/30 transition-colors text-left"
              >
                {path.overallBlocked
                  ? <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                  : <XCircle size={16} className="text-red-400 flex-shrink-0" />}
                <CatIcon size={14} className={catInfo.color} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{path.name}</span>
                  <span className="text-[10px] text-gray-500 ml-2">
                    {path.hops.length} hops · defense depth {path.defenseDepth}
                    {path.blockingHop ? ` · blocked at hop ${path.blockingHop}` : ' · REACHES TARGET'}
                  </span>
                </div>
                <span className="text-[10px] text-gray-600 font-mono truncate max-w-[150px]">{path.source}</span>
                <ArrowRight size={10} className="text-gray-600 flex-shrink-0" />
                <span className="text-[10px] text-gray-600 font-mono truncate max-w-[150px]">{path.target}</span>
                {isExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
              </button>

              {/* Expanded: Kill chain visualization */}
              {isExpanded && (
                <div className="border-t border-gray-800/60 px-5 py-4 space-y-3">

                  {/* Visual hop chain */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    <div className="px-2 py-1 bg-red-900/20 border border-red-800/40 rounded text-[9px] text-red-400 font-mono whitespace-nowrap flex-shrink-0">
                      {path.source.length > 25 ? path.source.slice(0, 25) + '...' : path.source}
                    </div>
                    {path.hops.map((hop, i) => (
                      <div key={hop.id} className="flex items-center gap-1 flex-shrink-0">
                        <ArrowRight size={10} className="text-gray-700" />
                        <div className={`px-2 py-1 rounded text-[9px] font-medium border whitespace-nowrap ${verdictStyle[hop.verdict]}`}>
                          {hop.label}
                          {hop.verdict === 'blocked' && ' ✕'}
                          {hop.verdict === 'inspected' && ' ⚡'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Detailed hop table */}
                  <div className="space-y-1.5">
                    {path.hops.map(hop => (
                      <div key={hop.id} className="flex items-start gap-3 p-2.5 bg-gray-800/20 rounded-lg border border-gray-800/40">
                        <span className="text-[10px] text-gray-600 font-mono mt-0.5 w-6">#{hop.id}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-white/80">{hop.label}</span>
                            <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border ${verdictStyle[hop.verdict]}`}>
                              {hop.verdict.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-gray-600">Control: {hop.control}</span>
                          </div>
                          <p className="text-[10px] text-gray-500">{hop.description}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{hop.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
