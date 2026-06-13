# Hero (WebGL Shared-Field) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Astro project and build the locked WebGL hero by porting `docs/hero-reference.html` into Astro components, verified across breakpoints.

**Architecture:** Astro static site. The hero is one full-screen `<canvas>` driven by a raw-WebGL fragment shader (one shared procedural earth-tone field; the circular optical window is a UV-distortion region of that same field — no separate object). A thin vanilla-JS module owns WebGL setup, resize math, animation loop, reduced-motion, and a WebGL fallback. Pure layout math is extracted into a separately unit-tested module. The UI layer (wordmark, language selector, nav, headline, scroll indicator, mobile menu) is static Astro markup with scoped CSS, ported verbatim from the reference.

**Tech Stack:** Astro 5, raw WebGL (no Three.js — a single fullscreen shader does not need it), Space Grotesk (Google Fonts), Vitest (pure-function unit tests), Playwright (`@playwright/test`, integration + visual checks).

**Source of truth:** `docs/hero-reference.html` — the validated hero. Do not redesign it; port it. When a step says "copy from the reference," open that file and copy the named block **verbatim**.

---

## File structure

| File | Responsibility |
|------|----------------|
| `package.json` | scripts + deps (astro, vitest, @playwright/test) |
| `astro.config.mjs` | Astro config (static output) |
| `vitest.config.ts` | Vitest (node env) for pure helpers |
| `playwright.config.ts` | Playwright e2e; boots `astro dev` |
| `src/styles/global.css` | design tokens (palette, type), reset |
| `src/lib/heroLayout.js` | **pure** functions: `computeCircleLayout`, `capDpr`, `isMobile` |
| `src/lib/heroLayout.test.js` | Vitest unit tests for the above |
| `src/components/hero/heroField.js` | WebGL init: shaders, uniforms, resize (uses heroLayout), RAF, reduced-motion, fallback |
| `src/components/Hero.astro` | hero markup (UI layer + canvas mount) + scoped CSS + mount script |
| `src/pages/index.astro` | HTML shell (head: fonts, meta) renders `<Hero />` |
| `e2e/hero.spec.ts` | Playwright: load, no console errors, canvas, UI, responsive, menu, reduced-motion |

---

## Task 1: Scaffold Astro project + tooling

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `src/pages/index.astro`
- Create: `src/env.d.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "roman-portfolio",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "astro": "^5.5.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

// Static output; deployable to any host. If deploying to a GitHub Pages
// project site, set `site` and `base` accordingly.
export default defineConfig({
  output: 'static',
});
```

- [ ] **Step 3: Create `src/env.d.ts`**

```ts
/// <reference types="astro/client" />
```

- [ ] **Step 4: Create a minimal `src/pages/index.astro` (temporary, replaced in Task 8 head work)**

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Roman Nguyen — Data Science Portfolio</title>
  </head>
  <body>
    <main><p>scaffold ok</p></main>
  </body>
</html>
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: completes without errors; `node_modules/` and `package-lock.json` created.

- [ ] **Step 6: Verify the build works**

Run: `npm run build`
Expected: "Complete!" / build succeeds, `dist/index.html` exists.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json astro.config.mjs src/env.d.ts src/pages/index.astro
git commit -m "chore: scaffold Astro project"
```

---

## Task 2: Global design tokens + reset

**Files:**
- Create: `src/styles/global.css`
- Modify: `src/pages/index.astro` (import the stylesheet)

- [ ] **Step 1: Create `src/styles/global.css`**

```css
:root {
  /* palette (earth tones on near-black) */
  --c-near-black: #070806;
  --c-warm-black: #100D08;
  --c-olive: #2D301C;
  --c-moss: #474729;
  --c-amber: #493019;
  --c-bronze: #704A22;
  --c-ochre: #987032;
  --c-gold: #AD853D;
  --c-teal: #142724;
  --c-text: #F4F2EE;
  --c-text-dim: rgba(244, 242, 238, 0.65);
  --c-text-faint: rgba(244, 242, 238, 0.52);

  /* type */
  --font-sans: 'Space Grotesk', system-ui, -apple-system, sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: var(--c-near-black); overflow-x: hidden; }
