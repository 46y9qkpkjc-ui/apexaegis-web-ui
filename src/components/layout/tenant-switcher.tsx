'use client';
import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Building2, ChevronDown, Layers, Check } from 'lucide-react';
import { fetchTenantSummaries } from '@/lib/tenants-api';
import { useTenantContext, type ActiveTenant } from '@/lib/tenant-context';

// TenantSwitcher sets the active tenant that scopes the console. Selecting a
// tenant re-scopes the CURRENT page in place (no navigation); the scope banner
// and all pages reflect the selected tenant.
export function TenantSwitcher() {
  const { active, setActive } = useTenantContext();
  const [tenants, setTenants] = useState<ActiveTenant[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => fetchTenantSummaries()
      .then(list => setTenants(list.map(t => ({ id: t.tenant_id, name: t.tenant_name }))))
      .catch(() => { /* backend unavailable */ });
    load();
    const id = setInterval(load, 30000); // newly onboarded tenants appear automatically
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const select = (t: ActiveTenant | null) => {
    setActive(t);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-600/40 text-sm transition-all max-w-[260px]"
        title="Switch tenant scope"
      >
        <span className="text-[10px] uppercase tracking-wider text-cyan-500/80 font-semibold shrink-0">Tenant</span>
        {active ? <Building2 size={14} className="text-cyan-400 shrink-0" /> : <Layers size={14} className="text-cyan-400 shrink-0" />}
        <span className="truncate text-gray-100 font-medium">{active ? active.name : 'All Tenants'}</span>
        <ChevronDown size={13} className={clsx('text-cyan-400/70 transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 max-h-[70vh] overflow-y-auto bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl z-50 py-1">
          <button
            onClick={() => select(null)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/50"
          >
            <Layers size={14} className="text-cyan-400" />
            <span className="flex-1 text-left">All Tenants</span>
            {!active && <Check size={14} className="text-cyan-400" />}
          </button>
          <div className="my-1 border-t border-gray-800/60" />
          {tenants.map(t => (
            <button
              key={t.id}
              onClick={() => select(t)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/50"
            >
              <Building2 size={14} className="text-gray-500" />
              <span className="flex-1 text-left truncate">{t.name}</span>
              {active?.id === t.id && <Check size={14} className="text-cyan-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
