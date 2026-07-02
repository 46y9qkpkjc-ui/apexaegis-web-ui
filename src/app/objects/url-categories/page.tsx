'use client';
import { useCallback, useEffect, useState } from 'react';
import { Network, Search, Shield, X, Loader2, Globe, ChevronRight } from 'lucide-react';
import { apiUrl } from '@/lib/api-url';
import { useAuthStore } from '@/lib/auth-store';

interface UrlCategory {
  id: string;
  name: string;
  category_type: 'security' | 'content' | 'productivity' | 'custom';
  subcategory?: string;
  description?: string;
  is_system: boolean;
  enabled: boolean;
  domain_count: number;
  used_in_policies: number;
}

interface CategoryDomain { domain: string; source: string }
interface CategoryDetail extends UrlCategory { domains: CategoryDomain[] }
interface CategoryMatch { category_id: string; category_name: string; matched_domain: string }

const typeBadge: Record<string, string> = {
  security: 'bg-red-900/40 text-red-400 border-red-800',
  content: 'bg-amber-900/40 text-amber-400 border-amber-800',
  productivity: 'bg-blue-900/40 text-blue-300 border-blue-800',
  custom: 'bg-green-900/30 text-green-400 border-green-800',
};
const typeIcon: Record<string, string> = {
  security: 'text-red-400',
  content: 'text-amber-400',
  productivity: 'text-blue-400',
  custom: 'text-green-400',
};

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function UrlCategoriesPage() {
  const [categories, setCategories] = useState<UrlCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [detail, setDetail] = useState<CategoryDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<CategoryMatch[] | null>(null);
  const [testing, setTesting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/v1/objects/url-categories'), { headers: authHeaders() });
      if (!res.ok) throw new Error(`URL categories rejected: HTTP ${res.status}`);
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load URL categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const openDetail = async (cat: UrlCategory) => {
    setLoadingDetail(true);
    setDetail({ ...cat, domains: [] });
    try {
      const res = await fetch(apiUrl(`/api/v1/objects/url-categories/${cat.id}`), { headers: authHeaders() });
      if (!res.ok) throw new Error(`Category detail rejected: HTTP ${res.status}`);
      setDetail(await res.json());
    } catch {
      // keep the header we already showed; domains stay empty
    } finally {
      setLoadingDetail(false);
    }
  };

  const runTest = async () => {
    if (!testUrl.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(apiUrl(`/api/v1/objects/categorize?domain=${encodeURIComponent(testUrl.trim())}`), { headers: authHeaders() });
      if (!res.ok) throw new Error(`Categorize rejected: HTTP ${res.status}`);
      const data = await res.json();
      setTestResult(data.matches ?? []);
    } catch {
      setTestResult([]);
    } finally {
      setTesting(false);
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subcategory ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Network size={24} className="text-orange-400" />
        <div>
          <h1 className="text-xl font-semibold">URL Categories</h1>
          <p className="text-sm text-gray-500">Domain categorization used by web-filtering and access policies</p>
        </div>
      </div>

      {/* Categorize-a-URL tester */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={15} className="text-blue-400" />
          <span className="text-sm font-medium">Categorize a URL</span>
          <span className="text-xs text-gray-600">— check which category a domain resolves to</span>
        </div>
        <div className="flex gap-2">
          <input
            value={testUrl}
            onChange={e => setTestUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runTest(); }}
            placeholder="e.g. www.dbs.com.sg"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
          />
          <button onClick={runTest} disabled={testing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            {testing && <Loader2 size={14} className="animate-spin" />} Categorize
          </button>
        </div>
        {testResult !== null && (
          <div className="mt-3 text-sm">
            {testResult.length === 0 ? (
              <span className="text-gray-500">No category — this domain is uncategorized.</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {testResult.map(m => (
                  <span key={m.category_id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800 border border-gray-700 text-xs">
                    <Shield size={12} className="text-orange-400" />
                    {m.category_name}
                    <span className="text-gray-600">via {m.matched_domain}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full pl-9 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-center">Type</th>
              <th className="px-4 py-3 text-right">Domains</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-center">Source</th>
              <th className="px-4 py-3 text-center">Used In</th>
              <th className="w-8 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                <Loader2 size={16} className="animate-spin inline mr-2" />Loading categories…
              </td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-red-400 text-xs">{error}</td></tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No categories match “{searchQuery}”.</td></tr>
            )}
            {!loading && !error && filtered.map(cat => (
              <tr key={cat.id} onClick={() => openDetail(cat)}
                className="hover:bg-gray-800/30 transition-colors cursor-pointer">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className={typeIcon[cat.category_type] ?? 'text-gray-400'} />
                    <span className="font-medium">{cat.name}</span>
                    {cat.subcategory && <span className="text-xs text-gray-600">({cat.subcategory})</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border capitalize ${typeBadge[cat.category_type] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {cat.category_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-gray-400">{cat.domain_count.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[250px] truncate">{cat.description}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${cat.is_system ? 'bg-gray-800 text-gray-400' : 'bg-green-900/30 text-green-400'}`}>
                    {cat.is_system ? 'Built-in' : 'Custom'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 text-xs">{cat.used_in_policies}</span>
                </td>
                <td className="px-4 py-3 text-gray-600"><ChevronRight size={14} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {detail && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setDetail(null)} />
          <div className="fixed top-0 right-0 h-full w-[440px] bg-gray-900 border-l border-gray-700 shadow-2xl z-50 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield size={18} className={typeIcon[detail.category_type] ?? 'text-gray-400'} />
                <h3 className="text-lg font-semibold">{detail.name}</h3>
              </div>
              <button onClick={() => setDetail(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            {detail.description && <p className="text-sm text-gray-500 mb-4">{detail.description}</p>}
            <div className="grid grid-cols-3 gap-3 mb-5 text-center">
              <div className="bg-gray-800/50 rounded-lg py-2">
                <div className="text-lg font-semibold">{detail.domain_count.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Domains</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg py-2">
                <div className="text-lg font-semibold capitalize">{detail.category_type}</div>
                <div className="text-xs text-gray-500">Type</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg py-2">
                <div className="text-lg font-semibold">{detail.used_in_policies}</div>
                <div className="text-xs text-gray-500">Policies</div>
              </div>
            </div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Domains</div>
            {loadingDetail ? (
              <div className="text-gray-500 text-sm py-4"><Loader2 size={14} className="animate-spin inline mr-2" />Loading domains…</div>
            ) : detail.domains.length === 0 ? (
              <div className="text-gray-600 text-sm py-4">No domains seeded for this category yet.</div>
            ) : (
              <div className="space-y-1">
                {detail.domains.map(d => (
                  <div key={d.domain} className="flex items-center justify-between px-3 py-1.5 bg-gray-800/40 rounded text-sm font-mono">
                    <span>{d.domain}</span>
                    <span className="text-xs text-gray-600 font-sans">{d.source}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