body { font-family: var(--font-sans); -webkit-font-smoothing: antialiased; color: var(--c-text); }
a { text-decoration: none; color: inherit; }
```

- [ ] **Step 2: Import the stylesheet from `src/pages/index.astro`**

Add inside the frontmatter fence (between the `---` lines) at the top:

```astro
---
import '../styles/global.css';
---
```

- [ ] **Step 3: Verify the build still works**

Run: `npm run build`
Expected: build succeeds; `dist/index.html` references the bundled CSS.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css src/pages/index.astro
git commit -m "feat: add global design tokens and reset"
```

---

## Task 3: Pure layout helpers (TDD)

These mirror the reference's `resize()` math exactly, extracted so they can be unit-tested without a browser.

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/heroLayout.js`
- Test: `src/lib/heroLayout.test.js`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,ts}'],
  },
});
```

- [ ] **Step 2: Write the failing test — `src/lib/heroLayout.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { computeCircleLayout, capDpr, isMobile } from './heroLayout.js';

describe('computeCircleLayout', () => {
  it('desktop 1440x900: clamped diameter, cropped top/right', () => {
    const { D, cx, cyTop } = computeCircleLayout(1440, 900);
    expect(D).toBeCloseTo(633.6, 1);   // 0.44*1440 within [580,760]
    expect(cx).toBeCloseTo(1224.0, 1); // 1440 + 0.07*1440 - D/2
    expect(cyTop).toBeCloseTo(244.8, 1); // -0.08*900 + D/2
  });

  it('desktop 1920x1080: diameter clamped to 760 max', () => {
    const { D } = computeCircleLayout(1920, 1080);
    expect(D).toBeCloseTo(760, 1); // 0.44*1920=844.8 -> clamp 760
  });

  it('mobile 390x844: 0.80*W diameter, top-cropped', () => {
    const { D, cx, cyTop } = computeCircleLayout(390, 844);
    expect(D).toBeCloseTo(312, 1);    // 0.80*390
    expect(cx).toBeCloseTo(273, 1);   // 390 + 0.10*390 - 156
    expect(cyTop).toBeCloseTo(20.96, 1); // -0.16*844 + 156
  });

  it('small mobile 360x780: 0.76*W diameter', () => {
    const { D } = computeCircleLayout(360, 780);
    expect(D).toBeCloseTo(273.6, 1); // 0.76*360
  });
});

describe('capDpr', () => {
  it('caps at 2 on desktop, 1.5 on mobile, never raises', () => {
    expect(capDpr(3, 1440)).toBe(2);
    expect(capDpr(3, 390)).toBe(1.5);
    expect(capDpr(1, 1440)).toBe(1);
  });
});

describe('isMobile', () => {
  it('boundary at 640', () => {
    expect(isMobile(640)).toBe(true);
    expect(isMobile(641)).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./heroLayout.js"` / functions not defined.

- [ ] **Step 4: Implement `src/lib/heroLayout.js`**

```js
// Pure geometry for the hero circle, mirroring the validated reference.
// All values in CSS pixels. cyTop is measured from the TOP of the viewport.
export function computeCircleLayout(W, H) {
  let D, rightBeyond, topBeyond;
  if (W <= 640) {
    D = (W <= 360 ? 0.76 : 0.80) * W;
    rightBeyond = 0.10 * W;
    topBeyond = (W <= 360 ? 0.15 : 0.16) * H;
  } else {
    D = Math.min(Math.max(580, 0.44 * W), 760);
    rightBeyond = 0.07 * W;
    topBeyond = 0.08 * H;
  }
  const cx = W + rightBeyond - D / 2;   // centre x from left
  const cyTop = -topBeyond + D / 2;     // centre y from top
  return { D, cx, cyTop };
}

export function capDpr(dpr, W) {
  return Math.min(dpr || 1, W <= 640 ? 1.5 : 2);
}

export function isMobile(W) {
  return W <= 640;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all cases green.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/lib/heroLayout.js src/lib/heroLayout.test.js
git commit -m "feat: add pure hero layout helpers with tests"
```

