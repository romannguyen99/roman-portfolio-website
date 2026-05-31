# CLAUDE.md

Always-loaded instructions for this repository. Keep tight; this file is read at the start of every session.

## 1. Project identity

Roman Nguyen's personal portfolio. A single-page, scroll-driven site.

**Design intent:** modern, cinematic, professional. Dark palette, an iridescent oil-slick orb that anchors the hero, a multilingual tagline that cycles, a minimal top-right nav that anchors to each scrolled section.

**Design source of truth:** [references/screenshots/](references/screenshots/) — `hero-frame-01.png` through `hero-frame-11.png` are the canonical hero reference. Match their aesthetic, not pixel-for-pixel layout. When proposing visual changes, cite specific frames.

**Design rationale:** [references/design-note.md](references/design-note.md) — written design notes (palette, type scale, motion language, section-by-section observations from monopo.vn). Read this when starting a visual step.

## 2. Tech stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript, `strict: true`
- **Styling:** Tailwind CSS v4 — palette and type scale centralized in the `@theme` block of `src/app/globals.css` (Tailwind v4 dropped the JS `tailwind.config.ts` in favor of CSS-first config)
- **Motion:** [Lenis](https://lenis.darkroom.engineering/) smooth scroll + [GSAP](https://gsap.com/) + ScrollTrigger
- **Hero orb:** custom WebGL fragment shader, mounted in a `<canvas>`, with a CSS gradient fallback for `prefers-reduced-motion` and WebGL-unavailable contexts
- **Content:** MDX files in `content/projects/` and `content/blog/`, typed frontmatter parsed at build time
- **Tests:** Vitest + @testing-library/react + jsdom
- **Lint/format:** ESLint (Next config) + Prettier
- **Deploy:** Vercel (preview URL per push, production on `main`)

## 3. Information architecture

One page, five vertical sections in order:

1. **Hero** — `#hero` — orb + rotating tagline + top nav
2. **Work** — `#work` — grid of project cards, click-through to MDX project pages
3. **Journal** — `#journal` — list of blog posts, click-through to MDX post pages
4. **About** — `#about` — bio, photo, capabilities
5. **Contact** — `#contact` — email, socials, optional form

The nav in the hero links to these IDs. Section IDs are the source of truth — change them here and in the nav together.

## 4. File structure

```
src/
  app/                  # Next.js App Router (layout, page, project/post routes)
  sections/             # Hero, Work, Journal, About, Contact — one folder each
  components/           # Reusable UI (nav, project-card, post-card, scroll-badge…)
  hooks/                # use-lenis, use-hero-entrance, use-reduced-motion…
  lib/                  # mdx loader, color tokens, motion helpers, env
  shaders/              # .glsl sources + TS bindings for the hero orb
content/
  projects/*.mdx        # frontmatter: title, summary, cover, year, role, tags, links
  blog/*.mdx            # frontmatter: title, summary, date, tags
references/screenshots/ # design source of truth (do not delete)
docs/superpowers/
  specs/                # per-step design docs (brainstorm output)
  plans/                # per-step implementation plans (writing-plans output)
```

## 5. Build order

Sequential. Each step is one brainstorm → spec → plan → subagent-exec → verify → commit loop. Tick off in this file as steps land.

- [x] **1. Scaffold** — Next.js 16 + TS + Tailwind v4 + Vitest + ESLint/Prettier; empty section stubs; CI-free local-only baseline
- [x] **2. Design tokens & typography** — palette (deep green/black + oil-slick accents), type scale, spacing scale, fonts (display + body), global CSS reset
- [x] **3. Hero orb shader** — WebGL fragment shader; iridescent oil-slick palette; sphere-projected UVs + fresnel; cinematic grain; CSS-gradient fallback; reduced-motion path
- [ ] **4. Hero entrance + nav** — orb mount-in, tagline cycle (English + Vietnamese), top-right nav anchors, scroll-down badge
- [ ] **5. Smooth scroll + section scaffolding** — Lenis provider, GSAP ScrollTrigger setup, empty section frames with anchor IDs
- [ ] **6. Work grid** — MDX project loader, card layout, hover/reveal motion, project detail route
- [ ] **7. Journal list** — MDX blog loader, list layout, post detail route, reading metadata
- [ ] **8. About section** — bio, photo treatment, capabilities, scroll-linked reveal
- [ ] **9. Contact section** — email + socials, optional form (with spam protection if added)
- [ ] **10. Polish + SEO + deploy** — OG images, sitemap, robots, metadata, Lighthouse pass, Vercel production deploy

## 6. Conventions

**Discipline**

- **TDD for non-visual logic** (MDX loader, hooks, utilities). Write the test first.
- **In-browser verification for any visual change.** Type checking and tests do not prove a shader, animation, or layout looks right. Open it in the browser before claiming done.
- **Verification before completion.** Run the command, look at the output, then assert success. Never claim "tests pass" without running them.

**Accessibility (non-negotiable baseline)**

- `prefers-reduced-motion`: orb falls back to a static gradient; GSAP/ScrollTrigger animations short-circuit to instant state
- Keyboard nav reaches every interactive element; visible focus rings
- Color contrast meets WCAG AA for body text
- Section landmarks (`<section>` + `aria-labelledby`), single `<h1>` on the hero

**Performance**

- Hero shader releases the WebGL context on unmount (the prior `ShaderOrb` work established this pattern — preserve it)
- Images via `next/image` with explicit dimensions
- No layout shift on font load (use `next/font` with `display: swap` or self-hosted with `size-adjust`)

**Design fidelity**

- After any significant visual change (new component, layout shift, motion tweak), take a Playwright screenshot and compare side-by-side with the closest reference frame in `references/screenshots/`. Do not mark a visual step done without this comparison.
- The reference frames are the aesthetic bar, not a pixel-perfect target — match the mood, palette, and spatial relationships.

**Responsive / mobile**

- Every component must be designed mobile-first. Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).
- Test at 375px (iPhone SE), 768px (tablet), 1440px (desktop) before marking any section done.
- Touch targets ≥ 44×44px. No horizontal overflow at any breakpoint.

