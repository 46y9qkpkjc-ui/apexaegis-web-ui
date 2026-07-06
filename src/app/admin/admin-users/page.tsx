'use client';
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { UserCog, Users, Shield } from 'lucide-react';

const admins = [
  { name: 'Arun Nadar', email: 'ak.nadar@apexadversary.com', role: 'super_admin', mfa: true, source: 'Okta' },
  { name: 'Security Ops', email: 'secops@apexaegis.app', role: 'security_admin', mfa: true, source: 'Corporate AD' },
  { name: 'Tenant Admin (DBS)', email: 'admin@dbs.example', role: 'org_admin', mfa: true, source: 'Entra ID' },
  { name: 'Auditor', email: 'audit@apexaegis.app', role: 'read_only', mfa: false, source: 'Okta' },
];

const adminGroups = [
  { name: 'Platform Admins', members: 3, mappedRole: 'super_admin', source: 'Okta' },
  { name: 'SOC Analysts', members: 12, mappedRole: 'security_admin', source: 'Okta' },
  { name: 'Auditors', members: 5, mappedRole: 'read_only', source: 'Corporate AD' },
];

const roleColor: Record<string, string> = {
  super_admin: 'bg-green-900/30 text-green-400 border-green-800',
  security_admin: 'bg-cyan-900/30 text-cyan-300 border-cyan-800',
  org_admin: 'bg-blue-900/30 text-blue-300 border-blue-800',
  read_only: 'bg-gray-800 text-gray-300 border-gray-700',
};

export default function AdminUsersPage() {
  const [tab, setTab] = useState<'users' | 'groups'>('users');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="text-cyan-400" size={24} /> Admin Users &amp; Groups
        </h1>
        <p className="text-sm text-gray-400 mt-1">Console administrators and admin groups mapped to roles (see RBAC / Roles for role definitions).</p>
      </div>

      <div className="flex border-b border-gray-800">
        {(['users', 'groups'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px',
              tab === t ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200')}>
            {t === 'users' ? <Users size={14} /> : <Shield size={14} />}
            {t === 'users' ? 'Admin Users' : 'Admin Groups'}
          </button>
        ))}
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          {tab === 'users' ? (
            <>
              <thead><tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="text-left font-medium px-4 py-2">Name</th>
                <th className="text-left font-medium px-4 py-2">Email</th>
                <th className="text-left font-medium px-4 py-2">Role</th>
                <th className="text-left font-medium px-4 py-2">MFA</th>
                <th className="text-left font-medium px-4 py-2">Identity Source</th>
              </tr></thead>
              <tbody>
                {admins.map((a, i) => (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-2.5 font-medium text-gray-200">{a.name}</td>
                    <td className="px-4 py-2.5 text-gray-400">{a.email}</td>
                    <td className="px-4 py-2.5"><span className={clsx('text-[11px] px-1.5 py-0.5 rounded border', roleColor[a.role])}>{a.role}</span></td>
                    <td className="px-4 py-2.5">{a.mfa ? <span className="text-green-400 text-xs">Enabled</span> : <span className="text-gray-500 text-xs">—</span>}</td>
                    <td className="px-4 py-2.5 text-gray-400">{a.source}</td>
                  </tr>
                ))}
              </tbody>
            </>
          ) : (
            <>
              <thead><tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="text-left font-medium px-4 py-2">Group</th>
                <th className="text-right font-medium px-4 py-2">Members</th>
                <th className="text-left font-medium px-4 py-2">Mapped Role</th>
                <th className="text-left font-medium px-4 py-2">Identity Source</th>
              </tr></thead>
              <tbody>
                {adminGroups.map((g, i) => (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-2.5 font-medium text-gray-200">{g.name}</td>
                    <td className="px-4 py-2.5 text-right text-gray-300">{g.members}</td>
                    <td className="px-4 py-2.5"><span className={clsx('text-[11px] px-1.5 py-0.5 rounded border', roleColor[g.mappedRole])}>{g.mappedRole}</span></td>
                    <td className="px-4 py-2.5 text-gray-400">{g.source}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>
    </div>
  );
}
