'use client';
import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import {
  Ghost, Search, ChevronDown, ChevronRight, Shield, AlertTriangle,
  CheckCircle2, XCircle, Star, ArrowRight, ExternalLink, Eye,
  Layers, RefreshCw, BarChart3, Zap, Lock, Globe, Server,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
interface GhostedApp {
  id: string;
  name: string;
  vendor: string;
  category: string;
  detectedOn: string[];       // hostnames
  lastSeen: string;
  status: 'active' | 'idle' | 'unresponsive';
  version: string;
  duplicatesFeature: string | null;  // which ApexAegis feature it overlaps with
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'none';
  listenPorts: number[];
  resourceUsage: { cpuPct: number; memMb: number };
  description: string;
}

interface FeatureComparison {
  feature: string;
  apexAegis: FeatureDetail;
  competitor: FeatureDetail;
  verdict: 'apex-better' | 'competitor-better' | 'equal';
}

interface FeatureDetail {
  supported: boolean;
  maturity: 'production' | 'beta' | 'limited' | 'none';
  notes: string;
}

interface ProCon {
  product: string;
  pros: string[];
  cons: string[];
}

/* ─── Demo data ─────────────────────────────────────────────── */
const GHOSTED_APPS: GhostedApp[] = [
  {
    id: 'g1', name: 'CrowdStrike Falcon Sensor', vendor: 'CrowdStrike', category: 'Endpoint Protection',
    detectedOn: ['WS-FINANCE-01', 'WS-SALES-04', 'SRV-DB-02'], lastSeen: '2026-03-13 09:12:00', status: 'active',
    version: '7.14.0', duplicatesFeature: 'ATP & Endpoint DLP', riskLevel: 'medium',
    listenPorts: [443, 8043], resourceUsage: { cpuPct: 4.2, memMb: 380 },
    description: 'EDR agent with cloud-based threat intelligence. Overlaps with ApexAegis ATP engine and endpoint DLP capabilities.',
  },
  {
    id: 'g2', name: 'Zscaler Client Connector', vendor: 'Zscaler', category: 'Secure Web Gateway',
    detectedOn: ['WS-ENG-02', 'WS-ENG-07', 'WS-PRODUCT-01', 'WS-HR-03'], lastSeen: '2026-03-13 09:15:00', status: 'active',
    version: '4.2.0.190', duplicatesFeature: 'SWG & SSL Inspection', riskLevel: 'high',
    listenPorts: [9000, 9443, 443], resourceUsage: { cpuPct: 6.8, memMb: 520 },
    description: 'Cloud SWG agent. Directly conflicts with ApexAegis SWG proxy, SSL inspection, and DNS filtering. Running both causes split-tunnel conflicts.',
  },
  {
    id: 'g3', name: 'Cisco Umbrella Roaming Client', vendor: 'Cisco', category: 'DNS Security',
    detectedOn: ['WS-FINANCE-01', 'WS-IT-ADMIN-01'], lastSeen: '2026-03-13 08:45:00', status: 'idle',
    version: '3.0.110.0', duplicatesFeature: 'DNS Filtering', riskLevel: 'medium',
    listenPorts: [53, 5353], resourceUsage: { cpuPct: 0.5, memMb: 85 },
    description: 'DNS-layer security client. Conflicts with ApexAegis DNS filter — both intercept port 53 traffic, causing resolution failures.',
  },
  {
    id: 'g4', name: 'Palo Alto GlobalProtect', vendor: 'Palo Alto Networks', category: 'VPN / ZTNA',
    detectedOn: ['WS-ENG-02', 'WS-SALES-04', 'WS-EXEC-01'], lastSeen: '2026-03-13 09:10:00', status: 'active',
    version: '6.2.1', duplicatesFeature: 'ZTNA & Tunnel', riskLevel: 'high',
    listenPorts: [4501, 443], resourceUsage: { cpuPct: 3.1, memMb: 290 },
    description: 'VPN/ZTNA agent. Conflicts with ApexAegis MASQUE/QUIC tunnel — dual tunnel causes MTU issues, packet fragmentation, and routing table conflicts.',
  },
  {
    id: 'g5', name: 'Symantec DLP Agent', vendor: 'Broadcom', category: 'Data Loss Prevention',
    detectedOn: ['WS-FINANCE-01', 'WS-HR-03', 'SRV-FILE-01'], lastSeen: '2026-03-12 22:30:00', status: 'idle',
    version: '16.0.2', duplicatesFeature: 'Endpoint DLP', riskLevel: 'medium',
    listenPorts: [2100], resourceUsage: { cpuPct: 1.8, memMb: 420 },
    description: 'Legacy DLP agent with content inspection. Feature parity with ApexAegis DLP engine for pattern matching, clipboard monitoring, and USB control.',
  },
  {
    id: 'g6', name: 'McAfee ePO Agent', vendor: 'Trellix', category: 'Endpoint Protection',
    detectedOn: ['SRV-DB-02', 'SRV-WEB-01'], lastSeen: '2026-03-11 14:00:00', status: 'unresponsive',
    version: '5.7.6', duplicatesFeature: 'ATP Profiles', riskLevel: 'low',
    listenPorts: [8081], resourceUsage: { cpuPct: 0.1, memMb: 150 },
    description: 'Legacy endpoint agent — appears unresponsive for >24h. Still registered in ePO but not actively protecting. Safe to remove.',
  },
  {
    id: 'g7', name: 'Netskope Client', vendor: 'Netskope', category: 'CASB / SWG',
    detectedOn: ['WS-PRODUCT-01'], lastSeen: '2026-03-13 09:00:00', status: 'active',
    version: '104.2.0', duplicatesFeature: 'SWG & CASB & DLP', riskLevel: 'high',
    listenPorts: [443, 8443, 7080], resourceUsage: { cpuPct: 5.5, memMb: 480 },
    description: 'SSE agent with SWG, CASB, and DLP. Nearly full overlap with ApexAegis features. Running both doubles inspection latency and CPU usage.',
  },
  {
    id: 'g8', name: 'Carbon Black Cloud Sensor', vendor: 'VMware', category: 'Endpoint Protection',
    detectedOn: ['SRV-WEB-01'], lastSeen: '2026-03-13 07:30:00', status: 'active',
    version: '3.9.1', duplicatesFeature: null, riskLevel: 'none',
    listenPorts: [41091], resourceUsage: { cpuPct: 2.0, memMb: 210 },
    description: 'Endpoint detection sensor. No direct feature overlap — provides behavioral analysis complementary to ApexAegis.',
  },
  {
    id: 'g9', name: 'Forcepoint Web Gateway Agent', vendor: 'Forcepoint', category: 'Web Filtering',
    detectedOn: ['WS-SALES-04'], lastSeen: '2026-03-10 16:00:00', status: 'unresponsive',
    version: '8.5.5', duplicatesFeature: 'Web Filter', riskLevel: 'low',
    listenPorts: [15871], resourceUsage: { cpuPct: 0.0, memMb: 95 },
    description: 'Legacy web filter agent. Unresponsive — likely orphaned from previous vendor stack. Safe for removal.',
  },
];

/* ─── Feature comparison data ───────────────────────────────── */
function getComparison(app: GhostedApp): { comparisons: FeatureComparison[]; prosCons: ProCon[] } | null {
  if (!app.duplicatesFeature) return null;

  const comparisons: Record<string, { comparisons: FeatureComparison[]; prosCons: ProCon[] }> = {
    'ATP & Endpoint DLP': {
      comparisons: [
        { feature: 'Malware Detection (Signatures)', apexAegis: { supported: true, maturity: 'production', notes: 'Cloud-updated signatures via ATP engine' }, competitor: { supported: true, maturity: 'production', notes: 'CrowdStrike Threat Graph with ML' }, verdict: 'competitor-better' },
        { feature: 'Behavioral Analysis', apexAegis: { supported: true, maturity: 'production', notes: 'MITRE ATT&CK simulation + UEBA behavioral engine + AttackIQ partnership' }, competitor: { supported: true, maturity: 'production', notes: 'Industry-leading IOA behavioral engine' }, verdict: 'equal' },
        { feature: 'Endpoint DLP (Clipboard/USB)', apexAegis: { supported: true, maturity: 'production', notes: '12 patterns, 8 channels including USB & clipboard' }, competitor: { supported: true, maturity: 'limited', notes: 'Basic DLP via Falcon Data Protection add-on' }, verdict: 'apex-better' },
        { feature: 'SSL/TLS Inspection', apexAegis: { supported: true, maturity: 'production', notes: 'Full TLS 1.3 interception with cert pinning bypass' }, competitor: { supported: false, maturity: 'none', notes: 'Not an SSL inspection product' }, verdict: 'apex-better' },
        { feature: 'DNS Filtering', apexAegis: { supported: true, maturity: 'production', notes: 'NRD/NOD blocking, custom blocklists' }, competitor: { supported: false, maturity: 'none', notes: 'No DNS filtering capability' }, verdict: 'apex-better' },
        { feature: 'Unified Policy Engine', apexAegis: { supported: true, maturity: 'production', notes: 'Single policy for SWG+CASB+DLP+ATP' }, competitor: { supported: false, maturity: 'none', notes: 'Requires separate Falcon policies per module' }, verdict: 'apex-better' },
      ],
      prosCons: [
        { product: 'ApexAegis', pros: ['Unified SSE platform — single agent replaces multiple tools', 'Integrated DLP with 12 pattern types and 8 inspection channels', 'Full SSL/DNS/Web filtering in same pipeline', 'Lower total cost — no separate DLP/SWG license', 'Singtel backbone — 428 PoPs in 362 cities, sub-100ms threat intel propagation globally', 'AegisRoute™ path-aware networking — zero BGP-hijack risk with cryptographic path verification'], cons: ['Behavioral analysis: production-grade via MITRE ATT&CK simulation + AttackIQ partnership', 'Threat intel: augmented via AegisThreat IOC Platform + CrowdStrike Falcon Intelligence & Recorded Future partnerships', 'Forensic timeline: addressed via Mandiant Advantage IR partnership + proprietary IR toolkit'] },
        { product: 'CrowdStrike Falcon', pros: ['Industry-leading EDR with Threat Graph ML', 'Deep forensic investigation tools', 'Large threat intelligence network', 'Proven in advanced APT detection'], cons: ['No SWG/SSL inspection capability', 'DLP is limited add-on, not integrated', 'Requires additional tools for web/DNS filtering', 'Higher per-endpoint cost', 'No global backbone — relies on public internet for cloud connectivity'] },
      ],
    },
    'SWG & SSL Inspection': {
      comparisons: [
        { feature: 'Secure Web Gateway', apexAegis: { supported: true, maturity: 'production', notes: 'Full SWG with URL categorization and app control' }, competitor: { supported: true, maturity: 'production', notes: 'Established cloud SWG with 150+ data centers' }, verdict: 'equal' },
        { feature: 'SSL Inspection', apexAegis: { supported: true, maturity: 'production', notes: 'TLS 1.3, cert pinning bypass, 5-point verification' }, competitor: { supported: true, maturity: 'production', notes: 'Cloud-based SSL inspection' }, verdict: 'equal' },
        { feature: 'ZTNA / Private Access', apexAegis: { supported: true, maturity: 'production', notes: 'MASQUE + QUIC tunnel with dual-path support' }, competitor: { supported: true, maturity: 'production', notes: 'ZPA with app connectors' }, verdict: 'equal' },
        { feature: 'SD-WAN Integration', apexAegis: { supported: true, maturity: 'production', notes: 'Multi-path CDN optimizer with live metrics' }, competitor: { supported: false, maturity: 'none', notes: 'No SD-WAN — requires separate Zscaler SD-WAN license' }, verdict: 'apex-better' },
        { feature: 'Global Backbone (PoPs)', apexAegis: { supported: true, maturity: 'production', notes: 'Singtel partnership — 428 PoPs in 362 cities across 5 regions' }, competitor: { supported: true, maturity: 'production', notes: '150+ data centers — no carrier backbone' }, verdict: 'apex-better' },
        { feature: 'AegisRoute™ Path-Aware Networking', apexAegis: { supported: true, maturity: 'production', notes: 'SCION-based with sovereign ISDs, DRKey auth, zero BGP-hijack risk' }, competitor: { supported: false, maturity: 'none', notes: 'Standard BGP routing — no path awareness or verification' }, verdict: 'apex-better' },
        { feature: 'Attack Path Visualization', apexAegis: { supported: true, maturity: 'production', notes: 'XM Cyber-style with MITRE ATT&CK mapping' }, competitor: { supported: false, maturity: 'none', notes: 'Not available — requires 3rd party' }, verdict: 'apex-better' },
        { feature: 'Microsegmentation', apexAegis: { supported: true, maturity: 'production', notes: 'Guardicore-style segment map with policy enforcement' }, competitor: { supported: false, maturity: 'none', notes: 'Requires Zscaler Workload Segmentation add-on' }, verdict: 'apex-better' },
      ],
      prosCons: [
        { product: 'ApexAegis', pros: ['All-in-one SSE + SD-WAN + microsegmentation', 'Singtel backbone — 428 PoPs in 362 cities, 148 Tbps global capacity', 'AegisRoute™ path-aware networking — cryptographic path verification, sovereign isolation domains, zero BGP-hijack risk', 'MASQUE/QUIC dual-path tunnel over SCION-secured MPLS backbone', 'Lower total cost — no separate add-on licenses', 'Built-in attack path visualization'], cons: ['Expanding rapidly — 428 PoPs operational via Singtel partnership, enterprise adoption accelerating', 'Community growing — backed by Singtel, SCION Association, and MITRE partnerships'] },
        { product: 'Zscaler', pros: ['150+ global data centers', 'Proven at large enterprise scale', 'Strong ZPA for private access', 'Large customer ecosystem'], cons: ['No carrier backbone — relies on co-located DCs, not sovereign infrastructure', 'No path-aware networking — vulnerable to BGP hijacks and route leaks', 'No built-in SD-WAN — separate license', 'Microsegmentation is costly add-on', 'No attack path analysis', 'Agent conflicts when running alongside other SSE'] },
      ],
    },
    'DNS Filtering': {
      comparisons: [
        { feature: 'DNS-Layer Security', apexAegis: { supported: true, maturity: 'production', notes: 'Integrated DNS filter with NRD/NOD blocking' }, competitor: { supported: true, maturity: 'production', notes: 'Umbrella DNS with threat intel' }, verdict: 'equal' },
        { feature: 'Web Filtering', apexAegis: { supported: true, maturity: 'production', notes: 'Full URL categorization + web filter profiles' }, competitor: { supported: true, maturity: 'production', notes: 'URL filtering via proxy' }, verdict: 'equal' },
        { feature: 'Integrated SSL Inspection', apexAegis: { supported: true, maturity: 'production', notes: 'Inline TLS interception in same pipeline' }, competitor: { supported: false, maturity: 'none', notes: 'DNS-only — no SSL inspection' }, verdict: 'apex-better' },
        { feature: 'Endpoint DLP', apexAegis: { supported: true, maturity: 'production', notes: '12 patterns, USB/clipboard monitoring' }, competitor: { supported: false, maturity: 'none', notes: 'No DLP capability' }, verdict: 'apex-better' },
        { feature: 'Global DNS PoP Infrastructure', apexAegis: { supported: true, maturity: 'production', notes: 'Singtel 428 PoPs — DNS resolved at nearest PoP via AegisRoute™' }, competitor: { supported: true, maturity: 'production', notes: 'Umbrella anycast DNS — no carrier backbone' }, verdict: 'apex-better' },
      ],
      prosCons: [
        { product: 'ApexAegis', pros: ['DNS filtering + full SWG + DLP in one agent', 'No port 53 conflict when it is the sole DNS handler', 'Unified policy engine', 'Singtel backbone — DNS resolved at closest of 428 PoPs across 362 cities', 'AegisRoute™ ensures DNS queries never traverse untrusted ASes'], cons: ['DNS intel: accelerated via Farsight DNSDB & DomainTools partnerships — scaling to Umbrella parity'] },
        { product: 'Cisco Umbrella', pros: ['Massive DNS threat intelligence database', 'Simple DNS-only deployment option', 'Strong Cisco ecosystem integration'], cons: ['DNS-only — limited without full proxy', 'No endpoint DLP', 'Port 53 conflict with ApexAegis DNS filter', 'No path-aware networking — DNS queries subject to BGP routing risks'] },
      ],
    },
    'ZTNA & Tunnel': {
      comparisons: [
        { feature: 'VPN / Tunnel', apexAegis: { supported: true, maturity: 'production', notes: 'MASQUE + QUIC tunnel with Wi-Fi/cellular dual-path' }, competitor: { supported: true, maturity: 'production', notes: 'IPSec/SSL VPN with GlobalProtect agent' }, verdict: 'apex-better' },
        { feature: 'ZTNA', apexAegis: { supported: true, maturity: 'production', notes: 'Identity-aware proxy with per-app access' }, competitor: { supported: true, maturity: 'production', notes: 'Prisma Access ZTNA' }, verdict: 'equal' },
        { feature: 'SWG Integration', apexAegis: { supported: true, maturity: 'production', notes: 'Same agent handles SWG + tunnel' }, competitor: { supported: true, maturity: 'production', notes: 'Requires Prisma Access for full SWG' }, verdict: 'apex-better' },
        { feature: 'Dual-Path (Wi-Fi + Cellular)', apexAegis: { supported: true, maturity: 'production', notes: 'MASQUE Connect-IP with bonded tunnel' }, competitor: { supported: false, maturity: 'none', notes: 'Single tunnel only' }, verdict: 'apex-better' },
        { feature: 'AegisRoute™ Path-Aware Backbone', apexAegis: { supported: true, maturity: 'production', notes: 'SCION over MPLS — Singtel 428 PoPs, cryptographic path verification, sovereign ISDs' }, competitor: { supported: false, maturity: 'none', notes: 'Standard BGP routing — no path awareness or sovereign isolation' }, verdict: 'apex-better' },
        { feature: 'Carrier-Grade PoP Infrastructure', apexAegis: { supported: true, maturity: 'production', notes: '362 cities, 148 Tbps capacity, 46 MPLS rings via Singtel partnership' }, competitor: { supported: true, maturity: 'production', notes: 'Palo Alto cloud — co-located DCs, no carrier backbone ownership' }, verdict: 'apex-better' },
      ],
      prosCons: [
        { product: 'ApexAegis', pros: ['Modern MASQUE/QUIC tunnel protocol', 'Dual-path bonding (Wi-Fi + cellular)', 'Integrated SWG — no split-tunnel needed', 'Lower MTU overhead with QUIC', 'AegisRoute™ — path-aware networking with cryptographic path verification over Singtel MPLS backbone', 'Singtel partnership — 428 PoPs in 362 cities, tunnels route over sovereign SCION isolation domains', 'Zero BGP-hijack risk — every hop cryptographically validated, no hidden transit ASes'], cons: ['Newer protocol — rapidly proven via Singtel global deployment'] },
        { product: 'Palo Alto GlobalProtect', pros: ['Proven IPSec VPN at enterprise scale', 'Strong Prisma SASE ecosystem', 'HIP-based device posture checks'], cons: ['Legacy IPSec — higher overhead', 'No dual-path bonding', 'Routing table conflicts with other agents', 'Separate Prisma license for full SSE', 'No carrier backbone — relies on public internet with BGP routing vulnerabilities', 'No path-aware networking — traffic can traverse untrusted or hostile ASes'] },
      ],
    },
    'Endpoint DLP': {
      comparisons: [
        { feature: 'Content Pattern Matching', apexAegis: { supported: true, maturity: 'production', notes: '12 regex patterns — SSN, CC, API keys, PHI, etc.' }, competitor: { supported: true, maturity: 'production', notes: 'Extensive pattern library with fingerprinting' }, verdict: 'competitor-better' },
        { feature: 'Clipboard Monitoring', apexAegis: { supported: true, maturity: 'production', notes: 'Real-time clipboard inspection' }, competitor: { supported: true, maturity: 'production', notes: 'Full clipboard DLP' }, verdict: 'equal' },
        { feature: 'USB/Removable Media', apexAegis: { supported: true, maturity: 'production', notes: 'USB insert/copy detection and blocking' }, competitor: { supported: true, maturity: 'production', notes: 'Full removable media control' }, verdict: 'equal' },
        { feature: 'Network DLP (Inline)', apexAegis: { supported: true, maturity: 'production', notes: 'Integrated into SWG inspection pipeline' }, competitor: { supported: true, maturity: 'limited', notes: 'Network DLP via separate Symantec module' }, verdict: 'apex-better' },
        { feature: 'Unified SWG+DLP', apexAegis: { supported: true, maturity: 'production', notes: 'Single agent — no separate DLP deployment' }, competitor: { supported: false, maturity: 'none', notes: 'Standalone DLP agent — no SWG' }, verdict: 'apex-better' },
      ],
      prosCons: [
        { product: 'ApexAegis', pros: ['DLP integrated into SSE pipeline — no extra agent', 'Network + endpoint DLP in unified policy', '8 inspection channels including screen capture & print'], cons: ['Pattern library: expanding via VirusTotal Enterprise partnership for EDM/IDM', 'Document fingerprinting: planned via Opswat MetaDefender (deep CDR + hash fingerprinting) integration'] },
        { product: 'Symantec DLP', pros: ['Extensive pattern library with fingerprinting', 'Mature OCR and exact data matching', 'Granular policy with incident workflows'], cons: ['Standalone agent — additional deployment burden', 'No SWG/SSL integration', 'Legacy architecture — high memory usage', 'Broadcom acquisition uncertainty'] },
      ],
    },
    'ATP Profiles': {
      comparisons: [
        { feature: 'Malware Scanning', apexAegis: { supported: true, maturity: 'production', notes: 'Cloud-based ATP scan engine' }, competitor: { supported: true, maturity: 'production', notes: 'Legacy signature-based (unresponsive)' }, verdict: 'apex-better' },
      ],
      prosCons: [
        { product: 'ApexAegis', pros: ['Active, cloud-updated threat engine', 'Integrated with SWG pipeline'], cons: [] },
        { product: 'McAfee ePO', pros: ['Established enterprise management console'], cons: ['Agent unresponsive — not actively protecting', 'Legacy signature-only detection', 'No cloud threat intelligence'] },
      ],
    },
    'SWG & CASB & DLP': {
      comparisons: [
        { feature: 'Secure Web Gateway', apexAegis: { supported: true, maturity: 'production', notes: 'Full SWG with policy engine' }, competitor: { supported: true, maturity: 'production', notes: 'Cloud SWG with NewEdge network' }, verdict: 'equal' },
        { feature: 'CASB', apexAegis: { supported: true, maturity: 'production', notes: 'Cloud app visibility & control' }, competitor: { supported: true, maturity: 'production', notes: 'Industry-leading CASB with app risk scores' }, verdict: 'competitor-better' },
        { feature: 'DLP', apexAegis: { supported: true, maturity: 'production', notes: 'Endpoint + network DLP unified' }, competitor: { supported: true, maturity: 'production', notes: 'Advanced DLP with ML classification' }, verdict: 'equal' },
        { feature: 'SD-WAN', apexAegis: { supported: true, maturity: 'production', notes: 'Multi-path CDN optimizer' }, competitor: { supported: false, maturity: 'none', notes: 'No SD-WAN capability' }, verdict: 'apex-better' },
        { feature: 'Tunnel (MASQUE/QUIC)', apexAegis: { supported: true, maturity: 'production', notes: 'Modern dual-path tunnel over SCION backbone' }, competitor: { supported: true, maturity: 'production', notes: 'GRE/IPSec tunnel' }, verdict: 'apex-better' },
        { feature: 'AegisRoute™ / Carrier Backbone', apexAegis: { supported: true, maturity: 'production', notes: 'Singtel 428 PoPs, 362 cities — SCION over MPLS with sovereign ISDs' }, competitor: { supported: false, maturity: 'none', notes: 'NewEdge co-lo DCs — no carrier backbone or path-aware networking' }, verdict: 'apex-better' },
      ],
      prosCons: [
        { product: 'ApexAegis', pros: ['All-in-one SSE + SD-WAN', 'Singtel partnership — 428 PoPs in 362 cities, 148 Tbps backbone capacity', 'AegisRoute™ path-aware networking — built from scratch on SCION, cryptographic path verification, sovereign isolation domains', 'Modern QUIC/MASQUE tunnel over SCION-secured MPLS backbone', 'Microsegmentation + attack paths built-in', 'Single license covers all features', 'Post-quantum encryption ready (CRYSTALS-Kyber) on AegisRoute™ sovereign ring'], cons: ['CASB catalog: accelerated via Cloud Security Alliance STAR registry + CSA STAR catalog partnership (40k+ apps)', 'Newer in market — rapidly scaling via Singtel global infrastructure with 428 PoPs operational'] },
        { product: 'Netskope', pros: ['Industry-leading CASB with 40k+ app catalog', 'Advanced ML-based DLP classification', 'Strong analyst positioning (Gartner Leader)'], cons: ['No carrier backbone — NewEdge is co-located DCs, not sovereign infrastructure', 'No path-aware networking — vulnerable to BGP hijacks and AS-path manipulation', 'No SD-WAN — requires partner integration', 'No microsegmentation', 'Legacy tunnel protocol', 'Higher per-user cost for full bundle'] },
      ],
    },
    'Web Filter': {
      comparisons: [
        { feature: 'Web Filtering', apexAegis: { supported: true, maturity: 'production', notes: 'URL categorization with custom categories' }, competitor: { supported: true, maturity: 'production', notes: 'Legacy web filter (unresponsive agent)' }, verdict: 'apex-better' },
      ],
      prosCons: [
        { product: 'ApexAegis', pros: ['Active, integrated web filter', 'Part of unified SWG pipeline'], cons: [] },
        { product: 'Forcepoint', pros: ['Established URL database'], cons: ['Agent unresponsive — orphaned installation', 'Legacy architecture', 'No longer actively filtering'] },
      ],
    },
  };

  return comparisons[app.duplicatesFeature] || null;
}

/* ─── Style helpers ─────────────────────────────────────────── */
const riskColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  none: 'bg-gray-500',
};
const riskBadge: Record<string, string> = {
  critical: 'bg-red-900/40 text-red-400 border-red-700',
  high: 'bg-orange-900/40 text-orange-400 border-orange-700',
  medium: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
  low: 'bg-blue-900/40 text-blue-400 border-blue-700',
  none: 'bg-gray-800 text-gray-400 border-gray-700',
};
const statusBadge: Record<string, string> = {
  active: 'bg-green-900/40 text-green-400 border-green-700',
  idle: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
  unresponsive: 'bg-red-900/40 text-red-400 border-red-700',
};
const verdictIcon = (v: string) =>
  v === 'apex-better' ? <Zap size={12} className="text-green-400" />
  : v === 'competitor-better' ? <AlertTriangle size={12} className="text-yellow-400" />
  : <CheckCircle2 size={12} className="text-gray-400" />;
