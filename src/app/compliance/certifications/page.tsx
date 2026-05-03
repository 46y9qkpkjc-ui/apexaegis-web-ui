'use client';
import { useState, useMemo } from 'react';
import {
  Award, ShieldCheck, Clock, AlertTriangle, CheckCircle2, XCircle,
  ChevronDown, ChevronRight, FileText, Download, RefreshCw, Key,
  Globe, Lock, Server, Users, Fingerprint, CalendarDays, ExternalLink,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────── */

type CertStatus = 'valid' | 'expiring_soon' | 'expired' | 'revoked';
type RenewalMode = 'auto' | 'manual';

interface PlatformCertificate {
  id: string;
  name: string;
  type: 'root_ca' | 'intermediate_ca' | 'leaf' | 'mtls_client' | 'mtls_server' | 'saml_signing' | 'ssl_inspection' | 'jwt_signing';
  issuer: string;
  subject: string;
  serialNumber: string;
  notBefore: string;
  notAfter: string;
  algorithm: string;
  keySize: number;
  fingerprint: string;
  status: CertStatus;
  renewal: RenewalMode;
  chainValid: boolean;
  usedBy: string;
  lastRotated: string;
}

interface ComplianceCertification {
  id: string;
  framework: string;
  description: string;
  status: 'certified' | 'in_progress' | 'pending_audit' | 'not_started';
  certDate: string | null;
  expiryDate: string | null;
  nextAudit: string | null;
  auditor: string;
  scope: string;
  controls: { total: number; implemented: number; inProgress: number };
}

/* ─── Demo data ─────────────────────────────────────────────────────── */

const platformCerts: PlatformCertificate[] = [
  {
    id: 'cert-1', name: 'ApexAegis Root CA', type: 'root_ca',
    issuer: 'CN=ApexAegis Root CA, O=ApexAegis', subject: 'CN=ApexAegis Root CA, O=ApexAegis',
    serialNumber: '00:A1:B2:C3:D4:E5:F6:01', notBefore: '2024-01-01', notAfter: '2034-12-31',
    algorithm: 'RSA-4096', keySize: 4096, fingerprint: 'SHA256:AB:CD:EF:12:34:56:78:9A',
    status: 'valid', renewal: 'manual', chainValid: true, usedBy: 'All internal PKI',
    lastRotated: '2024-01-01',
  },
  {
    id: 'cert-2', name: 'Intermediate CA (Issuing)', type: 'intermediate_ca',
    issuer: 'CN=ApexAegis Root CA', subject: 'CN=ApexAegis Issuing CA, O=ApexAegis',
    serialNumber: '00:A1:B2:C3:D4:E5:F6:02', notBefore: '2024-01-15', notAfter: '2029-06-30',
    algorithm: 'RSA-4096', keySize: 4096, fingerprint: 'SHA256:11:22:33:44:55:66:77:88',
    status: 'valid', renewal: 'manual', chainValid: true, usedBy: 'Leaf certificate signing',
    lastRotated: '2024-01-15',
  },
  {
    id: 'cert-3', name: 'Gateway mTLS Server Cert (us-east-1)', type: 'mtls_server',
    issuer: 'CN=ApexAegis Issuing CA', subject: 'CN=gw-us-east-1.apexaegis.com',
    serialNumber: '00:GW:01:US:E1', notBefore: '2025-11-01', notAfter: '2026-11-01',
    algorithm: 'ECDSA P-256', keySize: 256, fingerprint: 'SHA256:GW:01:AB:CD:EF:12:34:56',
    status: 'valid', renewal: 'auto', chainValid: true, usedBy: 'Gateway us-east-1',
    lastRotated: '2025-11-01',
  },
  {
    id: 'cert-4', name: 'Gateway mTLS Server Cert (eu-west-1)', type: 'mtls_server',
    issuer: 'CN=ApexAegis Issuing CA', subject: 'CN=gw-eu-west-1.apexaegis.com',
    serialNumber: '00:GW:02:EU:W1', notBefore: '2025-11-01', notAfter: '2026-11-01',
    algorithm: 'ECDSA P-256', keySize: 256, fingerprint: 'SHA256:GW:02:AB:CD:EF:12:34:56',
    status: 'valid', renewal: 'auto', chainValid: true, usedBy: 'Gateway eu-west-1',
    lastRotated: '2025-11-01',
  },
  {
    id: 'cert-5', name: 'Management Plane mTLS Client', type: 'mtls_client',
    issuer: 'CN=ApexAegis Issuing CA', subject: 'CN=mgmt.apexaegis.com, OU=Management Plane',
    serialNumber: '00:MP:01:CL', notBefore: '2025-10-01', notAfter: '2026-04-01',
    algorithm: 'ECDSA P-256', keySize: 256, fingerprint: 'SHA256:MP:01:AB:CD:EF:12:34:56',
    status: 'expiring_soon', renewal: 'auto', chainValid: true, usedBy: 'Management Plane → Gateway mTLS',
    lastRotated: '2025-10-01',
  },
  {
    id: 'cert-6', name: 'SSL Inspection Signing CA', type: 'ssl_inspection',
    issuer: 'CN=ApexAegis Issuing CA', subject: 'CN=ApexAegis SSL Inspection CA',
    serialNumber: '00:SSL:IN:01', notBefore: '2025-06-01', notAfter: '2027-06-01',
    algorithm: 'RSA-2048', keySize: 2048, fingerprint: 'SHA256:SSL:01:AB:CD:EF:12:34:56',
    status: 'valid', renewal: 'manual', chainValid: true, usedBy: 'SSL Full Inspection profiles',
    lastRotated: '2025-06-01',
  },
  {
    id: 'cert-7', name: 'SAML IdP Signing Certificate', type: 'saml_signing',
    issuer: 'CN=ApexAegis SAML CA', subject: 'CN=saml.apexaegis.com',
    serialNumber: '00:SAML:01', notBefore: '2025-03-01', notAfter: '2026-03-01',
    algorithm: 'RSA-2048', keySize: 2048, fingerprint: 'SHA256:SAML:01:AB:CD:EF:12:34',
    status: 'expiring_soon', renewal: 'manual', chainValid: true, usedBy: 'SAML SP federation with Okta',
    lastRotated: '2025-03-01',
  },
  {
    id: 'cert-8', name: 'JWT Signing Key (RS256)', type: 'jwt_signing',
    issuer: 'Self-signed', subject: 'ApexAegis JWT RS256',
    serialNumber: 'N/A (JWK Kid: apex-jwt-01)', notBefore: '2025-01-01', notAfter: '2026-01-01',
    algorithm: 'RSA-2048', keySize: 2048, fingerprint: 'SHA256:JWT:01:AB:CD:EF:12:34',
    status: 'expired', renewal: 'manual', chainValid: true, usedBy: 'Access/Refresh token signing',
    lastRotated: '2025-01-01',
  },
];

const complianceCertifications: ComplianceCertification[] = [
  {
    id: 'soc2', framework: 'SOC 2 Type II', description: 'Service Organization Control 2 — Security, Availability, Confidentiality',
    status: 'certified', certDate: '2025-09-15', expiryDate: '2026-09-15',
    nextAudit: '2026-07-01', auditor: 'Deloitte',
    scope: 'ApexAegis SSE Platform — Management Plane, Gateway, Identity Broker',
    controls: { total: 64, implemented: 62, inProgress: 2 },
  },
  {
    id: 'iso27001', framework: 'ISO 27001:2022', description: 'Information Security Management System (ISMS)',
    status: 'certified', certDate: '2025-06-01', expiryDate: '2028-06-01',
    nextAudit: '2026-06-01', auditor: 'BSI Group',
    scope: 'Corporate security operations and SSE platform infrastructure',
    controls: { total: 93, implemented: 88, inProgress: 5 },
  },
  {
    id: 'fedramp', framework: 'FedRAMP Moderate', description: 'Federal Risk and Authorization Management Program — NIST 800-53 Rev.5 Moderate',
    status: 'in_progress', certDate: null, expiryDate: null,
    nextAudit: '2026-09-01', auditor: 'Coalfire (3PAO)',
    scope: 'ApexAegis SSE US Government deployment (GovCloud)',
    controls: { total: 345, implemented: 325, inProgress: 20 },
  },
  {
    id: 'pcidss', framework: 'PCI-DSS 4.0', description: 'Payment Card Industry Data Security Standard v4.0',
    status: 'pending_audit', certDate: null, expiryDate: null,
    nextAudit: '2026-04-15', auditor: 'Ernst & Young (QSA)',
    scope: 'Network segmentation and data flow controls for cardholder data environments',
    controls: { total: 78, implemented: 74, inProgress: 4 },
  },
  {
    id: 'hipaa', framework: 'HIPAA', description: 'Health Insurance Portability and Accountability Act — Security Rule',
    status: 'not_started', certDate: null, expiryDate: null,
    nextAudit: null, auditor: 'TBD',
    scope: 'Protected Health Information (PHI) data handling via SSE tunnels',
    controls: { total: 54, implemented: 31, inProgress: 8 },
  },
  {
    id: 'csa-star', framework: 'CSA STAR Level 2', description: 'Cloud Security Alliance — Security, Trust, Assurance, and Risk',
    status: 'certified', certDate: '2025-11-01', expiryDate: '2026-11-01',
    nextAudit: '2026-09-15', auditor: 'Schellman & Company',
    scope: 'Multi-tenant SSE cloud infrastructure and SaaS controls',
    controls: { total: 197, implemented: 190, inProgress: 7 },
  },
];

/* ─── Helpers ──────────────────────────────────────────────────────── */

const certStatusConfig: Record<CertStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  valid: { label: 'Valid', color: 'text-green-400 bg-green-900/30 border-green-700/40', icon: CheckCircle2 },
  expiring_soon: { label: 'Expiring Soon', color: 'text-amber-400 bg-amber-900/30 border-amber-700/40', icon: AlertTriangle },
  expired: { label: 'Expired', color: 'text-red-400 bg-red-900/30 border-red-700/40', icon: XCircle },
  revoked: { label: 'Revoked', color: 'text-red-400 bg-red-900/30 border-red-700/40', icon: XCircle },
};

