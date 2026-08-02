'use client';
import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Network, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { brandForUser } from '@/lib/brands';

// INTERIM DEMO-SCOPING — there is no backend transit-DLP feed yet (real detections
// arrive from future SSL-inspection work). These placeholder rows deliberately span
// several tenants; we filter them to the logged-in tenant at render time so a tenant
// admin (e.g. Evelyn/Aspire) never sees another tenant's rows. Each demo row encodes
// its tenant in the sender's email domain (user1@aspire.example -> "aspire"). Drop
// this scoping and read the tenant-scoped API once the real DLP feed lands.
const events = [
  { time: '1m ago', user: 'anderson@ibm.example', dest: 'https://paste.ee', classifier: 'Source code', match: 92, action: 'blocked', sev: 'high' },
  { time: '6m ago', user: 'frank@dbs.example', dest: 'https://drive.google.com (personal)', classifier: 'PII — NRIC', match: 98, action: 'blocked', sev: 'critical' },
  { time: '11m ago', user: 'user1@aspire.example', dest: 'smtp://mail.proton.me', classifier: 'PCI — PAN', match: 95, action: 'blocked', sev: 'critical' },
  { time: '19m ago', user: 'user2@ocbc.example', dest: 'https://wetransfer.com', classifier: 'Financial records', match: 88, action: 'monitor', sev: 'medium' },
  { time: '33m ago', user: 'jason@dbs.example', dest: 'https://api.github.com', classifier: 'Credentials / secrets', match: 90, action: 'blocked', sev: 'high' },
  { time: '58m ago', user: 'user3@hpe.example', dest: 'ftp://203.0.113.9', classifier: 'PII — email list', match: 84, action: 'blocked', sev: 'high' },
];

// Tenant slug carried in a demo row's email domain: "user1@aspire.example" -> "aspire".
const tenantOfRow = (email: string) => (email.split('@')[1] ?? '').split('.')[0];

const sevColor: Record<string, string> = {
  critical: 'bg-red-900/30 text-red-400', high: 'bg-orange-900/30 text-orange-400',
  medium: 'bg-yellow-900/30 text-yellow-400', info: 'bg-gray-800 text-gray-400',
};

export default function TransitDLPLogPage() {
  const [search, setSearch] = useState('');
  // Current tenant for a plain tenant admin (consumer): the brand slug resolved
  // from their identity — "aspire" for evelyn.ng.aspire@apexaegis.app. MSP/super-
  // admin users resolve to their operator/platform brand, which matches no demo
  // row, so they get the empty state rather than another tenant's data (interim:
  // the switcher's active-tenant isn't wired to this placeholder feed yet).
  const user = useAuthStore(s => s.user);
  const tenant = brandForUser(user);
  const tenantRows = useMemo(() => events.filter(e => tenantOfRow(e.user) === tenant), [tenant]);
  const rows = useMemo(() => tenantRows.filter(e =>
    !search || e.user.includes(search.toLowerCase()) || e.classifier.toLowerCase().includes(search.toLowerCase()) || e.dest.toLowerCase().includes(search.toLowerCase())
  ), [tenantRows, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Network className="text-cyan-400" size={24} /> Transit DLP Log
        </h1>
        <p className="text-sm text-gray-400 mt-1">Data exfiltration detected in network traffic by the DLP classifier (in-line inspection).</p>
      </div>

      {tenantRows.length === 0 ? (
        // Interim empty state — never fall through to another tenant's rows.
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl px-6 py-16 text-center">
          <Network className="mx-auto text-gray-600" size={28} />
          <p className="mt-3 text-sm text-gray-400">No DLP events for this tenant yet</p>
          <p className="mt-1 text-xs text-gray-600">Transit DLP detections appear here once in-line inspection is live.</p>
        </div>
      ) : (
      <>
      <div className="relative w-56">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user / classifier…"
          className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm w-full focus:border-cyan-500/50 outline-none" />
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
              <th className="text-left font-medium px-4 py-2">Time</th>
              <th className="text-left font-medium px-4 py-2">User</th>
              <th className="text-left font-medium px-4 py-2">Destination</th>
              <th className="text-left font-medium px-4 py-2">Classifier</th>
              <th className="text-right font-medium px-4 py-2">Match</th>
              <th className="text-left font-medium px-4 py-2">Action</th>
              <th className="text-left font-medium px-4 py-2">Severity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => (
              <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-2.5 text-gray-500 text-xs">{e.time}</td>
                <td className="px-4 py-2.5 text-gray-300">{e.user}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{e.dest}</td>
                <td className="px-4 py-2.5 text-gray-300">{e.classifier}</td>
                <td className="px-4 py-2.5 text-right font-mono text-gray-400">{e.match}%</td>
                <td className="px-4 py-2.5">
                  <span className={clsx('text-[11px] px-1.5 py-0.5 rounded',
                    e.action === 'blocked' ? 'bg-red-900/30 text-red-400' : e.action === 'monitor' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-green-900/30 text-green-400')}>{e.action}</span>
                </td>
                <td className="px-4 py-2.5"><span className={clsx('text-[11px] px-1.5 py-0.5 rounded', sevColor[e.sev])}>{e.sev}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}
    </div>
  );
}