---

## Task 4: Hero UI layer (static markup + scoped CSS)

Build the full UI layer and a temporary solid background (no canvas yet). CSS ported from the reference.

**Files:**
- Create: `src/components/Hero.astro`
- Modify: `src/pages/index.astro` (render `<Hero />`)

- [ ] **Step 1: Create `src/components/Hero.astro`**

```astro
---
---
<section class="hero">
  <canvas id="hero-canvas" class="hero-canvas"></canvas>
  <div class="hero-grain"></div>

  <div class="hero-ui">
    <div class="wordmark">roman nguyen</div>
    <div class="lang"><b>EN</b> / VN</div>
    <nav class="nav">
      <a href="#work">WORK</a>
      <a href="#thoughts">THOUGHTS</a>
      <a href="#about">ABOUT ME</a>
    </nav>
    <button class="menu-btn" aria-label="Open menu"><span></span><span></span></button>

    <h1 class="headline"><span>Roman</span> <span>Nguyen</span></h1>

    <div class="scroll" aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs><path id="circ" d="M50,50 m-34,0 a34,34 0 1,1 68,0 a34,34 0 1,1 -68,0"/></defs>
        <text><textPath href="#circ" startOffset="0%">SCROLL TO EXPLORE · SCROLL TO EXPLORE · </textPath></text>
      </svg>
      <span class="dot"></span>
    </div>
  </div>

  <div class="menu-overlay" hidden>
    <button class="menu-close" aria-label="Close menu"></button>
    <a href="#work">Work</a>
    <a href="#thoughts">Thoughts</a>
    <a href="#about">About Me</a>
  </div>
</section>

<style>
  .hero { position: relative; width: 100%; height: 100svh; overflow: hidden; background: var(--c-near-black); }

  .hero-canvas { position: absolute; inset: 0; z-index: 0; display: block; width: 100%; height: 100%; }

  .hero-grain {
    position: absolute; inset: 0; z-index: 2; pointer-events: none;
    opacity: 0.05; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 150px 150px;
  }

  .hero-ui {
    position: absolute; inset: 0; z-index: 3;
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  }
  .wordmark { position: absolute; top: 30px; left: 38px; color: rgba(244,242,238,0.88); font-size: 13px; font-weight: 450; letter-spacing: 0.2px; }
  .lang { position: absolute; top: 31px; left: 50%; transform: translateX(-50%); color: var(--c-text-faint); font-size: 10px; letter-spacing: 3px; }
  .lang b { color: rgba(244,242,238,0.9); font-weight: 500; }
  .nav { position: absolute; top: 30px; right: 38px; display: flex; flex-direction: column; gap: 14px; text-align: right; }
  .nav a { color: var(--c-text-dim); font-size: 11.5px; letter-spacing: 1.5px; transition: color .4s ease; }
  .nav a:hover { color: #fff; }
  .menu-btn { display: none; position: absolute; top: 26px; right: 24px; width: 28px; height: 16px; cursor: pointer; flex-direction: column; justify-content: space-between; background: none; border: 0; padding: 0; }
  .menu-btn span { display: block; height: 1.5px; width: 100%; background: rgba(244,242,238,0.85); }
  .menu-btn span:nth-child(2) { width: 66%; align-self: flex-end; }

  .headline {
    position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%);
    color: var(--c-text); font-size: clamp(56px, 5.5vw, 88px); font-weight: 480;
    letter-spacing: -0.04em; line-height: 1; white-space: nowrap;
  }

  .scroll { position: absolute; left: 38px; bottom: 34px; width: 58px; height: 58px; }
  .scroll svg { width: 100%; height: 100%; animation: spin 18s linear infinite; }
  .scroll text { fill: rgba(244,242,238,0.62); font-size: 9px; letter-spacing: 2.3px; }
  .scroll .dot { position: absolute; inset: 0; margin: auto; width: 4px; height: 4px; border-radius: 50%; background: rgba(244,242,238,0.85); }
  @keyframes spin { to { transform: rotate(360deg); } }

  .menu-overlay {
    position: fixed; inset: 0; z-index: 20; display: flex; flex-direction: column; justify-content: center; gap: 6px; padding: 0 38px;
    background:
      radial-gradient(50% 40% at 85% 8%, rgba(118,81,38,0.26), transparent 62%),
      radial-gradient(60% 50% at 18% 96%, rgba(74,75,39,0.24), transparent 60%),
      var(--c-near-black);
    opacity: 0; pointer-events: none; transition: opacity .5s ease;
  }
  .menu-overlay[hidden] { display: flex; } /* keep in flow; visibility driven by .is-open */
  .menu-overlay a { color: rgba(244,242,238,0.92); font-size: 34px; font-weight: 450; letter-spacing: -0.02em; padding: 10px 0; opacity: 0; transform: translateY(14px); transition: opacity .5s ease, transform .5s ease; }
  .menu-close { position: absolute; top: 24px; right: 24px; width: 22px; height: 22px; cursor: pointer; background: none; border: 0; }
  .menu-close::before, .menu-close::after { content: ""; position: absolute; top: 50%; left: 0; width: 100%; height: 1.5px; background: rgba(244,242,238,0.85); }
  .menu-close::before { transform: rotate(45deg); }
  .menu-close::after { transform: rotate(-45deg); }

  body.menu-open { overflow: hidden; }
  body.menu-open .menu-overlay { opacity: 1; pointer-events: auto; }
  body.menu-open .menu-overlay a { opacity: 1; transform: translateY(0); }
  body.menu-open .menu-overlay a:nth-child(2) { transition-delay: .08s; }
  body.menu-open .menu-overlay a:nth-child(3) { transition-delay: .16s; }
  body.menu-open .menu-overlay a:nth-child(4) { transition-delay: .24s; }

  @media (max-width: 640px) {
    .nav { display: none; }
    .menu-btn { display: flex; }
    .wordmark { left: 24px; top: 24px; }
    .lang { top: 26px; }
    .headline { top: 46svh; font-size: clamp(40px, 10.5vw, 48px); letter-spacing: -0.035em; line-height: 0.97; }
    .scroll { left: 24px; bottom: 30px; width: 66px; height: 66px; }
    .scroll text { fill: rgba(244,242,238,0.72); }
  }
  @media (max-width: 360px) {
    .headline { white-space: normal; display: flex; flex-direction: column; align-items: center; line-height: 0.95; }
  }
</style>
```

