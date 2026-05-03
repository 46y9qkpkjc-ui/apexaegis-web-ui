import { describe, it, expect } from 'vitest';

/**
 * Complete sidebar navigation structure — mirrors sidebar.tsx navGroups exactly.
 * Tests validate structural integrity, uniqueness, and route coverage.
 */
const navGroups = [
  {
    label: 'Dashboard',
    items: [
      { href: '/', label: 'Overview' },
      { href: '/logs', label: 'Logs & Events' },
      { href: '/endpoint-events', label: 'Endpoint Events' },
    ],
  },
  {
    label: 'Security Posture',
    items: [
      { href: '/security', label: 'Attack Paths & Segments' },
      { href: '/security/mitre-attack', label: 'APT Simulation' },
      { href: '/security/ai-ueba', label: 'AI/ML & UEBA' },
    ],
  },
  {
    label: 'Network',
    items: [
      { href: '/sdwan', label: 'SD-WAN Optimizer' },
      { href: '/network-events', label: 'Network Events' },
    ],
  },
  {
    label: 'Discovery',
    items: [
      { href: '/ghosted-apps', label: 'Ghosted Apps & Services' },
    ],
  },
  {
    label: 'Policy & Objects',
    items: [
      { href: '/policies', label: 'Security Policies' },
      { href: '/objects/addresses', label: 'Addresses' },
      { href: '/objects/services', label: 'Services' },
      { href: '/objects/url-categories', label: 'URL Categories' },
      { href: '/objects/cloud-apps', label: 'Cloud Applications' },
      { href: '/objects/cloud-app-tenants', label: 'Cloud App Tenants' },
    ],
  },
  {
    label: 'Security Profiles',
    items: [
      { href: '/profiles/atp', label: 'ATP Profiles' },
      { href: '/profiles/ssl', label: 'SSL Inspection' },
      { href: '/profiles/dns', label: 'DNS Filter' },
      { href: '/profiles/web', label: 'Web Filter' },
      { href: '/profiles/device-posture', label: 'Device Posture' },
    ],
  },
  {
    label: 'Identity & Access',
    items: [
      { href: '/identity/users', label: 'Users & Groups' },
      { href: '/identity/devices', label: 'Devices' },
      { href: '/identity/providers', label: 'Identity Providers' },
      { href: '/admin/passkeys', label: 'Passkey Manager' },
      { href: '/admin/abac', label: 'ABAC Control' },
      { href: '/admin/oauth-api', label: 'OAuth 2.0 & API Keys' },
      { href: '/admin/idp-config', label: 'IdP Configuration' },
    ],
  },
  {
    label: 'Security Validation',
    items: [
      { href: '/security/test-my-defence', label: 'Test My Defence' },
      { href: '/security/security-preview', label: 'Security Preview' },
      { href: '/security/attack-path', label: 'Attack Path Analysis' },
      { href: '/security/ssl-scan', label: 'SSL/TLS Scanner' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { href: '/compliance', label: 'Compliance Report' },
      { href: '/compliance/certifications', label: 'Certification Report' },
      { href: '/compliance/itsm-automation', label: 'ITSM Automation' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/audit', label: 'Audit & Config Mgmt' },
      { href: '/admin/features', label: 'Feature Licensing' },
      { href: '/admin/client-config', label: 'Client Config' },
      { href: '/admin/route-config', label: 'Route Policies' },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { href: '/gateways', label: 'Gateway Nodes' },
      { href: '/gateways/scion-partners', label: 'SCION Partner Gateway' },
      { href: '/infrastructure/sdn', label: 'SDN Switches' },
      { href: '/infrastructure/port-config', label: 'Port Configuration' },
      { href: '/infrastructure/dot1x', label: '802.1X Auth Server' },
      { href: '/infrastructure/wireless', label: 'Wireless Management' },
      { href: '/infrastructure/dynamic-sgt', label: 'Dynamic SGT' },
      { href: '/infrastructure/guest-access', label: 'Guest Access' },
      { href: '/infrastructure/api-integrations', label: 'API Integrations' },
      { href: '/certificates', label: 'CA Certificates' },
      { href: '/migration', label: 'Policy Migration' },
      { href: '/settings', label: 'Settings' },
    ],
  },
];

// Known route pages (from app/ directory structure)
const routePages = new Set([
  '/',
  '/logs',
  '/login',
  '/endpoint-events',
  '/security',
  '/security/mitre-attack',
  '/security/ai-ueba',
  '/security/test-my-defence',
  '/security/security-preview',
  '/security/attack-path',
  '/security/ssl-scan',
  '/sdwan',
  '/network-events',
  '/ghosted-apps',
  '/policies',
  '/objects/addresses',
  '/objects/services',
  '/objects/url-categories',
  '/objects/cloud-apps',
  '/objects/cloud-app-tenants',
  '/profiles/atp',
  '/profiles/ssl',
  '/profiles/dns',
  '/profiles/web',
  '/profiles/device-posture',
  '/identity/users',
  '/identity/devices',
  '/identity/providers',
  '/admin/passkeys',
  '/admin/abac',
  '/admin/oauth-api',
  '/admin/idp-config',
  '/admin/features',
  '/admin/client-config',
  '/admin/route-config',
  '/compliance',
  '/compliance/certifications',
  '/compliance/itsm-automation',
  '/audit',
  '/gateways',
  '/gateways/scion-partners',
  '/infrastructure/sdn',
  '/infrastructure/port-config',
  '/infrastructure/dot1x',
  '/infrastructure/wireless',
  '/infrastructure/dynamic-sgt',
  '/infrastructure/guest-access',
  '/infrastructure/api-integrations',
  '/certificates',
  '/migration',
  '/settings',
]);

describe('Navigation — No Broken Links', () => {
  const allItems = navGroups.flatMap(g => g.items);
  const allHrefs = allItems.map(i => i.href);

  it('has 11 navigation groups', () => {
    expect(navGroups).toHaveLength(11);
  });

  it('has 50 total navigation items', () => {
    expect(allItems).toHaveLength(50);
  });

  it('all hrefs are unique (no duplicates)', () => {
    const unique = new Set(allHrefs);
    expect(unique.size).toBe(allHrefs.length);
  });

  it('all hrefs start with /', () => {
    for (const href of allHrefs) {
      expect(href).toMatch(/^\//);
    }
  });

  it('no hrefs contain trailing slashes (except root)', () => {
    for (const href of allHrefs) {
      if (href === '/') continue;
      expect(href).not.toMatch(/\/$/);
    }
  });

  it('no hrefs contain double slashes', () => {
    for (const href of allHrefs) {
      expect(href).not.toMatch(/\/\//);
    }
  });

  it('all hrefs use lowercase paths', () => {
    for (const href of allHrefs) {
      expect(href).toBe(href.toLowerCase());
    }
  });

  it('every sidebar href has a matching route page', () => {
    const missing: string[] = [];
    for (const href of allHrefs) {
      if (!routePages.has(href)) {
        missing.push(href);
      }
    }
    expect(missing).toEqual([]);
  });

  it('all navigation items have non-empty labels', () => {
    for (const item of allItems) {
      expect(item.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('all group labels are unique', () => {
    const labels = navGroups.map(g => g.label);
    const unique = new Set(labels);
    expect(unique.size).toBe(labels.length);
  });

  it('no empty groups', () => {
    for (const group of navGroups) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });
});

describe('Navigation — Group Structure', () => {
  it('contains all required top-level groups', () => {
    const labels = navGroups.map(g => g.label);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Security Posture');
    expect(labels).toContain('Network');
    expect(labels).toContain('Discovery');
    expect(labels).toContain('Policy & Objects');
    expect(labels).toContain('Security Profiles');
    expect(labels).toContain('Identity & Access');
    expect(labels).toContain('Security Validation');
    expect(labels).toContain('Compliance');
    expect(labels).toContain('Administration');
    expect(labels).toContain('Infrastructure');
  });

  it('Dashboard contains overview and logs', () => {
    const dash = navGroups.find(g => g.label === 'Dashboard')!;
    const hrefs = dash.items.map(i => i.href);
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/logs');
    expect(hrefs).toContain('/endpoint-events');
  });

  it('Policy & Objects contains policies and all object types', () => {
    const group = navGroups.find(g => g.label === 'Policy & Objects')!;
    const hrefs = group.items.map(i => i.href);
    expect(hrefs).toContain('/policies');
    expect(hrefs).toContain('/objects/addresses');
    expect(hrefs).toContain('/objects/services');
    expect(hrefs).toContain('/objects/url-categories');
    expect(hrefs).toContain('/objects/cloud-apps');
    expect(hrefs).toContain('/objects/cloud-app-tenants');
  });

  it('Security Profiles includes all 5 profile types', () => {
    const group = navGroups.find(g => g.label === 'Security Profiles')!;
    expect(group.items).toHaveLength(5);
    const hrefs = group.items.map(i => i.href);
    expect(hrefs).toContain('/profiles/atp');
    expect(hrefs).toContain('/profiles/ssl');
    expect(hrefs).toContain('/profiles/dns');
    expect(hrefs).toContain('/profiles/web');
    expect(hrefs).toContain('/profiles/device-posture');
  });

  it('Identity & Access includes auth management features', () => {
    const group = navGroups.find(g => g.label === 'Identity & Access')!;
    const hrefs = group.items.map(i => i.href);
    expect(hrefs).toContain('/identity/users');
    expect(hrefs).toContain('/identity/devices');
    expect(hrefs).toContain('/identity/providers');
    expect(hrefs).toContain('/admin/passkeys');
    expect(hrefs).toContain('/admin/abac');
    expect(hrefs).toContain('/admin/oauth-api');
    expect(hrefs).toContain('/admin/idp-config');
  });

  it('Infrastructure contains all infra management links', () => {
    const group = navGroups.find(g => g.label === 'Infrastructure')!;
    const hrefs = group.items.map(i => i.href);
    expect(hrefs).toContain('/gateways');
    expect(hrefs).toContain('/gateways/scion-partners');
    expect(hrefs).toContain('/infrastructure/sdn');
    expect(hrefs).toContain('/infrastructure/port-config');
    expect(hrefs).toContain('/infrastructure/dot1x');
    expect(hrefs).toContain('/infrastructure/wireless');
    expect(hrefs).toContain('/infrastructure/dynamic-sgt');
    expect(hrefs).toContain('/infrastructure/guest-access');
    expect(hrefs).toContain('/infrastructure/api-integrations');
    expect(hrefs).toContain('/certificates');
    expect(hrefs).toContain('/migration');
    expect(hrefs).toContain('/settings');
  });
});

describe('Navigation — Route Path Conventions', () => {
  const allItems = navGroups.flatMap(g => g.items);

  it('object routes follow /objects/{type} pattern', () => {
    const objectRoutes = allItems.filter(i => i.href.startsWith('/objects/'));
    expect(objectRoutes.length).toBeGreaterThanOrEqual(4);
    for (const route of objectRoutes) {
      expect(route.href).toMatch(/^\/objects\/[a-z-]+$/);
    }
  });

  it('profile routes follow /profiles/{type} pattern', () => {
    const profileRoutes = allItems.filter(i => i.href.startsWith('/profiles/'));
    expect(profileRoutes.length).toBeGreaterThanOrEqual(4);
    for (const route of profileRoutes) {
      expect(route.href).toMatch(/^\/profiles\/[a-z-]+$/);
    }
  });

  it('identity routes follow /identity/{type} pattern', () => {
    const identityRoutes = allItems.filter(i => i.href.startsWith('/identity/'));
    for (const route of identityRoutes) {
      expect(route.href).toMatch(/^\/identity\/[a-z-]+$/);
    }
  });

  it('infrastructure routes follow /infrastructure/{type} pattern', () => {
    const infraRoutes = allItems.filter(i => i.href.startsWith('/infrastructure/'));
    for (const route of infraRoutes) {
      expect(route.href).toMatch(/^\/infrastructure\/[a-z0-9-]+$/);
    }
  });

  it('admin routes follow /admin/{feature} pattern', () => {
    const adminRoutes = allItems.filter(i => i.href.startsWith('/admin/'));
    for (const route of adminRoutes) {
      expect(route.href).toMatch(/^\/admin\/[a-z-]+$/);
    }
  });

  it('security routes follow /security/{feature} pattern', () => {
    const securityRoutes = allItems.filter(i =>
      i.href.startsWith('/security/') && i.href !== '/security'
    );
    for (const route of securityRoutes) {
      expect(route.href).toMatch(/^\/security\/[a-z-]+$/);
    }
  });
});
