'use client';
import { useState, useCallback, useMemo } from 'react';
import { clsx } from 'clsx';
import {
  ArrowDownToLine, ArrowRight, CheckCircle2, AlertTriangle,
  Copy, Trash2, Zap, Eye, EyeOff, Key, RefreshCw, Loader2,
  ChevronDown, ChevronRight, Shield, X, Sparkles,
  Globe, Server, Cloud, Lock, Network, Bug, Filter,
  Merge, SplitSquareHorizontal, Check, Info,
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Platform Definitions ──────────────────────────────────── */
export interface PlatformConfig {
  id: string;
  name: string;
  logo: string;
  color: string;
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'zscaler',
    name: 'Zscaler ZIA',
    logo: 'ZS',
    color: 'bg-blue-600',
    fields: [
      { key: 'cloudName', label: 'Cloud Name', placeholder: 'zscaler.net' },
      { key: 'apiKey', label: 'API Key', placeholder: 'Enter ZIA API key', secret: true },
      { key: 'username', label: 'Admin Username', placeholder: 'admin@company.com' },
      { key: 'password', label: 'Password', placeholder: '••••••••', secret: true },
    ],
  },
  {
    id: 'netskope',
    name: 'Netskope',
    logo: 'NS',
    color: 'bg-teal-600',
    fields: [
      { key: 'tenantUrl', label: 'Tenant URL', placeholder: 'company.goskope.com' },
      { key: 'apiToken', label: 'API Token (v2)', placeholder: 'Enter Netskope v2 API token', secret: true },
    ],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Zero Trust',
    logo: 'CF',
    color: 'bg-orange-500',
    fields: [
      { key: 'accountId', label: 'Account ID', placeholder: 'Enter Cloudflare Account ID' },
      { key: 'apiToken', label: 'API Token', placeholder: 'Enter Gateway API token', secret: true },
    ],
  },
  {
    id: 'paloalto',
    name: 'Palo Alto Prisma Access',
    logo: 'PA',
    color: 'bg-red-600',
    fields: [
      { key: 'tenantServiceGroup', label: 'Tenant Service Group', placeholder: 'TSG ID' },
      { key: 'clientId', label: 'Client ID', placeholder: 'service-account@company.iam', secret: false },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'Enter client secret', secret: true },
    ],
  },
  {
    id: 'fortinet',
    name: 'Fortinet FortiSASE',
    logo: 'FN',
    color: 'bg-red-500',
    fields: [
      { key: 'forticloudEmail', label: 'FortiCloud Email', placeholder: 'admin@company.com' },
      { key: 'apiKey', label: 'REST API Key', placeholder: 'Enter FortiSASE API key', secret: true },
      { key: 'region', label: 'Region', placeholder: 'us / eu / ap' },
    ],
  },
  {
    id: 'cisco',
    name: 'Cisco Umbrella',
    logo: 'CU',
    color: 'bg-blue-500',
    fields: [
      { key: 'orgId', label: 'Organization ID', placeholder: 'Enter Umbrella Org ID' },
      { key: 'apiKey', label: 'Management API Key', placeholder: 'Enter API key', secret: true },
      { key: 'apiSecret', label: 'API Secret', placeholder: 'Enter API secret', secret: true },
    ],
  },
];

/* ─── Imported Policy Types ─────────────────────────────────── */
export interface ImportedPolicy {
  id: string;
  originalName: string;
  platform: string;
  type: 'web-filter' | 'firewall' | 'ssl' | 'dns' | 'dlp' | 'casb' | 'swg';
  action: 'allow' | 'deny' | 'monitor' | 'isolate';
  sources: string[];
  destinations: string[];
  categories: string[];
  enabled: boolean;
  /* Analysis fields */
  duplicateOf?: string;
  duplicateScore?: number;
  optimizationHints: string[];
  severity: 'ok' | 'warning' | 'critical';
  selected: boolean;
  expanded: boolean;
  mappedPolicy?: any;
}

