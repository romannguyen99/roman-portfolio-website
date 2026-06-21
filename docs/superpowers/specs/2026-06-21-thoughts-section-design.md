# Thoughts Section ("Thoughts") — Design Spec

**Milestone 3** of the Roman Nguyen portfolio. Builds the "Thoughts" section directly below the
Works section. Direction-level requirements come from `CLAUDE.md` → *Roadmap §3 — Thoughts*; this
spec resolves the open creative + technical decisions and is validated by an interactive reference
prototype.

**Validated visual reference:** `docs/thoughts-reference.html` — a self-contained HTML/CSS prototype
of the section, signed off via desktop (1440, incl. hover) + mobile (390) screenshots. It is the
source of truth for the look the same way `docs/works-reference.html` is for Works. Port it into
Astro — do not redesign it.

---

## Goal

A quiet, editorial "Thoughts" section: a vertical list of essay/article entries as **title-led
rows** separated by thin dividers, over a **slow drifting blurred-orb** backdrop. On-brand with the
hero and Works (earth tones on near-black, restrained motion), reuses the shared scroll-reveal,
fully `prefers-reduced-motion`-safe, no horizontal overflow at any breakpoint.

## Locked decisions (from brainstorming)

1. **List layout = title-led simple rows.** Each row: large title → inline meta line
   (`Category · Date · Read-time`) → one-line excerpt → "Read article →" CTA, full-width, with thin
   low-opacity dividers between rows. (Chosen over asymmetric / numbered / meta-column variants.)
2. **Backdrop = drifting blurred orb.** One or two large, soft, low-opacity warm/olive radial glows
   that drift very slowly behind the list; frozen under reduced-motion. (Chosen over data-grid /
   both / none.)

## Out of scope (deliberate)

