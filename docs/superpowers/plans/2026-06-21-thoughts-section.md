# Thoughts Section ("Thoughts") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Thoughts" section — a quiet editorial list of title-led article rows over a slow drifting blurred-orb backdrop — directly under the Works section, reusing the shared scroll-reveal.

**Architecture:** Mirrors the Works pattern (tested pure data in `src/lib/thoughts.js`; `Thoughts.astro` maps it to `ThoughtItem.astro`). The shared `src/scripts/reveal.js` is first refactored to be idempotent (module-level singleton observer + a bound-set) so the new section can call `initReveal()` without re-processing the Works rows. Motifs/orbs are CSS-only; no canvas.

**Tech Stack:** Astro (static), inline CSS + radial-gradient orbs, Vitest (unit), Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-06-21-thoughts-section-design.md`
**Validated visual reference:** `docs/thoughts-reference.html` (port it — do not redesign).

## Global Constraints

- **Palette:** earth tones on near-black via the existing `:root` tokens in `src/styles/global.css` (`--c-near-black #070806`, `--c-warm-black #100D08`, `--c-olive #2D301C`, `--c-moss #474729`, `--c-ochre #987032`, `--c-gold #AD853D`, `--c-text #F4F2EE`, `--c-text-dim`, `--c-text-faint`). Warm color reads as soft atmosphere, never a hard fill/glow blob.
- **Font:** Space Grotesk (already loaded in `src/pages/index.astro` `<head>`); weights 400/450/500.
- **Motion:** slow, premium. Under `prefers-reduced-motion: reduce`, freeze the orb drift and disable reveal/hover transitions; never hide content.
- **No horizontal overflow** at any width; `html,body{overflow-x:hidden}` already global.
- **Verify at** 1440 / 1920 (desktop), 768 (tablet), 390 / 360 (mobile).
- **No** SaaS-card look, stock photos, heavy shadows, neon, busy decoration. This is an editorial list, not cards.
- **Placeholder content** (English only). The article title is a **non-navigating `<h3>`** placeholder and the "Read article" CTA is visual-only; both become `<a href={thought.href}>` when posts exist.
- **Reuse** the shared `src/scripts/reveal.js` and the existing generic reveal CSS in `global.css` (`.js-reveal [data-reveal]`, `.revealed`, the reduced-motion override). Do not duplicate them.

---

## File structure

- **Modify** `src/scripts/reveal.js` — make `initReveal()` idempotent (module-level observer + bound-set).
- **Create** `src/lib/thoughts.js` — `THOUGHTS` data array + `CATEGORIES` list.
- **Create** `src/lib/thoughts.test.js` — data-shape invariants (Vitest).
- **Create** `src/components/thoughts/ThoughtItem.astro` — one title-led row.
- **Create** `src/components/Thoughts.astro` — section shell (orbs + grain + heading + intro + list).
- **Create** `e2e/thoughts.spec.ts` — render + CTA + reduced-motion + reveal + overflow tests.
- **Modify** `src/pages/index.astro` — render `<Thoughts />` after `<Works />`.
- **Modify** `src/styles/global.css` — add `#thoughts { scroll-margin-top: 24px; }`.

---

### Task 1: Thoughts data array (TDD)

**Files:**
- Create: `src/lib/thoughts.js`
- Test: `src/lib/thoughts.test.js`

**Interfaces:**
- Produces: `THOUGHTS` — array of `{ id:string, title:string, category:string, date:string, readTime:string, excerpt:string, href:string }`. `CATEGORIES` — `string[]` of the category labels used. Consumed by `Thoughts.astro` / `ThoughtItem.astro`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/thoughts.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { THOUGHTS, CATEGORIES } from './thoughts.js';

