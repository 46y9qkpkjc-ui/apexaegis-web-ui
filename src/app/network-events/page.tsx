'use client';
import { useEffect, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Activity, Wifi, Cable, Smartphone, Globe, RefreshCw, type LucideIcon } from 'lucide-react';
import { listNetworkEvents, type NetworkEventRow } from '@/lib/network-events-api';

/* ─── Helpers ───────────────────────────────────────────────── */
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

// Format a numeric metric; trims trailing zeros, renders a dash for missing data.
function fmt(v: number | undefined | null, digits = 0): string {
  if (typeof v !== 'number' || isNaN(v)) return '—';
  const s = v.toFixed(digits);
  return digits > 0 ? s.replace(/\.?0+$/, '') : s;
}

const clampPct = (v: number) => Math.max(0, Math.min(100, typeof v === 'number' && !isNaN(v) ? v : 0));

// Interface kind → icon + accent colour.
function kindMeta(kind: string): { Icon: LucideIcon; color: string } {
  switch ((kind || '').toLowerCase()) {
    case 'wifi': return { Icon: Wifi, color: 'text-cyan-400' };
    case 'ethernet': return { Icon: Cable, color: 'text-blue-400' };
    case 'cellular': return { Icon: Smartphone, color: 'text-orange-400' };
    default: return { Icon: Globe, color: 'text-gray-400' };
  }
}

const signalColor = (p: number) =>
  typeof p !== 'number' || isNaN(p) ? 'text-gray-500' : p >= 70 ? 'text-green-400' : p >= 40 ? 'text-amber-400' : 'text-red-400';
const signalBar = (p: number) =>
  typeof p !== 'number' || isNaN(p) ? 'bg-gray-600' : p >= 70 ? 'bg-green-500' : p >= 40 ? 'bg-amber-500' : 'bg-red-500';
const scoreColor = (s: number) =>
  typeof s !== 'number' || isNaN(s) ? 'text-gray-500' : s >= 80 ? 'text-green-400' : s >= 50 ? 'text-amber-400' : 'text-red-400';
const latencyColor = (ms: number) =>
  typeof ms !== 'number' || isNaN(ms) ? 'text-gray-400' : ms <= 30 ? 'text-green-400' : ms <= 80 ? 'text-amber-400' : 'text-red-400';
const lossColor = (p: number) =>
  typeof p !== 'number' || isNaN(p) ? 'text-gray-400' : p <= 0.5 ? 'text-green-400' : p <= 2 ? 'text-amber-400' : 'text-red-400';

// 802.1X supplicant state → chip styling.
function dot1xChip(state: string): string {
  const s = (state || '').toLowerCase();
  if (['authenticated', 'authorized', 'success', 'connected'].includes(s)) return 'text-green-400 border-green-800 bg-green-900/20';
  if (['authenticating', 'in-progress', 'connecting', 'pending'].includes(s)) return 'text-amber-400 border-amber-800 bg-amber-900/20';
  if (['failed', 'unauthorized', 'held', 'denied', 'error'].includes(s)) return 'text-red-400 border-red-800 bg-red-900/20';
  return 'text-gray-400 border-gray-700 bg-gray-800/40';
}

/* ═══════════════════════════════════════════════════════════════
   NETWORK EVENTS PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function NetworkEventsPage() {
  const [rows, setRows] = useState<NetworkEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await listNetworkEvents();
      setRows(r);
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
            <Activity className="text-cyan-400" size={24} /> Network Events
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Per-device network telemetry — one row per polled sample. Link, signal, 802.1X posture and last-mile quality reported by the agent every couple of minutes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && rows.length > 0 && (
            <span className="text-[11px] text-gray-500">{rows.length} samples</span>
          )}
          <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 rounded-lg text-xs">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="text-left font-medium px-4 py-2">Device</th>
                <th className="text-left font-medium px-4 py-2">User</th>
                <th className="text-left font-medium px-4 py-2">Interface</th>
                <th className="text-left font-medium px-4 py-2">SSID</th>
                <th className="text-left font-medium px-4 py-2">Signal</th>
                <th className="text-right font-medium px-4 py-2">Link</th>
                <th className="text-left font-medium px-4 py-2">802.1X</th>
                <th className="text-right font-medium px-4 py-2">Latency / Loss</th>
                <th className="text-center font-medium px-4 py-2">Last-mile</th>
                <th className="text-left font-medium px-4 py-2">Reported</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  {error ? 'Could not load network telemetry.' : 'No network telemetry for this tenant yet — the agent reports every couple of minutes.'}
                </td></tr>
              )}
              {!loading && rows.map((row, i) => {
                const { Icon, color } = kindMeta(row.kind);
                return (
                  <tr key={`${row.device_id}|${row.reported_at}|${i}`} className="border-b border-gray-800/50 hover:bg-gray-800/30 align-top">
                    <td className="px-4 py-2.5 text-gray-200">{row.device_name || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-300">{row.login_user || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon size={14} className={color} />
                        <span className="text-gray-300 text-[12px] font-mono">{row.iface || row.kind || '—'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[12px]">
                      {row.kind === 'wifi'
                        ? <span className="text-gray-400">{row.ssid || '—'}</span>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.kind === 'ethernet' ? (
                        <span className="text-gray-600 text-xs">—</span>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div className={clsx('h-full rounded-full', signalBar(row.signal_pct))} style={{ width: `${clampPct(row.signal_pct)}%` }} />
                            </div>
                            <span className={clsx('font-mono text-[11px]', signalColor(row.signal_pct))}>{fmt(row.signal_pct)}%</span>
                          </div>
                          {typeof row.rssi_dbm === 'number' && row.rssi_dbm !== 0 && (
                            <div className="font-mono text-[10px] text-gray-600">{row.rssi_dbm} dBm</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="font-mono text-[12px] text-gray-300">{fmt(row.link_mbps)} <span className="text-gray-600">Mbps</span></div>
                      {typeof row.bandwidth_mbps === 'number' && !isNaN(row.bandwidth_mbps) && (
                        <div className="font-mono text-[10px] text-gray-600">~{fmt(row.bandwidth_mbps, 1)} meas.</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.dot1x_state ? (
                        <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border capitalize whitespace-nowrap', dot1xChip(row.dot1x_state))}>
                          {row.dot1x_state.replace(/[-_]/g, ' ')}
                        </span>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <div className={clsx('font-mono text-[12px]', latencyColor(row.latency_ms))}>{fmt(row.latency_ms, 1)} ms</div>
                      <div className={clsx('font-mono text-[10px]', lossColor(row.loss_pct))}>{fmt(row.loss_pct, 2)}% loss</div>
                    </td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <span className={clsx('font-mono font-bold text-base', scoreColor(row.last_mile_score))}>{fmt(row.last_mile_score)}</span>
                      <span className="text-gray-600 text-[10px]"> /100</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-[12px] whitespace-nowrap">{timeAgo(row.reported_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
