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

test('canvas is sized and shader compiles without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()); });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForTimeout(300);
  const size = await page.locator('#hero-canvas').evaluate((c) => ({ w: (c as HTMLCanvasElement).width, h: (c as HTMLCanvasElement).height }));
  expect(size.w).toBeGreaterThan(0);
  expect(size.h).toBeGreaterThan(0);
  expect(errors).toEqual([]); // no GLSL compile / runtime errors
});

test('headline becomes visible after load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero')).toHaveClass(/is-loaded/);
  await expect(page.locator('.headline')).toHaveCSS('opacity', '1');
});

test('headline rises into place on load (starts below its final position)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero')).toHaveClass(/is-loaded/);
  const { initialTop, loadedTop } = await page.evaluate(() => {
    const hero = document.querySelector('.hero') as HTMLElement;
    const h = document.querySelector('.headline') as HTMLElement;
    h.style.transition = 'none';            // measure target positions, not mid-animation
    hero.classList.remove('is-loaded');
    void h.offsetHeight;                    // force reflow
    const initialTop = h.getBoundingClientRect().top;
    hero.classList.add('is-loaded');
    void h.offsetHeight;
    const loadedTop = h.getBoundingClientRect().top;
    h.style.transition = '';
    return { initialTop, loadedTop };
  });
  // the initial (pre-load) state must sit ~16px lower than the loaded state;
  // if the base rule overrides the offset, these are equal and this fails.
  expect(initialTop).toBeGreaterThan(loadedTop + 8);
});