describe('THOUGHTS', () => {
  it('has exactly 4 entries', () => {
    expect(THOUGHTS).toHaveLength(4);
  });

  it('every entry has the required fields with correct types', () => {
    for (const t of THOUGHTS) {
      expect(typeof t.id).toBe('string');
      expect(typeof t.title).toBe('string');
      expect(typeof t.category).toBe('string');
      expect(typeof t.date).toBe('string');
      expect(typeof t.readTime).toBe('string');
      expect(typeof t.excerpt).toBe('string');
      expect(typeof t.href).toBe('string');
    }
  });

  it('ids are unique', () => {
    const ids = THOUGHTS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every category is a known category', () => {
    for (const t of THOUGHTS) expect(CATEGORIES).toContain(t.category);
  });

  it('CATEGORIES lists the four category labels', () => {
    expect([...CATEGORIES].sort()).toEqual(['Analysis', 'Perspective', 'Product', 'Strategy']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/thoughts.test.js`
Expected: FAIL — `Failed to resolve import "./thoughts.js"` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/thoughts.js`:
```js
// Thoughts — essay/article list data. Pure data, unit-tested in thoughts.test.js.
// Categories / dates / read-times / excerpts are illustrative placeholders (real content later).
export const CATEGORIES = ['Analysis', 'Strategy', 'Perspective', 'Product'];

export const THOUGHTS = [
  {
    id: 'model-built',
    title: 'Why Data Science Projects Fail After the Model Is Built',
    category: 'Analysis',
    date: 'Jun 2026',
    readTime: '6 min read',
    excerpt:
      "A model in a notebook isn't a decision in production — and the gap between the two is where most projects quietly die.",
    href: '#',
  },
  {
    id: 'dashboards-decisions',
    title: 'From Dashboards to Decisions',
    category: 'Strategy',
    date: 'May 2026',
    readTime: '5 min read',
    excerpt:
      'Most dashboards inform; few change what anyone actually does. Designing for the decision, not the chart.',
    href: '#',
  },
  {
    id: 'human-side-ml',
    title: 'The Human Side of Machine Learning',
    category: 'Perspective',
    date: 'Apr 2026',
    readTime: '7 min read',
    excerpt:
      "The hardest problems in ML are rarely the math. They're trust, incentives, and the humans kept in the loop.",
    href: '#',
  },
  {
    id: 'better-data-products',
    title: 'Building Better Data Products',
    category: 'Product',
    date: 'Mar 2026',
    readTime: '5 min read',
    excerpt:
      'What it takes to turn a clever model into something people rely on every day — and keep relying on.',
    href: '#',
  },
];
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/thoughts.test.js`
Expected: PASS — all 5 `THOUGHTS` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/thoughts.js src/lib/thoughts.test.js
git commit -m "feat: add Thoughts article data array (thoughts.js) with tests

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Make the shared reveal utility idempotent

Refactor `initReveal()` so it can be called once per section without re-processing already-observed elements. This is behavior-preserving for the single existing caller (Works); the multi-section idempotency is exercised by Task 3.

**Files:**
- Modify: `src/scripts/reveal.js`

**Interfaces:**
- Produces: `initReveal(selector='[data-reveal]'): void` — idempotent. Adds `revealed` to newly-found `[data-reveal]` elements as they enter view; adds `js-reveal` to `<html>` only when JS + motion are available; observes each element at most once (module-level `bound` set + singleton observer).

- [ ] **Step 1: Replace reveal.js with the idempotent version**

Replace the entire contents of `src/scripts/reveal.js` with:
```js
// Shared scroll-reveal: fades [data-reveal] elements in as they enter the viewport.
// Reused across content sections (Works, Thoughts, and later About/Contact).
// Idempotent: safe to call once per section — each call observes only the new, unbound
// [data-reveal] elements, via a module-level singleton observer + bound set.
// Graceful: with no JS or reduced motion, content is shown immediately (never gated).
let observer = null;
const bound = new WeakSet();

export function initReveal(selector = '[data-reveal]') {
  const els = Array.from(document.querySelectorAll(selector)).filter((el) => !bound.has(el));
  if (!els.length) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((el) => {
      el.classList.add('revealed');
      bound.add(el);
    });
    return;
  }

  // Opt into the hidden initial state only now that JS + motion are confirmed.
  // (Targets here are below the fold, so this snap-to-hidden is never visible.)
  document.documentElement.classList.add('js-reveal');

  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
  }

  els.forEach((el) => {
    observer.observe(el);
    bound.add(el);
  });
}
```

- [ ] **Step 2: Verify the Works reveal still works (regression)**

Run: `npx playwright test e2e/works.spec.ts`
Expected: PASS — all 5 works tests, including the two reveal tests (`cards are fully visible under reduced motion`, `cards reveal to full opacity once scrolled into view`). The refactor is behavior-preserving for the single existing caller. If it fails, read the error before changing anything else.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/reveal.js
git commit -m "refactor: make shared initReveal idempotent for multi-section reuse

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Thoughts section, row, orb backdrop, and page wiring

Builds the visible section end-to-end and wires it in. Uses the now-idempotent `initReveal()` and the existing generic reveal CSS. Deliverable verified by a full e2e (render + CTA + reduced-motion + reveal + overflow).

**Files:**
- Create: `src/components/thoughts/ThoughtItem.astro`
- Create: `src/components/Thoughts.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/styles/global.css`
- Test: `e2e/thoughts.spec.ts`

**Interfaces:**
- Consumes: `THOUGHTS` from `src/lib/thoughts.js` (Task 1); `initReveal` from `src/scripts/reveal.js` (Task 2).
- Produces: `<section id="thoughts" class="thoughts">` with `.thoughts-title` / `.thoughts-intro` and `.t-item` rows, each containing `.t-title` (`h3`) / `.t-meta` (with `.t-cat`) / `.t-excerpt` / `.t-cta`. `ThoughtItem` props `{ thought, index }`; each row has `data-reveal` + inline `--reveal-delay`.

- [ ] **Step 1: Create the ThoughtItem row component**

Create `src/components/thoughts/ThoughtItem.astro`:
```astro
---
const { thought, index = 0 } = Astro.props;
---
<article class="t-item" data-reveal style={`--reveal-delay:${index * 0.06}s`}>
  <h3 class="t-title"><span class="t-title-text">{thought.title}</span></h3>
  <div class="t-meta"><span class="t-cat">{thought.category}</span> · {thought.date} · {thought.readTime}</div>
  <p class="t-excerpt">{thought.excerpt}</p>
  <!-- visual-only / non-navigating placeholder; becomes <a href={thought.href}> when articles exist -->
  <span class="t-cta">Read article <span class="arrow">→</span></span>
</article>
<style>
  .t-item { padding: 34px 2px; border-bottom: 1px solid rgba(244,242,238,0.09); }
  .t-title { display: inline-block; transition: transform .45s ease; }
  .t-title-text {
    font-size: clamp(22px, 2.4vw, 30px); font-weight: 480; letter-spacing: -0.03em; line-height: 1.14;
    color: var(--c-text);
    background-image: linear-gradient(currentColor, currentColor);
    background-size: 0% 1px; background-position: 0 100%; background-repeat: no-repeat;
    transition: background-size .5s ease;
  }
  .t-meta { margin-top: 13px; color: var(--c-text-faint); font-size: 12.5px; letter-spacing: 0.4px; }
  .t-cat { color: var(--c-ochre); text-transform: uppercase; letter-spacing: 1.6px; }
  .t-excerpt { margin-top: 14px; max-width: 620px; color: var(--c-text-dim); font-size: 15px; line-height: 1.62; }
  .t-cta { margin-top: 18px; display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; letter-spacing: 0.4px; color: var(--c-text-dim); transition: color .4s ease; }
  .t-cta .arrow { transition: transform .4s ease; }
  @media (hover: hover) {
    .t-item:hover .t-title { transform: translateX(6px); }
    .t-item:hover .t-title-text { background-size: 100% 1px; }
    .t-item:hover .t-cta { color: #fff; }
    .t-item:hover .t-cta .arrow { transform: translateX(4px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .t-title, .t-title-text, .t-cta, .t-cta .arrow { transition: none; }
  }
</style>
```

- [ ] **Step 2: Create the Thoughts section component**

Create `src/components/Thoughts.astro`:
```astro
---
import ThoughtItem from './thoughts/ThoughtItem.astro';
import { THOUGHTS } from '../lib/thoughts.js';
---
<section class="thoughts" id="thoughts">
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="thoughts-inner">
    <header>
      <h2 class="thoughts-title">Thoughts</h2>
      <p class="thoughts-intro">Notes on data, systems, and intelligence — essays on data science, ML, analytics, and how intelligent systems shape the decisions we make.</p>
    </header>
    <div class="thoughts-list">
      {THOUGHTS.map((thought, i) => <ThoughtItem thought={thought} index={i} />)}
    </div>
  </div>
</section>
<style>
  .thoughts {
    position: relative; overflow: hidden;
    background: linear-gradient(180deg, var(--c-near-black) 0%, #0d0b07 50%, var(--c-near-black) 100%);
  }
  /* drifting blurred orbs — quiet warm/olive glows behind the list */
  .orb { position: absolute; border-radius: 50%; filter: blur(72px); pointer-events: none; z-index: 0; }
  .orb-1 { width: 540px; height: 540px; top: -120px; left: -80px;
    background: radial-gradient(circle, rgba(152,112,50,0.20), transparent 70%); }
  .orb-2 { width: 460px; height: 460px; bottom: -140px; right: -60px;
    background: radial-gradient(circle, rgba(71,71,41,0.26), transparent 70%); }
  @media (prefers-reduced-motion: no-preference) {
    .orb-1 { animation: orb-drift-1 36s ease-in-out infinite; }
    .orb-2 { animation: orb-drift-2 46s ease-in-out infinite; }
  }
  @keyframes orb-drift-1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(60px,40px); } }
  @keyframes orb-drift-2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-50px,-30px); } }

  .thoughts::after {
    content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.04; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 150px 150px;
  }

  .thoughts-inner { position: relative; z-index: 1; max-width: 880px; margin: 0 auto; padding: 130px 48px 150px; }
  .thoughts-title { font-size: clamp(34px, 4vw, 52px); font-weight: 480; letter-spacing: -0.04em; line-height: 1.02; }
  .thoughts-intro { max-width: 560px; margin-top: 18px; color: var(--c-text-dim); font-size: 16px; line-height: 1.6; }
  .thoughts-list { margin-top: 60px; border-top: 1px solid rgba(244,242,238,0.09); }

  @media (max-width: 640px) {
    .thoughts-inner { padding: 88px 24px 104px; }
    .thoughts-list { margin-top: 44px; }
  }
</style>
<script>
  import { initReveal } from '../scripts/reveal.js';
  initReveal();
</script>
```

- [ ] **Step 3: Render the section on the page**

Modify `src/pages/index.astro`. Change the frontmatter import block from:
```astro
---
import '../styles/global.css';
import Hero from '../components/Hero.astro';
import Works from '../components/Works.astro';
---
```
to:
```astro
---
import '../styles/global.css';
import Hero from '../components/Hero.astro';
import Works from '../components/Works.astro';
import Thoughts from '../components/Thoughts.astro';
---
```
and change the body from:
```astro
  <body>
    <Hero />
    <Works />
  </body>
```
to:
```astro
  <body>
    <Hero />
    <Works />
    <Thoughts />
  </body>
```

- [ ] **Step 4: Add the `#thoughts` anchor offset to global.css**

Find in `src/styles/global.css`:
```css
#work { scroll-margin-top: 24px; }
```
Replace with:
```css
#work { scroll-margin-top: 24px; }
#thoughts { scroll-margin-top: 24px; }
```

- [ ] **Step 5: Write the e2e**

Create `e2e/thoughts.spec.ts`:
```ts
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
```

- [ ] **Step 6: Run the thoughts e2e**

Run: `npx playwright test e2e/thoughts.spec.ts`
Expected: PASS — all 5 tests. The reduced-motion test confirms rows aren't gated; the reveal test confirms the hidden→shown transition works with the idempotent observer running alongside the Works call.

- [ ] **Step 7: Verify Works reveal still passes alongside Thoughts (multi-section idempotency)**

Run: `npx playwright test e2e/works.spec.ts`
Expected: PASS — all 5 works tests. Both sections now call `initReveal()`; the idempotent observer reveals each section's rows without interfering.

- [ ] **Step 8: Commit**

```bash
git add src/components/Thoughts.astro src/components/thoughts/ src/pages/index.astro src/styles/global.css e2e/thoughts.spec.ts
git commit -m "feat: build the Thoughts editorial article-list section

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Full verification across breakpoints

**Files:** none (verification only).

- [ ] **Step 1: Run the full unit suite**

Run: `npm run test`
Expected: PASS — `heroLayout.test.js`, `works.test.js`, and `thoughts.test.js` all green.

- [ ] **Step 2: Run the full e2e suite**

Run: `npm run test:e2e`
Expected: PASS — all hero + works + thoughts tests, including the page-wide horizontal-overflow sweep (which now also covers the Thoughts section).

- [ ] **Step 3: Visual sweep (Playwright MCP)**

With `npm run dev` running, drive a browser to `http://localhost:4321/`, scroll to the Thoughts section, and screenshot at widths **1920, 1440, 768, 390, 360**. Confirm against `docs/thoughts-reference.html`:
- Title-led rows with thin dividers; ochre uppercase category + dim date/read-time meta; one-line excerpt; "Read article →" CTA. Titles are white (not link-blue).
- The warm/olive orb glows softly behind the list and drifts slowly; it never competes with the text.
- Hover (desktop): the title underline reveals + slides slightly; the CTA arrow nudges.
- Section background reads subtly distinct from Works; on-brand earth tones; no overflow, no SaaS look.

- [ ] **Step 4: Verify `prefers-reduced-motion`**

Emulate reduce and reload. Confirm all four rows are visible immediately (no fade-in gating) and the orbs are frozen (no drift).

- [ ] **Step 5: Stop the dev server**

Stop the background `npm run dev` process.

---

## Self-Review

**1. Spec coverage:**
- Title-led rows → Task 3 Step 1 (`ThoughtItem`). ✓
- Drifting blurred orb backdrop → Task 3 Step 2 (`.orb-1/.orb-2` + drift keyframes, gated under no-preference). ✓
- Architecture (thoughts.js/test, Thoughts/ThoughtItem, reveal.js refactor) → Tasks 1–3. ✓
- reveal.js idempotency refactor + reuse → Task 2; reused generic CSS unchanged. ✓
- Section frame (gradient + grain + heading + intro + list dividers) → Task 3 Step 2. ✓
- Content (4 placeholder posts; non-navigating `<h3>` title + visual-only CTA) → Task 1 data + Task 3 Step 1. ✓
- Hover (underline reveal + slide, arrow nudge) → Task 3 Step 1. ✓
- Motion/a11y (reveal reuse, orb frozen + rows visible under reduced motion / no-JS) → Tasks 2–3. ✓
- Testing (data invariants + render + CTA + reduced-motion + reveal + overflow + Works regression) → Task 1, Task 2 Step 2, Task 3 Steps 5–7. ✓
- Smooth-scroll anchor for `#thoughts` → Task 3 Step 4. ✓

**2. Placeholder scan:** No "TBD/TODO/handle edge cases"; every code step shows full content. Placeholder *content* (dates/read-times/excerpts) is intentional and labeled. ✓

**3. Type consistency:** `THOUGHTS` entry shape and `CATEGORIES` are identical across `thoughts.js`, `thoughts.test.js`, and `ThoughtItem.astro`. The reveal contract (`data-reveal`, `--reveal-delay`, `js-reveal`, `revealed`) matches `reveal.js` and the existing generic CSS reused unchanged. CSS class names (`.thoughts-title`, `.thoughts-intro`, `.t-item`, `.t-title`, `.t-cat`, `.t-cta`) match between components and `thoughts.spec.ts`. ✓

**Noted deviations (with rationale):**
- The article title is a non-navigating `<h3>` (not an `<a>`), matching the Works visual-only-CTA convention and avoiding default link styling; restored to `<a href={thought.href}>` when articles exist.
- `thoughts.spec.ts` checks horizontal overflow only at extremes (2560/360); the full breakpoint sweep is already covered page-wide by `e2e/hero.spec.ts` (DRY).
