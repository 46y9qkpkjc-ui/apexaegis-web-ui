'use client';
import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Router, Globe, Server, Zap, Check, Plus, Minus, MapPin } from 'lucide-react';

interface CountryProv {
  code: string;
  name: string;
  flag: string;
  mode: 'auto' | 'manual';
  provisioned: number;
}

const HOME_COUNTRIES = [
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
];

const AWAY: CountryProv[] = [
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', mode: 'auto', provisioned: 1 },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', mode: 'auto', provisioned: 0 },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', mode: 'manual', provisioned: 0 },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', mode: 'manual', provisioned: 0 },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', mode: 'auto', provisioned: 0 },
  { code: 'IN', name: 'India', flag: '🇮🇳', mode: 'manual', provisioned: 1 },
  { code: 'US', name: 'United States', flag: '🇺🇸', mode: 'manual', provisioned: 0 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', mode: 'auto', provisioned: 0 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', mode: 'manual', provisioned: 0 },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', mode: 'auto', provisioned: 0 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', mode: 'manual', provisioned: 0 },
];

const MAX_LICENSED = 20; // gateway licensing from the tenant's tier

export default function PEPLicensingPage() {
  const [home, setHome] = useState('SG');
  const [homePdps, setHomePdps] = useState(3);
  const [away, setAway] = useState<CountryProv[]>(AWAY);

  const totalProvisioned = useMemo(
    () => homePdps + away.reduce((a, c) => a + c.provisioned, 0),
    [homePdps, away],
  );

  const setMode = (code: string, mode: 'auto' | 'manual') =>
    setAway(list => list.map(c => c.code === code ? { ...c, mode } : c));
  const provision = (code: string, delta: number) =>
    setAway(list => list.map(c => c.code === code ? { ...c, provisioned: Math.max(0, c.provisioned + delta) } : c));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Router className="text-cyan-400" size={24} /> PEP Licensing <span className="text-sm font-normal text-gray-500">(Gateway / Broker)</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">License and provision Policy Enforcement Points across countries — auto or manual per country.</p>
      </div>

      {/* License usage */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-2"><Server size={15} className="text-cyan-400" /> PEP licenses in use</span>
          <span className={clsx('font-mono', totalProvisioned > MAX_LICENSED ? 'text-red-400' : 'text-gray-200')}>{totalProvisioned} / {MAX_LICENSED}</span>
        </div>
        <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className={clsx('h-full rounded-full', totalProvisioned > MAX_LICENSED ? 'bg-red-500' : 'bg-cyan-500')}
            style={{ width: `${Math.min(100, (totalProvisioned / MAX_LICENSED) * 100)}%` }} />
        </div>
      </div>

      {/* Home country */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
        <div className="text-sm font-semibold flex items-center gap-2 mb-3"><MapPin size={15} className="text-cyan-400" /> Home Country</div>
        <div className="flex items-center gap-4 flex-wrap">
          <select value={home} onChange={e => setHome(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500/50">
            {HOME_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">PEPs deployed:</span>
            <button onClick={() => setHomePdps(n => Math.max(1, n - 1))} className="w-7 h-7 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 flex items-center justify-center"><Minus size={14} /></button>
            <span className="w-8 text-center font-mono text-gray-200">{homePdps}</span>
            <button onClick={() => setHomePdps(n => n + 1)} className="w-7 h-7 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 flex items-center justify-center"><Plus size={14} /></button>
          </div>
        </div>
      </div>

      {/* Away countries */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 text-sm font-semibold flex items-center gap-2">
          <Globe size={16} className="text-cyan-400" /> Away Countries — provision PEPs
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="text-left font-medium px-4 py-2">Country</th>
                <th className="text-left font-medium px-4 py-2">Provisioning</th>
                <th className="text-right font-medium px-4 py-2">PEPs</th>
                <th className="text-left font-medium px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {away.map(c => (
                <tr key={c.code} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-2.5 text-gray-200">{c.flag} {c.name}</td>
                  <td className="px-4 py-2.5">
                    <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden text-xs">
                      <button onClick={() => setMode(c.code, 'auto')}
                        className={clsx('px-2.5 py-1 flex items-center gap-1', c.mode === 'auto' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200')}>
                        <Zap size={11} /> Auto
                      </button>
                      <button onClick={() => setMode(c.code, 'manual')}
                        className={clsx('px-2.5 py-1', c.mode === 'manual' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200')}>
                        Manual
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => provision(c.code, -1)} className="w-6 h-6 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 flex items-center justify-center"><Minus size={12} /></button>
                      <span className="w-6 text-center font-mono text-gray-200">{c.provisioned}</span>
                      <button onClick={() => provision(c.code, 1)} className="w-6 h-6 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 flex items-center justify-center"><Plus size={12} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {c.provisioned > 0
                      ? <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 flex items-center gap-1 w-fit"><Check size={11} /> {c.mode === 'auto' ? 'Auto-provisioned' : 'Provisioned'}</span>
                      : <span className="text-[11px] text-gray-500">{c.mode === 'auto' ? 'Auto on first request' : 'Not provisioned'}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
