'use client';
import React from 'react';
import { Database, Eye, Route } from 'lucide-react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import type { FeaturesSettings } from '@/app/admin/client-config/page';

interface Props { settings: FeaturesSettings; onChange: (settings: FeaturesSettings) => void }

export function FeaturesSettingsComponent({ settings, onChange }: Props) {
  const update = <K extends keyof FeaturesSettings>(key: K, value: FeaturesSettings[K]) => onChange({ ...settings, [key]: value });
  const switchKeys: Array<[keyof FeaturesSettings, string]> = [['split_tunnel_enabled','Split tunnel'],['collab_optimization','Collaboration optimization'],['other_vpn_bypass','Other VPN bypass'],['log_forwarding','Export client logs']];
  const toggle = (value: boolean, action: () => void) => <button type="button" onClick={action}>{value ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}</button>;
  return <div className="space-y-6">
    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4"><Route size={14} className="text-cyan-400" />Routing Ownership</h3>
      <div className="space-y-3 text-sm text-gray-300">
        <p>DNS routing, split tunnel bypass lists, and tunnel inclusions are managed from the Route Configuration page so steering rules stay separate from endpoint behavior.</p>
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-3 text-xs text-gray-400">
          The desktop client does not perform SSL inspection locally. TLS inspection is enforced on the gateway path, so there is no endpoint SSL inspection toggle here.
        </div>
      </div>
    </section>
    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"><h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4"><Database size={14} className="text-purple-400" />Client Runtime Features</h3>{switchKeys.map(([key,label]) => <div key={key} className="flex items-center justify-between py-2 border-b border-gray-800/60 last:border-0"><span className="text-sm text-gray-300">{label}</span>{toggle(Boolean(settings[key]), () => update(key, !settings[key] as never))}</div>)}</section>
    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"><h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4"><Eye size={14} className="text-red-400" />Endpoint DLP</h3><div className="flex items-center justify-between py-2"><span className="text-sm text-gray-300">Enable endpoint DLP controls</span>{toggle(settings.dlp.enabled, () => update('dlp', { ...settings.dlp, enabled: !settings.dlp.enabled }))}</div></section>
  </div>;
}
