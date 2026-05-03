'use client';
import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import {
  Wifi, WifiOff, Cable, Signal, SignalHigh, SignalLow, SignalZero,
  Shield, ShieldAlert, ShieldCheck, ShieldX, Lock, Unlock,
  Activity, BarChart3, ArrowUpDown, Globe, Smartphone,
  ChevronDown, ChevronRight, RefreshCw, Search, Filter,
  AlertTriangle, CheckCircle2, XCircle, Info, Zap,
  MonitorSmartphone, Radio, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
interface WifiInfo {
  ssid: string;
  bssid: string;
  band: '2.4 GHz' | '5 GHz' | '6 GHz';
  channel: number;
  protocol: 'Wi-Fi 4 (802.11n)' | 'Wi-Fi 5 (802.11ac)' | 'Wi-Fi 6 (802.11ax)' | 'Wi-Fi 6E' | 'Wi-Fi 7 (802.11be)';
  security: 'WPA3-Enterprise' | 'WPA3-Personal' | 'WPA2-Enterprise' | 'WPA2-Personal' | 'WEP' | 'Open';
  signalDbm: number;
  noiseDbn: number;
  linkSpeedMbps: number;
  txRate: number;
  rxRate: number;
}

interface Dot1xStatus {
  enabled: boolean;
  method: 'EAP-TLS' | 'PEAP-MSCHAPv2' | 'EAP-TTLS' | 'EAP-FAST' | 'none';
  identity: string;
  certExpiry: string;
  authState: 'authenticated' | 'authenticating' | 'failed' | 'not-configured';
  lastAuth: string;
  sgtAssigned: number;
  radiusServer: string;
}

interface WifiVulnerability {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  cve?: string;
  mitigation: string;
  detected: boolean;
}

interface BandwidthMetrics {
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  jitterMs: number;
  packetLossPct: number;
  mtuBytes: number;
}

interface TunnelConnection {
  id: string;
  type: 'MASQUE Connect-IP' | 'QUIC Tunnel' | 'WireGuard' | 'IPSec';
  interface: 'wifi' | 'cellular';
  status: 'connected' | 'connecting' | 'standby' | 'failed';
  protocolVersion: string;
  serverEndpoint: string;
  localIP: string;
  assignedIP: string;
  uptime: string;
  bytesSent: number;
  bytesRecv: number;
  currentBandwidthMbps: number;
  latencyMs: number;
  jitterMs: number;
  packetLossPct: number;
  handshakeTime: number;
  rttMs: number;
  congestionAlgo: string;
}

interface CellularInfo {
  carrier: string;
  technology: '5G-SA' | '5G-NSA' | '4G-LTE' | '3G' | 'none';
  band: string;
  rsrp: number;     // Reference Signal Received Power (dBm)
  rsrq: number;     // Reference Signal Received Quality (dB)
  sinr: number;     // Signal-to-Interference-plus-Noise Ratio (dB)
  downloadMbps: number;
  uploadMbps: number;
  apn: string;
  imei: string;
}

interface LastMileProfile {
  timestamp: string;
  wifiLatency: number;
  wifiJitter: number;
  wifiLoss: number;
  wifiBandwidth: number;
  cellLatency: number;
  cellJitter: number;
  cellLoss: number;
  cellBandwidth: number;
  activeInterface: 'wifi' | 'cellular' | 'both';
  masqueHealthy: boolean;
  quicHealthy: boolean;
  overallScore: number; // 0-100
}

interface NetworkEvent {
  id: string;
  timestamp: string;
  type: 'connection' | 'disconnection' | 'roaming' | 'failover' | 'degradation' | 'security' | 'tunnel';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  interface: 'wifi' | 'cellular' | 'tunnel';
  detail: string;
}

/* ─── Demo data ─────────────────────────────────────────────── */
const WIFI_INFO: WifiInfo = {
  ssid: 'CORP-SECURE-5G',
  bssid: 'A4:CF:12:6B:3E:01',
  band: '5 GHz',
  channel: 149,
  protocol: 'Wi-Fi 6 (802.11ax)',
  security: 'WPA3-Enterprise',
  signalDbm: -42,
  noiseDbn: -92,
  linkSpeedMbps: 1201,
  txRate: 1081,
  rxRate: 1201,
};

const DOT1X: Dot1xStatus = {
  enabled: true,
  method: 'EAP-TLS',
  identity: 'user@apexaegis.corp',
  certExpiry: '2027-01-15',
  authState: 'authenticated',
  lastAuth: '2026-03-14 08:02:15',
  sgtAssigned: 110,
  radiusServer: 'radius01.apexaegis.corp',
};

const WIFI_VULNS: WifiVulnerability[] = [
  { id: 'v1', name: 'KRACK Attack', severity: 'high', description: 'Key Reinstallation Attack on WPA2 4-way handshake', cve: 'CVE-2017-13077', mitigation: 'WPA3 in use - mitigated', detected: false },
  { id: 'v2', name: 'DragonBlood', severity: 'medium', description: 'Side-channel and DoS attacks against WPA3-SAE', cve: 'CVE-2019-9494', mitigation: 'AP firmware patched (v3.2.1+)', detected: false },
  { id: 'v3', name: 'FragAttacks', severity: 'high', description: 'Fragmentation and aggregation attacks on Wi-Fi', cve: 'CVE-2020-24588', mitigation: 'Client and AP patched', detected: false },
  { id: 'v4', name: 'Evil Twin AP', severity: 'critical', description: 'Rogue access point mimicking CORP-SECURE-5G detected nearby', mitigation: 'WIDS alert generated — rogue AP at BSSID A4:CF:12:6B:3E:FF', detected: true },
  { id: 'v5', name: 'Deauth Flood', severity: 'medium', description: 'Management frame protection (802.11w) status', mitigation: 'PMF enabled - protected against deauth attacks', detected: false },
  { id: 'v6', name: 'Karma/MANA Attack', severity: 'low', description: 'Probe request sniffing for preferred network discovery', mitigation: 'Random MAC enabled, PNL minimized', detected: false },
  { id: 'v7', name: 'TunnelCrack', severity: 'high', description: 'VPN tunnel traffic leakage via local network routing', cve: 'CVE-2023-36672', mitigation: 'ApexAegis agent enforces strict tunnel — no local breakout', detected: false },
];

const BANDWIDTH: BandwidthMetrics = {
  downloadMbps: 485.2,
  uploadMbps: 124.8,
  latencyMs: 8.2,
  jitterMs: 1.4,
  packetLossPct: 0.01,
  mtuBytes: 1420,
};

const TUNNELS: TunnelConnection[] = [
  {
    id: 't1', type: 'MASQUE Connect-IP', interface: 'wifi', status: 'connected',
    protocolVersion: 'RFC 9484 (Extended Connect)',
    serverEndpoint: 'gw-us-east.apexaegis.cloud:443',
    localIP: '10.10.110.42', assignedIP: '100.64.0.107',
    uptime: '06h 12m 33s',
    bytesSent: 2_847_193_600, bytesRecv: 8_412_506_112,
    currentBandwidthMbps: 412.5, latencyMs: 6.8, jitterMs: 0.9, packetLossPct: 0.003,
    handshakeTime: 48, rttMs: 12.4, congestionAlgo: 'BBRv3',
  },
  {
    id: 't2', type: 'QUIC Tunnel', interface: 'cellular', status: 'connected',
    protocolVersion: 'QUIC v2 (RFC 9369)',
    serverEndpoint: 'gw-us-east.apexaegis.cloud:4433',
    localIP: '172.20.0.8', assignedIP: '100.64.0.108',
    uptime: '06h 12m 33s',
    bytesSent: 184_320_000, bytesRecv: 512_409_600,
    currentBandwidthMbps: 45.2, latencyMs: 24.6, jitterMs: 4.2, packetLossPct: 0.12,
    handshakeTime: 92, rttMs: 38.1, congestionAlgo: 'CUBIC',
  },
];

const CELLULAR: CellularInfo = {
  carrier: 'T-Mobile',
  technology: '5G-NSA',
  band: 'n41 (2.5 GHz)',
  rsrp: -88,
  rsrq: -10,
  sinr: 14.5,
  downloadMbps: 68.4,
  uploadMbps: 22.1,
  apn: 'fast.t-mobile.com',
  imei: '35-XXXX-XXXX-XXXX-X',
};

const LAST_MILE_HISTORY: LastMileProfile[] = [
  { timestamp: '09:15', wifiLatency: 6.2, wifiJitter: 0.8, wifiLoss: 0.00, wifiBandwidth: 510, cellLatency: 22.1, cellJitter: 3.8, cellLoss: 0.08, cellBandwidth: 72, activeInterface: 'wifi', masqueHealthy: true, quicHealthy: true, overallScore: 96 },
  { timestamp: '09:14', wifiLatency: 6.5, wifiJitter: 0.9, wifiLoss: 0.00, wifiBandwidth: 498, cellLatency: 23.4, cellJitter: 4.1, cellLoss: 0.10, cellBandwidth: 68, activeInterface: 'wifi', masqueHealthy: true, quicHealthy: true, overallScore: 95 },
  { timestamp: '09:13', wifiLatency: 7.1, wifiJitter: 1.2, wifiLoss: 0.01, wifiBandwidth: 475, cellLatency: 24.8, cellJitter: 4.5, cellLoss: 0.15, cellBandwidth: 65, activeInterface: 'wifi', masqueHealthy: true, quicHealthy: true, overallScore: 93 },
  { timestamp: '09:12', wifiLatency: 12.8, wifiJitter: 5.2, wifiLoss: 0.42, wifiBandwidth: 180, cellLatency: 22.5, cellJitter: 3.6, cellLoss: 0.05, cellBandwidth: 70, activeInterface: 'both', masqueHealthy: true, quicHealthy: true, overallScore: 72 },
  { timestamp: '09:11', wifiLatency: 45.2, wifiJitter: 18.4, wifiLoss: 2.10, wifiBandwidth: 42, cellLatency: 21.8, cellJitter: 3.2, cellLoss: 0.04, cellBandwidth: 74, activeInterface: 'cellular', masqueHealthy: false, quicHealthy: true, overallScore: 48 },
  { timestamp: '09:10', wifiLatency: 8.1, wifiJitter: 1.1, wifiLoss: 0.00, wifiBandwidth: 490, cellLatency: 25.1, cellJitter: 4.8, cellLoss: 0.12, cellBandwidth: 62, activeInterface: 'wifi', masqueHealthy: true, quicHealthy: true, overallScore: 94 },
  { timestamp: '09:09', wifiLatency: 7.5, wifiJitter: 1.0, wifiLoss: 0.00, wifiBandwidth: 502, cellLatency: 23.9, cellJitter: 4.0, cellLoss: 0.09, cellBandwidth: 66, activeInterface: 'wifi', masqueHealthy: true, quicHealthy: true, overallScore: 95 },
  { timestamp: '09:08', wifiLatency: 6.8, wifiJitter: 0.7, wifiLoss: 0.00, wifiBandwidth: 515, cellLatency: 22.6, cellJitter: 3.5, cellLoss: 0.07, cellBandwidth: 71, activeInterface: 'wifi', masqueHealthy: true, quicHealthy: true, overallScore: 97 },
];

const NETWORK_EVENTS: NetworkEvent[] = [
  { id: 'ne1', timestamp: '09:15:02', type: 'connection', severity: 'info', message: 'MASQUE tunnel recovered — WiFi stable', interface: 'wifi', detail: 'Reconnected to gw-us-east via MASQUE Connect-IP after 48ms handshake.' },
  { id: 'ne2', timestamp: '09:12:45', type: 'failover', severity: 'warning', message: 'Automatic failover to cellular (QUIC)', interface: 'cellular', detail: 'WiFi degradation detected (loss >0.4%). Traffic shifted to QUIC tunnel over cellular. Seamless transition — no packet loss during failover.' },
  { id: 'ne3', timestamp: '09:11:30', type: 'degradation', severity: 'critical', message: 'WiFi severe degradation — AP congestion detected', interface: 'wifi', detail: 'Latency spike to 45ms, packet loss 2.1%. Root cause: channel 149 congestion (12 clients on same AP). MASQUE tunnel marked unhealthy.' },
  { id: 'ne4', timestamp: '09:11:00', type: 'security', severity: 'critical', message: 'Evil Twin AP detected — BSSID A4:CF:12:6B:3E:FF', interface: 'wifi', detail: 'Rogue AP broadcasting SSID "CORP-SECURE-5G" with different BSSID. Signal strength -38 dBm (stronger than legitimate AP). WIDS alert dispatched. Agent blocked association attempt.' },
  { id: 'ne5', timestamp: '09:08:15', type: 'tunnel', severity: 'info', message: 'QUIC tunnel 0-RTT reconnection successful', interface: 'cellular', detail: '0-RTT resume via cached TLS session. Connection time: 12ms. Cellular interface n41 band at -88 dBm.' },
  { id: 'ne6', timestamp: '08:02:18', type: 'connection', severity: 'info', message: '802.1X EAP-TLS authentication completed', interface: 'wifi', detail: 'Certificate-based auth to RADIUS radius01.apexaegis.corp. SGT 110 assigned. PMF (802.11w) enabled.' },
  { id: 'ne7', timestamp: '08:01:55', type: 'connection', severity: 'info', message: 'Connected to CORP-SECURE-5G (Wi-Fi 6)', interface: 'wifi', detail: 'Associated with AP BSSID A4:CF:12:6B:3E:01 on channel 149 (5 GHz). Link speed 1201 Mbps. WPA3-Enterprise.' },
  { id: 'ne8', timestamp: '07:58:30', type: 'roaming', severity: 'info', message: '802.11r fast BSS transition complete', interface: 'wifi', detail: 'Roamed from AP A4:CF:12:6B:3D:F8 (ch 36) to A4:CF:12:6B:3E:01 (ch 149). Transition time: 8ms. Zero packet loss via MASQUE connection migration.' },
];

/* ─── Helpers ───────────────────────────────────────────────── */
function signalQuality(dbm: number): { label: string; color: string; pct: number } {
  if (dbm >= -50) return { label: 'Excellent', color: 'text-green-400', pct: 100 };
  if (dbm >= -60) return { label: 'Good', color: 'text-green-400', pct: 80 };
  if (dbm >= -70) return { label: 'Fair', color: 'text-yellow-400', pct: 60 };
  if (dbm >= -80) return { label: 'Weak', color: 'text-orange-400', pct: 40 };
  return { label: 'Very Weak', color: 'text-red-400', pct: 20 };
}

function snr(signal: number, noise: number) {
  return signal - noise;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000).toFixed(1)} KB`;
}

function severityConfig(sev: string) {
  switch (sev) {
    case 'critical': return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-700/40' };
    case 'high': return { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/40' };
    case 'medium': return { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-800/40' };
    case 'low': return { icon: Info, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-800/40' };
    case 'warning': return { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-700/40' };
    case 'info': return { icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-700/40' };
    default: return { icon: Info, color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700' };
  }
}

function metricColor(value: number, thresholds: { good: number; warn: number; dir: 'asc' | 'desc' }) {
  if (thresholds.dir === 'asc') {
    if (value >= thresholds.good) return 'text-green-400';
    if (value >= thresholds.warn) return 'text-yellow-400';
    return 'text-red-400';
  }
  if (value <= thresholds.good) return 'text-green-400';
  if (value <= thresholds.warn) return 'text-yellow-400';
  return 'text-red-400';
}

/* ═══════════════════════════════════════════════════════════════
   NETWORK EVENTS PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function NetworkEventsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'vulnerabilities' | 'tunnels' | 'lastmile' | 'events'>('overview');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const sig = signalQuality(WIFI_INFO.signalDbm);
  const snrVal = snr(WIFI_INFO.signalDbm, WIFI_INFO.noiseDbn);
  const detectedVulns = WIFI_VULNS.filter(v => v.detected).length;

  const tabs = [
    { key: 'overview', label: 'Environment Overview' },
    { key: 'vulnerabilities', label: `WiFi Vulnerabilities (${detectedVulns})` },
    { key: 'tunnels', label: 'Dual Tunnel Status' },
    { key: 'lastmile', label: 'Last Mile Profile' },
    { key: 'events', label: 'Event Log' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wifi size={24} className="text-cyan-400" />
          <div>
            <h1 className="text-xl font-semibold">Network Events</h1>
            <p className="text-sm text-gray-500">Live network environment, connectivity, dual-tunnel status &amp; last-mile profile</p>
          </div>
        </div>
        <button
          onClick={() => setLastRefresh(new Date())}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          <RefreshCw size={12} />
          Refresh · {lastRefresh.toLocaleTimeString()}
        </button>
      </div>

      {/* Top-level status cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Connection', value: 'Wi-Fi + Cellular', color: 'text-green-400', icon: Wifi, sub: 'Dual-path active' },
          { label: 'WiFi Signal', value: `${WIFI_INFO.signalDbm} dBm`, color: sig.color, icon: Signal, sub: `${sig.label} · SNR ${snrVal} dB` },
          { label: '802.1X', value: DOT1X.authState === 'authenticated' ? 'Authenticated' : 'Not Auth', color: DOT1X.authState === 'authenticated' ? 'text-green-400' : 'text-red-400', icon: Lock, sub: DOT1X.method },
          { label: 'Bandwidth', value: `${BANDWIDTH.downloadMbps} Mbps`, color: 'text-cyan-400', icon: Activity, sub: `↑ ${BANDWIDTH.uploadMbps} Mbps · ${BANDWIDTH.latencyMs}ms` },
          { label: 'Security', value: detectedVulns > 0 ? `${detectedVulns} Alert` : 'Clean', color: detectedVulns > 0 ? 'text-red-400' : 'text-green-400', icon: detectedVulns > 0 ? ShieldAlert : ShieldCheck, sub: detectedVulns > 0 ? 'Threats found nearby' : 'No vulnerabilities' },
          { label: 'Last Mile Score', value: `${LAST_MILE_HISTORY[0].overallScore}/100`, color: LAST_MILE_HISTORY[0].overallScore > 80 ? 'text-green-400' : LAST_MILE_HISTORY[0].overallScore > 50 ? 'text-yellow-400' : 'text-red-400', icon: BarChart3, sub: 'Current quality' },
        ].map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} className={c.color} />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{c.label}</span>
              </div>
              <div className={`text-lg font-bold ${c.color}`}>{c.value}</div>
              <div className="text-[10px] text-gray-600">{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={clsx(
              'px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px',
              activeTab === t.key
                ? 'text-cyan-400 border-cyan-400'
                : 'text-gray-500 border-transparent hover:text-gray-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'vulnerabilities' && <VulnerabilitiesTab />}
      {activeTab === 'tunnels' && <TunnelsTab />}
      {activeTab === 'lastmile' && <LastMileTab />}
      {activeTab === 'events' && <EventsTab />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: OVERVIEW
   ═══════════════════════════════════════════════════════════════ */
function OverviewTab() {
  const sig = signalQuality(WIFI_INFO.signalDbm);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* WiFi Details */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Wifi size={14} className="text-cyan-400" /> Wi-Fi Connection
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'SSID', value: WIFI_INFO.ssid },
            { label: 'BSSID', value: WIFI_INFO.bssid },
            { label: 'Band / Channel', value: `${WIFI_INFO.band} · Ch ${WIFI_INFO.channel}` },
            { label: 'Protocol', value: WIFI_INFO.protocol },
            { label: 'Security', value: WIFI_INFO.security },
            { label: 'Signal', value: `${WIFI_INFO.signalDbm} dBm (${sig.label})` },
            { label: 'Noise Floor', value: `${WIFI_INFO.noiseDbn} dBm` },
            { label: 'SNR', value: `${snr(WIFI_INFO.signalDbm, WIFI_INFO.noiseDbn)} dB` },
            { label: 'Link Speed', value: `${WIFI_INFO.linkSpeedMbps} Mbps` },
            { label: 'TX / RX Rate', value: `${WIFI_INFO.txRate} / ${WIFI_INFO.rxRate} Mbps` },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-1 border-b border-gray-800/50 text-xs">
              <span className="text-gray-500">{r.label}</span>
              <span className="text-gray-300 font-mono text-right">{r.value}</span>
            </div>
          ))}
        </div>
        {/* Signal bar visualization */}
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-gray-500">Signal Quality</span>
            <span className={sig.color}>{sig.pct}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className={clsx('h-full rounded-full transition-all', sig.pct >= 80 ? 'bg-green-500' : sig.pct >= 50 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${sig.pct}%` }} />
          </div>
        </div>
      </div>

      {/* 802.1X Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Lock size={14} className="text-purple-400" /> 802.1X Authentication
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '802.1X Enabled', value: DOT1X.enabled ? 'Yes' : 'No' },
            { label: 'EAP Method', value: DOT1X.method },
            { label: 'Identity', value: DOT1X.identity },
            { label: 'Auth State', value: DOT1X.authState },
            { label: 'SGT Assigned', value: `SGT ${DOT1X.sgtAssigned}` },
            { label: 'RADIUS Server', value: DOT1X.radiusServer },
            { label: 'Certificate Expiry', value: DOT1X.certExpiry },
            { label: 'Last Authentication', value: DOT1X.lastAuth },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-1 border-b border-gray-800/50 text-xs">
              <span className="text-gray-500">{r.label}</span>
              <span className={clsx('font-mono text-right', r.label === 'Auth State' && DOT1X.authState === 'authenticated' ? 'text-green-400' : 'text-gray-300')}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
        <div className={clsx(
          'flex items-center gap-2 p-2 rounded-lg text-xs',
          DOT1X.authState === 'authenticated' ? 'bg-green-900/20 text-green-400 border border-green-700/30' : 'bg-red-900/20 text-red-400 border border-red-700/30',
        )}>
          {DOT1X.authState === 'authenticated' ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
          {DOT1X.authState === 'authenticated'
            ? 'Secure 802.1X session — certificate-based authentication active'
            : '802.1X authentication failed — network access may be restricted'}
        </div>
      </div>

      {/* Cellular Connection */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Smartphone size={14} className="text-orange-400" /> Cellular Connection (Secondary)
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Carrier', value: CELLULAR.carrier },
            { label: 'Technology', value: CELLULAR.technology },
            { label: 'Band', value: CELLULAR.band },
            { label: 'RSRP', value: `${CELLULAR.rsrp} dBm` },
            { label: 'RSRQ', value: `${CELLULAR.rsrq} dB` },
            { label: 'SINR', value: `${CELLULAR.sinr} dB` },
            { label: 'Download', value: `${CELLULAR.downloadMbps} Mbps` },
            { label: 'Upload', value: `${CELLULAR.uploadMbps} Mbps` },
            { label: 'APN', value: CELLULAR.apn },
            { label: 'IMEI', value: CELLULAR.imei },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-1 border-b border-gray-800/50 text-xs">
              <span className="text-gray-500">{r.label}</span>
              <span className="text-gray-300 font-mono text-right">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bandwidth Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity size={14} className="text-green-400" /> Bandwidth &amp; Quality
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Download', value: `${BANDWIDTH.downloadMbps}`, unit: 'Mbps', color: metricColor(BANDWIDTH.downloadMbps, { good: 100, warn: 25, dir: 'asc' }) },
            { label: 'Upload', value: `${BANDWIDTH.uploadMbps}`, unit: 'Mbps', color: metricColor(BANDWIDTH.uploadMbps, { good: 50, warn: 10, dir: 'asc' }) },
            { label: 'Latency', value: `${BANDWIDTH.latencyMs}`, unit: 'ms', color: metricColor(BANDWIDTH.latencyMs, { good: 20, warn: 50, dir: 'desc' }) },
            { label: 'Jitter', value: `${BANDWIDTH.jitterMs}`, unit: 'ms', color: metricColor(BANDWIDTH.jitterMs, { good: 5, warn: 20, dir: 'desc' }) },
            { label: 'Packet Loss', value: `${BANDWIDTH.packetLossPct}`, unit: '%', color: metricColor(BANDWIDTH.packetLossPct, { good: 0.1, warn: 1, dir: 'desc' }) },
            { label: 'MTU', value: `${BANDWIDTH.mtuBytes}`, unit: 'B', color: 'text-gray-300' },
          ].map(m => (
            <div key={m.label} className="p-2 bg-gray-800/40 rounded-lg border border-gray-700/40 text-center">
              <div className="text-[9px] text-gray-500 uppercase">{m.label}</div>
              <div className={`text-lg font-bold font-mono ${m.color}`}>{m.value}</div>
              <div className="text-[9px] text-gray-600">{m.unit}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: VULNERABILITIES
   ═══════════════════════════════════════════════════════════════ */
function VulnerabilitiesTab() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Wi-Fi Network Vulnerability Assessment</h3>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-gray-500">Network:</span>
          <span className="px-2 py-0.5 bg-gray-800 rounded font-mono text-cyan-400">{WIFI_INFO.ssid}</span>
          <span className="text-gray-500">Security:</span>
          <span className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded">{WIFI_INFO.security}</span>
        </div>
      </div>

      {WIFI_VULNS.map(v => {
        const sev = severityConfig(v.severity);
        const SevIcon = sev.icon;
        return (
          <div key={v.id} className={clsx('border rounded-xl p-4', v.detected ? sev.border : 'border-gray-800', v.detected ? sev.bg : 'bg-gray-900')}>
            <div className="flex items-start gap-3">
              <SevIcon size={16} className={sev.color} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-200">{v.name}</span>
                  {v.cve && <span className="text-[10px] font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{v.cve}</span>}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    v.severity === 'critical' ? 'bg-red-900/40 text-red-400' :
                    v.severity === 'high' ? 'bg-orange-900/40 text-orange-400' :
                    v.severity === 'medium' ? 'bg-yellow-900/40 text-yellow-400' :
                    v.severity === 'low' ? 'bg-blue-900/40 text-blue-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>{v.severity.toUpperCase()}</span>
                  {v.detected
                    ? <span className="text-[10px] px-1.5 py-0.5 bg-red-900/40 text-red-300 rounded font-semibold flex items-center gap-1"><AlertTriangle size={9} />DETECTED</span>
                    : <span className="text-[10px] px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded flex items-center gap-1"><CheckCircle2 size={9} />Not Detected</span>
                  }
                </div>
                <p className="text-xs text-gray-400 mt-1">{v.description}</p>
                <div className="flex items-center gap-1.5 mt-2 text-[11px]">
                  <Shield size={10} className="text-gray-500" />
                  <span className="text-gray-500">Mitigation:</span>
                  <span className="text-gray-300">{v.mitigation}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: DUAL TUNNEL STATUS
   ═══════════════════════════════════════════════════════════════ */
function TunnelsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Globe size={14} className="text-cyan-400" /> Dual-Connection Architecture
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          ApexAegis agent maintains two simultaneous tunnels — <span className="text-cyan-300">MASQUE Connect-IP</span> over Wi-Fi (primary) and <span className="text-orange-300">QUIC Tunnel</span> over cellular (failover). Traffic seamlessly migrates between paths using QUIC connection migration (CID-based) — zero downtime during network transitions.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {TUNNELS.map(t => {
            const isPrimary = t.type === 'MASQUE Connect-IP';
            return (
              <div key={t.id} className={clsx(
                'border rounded-xl p-4 space-y-3',
                isPrimary ? 'border-cyan-700/40 bg-cyan-900/10' : 'border-orange-700/40 bg-orange-900/10',
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isPrimary ? <Wifi size={14} className="text-cyan-400" /> : <Smartphone size={14} className="text-orange-400" />}
                    <span className="text-sm font-medium">{t.type}</span>
                    <span className="text-[10px] text-gray-500">({t.interface})</span>
                  </div>
                  <span className={clsx('px-2 py-0.5 rounded text-[10px] font-medium',
                    t.status === 'connected' ? 'bg-green-900/40 text-green-400' :
                    t.status === 'connecting' ? 'bg-yellow-900/40 text-yellow-400' :
                    t.status === 'standby' ? 'bg-blue-900/40 text-blue-400' :
                    'bg-red-900/40 text-red-400'
                  )}>
                    {t.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { label: 'Protocol', value: t.protocolVersion },
                    { label: 'Server', value: t.serverEndpoint },
                    { label: 'Local IP', value: t.localIP },
                    { label: 'Tunnel IP', value: t.assignedIP },
                    { label: 'Uptime', value: t.uptime },
                    { label: 'Handshake', value: `${t.handshakeTime}ms` },
                    { label: 'Congestion', value: t.congestionAlgo },
                    { label: 'RTT', value: `${t.rttMs}ms` },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between py-0.5 border-b border-gray-800/30">
                      <span className="text-gray-500">{r.label}</span>
                      <span className="text-gray-300 font-mono text-right text-[11px]">{r.value}</span>
                    </div>
                  ))}
                </div>

                {/* Throughput metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    { label: 'Bandwidth', value: `${t.currentBandwidthMbps}`, unit: 'Mbps', color: metricColor(t.currentBandwidthMbps, { good: 50, warn: 10, dir: 'asc' }) },
                    { label: 'Latency', value: `${t.latencyMs}`, unit: 'ms', color: metricColor(t.latencyMs, { good: 20, warn: 50, dir: 'desc' }) },
                    { label: 'Loss', value: `${t.packetLossPct}`, unit: '%', color: metricColor(t.packetLossPct, { good: 0.1, warn: 1, dir: 'desc' }) },
                  ].map(m => (
                    <div key={m.label} className="p-1.5 bg-gray-800/40 rounded text-center">
                      <div className="text-[8px] text-gray-500 uppercase">{m.label}</div>
                      <div className={`text-sm font-bold font-mono ${m.color}`}>{m.value}</div>
                      <div className="text-[8px] text-gray-600">{m.unit}</div>
                    </div>
                  ))}
                </div>

                {/* Data transferred */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-800/30">
                  <span>↑ Sent: <span className="text-gray-300 font-mono">{formatBytes(t.bytesSent)}</span></span>
                  <span>↓ Recv: <span className="text-gray-300 font-mono">{formatBytes(t.bytesRecv)}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connection Migration Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h4 className="text-xs font-semibold mb-2 flex items-center gap-2">
          <Zap size={12} className="text-yellow-400" /> QUIC Connection Migration
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {[
            { label: 'Migration Type', value: 'CID-based (Connection ID)' },
            { label: 'Last Migration', value: '09:12:45 — WiFi→Cellular' },
            { label: 'Migration Time', value: '< 1 RTT (38ms)' },
            { label: 'Packets Lost', value: '0 (seamless)' },
          ].map(r => (
            <div key={r.label} className="p-2 bg-gray-800/40 rounded-lg border border-gray-700/30">
              <div className="text-[9px] text-gray-500 uppercase">{r.label}</div>
              <div className="text-gray-300 font-mono mt-0.5">{r.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: LAST MILE PROFILE
   ═══════════════════════════════════════════════════════════════ */
function LastMileTab() {
  return (
    <div className="space-y-4">
      {/* Live score */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <BarChart3 size={14} className="text-green-400" /> Live Last Mile Quality Profile
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Continuous monitoring of both Wi-Fi and cellular last-mile quality. Score considers latency, jitter, packet loss, and throughput across both interfaces. During degradation, ApexAegis automatically shifts traffic to the healthier path.
        </p>

        {/* History table */}
        <div className="bg-gray-800/30 rounded-lg border border-gray-700/40 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-800/60 text-gray-500 text-[10px] uppercase tracking-wider">
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-center" colSpan={4}>Wi-Fi Path</th>
                <th className="px-2 py-2 text-center border-l border-gray-700/40" colSpan={4}>Cellular Path</th>
                <th className="px-3 py-2 text-center border-l border-gray-700/40">Active</th>
                <th className="px-2 py-2 text-center">MASQUE</th>
                <th className="px-2 py-2 text-center">QUIC</th>
                <th className="px-3 py-2 text-center">Score</th>
              </tr>
              <tr className="bg-gray-800/40 text-gray-600 text-[9px] uppercase">
                <th className="px-3 py-1"></th>
                <th className="px-2 py-1 text-center">Lat(ms)</th>
                <th className="px-2 py-1 text-center">Jit(ms)</th>
                <th className="px-2 py-1 text-center">Loss(%)</th>
                <th className="px-2 py-1 text-center">BW(Mbps)</th>
                <th className="px-2 py-1 text-center border-l border-gray-700/40">Lat(ms)</th>
                <th className="px-2 py-1 text-center">Jit(ms)</th>
                <th className="px-2 py-1 text-center">Loss(%)</th>
                <th className="px-2 py-1 text-center">BW(Mbps)</th>
                <th className="px-3 py-1 border-l border-gray-700/40"></th>
                <th className="px-2 py-1"></th>
                <th className="px-2 py-1"></th>
                <th className="px-3 py-1"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {LAST_MILE_HISTORY.map((lm, i) => (
                <tr key={lm.timestamp} className={clsx(i === 0 && 'bg-gray-800/20')}>
                  <td className="px-3 py-1.5 font-mono text-gray-400">{lm.timestamp}</td>
                  <td className={`px-2 py-1.5 text-center font-mono ${metricColor(lm.wifiLatency, { good: 20, warn: 50, dir: 'desc' })}`}>{lm.wifiLatency}</td>
                  <td className={`px-2 py-1.5 text-center font-mono ${metricColor(lm.wifiJitter, { good: 5, warn: 15, dir: 'desc' })}`}>{lm.wifiJitter}</td>
                  <td className={`px-2 py-1.5 text-center font-mono ${metricColor(lm.wifiLoss, { good: 0.1, warn: 1, dir: 'desc' })}`}>{lm.wifiLoss.toFixed(2)}</td>
                  <td className={`px-2 py-1.5 text-center font-mono ${metricColor(lm.wifiBandwidth, { good: 100, warn: 25, dir: 'asc' })}`}>{lm.wifiBandwidth}</td>
                  <td className={`px-2 py-1.5 text-center font-mono border-l border-gray-700/40 ${metricColor(lm.cellLatency, { good: 30, warn: 60, dir: 'desc' })}`}>{lm.cellLatency}</td>
                  <td className={`px-2 py-1.5 text-center font-mono ${metricColor(lm.cellJitter, { good: 8, warn: 15, dir: 'desc' })}`}>{lm.cellJitter}</td>
                  <td className={`px-2 py-1.5 text-center font-mono ${metricColor(lm.cellLoss, { good: 0.2, warn: 1, dir: 'desc' })}`}>{lm.cellLoss.toFixed(2)}</td>
                  <td className={`px-2 py-1.5 text-center font-mono ${metricColor(lm.cellBandwidth, { good: 50, warn: 15, dir: 'asc' })}`}>{lm.cellBandwidth}</td>
                  <td className="px-3 py-1.5 text-center border-l border-gray-700/40">
                    <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-medium',
                      lm.activeInterface === 'wifi' ? 'bg-cyan-900/30 text-cyan-400' :
                      lm.activeInterface === 'cellular' ? 'bg-orange-900/30 text-orange-400' :
                      'bg-purple-900/30 text-purple-400',
                    )}>
                      {lm.activeInterface === 'both' ? 'Multi' : lm.activeInterface === 'wifi' ? 'WiFi' : 'Cell'}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {lm.masqueHealthy ? <CheckCircle2 size={12} className="text-green-500 mx-auto" /> : <XCircle size={12} className="text-red-500 mx-auto" />}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {lm.quicHealthy ? <CheckCircle2 size={12} className="text-green-500 mx-auto" /> : <XCircle size={12} className="text-red-500 mx-auto" />}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <span className={clsx('font-bold font-mono',
                      lm.overallScore >= 80 ? 'text-green-400' : lm.overallScore >= 50 ? 'text-yellow-400' : 'text-red-400',
                    )}>
                      {lm.overallScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Score visualization */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h4 className="text-xs font-semibold mb-3">Quality Trend (Last 8 Minutes)</h4>
        <div className="flex items-end gap-1 h-24">
          {LAST_MILE_HISTORY.slice().reverse().map((lm, i) => (
            <div key={lm.timestamp} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[8px] font-mono text-gray-500">{lm.overallScore}</div>
              <div
                className={clsx(
                  'w-full rounded-t transition-all',
                  lm.overallScore >= 80 ? 'bg-green-500/70' : lm.overallScore >= 50 ? 'bg-yellow-500/70' : 'bg-red-500/70',
                )}
                style={{ height: `${lm.overallScore}%` }}
              />
              <div className="text-[8px] text-gray-600 font-mono">{lm.timestamp}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: EVENT LOG
   ═══════════════════════════════════════════════════════════════ */
function EventsTab() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Network Event Timeline</h3>
        <span className="text-[10px] text-gray-500">{NETWORK_EVENTS.length} events today</span>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gray-800" />
        {NETWORK_EVENTS.map((ev, i) => {
          const sev = severityConfig(ev.severity);
          const SevIcon = sev.icon;
          return (
            <div key={ev.id} className="relative flex gap-3 pb-3">
              <div className={clsx('z-10 w-[37px] h-7 flex items-center justify-center rounded-full border shrink-0', sev.bg, sev.border)}>
                <SevIcon size={13} className={sev.color} />
              </div>
              <div className={clsx('flex-1 p-3 rounded-xl border', sev.border, sev.bg)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-400">{ev.timestamp}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    ev.type === 'failover' ? 'bg-orange-900/30 text-orange-400' :
                    ev.type === 'degradation' ? 'bg-red-900/30 text-red-400' :
                    ev.type === 'security' ? 'bg-red-900/30 text-red-300' :
                    ev.type === 'roaming' ? 'bg-purple-900/30 text-purple-400' :
                    ev.type === 'tunnel' ? 'bg-cyan-900/30 text-cyan-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {ev.type.toUpperCase()}
                  </span>
                  <span className={clsx('text-[9px] px-1.5 py-0.5 rounded',
                    ev.interface === 'wifi' ? 'bg-cyan-900/20 text-cyan-400' :
                    ev.interface === 'cellular' ? 'bg-orange-900/20 text-orange-400' :
                    'bg-purple-900/20 text-purple-400',
                  )}>
                    {ev.interface}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-200">{ev.message}</div>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{ev.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
