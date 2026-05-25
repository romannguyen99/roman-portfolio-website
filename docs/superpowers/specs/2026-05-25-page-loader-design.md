# Page Loader — Design Spec

**Status:** Approved. Ready to implement.

---

## What it is

A full-screen overlay that plays once per browser session before the hero appears. It's a pacing device — tells the visitor to slow down — not a progress indicator.

---

## Visual

- Background: `#0a0a0a` (full viewport, `position: fixed`, `z-index: 9999`)
- Center: text `HOLD UP ...` — General Sans, 11px, `font-weight: 400`, `letter-spacing: 0.22em`, `text-transform: uppercase`, color `--color-fg`
- Below text (gap: 20px): a 200px × 1px progress bar track (`#2a2a2a`), fill color `--color-fg`

---

## Animation sequence

| Time | What happens |
|---|---|
| 0ms | Mount. Check `sessionStorage.getItem('loader-seen')`. If set → skip entire sequence, fire `loader:complete` immediately, return null. |
| 0 → 200ms | Overlay fades in (opacity 0→1). "HOLD UP ..." fades up (opacity 0→1, y 8px→0). Ease: `--ease-out-expo`. |
| 200 → 1700ms | Bar fill width 0% → 100% over 1500ms. Ease: `--ease-out-expo`. |
| 1700 → 2100ms | Overlay fades out (opacity 1→0) over 400ms. Set `sessionStorage.setItem('loader-seen', '1')`. |
| 2100ms | Unmount overlay. Fire `new CustomEvent('loader:complete')` on `window`. |

---

## Implementation approach

Option A — self-contained client component. No context provider.

**File:** `src/components/page-loader.tsx`
- `"use client"`
- On mount: sessionStorage check (skip path fires event in `useEffect` with 0 delay)
- Framer Motion `motion.div` for the overlay fade
- Framer Motion `motion.div` for the bar fill (animate `width` from `"0%"` to `"100%"`)
- `onAnimationComplete` on the fade-out triggers the custom event and unmounts via state

**Wired in:** `src/app/layout.tsx` — rendered above `<LenisProvider>` as a sibling, not inside it.

```tsx
// layout.tsx render order
<html>
  <body>
    <PageLoader />
    <LenisProvider>{children}</LenisProvider>
  </body>
</html>
```

**Contract with hero (Step 3):**
```ts
window.addEventListener('loader:complete', startHeroEntrance)
```

---

## What NOT to do

- Do not tie bar progress to real network/asset events
- Do not show the loader on every page load — session-only
- Do not add a skip button
- Do not use a spinner — the bar is the only progress indicator
