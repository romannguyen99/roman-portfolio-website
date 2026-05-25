# Hero — Design Spec

**Status:** Approved pending spec review. Step 3 of the build order.

---

## What it is

The first 100vh section of the single-page home. An oil-on-water amber/green
gradient orb drifting against near-black, with an oversized headline that
enters after the page loader finishes, and a slowly rotating "SCROLL DOWN"
badge bottom-left.

Scope is deliberately bounded: **SVG gradient (design-note Option B), entrance
+ ambient drift only.** The WebGL shader upgrade (Option A) and the
scroll-linked orb growth are explicitly **out of scope** for this step.

---

## Files / boundaries

| File | Responsibility |
|---|---|
| `src/components/hero.tsx` (`"use client"`) | Composes the section; wires entrance orchestration to the orb, headline, and badge. |
| `src/components/gradient-orb.tsx` | The SVG Option-B background. Isolated so the future shader is a one-file swap. |
| `src/components/scroll-badge.tsx` | The rotating "SCROLL DOWN" badge; self-contained. |
| `src/hooks/use-hero-entrance.ts` | Returns whether/when the entrance should start. The testable core. |
| `src/app/page.tsx` | Replace the current scaffold with `<Hero />`. |

---

## Gradient orb (SVG, Option B)

- A full-bleed `<svg>`, absolutely positioned (`inset-0`) behind the hero
  content. The hero section is `overflow-hidden` so the orb is clipped.
- **Gradient:** a `<radialGradient>` with amber `#d4a574` → transparent
  centered toward the right, layered with a second `<radialGradient>` green
  `#5c6b5e` → transparent centered toward the left, over the near-black
  `--color-bg` field. Painted onto an ellipse roughly centered, biased
  slightly right (matches reference frame-01 composition).
- **Organic distortion:** an SVG filter using
  `feTurbulence type="fractalNoise"` feeding a `feDisplacementMap` warps the
  gradient into the oil-on-water look. A `feGaussianBlur` softens the edge
  into the frame-01 glow.
- **Drift:** continuous, *extremely slow* (the viewer should feel it more than
  see it). Animate the displacement scale and/or turbulence `baseFrequency`
  plus a gentle group translate/scale, `ease-linear`, ~20s loop. Driven by
  SMIL `<animate>` or Framer Motion — implementer's choice; SMIL is simplest
  for the filter primitives.
- **Reduced motion:** `prefers-reduced-motion: reduce` → freeze to a static
  frame (no drift animation).

Color tokens come from `globals.css` (`--color-accent`, `--color-accent-2`,
`--color-bg`). Do not introduce new colors.

---

## Headline

- **Text:** `Roman Nguyen` — Title Case, no italic accent, no diacritic.
- **Type:** General Sans (`var(--font-sans)`), size `--text-display`
  (`clamp(4rem, 9vw, 9rem)`), weight 500, `letter-spacing: -0.02em`,
  `line-height: ~1.0`, color `--color-fg`.
- **Position:** centered vertically, slightly left of center horizontally.
- **Entrance:** split by word (`Roman`, `Nguyen`). Each word animates
  `opacity 0 → 1`, `y: 24px → 0`, `duration 1200ms`, ease-out-expo
  (`[0.22, 1, 0.36, 1]`), with an **80ms stagger** between words.
- **Reduced motion:** show the headline immediately, no stagger or slide.

---

## Entrance trigger contract

No changes to the page loader. The hero consumes the existing
`loader:complete` event and the shared `sessionStorage['loader-seen']` key.

On mount (`use-hero-entrance`):

1. If `sessionStorage.getItem('loader-seen')` is already set — a returning
   visitor whose loader is skipping — start the entrance **immediately**.
2. Otherwise, attach a `window` listener for `loader:complete` and start the
   entrance when it fires.

In both cases, the headline entrance begins **600ms** after that signal. This
deterministically avoids the race where the skip-path `loader:complete` could
fire before the hero's listener attaches.

---

## Scroll badge

- Bottom-left, circular badge ~90px. "SCROLL DOWN" set on a circular SVG
  `textPath`, rotating one full turn every ~20s (`ease-linear`, continuous).
  Small down-arrow centered.
- **Fades in last**, at **1800ms** (measured from the same entrance signal as
  the headline): `opacity 0 → 1`.
- It is a labeled `<button>` ("Scroll down"). Clicking scrolls down one
  viewport via the global Lenis instance. (Will target `#work` once that
  section exists in a later step.)
- **Reduced motion:** no rotation; still visible and clickable.

---

## Page integration

`src/app/page.tsx` renders `<Hero />` as the top section inside `<main>`,
replacing the scaffold placeholder. The hero is `min-h-screen`, `relative`,
`overflow-hidden`. No section `id` (the home anchors `#work`/`#thoughts`/
`#about`/`#contact` belong to later sections; the hero is the page top).

---

## Testing (TDD)

Unit-test the logic; verify visuals in-browser (as was done for the loader).

`use-hero-entrance`:
- Starts the entrance when `loader:complete` fires (with the 600ms delay).
- Starts immediately when `loader-seen` is already set on mount (still +600ms).
- Does not start before the signal.

Components:
- Hero renders both headline words (`Roman`, `Nguyen`).
- Scroll badge renders with its accessible label ("Scroll down") and invokes a
  scroll on click.

Visual fidelity (orb gradient, drift, glow, rotation) is confirmed by driving
the running app in a browser, not by unit tests.

---

## Out of scope (later steps)

- WebGL shader orb (design-note Option A) — replaces `gradient-orb.tsx` only.
- Scroll-linked orb growth (frame 01 → frame 03).
- Header / navigation (step 4).
- Custom cursor (step 12).
