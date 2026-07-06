'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  ShieldCheck, Plus, Trash2, Save, ToggleLeft, ToggleRight,
  Globe, Building2, Search, X,
} from 'lucide-react';
import {
  fetchTenants, fetchPages, fetchRoles, createRole, updateRole, deleteRole,
  type Tenant, type RbacPage, type RbacRole,
} from '@/lib/rbac-api';

interface Grant { view: boolean; edit: boolean; }
type GrantMap = Record<string, Grant>;

function grantsFromRole(role: RbacRole | null): GrantMap {
  const m: GrantMap = {};
  if (role) {
    for (const g of role.pages) m[g.page_slug] = { view: g.can_view, edit: g.can_edit };
  }
  return m;
}

export default function RbacPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pages, setPages] = useState<RbacPage[]>([]);
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [scope, setScope] = useState<string>('all'); // 'all' | 'global' | tenant uuid
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Editing draft for the selected role
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [grants, setGrants] = useState<GrantMap>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageSearch, setPageSearch] = useState('');

  // Create form
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTenant, setNewTenant] = useState('global');
  const [newDesc, setNewDesc] = useState('');
  const [error, setError] = useState('');

  const loadStatic = useCallback(async () => {
    try {
      const [t, p] = await Promise.all([fetchTenants(), fetchPages()]);
      setTenants(t);
      setPages(p);
    } catch { /* backend unavailable */ }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const r = await fetchRoles(scope);
      setRoles(r);
    } catch { setRoles([]); }
  }, [scope]);

  useEffect(() => { loadStatic(); }, [loadStatic]);
  useEffect(() => { loadRoles(); }, [loadRoles]);

  const selected = useMemo(
    () => roles.find(r => r.id === selectedId) ?? null,
    [roles, selectedId],
  );

  // Sync the draft whenever the selected role changes
  useEffect(() => {
    setDraftName(selected?.name ?? '');
    setDraftDesc(selected?.description ?? '');
    setGrants(grantsFromRole(selected));
    setDirty(false);
  }, [selected]);

  const pagesByCategory = useMemo(() => {
    const q = pageSearch.trim().toLowerCase();
    const groups: Record<string, RbacPage[]> = {};
    for (const p of pages) {
      if (q && !p.label.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) continue;
      (groups[p.category] ??= []).push(p);
    }
    return groups;
  }, [pages, pageSearch]);

  const grantedCount = (role: RbacRole) => role.pages.filter(p => p.can_view || p.can_edit).length;

  function setGrant(slug: string, next: Partial<Grant>) {
    setGrants(prev => {
      const cur = prev[slug] ?? { view: false, edit: false };
      const merged = { ...cur, ...next };
      // Editing implies viewing; removing view removes edit.
      if (merged.edit) merged.view = true;
      if (!merged.view) merged.edit = false;
      return { ...prev, [slug]: merged };
    });
    setDirty(true);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const pagesPayload = Object.entries(grants)
        .filter(([, g]) => g.view || g.edit)
        .map(([page_slug, g]) => ({ page_slug, can_view: g.view, can_edit: g.edit }));
      await updateRole(selected.id, { name: draftName, description: draftDesc, pages: pagesPayload });
      await loadRoles();
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save role');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    setError('');
    try {
      const { id } = await createRole({ name: newName, tenant_id: newTenant, description: newDesc });
      setCreating(false);
      setNewName(''); setNewDesc(''); setNewTenant('global');
      await loadRoles();
      setSelectedId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create role');
    }
  }

  async function handleDelete(role: RbacRole) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    setError('');
    try {
      await deleteRole(role.id);
      if (selectedId === role.id) setSelectedId(null);
      await loadRoles();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete role');
    }
  }

  const scopeLabel = (r: RbacRole) => (r.org_id ? r.org_name : 'Global (MSP)');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-cyan-400" size={24} />
            RBAC / Roles
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Create roles and toggle which console pages they can view or edit. Scope a role to a
            tenant, or make it global (MSP). Governs page access — not tenant data isolation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Tenant</span>
          <select
            value={scope}
            onChange={e => { setScope(e.target.value); setSelectedId(null); }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:border-cyan-500/50 outline-none"
          >
            <option value="all">All tenants</option>
            <option value="global">Global (MSP)</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button
            onClick={() => { setCreating(true); setError(''); setNewTenant(scope === 'all' ? 'global' : scope); }}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={15} /> New Role
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg">
          <X size={14} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Role list */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-1">
            Roles ({roles.length})
          </div>
          {roles.length === 0 && (
            <div className="text-sm text-gray-500 border border-dashed border-gray-800 rounded-lg p-4 text-center">
              No roles in this scope yet.
            </div>
          )}
          {roles.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={clsx(
                'w-full text-left px-3 py-2.5 rounded-lg border transition-all',
                selectedId === r.id
                  ? 'bg-cyan-600/15 border-cyan-600/50'
                  : 'bg-gray-900/40 border-gray-800 hover:border-gray-700',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm text-gray-200 truncate">{r.name}</span>
                <span className="text-[10px] text-gray-500 shrink-0">{grantedCount(r)} pages</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {r.org_id
                  ? <Building2 size={11} className="text-gray-500" />
                  : <Globe size={11} className="text-purple-400" />}
                <span className={clsx('text-[11px]', r.org_id ? 'text-gray-400' : 'text-purple-400')}>
                  {scopeLabel(r)}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail / permission matrix */}
        <div>
          {!selected && (
            <div className="text-sm text-gray-500 border border-dashed border-gray-800 rounded-xl p-10 text-center">
              Select a role to edit its page permissions, or create a new one.
            </div>
          )}

          {selected && (
            <div className="space-y-4">
              <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    {selected.org_id
                      ? <Building2 size={13} className="text-gray-400" />
                      : <Globe size={13} className="text-purple-400" />}
                    <span className={selected.org_id ? 'text-gray-400' : 'text-purple-400'}>
                      {scopeLabel(selected)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(selected)}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-500">Role name</label>
                    <input
                      value={draftName}
                      onChange={e => { setDraftName(e.target.value); setDirty(true); }}
                      className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:border-cyan-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500">Description</label>
                    <input
                      value={draftDesc}
                      onChange={e => { setDraftDesc(e.target.value); setDirty(true); }}
                      className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:border-cyan-500/50 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Page toggle matrix */}
              <div className="bg-gray-900/40 border border-gray-800 rounded-xl">
                <div className="flex items-center justify-between p-3 border-b border-gray-800">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      value={pageSearch}
                      onChange={e => setPageSearch(e.target.value)}
                      placeholder="Filter pages…"
                      className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm w-56 focus:border-cyan-500/50 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-6 text-[11px] text-gray-500 pr-2">
                    <span className="w-10 text-center">View</span>
                    <span className="w-10 text-center">Edit</span>
                  </div>
                </div>

                <div className="max-h-[540px] overflow-y-auto divide-y divide-gray-800/60">
                  {Object.entries(pagesByCategory).map(([cat, catPages]) => (
                    <div key={cat}>
                      <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-900/60">
                        {cat}
                      </div>
                      {catPages.map(p => {
                        const g = grants[p.slug] ?? { view: false, edit: false };
                        return (
                          <div key={p.slug} className="flex items-center justify-between px-4 py-2 hover:bg-gray-800/30">
                            <span className="text-sm text-gray-300">{p.label}</span>
                            <div className="flex items-center gap-6 pr-2">
                              <button onClick={() => setGrant(p.slug, { view: !g.view })} className="w-10 flex justify-center" title="Can view">
                                {g.view
                                  ? <ToggleRight size={22} className="text-cyan-400" />
                                  : <ToggleLeft size={22} className="text-gray-600" />}
                              </button>
                              <button onClick={() => setGrant(p.slug, { edit: !g.edit })} className="w-10 flex justify-center" title="Can edit">
                                {g.edit
                                  ? <ToggleRight size={22} className="text-amber-400" />
                                  : <ToggleLeft size={22} className="text-gray-600" />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                {dirty && <span className="text-xs text-amber-400">Unsaved changes</span>}
                <button
                  onClick={handleSave}
                  disabled={!dirty || saving}
                  className={clsx(
                    'flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg transition-colors',
                    dirty && !saving
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed',
                  )}
                >
                  <Save size={15} /> {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setCreating(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 w-[420px] space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">New Role</h2>
              <button onClick={() => setCreating(false)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div>
              <label className="text-[11px] text-gray-500">Role name</label>
              <input
                autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Tenant Auditor"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-cyan-500/50 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500">Scope</label>
              <select
                value={newTenant} onChange={e => setNewTenant(e.target.value)}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-cyan-500/50 outline-none"
              >
                <option value="global">Global (MSP — all tenants)</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-gray-500">Description</label>
              <input
                value={newDesc} onChange={e => setNewDesc(e.target.value)}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-cyan-500/50 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setCreating(false)} className="text-sm px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-200">Cancel</button>
              <button
                onClick={handleCreate} disabled={!newName.trim()}
                className={clsx('text-sm px-4 py-1.5 rounded-lg', newName.trim() ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed')}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