> Note: `.menu-overlay` uses the `hidden` attribute initially only to assert the closed state in tests; the override keeps it rendered so the fade transition works. Visibility is controlled by `body.menu-open`. Task 5's script removes the `hidden` attribute on mount.

- [ ] **Step 2: Render `<Hero />` from `src/pages/index.astro`**

Replace the `<body>` contents:

```astro
---
import '../styles/global.css';
import Hero from '../components/Hero.astro';
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Roman Nguyen — Data Science Portfolio</title>
  </head>
  <body>
    <Hero />
  </body>
</html>
```

- [ ] **Step 3: Verify the build works**

Run: `npm run build`
Expected: build succeeds; `dist/index.html` contains `class="headline"` and `Roman`.

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.astro src/pages/index.astro
git commit -m "feat: add hero UI layer markup and styles"
```

---

## Task 5: Mobile menu interaction + Playwright harness

**Files:**
- Create: `playwright.config.ts`
- Modify: `src/components/Hero.astro` (add a `<script>` for the menu)
- Test: `e2e/hero.spec.ts`

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- [ ] **Step 2: Write the failing test — `e2e/hero.spec.ts`**

```ts
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx playwright install chromium` then `npm run test:e2e`
Expected: the "mobile menu opens…" test FAILS (no script wires the button yet); body never gets `menu-open`.

- [ ] **Step 4: Add the menu script to `src/components/Hero.astro`**

Append at the end of the file (after `</style>`):

```astro
<script>
  const body = document.body;
  const overlay = document.querySelector('.menu-overlay');
  overlay?.removeAttribute('hidden');
  const open = () => body.classList.add('menu-open');
  const close = () => body.classList.remove('menu-open');
  document.querySelector('.menu-btn')?.addEventListener('click', open);
  document.querySelector('.menu-close')?.addEventListener('click', close);
  overlay?.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
