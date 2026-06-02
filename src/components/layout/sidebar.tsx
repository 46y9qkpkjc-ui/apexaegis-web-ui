'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useFeatures } from '@/hooks/use-features';
import {
  Shield, Globe, Server, Users, Key, FileText,
  Settings, BarChart3, Network, Lock, Bug,
  MonitorSmartphone, Layers, AlertTriangle, ArrowDownToLine,
  Activity, GitBranch, Router, Ghost, Wifi,
  Crosshair, Brain, Fingerprint, Smartphone,
  ChevronRight, ChevronLeft, ShieldCheck, Award, Workflow,
  ShieldAlert, Search, ShieldOff,
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
      { href: '/logs', icon: FileText, label: 'Logs & Events' },
      { href: '/endpoint-events', icon: Activity, label: 'Endpoint Events' },
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
      { href: '/network-events', icon: Wifi, label: 'Network Events' },
    ],
  },
  {
    label: 'Discovery',
    items: [
      { href: '/ghosted-apps', icon: Ghost, label: 'Ghosted Apps & Services', featureId: 'ghosted-apps' },
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
      { href: '/profiles/device-posture', icon: Smartphone, label: 'Device Posture', featureId: 'device-posture' },
    ],
  },
  {
    label: 'Identity & Access',
    items: [
      { href: '/identity/users', icon: Users, label: 'Users & Groups' },
      { href: '/identity/devices', icon: MonitorSmartphone, label: 'Devices' },
      { href: '/identity/providers', icon: Key, label: 'Identity Providers' },
      { href: '/admin/passkeys', icon: Fingerprint, label: 'Passkey Manager' },
      { href: '/admin/abac', icon: Shield, label: 'ABAC Control' },
      { href: '/admin/oauth-api', icon: Key, label: 'OAuth 2.0 & API Keys' },
      { href: '/admin/idp-config', icon: Settings, label: 'IdP Configuration' },
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
    label: 'Administration',
    items: [
      { href: '/audit', icon: FileText, label: 'Audit & Config Mgmt' },
      { href: '/admin/features', icon: Settings, label: 'Feature Licensing' },
      { href: '/admin/client-config', icon: Users, label: 'Client Config' },
      { href: '/admin/route-config', icon: Network, label: 'Route Policies' },
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

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isEnabled } = useFeatures();

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
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.featureId || isEnabled(item.featureId),
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

      {/* Org selector */}
      <div className="p-3 border-t border-gray-800/60">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/60 border border-gray-700/40 text-sm transition-all">
          <div className="w-6 h-6 rounded bg-green-600/30 flex items-center justify-center text-xs font-bold text-green-400 flex-shrink-0">
            O
          </div>
          {!sidebarCollapsed && <span className="flex-1 text-left truncate text-gray-300">Organization</span>}
        </button>
      </div>
    </aside>
  );
}
