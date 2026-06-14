'use client';
import React from 'react';
import { Shield, Wifi } from 'lucide-react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import type { TunnelSettings } from '@/app/admin/client-config/page';

interface Props { settings: TunnelSettings; onChange: (settings: TunnelSettings) => void }

export function TunnelSettingsComponent({ settings, onChange }: Props) {
  const set = <K extends keyof TunnelSettings>(key: K, value: TunnelSettings[K]) => onChange({ ...settings, [key]: value });
  return <div className="space-y-6">
    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4"><Wifi size={14} className="text-blue-400" />Tunnel Protocol</h3>
      <div className="flex gap-2">{(['quic','tls','both'] as const).map(protocol => <button key={protocol} onClick={() => set('protocol', protocol)} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${settings.protocol === protocol ? 'bg-blue-600/20 text-blue-400 border-blue-500/40' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>{protocol === 'both' ? 'QUIC + TLS' : protocol.toUpperCase()}</button>)}</div>
      <p className="text-xs text-gray-500 mt-3">{settings.protocol === 'quic' ? 'Use low-latency QUIC only.' : settings.protocol === 'tls' ? 'Use TLS over TCP only.' : 'Prefer QUIC and automatically fall back to TLS.'}</p>
    </section>
    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4"><Shield size={14} className="text-green-400" />Device Posture</h3>
      <div className="flex items-center justify-between py-2"><div><div className="text-sm text-gray-300">Periodic posture check</div><div className="text-[10px] text-gray-500">Upload encryption, firewall, antivirus and compliance state</div></div><button onClick={() => set('device_posture_enabled', !settings.device_posture_enabled)}>{settings.device_posture_enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}</button></div>
      <label className="text-xs text-gray-500 block mt-3 mb-1">Check interval (seconds)</label>
      <input type="number" min={15} value={settings.posture_check_interval_seconds} onChange={e => set('posture_check_interval_seconds', Math.max(15, Number(e.target.value) || 60))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm" />
    </section>
  </div>;
}
