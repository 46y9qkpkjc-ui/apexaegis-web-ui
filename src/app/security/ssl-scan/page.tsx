'use client';
import { useState } from 'react';
import {
  Lock, Search, CheckCircle2, XCircle, AlertTriangle, Clock,
  RefreshCw, Globe, ChevronDown, ChevronRight, Plus, Trash2,
  Shield, Activity, FileText, ShieldCheck, ShieldAlert,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────── */

interface Finding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  code: string;
  description: string;
}

interface ScanResult {
  id: string;
  host: string;
  port: number;
  ip_address: string;
  protocol_version: string;
  cipher_suite: string;
  key_exchange: string;
  key_size: number;
  cert_subject: string;
  cert_issuer: string;
  cert_not_before: string;
  cert_not_after: string;
  cert_serial: string;
  cert_fingerprint: string;
  cert_san: string[];
  self_signed: boolean;
  expired: boolean;
  days_until_expiry: number;
  chain_valid: boolean;
  chain_depth: number;
  compliant: boolean;
  findings: Finding[];
  url_category: string;
  scanned_at: string;
}

interface TrustedSource {
  id: string;
  hostname: string;
  port: number;
  label: string;
  category: string;
  added_by: string;
  added_at: string;
}

/* ─── Demo Data ──────────────────────────────────────────────── */

const demoResults: ScanResult[] = [
  {
    id: 'scan-001', host: 'mail.acme-corp.com', port: 443, ip_address: '10.0.5.20',
    protocol_version: 'TLS 1.3', cipher_suite: 'TLS_AES_256_GCM_SHA384',
    key_exchange: 'X25519', key_size: 256,
    cert_subject: 'CN=mail.acme-corp.com', cert_issuer: 'CN=DigiCert Global G2',
    cert_not_before: '2025-06-01T00:00:00Z', cert_not_after: '2026-06-01T00:00:00Z',
    cert_serial: '0A:1B:2C:3D:4E:5F', cert_fingerprint: 'SHA256:AB12CD34...',
    cert_san: ['mail.acme-corp.com', 'autodiscover.acme-corp.com'],
    self_signed: false, expired: false, days_until_expiry: 85, chain_valid: true, chain_depth: 3,
    compliant: true, findings: [],
    url_category: 'Enterprise Mail', scanned_at: '2026-03-15T10:30:00Z',
  },
  {
    id: 'scan-002', host: 'legacy-intranet.acme-corp.com', port: 443, ip_address: '10.0.2.100',
    protocol_version: 'TLS 1.0', cipher_suite: 'TLS_RSA_WITH_AES_128_CBC_SHA',
    key_exchange: 'RSA', key_size: 1024,
    cert_subject: 'CN=legacy-intranet.acme-corp.com', cert_issuer: 'CN=legacy-intranet.acme-corp.com',
    cert_not_before: '2023-01-01T00:00:00Z', cert_not_after: '2025-12-31T00:00:00Z',
    cert_serial: 'FF:EE:DD:CC', cert_fingerprint: 'SHA256:DEAD...',
    cert_san: [],
    self_signed: true, expired: true, days_until_expiry: -75, chain_valid: false, chain_depth: 1,
    compliant: false,
    findings: [
      { severity: 'critical', code: 'TLS_VERSION', description: 'TLS 1.0 is deprecated and insecure — upgrade to TLS 1.2+' },
      { severity: 'critical', code: 'KEY_SIZE', description: 'RSA 1024-bit key is too short — minimum 2048 bits required' },
      { severity: 'critical', code: 'CERT_EXPIRED', description: 'Certificate expired 75 days ago' },
      { severity: 'high', code: 'SELF_SIGNED', description: 'Self-signed certificate — not trusted by clients' },
      { severity: 'high', code: 'WEAK_CIPHER', description: 'CBC mode cipher is vulnerable to BEAST/padding oracle attacks' },
      { severity: 'medium', code: 'NO_SAN', description: 'No Subject Alternative Names — modern browsers require SAN' },
    ],
    url_category: 'Internal Application', scanned_at: '2026-03-15T10:31:00Z',
  },
  {
    id: 'scan-003', host: 'api.partner-saas.io', port: 443, ip_address: '52.86.123.45',
    protocol_version: 'TLS 1.2', cipher_suite: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
    key_exchange: 'ECDHE', key_size: 2048,
    cert_subject: 'CN=*.partner-saas.io', cert_issuer: "CN=Let's Encrypt Authority X3",
    cert_not_before: '2026-02-16T00:00:00Z', cert_not_after: '2026-05-17T00:00:00Z',
    cert_serial: '03:AA:BB:CC:DD', cert_fingerprint: 'SHA256:1234...',
    cert_san: ['*.partner-saas.io', 'partner-saas.io'],
    self_signed: false, expired: false, days_until_expiry: 63, chain_valid: true, chain_depth: 2,
    compliant: true,
    findings: [
      { severity: 'low', code: 'SHORT_VALIDITY', description: "Let's Encrypt 90-day cert — ensure auto-renewal is configured" },
    ],
    url_category: 'SaaS Application', scanned_at: '2026-03-15T10:32:00Z',
  },
  {
    id: 'scan-004', host: 'staging.acme-corp.com', port: 8443, ip_address: '10.0.9.5',
    protocol_version: 'TLS 1.2', cipher_suite: 'TLS_RSA_WITH_3DES_EDE_CBC_SHA',
    key_exchange: 'RSA', key_size: 2048,
    cert_subject: 'CN=staging.acme-corp.com', cert_issuer: 'CN=Acme Internal CA',
    cert_not_before: '2025-11-01T00:00:00Z', cert_not_after: '2026-11-01T00:00:00Z',
    cert_serial: '11:22:33:44', cert_fingerprint: 'SHA256:5678...',
    cert_san: ['staging.acme-corp.com'],
    self_signed: false, expired: false, days_until_expiry: 230, chain_valid: true, chain_depth: 2,
    compliant: false,
    findings: [
      { severity: 'high', code: 'WEAK_CIPHER', description: '3DES cipher is deprecated — vulnerable to Sweet32 attack' },
      { severity: 'medium', code: 'WEAK_SIG', description: 'Certificate uses SHA-1 signature — upgrade to SHA-256' },
    ],
    url_category: 'Internal Application', scanned_at: '2026-03-15T10:33:00Z',
  },
];

