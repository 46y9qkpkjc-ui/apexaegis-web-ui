'use client';
import { useEffect } from 'react';

// Makes the whole console tenant-aware: while a tenant is active, every
// /api/v1 request carries X-Scope-Tenant-ID, which the management plane honors
// (for super_admin) by scoping org_id — so all pages show the selected tenant's
// data without per-page changes. One interceptor, installed once.
export function TenantScopeInterceptor() {
  useEffect(() => {
    const orig = window.fetch;
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : '';
        if (url.includes('/api/v1/')) {
          const raw = localStorage.getItem('apexaegis_active_tenant');
          const t = raw ? JSON.parse(raw) : null;
          if (t?.id) {
            const headers = new Headers(init?.headers);
            headers.set('X-Scope-Tenant-ID', t.id);
            return orig(input, { ...init, headers });
          }
        }
      } catch { /* fall through to unmodified fetch */ }
      return orig(input, init);
    };
    return () => { window.fetch = orig; };
  }, []);
  return null;
}
