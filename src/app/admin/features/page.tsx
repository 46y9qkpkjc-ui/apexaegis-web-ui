'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Shield, Lock, Globe, Bug, Brain, Users,
  FileText, Layers,
  Search, ChevronDown, ChevronRight, ToggleLeft, ToggleRight,
  Clock, Zap, CheckCircle2, XCircle, ShoppingCart, X, Check,
} from 'lucide-react';
import { clsx } from 'clsx';
import { fetchFeatures, toggleFeature, startTrial, type Feature } from '@/lib/feature-api';
import { useFeatures } from '@/hooks/use-features';

/* ─── Helpers ───────────────────────────────────────────────── */
const ORG_PLAN = 'enterprise'; // TODO: fetch from org context API

const planColors: Record<string, string> = {
  standard: 'bg-gray-800 text-gray-300 border-gray-700',
  professional: 'bg-blue-900/30 text-blue-400 border-blue-800',
  enterprise: 'bg-purple-900/30 text-purple-400 border-purple-800',
};

const planRank: Record<string, number> = { standard: 1, professional: 2, enterprise: 3 };

const categoryIcons: Record<string, typeof Shield> = {
  'Network Security': Globe,
  'Threat Protection': Bug,
  'Content Security': Layers,
  'SSL / Inspection': Lock,
  'Identity': Users,
  'Compliance & Visibility': FileText,
  'Advanced': Brain,
};

