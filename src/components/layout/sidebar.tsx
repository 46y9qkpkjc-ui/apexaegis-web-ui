'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useFeatures } from '@/hooks/use-features';
import { fetchTenantSummaries } from '@/lib/tenants-api';
import { fetchEffectivePages, type EffectivePages } from '@/lib/rbac-api';
import {
  Shield, Globe, Server, Users, Key, FileText,
  Settings, BarChart3, Network, Lock, Bug,
  MonitorSmartphone, Layers, AlertTriangle, ArrowDownToLine,
  Activity, GitBranch, Router, Ghost, Wifi,
  Crosshair, Brain, Smartphone,
  ChevronRight, ChevronLeft, ShieldCheck, Award, Workflow,
  ShieldAlert, Search, ShieldOff, Building2,
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: typeof Shield;
  label: string;
  featureId?: string; // maps to feature licensing ID
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Dashboard',
    items: [
      { href: '/', icon: BarChart3, label: 'Overview' },
    ],
  },
  {
    label: 'Logs & Events',
    items: [
      { href: '/logs', icon: FileText, label: 'Logs & Events' },
      { href: '/endpoint-events', icon: Activity, label: 'Endpoint Events' },
      { href: '/network-events', icon: Wifi, label: 'Network Events' },
    ],
  },
  {
    label: 'Policy & Objects',
    items: [
      { href: '/policies', icon: Shield, label: 'Security Policies' },
      { href: '/objects/addresses', icon: Globe, label: 'Addresses' },
      { href: '/objects/services', icon: Layers, label: 'Services' },
      { href: '/objects/url-categories', icon: Network, label: 'URL Categories' },
      { href: '/objects/cloud-apps', icon: Globe, label: 'Cloud Applications', featureId: 'casb' },
      { href: '/objects/cloud-app-tenants', icon: Server, label: 'Cloud App Tenants' },
    ],
  },
  {
    label: 'Security Profiles',
    items: [
      { href: '/profiles/atp', icon: Bug, label: 'ATP Profiles', featureId: 'atp' },
      { href: '/profiles/ssl', icon: Lock, label: 'SSL Inspection', featureId: 'ssl-inspect' },
      { href: '/profiles/dns', icon: Network, label: 'DNS Filter', featureId: 'dns-filter' },
      { href: '/profiles/web', icon: AlertTriangle, label: 'Web Filter', featureId: 'web-filter' },
      { href: '/profiles/device-posture-profile', icon: Smartphone, label: 'Device Posture Profile' },
    ],
  },
  {
    label: 'Identity & Access',
    items: [
      { href: '/identity/users', icon: Users, label: 'Users & Groups' },
      { href: '/identity/device-enrolment', icon: Key, label: 'Device Enrolment' },
      { href: '/identity/providers', icon: Key, label: 'Identity Providers' },
      { href: '/admin/ad-connector', icon: Server, label: 'AD Connector' },
      { href: '/admin/abac', icon: Shield, label: 'ABAC Control' },
      { href: '/admin/oauth-api', icon: Key, label: 'OAuth 2.0 & API Keys' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/audit', icon: FileText, label: 'Audit & Config Mgmt' },
      { href: '/admin/rbac', icon: ShieldCheck, label: 'RBAC / Roles' },
      { href: '/admin/features', icon: Settings, label: 'Feature Licensing' },
      { href: '/admin/client-config', icon: Users, label: 'Client Config' },
      { href: '/admin/route-config', icon: Network, label: 'Route Policies' },
    ],
  },
  {
    label: 'Security Posture',
    items: [
      { href: '/security', icon: GitBranch, label: 'Attack Paths & Segments' },
      { href: '/security/attack-comparison', icon: ShieldOff, label: 'Attack Comparison' },
      { href: '/security/ai-ueba', icon: Brain, label: 'AI/ML & UEBA', featureId: 'ueba' },
    ],
  },
  {
    label: 'Network',
    items: [
      { href: '/sdwan', icon: Router, label: 'SD-WAN Optimizer', featureId: 'sdwan' },
    ],
  },
  {
    label: 'Discovery',
    items: [
      { href: '/ghosted-apps', icon: Ghost, label: 'Ghosted Apps & Services', featureId: 'ghosted-apps' },
    ],
  },
  {
    label: 'Security Validation',
    items: [
      { href: '/security/test-my-defence', icon: ShieldAlert, label: 'Security CheckUp' },
      { href: '/security/mitre-attack', icon: Crosshair, label: 'APT Simulation' },
      { href: '/security/security-preview', icon: Search, label: 'Security Preview' },
      { href: '/security/attack-path', icon: Crosshair, label: 'Attack Path Analysis' },
      { href: '/security/ssl-scan', icon: Lock, label: 'SSL/TLS Scanner' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { href: '/compliance', icon: ShieldCheck, label: 'Compliance Report', featureId: 'compliance-report' },
      { href: '/compliance/certifications', icon: Award, label: 'Certification Report' },
      { href: '/compliance/itsm-automation', icon: Workflow, label: 'ITSM Automation' },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { href: '/gateways', icon: Server, label: 'Gateway Nodes' },
      { href: '/certificates', icon: Lock, label: 'CA Certificates' },
      { href: '/migration', icon: ArrowDownToLine, label: 'Policy Migration' },
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

// Maps a nav href to its RBAC page slug (see migration 030 rbac_pages). Items
// with no mapping (e.g. per-tenant links) are always shown.
const hrefToSlug: Record<string, string> = {
  '/': 'overview', '/logs': 'logs', '/endpoint-events': 'endpoint-events',
  '/policies': 'policies', '/objects/addresses': 'addresses', '/objects/services': 'services',
  '/objects/url-categories': 'url-categories', '/objects/cloud-apps': 'cloud-apps', '/objects/cloud-app-tenants': 'cloud-app-tenants',
  '/profiles/atp': 'atp', '/profiles/ssl': 'ssl', '/profiles/dns': 'dns-filter', '/profiles/web': 'web-filter', '/profiles/device-posture-profile': 'device-posture',
  '/identity/users': 'users', '/identity/devices': 'devices', '/identity/device-enrolment': 'device-enrolment', '/identity/providers': 'identity-providers',
  '/admin/ad-connector': 'ad-connector', '/admin/abac': 'abac', '/admin/oauth-api': 'oauth-api',
  '/audit': 'audit', '/admin/rbac': 'rbac', '/admin/features': 'features', '/admin/client-config': 'client-config', '/admin/route-config': 'route-config',
  '/security': 'attack-paths', '/security/attack-comparison': 'attack-comparison', '/security/ai-ueba': 'ai-ueba',
  '/sdwan': 'sdwan', '/network-events': 'network-events', '/ghosted-apps': 'ghosted-apps',
  '/security/test-my-defence': 'security-checkup', '/security/mitre-attack': 'apt-simulation', '/security/security-preview': 'security-preview',
  '/security/attack-path': 'attack-path-analysis', '/security/ssl-scan': 'ssl-scanner',
  '/compliance': 'compliance-report', '/compliance/certifications': 'certifications', '/compliance/itsm-automation': 'itsm-automation',
  '/gateways': 'gateways', '/certificates': 'certificates', '/migration': 'policy-migration', '/settings': 'settings',
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isEnabled } = useFeatures();

  // Dynamic per-tenant submenu — refreshes so newly onboarded tenants appear.
  const [tenantItems, setTenantItems] = useState<NavItem[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () => fetchTenantSummaries()
      .then(list => {
        if (alive) setTenantItems(list.map(t => ({
          href: `/tenants/${t.tenant_id}`, icon: Building2, label: t.tenant_name,
        })));
      })
      .catch(() => { /* backend unavailable */ });
    load();
    const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // RBAC nav control — hide pages the current role can't view (keeps the menu
  // from growing unbounded). controlled=false → show everything (super_admin).
  const [effective, setEffective] = useState<EffectivePages>({ controlled: false, pages: [] });
  useEffect(() => {
    fetchEffectivePages().then(setEffective).catch(() => { /* show all on error */ });
  }, []);

  const rbacAllowed = (item: NavItem) => {
    if (!effective.controlled) return true;
    const slug = hrefToSlug[item.href];
    if (!slug) return true;                          // structural / tenant links
    if (slug === 'overview' || slug === 'rbac') return true; // never lock out of these
    return effective.pages.includes(slug);
  };

  // Inject the Tenants group right after Dashboard.
  const renderedGroups: NavGroup[] = [
    navGroups[0],
    { label: 'Tenants', items: tenantItems },
    ...navGroups.slice(1),
  ];

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Track collapsed groups — Dashboard always open by default
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const toggleGroup = (label: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  // Check if any item in a group is active
  const isGroupActive = (items: { href: string }[]) =>
    items.some(i => i.href === pathname);

  return (
    <aside className={clsx(
      'bg-gray-900/80 backdrop-blur-xl border-r border-gray-800/60 flex flex-col transition-all duration-200 h-full',
      sidebarCollapsed ? 'w-16' : 'w-60',
    )}>
      {/* Logo */}
      <div className="h-14 px-4 flex items-center gap-3 border-b border-gray-800/60">
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-lg flex items-center justify-center font-bold text-sm shadow-md shadow-cyan-600/20 flex-shrink-0">
          A
        </div>
        {!sidebarCollapsed && <span className="font-semibold text-lg tracking-tight">ApexAegis</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {renderedGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => (!item.featureId || isEnabled(item.featureId)) && rbacAllowed(item),
          );
          if (visibleItems.length === 0) return null;
          const isCollapsed = collapsed.has(group.label);
          const hasActive = isGroupActive(visibleItems);

          return (
            <div key={group.label} className="mb-0.5">
              {/* Collapsible group header */}
              {!sidebarCollapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={clsx(
                    'w-full flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
                    hasActive ? 'text-blue-400/80' : 'text-gray-500 hover:text-gray-400',
                  )}
                >
                  <ChevronRight
                    size={10}
                    className={clsx(
                      'transition-transform duration-200 flex-shrink-0',
                      !isCollapsed && 'rotate-90',
                    )}
                  />
                  {group.label}
                </button>
              )}

              {/* Items (animated) */}
              <div
                className={clsx(
                  'overflow-hidden transition-all duration-200 ease-out',
                  sidebarCollapsed || !isCollapsed ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
                )}
              >
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={clsx(
                        'flex items-center gap-3 mx-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-150',
                        active
                          ? 'bg-blue-600/15 text-blue-400 shadow-[inset_2px_0_0_0_rgba(59,130,246,0.6)]'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50',
                        sidebarCollapsed && 'justify-center px-0',
                      )}
                    >
                      <Icon size={15} className={clsx(active && 'text-blue-400', 'flex-shrink-0')} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-2 border-t border-gray-800/60">
        <button
          onClick={() => setSidebarCollapsed(prev => !prev)}
          className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg hover:bg-gray-800/50 text-gray-500 hover:text-gray-300 transition-colors text-xs"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* Tenant scope — jump to the consolidated all-tenant overview */}
      <div className="p-3 border-t border-gray-800/60">
        <Link href="/" onClick={onNavigate} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/60 border border-gray-700/40 text-sm transition-all">
          <div className="w-6 h-6 rounded bg-cyan-600/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Building2 size={13} />
          </div>
          {!sidebarCollapsed && <span className="flex-1 text-left truncate text-gray-300">All Tenants</span>}
        </Link>
      </div>
    </aside>
  );
}
