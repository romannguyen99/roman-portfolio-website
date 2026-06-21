# Works Section ("Selected Works") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Selected Works" section — a 2-column (desktop) / 1-column (mobile) grid of glassmorphism cards, each with a distinct animated SVG data-motif in a top media band and clean text below — directly under the hero.

**Architecture:** Follows the established Hero pattern (`Hero.astro` + a component submodule + tested `lib/` data). Project data lives in a Vitest-tested pure array `src/lib/works.js`; `Works.astro` maps it to `WorkCard.astro`; each card renders one of four self-contained motif components (`src/components/works/motifs/*.astro`). A shared `src/scripts/reveal.js` drives scroll reveals (reused by later milestones). No canvas/WebGL — motifs are inline SVG animated with CSS `transform`/`opacity`/stroke.

**Tech Stack:** Astro (static), inline SVG + scoped CSS, Vitest (unit), Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-06-21-works-section-design.md`
**Validated visual reference:** `docs/works-reference.html` (port it — do not redesign).

## Global Constraints

- **Palette:** earth tones on near-black, via the existing `:root` tokens in `src/styles/global.css` (`--c-near-black #070806`, `--c-warm-black #100D08`, `--c-olive #2D301C`, `--c-moss #474729`, `--c-amber #493019`, `--c-bronze #704A22`, `--c-ochre #987032`, `--c-gold #AD853D`, `--c-teal #142724`, `--c-text #F4F2EE`, `--c-text-dim`, `--c-text-faint`). Warm color reads as a flowing band, never a fill/glow blob.
- **Font:** Space Grotesk (already loaded in `src/pages/index.astro` `<head>`); weights 400/450/500.
- **Motion:** slow, premium, intentional. Under `prefers-reduced-motion: reduce`, freeze every motif on a still frame and disable reveal/hover transitions; never hide content.
- **No horizontal overflow** at any width (`document.documentElement.scrollWidth <= window.innerWidth`); `html,body{overflow-x:hidden}` already set globally.
- **Verify at** 1440 / 1920 (desktop), 768 (tablet), 390 / 360 (mobile).
- **No** SaaS-card look, stock photos, heavy shadows, neon, or busy decoration. Motifs are abstract data-inspired SVG, never screenshots.
- **Placeholder content** (English only). The "View case study" CTA is **visual-only / non-navigating** for now.

---

## File structure

- **Create** `src/lib/works.js` — `WORKS` data array + `MOTIFS` key list.
- **Create** `src/lib/works.test.js` — data-shape invariants (Vitest).
- **Create** `src/components/works/motifs/ChurnMotif.astro` — two-cluster point cloud + decision boundary.
- **Create** `src/components/works/motifs/ForecastMotif.astro` — trend line + breathing confidence band.
- **Create** `src/components/works/motifs/SentimentMotif.astro` — pulsing social node-network.
- **Create** `src/components/works/motifs/RecSysMotif.astro` — bipartite users↔items links.
- **Create** `src/components/works/WorkCard.astro` — one card (media band + body), selects its motif.
- **Create** `src/components/Works.astro` — section shell (bg + grain + heading + intro + grid).
- **Create** `src/scripts/reveal.js` — shared `IntersectionObserver` reveal.
- **Create** `e2e/works.spec.ts` — render + CTA + overflow + reveal/reduced-motion tests.
- **Modify** `src/pages/index.astro` — render `<Works />` after `<Hero />`.
- **Modify** `src/styles/global.css` — smooth scroll, `#work` scroll-margin, reveal CSS.

---

### Task 1: Works data array (TDD)

**Files:**
- Create: `src/lib/works.js`
- Test: `src/lib/works.test.js`

**Interfaces:**
- Produces: `WORKS` — array of `{ id:string, title:string, category:string, summary:string, tools:string[], metric:{value:string,label:string}, motif:'churn'|'forecast'|'sentiment'|'recsys', href:string }`. `MOTIFS` — `string[]` of the four valid motif keys. Both consumed by `Works.astro` / `WorkCard.astro`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/works.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { WORKS, MOTIFS } from './works.js';

