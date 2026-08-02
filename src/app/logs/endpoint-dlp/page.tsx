'use client';
import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { ShieldAlert, Search, Clipboard, Printer, Usb } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { brandForUser } from '@/lib/brands';

const CHANNELS: Record<string, { icon: typeof Usb; label: string }> = {
  'copy-paste': { icon: Clipboard, label: 'Copy / Paste' },
  print: { icon: Printer, label: 'Print' },
  usb: { icon: Usb, label: 'USB' },
};

// INTERIM DEMO-SCOPING — there is no backend endpoint-DLP feed yet (real events
// arrive from future agent work). These placeholder rows deliberately span several
// tenants; we filter them to the logged-in tenant at render time so a tenant admin
// (e.g. Evelyn/Aspire) never sees another tenant's rows. Each demo row encodes its
// tenant in the sender's email domain (user1@aspire.example -> "aspire"). Drop this
// scoping and read the tenant-scoped API once the real DLP feed lands.
const events = [
  { time: '2m ago', user: 'frank@dbs.example', device: 'dbs-windows-3', channel: 'usb', data: 'Customer PII (2,041 records)', action: 'blocked', sev: 'critical' },
  { time: '9m ago', user: 'anderson@ibm.example', device: 'ibm-macos-2', channel: 'copy-paste', data: 'Source code snippet', action: 'blocked', sev: 'high' },
  { time: '14m ago', user: 'jason@dbs.example', device: 'dbs-windows-1', channel: 'print', data: 'Financial statement (PDF)', action: 'allowed', sev: 'info' },
  { time: '23m ago', user: 'user1@aspire.example', device: 'aspire-laptop-1', channel: 'copy-paste', data: 'API key (sk-…)', action: 'blocked', sev: 'critical' },
  { time: '41m ago', user: 'user2@ocbc.example', device: 'ocbc-windows-4', channel: 'usb', data: 'Spreadsheet (PCI card data)', action: 'blocked', sev: 'critical' },
  { time: '1h ago', user: 'user3@hpe.example', device: 'hpe-macos-5', channel: 'print', data: 'Internal roadmap', action: 'monitor', sev: 'medium' },
];

// Tenant slug carried in a demo row's email domain: "user1@aspire.example" -> "aspire".
const tenantOfRow = (email: string) => (email.split('@')[1] ?? '').split('.')[0];

const sevColor: Record<string, string> = {
  critical: 'bg-red-900/30 text-red-400', high: 'bg-orange-900/30 text-orange-400',
  medium: 'bg-yellow-900/30 text-yellow-400', info: 'bg-gray-800 text-gray-400',
};

export default function EndpointDLPLogPage() {
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('all');
  // Current tenant for a plain tenant admin (consumer): the brand slug resolved
  // from their identity — "aspire" for evelyn.ng.aspire@apexaegis.app. MSP/super-
  // admin users resolve to their operator/platform brand, which matches no demo
  // row, so they get the empty state rather than another tenant's data (interim:
  // the switcher's active-tenant isn't wired to this placeholder feed yet).
  const user = useAuthStore(s => s.user);
  const tenant = brandForUser(user);
  const tenantRows = useMemo(() => events.filter(e => tenantOfRow(e.user) === tenant), [tenant]);
  const rows = useMemo(() => tenantRows.filter(e =>
    (channel === 'all' || e.channel === channel) &&
    (!search || e.user.includes(search.toLowerCase()) || e.data.toLowerCase().includes(search.toLowerCase()))
  ), [tenantRows, search, channel]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="text-cyan-400" size={24} /> Endpoint DLP Log
        </h1>
        <p className="text-sm text-gray-400 mt-1">Data exfiltration attempts detected on endpoints — copy/paste, print, and USB channels.</p>
      </div>

      {tenantRows.length === 0 ? (
        // Interim empty state — never fall through to another tenant's rows.
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl px-6 py-16 text-center">
          <ShieldAlert className="mx-auto text-gray-600" size={28} />
          <p className="mt-3 text-sm text-gray-400">No DLP events for this tenant yet</p>
          <p className="mt-1 text-xs text-gray-600">Endpoint DLP telemetry appears here once the agent feed is live.</p>
        </div>
      ) : (
      <>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user or data…"
            className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm w-56 focus:border-cyan-500/50 outline-none" />
        </div>
        <select value={channel} onChange={e => setChannel(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-cyan-500/50">
          <option value="all">All channels</option>
          <option value="copy-paste">Copy / Paste</option>
          <option value="print">Print</option>
          <option value="usb">USB</option>
        </select>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
              <th className="text-left font-medium px-4 py-2">Time</th>
              <th className="text-left font-medium px-4 py-2">User</th>
              <th className="text-left font-medium px-4 py-2">Device</th>
              <th className="text-left font-medium px-4 py-2">Channel</th>
              <th className="text-left font-medium px-4 py-2">Data</th>
              <th className="text-left font-medium px-4 py-2">Action</th>
              <th className="text-left font-medium px-4 py-2">Severity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => {
              const Ch = CHANNELS[e.channel].icon;
              return (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{e.time}</td>
                  <td className="px-4 py-2.5 text-gray-300">{e.user}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{e.device}</td>
                  <td className="px-4 py-2.5"><span className="inline-flex items-center gap-1.5 text-gray-300"><Ch size={13} className="text-cyan-400" /> {CHANNELS[e.channel].label}</span></td>
                  <td className="px-4 py-2.5 text-gray-300">{e.data}</td>
                  <td className="px-4 py-2.5">
                    <span className={clsx('text-[11px] px-1.5 py-0.5 rounded',
                      e.action === 'blocked' ? 'bg-red-900/30 text-red-400' : e.action === 'monitor' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-green-900/30 text-green-400')}>{e.action}</span>
                  </td>
                  <td className="px-4 py-2.5"><span className={clsx('text-[11px] px-1.5 py-0.5 rounded', sevColor[e.sev])}>{e.sev}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </>
      )}
    </div>
  );
}
