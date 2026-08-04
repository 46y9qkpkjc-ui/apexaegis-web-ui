'use client';
import { useEffect, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { MonitorSmartphone, RefreshCw, ShieldAlert } from 'lucide-react';
import { fetchDevices, type DeviceRow } from '@/lib/device-api';
import { listDnsEvents, type DnsEventRow } from '@/lib/dns-events-api';

const complianceChip: Record<string, string> = {
  compliant: 'text-green-400 border-green-800 bg-green-900/20',
  non_compliant: 'text-red-400 border-red-800 bg-red-900/20',
  unknown: 'text-gray-400 border-gray-700 bg-gray-800/40',
};

type TunnelState = 'Connected' | 'Idle' | 'Offline';

const tunnelChip: Record<TunnelState, string> = {
  Connected: 'text-green-400 border-green-800 bg-green-900/20',
  Idle: 'text-amber-400 border-amber-800 bg-amber-900/20',
  Offline: 'text-gray-400 border-gray-700 bg-gray-800/40',
};

// Per-PEP status chip palette (matches the compliance/tunnel chip styling).
const pepChip = {
  green: 'text-green-400 border-green-800 bg-green-900/20',
  cyan: 'text-cyan-400 border-cyan-800 bg-cyan-900/20',
  gray: 'text-gray-400 border-gray-700 bg-gray-800/40',
};

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

// Derive tunnel/connection status from the device's last_seen heartbeat.
function tunnelStatus(lastSeen: string): TunnelState {
  if (!lastSeen) return 'Offline';
  const t = new Date(lastSeen).getTime();
  if (isNaN(t)) return 'Offline';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s <= 300) return 'Connected'; // seen within ~5 min
  if (s <= 3600) return 'Idle';      // seen within ~1h
  return 'Offline';
}

// DNS-PEP deny risk score → colour (risk-engine bands: deny 65-100, monitor 25-64).
const dnsRiskColor = (s: number) =>
  typeof s !== 'number' || isNaN(s) ? 'text-gray-400' : s >= 65 ? 'text-red-400' : s >= 25 ? 'text-amber-400' : 'text-gray-300';

export default function EndpointEventsPage() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [dnsRows, setDnsRows] = useState<DnsEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      // DNS denies are secondary — a failure there must not blank the device table.
      const [d, dns] = await Promise.all([
        fetchDevices(),
        listDnsEvents().catch(() => [] as DnsEventRow[]),
      ]);
      setDevices(d);
      setDnsRows(dns);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MonitorSmartphone className="text-cyan-400" size={24} /> Endpoint Events
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Device compliance and tunnel status, per user/device.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 rounded-lg text-xs">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="text-left font-medium px-4 py-2">Device</th>
                <th className="text-left font-medium px-4 py-2">User</th>
                <th className="text-left font-medium px-4 py-2">OS</th>
                <th className="text-left font-medium px-4 py-2">Compliance</th>
                <th className="text-left font-medium px-4 py-2">Tunnel</th>
                <th className="text-left font-medium px-4 py-2">SWG PEP</th>
                <th className="text-left font-medium px-4 py-2">AD/DC PEP</th>
                <th className="text-left font-medium px-4 py-2">Check-in</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>}
              {!loading && devices.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">No endpoint devices for this tenant yet</td></tr>
              )}
              {devices.map(d => {
                const tunnel = tunnelStatus(d.last_seen);
                const compliance = d.compliance_status || 'unknown';
                return (
                  <tr key={d.device_id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-2.5 font-mono text-[12px] text-gray-200">{d.hostname}</td>
                    <td className="px-4 py-2.5 text-gray-300">{d.user || '—'}</td>
                    <td className="px-4 py-2.5 text-[12px] text-gray-400">
                      <span className="text-gray-300">{d.os_type}</span>{d.os_version ? ` ${d.os_version}` : ''}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border capitalize', complianceChip[compliance] || complianceChip.unknown)}>
                        {compliance.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border', tunnelChip[tunnel])}>{tunnel}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border', d.swg_connected ? pepChip.green : pepChip.gray)}>
                        {d.swg_connected ? 'Connected' : 'Disconnected'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border',
                        d.dc_tunnel_connected ? pepChip.green : (d.ot_mode ? pepChip.cyan : pepChip.gray))}>
                        {d.dc_tunnel_connected ? 'Tunnel up' : (d.ot_mode ? 'Native (DC-adjacent)' : 'Disconnected')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-[12px]">{timeAgo(d.last_seen)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DNS PEP — blocked domains (endpoint sinkhole denies; observability only) */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2">
          <ShieldAlert size={16} className="text-red-400" /> DNS PEP — Blocked Domains
          <span className="text-[11px] font-normal text-gray-500">
            what the on-device resolver sinkholed — blocking is local, this is the report
          </span>
        </h2>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
                  <th className="text-left font-medium px-4 py-2">Device</th>
                  <th className="text-left font-medium px-4 py-2">Domain</th>
                  <th className="text-center font-medium px-4 py-2">Risk</th>
                  <th className="text-right font-medium px-4 py-2">Denies</th>
                  <th className="text-left font-medium px-4 py-2">Last blocked</th>
                </tr>
              </thead>
              <tbody>
                {!loading && dnsRows.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No DNS-PEP denies reported yet — appears once an endpoint sinkholes a risky or denylisted domain.
                  </td></tr>
                )}
                {dnsRows.map((r, i) => (
                  <tr key={`${r.device_id}|${r.domain}|${i}`} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-2.5 font-mono text-[12px] text-gray-200">{r.device_name || '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-[12px] text-gray-300">{r.domain}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={clsx('font-mono font-bold', dnsRiskColor(r.score))}>{r.score}</span>
                      <span className="text-gray-600 text-[10px]"> /100</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[12px] text-gray-300">{r.count}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-[12px]">{timeAgo(r.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
