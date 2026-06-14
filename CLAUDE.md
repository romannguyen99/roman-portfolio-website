# Roman Nguyen — Data Science Portfolio

A premium, editorial single-page portfolio for a data science practitioner — built to feel
like a high-end creative studio site, not a developer template or corporate résumé. Quiet,
cinematic, art-directed, technically refined. It should signal intelligence, clarity,
technical depth, and taste.

This file is the source of truth for the project's vision, design system, and build plan.
Keep it current as the site grows.

---

## Status & scope

- **Milestone 1 — Hero (locked, validated).** The WebGL hero is fully designed and signed off
  via an interactive shader preview. Build it first as a standalone milestone.
- **Milestones 2–5 (roadmap).** Works, Thoughts, About Me, Contact/Footer — specified below at
  direction level; each gets a focused build pass after the hero ships.
- **Content:** placeholder copy from the project brief (example projects, blog posts, bio). Real
  content and links get swapped in later.
- **Bilingual:** the `EN / VN` selector is **visual-only** for now. No i18n wiring yet; build the
  toggle as designed but only English content exists.

### Reference artifact
`docs/hero-reference.html` is the **validated, self-contained hero** (HTML + CSS + the GLSL
fragment shader). It is the source of truth for the hero's look and the shader technique. Port
it into the Astro structure — do not redesign it. The production WebGL island IS this shader.

---

## Tech stack & architecture

- **Astro** — static site generation, near-zero JS on content sections.
- **Raw WebGL** for the hero canvas (one full-screen fragment shader — Three.js is unnecessary for
  a single fullscreen pass). The WebGL module is loaded via Astro's default module `<script>`, which
  hydrates on the client. (The validated reference uses raw WebGL; this supersedes the earlier note.)
- **Vanilla CSS** (or lightweight CSS modules / scoped `<style>`), no UI framework. Match the
  reference's hand-written CSS.
- **Vite** (built into Astro) for bundling. **Google Fonts** for Space Grotesk (self-host later
  for performance if desired).
- **Build:** static output, deployable to any host (Vercel / Netlify / GitHub Pages) with a custom
  domain. No server runtime required. If GH Pages, set `base` in `astro.config`.

### Suggested structure (when scaffolding)
```
src/
  pages/index.astro          # composes all sections
  components/
    Hero.astro               # UI layer + <canvas> mount point
    hero/heroField.js        # WebGL setup + shader (ported from docs/hero-reference.html)
    Works.astro
    Thoughts.astro
    About.astro
    Contact.astro
  styles/global.css          # design tokens (palette, type scale, motion)
docs/hero-reference.html     # validated hero reference (do not delete)
```

---

## Global design system

### Color palette (earth tones on near-black)
Dominant relationship is warm gold / ochre / bronze / olive over deep near-black. No bright neon,
no pure-blue "tech" clichés, no saturated teal. Smoky teal is a **shadow accent only**.

| Token        | Hex       | Use |
|--------------|-----------|-----|
| Near-black   | `#070806` | base / darkest |
| Warm-black   | `#100D08` | warm canvas base |
| Deep olive   | `#2D301C` | olive ribbon |
| Moss         | `#474729` | olive ribbon highlight |
| Dark amber   | `#493019` | warm ribbon edge |
| Bronze       | `#704A22` | warm ribbon mid |
| Ochre        | `#987032` | warm ribbon |
| Muted gold   | `#AD853D` | warm ribbon core (brightest, used sparingly) |
| Smoky teal   | `#142724` | subtle shadow tone in gaps only |
| Primary text | `#F4F2EE` | headlines, body |
| Secondary    | `rgba(244,242,238,0.55–0.65)` | nav, labels, secondary text |
| Borders      | low-opacity white or muted green (≤10%) | dividers, card edges |

**Composition rule:** ~70–80% near-black, ~10–15% olive/moss, ~10–15% warm gold/ochre/bronze/amber.
Warm color appears as a flowing **band**, never as a fill or a glow blob.

### Typography
- **Space Grotesk** (clean geometric sans). Weights 400 / 450 / 500.
- Headlines: medium weight (~480), tight letter-spacing (`-0.04em` desktop, `-0.035em` mobile),
  large and expressive with generous space.
- Body: calm, readable, refined. Secondary text in soft gray.
- Wordmark is lowercase (`roman nguyen`); nav is uppercase.