describe('WORKS', () => {
  it('has exactly 4 entries', () => {
    expect(WORKS).toHaveLength(4);
  });

  it('every entry has the required fields with correct types', () => {
    for (const w of WORKS) {
      expect(typeof w.id).toBe('string');
      expect(typeof w.title).toBe('string');
      expect(typeof w.category).toBe('string');
      expect(typeof w.summary).toBe('string');
      expect(Array.isArray(w.tools)).toBe(true);
      expect(w.tools.length).toBeGreaterThan(0);
      expect(typeof w.metric.value).toBe('string');
      expect(typeof w.metric.label).toBe('string');
      expect(typeof w.href).toBe('string');
    }
  });

  it('every motif is one of the valid keys', () => {
    for (const w of WORKS) expect(MOTIFS).toContain(w.motif);
  });

  it('ids are unique', () => {
    const ids = WORKS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('MOTIFS lists the four motif keys', () => {
    expect([...MOTIFS].sort()).toEqual(['churn', 'forecast', 'recsys', 'sentiment']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/works.test.js`
Expected: FAIL — `Failed to resolve import "./works.js"` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/works.js`:
```js
// Selected Works — project data. Pure data, unit-tested in works.test.js.
// Summaries / tools / metrics are illustrative placeholders (real content swapped in later).
export const MOTIFS = ['churn', 'forecast', 'sentiment', 'recsys'];

export const WORKS = [
  {
    id: 'churn',
    title: 'Customer Churn Prediction',
    category: 'Prediction',
    summary: 'Flagging at-risk accounts before they lapse, so retention can act early.',
    tools: ['Python', 'scikit-learn', 'XGBoost'],
    metric: { value: '↓ 23%', label: 'churn in pilot' },
    motif: 'churn',
    href: '#',
  },
  {
    id: 'forecast',
    title: 'Sales Forecasting Dashboard',
    category: 'Forecasting',
    summary: 'Turning noisy history into a forward view leaders can plan against.',
    tools: ['Python', 'Prophet', 'Plotly'],
    metric: { value: '92%', label: 'forecast accuracy' },
    motif: 'forecast',
    href: '#',
  },
  {
    id: 'sentiment',
    title: 'Sentiment Analysis from Social Data',
    category: 'Natural Language',
    summary: 'Reading the mood of the crowd across millions of unstructured posts.',
    tools: ['Python', 'spaCy', 'Transformers'],
    metric: { value: '1.2M', label: 'posts classified' },
    motif: 'sentiment',
    href: '#',
  },
  {
    id: 'recsys',
    title: 'Recommendation Engine',
    category: 'Personalization',
    summary: 'Matching people to what they will value next, at scale and in real time.',
    tools: ['Python', 'TensorFlow', 'FAISS'],
    metric: { value: '+18%', label: 'recommendation CTR' },
    motif: 'recsys',
    href: '#',
  },
];
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/works.test.js`
Expected: PASS — all 5 `WORKS` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/works.js src/lib/works.test.js
git commit -m "feat: add Works project data array (works.js) with tests

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Section, card, motifs, and page wiring (renders, no reveal yet)

Builds the visible section end-to-end. Cards render plainly (always visible); the reveal/motion layer is Task 3. Deliverable verified by a render e2e.

**Files:**
- Create: `src/components/works/motifs/ChurnMotif.astro`, `ForecastMotif.astro`, `SentimentMotif.astro`, `RecSysMotif.astro`
- Create: `src/components/works/WorkCard.astro`
- Create: `src/components/Works.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/styles/global.css`
- Test: `e2e/works.spec.ts`

**Interfaces:**
- Consumes: `WORKS` from `src/lib/works.js` (Task 1).
- Produces: a `<section id="work" class="works">` containing `.work-card` articles, each with `.work-media` (motif), `.tag`, `.title` (`h3`), `.summary`, `.tools`, `.metric`, `.cta`. Each card has `data-reveal` and an inline `--reveal-delay` var (consumed by Task 3's CSS). `WorkCard` takes props `{ work, index }`.

- [ ] **Step 1: Create the Churn motif**

Create `src/components/works/motifs/ChurnMotif.astro`:
```astro
---
---
<svg class="m-churn" viewBox="0 0 400 188" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <path class="boundary" d="M40,168 C150,150 250,86 366,30" fill="none" stroke="#AD853D" stroke-opacity="0.40" stroke-width="1.4"/>
  <g class="retained" fill="#6b6c44">
    <circle cx="70" cy="150" r="4"/><circle cx="95" cy="165" r="3.4"/><circle cx="110" cy="135" r="4.2"/>
    <circle cx="130" cy="158" r="3.2"/><circle cx="85" cy="128" r="3.6"/><circle cx="122" cy="170" r="3"/>
    <circle cx="150" cy="150" r="3.8"/><circle cx="100" cy="150" r="3"/><circle cx="140" cy="130" r="3.4"/>
    <circle cx="62" cy="170" r="3"/>
  </g>
  <g class="atrisk" fill="#AD853D">
    <circle cx="255" cy="55" r="4"/><circle cx="280" cy="40" r="3.6"/><circle cx="300" cy="70" r="4.2"/>
    <circle cx="270" cy="80" r="3.2"/><circle cx="320" cy="50" r="3.6"/><circle cx="295" cy="95" r="3"/>
    <circle cx="330" cy="80" r="3.8"/><circle cx="250" cy="78" r="3"/><circle cx="312" cy="32" r="3.4"/>
    <circle cx="285" cy="62" r="3"/>
  </g>
</svg>
<style>
  svg { width: 100%; height: 100%; display: block; }
  .boundary { stroke-dasharray: 5 8; }
  @media (prefers-reduced-motion: no-preference) {
    .retained { animation: churn-drift1 19s ease-in-out infinite; }
    .atrisk   { animation: churn-drift2 22s ease-in-out infinite; }
    .boundary { animation: churn-dash 26s linear infinite; }
  }
  @keyframes churn-drift1 { 0%,100% { transform: translate(-3px, 2px); } 50% { transform: translate(3px, -2px); } }
  @keyframes churn-drift2 { 0%,100% { transform: translate(3px, -2px); } 50% { transform: translate(-3px, 3px); } }
  @keyframes churn-dash   { to { stroke-dashoffset: -130; } }
</style>
```

- [ ] **Step 2: Create the Forecast motif**

Create `src/components/works/motifs/ForecastMotif.astro`:
```astro
---
---
<svg class="m-fc" viewBox="0 0 400 188" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <g stroke="#F4F2EE" stroke-opacity="0.07" stroke-width="1">
    <line x1="0" y1="44" x2="400" y2="44"/><line x1="0" y1="92" x2="400" y2="92"/><line x1="0" y1="140" x2="400" y2="140"/>
  </g>
  <path class="band" d="M20,132 L70,118 L120,124 L170,94 L220,102 L270,68 L320,54 L380,40 L380,72 L320,86 L270,100 L220,134 L170,126 L120,156 L70,150 L20,164 Z" fill="#AD853D" fill-opacity="0.16"/>
  <polyline points="20,150 70,134 120,140 170,110 220,118 270,84 320,68 380,52" fill="none" stroke="#AD853D" stroke-opacity="0.85" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  <circle class="tip" cx="380" cy="52" r="3.6" fill="#F4F2EE"/>
</svg>
<style>
  svg { width: 100%; height: 100%; display: block; }
  .band { transform-box: fill-box; transform-origin: center; }
  @media (prefers-reduced-motion: no-preference) {
    .band { animation: fc-breathe 11s ease-in-out infinite; }
    .tip  { animation: fc-pulse 4.5s ease-in-out infinite; }
  }
  @keyframes fc-breathe { 0%,100% { transform: scaleY(0.86); opacity: .5; } 50% { transform: scaleY(1.08); opacity: .85; } }
  @keyframes fc-pulse   { 0%,100% { r: 3.2; opacity: .6; } 50% { r: 5; opacity: 1; } }
</style>
```

- [ ] **Step 3: Create the Sentiment motif**

Create `src/components/works/motifs/SentimentMotif.astro`:
```astro
---
---
<svg class="m-sent" viewBox="0 0 400 188" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <g class="edges" stroke="#AD853D" stroke-width="1.2">
    <line class="edge" x1="80" y1="60" x2="150" y2="40"/>
    <line class="edge" x1="80" y1="60" x2="120" y2="120" style="animation-delay:-2s"/>
    <line class="edge" x1="150" y1="40" x2="210" y2="90" style="animation-delay:-1s"/>
    <line class="edge" x1="210" y1="90" x2="120" y2="120" style="animation-delay:-3s"/>
    <line class="edge" x1="210" y1="90" x2="190" y2="150" style="animation-delay:-1.5s"/>
    <line class="edge" x1="210" y1="90" x2="285" y2="70" style="animation-delay:-2.5s"/>
    <line class="edge" x1="285" y1="70" x2="255" y2="38" style="animation-delay:-0.5s"/>
    <line class="edge" x1="285" y1="70" x2="325" y2="128" style="animation-delay:-3.5s"/>
    <line class="edge" x1="190" y1="150" x2="325" y2="128" style="animation-delay:-2.2s"/>
  </g>
  <g class="nodes">
    <circle class="node pos" cx="80"  cy="60"  r="7"/>
    <circle class="node neg" cx="150" cy="40"  r="6"   style="animation-delay:-1s,-2s"/>
    <circle class="node pos" cx="210" cy="90"  r="9"   style="animation-delay:-2s,-1s"/>
    <circle class="node neg" cx="120" cy="120" r="6"   style="animation-delay:-3s,-3s"/>
    <circle class="node pos" cx="190" cy="150" r="6.5" style="animation-delay:-1.5s,-2.5s"/>
    <circle class="node neg" cx="285" cy="70"  r="8"   style="animation-delay:-0.8s,-1.2s"/>
    <circle class="node pos" cx="255" cy="38"  r="5.5" style="animation-delay:-2.6s,-0.6s"/>
    <circle class="node neg" cx="325" cy="128" r="6"   style="animation-delay:-1.1s,-3.1s"/>
  </g>
</svg>
<style>
  svg { width: 100%; height: 100%; display: block; }
  .node { transform-box: fill-box; transform-origin: center; }
  .edge { opacity: .18; }
  @media (prefers-reduced-motion: no-preference) {
    .edge { animation: sent-edge 7s ease-in-out infinite; }
    /* pos/neg each run TWO animations (scale + warmth); the two animation-delay
       values in each node's style attribute map to [sent-node, sent-warm]. */
    .pos { animation: sent-node 6s ease-in-out infinite, sent-warm 9s ease-in-out infinite; }
    .neg { animation: sent-node 6s ease-in-out infinite, sent-warm 9s ease-in-out infinite reverse; }
  }
  @keyframes sent-edge { 0%,100% { opacity: .18; } 50% { opacity: .5; } }
  @keyframes sent-node { 0%,100% { transform: scale(.9); } 50% { transform: scale(1.12); } }
  @keyframes sent-warm { 0%,100% { fill: #474729; } 50% { fill: #AD853D; } }
</style>
```

- [ ] **Step 4: Create the RecSys motif**

Create `src/components/works/motifs/RecSysMotif.astro`:
```astro
---
---
<svg class="m-rec" viewBox="0 0 400 188" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <g class="links" stroke="#AD853D" stroke-width="1.4" fill="none">
    <path class="link" d="M96,40 L304,38"/>
    <path class="link" d="M96,40 L304,84"  style="animation-delay:-1.4s"/>
    <path class="link" d="M96,82 L304,38"  style="animation-delay:-2.8s"/>
    <path class="link" d="M96,82 L304,130" style="animation-delay:-4.2s"/>
    <path class="link" d="M96,124 L304,84" style="animation-delay:-5.6s"/>
    <path class="link" d="M96,124 L304,150" style="animation-delay:-7s"/>
    <path class="link" d="M96,150 L304,130" style="animation-delay:-3.5s"/>
  </g>
  <g class="unode" fill="#6b6c44">
    <circle cx="96" cy="40" r="6"/><circle cx="96" cy="82" r="6"/><circle cx="96" cy="124" r="6"/><circle cx="96" cy="150" r="6"/>
  </g>
  <g class="inode" fill="#AD853D">
    <circle cx="304" cy="38" r="6"/><circle cx="304" cy="84" r="6"/><circle cx="304" cy="130" r="6"/><circle cx="304" cy="150" r="6"/>
  </g>
</svg>
<style>
  svg { width: 100%; height: 100%; display: block; }
  .unode, .inode { transform-box: fill-box; transform-origin: center; }
  .link { stroke-dasharray: 200; stroke-dashoffset: 0; stroke-opacity: .25; }
  @media (prefers-reduced-motion: no-preference) {
    .link  { animation: rec-light 9s ease-in-out infinite; }
    .unode { animation: rec-node 6s ease-in-out infinite; }
    .inode { animation: rec-node 6s ease-in-out infinite; animation-delay: -3s; }
  }
  @keyframes rec-light { 0%,100% { stroke-opacity: .20; stroke-dashoffset: 40; } 50% { stroke-opacity: .78; stroke-dashoffset: 0; } }
  @keyframes rec-node  { 0%,100% { transform: scale(.92); } 50% { transform: scale(1.12); } }
</style>
```

- [ ] **Step 5: Create the WorkCard component**

Create `src/components/works/WorkCard.astro`:
```astro
---
import ChurnMotif from './motifs/ChurnMotif.astro';
import ForecastMotif from './motifs/ForecastMotif.astro';
import SentimentMotif from './motifs/SentimentMotif.astro';
import RecSysMotif from './motifs/RecSysMotif.astro';

const { work, index = 0 } = Astro.props;
const MOTIF_COMPONENTS = {
  churn: ChurnMotif,
  forecast: ForecastMotif,
  sentiment: SentimentMotif,
  recsys: RecSysMotif,
};
const Motif = MOTIF_COMPONENTS[work.motif];
---
<article class="work-card" data-reveal style={`--reveal-delay:${index * 0.08}s`}>
  <div class="work-media"><Motif /></div>
  <div class="work-body">
    <div class="tag">{work.category}</div>
    <h3 class="title">{work.title}</h3>
    <p class="summary">{work.summary}</p>
    <div class="tools">{work.tools.join(' · ')}</div>
    <div class="foot">
      <span class="metric"><b>{work.metric.value}</b> {work.metric.label}</span>
      <!-- visual-only / non-navigating placeholder; becomes an <a> when case studies exist -->
      <span class="cta">View case study <span class="arrow">→</span></span>
    </div>
  </div>
</article>
<style>
  .work-card {
    position: relative; border-radius: 18px; overflow: hidden;
    background: linear-gradient(180deg, rgba(244,242,238,0.045), rgba(16,13,8,0.30));
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(244,242,238,0.09);
    transition: transform .6s cubic-bezier(.2,.7,.2,1), border-color .6s ease, box-shadow .6s ease;
  }
  .work-media {
    position: relative; height: 188px; overflow: hidden;
    border-bottom: 1px solid rgba(244,242,238,0.06);
    background: radial-gradient(120% 120% at 70% 10%, rgba(118,81,38,0.14), transparent 60%);
  }
  .work-body { padding: 26px 28px 28px; }
  .tag { font-size: 10.5px; letter-spacing: 2.4px; text-transform: uppercase; color: var(--c-ochre); }
  .title { font-size: 23px; font-weight: 480; letter-spacing: -0.025em; margin-top: 12px; line-height: 1.08; }
  .summary { margin-top: 12px; color: var(--c-text-dim); font-size: 14.5px; line-height: 1.55; }
  .tools { margin-top: 18px; color: var(--c-text-faint); font-size: 12px; letter-spacing: 0.3px; }
  .foot {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    margin-top: 22px; padding-top: 18px; border-top: 1px solid rgba(244,242,238,0.07);
  }
  .metric { font-size: 13.5px; color: var(--c-text); font-weight: 450; }
  .metric b { color: var(--c-gold); font-weight: 500; }
  .cta { font-size: 12px; letter-spacing: 0.4px; color: var(--c-text-dim); display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; transition: color .4s ease; }
  .cta .arrow { transition: transform .4s ease; }
  @media (hover: hover) {
    .work-card:hover { transform: translateY(-5px); border-color: rgba(173,133,61,0.38); box-shadow: 0 24px 60px -28px rgba(173,133,61,0.30), inset 0 1px 0 rgba(244,242,238,0.05); }
    .work-card:hover .cta { color: #fff; }
    .work-card:hover .cta .arrow { transform: translateX(4px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .work-card { transition: none; }
  }
</style>
```

- [ ] **Step 6: Create the Works section component**

Create `src/components/Works.astro` (no `<script>` yet — reveal wiring is Task 3):
```astro
---
import WorkCard from './works/WorkCard.astro';
import { WORKS } from '../lib/works.js';
---
<section class="works" id="work">
  <div class="works-inner">
    <header class="works-head">
      <h2 class="works-title">Selected Works</h2>
      <p class="works-intro">A collection of data science projects exploring prediction, automation, insight generation, and decision intelligence.</p>
    </header>
    <div class="works-grid">
      {WORKS.map((work, i) => <WorkCard work={work} index={i} />)}
    </div>
  </div>
</section>
<style>
  .works {
    position: relative; overflow: hidden;
    background:
      radial-gradient(120% 80% at 80% 0%, rgba(118,81,38,0.10), transparent 55%),
      linear-gradient(180deg, var(--c-near-black) 0%, var(--c-warm-black) 55%, var(--c-near-black) 100%);
  }
  .works::after {
    content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
    opacity: 0.045; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 150px 150px;
  }
  .works-inner { position: relative; z-index: 1; max-width: 1120px; margin: 0 auto; padding: 120px 48px 140px; }
  .works-title { font-size: clamp(34px, 4vw, 52px); font-weight: 480; letter-spacing: -0.04em; line-height: 1.02; }
  .works-intro { max-width: 540px; margin-top: 20px; color: var(--c-text-dim); font-size: 16px; line-height: 1.6; }
  .works-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 64px; }
  @media (max-width: 640px) {
    .works-inner { padding: 84px 24px 100px; }
    .works-grid { grid-template-columns: 1fr; gap: 22px; margin-top: 44px; }
  }
</style>
```

- [ ] **Step 7: Render the section on the page**

Modify `src/pages/index.astro`. Change the frontmatter import block from:
```astro
---
import '../styles/global.css';
import Hero from '../components/Hero.astro';
---
```
to:
```astro
---
import '../styles/global.css';
import Hero from '../components/Hero.astro';
import Works from '../components/Works.astro';
---
```
and change the body from:
```astro
  <body>
    <Hero />
  </body>
```
to:
```astro
  <body>
    <Hero />
    <Works />
  </body>
```

- [ ] **Step 8: Add smooth scroll + anchor offset to global.css**

Append to `src/styles/global.css`:
```css

/* smooth in-page navigation (the hero nav anchors to #work); calm under reduced motion */
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
#work { scroll-margin-top: 24px; }
```

- [ ] **Step 9: Write the render e2e**

Create `e2e/works.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('works section renders heading, intro, and four cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#work')).toBeVisible();
  await expect(page.locator('.works-title')).toContainText('Selected Works');
  await expect(page.locator('.works-intro')).toContainText('prediction, automation, insight generation');
  await expect(page.locator('.work-card')).toHaveCount(4);
  await expect(page.locator('.work-card .title')).toHaveCount(4);
});

test('each work card shows a category tag, metric, and CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.work-card .tag')).toHaveCount(4);
  await expect(page.locator('.work-card .metric')).toHaveCount(4);
  await expect(page.locator('.work-card .cta')).toHaveCount(4);
  await expect(page.locator('.work-card .cta').first()).toContainText('View case study');
});

test('the page has no horizontal overflow with the works section, at extremes', async ({ page }) => {
  for (const [w, h] of [[2560, 1080], [360, 640]] as [number, number][]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `horizontal overflow at ${w}x${h}`).toBe(false);
  }
});
```

- [ ] **Step 10: Run the works e2e**

Run: `npx playwright test e2e/works.spec.ts`
Expected: PASS — all 3 tests. (Playwright treats below-the-fold elements as visible; `toBeVisible()` on `#work` passes. `toContainText` works regardless of opacity.) If a test fails, read the error before changing anything else.

- [ ] **Step 11: Commit**

```bash
git add src/components/Works.astro src/components/works/ src/pages/index.astro src/styles/global.css e2e/works.spec.ts
git commit -m "feat: build the Selected Works section (cards + SVG motifs)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Scroll-reveal + motion gating

Adds the shared reveal utility and the motion layer. Cards fade/rise in on scroll; under reduced-motion / no-JS they are fully visible and motifs freeze. Motifs idle until their card is in view.

**Files:**
- Create: `src/scripts/reveal.js`
- Modify: `src/components/Works.astro` (add a `<script>` that calls `initReveal`)
- Modify: `src/styles/global.css` (reveal CSS)
- Test: `e2e/works.spec.ts` (append two tests)

**Interfaces:**
- Consumes: `[data-reveal]` elements rendered by `WorkCard` (Task 2) and the `--reveal-delay` var set on each card.
- Produces: `initReveal(selector?='[data-reveal]'): void`. Adds `revealed` class to targets when in view; adds `js-reveal` to `<html>` only when JS + motion are available.

- [ ] **Step 1: Create the shared reveal utility**

Create `src/scripts/reveal.js`:
```js
// Shared scroll-reveal: fades [data-reveal] elements in as they enter the viewport.
// Reused across content sections (Works now; Thoughts/About/Contact later).
// Graceful: with no JS or reduced motion, content is shown immediately (never gated).
export function initReveal(selector = '[data-reveal]') {
  const els = Array.from(document.querySelectorAll(selector));
  if (!els.length) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('revealed'));
    return;
  }

  // Opt into the hidden initial state only now that JS + motion are confirmed.
  // (Targets here are below the fold, so this snap-to-hidden is never visible.)
  document.documentElement.classList.add('js-reveal');

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );
  els.forEach((el) => io.observe(el));
}
```

- [ ] **Step 2: Wire reveal into the Works section**

In `src/components/Works.astro`, add this `<script>` block at the very end of the file (after the `</style>`):
```astro
<script>
  import { initReveal } from '../scripts/reveal.js';
  initReveal();
</script>
```

- [ ] **Step 3: Add the reveal CSS to global.css**

Append to `src/styles/global.css`:
```css

/* scroll reveal — hidden initial state applies only when JS + motion opt in (.js-reveal on <html>) */
.js-reveal [data-reveal] {
  opacity: 0; transform: translateY(18px);
  transition: opacity .7s ease, transform .7s ease;
  transition-delay: var(--reveal-delay, 0s);
}
.js-reveal [data-reveal].revealed { opacity: 1; transform: none; }

/* motifs stay idle until their card is in view (off-screen cards cost nothing) */
[data-reveal]:not(.revealed) svg * { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .js-reveal [data-reveal] { opacity: 1; transform: none; transition: none; }
}
```

- [ ] **Step 4: Append the reveal + reduced-motion e2e tests**

Append to `e2e/works.spec.ts`:
```ts
test('cards are fully visible under reduced motion (not gated by the reveal)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const cards = page.locator('.work-card');
  await expect(cards).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    await expect(cards.nth(i)).toHaveCSS('opacity', '1');
  }
});

test('cards reveal to full opacity once scrolled into view', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const firstCard = page.locator('.work-card').first();
  await firstCard.scrollIntoViewIfNeeded();
  await expect(firstCard).toHaveCSS('opacity', '1');
});
```

- [ ] **Step 5: Run the full works e2e**

Run: `npx playwright test e2e/works.spec.ts`
Expected: PASS — all 5 tests (3 from Task 2 + 2 new). The reduced-motion test confirms cards aren't hidden behind the reveal; the scroll test confirms the reveal transition reaches opacity 1.

- [ ] **Step 6: Commit**

```bash
git add src/scripts/reveal.js src/components/Works.astro src/styles/global.css e2e/works.spec.ts
git commit -m "feat: scroll-reveal + motion gating for the Works section

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Full verification across breakpoints

**Files:** none (verification only).

- [ ] **Step 1: Run the full unit suite**

Run: `npm run test`
Expected: PASS — `heroLayout.test.js` and `works.test.js` all green.

- [ ] **Step 2: Run the full e2e suite**

Run: `npm run test:e2e`
Expected: PASS — all hero tests (incl. the page-wide horizontal-overflow sweep, which now also covers the Works section) plus all 5 works tests.

- [ ] **Step 3: Visual sweep (Playwright MCP)**

With `npm run dev` running, drive a browser to `http://localhost:4321/`, scroll to the Works section, and screenshot at widths **1920, 1440, 768, 390, 360**. Confirm against `docs/works-reference.html`:
- 2-column grid on desktop/tablet, 1-column at ≤640px; generous spacing; no overflow or clipped cards.
- Each card: top media band with its distinct motif animating slowly; clean text below; gold-accented metric; "View case study →" CTA.
- Hover (desktop) lifts the card, brightens the border, nudges the CTA arrow.
- The section background reads subtly distinct from the hero (warm-black gradient + faint grain), on-brand earth tones — no SaaS look, neon, or heavy shadows.

- [ ] **Step 4: Verify `prefers-reduced-motion`**

Emulate reduce (OS or devtools rendering emulation) and reload. Confirm all four cards are visible immediately (no fade-in gating) and every motif is frozen on a still frame.

- [ ] **Step 5: Stop the dev server**

Stop the background `npm run dev` process.

---

## Self-Review

**1. Spec coverage:**
- SVG/CSS per-card motifs → Task 2 Steps 1–4. ✓
- Top-media-band card layout → Task 2 Step 5 (`.work-media` + `.work-body`). ✓
- Architecture (Works/WorkCard/motifs/works.js/works.test.js/reveal.js) → Tasks 1–3. ✓
- Section frame (bg gradient + grain + heading + intro + grid) → Task 2 Step 6. ✓
- Glass card + hover + gold metric + visual-only CTA → Task 2 Step 5. ✓
- Four cards + content + distinct motifs → Task 1 data + Task 2 motifs. ✓
- Reveal + reduced-motion / no-JS visibility + smooth scroll + anchor → Task 2 Step 8, Task 3. ✓
- Testing (data invariants + render + CTA + overflow + reduced-motion + reveal) → Task 1, Task 2 Step 9, Task 3 Step 4. ✓
- Hero regression unchanged → Task 4 Steps 1–2. ✓

**2. Placeholder scan:** No "TBD/TODO/handle edge cases"; every code step shows full content. Placeholder *content* (metrics/tools) is intentional and labeled. ✓

**3. Type consistency:** `WORKS` entry shape and the `motif` key set are identical across `works.js`, `works.test.js`, and `WorkCard.astro`'s `MOTIF_COMPONENTS`. `data-reveal` / `--reveal-delay` / `revealed` / `js-reveal` names match between `WorkCard.astro`, `reveal.js`, and `global.css`. CSS class names (`.work-card`, `.work-media`, `.title`, `.tag`, `.metric`, `.cta`, `.works-title`, `.works-intro`) match between components and `works.spec.ts`. ✓

**Noted deviations from the spec (with rationale):**
- The spec said the in-view signal "starts the motif animation." Implemented via `[data-reveal]:not(.revealed) svg * { animation-play-state: paused }` so motifs idle off-screen and run once revealed — same intent. Under no-JS, cards never get `.revealed`, so motifs stay on a static still frame (acceptable graceful degradation, consistent with reduced-motion).
- Page-wide horizontal-overflow is fully guarded by the existing hero sweep (it loads the whole page); `works.spec.ts` adds a focused extremes check (2560/360) rather than duplicating the full sweep (DRY).
