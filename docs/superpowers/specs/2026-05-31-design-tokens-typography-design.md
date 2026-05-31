# Step 2 — Design Tokens & Typography

**Status:** draft, awaiting user review
**Date:** 2026-05-31
**Build-order step:** 2 of 10 (CLAUDE.md §5)

## Goal

Establish the visual foundation the rest of the site builds on: color palette, type scale, fonts, spacing rhythm, motion tokens, and a global CSS reset. Land everything as Tailwind v4 `@theme` tokens so utilities (`text-display`, `bg-bg-alt`, `ease-(--ease-out-expo)`) compose naturally in later steps. Verify by rendering a dev-only `/specimen` page and screenshotting it against the reference frames.

## Non-goals

- Hero shader (step 3) — orb-specific deep colors stay private to the shader.
- Layout primitives (containers, grids) — only the spacing tokens that feed them.
- Page loader, custom cursor, scroll badge — later steps.
- i18n routing — Vietnamese diacritics are presentational only.

## Decisions

1. **Primary typeface:** Plus Jakarta Sans via `next/font/google` (not General Sans). Closest Google-hosted option with a true italic and Vietnamese subset. No self-hosted files; loses the stylistic-alternate italic that's a monopo signature — acceptable trade-off for zero font-loading complexity.
2. **Mono typeface:** JetBrains Mono via `next/font/google`.
3. **Token scope:** brand palette only in `@theme` (bg/bg-alt/fg/fg-muted/fg-dim/accent/accent-2). Orb-specific deep palette (`#1a2e20`, `#c49020`, etc.) stays inside the shader in step 3.
4. **Verification artifact:** dev-only `/specimen` route that renders every token. Kept through later steps, removed at step 10.

## Files

```
src/app/globals.css                  rewrite: full @theme block + base layer
src/app/layout.tsx                   add font variables to <html> className
src/app/specimen/page.tsx            NEW: token specimen route
src/lib/fonts.ts                     NEW: next/font instances
src/lib/fonts.test.ts                NEW: smoke test
```

## Tokens

### Colors (brand palette, exact from design-note §2)

```
--color-bg:        #0A0A0A
--color-bg-alt:    #141414
--color-fg:        #F5F1EA
--color-fg-muted:  #8A8680
--color-fg-dim:    #4A4742
--color-accent:    #D4A574
--color-accent-2:  #5C6B5E
```

### Fonts

```
--font-display: var(--font-plus-jakarta), system-ui, sans-serif
--font-mono:    var(--font-jetbrains), ui-monospace, monospace
```

`--font-plus-jakarta` and `--font-jetbrains` are produced by `next/font/google` in `src/lib/fonts.ts` and attached to `<html className={...}>` in `layout.tsx`. Weights loaded: Plus Jakarta Sans 400/500/600 + matching italics; JetBrains Mono 400/500. Vietnamese subset on Plus Jakarta.

### Type scale

Tailwind v4 lets `@theme` carry per-token `--text-*--line-height` and `--text-*--letter-spacing`, so `text-display` automatically applies leading and tracking. Translate design-note §3 directly:

```
--text-display:                 clamp(4rem, 9vw, 9rem)
--text-display--line-height:    0.95
--text-display--letter-spacing: -0.02em

--text-h1:                      clamp(3rem, 6vw, 6rem)
--text-h1--line-height:         1.0
--text-h1--letter-spacing:      -0.02em

--text-h2:                      clamp(2rem, 4vw, 3.5rem)
--text-h2--line-height:         1.05
--text-h2--letter-spacing:      -0.01em

--text-h3:                      1.5rem
--text-h3--line-height:         1.2
--text-h3--letter-spacing:      -0.01em

--text-body-lg:                 1.25rem
--text-body-lg--line-height:    1.6

--text-body:                    1rem
--text-body--line-height:       1.6

--text-caption:                 0.75rem
--text-caption--line-height:    1.4
--text-caption--letter-spacing: 0.1em
```

Caption is intended to be rendered uppercase (`uppercase` utility on the consuming element); the token itself doesn't force case.