/* ─── Component ─────────────────────────────────────────────── */
export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(() => new Set());
  const [orderFeature, setOrderFeature] = useState<Feature | null>(null);
  const [ordering, setOrdering] = useState(false);
  const { refresh } = useFeatures();

  async function handlePlaceOrder() {
    if (!orderFeature) return;
    setOrdering(true);
    try {
      await toggleFeature(orderFeature.id, true); // order fulfilled -> feature activated
      await load();
      refresh();
      setOrderFeature(null);
    } catch (err) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setOrdering(false);
    }
  }

  const load = useCallback(async () => {
    try {
      const data = await fetchFeatures();
      setFeatures(data);
    } catch { /* backend unavailable */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Grouped and filtered
  const grouped = useMemo(() => {
    const filtered = features.filter(f => {
      if (planFilter !== 'all' && f.min_plan !== planFilter) return false;
      if (stateFilter === 'enabled' && !f.enabled) return false;
      if (stateFilter === 'disabled' && f.enabled) return false;
      if (stateFilter === 'trial' && !f.trial_end) return false;
      if (search) {
        const q = search.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.id.toLowerCase().includes(q);
      }
      return true;
    });

    const groups: Record<string, Feature[]> = {};
    for (const f of filtered) {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    }
    return groups;
  }, [features, search, planFilter, stateFilter]);

  const handleToggle = async (id: string) => {
    const f = features.find(x => x.id === id);
    if (!f) return;
    try {
      await toggleFeature(id, !f.enabled);
      await load();
      refresh();
    } catch (err) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const handleStartTrial = async (id: string) => {
    try {
      await startTrial(id);
      await load();
      refresh();
    } catch (err) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const toggleCat = (cat: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Stats
  const totalEnabled = features.filter(f => f.enabled).length;
  const totalDisabled = features.filter(f => !f.enabled).length;
  const totalTrials = features.filter(f => f.trial_end).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="text-yellow-400" size={24} />
            Feature Licensing
          </h1>
          <p className="text-sm text-gray-400 mt-1">Enable, disable, or trial platform capabilities per your subscription tier</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs border bg-purple-900/30 text-purple-400 border-purple-800 font-medium">
            Plan: {ORG_PLAN.charAt(0).toUpperCase() + ORG_PLAN.slice(1)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Total Features</div>
          <div className="text-2xl font-bold text-white">{features.length}</div>
        </div>
        <div className="bg-green-900/10 border border-green-900/30 rounded-xl p-4">
          <div className="text-xs text-green-400/70 mb-1 flex items-center gap-1"><CheckCircle2 size={12} /> Enabled</div>
          <div className="text-2xl font-bold text-green-400">{totalEnabled}</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><XCircle size={12} /> Disabled</div>
          <div className="text-2xl font-bold text-gray-400">{totalDisabled}</div>
        </div>
        <div className="bg-yellow-900/10 border border-yellow-900/30 rounded-xl p-4">
          <div className="text-xs text-yellow-400/70 mb-1 flex items-center gap-1"><Clock size={12} /> Active Trials</div>
          <div className="text-2xl font-bold text-yellow-400">{totalTrials}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search features..."
            className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-600"
          />
        </div>
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
        >
          <option value="all">All Plans</option>
          <option value="standard">Standard</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
        >
          <option value="all">All States</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
          <option value="trial">On Trial</option>
        </select>
      </div>

      {/* Feature Categories */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([category, feats]) => {
          const isCollapsed = collapsedCats.has(category);
          const CatIcon = categoryIcons[category] || Shield;
          const enabledCount = feats.filter(f => f.enabled).length;

          return (
            <div key={category} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => toggleCat(category)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/30 transition-colors"
              >
                {isCollapsed ? <ChevronRight size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                <CatIcon size={16} className="text-blue-400" />
                <span className="font-semibold text-sm text-gray-200">{category}</span>
                <span className="text-xs text-gray-500">
                  {enabledCount}/{feats.length} enabled
                </span>
                {/* Mini progress bar */}
                <div className="flex-1 flex justify-end">
                  <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(enabledCount / feats.length) * 100}%` }} />
                  </div>
                </div>
              </button>

              {/* Feature rows */}
              {!isCollapsed && (
                <div className="divide-y divide-gray-800/50">
                  {feats.map(f => {
                    const belowPlan = planRank[ORG_PLAN] < planRank[f.min_plan];
                    const isTrialActive = f.trial_end && new Date(f.trial_end) > new Date();
                    const isTrialExpired = f.trial_end && new Date(f.trial_end) <= new Date();
                    const canTrial = f.trial_days > 0 && !f.trial_end && !f.enabled;

                    return (
                      <div key={f.id} className={clsx(
                        'flex items-center gap-4 px-4 py-3 transition-colors',
                        belowPlan ? 'opacity-60' : 'hover:bg-gray-800/20',
                      )}>
                        {/* Toggle — enabling a disabled feature opens the order modal */}
                        <button
                          onClick={() => f.enabled ? handleToggle(f.id) : setOrderFeature(f)}
                          title={f.enabled ? 'Disable' : 'Place order to activate'}
                          className="flex-shrink-0"
                        >
                          {f.enabled ? (
                            <ToggleRight size={28} className="text-green-400" />
                          ) : (
                            <ToggleLeft size={28} className="text-gray-600" />
                          )}
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-200">{f.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] border ${planColors[f.min_plan]}`}>
                              {f.min_plan}
                            </span>
                            {isTrialActive && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-900/30 text-yellow-400 border border-yellow-800 flex items-center gap-1">
                                <Clock size={8} /> Trial ({Math.ceil((new Date(f.trial_end!).getTime() - Date.now()) / 86400000)}d left)
                              </span>
                            )}
                            {isTrialExpired && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-900/30 text-red-400 border border-red-800">
                                Trial Expired
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{f.description}</p>
                        </div>

                        {/* Trial button */}
                        {canTrial && (
                          <button
                            onClick={() => handleStartTrial(f.id)}
                            className="px-3 py-1.5 text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-800 rounded-lg hover:bg-yellow-900/50 transition-colors flex items-center gap-1"
                          >
                            <Zap size={10} />
                            {f.trial_days}d Trial
                          </button>
                        )}

                        {/* Activate (order) for disabled features */}
                        {!f.enabled && (
                          <button
                            onClick={() => setOrderFeature(f)}
                            className="px-3 py-1.5 text-xs bg-cyan-900/30 text-cyan-300 border border-cyan-800 rounded-lg hover:bg-cyan-900/50 transition-colors flex items-center gap-1"
                          >
                            <ShoppingCart size={11} /> Activate
                          </button>
                        )}

                        {/* Status */}
                        <div className="flex-shrink-0 w-16 text-right">
                          {f.enabled ? (
                            <span className="text-[10px] text-green-400 font-medium">ACTIVE</span>
                          ) : (
                            <span className="text-[10px] text-gray-600 font-medium">OFF</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Plan comparison footer */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">Plan Comparison</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(['standard', 'professional', 'enterprise'] as const).map(plan => {
            const availableCount = features.filter(f => planRank[plan] >= planRank[f.min_plan]).length;
            const isCurrentPlan = plan === ORG_PLAN;
            return (
              <div key={plan} className={clsx(
                'rounded-lg border p-3',
                isCurrentPlan ? 'border-blue-600 bg-blue-900/10' : 'border-gray-800 bg-gray-950/30',
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-200 capitalize">{plan}</span>
                  {isCurrentPlan && <span className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded">Current</span>}
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {availableCount}
                </div>
                <div className="text-xs text-gray-500">features available</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order modal — activate a feature by placing an order */}
      {orderFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => !ordering && setOrderFeature(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-[440px] max-w-[92vw] p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2"><ShoppingCart size={18} className="text-cyan-400" /> Activate Feature</h2>
              <button onClick={() => !ordering && setOrderFeature(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="bg-gray-800/40 border border-gray-800 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-200">{orderFeature.name}</div>
              <p className="text-xs text-gray-500 mt-0.5">{orderFeature.description}</p>
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                <span className={`px-1.5 py-0.5 rounded border ${planColors[orderFeature.min_plan]}`}>{orderFeature.min_plan} tier</span>
                <span className="text-gray-500">Requires {orderFeature.min_plan} subscription</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Placing this order adds <strong className="text-gray-200">{orderFeature.name}</strong> to the tenant&apos;s
              subscription and activates it across the console. Billing is prorated to the current cycle.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setOrderFeature(null)} disabled={ordering}
                className="text-sm px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 disabled:opacity-50">Cancel</button>
              <button onClick={handlePlaceOrder} disabled={ordering}
                className="text-sm px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 disabled:opacity-60">
                {ordering ? 'Placing order…' : <><Check size={14} /> Place order &amp; activate</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
