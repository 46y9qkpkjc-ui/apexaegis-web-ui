'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Eye, Search, Filter, X, MonitorSmartphone, Ghost, ShieldCheck } from 'lucide-react';
import { fetchDevices, type DeviceRow } from '@/lib/device-api';
import { fetchGhostedApps, type GhostedApp } from '@/lib/tenants-api';
import { GhostedAppsCard } from '@/components/dashboard/ghosted-apps-card';

const managedBadge: Record<string, string> = {
  corporate: 'bg-blue-900/30 text-blue-300 border-blue-800',
  byod: 'bg-amber-900/30 text-amber-300 border-amber-800',
};

export function DeviceInventory({ tenantId }: { tenantId?: string }) {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [ghosted, setGhosted] = useState<GhostedApp[]>([]);
  const [search, setSearch] = useState('');
  const [osFilter, setOsFilter] = useState('all');
  const [compFilter, setCompFilter] = useState('all');
  const [selected, setSelected] = useState<DeviceRow | null>(null);
  const [tab, setTab] = useState<'posture' | 'ghosted'>('posture');

  useEffect(() => {
    fetchDevices(tenantId).then(setDevices).catch(() => setDevices([]));
    fetchGhostedApps().then(setGhosted).catch(() => setGhosted([]));
  }, [tenantId]);

  const osOptions = useMemo(() => Array.from(new Set(devices.map(d => d.os_type).filter(Boolean))).sort(), [devices]);

  const filtered = useMemo(() => devices.filter(d => {
    if (osFilter !== 'all' && d.os_type !== osFilter) return false;
    if (compFilter !== 'all' && d.compliance_status !== compFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.hostname.toLowerCase().includes(q) || d.os_version.toLowerCase().includes(q) || d.tenant_name.toLowerCase().includes(q);
    }
    return true;
  }), [devices, osFilter, compFilter, search]);

  const modalGhosted = useMemo(
    () => (selected ? ghosted.filter(g => g.tenant_id === selected.tenant_id) : []),
    [ghosted, selected],
  );

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3 flex-wrap">
        <div className="text-sm font-semibold flex items-center gap-2">
          <MonitorSmartphone size={16} className="text-cyan-400" /> Enrolled Devices
          <span className="text-[11px] text-gray-500 font-normal">{filtered.length}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search device…"
              className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm w-48 focus:border-cyan-500/50 outline-none" />
          </div>
          <div className="flex items-center gap-1 text-gray-500"><Filter size={13} /></div>
          <select value={osFilter} onChange={e => setOsFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm focus:border-cyan-500/50 outline-none">
            <option value="all">All OS</option>
            {osOptions.map(os => <option key={os} value={os}>{os}</option>)}
          </select>
          <select value={compFilter} onChange={e => setCompFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm focus:border-cyan-500/50 outline-none">
            <option value="all">All status</option>
            <option value="compliant">Compliant</option>
            <option value="non_compliant">Non-compliant</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800 sticky top-0 bg-gray-900">
              <th className="text-left font-medium px-4 py-2">Hostname</th>
              <th className="text-left font-medium px-4 py-2">OS</th>
              <th className="text-left font-medium px-4 py-2">Compliance</th>
              <th className="text-left font-medium px-4 py-2">Managed</th>
              {!tenantId && <th className="text-left font-medium px-4 py-2">Tenant</th>}
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No devices match.</td></tr>
            )}
            {filtered.map(d => (
              <tr key={d.device_id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-2.5 font-medium text-gray-200">{d.hostname}</td>
                <td className="px-4 py-2.5 text-gray-400">{d.os_version || d.os_type}</td>
                <td className="px-4 py-2.5">
                  <span className={clsx('text-[11px] px-1.5 py-0.5 rounded',
                    d.compliance_status === 'compliant' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400')}>
                    {d.compliance_status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border uppercase', managedBadge[d.managed_type] ?? managedBadge.corporate)}>
                    {d.managed_type}
                  </span>
                </td>
                {!tenantId && <td className="px-4 py-2.5 text-gray-300">{d.tenant_name}</td>}
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => { setSelected(d); setTab('posture'); }} className="text-gray-500 hover:text-cyan-400" title="View">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelected(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-[680px] max-w-[94vw] max-h-[86vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h2 className="font-semibold flex items-center gap-2"><MonitorSmartphone size={16} className="text-cyan-400" /> {selected.hostname}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="flex border-b border-gray-800 px-4">
              {(['posture', 'ghosted'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={clsx('flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px',
                    tab === t ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200')}>
                  {t === 'posture' ? <ShieldCheck size={14} /> : <Ghost size={14} />}
                  {t === 'posture' ? 'Device Posture' : 'Ghosted Apps'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto p-4">
              {tab === 'posture' ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Hostname" value={selected.hostname} />
                  <Field label="Device ID" value={selected.device_id} mono />
                  <Field label="OS" value={`${selected.os_type} · ${selected.os_version}`} />
                  <Field label="Compliance" value={selected.compliance_status} />
                  <Field label="Managed by" value={selected.managed_type === 'byod' ? 'BYOD' : 'Corporate'} />
                  <Field label="Tenant" value={selected.tenant_name} />
                  <Field label="Last seen" value={selected.last_seen?.slice(0, 19).replace('T', ' ') || '—'} />
                </div>
              ) : (
                <GhostedAppsCard apps={modalGhosted} showTenant={false} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-gray-800/30 border border-gray-800 rounded-lg px-3 py-2">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className={clsx('text-gray-200 mt-0.5', mono && 'font-mono text-xs')}>{value}</div>
    </div>
  );
}