/* ─── Simulated Fetch ───────────────────────────────────────── */
function generateMockPolicies(platformId: string): ImportedPolicy[] {
  const platformName = PLATFORMS.find(p => p.id === platformId)?.name || platformId;
  const types: ImportedPolicy['type'][] = ['web-filter', 'firewall', 'ssl', 'dns', 'dlp', 'casb', 'swg'];
  const actions: ImportedPolicy['action'][] = ['allow', 'deny', 'monitor', 'isolate'];

  const templates: Omit<ImportedPolicy, 'id' | 'platform' | 'selected' | 'expanded' | 'optimizationHints' | 'severity'>[] = [
    {
      originalName: 'Block Malware & C2',
      type: 'web-filter', action: 'deny', enabled: true,
      sources: ['All Users'], destinations: ['any'],
      categories: ['Malware', 'Command & Control', 'Spyware'],
    },
    {
      originalName: 'Allow Sanctioned SaaS',
      type: 'casb', action: 'allow', enabled: true,
      sources: ['Engineering', 'Product'], destinations: ['*.slack.com', '*.github.com', '*.atlassian.net'],
      categories: ['SaaS', 'Collaboration'],
    },
    {
      originalName: 'Block Adult & Gambling',
      type: 'web-filter', action: 'deny', enabled: true,
      sources: ['All Users'], destinations: ['any'],
      categories: ['Adult Content', 'Gambling', 'Pornography'],
    },
    {
      originalName: 'SSL Decrypt All',
      type: 'ssl', action: 'monitor', enabled: true,
      sources: ['All Users'], destinations: ['any'],
      categories: ['All Traffic'],
    },
    {
      originalName: 'Block Malware',
      type: 'web-filter', action: 'deny', enabled: true,
      sources: ['All Users'], destinations: ['any'],
      categories: ['Malware', 'Phishing'],
    },
    {
      originalName: 'DNS Block Newly Registered',
      type: 'dns', action: 'deny', enabled: true,
      sources: ['All Users'], destinations: ['any'],
      categories: ['Newly Registered Domains', 'DGA'],
    },
    {
      originalName: 'DLP Credit Cards',
      type: 'dlp', action: 'deny', enabled: true,
      sources: ['All Users'], destinations: ['any'],
      categories: ['PCI', 'PII', 'Credit Card Numbers'],
    },
    {
      originalName: 'Guest WiFi Restrict',
      type: 'firewall', action: 'deny', enabled: false,
      sources: ['Guest-SGT'], destinations: ['Internal Subnets'],
      categories: [],
    },
    {
      originalName: 'Allow Microsoft 365',
      type: 'casb', action: 'allow', enabled: true,
      sources: ['All Users'], destinations: ['*.microsoft.com', '*.office365.com', '*.sharepoint.com'],
      categories: ['SaaS', 'Email'],
    },
    {
      originalName: 'Block Crypto Mining',
      type: 'web-filter', action: 'deny', enabled: true,
      sources: ['All Users'], destinations: ['any'],
      categories: ['Cryptomining', 'Cryptocurrency'],
    },
    {
      originalName: 'SWG Isolate Unknown',
      type: 'swg', action: 'isolate', enabled: true,
      sources: ['High-Risk Users'], destinations: ['any'],
      categories: ['Uncategorized', 'Newly Observed Domains'],
    },
    {
      originalName: 'Restrict Social Media Upload',
      type: 'casb', action: 'monitor', enabled: true,
      sources: ['All Users'], destinations: ['*.facebook.com', '*.twitter.com', '*.instagram.com'],
      categories: ['Social Media'],
    },
  ];

  /* Analyze duplicates and generate hints */
  const policies: ImportedPolicy[] = templates.map((t, i) => {
    const hints: string[] = [];
    let severity: ImportedPolicy['severity'] = 'ok';
    let duplicateOf: string | undefined;
    let duplicateScore: number | undefined;

    if (t.originalName === 'Block Malware' && templates.some(x => x.originalName === 'Block Malware & C2')) {
      duplicateOf = 'Block Malware & C2';
      duplicateScore = 85;
      hints.push('Overlaps with "Block Malware & C2" — consider merging');
      severity = 'warning';
    }
    if (t.originalName === 'Block Crypto Mining' && templates.some(x => x.originalName === 'Block Malware & C2')) {
      hints.push('Cryptomining can be merged into "Block Malware & C2" as an additional category');
      severity = 'warning';
    }
    if (!t.enabled) {
      hints.push('This policy is disabled — consider removing if no longer needed');
      severity = 'warning';
    }
    if (t.sources.length === 1 && t.sources[0] === 'All Users' && t.action === 'allow') {
      hints.push('Overly permissive: applies to all users with allow action');
      severity = 'warning';
    }
    if (t.categories.includes('All Traffic')) {
      hints.push('Very broad scope — consider narrowing to specific categories');
      severity = 'warning';
    }

    return {
      id: `${platformId}-${i + 1}`,
      ...t,
      platform: platformName,
      optimizationHints: hints,
      severity,
      selected: true,
      expanded: false,
      duplicateOf,
      duplicateScore,
    };
  });

  return policies;
}

