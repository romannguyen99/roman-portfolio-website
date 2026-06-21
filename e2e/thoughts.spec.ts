import { test, expect } from '@playwright/test';

test('thoughts section renders heading, intro, and four entries', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#thoughts')).toBeVisible();
  await expect(page.locator('.thoughts-title')).toContainText('Thoughts');
  await expect(page.locator('.thoughts-intro')).toContainText('Notes on data, systems, and intelligence');
  await expect(page.locator('.t-item')).toHaveCount(4);
  await expect(page.locator('.t-item .t-title')).toHaveCount(4);
});

test('each thought row shows a category and a Read article CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.t-item .t-cat')).toHaveCount(4);
  await expect(page.locator('.t-item .t-cta')).toHaveCount(4);
  await expect(page.locator('.t-item .t-cta').first()).toContainText('Read article');
});

test('thoughts rows are fully visible under reduced motion (not gated by the reveal)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const rows = page.locator('.t-item');
  await expect(rows).toHaveCount(4);
  // reveal.js must NOT opt into the hidden state under reduced motion
  const hasJsReveal = await page.evaluate(() => document.documentElement.classList.contains('js-reveal'));
  expect(hasJsReveal).toBe(false);
  for (let i = 0; i < 4; i++) {
    await expect(rows.nth(i)).toHaveCSS('opacity', '1');
  }
});

test('thoughts rows reveal to full opacity once scrolled into view', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const firstRow = page.locator('.t-item').first();
  // below the fold (under hero + works), so it starts hidden until scrolled into view
  await expect(firstRow).toHaveCSS('opacity', '0');
  await firstRow.scrollIntoViewIfNeeded();
  await expect(firstRow).toHaveCSS('opacity', '1');
});

test('the page has no horizontal overflow with the thoughts section, at extremes', async ({ page }) => {
  for (const [w, h] of [[2560, 1080], [360, 640]] as [number, number][]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `horizontal overflow at ${w}x${h}`).toBe(false);
  }
});
