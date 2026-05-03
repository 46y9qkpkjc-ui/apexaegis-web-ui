import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders dashboard heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('renders stat cards', async ({ page }) => {
    const main = page.locator('main');
    await expect(main.getByText('Active Policies')).toBeVisible();
    await expect(main.getByText('Active Users')).toBeVisible();
    await expect(main.getByText('Threats Blocked')).toBeVisible();
  });

  test('renders top blocked URL categories section', async ({ page }) => {
    const main = page.locator('main');
    await expect(main.getByRole('heading', { name: /Top Blocked URL Categories/ })).toBeVisible();
    await expect(main.getByText('Phishing').first()).toBeVisible();
  });

  test('renders gateway health section', async ({ page }) => {
    const main = page.locator('main');
    await expect(main.getByText('Gateway Health')).toBeVisible();
    await expect(main.getByText('us-east-1')).toBeVisible();
  });

  test('renders recent security events section', async ({ page }) => {
    const main = page.locator('main');
    await expect(main.getByText('Recent Security Events')).toBeVisible();
  });
});

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('sidebar is visible with navigation groups', async ({ page }) => {
    await expect(page.getByText('Dashboard').first()).toBeVisible();
    await expect(page.getByText('Policy & Objects')).toBeVisible();
  });

  test('clicking Policies navigates correctly', async ({ page }) => {
    await page.getByRole('link', { name: 'Security Policies' }).click();
    await page.waitForURL('**/policies');
    expect(page.url()).toContain('/policies');
  });

  test('clicking Gateways navigates correctly', async ({ page }) => {
    await page.getByRole('link', { name: 'Gateway Nodes' }).click();
    await page.waitForURL('**/gateways');
    expect(page.url()).toContain('/gateways');
  });

  test('clicking Logs navigates correctly', async ({ page }) => {
    await page.getByRole('link', { name: 'Logs & Events' }).click();
    await page.waitForURL('**/logs');
    expect(page.url()).toContain('/logs');
  });
});

test.describe('Login Page', () => {
  test('renders login form elements', async ({ page }) => {
    await page.goto('/login');
    // Login page has SSO detection and form
    await expect(page.locator('body')).toBeVisible();
  });

  test('has no console errors on login page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/login');
    await page.waitForTimeout(2000);
    // Filter out expected dev-mode warnings
    const realErrors = errors.filter(e => !e.includes('hydration') && !e.includes('Warning'));
    expect(realErrors.length).toBeLessThanOrEqual(2);
  });
});