### Spacing

Keep Tailwind defaults. Add two semantic tokens for section rhythm:

```
--spacing-section-x: clamp(2rem, 6vw, 8rem)
--spacing-section-y: clamp(6rem, 12vw, 10rem)
```

Consumed as `px-(--spacing-section-x)` / `py-(--spacing-section-y)`.

### Motion

In `@theme` so Tailwind utilities can reference them:

```
--ease-out-expo: cubic-bezier(0.22, 1, 0.36, 1)
--ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1)
--ease-linear:   linear

--duration-fast:  300ms
--duration-base:  600ms
--duration-slow:  1000ms
--duration-xslow: 1400ms
```

GSAP (later steps) can read the durations via `getComputedStyle(document.documentElement).getPropertyValue('--duration-base')` if it needs to stay in sync with CSS.

## Base layer (`@layer base`)

Minimal additions on top of Tailwind v4 preflight:

```css
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
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

The reduced-motion block is global so every later animation inherits it without extra wiring.

## `/specimen` route

`src/app/specimen/page.tsx` — server component, no client JS needed except for the easing previews (small inline client component). Sections, in order:

1. **Color swatches** — each brand token as a chip with the swatch, token name, and hex.
2. **Type ladder** — `display → caption` rendered with a bilingual sample: `"Tokyo-born — Đến từ Tokyo. Creative studio, hội tụ không giới hạn."` Confirms Vietnamese diacritics render (no tofu) and the type scale reads correctly.
3. **Italic + roman mix** — `"Tokyo-born, *Creative studio*"` to confirm italic loads and looks distinct.
4. **Spacing scale** — visual stripes labeled with `section-x` / `section-y` actual computed widths.
5. **Easing previews** — four boxes that translate-x on hover, each with a different easing. The reduced-motion block above means these snap instantly under reduce-motion.
6. **Mono sample** — short JetBrains Mono code block with English + Vietnamese to confirm the mono font + subset.

Not linked from `/`. Removed (or excluded from production) at step 10.

## Testing

- **No Vitest tests for token values.** Asserting `getComputedStyle` returns a hex you literally just wrote is a tautology.
- **One smoke test:** `src/lib/fonts.test.ts` asserts each exported font has a `.variable` string. Catches a broken next/font import.
- **Browser verification (the real check):**
  1. `npm run dev`, navigate to `http://localhost:3000/specimen`.
  2. Playwright screenshots at 1440, 768, 375.
  3. Visual compare against `references/screenshots/hero-frame-01.png` for palette/type vibe (mood, not pixels).
  4. Toggle macOS reduce-motion; reload `/specimen`; confirm easing previews snap instantly.

## Acceptance criteria

- `/specimen` renders without console errors at 375, 768, 1440 widths.
- Computed `body` background = `#0A0A0A`, color = `#F5F1EA`.
- Vietnamese sample renders all diacritics (no tofu glyphs).
- Italic sample is visibly distinct from roman.
- `npm run lint && npm run typecheck && npm run test && npm run build` all green.
- Reduced-motion: easing previews snap instantly when `prefers-reduced-motion: reduce` is set.

## Risks & open questions

- **Plus Jakarta Sans italic personality.** It's a clean true italic, not stylistic-alternate like General Sans. The bilingual tagline in step 4 will look less "monopo" — acceptable per user decision, but worth flagging visually at `/specimen` so we can revisit before step 4.
- **Tailwind v4 `text-*` with custom subtokens.** Confirm `text-display` utility actually applies the per-token line-height/letter-spacing in v4. If it doesn't, fall back to a small `.text-display { font-size: var(--text-display); line-height: var(--text-display--line-height); letter-spacing: var(--text-display--letter-spacing); }` set in `@layer components`.

## Out of scope for this step

- Layout containers, grids, navigation chrome.
- Loader (step ~3/4).
- Reduced-motion JS hook (`useReducedMotion`) — added when the first JS-driven animation lands.
- Any orb-related color or shader work.
