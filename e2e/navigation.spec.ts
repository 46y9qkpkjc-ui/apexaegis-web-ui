import { test, expect } from '@playwright/test';

/* ─── Core Page Routes ──────────────────────────────────────── */
const coreRoutes = [
  { path: '/', title: 'Dashboard Overview' },
  { path: '/logs', title: 'Logs & Events' },
  { path: '/endpoint-events', title: 'Endpoint Events' },
  { path: '/policies', title: 'Security Policies' },
  { path: '/gateways', title: 'Gateway Nodes' },
  { path: '/login', title: 'Login' },
  { path: '/settings', title: 'Settings' },
  { path: '/certificates', title: 'CA Certificates' },
  { path: '/audit', title: 'Audit & Config Mgmt' },
  { path: '/compliance', title: 'Compliance Report' },
];

test.describe('Core Page Navigation', () => {
  for (const route of coreRoutes) {
    test(`loads ${route.title} (${route.path})`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBeLessThan(400);
      await expect(page).toHaveTitle(/ApexAegis/i);
    });
  }
});

/* ─── Security Module Routes ────────────────────────────────── */
const securityRoutes = [
  { path: '/security', title: 'Attack Paths & Segments' },
  { path: '/security/mitre-attack', title: 'APT Simulation' },
  { path: '/security/ai-ueba', title: 'AI/ML & UEBA' },
  { path: '/security/test-my-defence', title: 'Test My Defence' },
  { path: '/security/security-preview', title: 'Security Preview' },
  { path: '/security/attack-path', title: 'Attack Path Analysis' },
  { path: '/security/ssl-scan', title: 'SSL/TLS Scanner' },
];

test.describe('Security Module Navigation', () => {
  for (const route of securityRoutes) {
    test(`loads ${route.title} (${route.path})`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBeLessThan(400);
    });
  }
});

/* ─── Profile Routes ────────────────────────────────────────── */
const profileRoutes = [
  { path: '/profiles/atp', title: 'ATP Profiles' },
  { path: '/profiles/ssl', title: 'SSL Inspection' },
  { path: '/profiles/dns', title: 'DNS Filter' },
  { path: '/profiles/web', title: 'Web Filter' },
  { path: '/profiles/device-posture', title: 'Device Posture' },
];

test.describe('Security Profile Navigation', () => {
  for (const route of profileRoutes) {
    test(`loads ${route.title} (${route.path})`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBeLessThan(400);
    });
  }
});

/* ─── Identity & Admin Routes ───────────────────────────────── */
const identityRoutes = [
  { path: '/identity/users', title: 'Users & Groups' },
  { path: '/identity/devices', title: 'Devices' },
  { path: '/identity/providers', title: 'Identity Providers' },
  { path: '/admin/passkeys', title: 'Passkey Manager' },
  { path: '/admin/abac', title: 'ABAC Control' },
  { path: '/admin/oauth-api', title: 'OAuth 2.0 & API Keys' },
  { path: '/admin/idp-config', title: 'IdP Configuration' },
  { path: '/admin/features', title: 'Feature Licensing' },
  { path: '/admin/client-config', title: 'Client Config' },
  { path: '/admin/route-config', title: 'Route Policies' },
];

test.describe('Identity & Admin Navigation', () => {
  for (const route of identityRoutes) {
    test(`loads ${route.title} (${route.path})`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBeLessThan(400);
    });
  }
});

/* ─── Objects Routes ────────────────────────────────────────── */
const objectRoutes = [
  { path: '/objects/addresses', title: 'Addresses' },
  { path: '/objects/services', title: 'Services' },
  { path: '/objects/url-categories', title: 'URL Categories' },
  { path: '/objects/cloud-apps', title: 'Cloud Applications' },
  { path: '/objects/cloud-app-tenants', title: 'Cloud App Tenants' },
];

test.describe('Objects Navigation', () => {
  for (const route of objectRoutes) {
    test(`loads ${route.title} (${route.path})`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBeLessThan(400);
    });
  }
});

/* ─── Infrastructure Routes ─────────────────────────────────── */
const infraRoutes = [
  { path: '/infrastructure/sdn', title: 'SDN Switches' },
  { path: '/infrastructure/port-config', title: 'Port Configuration' },
  { path: '/infrastructure/dot1x', title: '802.1X Auth Server' },
  { path: '/infrastructure/wireless', title: 'Wireless Management' },
  { path: '/infrastructure/dynamic-sgt', title: 'Dynamic SGT' },
  { path: '/infrastructure/guest-access', title: 'Guest Access' },
  { path: '/infrastructure/api-integrations', title: 'API Integrations' },
  { path: '/gateways/scion-partners', title: 'SCION Partner Gateway' },
];

test.describe('Infrastructure Navigation', () => {
  for (const route of infraRoutes) {
    test(`loads ${route.title} (${route.path})`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBeLessThan(400);
    });
  }
});

/* ─── Remaining Routes ──────────────────────────────────────── */
const miscRoutes = [
  { path: '/sdwan', title: 'SD-WAN Optimizer' },
  { path: '/network-events', title: 'Network Events' },
  { path: '/ghosted-apps', title: 'Ghosted Apps & Services' },
  { path: '/compliance/certifications', title: 'Certification Report' },
  { path: '/compliance/itsm-automation', title: 'ITSM Automation' },
  { path: '/migration', title: 'Policy Migration' },
];

test.describe('Misc Module Navigation', () => {
  for (const route of miscRoutes) {
    test(`loads ${route.title} (${route.path})`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBeLessThan(400);
    });
  }
});
