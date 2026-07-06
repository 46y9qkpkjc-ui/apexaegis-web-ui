'use client';
import React from 'react';
import { clsx } from 'clsx';
import { Radar, AlertTriangle } from 'lucide-react';

const findings = [
  { exposure: 'Environment variables leaked (.env with DB credentials in build artifact)', sev: 'critical', assets: 4, vector: 'Secrets / data leak', status: 'open' },
  { exposure: 'API key exposed in client bundle / public repository', sev: 'critical', assets: 2, vector: 'Secrets / data leak', status: 'open' },
  { exposure: 'Internet-exposed RDP on 3 hosts', sev: 'critical', assets: 3, vector: 'External attack surface', status: 'open' },
  { exposure: 'Unpatched CVE-2026-46333 (kernel 5.15)', sev: 'high', assets: 27, vector: 'Privilege escalation', status: 'mitigating' },
  { exposure: 'Over-permissive S3 bucket policy (public read)', sev: 'high', assets: 2, vector: 'Data exposure', status: 'open' },
  { exposure: 'Legacy TLS 1.0 accepted at edge', sev: 'medium', assets: 5, vector: 'Downgrade', status: 'open' },
  { exposure: 'Stale admin accounts (>90d inactive)', sev: 'medium', assets: 14, vector: 'Identity', status: 'open' },
];

const sevColor: Record<string, string> = {
  critical: 'bg-red-900/30 text-red-400', high: 'bg-orange-900/30 text-orange-400',
  medium: 'bg-yellow-900/30 text-yellow-400', low: 'bg-gray-800 text-gray-400',
};

export default function CTEMPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Radar className="text-cyan-400" size={24} /> CTEM — Continuous Threat Exposure Management
        </h1>
        <p className="text-sm text-gray-400 mt-1">Continuously discovered, prioritized exposures across the attack surface, with remediation status.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Open exposures', findings.filter(f => f.status === 'open').length, 'text-red-400'],
          ['Mitigating', findings.filter(f => f.status === 'mitigating').length, 'text-amber-400'],
          ['Critical', findings.filter(f => f.sev === 'critical').length, 'text-red-400'],
          ['Assets affected', findings.reduce((a, f) => a + f.assets, 0), 'text-cyan-400']].map(([l, v, c]) => (
          <div key={l as string} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-400">{l}</div>
            <div className={clsx('text-2xl font-bold mt-1', c as string)}>{v}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 text-sm font-semibold flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-400" /> Prioritized Exposures
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="text-left font-medium px-4 py-2">Exposure</th>
                <th className="text-left font-medium px-4 py-2">Severity</th>
                <th className="text-right font-medium px-4 py-2">Assets</th>
                <th className="text-left font-medium px-4 py-2">Vector</th>
                <th className="text-left font-medium px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-2.5 text-gray-200">{f.exposure}</td>
                  <td className="px-4 py-2.5"><span className={clsx('text-[11px] px-1.5 py-0.5 rounded', sevColor[f.sev])}>{f.sev}</span></td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{f.assets}</td>
                  <td className="px-4 py-2.5 text-gray-400">{f.vector}</td>
                  <td className="px-4 py-2.5 text-gray-400 capitalize">{f.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
