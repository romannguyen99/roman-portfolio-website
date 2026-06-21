import { test, expect } from '@playwright/test';

test('works section renders heading, intro, and four cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#work')).toBeVisible();
  await expect(page.locator('.works-title')).toContainText('Selected Works');
  await expect(page.locator('.works-intro')).toContainText('prediction, automation, insight generation');
  await expect(page.locator('.work-card')).toHaveCount(4);
  await expect(page.locator('.work-card .title')).toHaveCount(4);
});

test('each work card shows a category tag, metric, and CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.work-card .tag')).toHaveCount(4);
  await expect(page.locator('.work-card .metric')).toHaveCount(4);
  await expect(page.locator('.work-card .cta')).toHaveCount(4);
  await expect(page.locator('.work-card .cta').first()).toContainText('View case study');
});

test('the page has no horizontal overflow with the works section, at extremes', async ({ page }) => {
  for (const [w, h] of [[2560, 1080], [360, 640]] as [number, number][]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `horizontal overflow at ${w}x${h}`).toBe(false);
  }
});

test('cards are fully visible under reduced motion (not gated by the reveal)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const cards = page.locator('.work-card');
  await expect(cards).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    await expect(cards.nth(i)).toHaveCSS('opacity', '1');
  }
});

test('cards reveal to full opacity once scrolled into view', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const firstCard = page.locator('.work-card').first();
  await firstCard.scrollIntoViewIfNeeded();
  await expect(firstCard).toHaveCSS('opacity', '1');
});
