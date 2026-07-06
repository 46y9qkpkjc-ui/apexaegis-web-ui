'use client';
import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TenantDashboard } from '@/components/dashboard/tenant-dashboard';
import { useTenantContext } from '@/lib/tenant-context';
import { fetchTenantSummaries } from '@/lib/tenants-api';

// Direct/deep-link to a tenant dashboard. Sets the active scope so the switcher
// + scope banner stay consistent with what's shown.
export default function TenantDashboardPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const { active, setActive } = useTenantContext();

  useEffect(() => {
    if (id && active?.id !== id) {
      fetchTenantSummaries()
        .then(list => {
          const t = list.find(x => x.tenant_id === id);
          if (t) setActive({ id: t.tenant_id, name: t.tenant_name });
        })
        .catch(() => { /* keep current scope */ });
    }
  }, [id, active?.id, setActive]);

  return <TenantDashboard tenantId={id} showBackLink />;
}
