import { test, expect } from '@playwright/test';

test.describe('Application Accessibility & Meta', () => {
  test('has correct page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ApexAegis/);
  });

  test('uses dark theme', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test('no broken images on dashboard', async ({ page }) => {
    await page.goto('/');
    const images = await page.locator('img').all();
    for (const img of images) {
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('viewport is responsive', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Policies Page Interaction', () => {
  test('policies page loads with content', async ({ page }) => {
    await page.goto('/policies');
    await expect(page.locator('body')).toBeVisible();
    // Check for page heading or main content area
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});

test.describe('Gateway Page Interaction', () => {
  test('gateway page loads with content', async ({ page }) => {
    await page.goto('/gateways');
    await expect(page.locator('body')).toBeVisible();
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});

test.describe('Certificate Page Interaction', () => {
  test('certificates page loads with content', async ({ page }) => {
    await page.goto('/certificates');
    await expect(page.locator('body')).toBeVisible();
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});
