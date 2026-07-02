'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Users, Search, ArrowLeft, UserCheck, UserX } from 'lucide-react';
import { listConnectorUsers, type AdUser } from '@/lib/ad-connector-api';

export default function AdConnectorUsersPage() {
  const [users, setUsers] = useState<AdUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { users, total } = await listConnectorUsers();
        setUsers(users);
        setTotal(total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.upn.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.display_name.toLowerCase().includes(q) ||
        u.sam_account_name.toLowerCase().includes(q),
    );
  }, [users, search]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/ad-connector" className="text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1 mb-2">
          <ArrowLeft size={14} /> AD Connector
        </Link>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Users size={22} className="text-blue-400" /> Synced AD Users
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} user{total === 1 ? '' : 's'} from the last directory sync. Read-only — sourced from Active Directory.
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, UPN, email, or sAMAccountName..."
          className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-600"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">{error}</div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-500 text-sm">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">UPN</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Groups</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.sid} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.display_name || u.sam_account_name}</div>
                    <div className="text-xs text-gray-500 font-mono">{u.sam_account_name}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-400">{u.upn || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    {u.enabled ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium border bg-green-900/40 text-green-400 border-green-800 inline-flex items-center gap-1">
                        <UserCheck size={12} /> Enabled
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium border bg-gray-800 text-gray-500 border-gray-700 inline-flex items-center gap-1">
                        <UserX size={12} /> Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">{u.group_sids?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