const demoSources: TrustedSource[] = [
  { id: 'src-1', hostname: 'mail.acme-corp.com', port: 443, label: 'Corporate Mail', category: 'Enterprise', added_by: 'admin@acme.com', added_at: '2026-01-10T08:00:00Z' },
  { id: 'src-2', hostname: 'api.partner-saas.io', port: 443, label: 'Partner SaaS', category: 'SaaS', added_by: 'admin@acme.com', added_at: '2026-02-20T12:00:00Z' },
  { id: 'src-3', hostname: 'staging.acme-corp.com', port: 8443, label: 'Staging Env', category: 'Internal', added_by: 'devops@acme.com', added_at: '2026-03-01T09:00:00Z' },
];

/* ─── Helpers ────────────────────────────────────────────────── */

const severityBadge: Record<string, string> = {
  critical: 'text-red-400 bg-red-900/30 border-red-700/40',
  high: 'text-orange-400 bg-orange-900/30 border-orange-700/40',
  medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/40',
  low: 'text-blue-400 bg-blue-900/30 border-blue-700/40',
  info: 'text-gray-400 bg-gray-800/30 border-gray-700/40',
};

function ComplianceBadge({ compliant }: { compliant: boolean }) {
  return compliant ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md border text-green-400 bg-green-900/30 border-green-700/40">
      <ShieldCheck size={10} /> COMPLIANT
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md border text-red-400 bg-red-900/30 border-red-700/40">
      <ShieldAlert size={10} /> NON-COMPLIANT
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  SSL/TLS SCAN PAGE                                              */
/* ═══════════════════════════════════════════════════════════════ */

export default function SSLScanPage() {
  const [results, setResults] = useState<ScanResult[]>(demoResults);
  const [sources, setSources] = useState<TrustedSource[]>(demoSources);
  const [expandedResult, setExpandedResult] = useState<string | null>('scan-002');
  const [scanTarget, setScanTarget] = useState('');
  const [scanPort, setScanPort] = useState('443');
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'sources'>('results');
  const [newSource, setNewSource] = useState({ hostname: '', port: '443', label: '', category: 'Enterprise' });

  const compliant = results.filter(r => r.compliant).length;
  const nonCompliant = results.filter(r => !r.compliant).length;
  const totalFindings = results.reduce((s, r) => s + r.findings.length, 0);
  const criticalFindings = results.reduce((s, r) => s + r.findings.filter(f => f.severity === 'critical').length, 0);

  /* ── Scan ──────────────────────────────────────────────── */
  const handleScan = () => {
    if (!scanTarget.trim()) return;
    setIsScanning(true);
    setTimeout(() => {
      const isBad = Math.random() > 0.5;
      const newResult: ScanResult = {
        id: `scan-${Date.now()}`,
        host: scanTarget.trim(),
        port: parseInt(scanPort) || 443,
        ip_address: `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        protocol_version: isBad ? 'TLS 1.0' : 'TLS 1.3',
        cipher_suite: isBad ? 'TLS_RSA_WITH_AES_128_CBC_SHA' : 'TLS_AES_256_GCM_SHA384',
        key_exchange: isBad ? 'RSA' : 'X25519',
        key_size: isBad ? 1024 : 256,
        cert_subject: `CN=${scanTarget.trim()}`,
        cert_issuer: isBad ? `CN=${scanTarget.trim()}` : 'CN=DigiCert Global G2',
        cert_not_before: '2025-01-01T00:00:00Z',
        cert_not_after: isBad ? '2025-06-01T00:00:00Z' : '2027-01-01T00:00:00Z',
        cert_serial: 'XX:YY:ZZ',
        cert_fingerprint: 'SHA256:XXXX...',
        cert_san: [scanTarget.trim()],
        self_signed: isBad,
        expired: isBad,
        days_until_expiry: isBad ? -100 : 300,
        chain_valid: !isBad,
        chain_depth: isBad ? 1 : 3,
        compliant: !isBad,
        findings: isBad
          ? [
              { severity: 'critical', code: 'TLS_VERSION', description: 'TLS 1.0 is deprecated' },
              { severity: 'critical', code: 'SELF_SIGNED', description: 'Self-signed certificate' },
              { severity: 'high', code: 'CERT_EXPIRED', description: 'Certificate has expired' },
            ]
          : [],
        url_category: 'Uncategorized',
        scanned_at: new Date().toISOString(),
      };
      setResults(prev => [newResult, ...prev]);
      setExpandedResult(newResult.id);
      setIsScanning(false);
      setScanTarget('');
    }, 1500);
  };

  const handleScanAll = () => {
    setIsScanning(true);
    setTimeout(() => {
      setResults(prev => prev.map(r => ({ ...r, scanned_at: new Date().toISOString() })));
      setIsScanning(false);
    }, 2000);
  };

  /* ── Source management ─────────────────────────────────── */
  const addSource = () => {
    if (!newSource.hostname.trim()) return;
    setSources(prev => [
      ...prev,
      {
        id: `src-${Date.now()}`,
        hostname: newSource.hostname.trim(),
        port: parseInt(newSource.port) || 443,
        label: newSource.label || newSource.hostname.trim(),
        category: newSource.category,
        added_by: 'admin@acme.com',
        added_at: new Date().toISOString(),
      },
    ]);
    setNewSource({ hostname: '', port: '443', label: '', category: 'Enterprise' });
  };

  const removeSource = (id: string) => setSources(prev => prev.filter(s => s.id !== id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock size={24} className="text-cyan-400" />
          <div>
            <h1 className="text-xl font-semibold">SSL/TLS Compliance Scanner</h1>
            <p className="text-sm text-gray-500">
              Scan hosts for TLS certificate compliance — detect expired certs, weak ciphers, self-signed chains, and deprecated protocols
            </p>
          </div>
        </div>
        <button
          onClick={handleScanAll}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-400 rounded-lg text-sm transition-colors disabled:opacity-40"
        >
          <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
          Scan All Sources
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Hosts', value: results.length, icon: Globe, color: 'text-blue-400' },
          { label: 'Compliant', value: compliant, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Non-Compliant', value: nonCompliant, icon: XCircle, color: 'text-red-400' },
          { label: 'Critical Findings', value: criticalFindings, icon: AlertTriangle, color: 'text-orange-400' },
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

      {/* Scan input */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              value={scanTarget}
              onChange={e => setScanTarget(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="Enter hostname to scan (e.g. mail.acme-corp.com)"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-cyan-500/60"
            />
          </div>
          <div className="w-24">
            <input
              value={scanPort}
              onChange={e => setScanPort(e.target.value)}
              placeholder="Port"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-cyan-500/60"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning || !scanTarget.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-400 rounded-lg text-sm transition-colors disabled:opacity-40"
          >
            {isScanning ? <Activity size={14} className="animate-spin" /> : <Search size={14} />}
            Scan Host
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-1 overflow-x-auto">
        {(['results', 'sources'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab
                ? 'bg-gray-900 text-white border border-gray-800 border-b-0'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'results' ? `Scan Results (${results.length})` : `Trusted Sources (${sources.length})`}
          </button>
        ))}
      </div>

      {/* Tab content: Results */}
      {activeTab === 'results' && (
        <div className="space-y-2">
          {results.map(result => {
            const isExpanded = expandedResult === result.id;
            return (
              <div key={result.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedResult(isExpanded ? null : result.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-800/30 transition-colors text-left"
                >
                  <ComplianceBadge compliant={result.compliant} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{result.host}:{result.port}</span>
                    <span className="text-[10px] text-gray-500">
                      {result.protocol_version} · {result.cipher_suite.split('_').slice(-2).join('_')} · {result.url_category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    {result.findings.length > 0 && (
                      <span className="text-red-400">
                        {result.findings.length} finding{result.findings.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className={result.days_until_expiry < 0 ? 'text-red-400' : result.days_until_expiry < 30 ? 'text-amber-400' : 'text-gray-500'}>
                      {result.days_until_expiry < 0 ? `Expired ${Math.abs(result.days_until_expiry)}d ago` : `${result.days_until_expiry}d`}
                    </span>
                  </div>
                  {isExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800/60 px-5 py-4 space-y-4">
                    {/* Certificate details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: 'Protocol', value: result.protocol_version },
                        { label: 'Cipher Suite', value: result.cipher_suite },
                        { label: 'Key Exchange', value: `${result.key_exchange} (${result.key_size}-bit)` },
                        { label: 'IP Address', value: result.ip_address },
                        { label: 'Subject', value: result.cert_subject },
                        { label: 'Issuer', value: result.cert_issuer },
                        { label: 'Valid Until', value: new Date(result.cert_not_after).toLocaleDateString() },
                        { label: 'Chain Depth', value: `${result.chain_depth} (${result.chain_valid ? 'valid' : 'INVALID'})` },
                      ].map(f => (
                        <div key={f.label} className="p-2 bg-gray-800/30 rounded-lg">
                          <div className="text-[9px] text-gray-600 uppercase">{f.label}</div>
                          <div className="text-xs text-white/70 mt-0.5 truncate" title={f.value}>{f.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* SAN list */}
                    {result.cert_san.length > 0 && (
                      <div className="p-3 bg-gray-800/20 rounded-lg">
                        <div className="text-[9px] text-gray-600 uppercase mb-1">Subject Alternative Names</div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.cert_san.map(san => (
                            <span key={san} className="px-2 py-0.5 text-[10px] bg-gray-800 text-gray-300 rounded-md border border-gray-700/40">
                              {san}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Findings */}
                    {result.findings.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Findings</div>
                        {result.findings.map((f, fi) => (
                          <div key={fi} className="flex items-start gap-2 p-2 bg-gray-800/20 rounded-lg border border-gray-800/40">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${severityBadge[f.severity]}`}>
                              {f.severity}
                            </span>
                            <div>
                              <span className="text-[10px] text-gray-400 font-mono mr-2">{f.code}</span>
                              <span className="text-xs text-gray-300">{f.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {result.findings.length === 0 && (
                      <div className="flex items-center gap-2 text-green-400 text-sm p-3 bg-green-900/10 rounded-lg border border-green-800/20">
                        <CheckCircle2 size={14} />
                        No compliance findings — host meets all security requirements
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab content: Sources */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          {/* Add source form */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Plus size={14} className="text-cyan-400" /> Add Trusted Source
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <input
                value={newSource.hostname}
                onChange={e => setNewSource(p => ({ ...p, hostname: e.target.value }))}
                placeholder="Hostname"
                className="px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-cyan-500/60"
              />
              <input
                value={newSource.port}
                onChange={e => setNewSource(p => ({ ...p, port: e.target.value }))}
                placeholder="Port"
                className="px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-cyan-500/60"
              />
              <input
                value={newSource.label}
                onChange={e => setNewSource(p => ({ ...p, label: e.target.value }))}
                placeholder="Label"
                className="px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-cyan-500/60"
              />
              <div className="flex gap-2">
                <select
                  value={newSource.category}
                  onChange={e => setNewSource(p => ({ ...p, category: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm focus:outline-none focus:border-cyan-500/60"
                >
                  <option>Enterprise</option>
                  <option>SaaS</option>
                  <option>Internal</option>
                  <option>CDN</option>
                  <option>API</option>
                </select>
                <button
                  onClick={addSource}
                  disabled={!newSource.hostname.trim()}
                  className="px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-400 rounded-lg text-sm transition-colors disabled:opacity-40"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Source list */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-[10px] text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Hostname</th>
                  <th className="text-left px-4 py-3">Port</th>
                  <th className="text-left px-4 py-3">Label</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-left px-4 py-3">Added By</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {sources.map(src => (
                  <tr key={src.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-gray-300">{src.hostname}</td>
                    <td className="px-4 py-2.5 text-gray-400">{src.port}</td>
                    <td className="px-4 py-2.5 text-gray-300">{src.label}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 text-[10px] bg-gray-800 text-gray-400 rounded-md border border-gray-700/40">
                        {src.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{src.added_by}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => removeSource(src.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
