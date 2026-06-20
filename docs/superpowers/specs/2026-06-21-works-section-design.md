# Works Section ("Selected Works") — Design Spec

**Milestone 2** of the Roman Nguyen portfolio. Builds the "Selected Works" section directly
below the hero. Direction-level requirements come from `CLAUDE.md` → *Roadmap §2 — Works*; this
spec resolves the open creative + technical decisions and is validated by an interactive
reference prototype.

**Validated visual reference:** `docs/works-reference.html` — a self-contained HTML/CSS/SVG
prototype of the section, signed off via desktop (1440) + mobile (390) screenshots. It is the
source of truth for the look (palette, glass, motifs, motion) the same way
`docs/hero-reference.html` is for the hero. Port it into Astro — do not redesign it.

---

## Goal

A spacious, editorial "Selected Works" section: a 2-column (desktop) / 1-column (mobile) grid of
glassmorphism cards, each presenting one data-science project with a distinct, slow, abstract
**data-inspired motif** in a top media band and clean text below. On-brand with the hero
(earth tones on near-black, restrained motion), fully `prefers-reduced-motion`-safe, no horizontal
overflow at any breakpoint.

## Locked decisions (from brainstorming)

1. **Motif rendering = per-card SVG + CSS** (no canvas/WebGL). Crisp at any DPR, cheap, degrades
   cleanly, trivially frozen under reduced-motion. Each card gets a *distinct* motif.
2. **Card layout = top media band.** Motif occupies a fixed-height upper zone; all text sits on
   solid glass below. Chosen for legibility of the dense card content and for each motif reading
   clearly as its own data-viz.

## Out of scope (deliberate)

- **Real content & links.** Titles are the four brief-named projects; summaries, category tags,
  tools, and impact metrics are illustrative **placeholders** swapped in later. The "View case
  study" CTA is **visual-only / non-navigating** for now (consistent with the EN/VN selector being
  visual-only).
- **Hero changes.** The hero is untouched.
- **Milestones 3–5** (Thoughts/About/Contact). Only the shared `reveal.js` utility is built here
  with later reuse in mind; those sections are not built.
- **Bilingual content.** English only.

---

## Architecture

Follows the established Hero pattern (`Hero.astro` + `hero/` submodule + tested `lib/` math).

```
src/components/Works.astro              # section shell: heading, intro, grid; maps WORKS -> WorkCard
src/components/works/WorkCard.astro     # one card: top media band + text body; selects its motif
src/components/works/motifs/
    ChurnMotif.astro                    # drifting two-cluster point cloud + decision boundary
    ForecastMotif.astro                 # trend line + breathing confidence band over gridlines
    SentimentMotif.astro                # pulsing social node-network, nodes shift warm<->olive
    RecSysMotif.astro                   # bipartite users<->items, connection lines lighting up
src/lib/works.js                        # WORKS data array + the motif-key union
src/lib/works.test.js                   # data-shape invariants (Vitest)
src/scripts/reveal.js                   # shared IntersectionObserver scroll-reveal (reused later)
```

Plus edits:
- `src/pages/index.astro` — render `<Works />` after `<Hero />`.
- `src/styles/global.css` — `scroll-behavior: smooth` (disabled under reduced-motion) and
  `scroll-margin-top` on `#work` so the hero nav anchor lands cleanly.

### Component boundaries

- **`works.js`** — pure data. Exports `WORKS`: an array of project objects, each:
  `{ id, title, category, summary, tools: string[], metric: { value, label }, motif, href }`,
  where `motif ∈ {'churn','forecast','sentiment','recsys'}`. No DOM, no Astro — unit-testable.
- **`WorkCard.astro`** — presentational. Takes one `WORKS` entry as props, renders the glass card
  (`.work-media` band + `.work-body`), and renders the matching motif component by switching on
  `motif`. Marked `data-reveal` for the scroll-reveal observer.
- **`motifs/*.astro`** — each owns one inline `<svg>` + scoped `<style>` (keyframes). Self-contained,
  no props, no dependencies. Adding/removing a motif touches only its file + the `works.js` union.
- **`Works.astro`** — composition only: heading + intro + `.works-grid` mapping `WORKS`. Imports the
  reveal script via a module `<script>`.
- **`reveal.js`** — exports an init that observes `[data-reveal]` and adds `.revealed` when in view
  (`IntersectionObserver`, `rootMargin` so it triggers slightly before fully on-screen, unobserves
  after firing). If `prefers-reduced-motion: reduce` OR no `IntersectionObserver`, it adds
  `.revealed` to all targets immediately (no animation) — content is never gated behind motion.

---

## Visual / content spec (per the validated reference)

### Section frame
- **Background:** subtly differentiated from the hero — a vertical gradient
  `near-black → warm-black → near-black` with a faint warm radial top-right, plus the same fine
  film-grain overlay treatment used in the hero (low opacity, `mix-blend-mode: overlay`).
- **Heading:** `Selected Works`, `clamp(34px,4vw,52px)`, weight ~480, letter-spacing `-0.04em`.
  No eyebrow label (a duplicate eyebrow was removed during sign-off).
