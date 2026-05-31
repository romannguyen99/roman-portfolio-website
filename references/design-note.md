# Design Notes — Portfolio Website

> Reference inspiration: monopo.vn (Tokyo-born creative studio).
> Reference frames live in `references/screenshots/`. Review them all before generating code.
> This document is the source of truth for design intent. When in doubt, follow this file over the screenshots.
> Last updated: 2026-05-30 — cross-referenced against live monopo.vn site via Playwright + all 11 hero frames.

---

## 1. Design Philosophy

The site should feel **quiet, confident, and cinematic**. Empty space is a feature, not a gap to fill. Motion is slow and deliberate — nothing bounces, nothing snaps. Every interaction should feel like it has weight.

Three rules that override everything else:

1. **Type leads. Imagery supports.** Oversized typography is the primary visual element. Backgrounds, gradients, and images sit behind the text and never compete with it.
2. **Black is the canvas.** The site is dark-first. Light surfaces appear only as deliberate contrast moments (case studies, contact).
3. **Motion has mass.** Animations are long (600–1200ms), eased, and never sudden. If it feels snappy, it's wrong.

---

## 2. Color System

Define these as CSS custom properties / Tailwind theme tokens.

```
--color-bg:        #0A0A0A   /* near-black, not pure black — softer on screens */
--color-bg-alt:    #141414   /* secondary surface */
--color-fg:        #F5F1EA   /* warm off-white for body text */
--color-fg-muted:  #8A8680   /* nav links, captions, secondary text */
--color-fg-dim:    #4A4742   /* dividers, disabled */
--color-accent:    #D4A574   /* warm amber/gold — pulled from hero gradient */
--color-accent-2:  #5C6B5E   /* desaturated green — secondary gradient tone */
```

The hero gradient palette (amber + dark green + black) is the **brand signature**. Reuse those exact tones in section transitions, hover states, and the loader. Do not introduce new colors without a reason.

---

## 3. Typography

**Primary typeface:** A geometric sans-serif with a true italic that has noticeably different letterforms (the italic `i`, `t`, and `o` in monopo's hero are key — they're stylistic, almost serif-like). Good free options:

- **Inter** with manual italic tweaks, OR
- **Neue Haas Grotesk** (paid), OR
- **General Sans** (free, on Fontshare) — recommended default

Pair with a small mono for captions / metadata: **JetBrains Mono** or **Geist Mono**.

**Type scale** (desktop, scale down ~30% on mobile):

```
display    clamp(4rem, 9vw, 9rem)     /* hero headline */
h1         clamp(3rem, 6vw, 6rem)     /* section openers */
h2         clamp(2rem, 4vw, 3.5rem)   /* sub-sections */
h3         1.5rem                      /* card titles */
body-lg    1.25rem                     /* lead paragraphs */
body       1rem                        /* default */
caption    0.75rem                     /* uppercase, tracked +0.1em */
```

**Always:**
- Line-height tight on display sizes (0.95–1.05), comfortable on body (1.5–1.7)
- Letter-spacing slightly negative on display (-0.02em), positive on captions (+0.1em uppercase)
- Mix roman and italic *within* phrases for stylistic accents — e.g. `Tokyo-born, Crea`*`tive stud`*`io`. This is the monopo signature.

---

## 4. Layout System

12-column grid, 24px gutter, max content width 1680px. Generous outer margins (clamp(2rem, 6vw, 8rem)). Sections breathe — minimum 160px vertical padding between sections on desktop, 96px on mobile.

**Header (fixed, transparent over hero):**
- Top-left: small dot/logo mark + wordmark + tag (`• monopo  saigon` style)
- Top-center: language switcher (small, muted, pipe-separated)
- Top-right: vertical-stacked nav links, right-aligned, uppercase, tracked, small (~12px). Items: `WORK`, `MANIFESTO`, `ABOUT`, `CONTACT` — adapt to your needs.

**Hero (100vh):**
- Full-bleed animated background (see Section 5)
- Headline centered vertically, slightly left of center horizontally
- Bottom-left: circular "SCROLL DOWN" badge rotating slowly (one full rotation every ~20s) with a small icon in the center

**Work grid:** Asymmetric grid — alternate large/small tiles, occasional full-width breakout. Never a uniform 3×3.

**Footer:** Oversized wordmark spanning full width, minimal links above it, small print at the very bottom.

---

## 5. The Hero Animation (most important element)

Recreate the feel of the reference frame: an organic, fluid, gradient orb floating against deep black, with bands of amber gold and desaturated green flowing across it like oil on water. The whole thing drifts slowly and continuously.

**Observed in detail across all 11 reference frames:**