const verdictLabel = (v: string) =>
  v === 'apex-better' ? 'ApexAegis wins' : v === 'competitor-better' ? 'Competitor advantage' : 'Comparable';

/* ═══════════════════════════════════════════════════════════════
   GHOSTED APPS PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function GhostedAppsPage() {
  const [apps, setApps] = useState(GHOSTED_APPS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [scanning, setScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(apps.map(a => a.category))], [apps]);
  const filtered = useMemo(() => apps.filter(a => {
    const matchSearch = !searchQuery ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'all' || a.category === categoryFilter;
    const matchRisk = riskFilter === 'all' || a.riskLevel === riskFilter;
    return matchSearch && matchCat && matchRisk;
  }), [apps, searchQuery, categoryFilter, riskFilter]);

  const overlapping = apps.filter(a => a.duplicatesFeature);
  const totalCpu = apps.reduce((s, a) => s + a.resourceUsage.cpuPct, 0);
  const totalMem = apps.reduce((s, a) => s + a.resourceUsage.memMb, 0);

  const handleRescan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/v1/ghosted-apps/rescan', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.agents) setApps(data.agents);
      }
    } catch {
      // Offline demo fallback — jitter existing data
      setApps(prev => prev.map(a => ({
        ...a,
        lastSeen: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        status: (['active', 'active', 'active', 'idle', 'unresponsive'] as const)[Math.floor(Math.random() * 5)],
        resourceUsage: {
          cpuPct: Math.round((Math.random() * 7 + 0.5) * 10) / 10,
          memMb: Math.floor(Math.random() * 300) + 50,
        },
      })));
    } finally {
      setScanning(false);
      setLastScanTime(new Date().toLocaleTimeString());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ghost size={24} className="text-purple-400" />
          <div>
            <h1 className="text-xl font-semibold">Ghosted Apps &amp; Services</h1>
            <p className="text-sm text-gray-500">Detect duplicate/overlapping agents on managed hosts with feature-level comparison</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastScanTime && <span className="text-xs text-gray-500">Last scan: {lastScanTime}</span>}
          <button
            onClick={handleRescan}
            disabled={scanning}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
              scanning ? 'bg-blue-900/30 text-blue-400 border border-blue-800 cursor-wait' : 'bg-gray-800 hover:bg-gray-700'
            )}
          >
            <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning...' : 'Rescan Hosts'}
          </button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3">
        {[
          { label: 'Detected', value: apps.length, color: 'bg-gray-800 text-gray-300' },
          { label: 'Overlapping', value: overlapping.length, color: 'bg-orange-900/30 text-orange-400' },
          { label: 'High Risk', value: apps.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length, color: 'bg-red-900/30 text-red-400' },
          { label: 'Ghost CPU', value: `${totalCpu.toFixed(1)}%`, color: 'bg-purple-900/30 text-purple-400' },
          { label: 'Ghost Memory', value: `${(totalMem / 1024).toFixed(1)} GB`, color: 'bg-blue-900/30 text-blue-400' },
        ].map(c => (
          <div key={c.label} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${c.color}`}>
            {c.label}: {c.value}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search app or vendor..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm appearance-none focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={riskFilter}
          onChange={e => setRiskFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm appearance-none focus:outline-none"
        >
          <option value="all">All Risk Levels</option>
          {['critical','high','medium','low','none'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>

      {/* App list */}
      <div className="space-y-3">
        {filtered.map(app => {
          const expanded = expandedId === app.id;
          const comparison = getComparison(app);

          return (
            <div key={app.id} className={clsx(
              'bg-gray-900 border rounded-xl overflow-hidden transition-colors',
              app.riskLevel === 'high' ? 'border-orange-800/40' : app.riskLevel === 'critical' ? 'border-red-800/40' : 'border-gray-800'
            )}>
              {/* Row */}
              <button onClick={() => setExpandedId(expanded ? null : app.id)} className="w-full flex items-center gap-3 p-4 text-left">
                <span className={`w-2 h-2 rounded-full shrink-0 ${riskColors[app.riskLevel]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">{app.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] border ${statusBadge[app.status]}`}>{app.status.toUpperCase()}</span>
                    {app.duplicatesFeature && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-orange-900/30 text-orange-400 border border-orange-700">
                        OVERLAPS: {app.duplicatesFeature}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{app.vendor} · v{app.version} · {app.detectedOn.length} host(s) · Ports: {app.listenPorts.join(', ')}</div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs">
                  <span className="text-gray-500">CPU <span className="text-gray-300 font-mono">{app.resourceUsage.cpuPct}%</span></span>
                  <span className="text-gray-500">Mem <span className="text-gray-300 font-mono">{app.resourceUsage.memMb} MB</span></span>
                  <span className={`px-2 py-0.5 rounded text-[10px] border ${riskBadge[app.riskLevel]}`}>{app.riskLevel.toUpperCase()}</span>
                </div>
                {expanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
              </button>

              {/* Expanded detail */}
              {expanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-800">
                  {/* Description & hosts */}
                  <div className="grid grid-cols-2 gap-4 pt-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase text-gray-500 mb-1">Description</div>
                      <p className="text-xs text-gray-400">{app.description}</p>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase text-gray-500 mb-1">Detected On</div>
                      <div className="flex flex-wrap gap-1">
                        {app.detectedOn.map(h => (
                          <span key={h} className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-400">{h}</span>
                        ))}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-1">Last seen: {app.lastSeen}</div>
                    </div>
                  </div>

                  {/* Feature comparison */}
                  {comparison && (
                    <div className="space-y-4">
                      <div className="text-[10px] font-semibold uppercase text-gray-500">Feature-Level Comparison: ApexAegis vs {app.name}</div>
                      <div className="bg-gray-800/40 rounded-lg border border-gray-700/60 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-700/50 text-[10px] uppercase text-gray-500 tracking-wider">
                              <th className="px-3 py-2 text-left">Feature</th>
                              <th className="px-3 py-2 text-center">
                                <span className="text-blue-400">ApexAegis</span>
                              </th>
                              <th className="px-3 py-2 text-center">
                                <span className="text-orange-400">{app.vendor}</span>
                              </th>
                              <th className="px-3 py-2 text-center">Verdict</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700/30">
                            {comparison.comparisons.map(c => (
                              <tr key={c.feature} className="hover:bg-gray-800/30">
                                <td className="px-3 py-2 text-gray-300 font-medium">{c.feature}</td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex flex-col items-center gap-0.5">
                                    {c.apexAegis.supported
                                      ? <CheckCircle2 size={12} className="text-green-400" />
                                      : <XCircle size={12} className="text-gray-600" />
                                    }
                                    <span className={`text-[9px] ${c.apexAegis.maturity === 'production' ? 'text-green-500' : c.apexAegis.maturity === 'beta' ? 'text-yellow-500' : 'text-gray-600'}`}>
                                      {c.apexAegis.maturity}
                                    </span>
                                    <span className="text-[9px] text-gray-500 max-w-[140px]">{c.apexAegis.notes}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex flex-col items-center gap-0.5">
                                    {c.competitor.supported
                                      ? <CheckCircle2 size={12} className="text-green-400" />
                                      : <XCircle size={12} className="text-gray-600" />
                                    }
                                    <span className={`text-[9px] ${c.competitor.maturity === 'production' ? 'text-green-500' : c.competitor.maturity === 'beta' ? 'text-yellow-500' : 'text-gray-600'}`}>
                                      {c.competitor.maturity}
                                    </span>
                                    <span className="text-[9px] text-gray-500 max-w-[140px]">{c.competitor.notes}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex flex-col items-center gap-0.5">
                                    {verdictIcon(c.verdict)}
                                    <span className="text-[9px] text-gray-500">{verdictLabel(c.verdict)}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pros & Cons */}
                      <div className="grid grid-cols-2 gap-3">
                        {comparison.prosCons.map(pc => (
                          <div key={pc.product} className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3">
                            <div className="text-[11px] font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
                              {pc.product === 'ApexAegis' ? <Shield size={12} className="text-blue-400" /> : <Globe size={12} className="text-orange-400" />}
                              {pc.product}
                            </div>
                            {pc.pros.length > 0 && (
                              <div className="mb-2">
                                <div className="text-[9px] uppercase text-green-500 font-semibold mb-1">Pros</div>
                                {pc.pros.map((p, i) => (
                                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-400 mb-0.5">
                                    <CheckCircle2 size={9} className="text-green-500 mt-0.5 shrink-0" />
                                    {p}
                                  </div>
                                ))}
                              </div>
                            )}
                            {pc.cons.length > 0 && (
                              <div>
                                <div className="text-[9px] uppercase text-red-500 font-semibold mb-1">Cons</div>
                                {pc.cons.map((c, i) => (
                                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-400 mb-0.5">
                                    <XCircle size={9} className="text-red-500 mt-0.5 shrink-0" />
                                    {c}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Recommendation */}
                      <div className="flex items-start gap-2 p-3 bg-blue-900/15 border border-blue-700/30 rounded-lg">
                        <Zap size={14} className="text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-blue-300 text-[11px] font-medium">Recommendation: </span>
                          <span className="text-blue-200/70 text-[11px]">
                            {app.status === 'unresponsive'
                              ? `${app.name} is unresponsive and can be safely removed. ApexAegis fully covers its capabilities.`
                              : app.riskLevel === 'high'
                              ? `Running ${app.name} alongside ApexAegis causes conflicts. Consider migrating to ApexAegis-only and removing this agent.`
                              : `${app.name} has partial overlap. Evaluate the feature comparison above to decide if consolidation is beneficial.`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No overlap */}
                  {!comparison && (
                    <div className="flex items-start gap-2 p-3 bg-gray-800/30 border border-gray-700/40 rounded-lg">
                      <CheckCircle2 size={14} className="text-green-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-green-300 text-[11px] font-medium">No Feature Overlap: </span>
                        <span className="text-gray-400 text-[11px]">
                          {app.name} provides complementary capabilities not duplicated by ApexAegis. Safe to keep running.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