- **Intro:** *"A collection of data science projects exploring prediction, automation, insight
  generation, and decision intelligence."* — max-width ~540px, secondary text color.
- **Grid:** `grid-template-columns: 1fr 1fr` desktop, `1fr` at ≤640px; generous gap (~30px desktop),
  container max-width ~1120px, ample vertical padding.

### Card
- **Glass:** translucent dark surface
  (`linear-gradient(rgba(244,242,238,0.045), rgba(16,13,8,0.30))`), `backdrop-filter: blur(14px)`,
  thin border `rgba(244,242,238,0.09)`, `border-radius: 18px`, `overflow: hidden`.
- **Hover (pointer devices):** slow (~.6s) gentle lift (~5px), border brightens to a warm
  `rgba(173,133,61,0.38)`, soft warm outer glow, CTA arrow nudges right ~4px. No heavy shadow.
- **Media band:** fixed height (~188px desktop), `overflow: hidden`, faint warm radial backing, the
  motif `<svg>` filling it (`preserveAspectRatio: xMidYMid slice`).
- **Body:** category tag (uppercase, ochre, letter-spaced) · title (~23px, weight 480) · one-line
  summary (secondary) · tools (faint, `·`-separated) · footer row with the impact **metric**
  (gold-accented value) and the "View case study →" CTA, separated by a thin top border.

### The four cards (placeholder content)

| id | title | category | motif | tools (placeholder) | metric (placeholder) |
|----|-------|----------|-------|---------------------|----------------------|
| churn | Customer Churn Prediction | Prediction | churn | Python · scikit-learn · XGBoost | ↓ 23% churn in pilot |
| forecast | Sales Forecasting Dashboard | Forecasting | forecast | Python · Prophet · Plotly | 92% forecast accuracy |
| sentiment | Sentiment Analysis from Social Data | Natural Language | sentiment | Python · spaCy · Transformers | 1.2M posts classified |
| recsys | Recommendation Engine | Personalization | recsys | Python · TensorFlow · FAISS | +18% recommendation CTR |

### Motifs (SVG + CSS keyframes; all motion via `transform`/`opacity`/stroke — GPU-cheap)
- **Churn:** two point clusters (olive "retained" lower-left, gold "at-risk" upper-right) drifting
  slowly in opposing directions across a dashed gold decision-boundary curve whose dashes travel.
- **Forecast:** faint horizontal gridlines, a gold trend polyline rising L→R, and a translucent gold
  confidence band that slowly "breathes" (scaleY), with a pulsing tip dot at the line end.
- **Sentiment:** ~8 nodes connected by edges; edges pulse opacity, nodes pulse scale (staggered),
  node fill animates warm↔olive (positive/negative polarity drift).
- **RecSys:** two columns (users ↔ items) of nodes with crossing connection lines that brighten and
  subtly "draw" in a staggered sequence; lines keep a visible resting opacity (never empty).

---

## Motion & accessibility

- **Reveal:** each card starts hidden + slightly lowered (`opacity:0; translateY`) *only when JS is
  active and motion is allowed*; the `IntersectionObserver` adds `.revealed` → slow fade + rise,
  staggered per card. The same in-view state is what **starts the motif animations**, so off-screen
  cards stay idle.
- **No-JS / reduced-motion:** cards render fully visible and motifs freeze on an attractive still
  frame (`@media (prefers-reduced-motion: reduce){ animation:none }`); reveal/hover transitions are
  disabled. Content is never hidden behind motion or JS.
- **Smooth scroll:** `scroll-behavior: smooth` on the root, disabled under reduced-motion.
- **Layout:** prevent horizontal overflow at every breakpoint; honor existing `overflow-x:hidden`.

---

## Testing

- **Unit — `src/lib/works.test.js` (Vitest):** `WORKS` has exactly 4 entries; every entry has all
  required fields (`id, title, category, summary, tools[], metric, motif, href`); every `motif` is
  one of the four valid keys; `id`s are unique.
- **e2e — `e2e/works.spec.ts` (Playwright):**
  - `#work` section renders with the heading, the intro text, and all 4 card titles.
  - Each card exposes a "View case study" CTA.
  - No horizontal overflow across the size sweep (`scrollWidth ≤ innerWidth` at the
    2560/1920/1440/768/390/360 sizes already used by the hero guard).
  - Under emulated `prefers-reduced-motion: reduce`, all 4 cards are visible **without** relying on
    the reveal observer (assert visibility directly after load).
- **Regression:** the existing hero unit + e2e suites must still pass unchanged.

---

## Self-review notes

- **Spec coverage:** both brainstormed decisions (SVG/CSS motifs; top-media-band layout) are locked;
  architecture mirrors the Hero convention; content, motion, accessibility, and testing are all
  concrete. ✓
- **Type consistency:** `WORKS` entry shape is identical across `works.js`, `works.test.js`, and
  `WorkCard.astro` props; the `motif` union is the single source for the motif switch. ✓
- **No placeholders-as-TODO:** placeholder *content* is intentional and labeled; there are no
  unresolved design TBDs. ✓
- **Scope:** one section, single implementation plan; shared `reveal.js` is the only forward-looking
  piece and is justified by the roadmap. ✓
