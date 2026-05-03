'use client';
import { useState } from 'react';
import {
  Key, Shield, CheckCircle2, XCircle, RefreshCw, Eye, EyeOff,
  ChevronDown, ChevronRight, Server, Clock, Activity,
  Download, Search, AlertTriangle,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ─────────────────────────────────────────────────── */

type Vendor = 'cisco_ise' | 'meraki' | 'ubiquiti' | 'unifi';
type ConnectionStatus = 'connected' | 'error' | 'disconnected' | 'testing';

interface VendorIntegration {
  id: string;
  vendor: Vendor;
  label: string;
  host: string;
  port: number;
  api_key: string;
  username: string;
  verify_ssl: boolean;
  status: ConnectionStatus;
  last_sync: string | null;
  log_types: string[];
  sync_interval_mins: number;
  total_logs_synced: number;
  enabled: boolean;
}

interface KeyLogEntry {
  id: string;
  vendor: Vendor;
  timestamp: string;
  event_type: string;
  client_mac: string;
  client_ip: string;
  ssid: string;
  nas_ip: string;
  auth_result: 'success' | 'failure' | 'timeout';
  identity: string;
  details: string;
}

/* ─── Demo Data ─────────────────────────────────────────────── */

const vendorMeta: Record<Vendor, { name: string; color: string; logo: string }> = {
  cisco_ise: { name: 'Cisco ISE', color: 'text-blue-400 bg-blue-900/30 border-blue-700/40', logo: '🔷' },
  meraki: { name: 'Meraki Dashboard', color: 'text-green-400 bg-green-900/30 border-green-700/40', logo: '🟢' },
  ubiquiti: { name: 'Ubiquiti UNMS', color: 'text-cyan-400 bg-cyan-900/30 border-cyan-700/40', logo: '🔵' },
  unifi: { name: 'UniFi Controller', color: 'text-purple-400 bg-purple-900/30 border-purple-700/40', logo: '🟣' },
};

const demoIntegrations: VendorIntegration[] = [
  { id: 'int-001', vendor: 'cisco_ise', label: 'ISE Primary (SG)', host: 'ise-primary.corp.local', port: 9060, api_key: 'sk-ise-xxxx-xxxx-xxxx-1234', username: 'apexaegis-readonly', verify_ssl: true, status: 'connected', last_sync: '2026-03-14T11:30:00Z', log_types: ['RADIUS Authentication', 'TACACS+ Authorization', 'Posture Assessment', 'Guest Portal'], sync_interval_mins: 5, total_logs_synced: 284_319, enabled: true },
  { id: 'int-002', vendor: 'meraki', label: 'Meraki Org (Production)', host: 'api.meraki.com', port: 443, api_key: 'sk-meraki-xxxx-xxxx-xxxx-5678', username: '', verify_ssl: true, status: 'connected', last_sync: '2026-03-14T11:28:00Z', log_types: ['Client Association', 'Splash Auth', 'Air Marshal', 'Security Events'], sync_interval_mins: 5, total_logs_synced: 152_871, enabled: true },
  { id: 'int-003', vendor: 'unifi', label: 'UniFi Controller (Building A)', host: 'unifi.corp.local', port: 8443, api_key: '', username: 'apexaegis-svc', verify_ssl: false, status: 'connected', last_sync: '2026-03-14T11:29:00Z', log_types: ['Client Events', 'AP Events', 'Anomalies', 'IDS/IPS'], sync_interval_mins: 10, total_logs_synced: 98_403, enabled: true },
  { id: 'int-004', vendor: 'ubiquiti', label: 'UNMS (Warehouse)', host: 'unms.corp.local', port: 443, api_key: 'sk-unms-xxxx-xxxx-xxxx-9012', username: '', verify_ssl: true, status: 'error', last_sync: '2026-03-14T09:15:00Z', log_types: ['Device Events', 'Client Auth'], sync_interval_mins: 15, total_logs_synced: 12_440, enabled: true },
];

const demoKeyLogs: KeyLogEntry[] = [
  { id: 'kl-001', vendor: 'cisco_ise', timestamp: '2026-03-14T11:29:44Z', event_type: 'RADIUS Authentication', client_mac: 'AA:BB:CC:11:22:33', client_ip: '10.10.100.45', ssid: 'AegisSecure-Corp', nas_ip: '10.0.1.1', auth_result: 'success', identity: 'jsmith@corp.com', details: 'EAP-TLS mutual auth · cert CN=jsmith · posture=compliant' },
  { id: 'kl-002', vendor: 'cisco_ise', timestamp: '2026-03-14T11:28:12Z', event_type: 'RADIUS Authentication', client_mac: 'AA:BB:CC:44:55:66', client_ip: '10.10.100.46', ssid: 'AegisSecure-Corp', nas_ip: '10.0.1.1', auth_result: 'failure', identity: 'unknown', details: 'EAP-TLS handshake failed · cert expired · reject code 22' },
  { id: 'kl-003', vendor: 'meraki', timestamp: '2026-03-14T11:27:30Z', event_type: 'Client Association', client_mac: 'DE:AD:00:00:01:01', client_ip: '10.10.99.51', ssid: 'AegisSecure-Guest', nas_ip: '10.0.2.10', auth_result: 'success', identity: 'guest:alice@vendor-a.com', details: 'Splash page authenticated · VLAN 999 · BW limit 50 Mbps' },
  { id: 'kl-004', vendor: 'meraki', timestamp: '2026-03-14T11:25:02Z', event_type: 'Air Marshal', client_mac: 'FF:EE:DD:CC:BB:AA', client_ip: '', ssid: 'EvilTwin-Corp', nas_ip: '', auth_result: 'failure', identity: '', details: 'Rogue SSID detected on channel 36 · BSSID FF:EE:DD:CC:BB:AA · containment auto-enabled' },
  { id: 'kl-005', vendor: 'unifi', timestamp: '2026-03-14T11:24:15Z', event_type: 'Client Event', client_mac: 'AA:BB:CC:77:88:99', client_ip: '10.10.100.50', ssid: 'AegisSecure-Corp', nas_ip: '10.0.3.5', auth_result: 'success', identity: 'mwilliams@corp.com', details: 'WPA3-Enterprise 802.1X · U6-Enterprise · 5GHz · RSSI -42 dBm' },
  { id: 'kl-006', vendor: 'ubiquiti', timestamp: '2026-03-14T09:14:55Z', event_type: 'Device Event', client_mac: '', client_ip: '', ssid: '', nas_ip: '10.0.4.1', auth_result: 'timeout', identity: 'system', details: 'UAP-AC-PRO heartbeat lost · last seen 2026-03-14T09:10:00Z · firmware 6.5.28' },
  { id: 'kl-007', vendor: 'cisco_ise', timestamp: '2026-03-14T11:22:00Z', event_type: 'Posture Assessment', client_mac: 'AA:BB:CC:11:22:33', client_ip: '10.10.100.45', ssid: 'AegisSecure-Corp', nas_ip: '10.0.1.1', auth_result: 'success', identity: 'jsmith@corp.com', details: 'Posture compliant · OS: Windows 11 23H2 · AV: Defender current · Disk encrypted' },
  { id: 'kl-008', vendor: 'cisco_ise', timestamp: '2026-03-14T11:20:30Z', event_type: 'Guest Portal', client_mac: 'DE:AD:00:00:01:03', client_ip: '10.10.99.53', ssid: 'AegisSecure-Guest', nas_ip: '10.0.1.1', auth_result: 'success', identity: 'guest:carol@contractor-c.com', details: 'Self-registration portal · email verified · VLAN 999 · 4hr session' },
];

/* ─── Component ─────────────────────────────────────────────── */

export default function APIIntegrationsPage() {
  const [activeTab, setActiveTab] = useState<'integrations' | 'keylogs'>('integrations');
  const [expandedInt, setExpandedInt] = useState<string | null>('int-001');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [vendorFilter, setVendorFilter] = useState<Vendor | 'all'>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>('kl-001');

  const connectedCount = demoIntegrations.filter(i => i.status === 'connected').length;
  const errorCount = demoIntegrations.filter(i => i.status === 'error').length;
  const totalLogs = demoIntegrations.reduce((s, i) => s + i.total_logs_synced, 0);

  const filteredLogs = vendorFilter === 'all'
    ? demoKeyLogs
    : demoKeyLogs.filter(l => l.vendor === vendorFilter);

  const statusColors: Record<ConnectionStatus, string> = {
    connected: 'text-green-400 bg-green-900/30 border-green-700/40',
    error: 'text-red-400 bg-red-900/30 border-red-700/40',
    disconnected: 'text-gray-400 bg-gray-800 border-gray-700/40',
    testing: 'text-amber-400 bg-amber-900/30 border-amber-700/40',
  };

  const authResultColors: Record<string, string> = {
    success: 'text-green-400 bg-green-900/30 border-green-700/40',
    failure: 'text-red-400 bg-red-900/30 border-red-700/40',
    timeout: 'text-amber-400 bg-amber-900/30 border-amber-700/40',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key size={24} className="text-amber-400" />
          <div>
            <h1 className="text-xl font-semibold">API Integrations &amp; Key Logs</h1>
            <p className="text-sm text-gray-500">Cisco ISE, Meraki, Ubiquiti &amp; UniFi API access with authentication key log retrieval</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          <Server size={14} /> Add Integration
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Integrations', value: String(demoIntegrations.length), icon: Server, color: 'text-blue-400' },
          { label: 'Connected', value: String(connectedCount), icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Errors', value: String(errorCount), icon: AlertTriangle, color: errorCount > 0 ? 'text-red-400' : 'text-gray-500' },
          { label: 'Total Logs Synced', value: totalLogs.toLocaleString(), icon: Activity, color: 'text-cyan-400' },
        ].map(st => {
          const Icon = st.icon;
          return (
            <div key={st.label} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={st.color} />
                <span className="text-xs text-gray-500 uppercase tracking-wider">{st.label}</span>
              </div>
              <div className="text-2xl font-bold">{st.value}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
        {([
          { key: 'integrations' as const, label: 'Vendor Integrations', icon: Server },
          { key: 'keylogs' as const, label: 'Authentication Key Logs', icon: Key },
        ]).map(tab => {
          const TabIcon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={clsx('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all',
                activeTab === tab.key ? 'bg-blue-600/15 text-blue-400' : 'text-gray-500 hover:text-gray-300')}>
              <TabIcon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Vendor Integrations ──────────────────────────── */}
      {activeTab === 'integrations' && (
        <div className="space-y-3">
          {demoIntegrations.map(integ => {
            const isExpanded = expandedInt === integ.id;
            const vm = vendorMeta[integ.vendor];
            const masked = integ.api_key ? (showKey[integ.id] ? integ.api_key : integ.api_key.replace(/(?<=.{8}).(?=.{4})/g, '•')) : '(credentials-based)';
            return (
              <div key={integ.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedInt(isExpanded ? null : integ.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors text-left">
                  <span className="text-lg">{vm.logo}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{integ.label}</span>
                    <span className="text-xs text-gray-500">{vm.name} · {integ.host}:{integ.port}</span>
                  </div>
                  <span className={clsx('px-2 py-0.5 rounded border text-[10px] font-medium', statusColors[integ.status])}>
                    {integ.status}
                  </span>
                  {isExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800/60 px-5 py-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px]">
                      <div>
                        <div className="text-gray-600">API Key / Credentials</div>
                        <div className="flex items-center gap-1.5 text-gray-300 font-mono text-[10px]">
                          <span className="truncate">{masked}</span>
                          {integ.api_key && (
                            <button onClick={() => setShowKey(p => ({ ...p, [integ.id]: !p[integ.id] }))}
                              className="text-gray-500 hover:text-gray-300">
                              {showKey[integ.id] ? <EyeOff size={10} /> : <Eye size={10} />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Username</div>
                        <div className="text-gray-300">{integ.username || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">SSL Verify</div>
                        <div className={integ.verify_ssl ? 'text-green-400' : 'text-amber-400'}>
                          {integ.verify_ssl ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Sync Interval</div>
                        <div className="text-gray-300">{integ.sync_interval_mins} min</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Last Sync</div>
                        <div className="text-gray-300">{integ.last_sync ? new Date(integ.last_sync).toLocaleString() : 'Never'}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Logs Synced</div>
                        <div className="text-gray-300">{integ.total_logs_synced.toLocaleString()}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600 mb-1">Log Types</div>
                      <div className="flex flex-wrap gap-1">
                        {integ.log_types.map(lt => (
                          <span key={lt} className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700/40 text-[9px] text-gray-400">{lt}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-[11px] hover:bg-blue-600/30 transition-colors">
                        <RefreshCw size={10} className="inline mr-1" /> Sync Now
                      </button>
                      <button className="px-3 py-1.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] hover:bg-amber-600/30 transition-colors">
                        Test Connection
                      </button>
                      <button className="px-3 py-1.5 bg-gray-700/30 text-gray-400 border border-gray-600/30 rounded-lg text-[11px] hover:bg-gray-700/50 transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Authentication Key Logs ────────────────────── */}
      {activeTab === 'keylogs' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {(['all', 'cisco_ise', 'meraki', 'unifi', 'ubiquiti'] as (Vendor | 'all')[]).map(v => (
              <button key={v} onClick={() => setVendorFilter(v)}
                className={clsx('px-2.5 py-1 rounded-md text-xs transition-all border',
                  vendorFilter === v ? 'bg-blue-600/20 text-blue-400 border-blue-500/40' : 'text-gray-500 border-transparent hover:text-gray-300')}>
                {v === 'all' ? 'All Vendors' : vendorMeta[v].name}
              </button>
            ))}
            <div className="flex-1" />
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-colors">
              <Download size={10} /> Export
            </button>
          </div>

          {filteredLogs.map(log => {
            const isExpanded = expandedLog === log.id;
            const vm = vendorMeta[log.vendor];
            return (
              <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-800/30 transition-colors text-left">
                  <span className={clsx('px-2 py-0.5 rounded border text-[10px] font-medium', authResultColors[log.auth_result])}>
                    {log.auth_result}
                  </span>
                  <span className={clsx('px-1.5 py-0.5 rounded border text-[9px]', vm.color)}>{vm.name}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium truncate block">{log.event_type}</span>
                    <span className="text-[10px] text-gray-500">
                      {log.identity || 'unknown'} · {log.client_mac || '—'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  {isExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-800/60 px-5 py-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] mb-2">
                      <div><div className="text-gray-600">Client MAC</div><div className="text-gray-300 font-mono">{log.client_mac || '—'}</div></div>
                      <div><div className="text-gray-600">Client IP</div><div className="text-gray-300 font-mono">{log.client_ip || '—'}</div></div>
                      <div><div className="text-gray-600">SSID</div><div className="text-gray-300">{log.ssid || '—'}</div></div>
                      <div><div className="text-gray-600">NAS IP</div><div className="text-gray-300 font-mono">{log.nas_ip || '—'}</div></div>
                    </div>
                    <div className="text-[10px] text-gray-400 bg-gray-800/40 rounded-lg px-3 py-2 font-mono">{log.details}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-gray-700 text-center">
        API Integrations · ApexAegis SSE · Cisco ISE, Meraki, Ubiquiti &amp; UniFi key log access
      </p>
    </div>
  );
}
