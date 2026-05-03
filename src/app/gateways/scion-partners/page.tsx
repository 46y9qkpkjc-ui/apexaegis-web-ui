'use client';
import { useState } from 'react';
import {
  Globe, Shield, Lock, Server, CheckCircle, Clock, ArrowRightLeft,
  Network, Zap, Building2, CreditCard, Handshake, Plus, X,
  AlertTriangle, Activity, Layers, Router, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────────── */
interface PartnerOrg {
  id: string;
  name: string;
  type: 'bank' | 'payment-network' | 'financial-institution' | 'fintech';
  logo: string; // emoji placeholder
  isdNumber: number;
  peeringStatus: 'active' | 'negotiating' | 'pending-cert' | 'offline';
  trustLevel: 'mutual-tls' | 'pki-cross-signed' | 'drkey-established';
  encryptionSuite: string;
  scionDevices: number;
  throughputGbps: number;
  latencyMs: number;
  peeredSince: string | null;
  contactEmail: string;
  region: string;
  complianceFrameworks: string[];
}

interface IsdNeighborhood {
  from: number;
  fromLabel: string;
  to: number;
  toLabel: string;
  status: 'established' | 'negotiating' | 'planned';
  linkType: 'core' | 'peering' | 'provider-customer';
  bandwidth: string;
  latency: string;
  encryption: string;
}

/* ─── Demo data ─────────────────────────────────────────────── */
const partners: PartnerOrg[] = [
  {
    id: 'p-1', name: 'Mastercard International', type: 'payment-network', logo: '💳',
    isdNumber: 100, peeringStatus: 'active', trustLevel: 'drkey-established',
    encryptionSuite: 'CRYSTALS-Kyber-1024 + AES-256-GCM', scionDevices: 48,
    throughputGbps: 40, latencyMs: 1.2, peeredSince: '2025-09-15', contactEmail: 'scion-peering@mastercard.com',
    region: 'Global (US-EU-APAC)', complianceFrameworks: ['PCI-DSS 4.0', 'SOC 2 Type II', 'ISO 27001'],
  },
  {
    id: 'p-2', name: 'Visa Inc.', type: 'payment-network', logo: '💎',
    isdNumber: 101, peeringStatus: 'active', trustLevel: 'drkey-established',
    encryptionSuite: 'CRYSTALS-Kyber-1024 + AES-256-GCM', scionDevices: 52,
    throughputGbps: 50, latencyMs: 0.9, peeredSince: '2025-10-01', contactEmail: 'network-ops@visa.com',
    region: 'Global (US-EU-APAC-LATAM)', complianceFrameworks: ['PCI-DSS 4.0', 'SOC 2 Type II', 'ISO 27001', 'NIST 800-53'],
  },
  {
    id: 'p-3', name: 'American Express', type: 'payment-network', logo: '🏛️',
    isdNumber: 102, peeringStatus: 'active', trustLevel: 'mutual-tls',
    encryptionSuite: 'X25519 + ChaCha20-Poly1305', scionDevices: 24,
    throughputGbps: 20, latencyMs: 2.1, peeredSince: '2025-12-01', contactEmail: 'infosec@amex.com',
    region: 'US-EU', complianceFrameworks: ['PCI-DSS 4.0', 'SOC 2 Type II'],
  },
  {
    id: 'p-4', name: 'JPMorgan Chase', type: 'bank', logo: '🏦',
    isdNumber: 200, peeringStatus: 'active', trustLevel: 'drkey-established',
    encryptionSuite: 'CRYSTALS-Kyber-1024 + AES-256-GCM', scionDevices: 36,
    throughputGbps: 25, latencyMs: 1.8, peeredSince: '2026-01-10', contactEmail: 'ciso-office@jpmorgan.com',
    region: 'US-EU-APAC', complianceFrameworks: ['PCI-DSS 4.0', 'SOC 2 Type II', 'FFIEC', 'NYDFS 500'],
  },
  {
    id: 'p-5', name: 'HSBC Holdings', type: 'bank', logo: '🌐',
    isdNumber: 201, peeringStatus: 'active', trustLevel: 'pki-cross-signed',
    encryptionSuite: 'X25519 + AES-256-GCM', scionDevices: 30,
    throughputGbps: 18, latencyMs: 3.2, peeredSince: '2026-02-01', contactEmail: 'cyber-defence@hsbc.com',
    region: 'EU-APAC-MEA', complianceFrameworks: ['PCI-DSS 4.0', 'ISO 27001', 'MAS TRM'],
  },
  {
    id: 'p-6', name: 'DBS Bank', type: 'bank', logo: '🔷',
    isdNumber: 202, peeringStatus: 'negotiating', trustLevel: 'mutual-tls',
    encryptionSuite: 'CRYSTALS-Kyber-768 + AES-256-GCM', scionDevices: 12,
    throughputGbps: 10, latencyMs: 4.5, peeredSince: null, contactEmail: 'network-eng@dbs.com',
    region: 'APAC', complianceFrameworks: ['MAS TRM', 'ISO 27001'],
  },
  {
    id: 'p-7', name: 'Stripe Inc.', type: 'fintech', logo: '⚡',
    isdNumber: 300, peeringStatus: 'pending-cert', trustLevel: 'mutual-tls',
    encryptionSuite: 'X25519 + ChaCha20-Poly1305', scionDevices: 8,
    throughputGbps: 5, latencyMs: 6.0, peeredSince: null, contactEmail: 'security@stripe.com',
    region: 'US-EU', complianceFrameworks: ['PCI-DSS 4.0', 'SOC 2 Type II'],
  },
  {
    id: 'p-8', name: 'Deutsche Bank', type: 'bank', logo: '🏛️',
    isdNumber: 203, peeringStatus: 'negotiating', trustLevel: 'mutual-tls',
    encryptionSuite: 'CRYSTALS-Kyber-1024 + AES-256-GCM', scionDevices: 18,
    throughputGbps: 15, latencyMs: 2.8, peeredSince: null, contactEmail: 'cto-office@db.com',
    region: 'EU', complianceFrameworks: ['PCI-DSS 4.0', 'BaFin BAIT', 'ISO 27001'],
  },
];

const isdNeighborhoods: IsdNeighborhood[] = [
  { from: 1, fromLabel: 'ApexAegis Core (ISD-1)', to: 100, toLabel: 'Mastercard (ISD-100)', status: 'established', linkType: 'core', bandwidth: '40 Gbps', latency: '1.2 ms', encryption: 'DRKey + CRYSTALS-Kyber-1024' },
  { from: 1, fromLabel: 'ApexAegis Core (ISD-1)', to: 101, toLabel: 'Visa (ISD-101)', status: 'established', linkType: 'core', bandwidth: '50 Gbps', latency: '0.9 ms', encryption: 'DRKey + CRYSTALS-Kyber-1024' },
  { from: 1, fromLabel: 'ApexAegis Core (ISD-1)', to: 102, toLabel: 'AmEx (ISD-102)', status: 'established', linkType: 'peering', bandwidth: '20 Gbps', latency: '2.1 ms', encryption: 'mTLS + X25519' },
  { from: 1, fromLabel: 'ApexAegis Core (ISD-1)', to: 200, toLabel: 'JPMorgan (ISD-200)', status: 'established', linkType: 'provider-customer', bandwidth: '25 Gbps', latency: '1.8 ms', encryption: 'DRKey + CRYSTALS-Kyber-1024' },
  { from: 1, fromLabel: 'ApexAegis Core (ISD-1)', to: 201, toLabel: 'HSBC (ISD-201)', status: 'established', linkType: 'peering', bandwidth: '18 Gbps', latency: '3.2 ms', encryption: 'PKI Cross-Sign + X25519' },
  { from: 100, fromLabel: 'Mastercard (ISD-100)', to: 200, toLabel: 'JPMorgan (ISD-200)', status: 'established', linkType: 'peering', bandwidth: '10 Gbps', latency: '2.0 ms', encryption: 'DRKey + AES-256-GCM' },
  { from: 101, fromLabel: 'Visa (ISD-101)', to: 200, toLabel: 'JPMorgan (ISD-200)', status: 'established', linkType: 'peering', bandwidth: '10 Gbps', latency: '1.5 ms', encryption: 'DRKey + AES-256-GCM' },
  { from: 1, fromLabel: 'ApexAegis Core (ISD-1)', to: 202, toLabel: 'DBS Bank (ISD-202)', status: 'negotiating', linkType: 'provider-customer', bandwidth: '10 Gbps', latency: '4.5 ms', encryption: 'Pending DRKey exchange' },
  { from: 1, fromLabel: 'ApexAegis Core (ISD-1)', to: 300, toLabel: 'Stripe (ISD-300)', status: 'negotiating', linkType: 'provider-customer', bandwidth: '5 Gbps', latency: '6.0 ms', encryption: 'Pending certificate issuance' },
  { from: 1, fromLabel: 'ApexAegis Core (ISD-1)', to: 203, toLabel: 'Deutsche Bank (ISD-203)', status: 'planned', linkType: 'peering', bandwidth: '15 Gbps (planned)', latency: 'TBD', encryption: 'CRYSTALS-Kyber-1024 (planned)' },
];

const statusColors: Record<string, string> = {
  active: 'bg-green-900/40 text-green-400 border-green-800',
  negotiating: 'bg-amber-900/40 text-amber-400 border-amber-800',
  'pending-cert': 'bg-blue-900/40 text-blue-400 border-blue-800',
  offline: 'bg-red-900/40 text-red-400 border-red-800',
  established: 'bg-green-900/40 text-green-400 border-green-800',
  planned: 'bg-gray-800 text-gray-400 border-gray-700',
};

const trustBadge: Record<string, { label: string; color: string }> = {
  'drkey-established': { label: 'DRKey Established', color: 'bg-emerald-900/30 text-emerald-400 border-emerald-800' },
  'mutual-tls': { label: 'Mutual TLS', color: 'bg-blue-900/30 text-blue-400 border-blue-800' },
  'pki-cross-signed': { label: 'PKI Cross-Signed', color: 'bg-purple-900/30 text-purple-400 border-purple-800' },
};

const linkTypeLabel: Record<string, string> = {
  core: 'Core Link',
  peering: 'Peering Link',
  'provider-customer': 'Provider → Customer',
};

/* ─── Component ─────────────────────────────────────────────── */
export default function ScionPartnersPage() {
  const [activeTab, setActiveTab] = useState<'partners' | 'isd-topology' | 'trust-chain' | 'onboarding'>('partners');
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerType, setNewPartnerType] = useState<'bank' | 'payment-network' | 'financial-institution' | 'fintech'>('bank');

  const activePartners = partners.filter(p => p.peeringStatus === 'active').length;
  const totalDevices = partners.reduce((s, p) => s + p.scionDevices, 0);
  const totalThroughput = partners.filter(p => p.peeringStatus === 'active').reduce((s, p) => s + p.throughputGbps, 0);
  const avgLatency = partners.filter(p => p.peeringStatus === 'active').length > 0
    ? (partners.filter(p => p.peeringStatus === 'active').reduce((s, p) => s + p.latencyMs, 0) / partners.filter(p => p.peeringStatus === 'active').length).toFixed(1)
    : '—';

  const handleOnboard = () => {
    if (!newPartnerName) return;
    toast.success(`Onboarding initiated for ${newPartnerName} — ISD allocation pending`);
    setShowOnboardModal(false);
    setNewPartnerName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Handshake size={24} className="text-cyan-400" />
          <div>
            <h1 className="text-xl font-semibold">SCION + IP Gateway Partner Program</h1>
            <p className="text-sm text-gray-500">
              AegisRoute™ partner gateway for banks, payment networks & financial institutions — 
              sell SCION + IP gateways to partners, establish ISD neighbourships & high-performance encryption
            </p>
          </div>
        </div>
        <button onClick={() => setShowOnboardModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Onboard Partner
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Partner Organizations', value: partners.length, icon: Building2, color: 'text-cyan-400' },
          { label: 'Active Peerings', value: activePartners, icon: CheckCircle, color: 'text-green-400' },
          { label: 'SCION Devices', value: totalDevices, icon: Router, color: 'text-blue-400' },
          { label: 'Total Throughput', value: `${totalThroughput} Gbps`, icon: Zap, color: 'text-amber-400' },
          { label: 'Avg Latency', value: `${avgLatency} ms`, icon: Activity, color: 'text-purple-400' },
          { label: 'ISD Neighbourhoods', value: isdNeighborhoods.filter(n => n.status === 'established').length, icon: Network, color: 'text-emerald-400' },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <k.icon size={14} className={k.color} />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">{k.label}</span>
            </div>
            <span className="text-lg font-semibold">{k.value}</span>
          </div>
        ))}
      </div>

      {/* How It Works Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-gray-900 to-amber-950/30 border border-cyan-800/30 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-cyan-400 mb-3">AegisRoute™ Partner Model — SCION + IP Gateway for Financial Sector</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-medium"><CreditCard size={14} /> 1. Sell to Partners</div>
            <p className="text-gray-400">ApexAegis sells SCION + IP gateway appliances (physical or virtual) to banks and payment networks on behalf of financial sector partners.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-400 font-medium"><Network size={14} /> 2. Establish ISD</div>
            <p className="text-gray-400">Each partner receives a dedicated SCION Isolation Security Domain (ISD). ISD neighbourship is established between ApexAegis core and partner domain.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-green-400 font-medium"><Shield size={14} /> 3. Build Trust</div>
            <p className="text-gray-400">Trust is established via DRKey-based session keys, PKI cross-signing, or mTLS — mutual authentication between both entities with cryptographic attestation.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-400 font-medium"><Lock size={14} /> 4. Encrypt & Route</div>
            <p className="text-gray-400">High-performance post-quantum encryption (CRYSTALS-Kyber-1024) tunnels between ApexAegis cloud and partner SCION devices with path-aware routing.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-800/50 rounded-lg border border-gray-700/50 w-fit overflow-x-auto">
        {[
          { key: 'partners' as const, label: 'Partner Organizations', icon: Building2 },
          { key: 'isd-topology' as const, label: 'ISD Neighbourhood Topology', icon: Network },
          { key: 'trust-chain' as const, label: 'Trust & Encryption', icon: Shield },
          { key: 'onboarding' as const, label: 'Onboarding Pipeline', icon: Layers },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ PARTNERS TAB ═══ */}
      {activeTab === 'partners' && (
        <div className="space-y-3">
          {partners.map(partner => (
            <div key={partner.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{partner.logo}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{partner.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${statusColors[partner.peeringStatus]}`}>
                        {partner.peeringStatus === 'pending-cert' ? 'PENDING CERT' : partner.peeringStatus.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${trustBadge[partner.trustLevel].color}`}>
                        {trustBadge[partner.trustLevel].label}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 border border-gray-700">
                        {partner.type === 'payment-network' ? 'Payment Network' : partner.type === 'financial-institution' ? 'Financial Institution' : partner.type === 'fintech' ? 'Fintech' : 'Bank'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">ISD-{partner.isdNumber} · {partner.region}</p>
                  </div>
                </div>
                <button onClick={() => setExpandedPartner(expandedPartner === partner.id ? null : partner.id)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors">
                  {expandedPartner === partner.id ? 'Collapse' : 'Details'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                <div className="p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="text-gray-500 mb-1">SCION Devices</div>
                  <span className="text-gray-200 font-semibold text-sm">{partner.scionDevices}</span>
                </div>
                <div className="p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="text-gray-500 mb-1">Throughput</div>
                  <span className="text-gray-200 font-semibold text-sm">{partner.throughputGbps} Gbps</span>
                </div>
                <div className="p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="text-gray-500 mb-1">Latency</div>
                  <span className="text-gray-200 font-semibold text-sm">{partner.latencyMs} ms</span>
                </div>
                <div className="p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="text-gray-500 mb-1">Encryption Suite</div>
                  <span className="text-gray-300 text-[10px]">{partner.encryptionSuite}</span>
                </div>
                <div className="p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="text-gray-500 mb-1">Peered Since</div>
                  <span className="text-gray-300">{partner.peeredSince ?? 'In Progress'}</span>
                </div>
              </div>

              {expandedPartner === partner.id && (
                <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
                  <div className="p-2.5 bg-gray-800/30 rounded-lg">
                    <div className="text-[10px] text-gray-500 mb-1">Compliance Frameworks</div>
                    <div className="flex flex-wrap gap-1">
                      {partner.complianceFrameworks.map(f => (
                        <span key={f} className="px-2 py-0.5 rounded bg-indigo-900/20 text-indigo-300 text-[10px] border border-indigo-800/50">{f}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-gray-800/30 rounded-lg">
                      <span className="text-gray-500">Contact:</span> <span className="text-gray-300">{partner.contactEmail}</span>
                    </div>
                    <div className="p-2.5 bg-gray-800/30 rounded-lg">
                      <span className="text-gray-500">Coverage:</span> <span className="text-gray-300">{partner.region}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ ISD TOPOLOGY TAB ═══ */}
      {activeTab === 'isd-topology' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Network size={16} className="text-cyan-400" /> ISD Neighbourhood Map</h3>
            
            {/* Visual topology */}
            <div className="relative bg-gray-950/50 rounded-xl border border-gray-800 p-8 mb-6">
              {/* Center node */}
              <div className="flex flex-col items-center">
                <div className="px-6 py-3 bg-cyan-900/40 border-2 border-cyan-500 rounded-xl text-center mb-8 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                  <div className="text-xs font-bold text-cyan-400">ISD-1</div>
                  <div className="text-sm font-semibold">ApexAegis Core</div>
                  <div className="text-[10px] text-gray-500">AegisRoute™ Sovereign Ring</div>
                </div>

                {/* Connected ISDs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  {partners.map(p => (
                    <div key={p.id} className={`p-3 rounded-lg border text-center ${
                      p.peeringStatus === 'active' ? 'bg-green-950/20 border-green-800/50' :
                      p.peeringStatus === 'negotiating' ? 'bg-amber-950/20 border-amber-800/50' :
                      'bg-gray-800/30 border-gray-700'
                    }`}>
                      <div className="text-lg mb-1">{p.logo}</div>
                      <div className="text-[10px] font-bold text-gray-400">ISD-{p.isdNumber}</div>
                      <div className="text-xs font-medium text-gray-200">{p.name.split(' ')[0]}</div>
                      <div className={`mt-1 text-[9px] ${p.peeringStatus === 'active' ? 'text-green-400' : p.peeringStatus === 'negotiating' ? 'text-amber-400' : 'text-gray-500'}`}>
                        {p.peeringStatus === 'active' ? '● Connected' : p.peeringStatus === 'negotiating' ? '◌ Negotiating' : '○ Pending'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Neighbourhood table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">From</th>
                  <th className="px-4 py-3 text-center">Link</th>
                  <th className="px-4 py-3 text-left">To</th>
                  <th className="px-4 py-3 text-left">Link Type</th>
                  <th className="px-4 py-3 text-center">Bandwidth</th>
                  <th className="px-4 py-3 text-center">Latency</th>
                  <th className="px-4 py-3 text-left">Encryption</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {isdNeighborhoods.map((n, i) => (
                  <tr key={i} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-xs font-medium">{n.fromLabel}</td>
                    <td className="px-4 py-3 text-center"><ArrowRightLeft size={14} className="text-gray-600 mx-auto" /></td>
                    <td className="px-4 py-3 text-xs font-medium">{n.toLabel}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px] border border-gray-700">{linkTypeLabel[n.linkType]}</span></td>
                    <td className="px-4 py-3 text-center text-xs text-gray-300">{n.bandwidth}</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-300">{n.latency}</td>
                    <td className="px-4 py-3 text-[10px] text-gray-300">{n.encryption}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded text-[10px] border ${statusColors[n.status]}`}>{n.status.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ TRUST & ENCRYPTION TAB ═══ */}
      {activeTab === 'trust-chain' && (
        <div className="space-y-4">
          {/* Trust establishment flow */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Shield size={16} className="text-green-400" /> Trust Establishment Between Entities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
              {[
                { step: 1, title: 'Certificate Exchange', desc: 'Partner submits TLS/ISD signing certificates. ApexAegis validates chain of trust via SCION TRC (Trust Root Configuration).', icon: Lock, color: 'text-blue-400' },
                { step: 2, title: 'ISD Allocation', desc: 'Unique Isolation Security Domain assigned. Partner receives ISD number, AS number, and SCION addressing space.', icon: Network, color: 'text-cyan-400' },
                { step: 3, title: 'DRKey Session Keys', desc: 'Dynamically Recreatable Key (DRKey) protocol establishes per-session symmetric keys without out-of-band key exchange.', icon: Zap, color: 'text-amber-400' },
                { step: 4, title: 'Mutual Authentication', desc: 'Both entities authenticate via SCION control-plane PKI. Cross-signed certificates enable bidirectional trust attestation.', icon: Handshake, color: 'text-green-400' },
                { step: 5, title: 'Encrypted Path Setup', desc: 'High-performance tunnels with CRYSTALS-Kyber-1024 key encapsulation + AES-256-GCM data encryption. Path-aware routing via AegisRoute™.', icon: ArrowRightLeft, color: 'text-purple-400' },
              ].map(s => (
                <div key={s.step} className="p-3 bg-gray-800/30 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 text-[10px] font-bold ${s.color}`}>{s.step}</span>
                    <s.icon size={14} className={s.color} />
                  </div>
                  <div className="font-medium text-gray-200 text-[11px] mb-1">{s.title}</div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Encryption capabilities */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Lock size={16} className="text-purple-400" /> High-Performance Encryption Suites</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  name: 'Post-Quantum (Tier 1)',
                  suite: 'CRYSTALS-Kyber-1024 + AES-256-GCM',
                  keyExchange: 'ML-KEM-1024 (NIST PQC Standard)',
                  authentication: 'Dilithium-5 Digital Signatures',
                  throughput: '40+ Gbps line rate',
                  latency: '< 2 ms additional overhead',
                  status: 'Production',
                  partners: 'Mastercard, Visa, JPMorgan',
                  color: 'border-emerald-800/50',
                },
                {
                  name: 'Classical High-Performance (Tier 2)',
                  suite: 'X25519 + ChaCha20-Poly1305',
                  keyExchange: 'Curve25519 ECDH',
                  authentication: 'Ed25519 Signatures',
                  throughput: '25+ Gbps line rate',
                  latency: '< 1 ms additional overhead',
                  status: 'Production',
                  partners: 'AmEx, Stripe',
                  color: 'border-blue-800/50',
                },
                {
                  name: 'Hybrid PQ-Classical (Tier 3)',
                  suite: 'Kyber-768 + X25519 + AES-256-GCM',
                  keyExchange: 'Hybrid ML-KEM-768 + ECDH',
                  authentication: 'Composite signature (Dilithium-3 + ECDSA)',
                  throughput: '30+ Gbps line rate',
                  latency: '< 3 ms additional overhead',
                  status: 'Preview',
                  partners: 'DBS Bank (onboarding)',
                  color: 'border-amber-800/50',
                },
              ].map(enc => (
                <div key={enc.name} className={`p-4 bg-gray-800/30 rounded-xl border ${enc.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-gray-200">{enc.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] border ${enc.status === 'Production' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-amber-900/30 text-amber-400 border-amber-800'}`}>{enc.status}</span>
                  </div>
                  <div className="space-y-2 text-[10px]">
                    <div><span className="text-gray-500">Suite:</span> <span className="text-gray-300 font-mono">{enc.suite}</span></div>
                    <div><span className="text-gray-500">Key Exchange:</span> <span className="text-gray-300">{enc.keyExchange}</span></div>
                    <div><span className="text-gray-500">Auth:</span> <span className="text-gray-300">{enc.authentication}</span></div>
                    <div><span className="text-gray-500">Throughput:</span> <span className="text-green-400 font-medium">{enc.throughput}</span></div>
                    <div><span className="text-gray-500">Overhead:</span> <span className="text-gray-300">{enc.latency}</span></div>
                    <div><span className="text-gray-500">Partners:</span> <span className="text-cyan-400">{enc.partners}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ ONBOARDING PIPELINE TAB ═══ */}
      {activeTab === 'onboarding' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Layers size={16} className="text-amber-400" /> Partner Onboarding Pipeline</h3>
            <div className="space-y-3">
              {[
                {
                  partner: 'DBS Bank', stage: 'ISD Negotiation', progress: 60,
                  steps: [
                    { label: 'NDA & Agreement Signed', done: true },
                    { label: 'Compliance Review (MAS TRM)', done: true },
                    { label: 'ISD-202 Allocated', done: true },
                    { label: 'Certificate Exchange', done: false },
                    { label: 'DRKey Establishment', done: false },
                    { label: 'Production Peering', done: false },
                  ],
                },
                {
                  partner: 'Stripe Inc.', stage: 'Certificate Pending', progress: 40,
                  steps: [
                    { label: 'NDA & Agreement Signed', done: true },
                    { label: 'Compliance Review (PCI-DSS)', done: true },
                    { label: 'ISD-300 Allocated', done: false },
                    { label: 'Certificate Exchange', done: false },
                    { label: 'DRKey Establishment', done: false },
                    { label: 'Production Peering', done: false },
                  ],
                },
                {
                  partner: 'Deutsche Bank', stage: 'Commercial Negotiation', progress: 20,
                  steps: [
                    { label: 'NDA & Agreement Signed', done: true },
                    { label: 'Compliance Review (BaFin BAIT)', done: false },
                    { label: 'ISD-203 Reserved', done: false },
                    { label: 'Certificate Exchange', done: false },
                    { label: 'DRKey Establishment', done: false },
                    { label: 'Production Peering', done: false },
                  ],
                },
              ].map((pipeline, i) => (
                <div key={i} className="p-4 bg-gray-800/30 rounded-xl border border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium">{pipeline.partner}</h4>
                      <span className="text-[10px] text-amber-400">{pipeline.stage}</span>
                    </div>
                    <span className="text-xs text-gray-400">{pipeline.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 mb-3">
                    <div className="bg-cyan-500 h-1.5 rounded-full transition-all" style={{ width: `${pipeline.progress}%` }} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {pipeline.steps.map((step, j) => (
                      <div key={j} className={`p-2 rounded text-center text-[9px] border ${step.done ? 'bg-green-950/20 border-green-800/50 text-green-400' : 'bg-gray-800/50 border-gray-700 text-gray-500'}`}>
                        {step.done ? <CheckCircle size={12} className="mx-auto mb-1" /> : <Clock size={12} className="mx-auto mb-1" />}
                        {step.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Onboard Partner Modal */}
      {showOnboardModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" role="button" tabIndex={0} aria-label="Close" onClick={() => setShowOnboardModal(false)} onKeyDown={e => e.key === 'Escape' && setShowOnboardModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Handshake size={16} className="text-cyan-400" /> Onboard SCION Partner</h3>
              <button onClick={() => setShowOnboardModal(false)} className="text-gray-400 hover:text-gray-200"><X size={16} /></button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs text-gray-400 mb-1" htmlFor="sp-name">Organization Name</label>
                <input id="sp-name" value={newPartnerName} onChange={e => setNewPartnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50"
                  placeholder="e.g. Goldman Sachs" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1" htmlFor="sp-type">Partner Type</label>
                <select id="sp-type" value={newPartnerType} onChange={e => setNewPartnerType(e.target.value as typeof newPartnerType)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50">
                  <option value="bank">Bank</option>
                  <option value="payment-network">Payment Network</option>
                  <option value="financial-institution">Financial Institution</option>
                  <option value="fintech">Fintech</option>
                </select>
              </div>
              <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-lg text-[10px] text-gray-400">
                <p className="text-cyan-400 font-medium mb-1">Onboarding will initiate:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>ISD number allocation from ApexAegis registry</li>
                  <li>SCION + IP gateway provisioning (physical or virtual appliance)</li>
                  <li>TRC certificate generation and cross-signing request</li>
                  <li>DRKey key derivation service enrollment</li>
                  <li>Compliance review initiation (auto-detect framework)</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowOnboardModal(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleOnboard} className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium transition-colors">Begin Onboarding</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