**Scroll animation — required for every section**

- Every section (`#work`, `#journal`, `#about`, `#contact`) must have a scroll-triggered reveal animation using GSAP ScrollTrigger.
- Minimum: elements fade + translate-up into view as the section enters the viewport. Richer animations (stagger, clip-path, parallax) encouraged where they match the cinematic intent.
- All scroll animations must short-circuit to instant final state when `prefers-reduced-motion` is active.

**Code style**

- Functional components, hooks, no class components
- Co-locate component + test + styles in the same folder when more than one file
- Tailwind for layout/styling; only drop to CSS modules for true exceptions (e.g., shader canvas sizing)
- No comments that restate the code. Comments explain the **why** for non-obvious decisions only.

## 7. Workflow & commands

**Commands**

```bash
npm run dev      # next dev (http://localhost:3000)
npm run build    # production build
npm run start    # serve production build
npm run test     # vitest, single run
npm run test:watch
npm run lint
npm run typecheck
```

**Loop per build-order step**

1. `superpowers:brainstorming` — confirm intent, present design
2. Write spec → `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
3. `superpowers:writing-plans` — implementation plan → `docs/superpowers/plans/YYYY-MM-DD-<topic>.md`
4. `superpowers:subagent-driven-development` — execute with TDD + two-stage review
5. Browser verification (any visual change) + Playwright screenshot vs. reference frame comparison
6. `superpowers:verification-before-completion` before claiming done
7. Commit on `main`, push to `origin/main`
8. Tick the step in §5

**Git**

- Work happens on `main`. No feature branches, no worktrees for normal steps.
- Conventional-commit-ish style (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
- Push to `origin/main` after each step lands and is verified.

## 8. Out of scope (for now)

- i18n routing — the rotating Vietnamese/English tagline is presentational, not a routed locale
- Headless CMS — content lives in MDX in this repo
- Auth, comments, user accounts
- Analytics beyond a single privacy-respecting tracker (decide at step 10)
- E2E tests — Vitest unit/component coverage only until the site is feature-complete
