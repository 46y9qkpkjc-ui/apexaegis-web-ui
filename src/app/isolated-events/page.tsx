'use client';
import { useEffect, useState, useCallback, type ReactNode, type ElementType } from 'react';
import { clsx } from 'clsx';
import {
  ShieldOff,
  RefreshCw,
  Play,
  X,
  Timer,
  AlertTriangle,
  FileText,
  Clock,
  Fingerprint,
  Cpu,
  Network,
  Crosshair,
  Wrench,
  ListChecks,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Isolated Events — contained/quarantined endpoints + forensic playbook report.
// FRONTEND DEMO DATA ONLY. No backend calls; mirrors the endpoint-events look.
// ---------------------------------------------------------------------------

type IsoStatus = 'Contained' | 'Isolating' | 'Released';
type Severity = 'Critical' | 'High' | 'Medium';

// Status chip palette — matches the reference chip styling exactly.
const statusChip: Record<IsoStatus, string> = {
  Contained: 'text-amber-400 border-amber-800 bg-amber-900/20',
  Isolating: 'text-cyan-400 border-cyan-800 bg-cyan-900/20',
  Released: 'text-green-400 border-green-800 bg-green-900/20',
};

// Severity dot (small leading indicator on the reason cell).
const sevDot: Record<Severity, string> = {
  Critical: 'bg-red-500',
  High: 'bg-amber-500',
  Medium: 'bg-yellow-600',
};

const signedChip = (signed: boolean) =>
  signed
    ? 'text-green-400 border-green-800 bg-green-900/20'
    : 'text-red-400 border-red-800 bg-red-900/20';

const verdictChip = (v: string) =>
  /block|deny/i.test(v)
    ? 'text-red-400 border-red-800 bg-red-900/20'
    : 'text-green-400 border-green-800 bg-green-900/20';

// Copied verbatim from endpoint-events/page.tsx.
function timeAgo(iso: string): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return iso;
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimelineEvent {
  time: string;
  text: string;
}
interface Proc {
  name: string;
  pid: number;
  path: string;
  signed: boolean;
}
interface NetConn {
  dest: string;
  port: number;
  bytes: string;
  verdict: string;
}
interface Mitre {
  id: string;
  name: string;
}
interface ForensicReport {
  summary: string[];
  timeline: TimelineEvent[];
  iocs: { domains: string[]; hashes: string[]; ips: string[] };
  processes: Proc[];
  connections: NetConn[];
  mitre: Mitre[];
  responses: string[];
  nextSteps: string[];
  generatedAt: string;
}
interface IsolatedEndpoint {
  id: string;
  device: string;
  user: string;
  reason: string;
  severity: Severity;
  minutesAgo: number;
  isolatedAt: string; // ISO, computed client-side
  status: IsoStatus;
  report: ForensicReport;
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

function buildRows(): IsolatedEndpoint[] {
  const now = Date.now();
  const iso = (min: number) => new Date(now - min * 60_000).toISOString();

  const seed: Omit<IsolatedEndpoint, 'isolatedAt'>[] = [
    {
      id: 'steven-laptop',
      device: 'steven-laptop',
      user: 'steven.tan',
      reason: 'Autonomous data-exfil + C2 beacon (pastebin-ai.com)',
      severity: 'Critical',
      minutesAgo: 12,
      status: 'Contained',
      report: {
        summary: [
          'At 08:14 SGT, ApexAegis XDR detected steven-laptop (steven.tan, Sales) autonomously staging and exfiltrating ~2.3 GB of CRM and finance data to an AI paste service (pastebin-ai.com) while beaconing to an external command-and-control host over HTTPS — with no interactive user session at the console.',
          'The behaviour matched an autonomous data-exfiltration + C2 pattern; the DNS-PEP risk engine scored the destination 88/100 (deny band). The endpoint was isolated 42 seconds after first detection, the offending process was terminated, and the device session token was revoked.',
          'No lateral movement, credential access, or additional affected hosts were observed. Blast radius is assessed as contained to this single endpoint pending forensic snapshot review.',
        ],
        timeline: [
          { time: '08:14:03', text: 'Anomalous outbound TLS to pastebin-ai.com (185.199.108.153) flagged by the DNS-PEP risk engine (score 88/100).' },
          { time: '08:14:07', text: 'Process svc_host32.exe (unsigned, %TEMP%) spawned by powershell.exe with a base64-encoded command line.' },
          { time: '08:14:11', text: '2.31 GB read across the CRM export and finance shares; archive crm_dump.7z created in %TEMP%.' },
          { time: '08:14:19', text: 'Repeating 60s HTTPS beacon to C2 45.137.21.88:443 — JA3 fingerprint matched a known implant family.' },
          { time: '08:14:38', text: 'Data-exfiltration verdict = DENY (65–100 band); autonomous containment playbook triggered.' },
          { time: '08:14:45', text: 'NIC isolated to quarantine VLAN, svc_host32.exe (PID 6624) killed, agent session token revoked, forensic snapshot captured.' },
        ],
        iocs: {
          domains: ['pastebin-ai.com', 'cdn.telemetry-sync[.]net'],
          hashes: [
            '9f2c1b7e4a3d5f608c1e2b3a4d5f6071293a4b5c6d7e8f9012a3b4c5d6e7f8a9',
            'a1b2c3d4e5f60718293a4b5c6d7e8f900a1b2c3d4e5f60718293a4b5c6d7e8f9',
          ],
          ips: ['185.199.108.153', '45.137.21.88'],
        },
        processes: [
          { name: 'svc_host32.exe', pid: 6624, path: 'C:\\Users\\steven.tan\\AppData\\Local\\Temp\\svc_host32.exe', signed: false },
          { name: 'powershell.exe', pid: 5120, path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', signed: true },
          { name: 'rundll32.exe', pid: 6712, path: 'C:\\Windows\\System32\\rundll32.exe', signed: true },
        ],
        connections: [
          { dest: 'pastebin-ai.com (185.199.108.153)', port: 443, bytes: '2.31 GB', verdict: 'Blocked · exfil' },
          { dest: '45.137.21.88', port: 443, bytes: '48 KB', verdict: 'Blocked · C2 beacon' },
          { dest: 'crm-internal.aspire.local', port: 445, bytes: '2.28 GB', verdict: 'Allowed · source read' },
          { dest: 'api.apexaegis.app', port: 443, bytes: '12 KB', verdict: 'Allowed · agent telemetry' },
        ],
        mitre: [
          { id: 'T1041', name: 'Exfiltration Over C2 Channel' },
          { id: 'T1071.001', name: 'Application Layer Protocol: Web Protocols' },
          { id: 'T1567.002', name: 'Exfiltration to Cloud Storage' },
          { id: 'T1059.001', name: 'Command and Scripting Interpreter: PowerShell' },
          { id: 'T1560.001', name: 'Archive Collected Data: Archive via Utility' },
          { id: 'T1005', name: 'Data from Local System' },
        ],
        responses: [
          'Isolated the network interface into the host-quarantine VLAN (08:14:45).',
          'Terminated the offending process svc_host32.exe (PID 6624) and its child processes.',
          'Revoked the agent session token and forced device re-authentication.',
          'Blocked pastebin-ai.com and C2 45.137.21.88 tenant-wide at the DNS-PEP.',
          'Captured a forensic snapshot (volatile memory + %TEMP% + full process tree) to the evidence store.',
          'Opened incident INC-2026-0823-014 and paged the on-call responder.',
        ],
        nextSteps: [
          'Re-image steven-laptop from the known-good gold image before returning it to service.',
          'Rotate steven.tan credentials and revoke all active OAuth / refresh tokens.',
          'Review CRM and finance access logs for the 2.3 GB pulled; engage the data-protection officer if PII is in scope.',
          'Hunt tenant-wide for the C2 JA3 fingerprint and the svc_host32.exe SHA-256.',
          'Keep the endpoint isolated until forensic snapshot review is complete.',
        ],
        generatedAt: '2026-08-23 08:15:02 SGT',
      },
    },
    {
      id: 'finance-ws-07',
      device: 'finance-ws-07',
      user: 'nurul.aziz',
      reason: 'Ransomware canary tripped — mass file rename (.locked)',
      severity: 'High',
      minutesAgo: 28,
      status: 'Contained',
      report: {
        summary: [
          'Deployed canary files on finance-ws-07 were renamed to the .locked extension at a rate consistent with ransomware staging; the unsigned binary winupd.exe was enumerating local and mapped shares.',
          'The endpoint was isolated 38 seconds after the first canary trip. Encryption did not spread beyond the local profile and no mapped file server was reached.',
        ],
        timeline: [
          { time: '07:58:41', text: 'Canary files in C:\\Users\\nurul.aziz\\Documents renamed to *.locked (12 files in 4s).' },
          { time: '07:58:49', text: 'winupd.exe (unsigned, %APPDATA%) observed enumerating shares and shadow copies.' },
          { time: '07:59:19', text: 'Containment playbook triggered — NIC isolated, winupd.exe terminated, snapshot captured.' },
        ],
        iocs: {
          domains: ['pay-decrypt[.]top'],
          hashes: ['b4d5e6f78a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d'],
          ips: ['91.219.236.14'],
        },
        processes: [
          { name: 'winupd.exe', pid: 4820, path: 'C:\\Users\\nurul.aziz\\AppData\\Roaming\\winupd.exe', signed: false },
          { name: 'vssadmin.exe', pid: 4912, path: 'C:\\Windows\\System32\\vssadmin.exe', signed: true },
        ],
        connections: [
          { dest: '91.219.236.14 (pay-decrypt[.]top)', port: 443, bytes: '6 KB', verdict: 'Blocked · ransom callback' },
        ],
        mitre: [
          { id: 'T1486', name: 'Data Encrypted for Impact' },
          { id: 'T1083', name: 'File and Directory Discovery' },
          { id: 'T1490', name: 'Inhibit System Recovery' },
        ],
        responses: [
          'Isolated the network interface into the host-quarantine VLAN.',
          'Terminated winupd.exe and blocked shadow-copy deletion.',
          'Blocked pay-decrypt[.]top tenant-wide at the DNS-PEP.',
          'Captured a forensic snapshot and opened incident INC-2026-0823-011.',
        ],
        nextSteps: [
          'Restore the affected profile from the last clean backup and verify integrity.',
          'Confirm no mapped file server was encrypted before releasing isolation.',
          'Rotate nurul.aziz credentials as a precaution.',
        ],
        generatedAt: '2026-08-23 07:59:33 SGT',
      },
    },
    {
      id: 'hr-vdi-03',
      device: 'hr-vdi-03',
      user: 'priya.nair',
      reason: 'Lateral movement — SMB brute force to 14 hosts',
      severity: 'High',
      minutesAgo: 34,
      status: 'Isolating',
      report: {
        summary: [
          'The hr-vdi-03 session attempted SMB authentication against 14 internal hosts within 90 seconds — behaviour consistent with credential spraying / lateral movement.',
          'Isolation is in progress; SMB egress from the session is already throttled and blocked while the forensic snapshot is captured.',
        ],
        timeline: [
          { time: '07:52:10', text: 'svc.exe (unsigned) initiated outbound SMB to 10.20.4.0/24 range.' },
          { time: '07:52:44', text: 'Failed SMB auth to 14 distinct hosts on 445 within 90s (spray pattern).' },
          { time: '07:53:31', text: 'Containment playbook triggered — SMB egress blocked, isolation in progress.' },
        ],
        iocs: {
          domains: [],
          hashes: ['d6e7f8a90b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e'],
          ips: ['10.20.4.11', '10.20.4.19', '10.20.4.27'],
        },
        processes: [
          { name: 'svc.exe', pid: 3310, path: 'C:\\ProgramData\\svc.exe', signed: false },
          { name: 'net.exe', pid: 3388, path: 'C:\\Windows\\System32\\net.exe', signed: true },
        ],
        connections: [
          { dest: '10.20.4.11', port: 445, bytes: '18 KB', verdict: 'Blocked · SMB spray' },
          { dest: '10.20.4.19', port: 445, bytes: '17 KB', verdict: 'Blocked · SMB spray' },
        ],
        mitre: [
          { id: 'T1021.002', name: 'Remote Services: SMB / Windows Admin Shares' },
          { id: 'T1110.003', name: 'Brute Force: Password Spraying' },
        ],
        responses: [
          'Blocked SMB egress from the VDI session and throttled the session.',
          'Isolation into the host-quarantine VLAN in progress.',
          'Forensic snapshot capture pending; incident INC-2026-0823-009 opened.',
        ],
        nextSteps: [
          'Reset priya.nair credentials and review domain controller auth logs.',
          'Confirm no host accepted the sprayed credentials.',
          'Complete isolation and snapshot before restoring the VDI session.',
        ],
        generatedAt: '2026-08-23 07:53:40 SGT',
      },
    },
    {
      id: 'dev-mac-samuel',
      device: 'dev-mac-samuel',
      user: 'samuel.lim',
      reason: 'Credential theft — keychain dump attempt (unsigned binary)',
      severity: 'Medium',
      minutesAgo: 120,
      status: 'Released',
      report: {
        summary: [
          'An unsigned Mach-O binary on dev-mac-samuel attempted to read the login keychain and scrape credential material from memory. The attempt was blocked by the endpoint agent and the device was isolated for review.',
          'Snapshot review found no credentials were exfiltrated; the endpoint was cleaned and released back to service.',
        ],
        timeline: [
          { time: '06:06:12', text: 'helperd (unsigned Mach-O) attempted access to the login keychain.' },
          { time: '06:06:15', text: 'Credential-store access blocked by the endpoint agent; device isolated.' },
          { time: '06:41:02', text: 'Snapshot review clean — no exfiltration; endpoint released to service.' },
        ],
        iocs: {
          domains: ['paste.devnull[.]sh'],
          hashes: ['c5d6e7f89a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d'],
          ips: ['104.21.7.42'],
        },
        processes: [
          { name: 'helperd', pid: 2044, path: '/Users/samuel.lim/Library/Application Support/.helperd', signed: false },
          { name: 'security', pid: 2051, path: '/usr/bin/security', signed: true },
        ],
        connections: [
          { dest: 'paste.devnull[.]sh (104.21.7.42)', port: 443, bytes: '0 B', verdict: 'Blocked · pre-exfil' },
        ],
        mitre: [
          { id: 'T1555.001', name: 'Credentials from Password Stores: Keychain' },
          { id: 'T1552', name: 'Unsecured Credentials' },
        ],
        responses: [
          'Isolated the endpoint and terminated the helperd process.',
          'Revoked the agent session token and captured a forensic snapshot.',
          'Released the endpoint after a clean snapshot review.',
        ],
        nextSteps: [
          'Rotate samuel.lim credentials as a precaution.',
          'Continue elevated monitoring on the endpoint for 72 hours.',
        ],
        generatedAt: '2026-08-23 06:41:20 SGT',
      },
    },
    {
      id: 'sales-lt-19',
      device: 'sales-lt-19',
      user: 'daniel.wong',
      reason: 'Suspicious PowerShell — encoded downloader (Emotet-like)',
      severity: 'High',
      minutesAgo: 300,
      status: 'Contained',
      report: {
        summary: [
          'PowerShell on sales-lt-19 ran a base64-encoded command that attempted to fetch a second-stage payload from a low-reputation domain — a delivery pattern consistent with Emotet-family loaders.',
          'The download was blocked at the secure web gateway and the endpoint was isolated before any payload executed.',
        ],
        timeline: [
          { time: '03:12:55', text: 'powershell.exe launched with a -EncodedCommand downloader stub.' },
          { time: '03:12:58', text: 'Outbound request to update-cdn[.]xyz blocked at the SWG (low reputation).' },
          { time: '03:13:20', text: 'Containment playbook triggered — endpoint isolated, process killed, snapshot captured.' },
        ],
        iocs: {
          domains: ['update-cdn[.]xyz'],
          hashes: ['e7f8a9b01c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f'],
          ips: ['193.42.33.14'],
        },
        processes: [
          { name: 'powershell.exe', pid: 7120, path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', signed: true },
          { name: 'mshta.exe', pid: 7188, path: 'C:\\Windows\\System32\\mshta.exe', signed: true },
        ],
        connections: [
          { dest: 'update-cdn[.]xyz (193.42.33.14)', port: 443, bytes: '3 KB', verdict: 'Blocked · payload fetch' },
        ],
        mitre: [
          { id: 'T1059.001', name: 'Command and Scripting Interpreter: PowerShell' },
          { id: 'T1105', name: 'Ingress Tool Transfer' },
        ],
        responses: [
          'Isolated the network interface into the host-quarantine VLAN.',
          'Terminated the PowerShell process and blocked update-cdn[.]xyz tenant-wide.',
          'Captured a forensic snapshot and opened incident INC-2026-0823-002.',
        ],
        nextSteps: [
          'Re-image sales-lt-19 before returning it to service.',
          'Hunt tenant-wide for the update-cdn[.]xyz domain and the payload hash.',
        ],
        generatedAt: '2026-08-23 03:13:31 SGT',
      },
    },
  ];

  return seed.map((r) => ({ ...r, isolatedAt: iso(r.minutesAgo) }));
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function Section({ icon: Icon, title, children }: { icon: ElementType; title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-wider text-gray-500 flex items-center gap-1.5 mb-2">
        <Icon size={13} /> {title}
      </h3>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function IsolatedEventsPage() {
  const [rows, setRows] = useState<IsolatedEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  // Timestamps are computed client-side (Date.now) to avoid SSR/CSR drift.
  const load = useCallback(() => {
    setRows(buildRows());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Escape closes the report modal.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId]);

  const openRow = rows.find((r) => r.id === openId) || null;
  const activeCount = rows.filter((r) => r.status !== 'Released').length;

  const kpis: { label: string; value: string; sub: string; icon: ElementType; tone: string }[] = [
    { label: 'Isolated endpoints', value: loading ? '—' : String(activeCount), sub: 'currently contained', icon: ShieldOff, tone: 'text-red-400' },
    { label: 'Playbooks run (24h)', value: '12', sub: '4 automated · 8 analyst-run', icon: Play, tone: 'text-cyan-400' },
    { label: 'Mean time to contain', value: '3m 42s', sub: 'detection → isolation', icon: Timer, tone: 'text-amber-400' },
    { label: 'Open incidents', value: '3', sub: '1 critical · 2 high', icon: AlertTriangle, tone: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldOff className="text-cyan-400" size={24} /> Isolated Events
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Contained and quarantined endpoints. Run the forensic playbook to review the full incident report.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 rounded-lg text-xs"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-gray-500">{k.label}</span>
              <k.icon size={16} className={k.tone} />
            </div>
            <div className="text-2xl font-bold mt-2">{k.value}</div>
            <div className="text-[11px] text-gray-500 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Isolated endpoints table */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="text-left font-medium px-4 py-2">Device</th>
                <th className="text-left font-medium px-4 py-2">User</th>
                <th className="text-left font-medium px-4 py-2">Reason</th>
                <th className="text-left font-medium px-4 py-2">Isolated</th>
                <th className="text-left font-medium px-4 py-2">Status</th>
                <th className="text-right font-medium px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No isolated endpoints for this tenant right now
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-2.5 font-mono text-[12px] text-gray-200">{r.device}</td>
                  <td className="px-4 py-2.5 text-gray-300">{r.user}</td>
                  <td className="px-4 py-2.5 text-gray-300">
                    <span className="flex items-center gap-2">
                      <span className={clsx('inline-block w-1.5 h-1.5 rounded-full shrink-0', sevDot[r.severity])} />
                      {r.reason}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-[12px]">{timeAgo(r.isolatedAt)}</td>
                  <td className="px-4 py-2.5">
                    <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border', statusChip[r.status])}>{r.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => setOpenId(r.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 rounded-lg text-xs"
                    >
                      <Play size={12} /> Run playbook
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic report modal */}
      {openRow && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setOpenId(null)}
        >
          <div
            className="relative w-full max-w-3xl my-8 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText size={18} className="text-cyan-400" /> Forensic Playbook Report
                </h2>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-gray-300">{openRow.device}</span>
                  <span className="text-gray-600">·</span>
                  <span>{openRow.user}</span>
                  <span className="text-gray-600">·</span>
                  <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border', statusChip[openRow.status])}>{openRow.status}</span>
                </p>
              </div>
              <button
                onClick={() => setOpenId(null)}
                aria-label="Close report"
                className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-5 py-5 space-y-6 text-sm">
              <Section icon={FileText} title="Executive summary">
                <div className="space-y-2 text-gray-300 leading-relaxed">
                  {openRow.report.summary.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </Section>

              <Section icon={Clock} title="Incident timeline">
                <ol className="space-y-2">
                  {openRow.report.timeline.map((e, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-mono text-[12px] text-cyan-400 shrink-0 w-[68px]">{e.time}</span>
                      <span className="text-gray-300">{e.text}</span>
                    </li>
                  ))}
                </ol>
              </Section>

              <Section icon={Fingerprint} title="Indicators of compromise">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1.5">Domains</div>
                    <div className="space-y-1">
                      {openRow.report.iocs.domains.length === 0 && <div className="text-gray-600 text-[12px]">—</div>}
                      {openRow.report.iocs.domains.map((d) => (
                        <div key={d} className="font-mono text-[12px] text-red-300 break-all">{d}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1.5">File hashes (SHA-256)</div>
                    <div className="space-y-1">
                      {openRow.report.iocs.hashes.map((h) => (
                        <div key={h} className="font-mono text-[11px] text-gray-400 break-all">{h}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1.5">IP addresses</div>
                    <div className="space-y-1">
                      {openRow.report.iocs.ips.map((ip) => (
                        <div key={ip} className="font-mono text-[12px] text-gray-300 break-all">{ip}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              <Section icon={Cpu} title="Suspicious processes">
                <div className="overflow-x-auto rounded-lg border border-gray-800">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-gray-600 border-b border-gray-800">
                        <th className="text-left font-medium px-3 py-1.5">Process</th>
                        <th className="text-left font-medium px-3 py-1.5">PID</th>
                        <th className="text-left font-medium px-3 py-1.5">Path</th>
                        <th className="text-left font-medium px-3 py-1.5">Signed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openRow.report.processes.map((p) => (
                        <tr key={p.pid} className="border-b border-gray-800/50">
                          <td className="px-3 py-1.5 font-mono text-gray-200 whitespace-nowrap">{p.name}</td>
                          <td className="px-3 py-1.5 font-mono text-gray-400">{p.pid}</td>
                          <td className="px-3 py-1.5 font-mono text-gray-500 break-all">{p.path}</td>
                          <td className="px-3 py-1.5">
                            <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border whitespace-nowrap', signedChip(p.signed))}>
                              {p.signed ? 'Signed' : 'Unsigned'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section icon={Network} title="Network connections">
                <div className="overflow-x-auto rounded-lg border border-gray-800">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-gray-600 border-b border-gray-800">
                        <th className="text-left font-medium px-3 py-1.5">Destination</th>
                        <th className="text-left font-medium px-3 py-1.5">Port</th>
                        <th className="text-right font-medium px-3 py-1.5">Bytes</th>
                        <th className="text-left font-medium px-3 py-1.5">Verdict</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openRow.report.connections.map((c, i) => (
                        <tr key={i} className="border-b border-gray-800/50">
                          <td className="px-3 py-1.5 font-mono text-gray-300 break-all">{c.dest}</td>
                          <td className="px-3 py-1.5 font-mono text-gray-400">{c.port}</td>
                          <td className="px-3 py-1.5 font-mono text-gray-300 text-right whitespace-nowrap">{c.bytes}</td>
                          <td className="px-3 py-1.5">
                            <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border whitespace-nowrap', verdictChip(c.verdict))}>
                              {c.verdict}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section icon={Crosshair} title="MITRE ATT&CK techniques">
                <div className="flex flex-wrap gap-2">
                  {openRow.report.mitre.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 px-2 py-1 rounded-lg border border-gray-800 bg-gray-800/30 text-[12px]">
                      <span className="font-mono text-cyan-400">{m.id}</span>
                      <span className="text-gray-300">{m.name}</span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section icon={Wrench} title="Automated response actions taken">
                <ul className="space-y-1.5">
                  {openRow.report.responses.map((a, i) => (
                    <li key={i} className="flex gap-2 text-gray-300">
                      <ShieldCheck size={14} className="text-green-400 shrink-0 mt-0.5" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section icon={ListChecks} title="Recommended next steps">
                <ul className="space-y-1.5">
                  {openRow.report.nextSteps.map((s, i) => (
                    <li key={i} className="flex gap-2 text-gray-300">
                      <ArrowRight size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>

            {/* Modal footer */}
            <div className="border-t border-gray-800 px-5 py-3 text-[11px] text-gray-500">
              Forensic report generated by ApexAegis XDR · <span className="font-mono text-gray-400">{openRow.device}</span> ·{' '}
              {openRow.report.generatedAt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
