import { test, expect } from '@playwright/test';

test('hero renders core UI', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.headline')).toContainText('Roman');
  await expect(page.locator('.nav a')).toHaveCount(3);
  await expect(page.locator('#hero-canvas')).toBeVisible();
});

test('desktop shows vertical nav, hides hamburger', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('.nav')).toBeVisible();
  await expect(page.locator('.menu-btn')).toBeHidden();
});

test('mobile menu opens, locks scroll, and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.menu-btn')).toBeVisible();
  await expect(page.locator('.nav')).toBeHidden();

  await page.locator('.menu-btn').click();
  await expect(page.locator('body')).toHaveClass(/menu-open/);
  // opacity is the real signal — Playwright treats opacity:0 elements as "visible"
  await expect(page.locator('.menu-overlay')).toHaveCSS('opacity', '1');

  await page.locator('.menu-close').click();
  await expect(page.locator('body')).not.toHaveClass(/menu-open/);
  await expect(page.locator('.menu-overlay')).toHaveCSS('opacity', '0');
});
