'use client';
import React from 'react';
import { Database, Eye, Network } from 'lucide-react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import type { FeaturesSettings } from '@/app/admin/client-config/page';

interface Props { settings: FeaturesSettings; onChange: (settings: FeaturesSettings) => void }

export function FeaturesSettingsComponent({ settings, onChange }: Props) {
  const update = <K extends keyof FeaturesSettings>(key: K, value: FeaturesSettings[K]) => onChange({ ...settings, [key]: value });
  const switchKeys: Array<[keyof FeaturesSettings, string]> = [['split_tunnel_enabled','Split tunnel'],['collab_optimization','Collaboration optimization'],['other_vpn_bypass','Other VPN bypass'],['ssl_inspection','SSL inspection'],['log_forwarding','Export client logs']];
  const toggle = (value: boolean, action: () => void) => <button type="button" onClick={action}>{value ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}</button>;
  return <div className="space-y-6">
    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4"><Network size={14} className="text-cyan-400" />DNS Routing</h3>
      <div className="flex items-center justify-between py-2"><div><div className="text-sm text-gray-300">Route DNS through ApexAegis</div><div className="text-[10px] text-gray-500">Listed FQDNs resolve outside the tunnel</div></div>{toggle(settings.dns_routing.enabled, () => update('dns_routing', { ...settings.dns_routing, enabled: !settings.dns_routing.enabled }))}</div>
      <label className="text-xs text-gray-500 block mt-3 mb-1">Tunnel DNS resolver</label><input value={settings.dns_routing.resolver} onChange={e => update('dns_routing', { ...settings.dns_routing, resolver: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm" />
      <label className="text-xs text-gray-500 block mt-3 mb-1">FQDN exceptions, one per line</label><textarea rows={5} value={settings.dns_routing.exceptions.join('\n')} onChange={e => update('dns_routing', { ...settings.dns_routing, exceptions: e.target.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean) })} placeholder="login.microsoftonline.com" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono" />
    </section>
    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"><h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4"><Database size={14} className="text-purple-400" />Client Runtime Features</h3>{switchKeys.map(([key,label]) => <div key={key} className="flex items-center justify-between py-2 border-b border-gray-800/60 last:border-0"><span className="text-sm text-gray-300">{label}</span>{toggle(Boolean(settings[key]), () => update(key, !settings[key] as never))}</div>)}</section>
    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"><h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4"><Eye size={14} className="text-red-400" />Endpoint DLP</h3><div className="flex items-center justify-between py-2"><span className="text-sm text-gray-300">Enable endpoint DLP controls</span>{toggle(settings.dlp.enabled, () => update('dlp', { ...settings.dlp, enabled: !settings.dlp.enabled }))}</div></section>
  </div>;
}