</script>
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:e2e`
Expected: all three tests PASS.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts e2e/hero.spec.ts src/components/Hero.astro
git commit -m "feat: wire mobile menu open/close with scroll lock"
```

---

## Task 6: WebGL shared-field shader module

Port the validated WebGL from the reference into a module that uses the pure layout helpers. The GLSL is copied **verbatim** from `docs/hero-reference.html`.

**Files:**
- Create: `src/components/hero/heroField.js`
- Modify: `src/components/Hero.astro` (mount the field)
- Test: `e2e/hero.spec.ts` (add canvas/console assertions)

- [ ] **Step 1: Create `src/components/hero/heroField.js`**

```js
import { computeCircleLayout, capDpr, isMobile } from '../../lib/heroLayout.js';

// VERT: copy the ENTIRE contents of the <script id="vert"> element from
// docs/hero-reference.html into this template literal, verbatim.
const VERT = `
PASTE_VERT_GLSL_HERE
`;

// FRAG: copy the ENTIRE contents of the <script id="frag"> element from
// docs/hero-reference.html into this template literal, verbatim.
const FRAG = `
PASTE_FRAG_GLSL_HERE
`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
  }
  return s;
}

// Initialises the shared-field shader on the given canvas.
// Returns a cleanup function. Falls back to a static CSS gradient if WebGL is unavailable.
export function initHeroField(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) {
    canvas.style.background =
      'radial-gradient(60% 50% at 85% 10%, #5a3c0d 0%, transparent 55%), radial-gradient(70% 60% at 12% 105%, #2d301c 0%, transparent 55%), #070806';
    return () => {};
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = (n) => gl.getUniformLocation(prog, n);
  const uRes = U('uRes'), uT = U('uT'), uCenter = U('uCenter'),
        uRadius = U('uRadius'), uReduced = U('uReduced'), uMobile = U('uMobile');
  gl.uniform1f(uReduced, reduced ? 1.0 : 0.0);

  let dpr = 1;
  function resize() {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    dpr = capDpr(window.devicePixelRatio, W);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    const { D, cx, cyTop } = computeCircleLayout(W, H);
    gl.uniform2f(uCenter, cx * dpr, (H - cyTop) * dpr); // y flipped to bottom-origin
    gl.uniform1f(uRadius, (D / 2) * dpr);
    gl.uniform1f(uMobile, isMobile(W) ? 1.0 : 0.0);
  }
  window.addEventListener('resize', resize);
  resize();

  let raf = 0;
  const start = performance.now();
  function frame(now) {
    gl.uniform1f(uT, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduced) raf = requestAnimationFrame(frame);
  }
  if (reduced) { gl.uniform1f(uT, 18.0); gl.drawArrays(gl.TRIANGLES, 0, 3); }
  else raf = requestAnimationFrame(frame);

  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
}
```

- [ ] **Step 2: Paste the GLSL**

Open `docs/hero-reference.html`. Replace `PASTE_VERT_GLSL_HERE` with the entire body of the `<script id="vert">` element, and `PASTE_FRAG_GLSL_HERE` with the entire body of the `<script id="frag">` element. Copy verbatim — do not edit the GLSL.

- [ ] **Step 3: Mount the field in `src/components/Hero.astro`**

