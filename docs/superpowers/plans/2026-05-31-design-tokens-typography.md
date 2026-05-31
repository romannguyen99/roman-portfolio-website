# Design Tokens & Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the visual foundation for the portfolio — brand color palette, type scale, fonts, spacing rhythm, motion tokens, and a global CSS reset — exposed as Tailwind v4 `@theme` tokens, with a dev-only `/specimen` route that visually proves every token works.

**Architecture:** All design tokens live in the `@theme` block of `src/app/globals.css` (Tailwind v4 CSS-first config — no `tailwind.config.ts`). Fonts load via `next/font/google` from `src/lib/fonts.ts`, exposing CSS variables (`--font-plus-jakarta`, `--font-jetbrains`) consumed by `--font-display` / `--font-mono` tokens. A small `@layer base` block sets `color-scheme: dark`, body defaults, focus rings, and a global `prefers-reduced-motion` short-circuit. The `/specimen` page renders every token visually and is the verification target. No Vitest tests — token values and the fonts module are CSS / build-time plumbing; the real catch is `npm run build` (runs the genuine `next/font` pipeline) plus the browser verification on `/specimen`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, `next/font/google` (Plus Jakarta Sans + JetBrains Mono), Playwright (visual verification).

**Spec:** [docs/superpowers/specs/2026-05-31-design-tokens-typography-design.md](../specs/2026-05-31-design-tokens-typography-design.md)

---

## Pre-flight context

- Tailwind v4 dropped JS config; tokens live in CSS via `@theme { --token: value; }`. Reference: the existing one-liner `@import "tailwindcss";` in [src/app/globals.css](../../../src/app/globals.css) is what we extend.
- `next/font/google` returns an object with a `.variable` string like `__variable_abc123`. You attach that class to `<html>` and the font is available as `var(--font-<name>)` inside CSS. Reference: [src/app/layout.tsx](../../../src/app/layout.tsx) currently has `<html className="antialiased">` — we extend that className with font variables.
- Path alias `@` → `src/` is wired in both [tsconfig.json](../../../tsconfig.json) and [vitest.config.ts](../../../vitest.config.ts).
- Vitest uses jsdom + globals (no need to import `describe`/`it`/`expect`).
- Commit on `main` per [CLAUDE.md §7](../../../CLAUDE.md). No feature branches.
- Conventional-commit-ish prefixes: `feat:`, `chore:`, `test:`, `docs:`.

---

## File structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `src/lib/fonts.ts` | Create | Single source for `next/font` instances (`plusJakartaSans`, `jetbrainsMono`). Exports CSS-variable class names for layout to attach. |
| `src/app/layout.tsx` | Modify | Attach `plusJakartaSans.variable` + `jetbrainsMono.variable` to `<html>` className so CSS vars resolve site-wide. |
| `src/app/globals.css` | Rewrite | Full `@theme` block (colors, fonts, type scale, spacing, motion) + `@layer base` reset (color-scheme, body defaults, focus, reduced-motion). |
| `src/app/specimen/page.tsx` | Create | Dev-only server component. Renders six sections: color swatches, type ladder (bilingual sample), italic+roman mix, spacing scale, easing previews, mono sample. |
| `src/app/specimen/easing-previews.tsx` | Create | Small client component used inside `/specimen`. Four hover-triggered translate-x previews, one per easing token. |
| `CLAUDE.md` | Modify | Tick step 2 in §5 build-order checklist after verification passes. |

No new dependencies. Plus Jakarta Sans + JetBrains Mono ship through `next/font/google` which is already part of Next 16.

---

## Task 1: Fonts module

**Files:**
- Create: `src/lib/fonts.ts`

No Vitest test — `next/font/google` is a Next.js build-time loader that doesn't resolve under Vitest/jsdom. Mocking it produces a tautological test (verifies the mock returned what the mock returns). The real catch for a broken font import is `npm run build`, which runs the genuine `next/font` pipeline. We verify it ran cleanly in Task 6.

- [ ] **Step 1: Create the module**

Create `src/lib/fonts.ts`:

