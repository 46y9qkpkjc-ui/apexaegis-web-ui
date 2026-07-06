'use client';
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ShieldAlert, Clipboard, Printer, Usb, ToggleLeft, ToggleRight, Save } from 'lucide-react';

interface Channel { key: string; label: string; icon: typeof Usb; enabled: boolean; action: 'block' | 'monitor'; }

const initial: Channel[] = [
  { key: 'copy-paste', label: 'Copy / Paste exfiltration', icon: Clipboard, enabled: true, action: 'block' },
  { key: 'print', label: 'Print exfiltration', icon: Printer, enabled: true, action: 'monitor' },
  { key: 'usb', label: 'USB / removable media exfiltration', icon: Usb, enabled: true, action: 'block' },
];

const DATA_TYPES = ['PII (NRIC, passport)', 'PCI (card numbers)', 'Credentials / API keys', 'Source code', 'Financial records'];

export default function EndpointDLPProfilePage() {
  const [channels, setChannels] = useState(initial);
  const [types, setTypes] = useState<string[]>(['PII (NRIC, passport)', 'PCI (card numbers)', 'Credentials / API keys']);
  const [dirty, setDirty] = useState(false);

  const toggle = (k: string) => { setChannels(cs => cs.map(c => c.key === k ? { ...c, enabled: !c.enabled } : c)); setDirty(true); };
  const setAction = (k: string, a: 'block' | 'monitor') => { setChannels(cs => cs.map(c => c.key === k ? { ...c, action: a } : c)); setDirty(true); };
  const toggleType = (t: string) => { setTypes(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]); setDirty(true); };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="text-cyan-400" size={24} /> Endpoint DLP Profile</h1>
        <p className="text-sm text-gray-400 mt-1">Control endpoint exfiltration channels and the data types they inspect.</p>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 text-sm font-semibold">Exfiltration Channels</div>
        <div className="divide-y divide-gray-800/60">
          {channels.map(({ key, label, icon: Icon, enabled, action }) => (
            <div key={key} className="flex items-center gap-3 px-4 py-3.5">
              <Icon size={16} className="text-gray-500 shrink-0" />
              <span className="flex-1 text-sm text-gray-200">{label}</span>
              {enabled && (
                <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden text-xs">
                  <button onClick={() => setAction(key, 'block')} className={clsx('px-2.5 py-1', action === 'block' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-200')}>Block</button>
                  <button onClick={() => setAction(key, 'monitor')} className={clsx('px-2.5 py-1', action === 'monitor' ? 'bg-yellow-700 text-white' : 'text-gray-400 hover:text-gray-200')}>Monitor</button>
                </div>
              )}
              <button onClick={() => toggle(key)}>{enabled ? <ToggleRight size={26} className="text-cyan-400" /> : <ToggleLeft size={26} className="text-gray-600" />}</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
        <div className="text-sm font-semibold mb-3">Data Types to Inspect</div>
        <div className="flex flex-wrap gap-2">
          {DATA_TYPES.map(t => (
            <button key={t} onClick={() => toggleType(t)}
              className={clsx('text-xs px-2.5 py-1 rounded border', types.includes(t) ? 'bg-cyan-600/20 border-cyan-600 text-cyan-300' : 'bg-gray-800 border-gray-700 text-gray-400')}>{t}</button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setDirty(false)} disabled={!dirty}
          className={clsx('flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg', dirty ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed')}>
          <Save size={15} /> Save Profile
        </button>
      </div>
    </div>
  );
}
