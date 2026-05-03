'use client';
import { useState, useMemo } from 'react';
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight,
  Lock, Users, Server, Globe, Eye, FileText, Wifi, MonitorSmartphone,
  Key, Network, Activity, Fingerprint, Clock, Download, RefreshCw,
  BarChart3, ShieldCheck, ShieldAlert, ShieldX, Layers, Scan, Boxes, Workflow,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────── */

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type Status = 'pass' | 'fail' | 'warn' | 'not_applicable';

interface ComplianceCheck {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  status: Status;
  finding: string;
  remediation: string;
  reference: string; // e.g. NIST control, CIS benchmark
  lastChecked: string;
}

interface ComplianceCategory {
  id: string;
  label: string;
  icon: typeof Shield;
  checks: ComplianceCheck[];
}

/* ─── Demo data — FortiGate Security Rating style ───────────────────── */

const complianceCategories: ComplianceCategory[] = [
  {
    id: 'identity', label: 'Identity & Authentication', icon: Users,
    checks: [
      { id: 'IAM-01', title: 'MFA Enforcement', description: 'Verify all admin accounts require multi-factor authentication.', category: 'identity', severity: 'critical', status: 'pass', finding: 'All 12 admin accounts have MFA enforced (WebAuthn or TOTP).', remediation: 'N/A', reference: 'NIST AC-7 / CIS 4.1', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'IAM-02', title: 'IdP Federation Active', description: 'At least one external identity provider must be configured and enabled.', category: 'identity', severity: 'critical', status: 'pass', finding: 'Okta (Primary) and Microsoft Entra ID are both configured and enabled.', remediation: 'N/A', reference: 'NIST IA-2 / SOC 2 CC6.1', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'IAM-03', title: 'Kerberos SSO Configured', description: 'Kerberos delegation should be configured for domain-joined endpoint SSO.', category: 'identity', severity: 'medium', status: 'pass', finding: 'Kerberos enabled via Entra ID, realm CORP.APEXAEGIS.COM.', remediation: 'N/A', reference: 'CIS 5.3', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'IAM-04', title: 'SCIM Provisioning', description: 'SCIM auto-provisioning should be enabled for at least one IdP.', category: 'identity', severity: 'high', status: 'pass', finding: 'SCIM enabled on Okta and Microsoft Entra ID.', remediation: 'N/A', reference: 'SOC 2 CC6.2', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'IAM-05', title: 'Inactive User Accounts', description: 'User accounts with no login in 90+ days should be disabled.', category: 'identity', severity: 'high', status: 'warn', finding: '3 user accounts have not logged in for 90+ days: jdoe@corp.com, msmith@corp.com, test-svc@corp.com.', remediation: 'Review and disable or remove accounts that are no longer needed. Navigate to Identity → Users & Groups.', reference: 'NIST AC-2(3) / CIS 5.5', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'IAM-06', title: 'Privileged Role Separation', description: 'super_admin role limited to ≤3 accounts.', category: 'identity', severity: 'high', status: 'pass', finding: '2 super_admin accounts found (within limit).', remediation: 'N/A', reference: 'NIST AC-6(1)', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'IAM-07', title: 'Session Timeout Policy', description: 'Admin sessions should expire after 30 minutes of inactivity.', category: 'identity', severity: 'medium', status: 'pass', finding: 'Access token TTL: 15m, Refresh token: 7d with sliding window.', remediation: 'N/A', reference: 'NIST AC-12 / CIS 5.6', lastChecked: '2026-03-14T08:30:00Z' },
    ],
  },
  {
    id: 'encryption', label: 'Encryption & Certificates', icon: Lock,
    checks: [
      { id: 'ENC-01', title: 'TLS 1.3 Enforcement', description: 'All gateway endpoints must use TLS 1.3 minimum.', category: 'encryption', severity: 'critical', status: 'pass', finding: 'All 4 gateway nodes enforce TLS 1.3. TLS 1.0/1.1/1.2 disabled.', remediation: 'N/A', reference: 'NIST SC-8 / PCI-DSS 4.2.1', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'ENC-02', title: 'CA Certificate Validity', description: 'All CA certificates must have >90 days before expiration.', category: 'encryption', severity: 'critical', status: 'pass', finding: 'Root CA expires 2035-12-31. Intermediate CA expires 2029-06-30. Both valid.', remediation: 'N/A', reference: 'NIST SC-17', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'ENC-03', title: 'SSL Full Inspection', description: 'SSL inspection profile should be configured with organization CA for inline proxy decryption.', category: 'encryption', severity: 'high', status: 'pass', finding: 'SSL inspection enabled with Acme Corp Root CA. 2 profiles configured.', remediation: 'N/A', reference: 'CIS 9.2', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'ENC-04', title: 'Weak Cipher Suites', description: 'No weak cipher suites (RC4, 3DES, MD5, SHA-1 HMAC) should be enabled.', category: 'encryption', severity: 'critical', status: 'pass', finding: 'Only AEAD ciphers enabled: AES-256-GCM, CHACHA20-POLY1305.', remediation: 'N/A', reference: 'NIST SC-13 / PCI-DSS 2.2.1', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'ENC-05', title: 'Certificate Pinning', description: 'mTLS client certificate pinning enabled for gateway-to-management plane communication.', category: 'encryption', severity: 'high', status: 'pass', finding: 'mTLS enabled on :9443 with certificate pinning. Gateway certs signed by internal CA.', remediation: 'N/A', reference: 'NIST SC-23', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'ENC-06', title: 'Key Rotation Schedule', description: 'JWT signing keys and API keys should rotate at least every 90 days.', category: 'encryption', severity: 'high', status: 'fail', finding: 'JWT signing key (HS256) has not been rotated in 180 days. Risk of key compromise.', remediation: 'Rotate the JWT signing secret via Settings → Security → Key Rotation. Migrate to RS256 asymmetric keys for automatic rotation via JWKS.', reference: 'NIST SC-12(1) / SOC 2 CC6.6', lastChecked: '2026-03-14T08:30:00Z' },
    ],
  },
  {
    id: 'network', label: 'Network & Gateway Security', icon: Server,
    checks: [
      { id: 'NET-01', title: 'Gateway HA Redundancy', description: 'At least 2 gateway nodes per region for high availability.', category: 'network', severity: 'high', status: 'pass', finding: '4 gateways across 4 regions: us-east-1, us-west-2, eu-west-1, ap-southeast-1.', remediation: 'N/A', reference: 'SOC 2 A1.2', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'NET-02', title: 'QUIC/DTLS Tunnels', description: 'Primary tunnel protocol should use QUIC or DTLS for latency-sensitive traffic.', category: 'network', severity: 'medium', status: 'pass', finding: 'QUIC :4433 primary, DTLS :4434 fallback, TLS :8444 last resort.', remediation: 'N/A', reference: 'SCION Architecture', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'NET-03', title: 'DNS Security', description: 'DNS resolution should use DNS-over-HTTPS with threat intelligence filtering.', category: 'network', severity: 'high', status: 'pass', finding: 'DNS filter active on gateway :5353 with malware/phishing/C2 category blocking.', remediation: 'N/A', reference: 'NIST SC-20', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'NET-04', title: 'Microsegmentation (SGT)', description: 'Identity-based Security Group Tags should be deployed with policy matrix.', category: 'network', severity: 'high', status: 'pass', finding: '9 SGT zones defined, 21 policy rules, enforcement on 3 SDN switches.', remediation: 'N/A', reference: 'NIST AC-4 / Zero Trust Architecture', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'NET-05', title: 'Unused Gateway Ports', description: 'No unnecessary ports should be open on gateway nodes.', category: 'network', severity: 'medium', status: 'pass', finding: 'Only required ports open: 4433/udp (QUIC), 4434/udp (DTLS), 8444/tcp (TLS), 5353/udp (DNS).', remediation: 'N/A', reference: 'CIS 9.1', lastChecked: '2026-03-14T08:30:00Z' },
    ],
  },
  {
    id: 'policy', label: 'Security Policy Configuration', icon: Shield,
    checks: [
      { id: 'POL-01', title: 'Default Deny Policy', description: 'A default-deny (block all) policy must exist as the last rule.', category: 'policy', severity: 'critical', status: 'pass', finding: 'Default deny rule "Block All Other Traffic" exists at priority 9999.', remediation: 'N/A', reference: 'NIST AC-3 / Zero Trust', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'POL-02', title: 'Shadow/Redundant Policies', description: 'No duplicate or overshadowed policies should exist.', category: 'policy', severity: 'high', status: 'warn', finding: '2 potentially redundant policies detected: "Allow Office 365" (rule 4) is partially overlapped by "Allow Microsoft Cloud" (rule 7) — 78% overlap.', remediation: 'Review overlapping policies in Security Policies → Duplicate Detector. Merge or remove the redundant rule.', reference: 'CIS 9.5', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'POL-03', title: 'Logging Enabled on All Rules', description: 'All security policies should have session logging enabled.', category: 'policy', severity: 'high', status: 'pass', finding: 'All 12 active policies have session logging enabled.', remediation: 'N/A', reference: 'NIST AU-3 / PCI-DSS 10.1', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'POL-04', title: 'ATP Profile Attached', description: 'At least one ATP (Advanced Threat Protection) profile must be attached to allow rules.', category: 'policy', severity: 'critical', status: 'pass', finding: 'ATP profile "Default-ATP" attached to 8 of 10 allow rules. 2 internal allow rules appropriately excluded.', remediation: 'N/A', reference: 'NIST SI-3 / CIS 8.1', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'POL-05', title: 'Web Filter Profile', description: 'Web filtering should block high-risk URL categories.', category: 'policy', severity: 'high', status: 'pass', finding: 'Web filter blocks: malware, phishing, cryptomining, botnet, C2, spyware (6 categories).', remediation: 'N/A', reference: 'NIST SI-8 / CIS 9.3', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'POL-06', title: 'Policy Change Audit Trail', description: 'All policy changes should be logged with author, timestamp, and diff.', category: 'policy', severity: 'high', status: 'pass', finding: 'Config versioning active with last-10 revision history and revert capability.', remediation: 'N/A', reference: 'NIST CM-3 / SOC 2 CC8.1', lastChecked: '2026-03-14T08:30:00Z' },
    ],
  },
  {
    id: 'endpoint', label: 'Endpoint & Device Posture', icon: MonitorSmartphone,
    checks: [
      { id: 'DEV-01', title: 'Device Posture Enforcement', description: 'Device posture checks (disk encryption, firewall, AV) should be enforced before tunnel connection.', category: 'endpoint', severity: 'critical', status: 'pass', finding: 'Desktop agent checks BitLocker, Windows Firewall, and Defender status on connect.', remediation: 'N/A', reference: 'NIST CM-6 / CIS 1.1', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'DEV-02', title: 'Agent Auto-Update', description: 'Desktop agent auto-update should be enabled to maintain current security patches.', category: 'endpoint', severity: 'high', status: 'warn', finding: 'Auto-update is enabled but 7 devices are running agent v0.8.x (current: v0.10.2). Update pending.', remediation: 'Notify affected users to restart the ApexAegis desktop client to apply the update. Consider enforcing minimum agent version.', reference: 'NIST SI-2 / CIS 7.1', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'DEV-03', title: 'Biometric Authentication', description: 'Biometric (WebAuthn/FIDO2) reauthentication should be configured for privileged actions.', category: 'endpoint', severity: 'medium', status: 'pass', finding: 'WebAuthn enrolled on 89% of managed devices. Biometric reauthentication required for policy changes.', remediation: 'N/A', reference: 'NIST IA-5(2)', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'DEV-04', title: 'Jailbreak/Root Detection', description: 'Mobile and desktop clients should detect jailbroken or rooted devices.', category: 'endpoint', severity: 'critical', status: 'pass', finding: 'Jailbreak detection active. 0 compromised devices currently connected.', remediation: 'N/A', reference: 'NIST CM-6 / OWASP Mobile', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'DEV-05', title: 'Unmanaged Device Restriction', description: 'Unmanaged (BYOD) devices should have restricted access policies.', category: 'endpoint', severity: 'high', status: 'fail', finding: '14 unmanaged devices have full access. No BYOD-specific policy restricts their network access.', remediation: 'Create a security policy that limits BYOD devices to web-only access with mandatory SSL inspection. Navigate to Security Policies → Create Rule targeting unmanaged device posture.', reference: 'NIST AC-19 / Zero Trust', lastChecked: '2026-03-14T08:30:00Z' },
    ],
  },
  {
    id: 'logging', label: 'Logging & Monitoring', icon: Activity,
    checks: [
      { id: 'LOG-01', title: 'Audit Log Retention', description: 'Audit logs should be retained for ≥365 days.', category: 'logging', severity: 'high', status: 'pass', finding: 'Audit log retention set to 730 days (2 years). WORM storage enabled.', remediation: 'N/A', reference: 'NIST AU-11 / PCI-DSS 10.7', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'LOG-02', title: 'SIEM Integration', description: 'Security events should be forwarded to an external SIEM.', category: 'logging', severity: 'high', status: 'warn', finding: 'No SIEM integration configured. Events are only stored locally.', remediation: 'Configure a SIEM integration (Splunk, Sentinel, or Elastic) via OAuth 2.0 API Keys → Create client with logs:read scope.', reference: 'NIST AU-6(1) / SOC 2 CC7.2', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'LOG-03', title: 'Real-Time Alerting', description: 'Critical security events should trigger immediate notifications.', category: 'logging', severity: 'high', status: 'warn', finding: 'Email alerting configured but no webhook/PagerDuty integration for on-call escalation.', remediation: 'Add a webhook or PagerDuty integration in Settings → Notifications for critical severity events.', reference: 'NIST IR-6 / SOC 2 CC7.3', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'LOG-04', title: 'DNS Query Logging', description: 'All DNS queries should be logged for threat hunting and forensics.', category: 'logging', severity: 'medium', status: 'pass', finding: 'DNS query logging enabled on all gateway nodes with 90-day retention.', remediation: 'N/A', reference: 'NIST AU-3(1)', lastChecked: '2026-03-14T08:30:00Z' },
    ],
  },
  {
    id: 'compliance', label: 'Regulatory Compliance', icon: FileText,
    checks: [
      { id: 'REG-01', title: 'Data Residency', description: 'User data processing should comply with regional data residency requirements.', category: 'compliance', severity: 'critical', status: 'pass', finding: 'US data processed in us-east-1/us-west-2. EU data in eu-west-1. APAC data in ap-southeast-1.', remediation: 'N/A', reference: 'GDPR Art. 44 / Schrems II', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'REG-02', title: 'PII Data Loss Prevention', description: 'DLP policies should detect and block PII exfiltration.', category: 'compliance', severity: 'critical', status: 'warn', finding: 'DLP policies configured for credit card and SSN patterns. Missing: passport numbers, health records (PHI).', remediation: 'Expand DLP detection patterns to include passport, driver license, and HIPAA PHI data types in Profiles → Data Loss Prevention.', reference: 'NIST SI-12 / PCI-DSS 3.4 / HIPAA §164.312(e)', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'REG-03', title: 'SOC 2 Control Coverage', description: 'All SOC 2 Type II trust services criteria should have mapped controls.', category: 'compliance', severity: 'high', status: 'pass', finding: 'Coverage: Security (CC6) 100%, Availability (A1) 100%, Confidentiality (C1) 95%, Processing Integrity (PI1) 90%.', remediation: 'N/A', reference: 'SOC 2 TSC', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'REG-04', title: 'FedRAMP Readiness', description: 'NIST 800-53 moderate baseline controls should be implemented.', category: 'compliance', severity: 'high', status: 'pass', finding: '325 of 345 controls implemented (94%). 20 controls in progress (POA&M).', remediation: 'N/A', reference: 'NIST 800-53 Rev.5 Moderate', lastChecked: '2026-03-14T08:30:00Z' },
    ],
  },
  {
    id: 'third_party', label: 'Operational & Third-Party Verification', icon: Boxes,
    checks: [
      { id: 'TPR-01', title: 'Third-Party Risk Management (TPRM)', description: 'All critical vendors and partners must complete security assessments and meet internal regulatory standards before onboarding.', category: 'third_party', severity: 'critical', status: 'pass', finding: 'TPRM program active: 28 vendors assessed, 26 compliant, 2 under remediation. Vendor risk scoring automated via policy engine.', remediation: 'N/A', reference: 'NIST SR-3 / SOC 2 CC9.2 / OCC 2013-29', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'TPR-02', title: 'TPRM Continuous Monitoring', description: 'Vendor risk posture must be re-evaluated at least annually, with critical vendors monitored continuously.', category: 'third_party', severity: 'high', status: 'warn', finding: '5 of 28 vendors have not been re-assessed in 12+ months. Automated continuous monitoring covers 18 critical vendors.', remediation: 'Trigger re-assessment for stale vendors via Compliance → ITSM Automation → Vendor Review workflow. Enable continuous feed ingestion for remaining 10 non-critical vendors.', reference: 'FFIEC IT Booklet / SOC 2 CC9.2', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'TPR-03', title: 'Fourth-Party Sub-Processor Tracking', description: 'Key vendors\u0027 sub-processors must be inventoried and risk-rated for supply chain visibility.', category: 'third_party', severity: 'high', status: 'warn', finding: '12 of 18 critical vendors have sub-processor inventories uploaded. 6 vendors have not disclosed sub-processor lists.', remediation: 'Request sub-processor disclosures from outstanding vendors. Map sub-processors to data flows in Policy → Data Classification.', reference: 'GDPR Art. 28 / DORA Art. 29', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'SCA-01', title: 'Software Composition Analysis (SCA)', description: 'All deployed third-party libraries, SDKs, and open-source components must be scanned for known vulnerabilities (CVEs) and license compliance.', category: 'third_party', severity: 'critical', status: 'pass', finding: 'SCA scan completed: 342 dependencies analyzed. 0 critical CVEs, 2 high CVEs in remediation. License compliance: 100% OSI-approved.', remediation: 'N/A', reference: 'NIST SI-2 / PCI-DSS 6.3.2 / OWASP SCVS', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'SCA-02', title: 'SBOM Generation', description: 'A Software Bill of Materials (SBOM) must be generated for each release and stored for audit.', category: 'third_party', severity: 'high', status: 'pass', finding: 'SBOM (CycloneDX) auto-generated in CI/CD pipeline. Latest SBOM: v0.10.2, 342 components, SHA-256 signed.', remediation: 'N/A', reference: 'EO 14028 / NIST SSDF', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'SCA-03', title: 'License Compliance', description: 'No copyleft or restricted-use licenses in production dependencies without legal review.', category: 'third_party', severity: 'medium', status: 'pass', finding: 'All 342 dependencies use permissive licenses (MIT, Apache 2.0, BSD). No GPL or AGPL components.', remediation: 'N/A', reference: 'SOC 2 CC8.1', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'CCM-01', title: 'Continuous Control Monitoring', description: 'Internal security controls must be tested automatically and continuously rather than relying solely on periodic audits.', category: 'third_party', severity: 'critical', status: 'pass', finding: 'ApexAegis Policy & Compliance Management module provides real-time control testing: 47 automated tests run every 15 minutes. 98.2% control effectiveness over last 30 days.', remediation: 'N/A', reference: 'NIST CA-7 / SOC 2 CC4.1 / ISACA COBIT', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'CCM-02', title: 'Control Drift Detection', description: 'Automated alerts must fire when a previously passing control begins to fail (drift detection).', category: 'third_party', severity: 'high', status: 'pass', finding: 'Drift detection active on all 47 controls. 3 drift events detected and auto-remediated in last 30 days. Mean time to detect: <2 minutes.', remediation: 'N/A', reference: 'NIST CA-7(1) / DORA Art. 9', lastChecked: '2026-03-14T08:30:00Z' },
      { id: 'CCM-03', title: 'ITSM Ticket Auto-Generation', description: 'Failed control checks must auto-generate ITSM tickets (ServiceNow/Jira) with severity, remediation steps, and SLA.', category: 'third_party', severity: 'high', status: 'pass', finding: 'ITSM integration active: failed controls generate tickets via webhook. 12 tickets auto-created this month, 10 resolved within SLA.', remediation: 'N/A', reference: 'ITIL 4 / NIST IR-6', lastChecked: '2026-03-14T08:30:00Z' },
    ],
  },
];

