'use client';
import React from 'react';
import { clsx } from 'clsx';
import { Compass, Server, Lock } from 'lucide-react';

const discovered = [
  { name: 'GitLab (self-hosted)', proto: 'HTTPS', host: 'gitlab.corp.internal:443', users: 142, exposure: 'internal', status: 'unmanaged' },
  { name: 'Jenkins CI', proto: 'HTTPS', host: 'ci.corp.internal:8080', users: 63, exposure: 'internal', status: 'unmanaged' },
  { name: 'Internal Wiki (Confluence)', proto: 'HTTPS', host: 'wiki.corp.internal:443', users: 388, exposure: 'internal', status: 'managed' },
  { name: 'SSH Bastion', proto: 'SSH', host: 'bastion.corp.internal:22', users: 21, exposure: 'internal', status: 'unmanaged' },
  { name: 'Grafana', proto: 'HTTPS', host: 'metrics.corp.internal:3000', users: 47, exposure: 'internal', status: 'managed' },
  { name: 'Oracle DB', proto: 'TCP', host: 'db-prod.corp.internal:1521', users: 12, exposure: 'restricted', status: 'unmanaged' },
];

export default function PrivateAppDiscoveryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Compass className="text-cyan-400" size={24} /> Private App Discovery
        </h1>
        <p className="text-sm text-gray-400 mt-1">Private applications and internal resources discovered from traffic — bring them under ZTNA policy.</p>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 text-sm font-semibold flex items-center gap-2">
          <Server size={16} className="text-cyan-400" /> Discovered Private Apps
          <span className="ml-auto text-[11px] text-gray-500 font-normal">{discovered.length} found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="text-left font-medium px-4 py-2">Application</th>
                <th className="text-left font-medium px-4 py-2">Protocol</th>
                <th className="text-left font-medium px-4 py-2">Host</th>
                <th className="text-right font-medium px-4 py-2">Users</th>
                <th className="text-left font-medium px-4 py-2">Exposure</th>
                <th className="text-left font-medium px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {discovered.map((a, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-2.5 font-medium text-gray-200">{a.name}</td>
                  <td className="px-4 py-2.5 text-gray-400">{a.proto}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{a.host}</td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{a.users}</td>
                  <td className="px-4 py-2.5 text-gray-400 capitalize">{a.exposure}</td>
                  <td className="px-4 py-2.5">
                    <span className={clsx('text-[11px] px-1.5 py-0.5 rounded',
                      a.status === 'managed' ? 'bg-green-900/30 text-green-400' : 'bg-amber-900/30 text-amber-400')}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {a.status === 'unmanaged' && (
                      <button className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1">
                        <Lock size={11} /> Bring under policy
                      </button>
                    )}
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