/* ─── Component ─────────────────────────────────────────────── */
export function MigrationTool() {
  /* Step state */
  const [step, setStep] = useState<'configure' | 'fetching' | 'review' | 'importing' | 'done'>('configure');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [policies, setPolicies] = useState<ImportedPolicy[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [importProgress, setImportProgress] = useState(0);

  const platform = PLATFORMS.find(p => p.id === selectedPlatform);

  /* Stats */
  const stats = useMemo(() => {
    const total = policies.length;
    const duplicates = policies.filter(p => p.duplicateOf).length;
    const warnings = policies.filter(p => p.severity === 'warning').length;
    const selected = policies.filter(p => p.selected).length;
    return { total, duplicates, warnings, selected };
  }, [policies]);

  /* Filtered policies */
  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      if (filterType !== 'all' && p.type !== filterType) return false;
      if (filterSeverity === 'duplicates' && !p.duplicateOf) return false;
      if (filterSeverity === 'warnings' && p.severity === 'ok') return false;
      return true;
    });
  }, [policies, filterType, filterSeverity]);

  const allFieldsFilled = platform?.fields.every(f => credentials[f.key]?.trim()) ?? false;

  const handleFetch = useCallback(async () => {
    if (!selectedPlatform) return;
    setStep('fetching');
    /* Simulate API fetch delay */
    await new Promise(r => setTimeout(r, 2500));
    const fetched = generateMockPolicies(selectedPlatform);
    setPolicies(fetched);
    setStep('review');
    toast.success(`Fetched ${fetched.length} policies from ${platform?.name}`);
  }, [selectedPlatform, platform]);

  const handleTogglePolicy = (id: string) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const handleToggleExpand = (id: string) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, expanded: !p.expanded } : p));
  };

  const handleSelectAll = () => {
    const allSelected = filteredPolicies.every(p => p.selected);
    const ids = new Set(filteredPolicies.map(p => p.id));
    setPolicies(prev => prev.map(p => ids.has(p.id) ? { ...p, selected: !allSelected } : p));
  };

  const handleRemoveDuplicates = () => {
    setPolicies(prev => prev.map(p => p.duplicateOf ? { ...p, selected: false } : p));
    toast.success('Deselected duplicate policies');
  };

  const handleAutoOptimize = () => {
    setPolicies(prev => {
      const updated = [...prev];
      /* Merge crypto into malware */
      const malwareIdx = updated.findIndex(p => p.originalName === 'Block Malware & C2');
      const cryptoIdx = updated.findIndex(p => p.originalName === 'Block Crypto Mining');
      if (malwareIdx >= 0 && cryptoIdx >= 0) {
        updated[malwareIdx] = {
          ...updated[malwareIdx],
          categories: [...new Set([...updated[malwareIdx].categories, ...updated[cryptoIdx].categories])],
          originalName: updated[malwareIdx].originalName + ' + Crypto',
          optimizationHints: ['Merged Cryptomining categories from separate policy'],
          severity: 'ok',
        };
        updated[cryptoIdx] = { ...updated[cryptoIdx], selected: false, severity: 'ok', optimizationHints: ['Merged into "Block Malware & C2"'] };
      }
      /* Remove disabled */
      return updated.map(p => !p.enabled ? { ...p, selected: false, optimizationHints: [...p.optimizationHints, 'Removed: policy was disabled'] } : p);
    });
    toast.success('Auto-optimized: merged overlapping rules and removed disabled policies');
  };

  const handleImport = useCallback(async () => {
    setStep('importing');
    const selected = policies.filter(p => p.selected);
    for (let i = 0; i <= selected.length; i++) {
      setImportProgress(Math.round((i / selected.length) * 100));
      await new Promise(r => setTimeout(r, 300));
    }
    setStep('done');
    toast.success(`Imported ${selected.length} policies into ApexAegis`);
  }, [policies]);

  const handleReset = () => {
    setStep('configure');
    setPolicies([]);
    setImportProgress(0);
    setCredentials({});
  };

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    policies.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
    return counts;
  }, [policies]);

  /* ─── Render ──────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Progress steps */}
      <div className="flex items-center gap-2 text-sm">
        {(['configure', 'review', 'done'] as const).map((s, i) => {
          const labels = ['Configure Source', 'Review & Optimize', 'Import Complete'];
          const isActive = step === s || (step === 'fetching' && s === 'configure') || (step === 'importing' && s === 'review');
          const isPast = (step === 'review' && i === 0) || (step === 'importing' && i <= 1) || (step === 'done' && i < 2);
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <ArrowRight size={14} className="text-gray-600" />}
              <div className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
                isPast && 'bg-green-900/30 text-green-400',
                isActive && !isPast && 'bg-blue-900/30 text-blue-400',
                !isActive && !isPast && 'bg-gray-800 text-gray-500',
              )}>
                {isPast && <CheckCircle2 size={12} />}
                {labels[i]}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Step 1: Configure ─────────────────────────────── */}
      {(step === 'configure' || step === 'fetching') && (
        <div className="space-y-6">
          {/* Platform selector */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Select Source Platform</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPlatform(p.id); setCredentials({}); }}
                  className={clsx(
                    'flex items-center gap-3 p-4 rounded-xl border transition-all text-left',
                    selectedPlatform === p.id
                      ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-700',
                  )}
                >
                  <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white', p.color)}>
                    {p.logo}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.fields.length} fields</div>
                  </div>
                  {selectedPlatform === p.id && <Check size={16} className="text-blue-400 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Credentials form */}
          {platform && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <Key size={14} className="text-yellow-400" />
                API Credentials — {platform.name}
              </div>
              <div className="text-xs text-gray-500">
                API keys are only used for the migration session and are never stored on the server.
              </div>
              {platform.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
                  <div className="relative">
                    <input
                      type={field.secret && !showSecrets[field.key] ? 'password' : 'text'}
                      value={credentials[field.key] || ''}
                      onChange={e => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50 pr-10"
                      placeholder={field.placeholder}
                      autoComplete="off"
                    />
                    {field.secret && (
                      <button
                        onClick={() => setShowSecrets(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showSecrets[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={handleFetch}
                disabled={!allFieldsFilled || step === 'fetching'}
                className={clsx(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  allFieldsFilled && step !== 'fetching'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed',
                )}
              >
                {step === 'fetching' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Connecting &amp; Fetching Policies...
                  </>
                ) : (
                  <>
                    <ArrowDownToLine size={16} />
                    Fetch Policies
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Step 2: Review & Optimize ─────────────────────── */}
      {(step === 'review' || step === 'importing') && (
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Policies', value: stats.total, icon: Shield, color: 'text-blue-400' },
              { label: 'Duplicates Found', value: stats.duplicates, icon: Copy, color: 'text-orange-400' },
              { label: 'Optimization Hints', value: stats.warnings, icon: AlertTriangle, color: 'text-yellow-400' },
              { label: 'Selected for Import', value: stats.selected, icon: CheckCircle2, color: 'text-green-400' },
            ].map(s => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon size={14} className={s.color} />
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
                <div className="text-2xl font-bold">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
            <div className="flex gap-2">
              {/* Filter by type */}
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs focus:outline-none"
              >
                <option value="all">All Types</option>
                {Object.entries(typeCounts).map(([type, count]) => (
                  <option key={type} value={type}>{type} ({count})</option>
                ))}
              </select>
              {/* Filter by issues */}
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value)}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs focus:outline-none"
              >
                <option value="all">All Policies</option>
                <option value="duplicates">Duplicates Only</option>
                <option value="warnings">With Warnings</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRemoveDuplicates}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-900/30 text-orange-400 border border-orange-800/50 rounded-lg text-xs hover:bg-orange-900/50 transition-colors"
              >
                <Trash2 size={12} />
                Remove Duplicates
              </button>
              <button
                onClick={handleAutoOptimize}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-900/30 text-purple-400 border border-purple-800/50 rounded-lg text-xs hover:bg-purple-900/50 transition-colors"
              >
                <Sparkles size={12} />
                Auto-Optimize
              </button>
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs hover:bg-gray-700 transition-colors"
              >
                <Check size={12} />
                {filteredPolicies.every(p => p.selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Policy list */}
          <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto">
            {filteredPolicies.map(policy => (
              <PolicyReviewCard
                key={policy.id}
                policy={policy}
                onToggle={handleTogglePolicy}
                onExpand={handleToggleExpand}
              />
            ))}
            {filteredPolicies.length === 0 && (
              <div className="text-center py-12 text-gray-600">No policies match the current filters</div>
            )}
          </div>

          {/* Import button */}
          <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
            <div className="text-sm">
              <span className="text-gray-400">Ready to import</span>{' '}
              <span className="font-bold text-white">{stats.selected}</span>{' '}
              <span className="text-gray-400">policies into ApexAegis</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={stats.selected === 0 || step === 'importing'}
                className={clsx(
                  'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors',
                  stats.selected > 0 && step !== 'importing'
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed',
                )}
              >
                {step === 'importing' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Importing... {importProgress}%
                  </>
                ) : (
                  <>
                    <ArrowDownToLine size={16} />
                    Import Selected
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 3: Done ──────────────────────────────────── */}
      {step === 'done' && (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-600/20 rounded-full flex items-center justify-center">
            <CheckCircle2 size={32} className="text-green-400" />
          </div>
          <h3 className="text-xl font-semibold">Migration Complete</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            {stats.selected} policies have been imported from {platform?.name} into ApexAegis.
            You can review and fine-tune them in the Security Policies page.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
            >
              Migrate Another Platform
            </button>
            <a
              href="/policies"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              View Policies →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Policy Review Card ────────────────────────────────────── */
const typeBadge: Record<string, { label: string; color: string }> = {
  'web-filter': { label: 'Web Filter', color: 'bg-blue-900/40 text-blue-400 border-blue-800' },
  firewall: { label: 'Firewall', color: 'bg-red-900/40 text-red-400 border-red-800' },
  ssl: { label: 'SSL', color: 'bg-yellow-900/40 text-yellow-400 border-yellow-800' },
  dns: { label: 'DNS', color: 'bg-green-900/40 text-green-400 border-green-800' },
  dlp: { label: 'DLP', color: 'bg-purple-900/40 text-purple-400 border-purple-800' },
  casb: { label: 'CASB', color: 'bg-teal-900/40 text-teal-400 border-teal-800' },
  swg: { label: 'SWG', color: 'bg-indigo-900/40 text-indigo-400 border-indigo-800' },
};

const actionColor: Record<string, string> = {
  allow: 'text-green-400',
  deny: 'text-red-400',
  monitor: 'text-yellow-400',
  isolate: 'text-purple-400',
};

function PolicyReviewCard({ policy, onToggle, onExpand }: {
  policy: ImportedPolicy;
  onToggle: (id: string) => void;
  onExpand: (id: string) => void;
}) {
  return (
    <div className={clsx(
      'bg-gray-900 border rounded-xl overflow-hidden transition-all',
      policy.duplicateOf ? 'border-orange-800/50' : 'border-gray-800',
      !policy.selected && 'opacity-50',
    )}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(policy.id)}
          className={clsx(
            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
            policy.selected
              ? 'bg-blue-600 border-blue-600'
              : 'border-gray-600 hover:border-gray-400',
          )}
        >
          {policy.selected && <Check size={12} className="text-white" />}
        </button>

        {/* Expand arrow */}
        <button onClick={() => onExpand(policy.id)} className="text-gray-500 hover:text-gray-300">
          {policy.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Policy info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{policy.originalName}</span>
            {!policy.enabled && (
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-800 text-gray-500 rounded">DISABLED</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{policy.platform}</span>
            <span className="text-gray-700">·</span>
            <span className={clsx('text-xs font-medium', actionColor[policy.action])}>
              {policy.action.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Type badge */}
        <span className={clsx(
          'px-2 py-0.5 rounded text-[10px] font-medium border',
          typeBadge[policy.type]?.color || 'bg-gray-800 text-gray-400 border-gray-700',
        )}>
          {typeBadge[policy.type]?.label || policy.type}
        </span>

        {/* Duplicate / warning indicators */}
        {policy.duplicateOf && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-900/30 text-orange-400 text-[10px] rounded border border-orange-800/50">
            <Copy size={10} />
            {policy.duplicateScore}% match
          </span>
        )}
        {policy.optimizationHints.length > 0 && !policy.duplicateOf && (
          <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />
        )}
      </div>

      {/* Expanded details */}
      {policy.expanded && (
        <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-3">
          {/* Sources & Destinations */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500 font-semibold uppercase text-[10px]">Sources</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {policy.sources.map(s => (
                  <span key={s} className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-gray-500 font-semibold uppercase text-[10px]">Destinations</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {policy.destinations.map(d => (
                  <span key={d} className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300 font-mono">{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Categories */}
          {policy.categories.length > 0 && (
            <div>
              <span className="text-gray-500 font-semibold uppercase text-[10px]">Categories</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {policy.categories.map(c => (
                  <span key={c} className="px-2 py-0.5 bg-blue-900/20 text-blue-300 rounded text-xs">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate alert */}
          {policy.duplicateOf && (
            <div className="flex items-start gap-2 p-3 bg-orange-900/15 border border-orange-800/30 rounded-lg">
              <Copy size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <span className="text-orange-300 font-medium">Duplicate Detected:</span>{' '}
                <span className="text-orange-400/80">
                  This policy is {policy.duplicateScore}% similar to &quot;{policy.duplicateOf}&quot;.
                  Consider deselecting or merging.
                </span>
              </div>
            </div>
          )}

          {/* Optimization hints */}
          {policy.optimizationHints.length > 0 && (
            <div className="space-y-1.5">
              {policy.optimizationHints.map((hint, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <Sparkles size={12} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-yellow-300/80">{hint}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mapped preview */}
          <div className="p-3 bg-green-900/10 border border-green-800/30 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-green-400 mb-2">
              <ArrowRight size={12} />
              ApexAegis Policy Preview
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-gray-500">Action</span>
                <div className={clsx('font-medium mt-0.5', actionColor[policy.action])}>
                  {policy.action.toUpperCase()}
                </div>
              </div>
              <div>
                <span className="text-gray-500">SSL Profile</span>
                <div className="text-gray-300 mt-0.5">
                  {policy.type === 'ssl' ? 'Full Inspection' : 'Certificate Inspection'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Log Traffic</span>
                <div className="text-green-400 mt-0.5">Yes</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
