'use client';
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Network, ToggleLeft, ToggleRight, Save } from 'lucide-react';

interface Classifier { key: string; label: string; desc: string; enabled: boolean; action: 'block' | 'monitor'; threshold: number; }

const initial: Classifier[] = [
  { key: 'pii', label: 'PII', desc: 'NRIC, passport, email lists, names + IDs', enabled: true, action: 'block', threshold: 85 },
  { key: 'pci', label: 'PCI / Card Data', desc: 'PAN, CVV, magnetic-stripe patterns', enabled: true, action: 'block', threshold: 90 },
  { key: 'secrets', label: 'Credentials & Secrets', desc: 'API keys, tokens, private keys, passwords', enabled: true, action: 'block', threshold: 80 },
  { key: 'source', label: 'Source Code', desc: 'Proprietary source code and config', enabled: true, action: 'monitor', threshold: 75 },
  { key: 'financial', label: 'Financial Records', desc: 'Statements, ledgers, forecasts', enabled: false, action: 'monitor', threshold: 80 },
];

export default function TransitDLPProfilePage() {
  const [rows, setRows] = useState(initial);
  const [dirty, setDirty] = useState(false);

  const toggle = (k: string) => { setRows(cs => cs.map(c => c.key === k ? { ...c, enabled: !c.enabled } : c)); setDirty(true); };
  const setAction = (k: string, a: 'block' | 'monitor') => { setRows(cs => cs.map(c => c.key === k ? { ...c, action: a } : c)); setDirty(true); };
  const setThreshold = (k: string, v: number) => { setRows(cs => cs.map(c => c.key === k ? { ...c, threshold: v } : c)); setDirty(true); };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Network className="text-cyan-400" size={24} /> Transit DLP Profile &amp; Classifier</h1>
        <p className="text-sm text-gray-400 mt-1">Network DLP classifiers applied to in-line traffic — enable, set action, and tune the confidence threshold.</p>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl divide-y divide-gray-800/60">
        {rows.map(({ key, label, desc, enabled, action, threshold }) => (
          <div key={key} className="flex items-center gap-4 px-4 py-3.5">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-200">{label}</div>
              <div className="text-[12px] text-gray-500">{desc}</div>
            </div>
            {enabled && (
              <>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Threshold</span>
                  <input type="range" min={50} max={99} value={threshold} onChange={e => setThreshold(key, +e.target.value)} className="w-24 accent-cyan-500" />
                  <span className="w-8 font-mono text-gray-300">{threshold}%</span>
                </div>
                <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden text-xs">
                  <button onClick={() => setAction(key, 'block')} className={clsx('px-2.5 py-1', action === 'block' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-200')}>Block</button>
                  <button onClick={() => setAction(key, 'monitor')} className={clsx('px-2.5 py-1', action === 'monitor' ? 'bg-yellow-700 text-white' : 'text-gray-400 hover:text-gray-200')}>Monitor</button>
                </div>
              </>
            )}
            <button onClick={() => toggle(key)}>{enabled ? <ToggleRight size={26} className="text-cyan-400" /> : <ToggleLeft size={26} className="text-gray-600" />}</button>
          </div>
        ))}
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