/* ─── Helpers ──────────────────────────────────────────────────────── */

const severityColor: Record<Severity, string> = {
  critical: 'text-red-400 bg-red-900/30 border-red-700/40',
  high: 'text-orange-400 bg-orange-900/30 border-orange-700/40',
  medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/40',
  low: 'text-blue-400 bg-blue-900/30 border-blue-700/40',
  info: 'text-gray-400 bg-gray-800/30 border-gray-700/40',
};

const statusIcon: Record<Status, { icon: typeof CheckCircle2; color: string }> = {
  pass: { icon: CheckCircle2, color: 'text-green-400' },
  fail: { icon: XCircle, color: 'text-red-400' },
  warn: { icon: AlertTriangle, color: 'text-amber-400' },
  not_applicable: { icon: Eye, color: 'text-gray-500' },
};

function scoreGrade(pct: number): { label: string; color: string; bg: string } {
  if (pct >= 90) return { label: 'A', color: 'text-green-400', bg: 'bg-green-900/30 border-green-700/40' };
  if (pct >= 80) return { label: 'B', color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-700/40' };
  if (pct >= 70) return { label: 'C', color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-700/40' };
  if (pct >= 60) return { label: 'D', color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-700/40' };
  return { label: 'F', color: 'text-red-400', bg: 'bg-red-900/30 border-red-700/40' };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  COMPLIANCE REPORT PAGE                                                */
/* ═══════════════════════════════════════════════════════════════════════ */
export default function ComplianceReportPage() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(complianceCategories.map(c => c.id)));
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');

  /* Compute scores */
  const allChecks = useMemo(() => complianceCategories.flatMap(c => c.checks), []);

  const filteredChecks = useMemo(() => {
    return allChecks.filter(ch => {
      if (severityFilter !== 'all' && ch.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && ch.status !== statusFilter) return false;
      return true;
    });
  }, [allChecks, severityFilter, statusFilter]);

  const totalChecks = allChecks.length;
  const passCount = allChecks.filter(c => c.status === 'pass').length;
  const failCount = allChecks.filter(c => c.status === 'fail').length;
  const warnCount = allChecks.filter(c => c.status === 'warn').length;
  const scorePct = Math.round((passCount / totalChecks) * 100);
  const grade = scoreGrade(scorePct);

  const criticalFails = allChecks.filter(c => c.status === 'fail' && c.severity === 'critical');
  const highFails = allChecks.filter(c => c.status === 'fail' && c.severity === 'high');

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleCheck = (id: string) => {
    setExpandedChecks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} className="text-green-400" />
          <div>
            <h1 className="text-xl font-semibold">Compliance Check Report</h1>
            <p className="text-sm text-gray-500">Security posture assessment — similar to FortiGate Security Rating</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-sm transition-colors overflow-x-auto">
            <RefreshCw size={14} /> Re-scan
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-sm transition-colors overflow-x-auto">
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* Score overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Overall grade */}
        <div className={`col-span-1 p-5 rounded-xl border ${grade.bg} text-center`}>
          <div className={`text-5xl font-black ${grade.color}`}>{grade.label}</div>
          <div className="text-sm text-gray-400 mt-1">{scorePct}% Compliant</div>
          <div className="text-[10px] text-gray-600 mt-0.5">{totalChecks} checks evaluated</div>
        </div>

        {/* Status breakdown */}
        <div className="col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-green-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Passed</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{passCount}</div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2">
              <div className="h-full bg-green-500/60 rounded-full" style={{ width: `${(passCount / totalChecks) * 100}%` }} />
            </div>
          </div>
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={16} className="text-red-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Failed</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{failCount}</div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2">
              <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${(failCount / totalChecks) * 100}%` }} />
            </div>
          </div>
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-amber-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Warnings</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">{warnCount}</div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2">
              <div className="h-full bg-amber-500/60 rounded-full" style={{ width: `${(warnCount / totalChecks) * 100}%` }} />
            </div>
          </div>
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={16} className="text-orange-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Critical Issues</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">{criticalFails.length + highFails.length}</div>
            <div className="text-[10px] text-gray-500 mt-1">{criticalFails.length} critical, {highFails.length} high</div>
          </div>
        </div>
      </div>

      {/* Per-category score bars */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-blue-400" />
          Category Scores
        </h3>
        <div className="space-y-3">
          {complianceCategories.map(cat => {
            const catPass = cat.checks.filter(c => c.status === 'pass').length;
            const catPct = Math.round((catPass / cat.checks.length) * 100);
            const catGrade = scoreGrade(catPct);
            const CatIcon = cat.icon;
            return (
              <div key={cat.id} className="flex items-center gap-3">
                <CatIcon size={14} className="text-gray-500 w-4 flex-shrink-0" />
                <span className="text-sm text-gray-300 w-52 truncate">{cat.label}</span>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      catPct >= 90 ? 'bg-green-500/60' :
                      catPct >= 70 ? 'bg-yellow-500/60' :
                      catPct >= 50 ? 'bg-orange-500/60' : 'bg-red-500/60'
                    }`}
                    style={{ width: `${catPct}%` }}
                  />
                </div>
                <span className={`text-sm font-bold w-8 text-right ${catGrade.color}`}>{catPct}%</span>
                <span className="text-xs text-gray-500 w-16 text-right">{catPass}/{cat.checks.length}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Severity:</span>
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map(s => (
            <button key={s} onClick={() => setSeverityFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                severityFilter === s
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-gray-800" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Status:</span>
          {(['all', 'pass', 'fail', 'warn'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                statusFilter === s
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}>
              {s === 'all' ? 'All' : s === 'pass' ? 'Pass' : s === 'fail' ? 'Fail' : 'Warning'}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed findings */}
      <div className="space-y-3">
        {complianceCategories.map(cat => {
          const catChecks = cat.checks.filter(ch => filteredChecks.includes(ch));
          if (catChecks.length === 0) return null;
          const CatIcon = cat.icon;
          const isExpanded = expandedCategories.has(cat.id);
          const catPass = cat.checks.filter(c => c.status === 'pass').length;

          return (
            <div key={cat.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors"
              >
                {isExpanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                <CatIcon size={16} className="text-blue-400" />
                <span className="text-sm font-semibold flex-1 text-left">{cat.label}</span>
                <span className="text-xs text-gray-500">{catPass}/{cat.checks.length} passed</span>
                <div className="flex gap-1 ml-2">
                  {cat.checks.filter(c => c.status === 'fail').length > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 text-[10px] font-medium">
                      {cat.checks.filter(c => c.status === 'fail').length} fail
                    </span>
                  )}
                  {cat.checks.filter(c => c.status === 'warn').length > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 text-[10px] font-medium">
                      {cat.checks.filter(c => c.status === 'warn').length} warn
                    </span>
                  )}
                </div>
              </button>

              {/* Check rows */}
              {isExpanded && (
                <div className="border-t border-gray-800/60">
                  {catChecks.map(check => {
                    const StatusIcon = statusIcon[check.status].icon;
                    const isCheckExpanded = expandedChecks.has(check.id);
                    return (
                      <div key={check.id} className="border-b border-gray-800/30 last:border-0">
                        <button
                          onClick={() => toggleCheck(check.id)}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-800/20 transition-colors text-left"
                        >
                          <StatusIcon size={16} className={statusIcon[check.status].color} />
                          <span className="text-xs font-mono text-gray-500 w-16">{check.id}</span>
                          <span className="text-sm text-gray-200 flex-1">{check.title}</span>
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${severityColor[check.severity]}`}>
                            {check.severity.toUpperCase()}
                          </span>
                          {isCheckExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                        </button>

                        {/* Expanded detail */}
                        {isCheckExpanded && (
                          <div className="px-5 pb-4 ml-[68px] space-y-3 text-sm">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-gray-600">Description</span>
                              <p className="text-gray-400 mt-0.5">{check.description}</p>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-gray-600">Finding</span>
                              <p className={`mt-0.5 ${check.status === 'pass' ? 'text-green-300/80' : check.status === 'fail' ? 'text-red-300/80' : 'text-amber-300/80'}`}>
                                {check.finding}
                              </p>
                            </div>
                            {check.status !== 'pass' && (
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-gray-600">Remediation</span>
                                <p className="text-blue-300/80 mt-0.5">{check.remediation}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-6 pt-1">
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-gray-600">Reference</span>
                                <p className="text-gray-500 text-xs mt-0.5 font-mono">{check.reference}</p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-gray-600">Last Checked</span>
                                <p className="text-gray-500 text-xs mt-0.5">{new Date(check.lastChecked).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Compliance frameworks summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Layers size={16} className="text-purple-400" />
          Framework Coverage
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'NIST 800-53 Rev.5', controls: 345, implemented: 325, badge: 'FedRAMP Moderate' },
            { name: 'CIS Benchmarks v8', controls: 153, implemented: 141, badge: 'Level 2' },
            { name: 'SOC 2 Type II', controls: 64, implemented: 62, badge: 'Trust Services' },
            { name: 'PCI-DSS 4.0', controls: 78, implemented: 74, badge: 'SAQ-D' },
            { name: 'ISO 27001:2022', controls: 93, implemented: 88, badge: 'Annex A' },
            { name: 'GDPR', controls: 42, implemented: 40, badge: 'Art. 32' },
          ].map(fw => {
            const fwPct = Math.round((fw.implemented / fw.controls) * 100);
            return (
              <div key={fw.name} className="p-3 bg-gray-800/30 border border-gray-700/40 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-200">{fw.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-400 text-[10px]">{fw.badge}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${fwPct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{fwPct}%</span>
                </div>
                <span className="text-[10px] text-gray-600">{fw.implemented}/{fw.controls} controls</span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-gray-700 text-center">
        Report generated {new Date().toLocaleString()} · ApexAegis Security Service Edge · Continuous compliance monitoring
      </p>
    </div>
  );
}