- The orb is NOT a sphere — it's a large fluid, folded-silk shape that morphs continuously, like liquid metal or oil on dark fabric
- Colors (sample from frames): deep forest green `#1a2e20`, warm amber `#c49020`, dark olive `#6b5520`, rich gold edge `#d4a030`, teal hint `#1a3330`
- The orb fills 70–90% of the viewport; it IS the background, not an overlay
- Frames 01–03: orb centered/dominant, blob-like, wide. Frames 04–05: camera has pulled back — you can see the sharp curved glass-like rim edge that defines the orb boundary. Frames 05–11: orb tilted, you see a large curved parabolic arc (the orb's equator) cutting across the frame bottom-right
- This shifting perspective is scroll-driven: as the user scrolls through the hero, the "camera" zooms in/out and rotates the orb's orientation
- Grain overlay: subtle film grain on the entire canvas at ~15–20% opacity — adds texture and prevents the gradient from looking digital
- Specular highlights: there's a bright warm streak on the orb surface, plus a sharp-edged lighter rim where the surface curves away

**Implementation options, in order of preference:**

### Option A — WebGL GLSL fragment shader (implemented — this is the current approach)
The project already has `src/components/shader-orb.tsx` + GLSL in `src/shaders/`. The shader uses:
- Sphere-projected UV coordinates + Fresnel for the rim glow
- 3D Simplex noise driven by `u_time` for the organic morph
- Oil-palette color mix (amber + green + teal + dark)
- Cinematic grain pass on top
- Scroll-driven uniforms via GSAP ScrollTrigger to animate orb rotation/zoom as the user scrolls through the hero

### Option B — SVG + Framer Motion
If you want zero WebGL: a large blurred SVG `<radialGradient>` with two `<feTurbulence>` filters, animated via `<animate>` or Framer Motion's `motion.svg`. Lighter, less organic, still beautiful. This is the CSS gradient fallback for `prefers-reduced-motion`.

### Option C — Pre-rendered video loop
Last resort. Export a 10-second seamless loop from After Effects / Blender, autoplay muted, `object-fit: cover`. Easy but heavy (3–8MB).

**On top of the gradient:**
- Headline fades + slides up on load: opacity 0 → 1, y: 24px → 0, duration 1200ms, ease `[0.22, 1, 0.36, 1]` (custom cubic-bezier — the "expo out" curve)
- Stagger: split by word, 80ms between words
- Delay: starts ~600ms after the loader finishes
- Scroll-down badge fades in last, at 1800ms

**Tagline cycling (observed on live site):**
- Three phrases cycle with a cross-fade: `"Creative studio, Đến từ Tokyo"` → `"Tokyo-born, Creative studio"` → `"Hội tụ, Không giới hạn"` → loop
- Mix of English + Vietnamese within the same phrase — this bilingual blending is the signature
- Font treatment: certain letters (`t`, `i`, `o`) use a stylistic italic alternate that looks almost serif-like — this is a font feature (liga/calt), not manually placed HTML. Likely `font-feature-settings: "salt" 1` or a specific OTF italic
- Text position: lower-left of the viewport (roughly 60% down, 8% from left)

---

## 6. Page Loader

Before the hero appears: full-black screen, centered small logo mark, a thin horizontal progress line beneath it filling from 0–100% in ~1.5s. On complete, the loader fades out (400ms) and the hero animation starts.

This isn't decoration — it's a deliberate pacing device. It tells the visitor *slow down, this is going to take a moment*.

---

## 7. Motion Language

Use these tokens everywhere. Do not invent one-off durations.

```
--ease-out-expo:    cubic-bezier(0.22, 1, 0.36, 1)    /* the default — use this 90% of the time */
--ease-in-out:      cubic-bezier(0.65, 0, 0.35, 1)    /* for state changes */
--ease-linear:      linear                             /* only for continuous loops (orb drift, scroll badge) */

--duration-fast:    300ms   /* small UI: button hovers, tooltip */
--duration-base:    600ms   /* most transitions */
--duration-slow:    1000ms  /* section reveals, hero entrance */
--duration-xslow:   1400ms  /* loader, page transitions */
```

**Scroll behavior:** Use **Lenis** for smooth scrolling. Default lerp 0.08. Do not skip this — native scroll on dark animation-heavy sites feels jarring.

**Scroll-triggered reveals:** Every section element fades up on entering viewport: opacity 0→1, y: 40px→0, duration 1000ms, ease-out-expo. Trigger at 15% visible. Use Framer Motion's `whileInView` or **GSAP ScrollTrigger**.

**Hover states:**
- Nav links: color shifts from `--color-fg-muted` to `--color-fg` over 300ms, with a thin underline that draws from left to right
- Work tiles: image scales 1.0 → 1.04 over 800ms (slow!), title slides up from below with a subtle blur fade
- Buttons: background fills from left to right with the accent color

**Cursor:** Custom cursor — a small circle (10px) that scales up to 60px on hover over interactive elements, with a tiny "view" or arrow label appearing inside. Use **`react-magnetic`** or a custom hook. Hide on touch devices.

---

## 8. Section-by-Section Notes

**Section labels:** Every section opens with a small label, top-left: `→ Section Name`. Arrow glyph (→), space, then the label in regular weight, small (~12–13px), white. This is the consistent wayfinding pattern across the entire site.

**Work / Projects (`#works`):**
- Label: `→ Selected project`
- Dark, near-black background (no orb here)
- Two-column layout: large left image + right image side by side, roughly 60/40 split
- Images are cinematic, dark, moody atmospheric photography — they feel like film stills
- Project name bottom-left below the image pair: e.g. "Canada Goose — Nomad Collection" in regular weight body size
- Tags below: pipe/dot-separated disciplines — "Creative Direction · Video Production · Installation" — small, muted
- On scroll: images likely reveal with a clip-path or opacity entrance
- No hover color overlay — the images speak for themselves

**Manifesto / About (`#manifesto`):**
- Label: `→ Manifesto`
- Pure black background, no orb, no gradient
- Massive display type (~10–15% of viewport height) in a muted gray-white (NOT full `#fff` — more like `#aaa8a3`)
- Text: "We Integrate Collaborate, and Challenge. We are digital natives embracing the..." — runs across multiple viewport-height screens
- Each phrase is its own scroll beat — they reveal as you scroll, likely with GSAP ScrollTrigger scrub
- Effect: the text starts muted gray and brightens to white as it passes through the viewport center (per-word or per-line scrub)

**Team (`#team`):**
- Label: `→ Team`
- The orb's amber/gold glow re-appears as a large ambient light in the upper-left corner of this section — the orb leaks across section boundaries
- Team member portrait cards with large photography
- Portraits appear desaturated/dark; the orb glow provides the only color in the background

**Contact (`#contact`):**
- Pure dark background — does NOT switch to light. The light-background idea in this doc was wrong; monopo stays dark throughout
- Large display text "Keep in touch" (~h1 size) in muted gray — same treatment as the manifesto
- Sub-label: "Start a conversation" in small muted text
- Email address prominent and large: rendered in a warm amber → teal gradient (left to right color shift) — this is the one bold color moment in the footer
- "Our offices" grid below: 4 offices (Saigon, Tokyo HQ, London, New York) in a 2×2 grid, muted small text
- "Follow us" top-right of the contact area
- Very generous whitespace — lots of air around every element

---

## 9. Stack Recommendation

```
Framework:      Next.js 15 (App Router) + TypeScript
Styling:        Tailwind CSS v4 with custom theme tokens above
Animation:      Framer Motion (UI) + GSAP (scroll) + Lenis (smooth scroll)
Hero shader:    OGL or three.js with custom GLSL fragment shader
Fonts:          next/font with General Sans + JetBrains Mono
Deployment:     Vercel
```

---

## 9b. Orb Leakage Across Sections

A critical detail missed in the original notes: **the hero orb doesn't stop at the hero**. On the live site:
- The amber/gold glow of the orb appears as a large ambient bleed in the top-left corner of the Team section — as if the orb is still "there" just off-canvas
- This creates continuity across sections — the whole page feels unified by that same warm glow
- Implementation: the orb canvas can be fixed-position behind all sections, with CSS masking or opacity controlled by ScrollTrigger. Or: each section that needs the "glow bleed" gets a pseudo-element radial gradient matching the orb palette.

## 10. Anti-Patterns — Do NOT Do These

- ❌ Bright accent colors outside the amber/green palette
- ❌ Fast snappy animations (anything under 300ms for non-trivial elements)
- ❌ Bouncy easing curves (`easeInOutBack`, spring with high stiffness)
- ❌ Centered uniform grids for the work section
- ❌ Drop shadows on text — use color contrast instead
- ❌ Emojis or decorative icons in body content
- ❌ Auto-playing audio
- ❌ Modal popups for newsletter signups, cookies (use a thin inline bar)
- ❌ Light-mode toggle — the dark aesthetic is the brand
- ❌ Generic "hamburger to full-screen menu" — on mobile, keep the vertical nav visible or use a thin slide-in panel

---

## 11. Build Order (for Claude Code)

1. Project scaffold + fonts + theme tokens + Lenis setup
2. Page loader
3. Hero — start with Option B (SVG gradient) to get layout right, then upgrade to Option A (shader) once everything else works
4. Header + navigation
5. Work grid (with placeholder content)
6. About / Manifesto section
7. Contact section
8. Single case study page template
9. Page transitions between routes
10. Custom cursor + polish pass
11. Mobile responsive pass (do this last — desktop motion comes first)

Build one step at a time. Show the result before moving to the next.