### Motion
- Slow, premium, intentional. No bouncy/playful/fast motion.
- Smooth scrolling; section transitions fade + slide gently.
- Scroll-triggered reveals for headings, cards, blog items, about blocks.
- Background graphics respond to the cursor only a few px at most.
- **`prefers-reduced-motion`:** freeze shader motion on an attractive still frame and disable
  reveal/hover transitions; never remove the visual entirely.

### Interaction
- Subtle but noticeable hover: cards lift slightly, borders brighten softly, links reveal an
  elegant underline animation. Nothing distracting.

### Layout & accessibility
- Use `100svh` (not just `vh`) for full-height sections; honor `safe-area-inset-*` on the UI layer.
- Prevent horizontal overflow everywhere.
- Maintain strong white-on-dark contrast; keep a darker calm zone behind any centered headline.

---

## Hero spec (Milestone 1 — locked)

Full-bleed first viewport. Source of truth: `docs/hero-reference.html`.

### Layer stack (z-index)
1. `0` — WebGL `<canvas>` (the shared procedural field; background **and** circular optical window).
2. `2` — film grain overlay: fine monochrome SVG fractal noise, `opacity ~0.05`,
   `mix-blend-mode: overlay`, `pointer-events: none`.
3. `3` — UI layer (wordmark, language selector, nav, headline, scroll indicator).
4. `20` — mobile menu overlay (when open).

### UI elements (do not redesign — validated)
- **Wordmark** top-left: `roman nguyen`, ~13px, weight 450, lowercase.
- **Language selector** top-center: `EN / VN`, ~10px, letter-spacing 3px, active = white, other = ~55%.
- **Navigation** top-right: vertical list `WORK` / `THOUGHTS` / `ABOUT ME`, uppercase, ~11.5px,
  letter-spacing 1.5px, opacity `0.65 → 1` on hover, 14px gap.
- **Headline** `Roman Nguyen`: absolutely centered, `left:50%; top:46%; translate(-50%,-50%)`,
  `clamp(56px,5.5vw,88px)` desktop / `clamp(40px,10.5vw,48px)` mobile, weight ~480, no box. Sits in a
  shader-darkened calm pocket. Below 360px it deliberately stacks to two lines (`Roman` / `Nguyen`).
- **Scroll indicator** bottom-left: small circle with slowly rotating circular text
  ("SCROLL TO EXPLORE ·") around a center dot; 58px desktop / 66px mobile.

### The shared-field shader (the defining visual)
One full-screen canvas, **one** procedural earth-tone field. The circle is **not an object** — it is
only a region where the shared field's UV coordinates are optically transformed.

- **Field:** 2–3 broad, smooth, directional **ribbons** over a near-black base — a warm
  gold/ochre/bronze/amber ribbon (upper-right) and an olive/moss ribbon (lower-left), with dark
  gaps crushed toward near-black. Built from a diagonal coordinate; bent by **one low-frequency
  domain-warp layer** (2-octave value noise). No radial blobs, no high-frequency/cloud/marble noise.
- **Circular optical window (upper-right):** mathematically perfect (`r = dist/radius`). Inside,
  sample the same field with:
  - radial **magnification** (~1.2× at center — sampling scale ~0.83 — easing to identity at the
    edge; exact constants live in the reference), and
  - **tangential displacement** that peaks near the boundary (→ 0 at the edge) so ribbons bend and
    travel *around* the circle.
  Both terms reach zero at `r = 1`, so the transition is **seamless** — no outline, rim, glow,
  shadow, reflection, or fill. The circle is perceived purely through the optical bend + a whisper
  of extra local contrast inside.
- **Animation:** continuous, very slow. Main directional drift ~33s (L→R, slightly up) plus a
  secondary curvature cycle ~52s. Seamless; no spin, no pulse, no visible repeat. The field flows
  across the hero and bends/accelerates subtly through the circular region.
- **Dither** the final color (`±1/255`) to kill banding. Soft global vignette. Gentle (not oval)
  darkening behind the headline for readability.

### Circle placement (matches validated proportions)
- **Desktop (>640px):** diameter `clamp(580px, 44vw, 760px)`; right edge `0.07·W` beyond the right
  edge; top `0.08·H` above the top. Cropped by top + right.