Replace the menu `<script>` block added in Task 5 with this combined module script (imports require `type="module"`, which Astro provides by default for bundled scripts):

```astro
<script>
  import { initHeroField } from './hero/heroField.js';

  const body = document.body;
  const overlay = document.querySelector('.menu-overlay');
  overlay?.removeAttribute('hidden');
  const open = () => body.classList.add('menu-open');
  const close = () => body.classList.remove('menu-open');
  document.querySelector('.menu-btn')?.addEventListener('click', open);
  document.querySelector('.menu-close')?.addEventListener('click', close);
  overlay?.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  const canvas = document.getElementById('hero-canvas');
  if (canvas) initHeroField(canvas);
</script>
```

- [ ] **Step 4: Add canvas + console-error assertions to `e2e/hero.spec.ts`**

Append:

```ts
test('canvas is sized and shader compiles without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()); });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForTimeout(300);
  const size = await page.locator('#hero-canvas').evaluate((c) => ({ w: c.width, h: c.height }));
  expect(size.w).toBeGreaterThan(0);
  expect(size.h).toBeGreaterThan(0);
  expect(errors).toEqual([]); // no GLSL compile / runtime errors
});
```

- [ ] **Step 5: Run all tests**

Run: `npm test && npm run test:e2e`
Expected: Vitest PASS; all Playwright tests PASS (canvas sized, zero console errors → shader compiled).

- [ ] **Step 6: Visual spot-check against the reference**