const certFrameworkStatus: Record<ComplianceCertification['status'], { label: string; color: string }> = {
  certified: { label: 'Certified', color: 'text-green-400 bg-green-900/30 border-green-700/40' },
  in_progress: { label: 'In Progress', color: 'text-blue-400 bg-blue-900/30 border-blue-700/40' },
  pending_audit: { label: 'Pending Audit', color: 'text-amber-400 bg-amber-900/30 border-amber-700/40' },
  not_started: { label: 'Not Started', color: 'text-gray-400 bg-gray-800/30 border-gray-700/40' },
};

const certTypeIcon: Record<PlatformCertificate['type'], typeof Key> = {
  root_ca: Lock, intermediate_ca: Lock, leaf: Globe, mtls_client: Users,
  mtls_server: Server, saml_signing: Fingerprint, ssl_inspection: Globe, jwt_signing: Key,
};

const certTypeLabel: Record<PlatformCertificate['type'], string> = {
  root_ca: 'Root CA', intermediate_ca: 'Intermediate CA', leaf: 'Leaf',
  mtls_client: 'mTLS Client', mtls_server: 'mTLS Server', saml_signing: 'SAML Signing',
  ssl_inspection: 'SSL Inspection', jwt_signing: 'JWT Signing',
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function expiryBadge(days: number) {
  if (days < 0) return { text: `Expired ${Math.abs(days)}d ago`, color: 'text-red-400 bg-red-900/40' };
  if (days < 30) return { text: `${days}d left`, color: 'text-red-400 bg-red-900/40' };
  if (days < 90) return { text: `${days}d left`, color: 'text-amber-400 bg-amber-900/40' };
  return { text: `${days}d left`, color: 'text-green-400 bg-green-900/40' };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  CERTIFICATION REPORT PAGE                                             */
/* ═══════════════════════════════════════════════════════════════════════ */
export default function CertificationReportPage() {
  const [expandedCerts, setExpandedCerts] = useState<Set<string>>(new Set());
  const [expandedFrameworks, setExpandedFrameworks] = useState<Set<string>>(new Set());
  const [certFilter, setCertFilter] = useState<CertStatus | 'all'>('all');

  const filteredCerts = certFilter === 'all' ? platformCerts : platformCerts.filter(c => c.status === certFilter);

  const validCount = platformCerts.filter(c => c.status === 'valid').length;
  const expiringCount = platformCerts.filter(c => c.status === 'expiring_soon').length;
  const expiredCount = platformCerts.filter(c => c.status === 'expired' || c.status === 'revoked').length;

  const certifiedCount = complianceCertifications.filter(c => c.status === 'certified').length;

  const toggleCert = (id: string) => {
    setExpandedCerts(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleFramework = (id: string) => {
    setExpandedFrameworks(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Award size={24} className="text-purple-400" />
          <div>
            <h1 className="text-xl font-semibold">Certification Report</h1>
            <p className="text-sm text-gray-500">Platform certificate inventory & compliance certification status</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-sm transition-colors overflow-x-auto">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-sm transition-colors overflow-x-auto">
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Key size={16} className="text-blue-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Total Certificates</span>
          </div>
          <div className="text-2xl font-bold">{platformCerts.length}</div>
          <div className="text-[10px] text-gray-600 mt-0.5">{validCount} valid, {expiringCount} expiring, {expiredCount} expired</div>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-green-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Chain Valid</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{platformCerts.filter(c => c.chainValid).length}/{platformCerts.length}</div>
          <div className="text-[10px] text-gray-600 mt-0.5">All certificate chains verified</div>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw size={16} className="text-purple-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Auto-Renewal</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{platformCerts.filter(c => c.renewal === 'auto').length}</div>
          <div className="text-[10px] text-gray-600 mt-0.5">{platformCerts.filter(c => c.renewal === 'manual').length} require manual renewal</div>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-amber-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Certifications</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{certifiedCount}/{complianceCertifications.length}</div>
          <div className="text-[10px] text-gray-600 mt-0.5">{certifiedCount} active certifications</div>
        </div>
      </div>

      {/* ── Section 1: Platform Certificate Inventory ──────────────────── */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Lock size={16} className="text-blue-400" />
          Platform Certificate Inventory
        </h2>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-3">
          {(['all', 'valid', 'expiring_soon', 'expired'] as const).map(s => (
            <button key={s} onClick={() => setCertFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                certFilter === s
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}>
              {s === 'all' ? 'All' : s === 'valid' ? 'Valid' : s === 'expiring_soon' ? 'Expiring' : 'Expired'}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredCerts.map(cert => {
            const isExpanded = expandedCerts.has(cert.id);
            const TypeIcon = certTypeIcon[cert.type];
            const statusCfg = certStatusConfig[cert.status];
            const StatusIcon = statusCfg.icon;
            const days = daysUntil(cert.notAfter);
            const eb = expiryBadge(days);

            return (
              <div key={cert.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCert(cert.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors text-left"
                >
                  <TypeIcon size={16} className="text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{cert.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 border border-gray-700/40">
                        {certTypeLabel[cert.type]}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono truncate block">{cert.subject}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${eb.color}`}>{eb.text}</span>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium ${statusCfg.color}`}>
                    <StatusIcon size={10} /> {statusCfg.label}
                  </span>
                  {cert.renewal === 'auto' && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-400 border border-purple-700/40 text-[10px]">
                      Auto
                    </span>
                  )}
                  {isExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800/60 px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm">
                    <div><span className="text-[10px] uppercase tracking-wider text-gray-600 block">Issuer</span><span className="text-gray-300 text-xs font-mono">{cert.issuer}</span></div>
                    <div><span className="text-[10px] uppercase tracking-wider text-gray-600 block">Serial Number</span><span className="text-gray-400 text-xs font-mono">{cert.serialNumber}</span></div>
                    <div><span className="text-[10px] uppercase tracking-wider text-gray-600 block">Algorithm / Key Size</span><span className="text-gray-300 text-xs">{cert.algorithm} ({cert.keySize}-bit)</span></div>
                    <div><span className="text-[10px] uppercase tracking-wider text-gray-600 block">Valid From</span><span className="text-gray-400 text-xs">{cert.notBefore}</span></div>
                    <div><span className="text-[10px] uppercase tracking-wider text-gray-600 block">Valid Until</span><span className={`text-xs ${days < 30 ? 'text-red-400 font-semibold' : days < 90 ? 'text-amber-400' : 'text-gray-400'}`}>{cert.notAfter}</span></div>
                    <div><span className="text-[10px] uppercase tracking-wider text-gray-600 block">Fingerprint</span><span className="text-gray-500 text-xs font-mono">{cert.fingerprint}</span></div>
                    <div><span className="text-[10px] uppercase tracking-wider text-gray-600 block">Chain Valid</span><span className={cert.chainValid ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>{cert.chainValid ? 'Yes — full chain verified' : 'No — chain broken'}</span></div>
                    <div><span className="text-[10px] uppercase tracking-wider text-gray-600 block">Used By</span><span className="text-gray-300 text-xs">{cert.usedBy}</span></div>
                    <div><span className="text-[10px] uppercase tracking-wider text-gray-600 block">Last Rotated</span><span className="text-gray-400 text-xs">{cert.lastRotated}</span></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Compliance Certifications ───────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Award size={16} className="text-purple-400" />
          Compliance Certifications
        </h2>
        <div className="space-y-2">
          {complianceCertifications.map(fw => {
            const isExpanded = expandedFrameworks.has(fw.id);
            const stCfg = certFrameworkStatus[fw.status];
            const controlPct = Math.round((fw.controls.implemented / fw.controls.total) * 100);

            return (
              <div key={fw.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFramework(fw.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors text-left"
                >
                  <FileText size={16} className="text-purple-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{fw.framework}</span>
                    <span className="text-xs text-gray-500 block">{fw.description}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${stCfg.color}`}>{stCfg.label}</span>
                  {fw.nextAudit && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <CalendarDays size={10} /> {fw.nextAudit}
                    </span>
                  )}
                  {isExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800/60 px-5 py-4 space-y-4 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                      <div><span className="text-[10px] uppercase tracking-wider text-gray-600 block">Scope</span><span className="text-gray-300 text-xs">{fw.scope}</span></div>
                      <div><span className="text-[10px] uppercase tracking-wider text-gray-600 block">Auditor</span><span className="text-gray-300 text-xs">{fw.auditor}</span></div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-600 block">Certification Date</span>
                        <span className="text-gray-400 text-xs">{fw.certDate ?? 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-600 block">Expiry Date</span>
                        <span className={`text-xs ${fw.expiryDate ? (daysUntil(fw.expiryDate) < 90 ? 'text-amber-400' : 'text-gray-400') : 'text-gray-600'}`}>
                          {fw.expiryDate ?? 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-600 block">Next Audit</span>
                        <span className="text-gray-400 text-xs">{fw.nextAudit ?? 'TBD'}</span>
                      </div>
                    </div>
                    {/* Control coverage */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-wider text-gray-600">Control Implementation</span>
                        <span className="text-xs text-gray-400">{fw.controls.implemented}/{fw.controls.total} ({controlPct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex">
                        <div className="h-full bg-green-500/60" style={{ width: `${(fw.controls.implemented / fw.controls.total) * 100}%` }} />
                        <div className="h-full bg-blue-500/60" style={{ width: `${(fw.controls.inProgress / fw.controls.total) * 100}%` }} />
                      </div>
                      <div className="flex gap-4 mt-1.5">
                        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-green-500/60 inline-block" /> {fw.controls.implemented} Implemented</span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-blue-500/60 inline-block" /> {fw.controls.inProgress} In Progress</span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-gray-700 inline-block" /> {fw.controls.total - fw.controls.implemented - fw.controls.inProgress} Not Started</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-gray-700 text-center">
        Report generated {new Date().toLocaleString()} · ApexAegis Security Service Edge · Certificate & certification lifecycle management
      </p>
    </div>
  );
}