- **Mobile (≤640px):** diameter `0.80·W` (`0.76·W` at ≤360px); right edge `0.10·W` beyond; top
  `0.16·H` above (`0.15·H` at ≤360px). Cropped from the top.
- A `uMobile` uniform shifts the warm band center (≈`1.78 → 1.30` in field space) and widens it so
  the ribbon reads *through* the cropped circle on portrait, and lifts the dark crush slightly for
  more atmosphere. Desktop look is unchanged when `uMobile = 0`.

### Performance & fallback
- `requestAnimationFrame`; cap `devicePixelRatio` (2 desktop / 1.5 mobile). Low-octave noise only.
- `prefers-reduced-motion`: render a single attractive frozen frame (no RAF loop).
- If WebGL is unavailable, fall back to a static abstract gradient image in the same palette.

### Mobile behavior
- Vertical nav → compact **hamburger** (top-right). Opening it shows a **full-screen overlay** on
  solid `#070806` (with faint atmospheric radials), large restrained links `Work` / `Thoughts` /
  `About Me` with a staggered fade-up, a close icon, and **body-scroll lock**. No content bleed-through.

### Load choreography (to implement in production)
Fade the canvas in first → fade in wordmark / language / nav → reveal the headline last with a
slight upward movement. Smooth and editorial, not flashy.

---

## Roadmap (Milestones 2–5)

Shared treatment: dark backgrounds differentiated subtly per section (vertical gradient / soft
noise), scroll-triggered reveals, smooth scroll, restrained hover, full reduced-motion support.
**No** card-based SaaS look, stock photos, heavy shadows, or busy decoration.

### 2. Works — "Selected Works"
Intro: *"A collection of data science projects exploring prediction, automation, insight
generation, and decision intelligence."* Spacious grid, **2 columns desktop / 1 mobile**. Large
glassmorphism cards (semi-transparent dark surface, soft blur, thin white/muted-green border,
subtle hover glow + gentle lift + brighter border + a slow inner visual animation). Each card:
title, one-line summary, category tag, tools, a result/impact metric, CTA ("View case study").
Visuals are **abstract data-inspired** (flowing lines, node networks, animated scatter/heatmap
gradients, drifting data points) with micro-interactions on hover — never screenshots or stock
"laptop/charts/coding" clichés. Seed cards: Customer Churn Prediction · Sales Forecasting Dashboard
· Sentiment Analysis from Social Data · Recommendation Engine.

### 3. Thoughts — "Thoughts" / "Notes on Data, Systems & Intelligence"
Intro: essays/reflections on data science, ML, analytics, and how intelligent systems shape
decisions. **Editorial article list** (not commercial cards) — vertical/asymmetric list with strong
typography, thin low-opacity divider lines (white or muted green). Each item: title, short excerpt,
category, date, reading time, CTA ("Read article"). Hover: title slides slightly / underline
reveal. Quiet animated backdrop (slow blurred orb or faint data grid). Seed posts: *Why Data
Science Projects Fail After the Model Is Built* · *From Dashboards to Decisions* · *The Human Side
of Machine Learning* · *Building Better Data Products*.

### 4. About Me — "About Me" / "Behind the Models"
Confident, human tone. **Split layout** desktop (large personal statement left; structured info
blocks right), stacked on mobile. Spacious and calm. Info blocks: Focus Areas · Technical Stack ·
What I Care About · Currently Exploring. Portrait area = dark glass frame with subtle gradient
reflections if no photo. Small animated labels, thin lines, elegant spacing. Personal-brand, not CV.

### 5. Contact / Footer — "Let's build something intelligent."
Returns to the hero's immersive mood (dark gradient + a soft animated glass/orb element). Supporting
line inviting data/ML/analytics/product collaboration. Minimal CTA buttons (transparent, thin
border, white text, subtle hover glow): Email · LinkedIn · GitHub · Resume. Footer: name, role,
location, social links, e.g. *"Data Science Portfolio © 2026"*.

---

## Working notes / conventions

- Match the reference's idioms when porting the hero; keep the shader as one cohesive, swappable unit.
- Keep files focused and small; one clear purpose per component.
- Don't introduce neon gradients, generic startup illustrations, SaaS cards, heavy shadows, stock
  photos, or busy decoration anywhere.
- Verify visual work at 1440 / 1920 (desktop), 768 (tablet), 390 / 360 (mobile) before calling it done.
