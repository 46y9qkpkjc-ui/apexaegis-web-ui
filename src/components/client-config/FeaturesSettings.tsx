'use client';
import React from 'react';
import { Database, Eye, Route, ShieldAlert } from 'lucide-react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { FeaturesSettings, DnsSecurityCategories, DnsSecurityAction } from '@/app/admin/client-config/page';

interface Props { settings: FeaturesSettings; onChange: (settings: FeaturesSettings) => void }

const DNS_CATEGORIES: Array<{ key: keyof DnsSecurityCategories; label: string; desc: string }> = [
  { key: 'nrd', label: 'Newly Registered Domains (NRD)', desc: 'Registered within the last ~30 days' },
  { key: 'nod', label: 'Newly Observed Domains (NOD)', desc: 'Seen resolving for the first time on the gateway' },
  { key: 'dga', label: 'Algorithmically Generated (DGA)', desc: 'Domain-generation-algorithm patterns used by botnet C2' },
  { key: 'malicious', label: 'Malicious', desc: 'Known malware, phishing, and command-and-control' },
  { key: 'spyware', label: 'Spyware / Tracking', desc: 'Spyware, stalkerware, and tracking domains' },
];

export function FeaturesSettingsComponent({ settings, onChange }: Props) {
  const update = <K extends keyof FeaturesSettings>(key: K, value: FeaturesSettings[K]) => onChange({ ...settings, [key]: value });
  const updateCategory = (key: keyof DnsSecurityCategories, action: DnsSecurityAction) =>
    update('dns_security_categories', { ...settings.dns_security_categories, [key]: action });
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
    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2"><ShieldAlert size={14} className="text-amber-400" />DNS Security</h3>
        {toggle(settings.dns_security, () => update('dns_security', !settings.dns_security))}
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Forwards this group&apos;s DNS through the tunnel for Layer-7 threat filtering. When off, no category blocking is applied and members resolve normally. Route Configuration DNS exceptions still egress the physical network even while this is on.
      </p>
      {settings.dns_security ? (
        <div className="space-y-1">
          <div className="text-xs text-gray-500 mb-1">An unset category denies by default (fail-secure). Set a category to Allow to permit it.</div>
          {DNS_CATEGORIES.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-3 py-2 border-b border-gray-800/60 last:border-0">
              <div>
                <div className="text-sm text-gray-300">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-gray-700 text-xs shrink-0">
                {(['allow','deny'] as DnsSecurityAction[]).map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => updateCategory(key, action)}
                    className={clsx(
                      'px-3 py-1.5 font-medium transition-colors',
                      settings.dns_security_categories[key] === action
                        ? (action === 'deny' ? 'bg-red-600 text-white' : 'bg-green-600 text-white')
                        : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                    )}
                  >
                    {action === 'deny' ? 'Deny' : 'Allow'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-3 text-xs text-gray-500">
          DNS security is disabled for this group. Enable it to configure per-category allow/deny policy.
        </div>
      )}
    </section>
    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"><h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4"><Database size={14} className="text-purple-400" />Client Runtime Features</h3>{switchKeys.map(([key,label]) => <div key={key} className="flex items-center justify-between py-2 border-b border-gray-800/60 last:border-0"><span className="text-sm text-gray-300">{label}</span>{toggle(Boolean(settings[key]), () => update(key, !settings[key] as never))}</div>)}</section>
    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"><h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4"><Eye size={14} className="text-red-400" />Endpoint DLP</h3><div className="flex items-center justify-between py-2"><span className="text-sm text-gray-300">Enable endpoint DLP controls</span>{toggle(settings.dlp.enabled, () => update('dlp', { ...settings.dlp, enabled: !settings.dlp.enabled }))}</div></section>
  </div>;
}
