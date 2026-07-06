'use client';
import React from 'react';
import { clsx } from 'clsx';
import { Ghost } from 'lucide-react';
import type { GhostedApp } from '@/lib/tenants-api';

const riskColor: Record<string, string> = {
  critical: 'bg-red-900/30 text-red-400 border-red-800',
  high: 'bg-orange-900/30 text-orange-400 border-orange-800',
  medium: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  low: 'bg-gray-800 text-gray-400 border-gray-700',
};

export function GhostedAppsCard({ apps, showTenant = true }: { apps: GhostedApp[]; showTenant?: boolean }) {
  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 text-sm font-semibold flex items-center gap-2">
        <Ghost size={16} className="text-fuchsia-400" /> Ghosted Apps &amp; Services
        <span className="ml-auto text-[11px] text-gray-500 font-normal">{apps.length} detected</span>
      </div>
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800 sticky top-0 bg-gray-900">
              <th className="text-left font-medium px-4 py-2">App / Service</th>
              <th className="text-left font-medium px-4 py-2">Category</th>
              {showTenant && <th className="text-left font-medium px-4 py-2">Tenant</th>}
              <th className="text-right font-medium px-4 py-2">Devices</th>
              <th className="text-left font-medium px-4 py-2">Risk</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 && (
              <tr><td colSpan={showTenant ? 5 : 4} className="px-4 py-6 text-center text-gray-500">No ghosted apps detected.</td></tr>
            )}
            {apps.map((a, i) => (
              <tr key={`${a.tenant_id}-${a.name}-${i}`} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-2.5">
                  <div className="font-medium text-gray-200">{a.name}</div>
                  <div className="text-[11px] text-gray-500">{a.vendor}</div>
                </td>
                <td className="px-4 py-2.5 text-gray-400">{a.category}</td>
                {showTenant && <td className="px-4 py-2.5 text-gray-300">{a.tenant_name}</td>}
                <td className="px-4 py-2.5 text-right font-mono text-gray-200">{a.device_count}</td>
                <td className="px-4 py-2.5">
                  <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border', riskColor[a.risk_level] ?? riskColor.low)}>
                    {a.risk_level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
