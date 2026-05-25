# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Next.js Version

This project runs **Next.js 16.2.6**, which may have breaking changes from your training data. Before writing any Next.js-specific code (routing, server components, metadata, caching), read the relevant guide in `node_modules/next/dist/docs/`. Heed any deprecation notices.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
```

No test suite is configured yet.

## What This Site Is

Roman Nguyen's personal portfolio — data science side projects and blog posts, styled after the monopo.vn creative studio aesthetic. 

**Page structure:**
- `/` — Single-page home with four scroll-anchored sections: **Work**, **Thoughts**, **About**, **Contact**. Nav links are in-page anchors, not routes.
- `/work/[slug]` — Individual project case study page
- `/thoughts/[slug]` — Individual blog post page

## Tech Stack

| Concern | Library |
|---|---|
| Framework | Next.js 16 App Router + TypeScript |
| Styling | Tailwind CSS v4 (`@theme inline` in `globals.css` — no `tailwind.config.js`) |
| UI animation | Framer Motion 12 |
| Scroll animation | GSAP 3 + ScrollTrigger |
| Smooth scroll | Lenis 1.3 (lerp 0.08, initialized in `src/components/lenis-provider.tsx`) |
| Fonts | General Sans via Fontshare CDN (in `globals.css`), JetBrains Mono via `next/font/google` |

**Tailwind v4 note:** All custom tokens live in the `@theme inline` block in `src/app/globals.css`. There is no separate config file. Add new tokens there, not in `tailwind.config.js`.

**Fonts note:** General Sans cannot be loaded via `next/font` (it's on Fontshare, not Google). It is imported with a plain CSS `@import url(...)` at the top of `globals.css`. JetBrains Mono is loaded via `next/font/google` in `layout.tsx` and exposed as `--font-jetbrains-mono`.

## Design System

The full design specification lives in `references/design-note.mb`. Read it before touching any visual code. The screenshots in `references/screenshots/` are the visual reference. Key decisions locked in:

**Color tokens** (defined in `globals.css`):
```
--color-bg        #0a0a0a   page background
--color-bg-alt    #141414   secondary surface
--color-fg        #f5f1ea   warm off-white, primary text
--color-fg-muted  #8a8680   captions, nav links, secondary
--color-fg-dim    #4a4742   dividers, disabled
--color-accent    #d4a574   amber/gold — hero gradient, hover fills
--color-accent-2  #5c6b5e   desaturated green — secondary gradient tone
```

**Motion tokens** (defined in `globals.css`):
```
--ease-out-expo   cubic-bezier(0.22, 1, 0.36, 1)   default for all transitions
--ease-in-out     cubic-bezier(0.65, 0, 0.35, 1)   state changes
--duration-fast   300ms    button hovers, tooltips
--duration-base   600ms    most transitions
--duration-slow   1000ms   section reveals, hero entrance
--duration-xslow  1400ms   loader, page transitions
```

**Type scale** (also in `globals.css`):
- `--text-display`: `clamp(4rem, 9vw, 9rem)` — hero headline
- `--text-h1` through `--text-caption` — see `globals.css`

## Architecture Patterns

- **Lenis:** Initialized once in `<LenisProvider>` (client component) which wraps the entire app in `layout.tsx`. Any component that needs to pause or restart smooth scroll should interact with the global Lenis instance.
- **Scroll animations:** Use GSAP ScrollTrigger for scroll-linked reveals (not Framer Motion's `whileInView`) to stay consistent with the Lenis integration. Framer Motion handles load-time and hover animations.
- **`"use client"` boundary:** Keep as high as necessary. Server components are preferred for static sections; client components only where animation, state, or browser APIs are needed.
- **Section IDs:** Home page sections must have IDs matching nav anchors: `#work`, `#thoughts`, `#about`, `#contact`.

## Build Order

Follow this sequence — do not skip ahead:

1. ✅ Global tokens + fonts + Lenis (done)
2. ✅ Page loader. Full spec: `docs/superpowers/specs/2026-05-25-page-loader-design.md`
3. ✅ Hero (SVG gradient — design-note Option B). Spec: `docs/superpowers/specs/2026-05-25-hero-design.md`. WebGL shader + scroll-grow deferred.
4. Navigation (fixed, transparent over hero)
5. Work grid section (placeholder content)
6. Thoughts/blog section (placeholder content)
7. About section
8. Contact section
9. `/work/[slug]` case study page template
10. `/thoughts/[slug]` blog post page template
11. Page transitions between routes
12. Custom cursor
13. Mobile responsive pass

## Page Loader — Approved Spec Summary

Full spec in `docs/superpowers/specs/2026-05-25-page-loader-design.md`. Key decisions:

- **Text:** `HOLD UP ...` — General Sans, 11px, `letter-spacing: 0.22em`, `text-transform: uppercase`
- **Progress bar:** 200px × 1px, track `#2a2a2a`, fill `--color-fg`, below text with 20px gap
- **Timer:** Fixed 1500ms fill — not tied to real load events
- **Session:** Show once per session via `sessionStorage.getItem('loader-seen')`. If already set, skip and fire `loader:complete` immediately.
- **Timing:** fade-in 200ms → bar fills 1500ms → fade-out 400ms → fire `loader:complete` event → unmount
- **File:** `src/components/page-loader.tsx` (`"use client"`, Framer Motion for animations)
- **Placement in layout.tsx:** `<PageLoader />` rendered above `<LenisProvider>` as a sibling
- **Contract:** fires `new CustomEvent('loader:complete')` on `window` when done. Hero (step 3) listens for this event to start its entrance animation.

## Hero — Implemented Summary

Full spec in `docs/superpowers/specs/2026-05-25-hero-design.md`; plan in `docs/superpowers/plans/2026-05-25-hero.md`. As built:

- **Headline:** `Roman Nguyen` — General Sans, `--text-display`, weight 500, split into two words that fade/slide up (opacity 0→1, y 24→0, 1200ms, ease-out-expo, 80ms stagger). `aria-label` on the `<h1>` gives a clean accessible name.
- **Entrance trigger:** `useHeroEntrance()` (`src/hooks/use-hero-entrance.ts`) flips true on the loader's `loader:complete` event, or immediately if `loader-seen` is already set (returning visitor). Headline begins +600ms, scroll badge +1800ms after that signal.
- **Background:** `src/components/gradient-orb.tsx` — SVG Option B (two radial gradients via `--color-accent` / `--color-accent-2`, warped by `feTurbulence`/`feDisplacementMap`, blurred; slow SMIL drift; frozen under `prefers-reduced-motion`). Isolated so the future WebGL shader is a one-file swap.
- **Scroll badge:** `src/components/scroll-badge.tsx` — bottom-left rotating "SCROLL DOWN" ring + arrow; click calls `scrollToNext()`.
- **Lenis access:** the global instance is registered in `src/lib/lenis.ts` (`getLenis`/`setLenis`/`scrollToNext`) by `<LenisProvider>`. Use this to drive programmatic scroll.
- **Shared constants:** `LOADER_SEEN_KEY` in `src/lib/session-keys.ts`; `EASE_OUT_EXPO` in `src/lib/motion.ts` — import these, don't redeclare.
- **Composition:** `src/components/hero.tsx` renders the orb, headline, and badge; `src/app/page.tsx` renders `<Hero />` (no section `id` — it's the page top).

## Anti-Patterns

Per `references/design-note.mb` — never do these:
- Bright colors outside the amber/green palette
- Animations under 300ms for non-trivial elements
- Bouncy easing (spring with high stiffness, `easeInOutBack`)
- Uniform grid layouts for the Work section
- Drop shadows on text
- Light-mode toggle
- Full-screen hamburger menu on mobile
