'use client';
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Database, Users, ChevronRight } from 'lucide-react';
import { IDENTITY_STORES } from '@/lib/identity-stores';

const typeColor: Record<string, string> = {
  'Active Directory': 'bg-blue-900/30 text-blue-300 border-blue-800',
  'OIDC': 'bg-purple-900/30 text-purple-300 border-purple-800',
  'SAML': 'bg-cyan-900/30 text-cyan-300 border-cyan-800',
  'Local': 'bg-gray-800 text-gray-300 border-gray-700',
};

export default function IdentityStorePage() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="text-cyan-400" size={24} /> Identity Store
        </h1>
        <p className="text-sm text-gray-400 mt-1">Connected identity providers and their groups — the source for RBAC role group mapping.</p>
      </div>

      <div className="space-y-2">
        {IDENTITY_STORES.map(store => (
          <div key={store.id} className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
            <button onClick={() => setOpen(open === store.id ? null : store.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/30">
              <ChevronRight size={15} className={clsx('text-gray-500 transition-transform', open === store.id && 'rotate-90')} />
              <Database size={16} className="text-cyan-400" />
              <span className="font-medium text-gray-200">{store.name}</span>
              <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border', typeColor[store.type] ?? typeColor.Local)}>{store.type}</span>
              <span className="ml-auto flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Users size={12} /> {store.users.toLocaleString()}</span>
                <span>{store.groups.length} groups</span>
                <span className={store.status === 'connected' ? 'text-green-400' : 'text-red-400'}>● {store.status}</span>
              </span>
            </button>
            {open === store.id && (
              <div className="border-t border-gray-800 px-4 py-3 flex flex-wrap gap-2">
                {store.groups.map(g => (
                  <span key={g} className="text-xs px-2 py-1 rounded bg-gray-800/60 border border-gray-700 text-gray-300">{g}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
