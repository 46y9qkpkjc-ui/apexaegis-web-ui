'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Network, Search, ArrowLeft } from 'lucide-react';
import { listConnectorGroups, type AdGroup } from '@/lib/ad-connector-api';

export default function AdConnectorGroupsPage() {
  const [groups, setGroups] = useState<AdGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { groups, total } = await listConnectorGroups();
        setGroups(groups);
        setTotal(total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load groups');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) => g.name.toLowerCase().includes(q) || g.sam_account_name.toLowerCase().includes(q),
    );
  }, [groups, search]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/ad-connector" className="text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1 mb-2">
          <ArrowLeft size={14} /> AD Connector
        </Link>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Network size={22} className="text-blue-400" /> Synced AD Groups
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} group{total === 1 ? '' : 's'} from the last directory sync. Read-only — sourced from Active Directory.
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by group name or sAMAccountName..."
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
          <div className="flex items-center justify-center py-12 text-gray-500 text-sm">No groups found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">sAMAccountName</th>
                <th className="px-4 py-3">SID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.sid} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{g.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono">{g.sam_account_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{g.sid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
