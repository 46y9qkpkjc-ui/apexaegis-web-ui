'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Shield, ArrowLeft, Building2 } from 'lucide-react';
import { fetchPolicyDetail, type PolicyDetail } from '@/lib/tenants-api';

export default function PolicyDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [p, setP] = useState<PolicyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetchPolicyDetail(id)
      .then(d => { if (alive) { setP(d); setError(''); } })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : 'Failed to load'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/policies" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300">
        <ArrowLeft size={13} /> Policies
      </Link>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="text-blue-400" size={24} />
          {p?.name ?? 'Policy'}
        </h1>
        <p className="text-sm text-gray-500 mt-1 font-mono">{id}</p>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}
      {loading && <div className="text-gray-500 text-sm">Loading…</div>}

      {p && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl divide-y divide-gray-800/60">
          <Row label="Tenant">
            {p.tenant_name ? (
              <Link href={`/tenants/${p.tenant_id}`} className="inline-flex items-center gap-1.5 text-cyan-400 hover:underline">
                <Building2 size={13} /> {p.tenant_name}
              </Link>
            ) : '—'}
            {p.tenant_id && <span className="ml-2 font-mono text-[11px] text-gray-500">{p.tenant_id}</span>}
          </Row>
          <Row label="Action">
            <span className={clsx('text-xs px-2 py-0.5 rounded',
              p.action === 'deny' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400')}>
              {p.action}
            </span>
          </Row>
          <Row label="Sequence"><span className="font-mono text-gray-300">{p.sequence}</span></Row>
          <Row label="Enabled">
            <span className={p.enabled ? 'text-green-400' : 'text-gray-500'}>{p.enabled ? 'Yes' : 'No'}</span>
          </Row>
          <Row label="Cloud Apps">{p.cloud_apps || '—'}</Row>
          <Row label="URL Categories">{p.url_categories || '—'}</Row>
          <Row label="Source Groups">{p.groups || '—'}</Row>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <div className="w-32 shrink-0 text-xs text-gray-500 pt-0.5">{label}</div>
      <div className="text-sm text-gray-300">{children}</div>
    </div>
  );
}