Run: `npm run dev`, open `http://localhost:4321`. In a second tab open `docs/hero-reference.html` (via `npx serve` or file://). Confirm at 1440 and 390 the warm ribbon bends around the upper-right circle, the field is mostly dark, and the headline sits in a calm dark pocket — matching the reference.

- [ ] **Step 7: Commit**

```bash
git add src/components/hero/heroField.js src/components/Hero.astro e2e/hero.spec.ts
git commit -m "feat: port WebGL shared-field hero shader"
```

---

## Task 7: Load choreography + cursor parallax

Fade the canvas in, then the top UI, then reveal the headline with a slight rise. Add a few-pixel cursor parallax on the canvas. Both respect reduced motion.

**Files:**
- Modify: `src/components/Hero.astro` (CSS + script)

- [ ] **Step 1: Add choreography CSS to `src/components/Hero.astro`**

Add inside `<style>`, after the `.hero` rule:

```css
  /* load choreography: hidden until .is-loaded is set on .hero */
  .hero-canvas { opacity: 0; transition: opacity 1.1s ease; }
  .wordmark, .lang, .nav, .menu-btn, .scroll { opacity: 0; transition: opacity .9s ease; transition-delay: .5s; }
  .headline { opacity: 0; transition: opacity 1s ease, transform 1s ease; transition-delay: .9s; }
  .headline { transform: translate(-50%, calc(-50% + 16px)); }

  .hero.is-loaded .hero-canvas { opacity: 1; }
  .hero.is-loaded .wordmark,
  .hero.is-loaded .lang,
  .hero.is-loaded .nav,
  .hero.is-loaded .menu-btn,
  .hero.is-loaded .scroll { opacity: 1; }
  .hero.is-loaded .headline { opacity: 1; transform: translate(-50%, -50%); }

  /* parallax: a CSS var nudges the canvas a few px */
  .hero-canvas { will-change: transform; transform: translate(var(--px, 0px), var(--py, 0px)); }

  @media (prefers-reduced-motion: reduce) {
    .hero-canvas, .wordmark, .lang, .nav, .menu-btn, .scroll, .headline { transition: none; }
    .headline { transform: translate(-50%, -50%); }
    .hero-canvas { transform: none; }
    .scroll svg { animation: none; } /* stop the rotating scroll indicator too */
  }
```

> Note: the `.hero-canvas` `transform` (parallax) and the `.headline` `transform` (centering) are on different elements, so they don't conflict.

- [ ] **Step 2: Trigger `.is-loaded` and add parallax in the Hero script**

In the `<script>` block, after `if (canvas) initHeroField(canvas);`, add:

```js
  const hero = document.querySelector('.hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero?.classList.add('is-loaded')));

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  if (hero && canvas && !reduce && fine) {
    window.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;  // -1..1
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      canvas.style.setProperty('--px', `${(-nx * 5).toFixed(2)}px`); // max ~5px
      canvas.style.setProperty('--py', `${(-ny * 5).toFixed(2)}px`);
    });
  }
```

- [ ] **Step 3: Add a reveal assertion to `e2e/hero.spec.ts`**

Append:

```ts
test('headline becomes visible after load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero')).toHaveClass(/is-loaded/);
  await expect(page.locator('.headline')).toHaveCSS('opacity', '1');
});
```

- [ ] **Step 4: Run all tests**

Run: `npm test && npm run test:e2e`
Expected: all PASS — `.hero` gets `is-loaded`, headline opacity reaches 1.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.astro e2e/hero.spec.ts
git commit -m "feat: add hero load choreography and cursor parallax"
```

---

## Task 8: Fonts, cross-breakpoint verification, spec correction

**Files:**
- Modify: `src/pages/index.astro` (font `<link>`)
- Modify: `CLAUDE.md` (correct the tech-stack line)

- [ ] **Step 1: Add Space Grotesk to the head in `src/pages/index.astro`**

Add inside `<head>`:

```astro
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;450;500&display=swap" rel="stylesheet" />
```

- [ ] **Step 2: Correct the tech-stack note in `CLAUDE.md`**

Find the line under "Tech stack & architecture":

```
- **Three.js as a hydrated island** for the hero canvas only (`client:load` or `client:visible`).
  The hero is one full-screen WebGL canvas running the shared-field fragment shader.
```

Replace with:

```
- **Raw WebGL** for the hero canvas (one full-screen fragment shader — Three.js is unnecessary for
  a single fullscreen pass). The WebGL module is loaded via Astro's default module `<script>`, which
  hydrates on the client. (The validated reference uses raw WebGL; this supersedes the earlier note.)
```

- [ ] **Step 3: Production build sanity check**

Run: `npm run build && npm run preview`
Open `http://localhost:4321`. Confirm Space Grotesk loads (headline matches the reference's geometry) and there is no horizontal scrollbar.

- [ ] **Step 4: Verify all breakpoints (against the reference)**

With `npm run dev` running, check each width and confirm against the reference look:
- 1920×1080 — circle large upper-right, ribbon bends around it, mostly dark.
- 1440×900 — same, headline centred in dark pocket.
- 768×1024 — vertical nav retained, circle ~40vw, no overflow.
- 390×844 — hamburger shows, warm ribbon reads through the cropped circle, menu overlay opens cleanly.
- 360×780 — headline stacks to two lines ("Roman" / "Nguyen").

Run (optional, to validate reduced motion): in DevTools, emulate `prefers-reduced-motion: reduce` and reload — the field freezes on a still frame, the headline is centred and visible, no transitions.

- [ ] **Step 5: Run the full test suite**

Run: `npm test && npm run test:e2e`
Expected: all Vitest + Playwright tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro CLAUDE.md
git commit -m "feat: load Space Grotesk; correct hero tech-stack note"
```

---

## Done criteria

- `npm run build` succeeds; no horizontal overflow at any breakpoint.
- `npm test` (Vitest) and `npm run test:e2e` (Playwright) both green.
- Hero matches `docs/hero-reference.html` at 1920 / 1440 / 768 / 390 / 360.
- Shared-field shader: warm ribbon bends around the upper-right circle, mostly dark field, no console errors.
- Mobile: hamburger + full-screen menu overlay with scroll lock; circle reads warm flow.
- `prefers-reduced-motion`: frozen field, no reveal/parallax motion, headline centred and legible.
- WebGL-unavailable fallback shows a static earth-tone gradient.