```ts
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

/**
 * Display + body face. Attach `plusJakartaSans.variable` to `<html>` className
 * so `--font-plus-jakarta` resolves site-wide (consumed by `--font-display`).
 */
export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

/**
 * Mono face for captions, code, metadata. Normal-only on purpose — italic
 * mono would only matter inside code blocks, and we don't render italic
 * inside them anywhere. Add `style: ["normal", "italic"]` if that changes.
 */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-jetbrains",
});
```

Note: `weight: "variable"` ships a single woff2 covering the whole weight axis instead of separate static files — roughly half the font payload.

- [ ] **Step 2: Verify type check passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/fonts.ts
git commit -m "feat: add next/font module for Plus Jakarta Sans + JetBrains Mono"
```

---

## Task 2: Wire fonts into root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update layout.tsx to attach font variables**

Replace the contents of `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { plusJakartaSans, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roman Nguyen — Portfolio",
  description: "Tokyo-born aesthetic. Saigon-built work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify type check passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Verify lint passes**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: attach font CSS variables to <html>"
```

---

## Task 3: Rewrite globals.css with @theme + base layer

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace globals.css with the full token set**

Replace the entire contents of `src/app/globals.css` with:

```css
@import "tailwindcss";

@theme {
  /* Brand colors (design-note §2) */
  --color-bg: #0a0a0a;
  --color-bg-alt: #141414;
  --color-fg: #f5f1ea;
  --color-fg-muted: #8a8680;
  --color-fg-dim: #4a4742;
  --color-accent: #d4a574;
  --color-accent-2: #5c6b5e;

  /* Fonts */
  --font-display: var(--font-plus-jakarta), system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;

  /* Type scale (design-note §3) */
  --text-display: clamp(4rem, 9vw, 9rem);
  --text-display--line-height: 0.95;
  --text-display--letter-spacing: -0.02em;

  --text-h1: clamp(3rem, 6vw, 6rem);
  --text-h1--line-height: 1;
  --text-h1--letter-spacing: -0.02em;

  --text-h2: clamp(2rem, 4vw, 3.5rem);
  --text-h2--line-height: 1.05;
  --text-h2--letter-spacing: -0.01em;

  --text-h3: 1.5rem;
  --text-h3--line-height: 1.2;
  --text-h3--letter-spacing: -0.01em;

  --text-body-lg: 1.25rem;
  --text-body-lg--line-height: 1.6;

  --text-body: 1rem;
  --text-body--line-height: 1.6;

  --text-caption: 0.75rem;
  --text-caption--line-height: 1.4;
  --text-caption--letter-spacing: 0.1em;

  /* Spacing — section rhythm (design-note §4) */
  --spacing-section-x: clamp(2rem, 6vw, 8rem);
  --spacing-section-y: clamp(6rem, 12vw, 10rem);

  /* Motion (design-note §7) */
  --ease-out-expo: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-linear: linear;

  --duration-fast: 300ms;
  --duration-base: 600ms;
  --duration-slow: 1000ms;
  --duration-xslow: 1400ms;
}

@layer base {
  html {
    color-scheme: dark;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  body {
    background: var(--color-bg);
    color: var(--color-fg);
    font-family: var(--font-display);
    font-size: var(--text-body);
    line-height: var(--text-body--line-height);
  }

  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

- [ ] **Step 2: Verify build still works**

Run: `npm run build`
Expected: build succeeds without CSS parse errors. If Tailwind complains about `--text-*--line-height` subtokens, see the fallback in Task 3a below.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add brand color, type, spacing, motion tokens via Tailwind @theme"
```

---

## Task 3a: Subtoken fallback (only if Task 3 Step 2 failed)

**Skip this task entirely if Task 3 built cleanly.**

If `npm run build` reported that Tailwind v4 doesn't apply `--text-*--line-height` / `--text-*--letter-spacing` subtokens to the `text-*` utilities, fall back to a component layer that hand-rolls the rules.

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Append component classes**

After the closing `}` of `@layer base`, add:

```css
@layer components {
  .text-display {
    font-size: var(--text-display);
    line-height: 0.95;
    letter-spacing: -0.02em;
  }
  .text-h1 {
    font-size: var(--text-h1);
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .text-h2 {
    font-size: var(--text-h2);
    line-height: 1.05;
    letter-spacing: -0.01em;
  }
  .text-h3 {
    font-size: var(--text-h3);
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
  .text-body-lg {
    font-size: var(--text-body-lg);
    line-height: 1.6;
  }
  .text-body {
    font-size: var(--text-body);
    line-height: 1.6;
  }
  .text-caption {
    font-size: var(--text-caption);
    line-height: 1.4;
    letter-spacing: 0.1em;
  }
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "fix: hand-roll text-* component classes for Tailwind v4 subtoken gap"
```

---

## Task 4: Easing previews client component

**Files:**
- Create: `src/app/specimen/easing-previews.tsx`

This is a small client component used inside `/specimen`. It exists in its own file so the parent specimen page can stay a server component.

- [ ] **Step 1: Create the component**

Create `src/app/specimen/easing-previews.tsx`:

```tsx
"use client";

import { useState } from "react";

const EASINGS = [
  { name: "ease-out-expo", value: "var(--ease-out-expo)" },
  { name: "ease-in-out", value: "var(--ease-in-out)" },
  { name: "ease-linear", value: "var(--ease-linear)" },
] as const;

export function EasingPreviews() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {EASINGS.map(({ name, value }) => {
        const isActive = hovered === name;
        return (
          <button
            key={name}
            type="button"
            onMouseEnter={() => setHovered(name)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(name)}
            onBlur={() => setHovered(null)}
            className="relative h-12 w-full max-w-md overflow-hidden rounded border border-[var(--color-fg-dim)] text-left"
            aria-label={`Preview ${name}`}
          >
            <span
              className="absolute top-1/2 left-2 block h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--color-accent)]"
              style={{
                transform: `translate(${isActive ? "calc(100% * 14)" : "0"}, -50%)`,
                transitionProperty: "transform",
                transitionDuration: "var(--duration-base)",
                transitionTimingFunction: value,
              }}
            />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 font-[var(--font-mono)] text-[var(--text-caption)] text-[var(--color-fg-muted)] uppercase">
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify type check passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/specimen/easing-previews.tsx
git commit -m "feat: easing previews client component for specimen route"
```

---

## Task 5: Specimen page

**Files:**
- Create: `src/app/specimen/page.tsx`

Server component (no `"use client"`). Renders six sections per spec §`/specimen route`.

- [ ] **Step 1: Create the page**

Create `src/app/specimen/page.tsx`:

```tsx
import type { Metadata } from "next";
import { EasingPreviews } from "./easing-previews";

export const metadata: Metadata = {
  title: "Specimen — Design Tokens",
  robots: { index: false, follow: false },
};

const COLORS = [
  { name: "bg", value: "#0A0A0A" },
  { name: "bg-alt", value: "#141414" },
  { name: "fg", value: "#F5F1EA" },
  { name: "fg-muted", value: "#8A8680" },
  { name: "fg-dim", value: "#4A4742" },
  { name: "accent", value: "#D4A574" },
  { name: "accent-2", value: "#5C6B5E" },
] as const;

const TYPE_SCALE = [
  { token: "text-display", className: "text-[length:var(--text-display)] leading-[0.95] tracking-[-0.02em]" },
  { token: "text-h1", className: "text-[length:var(--text-h1)] leading-[1] tracking-[-0.02em]" },
  { token: "text-h2", className: "text-[length:var(--text-h2)] leading-[1.05] tracking-[-0.01em]" },
  { token: "text-h3", className: "text-[length:var(--text-h3)] leading-[1.2] tracking-[-0.01em]" },
  { token: "text-body-lg", className: "text-[length:var(--text-body-lg)] leading-[1.6]" },
  { token: "text-body", className: "text-[length:var(--text-body)] leading-[1.6]" },
  { token: "text-caption", className: "text-[length:var(--text-caption)] leading-[1.4] tracking-[0.1em] uppercase" },
] as const;

const BILINGUAL_SAMPLE = "Tokyo-born — Đến từ Tokyo. Creative studio, hội tụ không giới hạn.";

export default function SpecimenPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-(--spacing-section-x) py-(--spacing-section-y) space-y-24">
      <header className="space-y-2">
        <p className="text-[length:var(--text-caption)] tracking-[0.1em] uppercase text-[var(--color-fg-muted)]">
          /specimen
        </p>
        <h1 className="text-[length:var(--text-h1)] leading-[1] tracking-[-0.02em]">
          Design tokens
        </h1>
        <p className="text-[length:var(--text-body-lg)] text-[var(--color-fg-muted)] max-w-prose">
          Visual proof for the brand palette, type scale, spacing rhythm, and motion easings.
          Not linked from the site. Bilingual sample confirms the Vietnamese subset loads.
        </p>
      </header>

      <section aria-labelledby="colors-heading" className="space-y-6">
        <h2 id="colors-heading" className="text-[length:var(--text-h2)] leading-[1.05] tracking-[-0.01em]">
          Colors
        </h2>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
          {COLORS.map((c) => (
            <li key={c.name} className="space-y-2">
              <div
                className="h-24 w-full rounded border border-[var(--color-fg-dim)]"
                style={{ background: c.value }}
              />
              <div className="font-[var(--font-mono)] text-[length:var(--text-caption)] uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
                color-{c.name}
              </div>
              <div className="font-[var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-fg)]">
                {c.value}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="type-heading" className="space-y-8">
        <h2 id="type-heading" className="text-[length:var(--text-h2)] leading-[1.05] tracking-[-0.01em]">
          Type scale
        </h2>
        <ul className="space-y-6">
          {TYPE_SCALE.map((t) => (
            <li key={t.token} className="space-y-1">
              <div className="font-[var(--font-mono)] text-[length:var(--text-caption)] uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
                {t.token}
              </div>
              <p className={t.className}>{BILINGUAL_SAMPLE}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="italic-heading" className="space-y-4">
        <h2 id="italic-heading" className="text-[length:var(--text-h2)] leading-[1.05] tracking-[-0.01em]">
          Italic + roman
        </h2>
        <p className="text-[length:var(--text-h3)] leading-[1.2]">
          Tokyo-born, <em className="italic">Creative studio</em>. Đến từ Tokyo,{" "}
          <em className="italic">hội tụ không giới hạn</em>.
        </p>
      </section>

      <section aria-labelledby="spacing-heading" className="space-y-4">
        <h2 id="spacing-heading" className="text-[length:var(--text-h2)] leading-[1.05] tracking-[-0.01em]">
          Spacing
        </h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="font-[var(--font-mono)] text-[length:var(--text-caption)] uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
              spacing-section-x
            </div>
            <div className="h-6 bg-[var(--color-accent)]" style={{ width: "var(--spacing-section-x)" }} />
          </div>
          <div className="space-y-1">
            <div className="font-[var(--font-mono)] text-[length:var(--text-caption)] uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
              spacing-section-y
            </div>
            <div className="w-6 bg-[var(--color-accent-2)]" style={{ height: "var(--spacing-section-y)" }} />
          </div>
        </div>
      </section>

      <section aria-labelledby="motion-heading" className="space-y-4">
        <h2 id="motion-heading" className="text-[length:var(--text-h2)] leading-[1.05] tracking-[-0.01em]">
          Motion
        </h2>
        <p className="text-[length:var(--text-body)] text-[var(--color-fg-muted)]">
          Hover or focus each row to play the easing at duration-base (600ms).
          Under prefers-reduced-motion the dot should snap.
        </p>
        <EasingPreviews />
      </section>

      <section aria-labelledby="mono-heading" className="space-y-4">
        <h2 id="mono-heading" className="text-[length:var(--text-h2)] leading-[1.05] tracking-[-0.01em]">
          Mono
        </h2>
        <pre className="bg-[var(--color-bg-alt)] rounded p-4 font-[var(--font-mono)] text-[length:var(--text-body)] text-[var(--color-fg)] overflow-x-auto">
{`// Tagline cycle — chu kỳ khẩu hiệu
const phrases = [
  "Creative studio, Đến từ Tokyo",
  "Tokyo-born, Creative studio",
  "Hội tụ, Không giới hạn",
];`}
        </pre>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify type check + lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 3: Verify build succeeds**

Run: `npm run build`
Expected: succeeds; `/specimen` appears in the route summary.

- [ ] **Step 4: Commit**

```bash
git add src/app/specimen/page.tsx
git commit -m "feat: /specimen route renders every design token for verification"
```

---

## Task 6: Browser verification

This is the real proof per spec §Acceptance criteria. Tokens are CSS — only browser inspection confirms they're right.

**Files:** none

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server up at `http://localhost:3000`.

- [ ] **Step 2: Open /specimen at desktop width and check console**

Open `http://localhost:3000/specimen` at 1440px viewport. Open DevTools console.
Expected: page renders all six sections, zero console errors, zero hydration warnings.

- [ ] **Step 3: Confirm computed body colors**

In DevTools console at `/specimen`, run:
```js
const cs = getComputedStyle(document.body);
console.log(cs.backgroundColor, cs.color);
```
Expected: `rgb(10, 10, 10) rgb(245, 241, 234)` (the `#0A0A0A` / `#F5F1EA` tokens).

- [ ] **Step 4: Confirm Vietnamese diacritics render**

Visually inspect the bilingual sample lines and the mono code block. Every diacritic in "Đến từ", "hội tụ", "không giới hạn", "khẩu hiệu", "Không" should render as the correct glyph. No tofu boxes (□).

- [ ] **Step 5: Confirm italic is visibly distinct**

In the "Italic + roman" section, "Creative studio" and "hội tụ không giới hạn" should be visibly slanted compared to surrounding roman text.

- [ ] **Step 6: Confirm easing previews animate then snap under reduce-motion**

Hover each easing row — dot should translate across the bar over ~600ms with three visibly different curves.

Then in DevTools: cmd-shift-P → "Show Rendering" → set "Emulate CSS media feature prefers-reduced-motion" to `reduce`. Reload `/specimen`. Hover the easing rows again — dot should snap to the right edge with no perceptible animation.

Reset the emulation back to "no preference" when done.

- [ ] **Step 7: Capture Playwright screenshots at three breakpoints**

With the dev server still running, use the Playwright MCP tools to navigate to `/specimen` at 1440×900, 768×1024, and 375×812. Take a full-page screenshot at each width and save to `references/screenshots/specimen-1440.png`, `specimen-768.png`, `specimen-375.png`.

Expected: no horizontal overflow at 375px; sections stack cleanly; type clamps scale down.

- [ ] **Step 8: Visual diff against hero reference**

Open `references/screenshots/hero-frame-01.png` next to `specimen-1440.png`. The palette mood (deep near-black bg, warm off-white fg, amber accent) and the type weight should feel like they belong to the same family. This is a vibe check, not pixel comparison.

If anything feels wrong (palette off, type too small/large, italic looks generic), flag it before the final commit — fix is cheaper now than after step 3.

- [ ] **Step 9: Stop dev server, run the full check**

Stop `npm run dev`. Run: `npm run lint && npm run typecheck && npm run test && npm run build`
Expected: all four pass.

- [ ] **Step 10: Commit the screenshots**

```bash
git add references/screenshots/specimen-1440.png references/screenshots/specimen-768.png references/screenshots/specimen-375.png
git commit -m "chore: capture specimen screenshots at 1440/768/375"
```

---

## Task 7: Tick step 2 in CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Mark step 2 complete**

In `CLAUDE.md` §5, change:

```markdown
- [ ] **2. Design tokens & typography** — palette (deep green/black + oil-slick accents), type scale, spacing scale, fonts (display + body), global CSS reset
```

to:

```markdown
- [x] **2. Design tokens & typography** — palette (deep green/black + oil-slick accents), type scale, spacing scale, fonts (display + body), global CSS reset
```

- [ ] **Step 2: Commit and push**

```bash
git add CLAUDE.md
git commit -m "docs: mark step 2 (design tokens & typography) complete"
git push origin main
```

---

## Acceptance recap (mirrors spec)

- [x] `/specimen` renders without console errors at 375, 768, 1440 widths.
- [x] Computed `body` background = `rgb(10, 10, 10)`, color = `rgb(245, 241, 234)`.
- [x] Vietnamese diacritics render correctly across `Đ`, `ế`, `ừ`, `ộ`, `ụ`, `ô`, `ớ`, `ạ`, `ẩ`, `ô`.
- [x] Italic visibly distinct from roman.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` all green.
- [x] Reduced-motion snaps the easing previews instantly.
- [x] Step 2 ticked in CLAUDE.md; commits pushed to `origin/main`.
