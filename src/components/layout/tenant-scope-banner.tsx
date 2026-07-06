'use client';
import { useRouter } from 'next/navigation';
import { Building2, X } from 'lucide-react';
import { useTenantContext } from '@/lib/tenant-context';

// Shows across every page when a tenant is active, so it's clear the whole
// console (all 41 pages) is scoped to that tenant.
export function TenantScopeBanner() {
  const router = useRouter();
  const { active, setActive } = useTenantContext();
  if (!active) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-cyan-600/10 border-b border-cyan-600/30 text-xs">
      <Building2 size={13} className="text-cyan-400 shrink-0" />
      <span className="text-cyan-200">
        Scoped to <strong className="text-cyan-100">{active.name}</strong> — every page shows this tenant&apos;s data.
      </span>
      <button
        onClick={() => { setActive(null); router.push('/'); }}
        className="ml-auto flex items-center gap-1 text-cyan-400/80 hover:text-cyan-200"
      >
        <X size={12} /> Exit to All Tenants
      </button>
    </div>
  );
}