- **Real content & links.** Titles are the four brief-named posts; categories, dates, read-times,
  and excerpts are illustrative **placeholders** swapped in later. Each row's title is a
  **non-navigating `<h3>`** for now (articles don't exist yet); the "Read article" CTA is likewise
  visual-only. When posts exist, the title/row wraps in `<a href={post.href}>`.
- **Hero / Works changes** beyond the shared `reveal.js` refactor below.
- **Milestones 4–5** (About, Contact). Only the `reveal.js` idempotency refactor is done here.
- **Bilingual content.** English only.

---

## Architecture

Mirrors the Works pattern (`Works.astro` + `works/` submodule + tested `lib/works.js`).

```
src/components/Thoughts.astro              # section: backdrop orbs + grain + heading + intro + list
src/components/thoughts/ThoughtItem.astro  # one title-led row (data-reveal)
src/lib/thoughts.js                        # THOUGHTS data array + CATEGORIES key list
src/lib/thoughts.test.js                   # data-shape invariants (Vitest)
src/scripts/reveal.js                      # REFACTOR to idempotent (shared; already exists)
e2e/thoughts.spec.ts                       # render + CTA + overflow + reduced-motion / reveal
```

Plus edits:
- `src/pages/index.astro` — render `<Thoughts />` after `<Works />`.
- `src/styles/global.css` — add `#thoughts { scroll-margin-top: 24px; }`. The existing generic
  reveal CSS (`.js-reveal [data-reveal]`, `.revealed`, the reduced-motion override, and
  `[data-reveal]:not(.revealed) svg *` pause rule) is reused unchanged.

### `reveal.js` idempotency refactor (shared utility)

Today `initReveal()` is called once (by `Works.astro`) and creates a fresh `IntersectionObserver`
over **all** `[data-reveal]` elements. If `Thoughts.astro` also calls it, a second observer would
re-process the Works rows. Refactor `initReveal()` to be **idempotent** using module-level state so
each section can call it self-contained:

- Module-scoped singleton `IntersectionObserver` (created lazily on first non-reduced call) and a
  module-scoped `Set`/`WeakSet` of already-bound elements.
- `initReveal(selector='[data-reveal]')`:
  - Query elements; skip any already bound.
  - Reduced-motion or no `IntersectionObserver`: add `revealed` to the new (un-bound) elements
    immediately, mark them bound, return (do **not** add `js-reveal`).
  - Otherwise: add `js-reveal` to `<html>` once; ensure the singleton observer exists; observe each
    new element and mark it bound. On intersect: add `revealed`, `unobserve`.
- Behavior for the existing Works call is unchanged (still reveals on scroll, still graceful).

This is a targeted improvement to existing code, justified by Thoughts (and later About/Contact)
reusing the utility. The generic reveal CSS already keys off `[data-reveal]`, so no CSS change.

### Component boundaries

- **`thoughts.js`** — pure data. Exports `THOUGHTS`: array of `{ id, title, category, date, readTime,
  excerpt, href }`, and `CATEGORIES`: the list of category strings used. No DOM/Astro —
  unit-testable.
- **`ThoughtItem.astro`** — presentational; one `THOUGHTS` entry as props `{ thought, index }`.
  Renders the `<article class="t-item" data-reveal>` row with a non-navigating `<h3 class="t-title">`,
  meta line, excerpt, and visual-only CTA; sets the staggered `--reveal-delay` from `index`.
- **`Thoughts.astro`** — composition: backdrop orbs + grain, heading + intro, the list mapping
  `THOUGHTS` → `ThoughtItem`; a module `<script>` calling `initReveal()`.

---

## Visual / content spec (per the validated reference)

### Section frame
- **Background:** a calm vertical gradient `near-black → #0d0b07 → near-black`, distinct from Works,
  plus the same faint film-grain overlay (low opacity, `mix-blend-mode: overlay`).
- **Backdrop orbs:** two absolutely-positioned, `border-radius:50%`, `filter: blur(~72px)` radial
  glows inside the section (`position:relative; overflow:hidden`): a warm gold glow
  (`rgba(152,112,50,~0.20)`) upper-left and an olive glow (`rgba(71,71,41,~0.26)`) lower-right, each
  drifting slowly (~36s / ~46s) via small translate keyframes. Animations wrapped in
  `@media (prefers-reduced-motion: no-preference)` so they freeze under reduce.
- **Heading:** `Thoughts`, `clamp(34px,4vw,52px)`, weight ~480, letter-spacing `-0.04em`.
- **Intro:** *"Notes on data, systems, and intelligence — essays on data science, ML, analytics, and
  how intelligent systems shape the decisions we make."* — max-width ~560px, secondary color.
- **Inner container:** `max-width ~880px`, centered, generous vertical padding (≈130px/150px desktop,
  ≈88px/104px mobile). Narrower than Works for comfortable reading measure.
- **List:** `border-top` on the list + `border-bottom` on each row, thin `rgba(244,242,238,0.09)`.

### Row (`ThoughtItem`)
- **Title:** non-navigating `<h3 class="t-title">` wrapping `<span class="t-title-text">`,
  `clamp(22px,2.4vw,30px)`, weight ~480, letter-spacing `-0.03em`, primary text color. The
  underline-reveal is a `background-size: 0% 1px → 100% 1px` gradient on the text span.
- **Meta line:** `Category · Date · Read-time` — category uppercase ochre + letter-spaced; the rest
  in faint text. ~12.5px.
- **Excerpt:** one line, max-width ~620px, secondary color, ~15px / line-height ~1.6.
- **CTA:** `Read article →` — visual-only `<span class="t-cta">`, faint→white on hover, arrow nudges.

### Seed content (placeholders)

| id | title | category | date | readTime |
|----|-------|----------|------|----------|
| model-built | Why Data Science Projects Fail After the Model Is Built | Analysis | Jun 2026 | 6 min read |
| dashboards-decisions | From Dashboards to Decisions | Strategy | May 2026 | 5 min read |
| human-side-ml | The Human Side of Machine Learning | Perspective | Apr 2026 | 7 min read |
| better-data-products | Building Better Data Products | Product | Mar 2026 | 5 min read |

Excerpts (placeholder): churn-of-projects / dashboards-to-decisions / human-side / data-products
one-liners as shown in `docs/thoughts-reference.html`.

### Hover (pointer devices, `@media (hover:hover)`)
On row hover: the title's underline reveals (`background-size` to `100% 1px`) and the title slides
right ~6px; the CTA brightens to white and its arrow nudges ~4px. Slow (~.45s). No card lift — this
is a list, not cards.

---

## Motion & accessibility

- **Reveal:** rows carry `data-reveal` + a staggered `--reveal-delay` (≈`index * 0.06s`) and use the
  shared idempotent `initReveal()`. Off-screen rows stay hidden until in view, then fade + rise.
- **No-JS / reduced-motion:** rows render fully visible (the hidden state only applies under
  `.js-reveal`, added by JS only when motion is allowed), orbs freeze, hover/underline transitions
  are disabled. Content is never hidden behind JS or motion.
- **No horizontal overflow** at any width; honor the global `overflow-x:hidden`.

---

## Testing

- **Unit — `src/lib/thoughts.test.js` (Vitest):** `THOUGHTS` has exactly 4 entries; every entry has
  all required fields (`id, title, category, date, readTime, excerpt, href`) of the right types;
  `id`s are unique; every `category` is in `CATEGORIES`.
- **e2e — `e2e/thoughts.spec.ts` (Playwright):**
  - `#thoughts` section + heading + intro + all 4 titles render; each row exposes a "Read article" CTA.
  - Under `prefers-reduced-motion: reduce`, all 4 rows are visible (`opacity:1`) and `.js-reveal` is
    absent (no-gating contract).
  - With motion, the first below-fold row starts `opacity:0` and reaches `opacity:1` after
    `scrollIntoViewIfNeeded` (reveal transition).
  - A focused horizontal-overflow check at extremes (2560 / 360); the page-wide sweep in
    `e2e/hero.spec.ts` already covers the full breakpoint set including this section.
- **Regression:** existing hero + works unit/e2e suites still pass (the `reveal.js` refactor must not
  break the Works reveal — covered by the existing `works.spec.ts` reveal tests).

---

## Self-review notes

- **Spec coverage:** both locked decisions (title-led rows; drifting orb), architecture (incl. the
  reveal.js idempotency refactor enabling reuse), content, motion/a11y, and testing are all concrete. ✓
- **Type consistency:** `THOUGHTS` entry shape is identical across `thoughts.js`, `thoughts.test.js`,
  and `ThoughtItem.astro` props; `CATEGORIES` is the single source for category validation. The
  `reveal.js` contract (`data-reveal`, `js-reveal`, `revealed`, `--reveal-delay`) matches the existing
  generic CSS reused unchanged. ✓
- **No placeholders-as-gaps:** placeholder *content* is intentional and labeled; no unresolved TBDs. ✓
- **Scope:** one section + one shared-utility refactor; single implementation plan. ✓
- **Deviation noted:** title is a non-navigating `<h3>` placeholder (not an `<a>`), matching the
  Works visual-only-CTA convention; restored to a link when articles exist.
