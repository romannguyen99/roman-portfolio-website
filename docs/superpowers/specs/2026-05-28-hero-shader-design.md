# Hero Shader — Design Spec

**Status:** Approved pending spec review. Upgrades step 3's hero orb from SVG
(Option B) to the WebGL shader (design-note §5 Option A).

---

## What it is

The hero's background orb, re-rendered as a real-time WebGL fragment shader: a
volumetric, glassy, iridescent oil-on-water sphere drifting slowly against
near-black. It replaces the static SVG orb behind the `Roman Nguyen` headline.

Scope is bounded to the **ambient shader drift** only. The scroll-linked orb
growth (reference frame-01 → frame-03) remains **out of scope** — but the
shader is built to render the full frame-03 material so that the deferred
scroll-grow becomes a framing change, not a rewrite.

The orb is isolated behind a dispatcher so this is a contained swap: `hero.tsx`
keeps importing `<GradientOrb />` unchanged.

---

## Visual target

Reference frames in `references/screenshots/`:

- **frame-01** — the orb's "soft glow" framing (zoomed out, subtle).
- **frame-03** — the full glassy volumetric orb: spherical silhouette, dark
  refractive core, bright fresnel-rimmed edge, flowing amber/green iridescent
  bands, visible cinematic grain.

**Decision:** the **resting** hero state pulls the rich frame-03 look forward —
the glassy volumetric orb is what sits behind the headline at rest, not the
subtle frame-01 glow. Composition keeps the orb's darker refractive zone behind
the headline and biases the bright iridescent bands toward the edges, so the
headline stays legible **without a text drop-shadow** (drop-shadows on text are
a design-note anti-pattern).

---

## Files / boundaries

| File | Responsibility |
|---|---|
| `src/components/gradient-orb.tsx` | **Dispatcher.** WebGL available → `<ShaderOrb>`; no WebGL → `<GradientOrbFallback>`. Detects WebGL support once on mount. |
| `src/components/gradient-orb-fallback.tsx` | The current SVG orb, extracted here, frozen to a static frame (no SMIL). The no-WebGL path — also the path jsdom auto-selects under test. |
| `src/components/shader-orb.tsx` (`"use client"`) | The ogl component: canvas element + renderer/program/mesh + rAF lifecycle + observers. |
| `src/shaders/orb.frag.ts` | The GLSL fragment shader exported as a string (readable, swappable in isolation). A matching trivial vertex shader can live here too. |

`hero.tsx` is unchanged — it still renders `<GradientOrb />`.

---

## Renderer: ogl

Add `ogl` as a dependency (~10kb gzipped, design-note sanctioned, lines 95/171).
A single fullscreen triangle (not a quad) carries the fragment shader. ogl
handles the GL context, program compilation, and uniform plumbing with minimal
boilerplate, and exposes context-loss handling.

Integration with Next 16 / React 19 / Turbopack must be verified during
implementation (client-only import inside `useEffect`; the component is
`"use client"`).

---

## The shader (Option A material)

A fragment shader on a fullscreen triangle. The orb is rendered as a **fake-3D
sphere imposter** (Path A): 2D coordinates are projected onto a mathematical
sphere to recover a real surface normal, giving volume and something to light —
not a flat 2D-masked disc. (Path B — real sphere geometry with vertex
displacement — is reserved for if/when the deferred scroll-grow needs a true
rippling silhouette.)

**Uniforms:**

- `u_time` — seconds, advanced by the rAF loop.
- `u_resolution` — vec2, drawing-buffer size (for aspect correction).
- `u_bg`, `u_accent`, `u_accent2` — vec3 colors fed from the design tokens
  (`--color-bg`, `--color-accent`, `--color-accent-2`). Do not hardcode new
  colors in GLSL.

**Algorithm:**

1. **Coordinates.** Build aspect-corrected, centered coordinates `p` for the
   orb region (offset so the orb composes biased toward the upper-right, with a
   darker zone behind the headline).
2. **Distortion.** Sample 3D simplex noise (Ashima/`webgl-noise` GLSL snippet)
   at `vec3(p * scale, u_time * 0.05)` — extremely slow, viscous drift. Use it
   to perturb the surface normal and to undulate the silhouette edge.
3. **NaN guardrail (required).** The silhouette-edge noise and the normal
   calculation must be **decoupled**. Edge noise may push `dot(p, p) > 1.0`; if
   that value is fed into `sqrt(1.0 - dot(p,p))` it goes negative → `NaN` →
   flickering black-square artifacts on the edge. Therefore:

   ```glsl
   float distSq = dot(p, p);

   // 1. Noise distorts the discard boundary (alpha edge) only.
   float edgeNoise = snoise(vec3(p * scale, u_time * 0.05)) * 0.05;
   if (distSq > (1.0 + edgeNoise)) {
       discard;
   }

   // 2. Normal uses a separately clamped value — never sqrt of a negative.
   float safeDistSq = min(distSq, 0.999);
   vec3 normal = vec3(p, sqrt(1.0 - safeDistSq));
   // (normal is then perturbed by the noise field for the undulating surface)
   ```

4. **Lighting.** A fresnel term `pow(1.0 - normal.z, k)` (on the perturbed
   normal) brightens the rim → the glassy/metallic edge. A fixed key light from
   the upper-right adds the specular highlight; the left edge falls to shadow —
   matching the reference.
5. **Color (iridescence).** Mix `u_bg` (near-black refractive core), `u_accent`
   (amber), and `u_accent2` (green) via a cosine/parametric palette driven by
   the noise field and the fresnel term — producing oil-on-water bands, not flat
   radial stops. A subtle per-channel offset near the rim gives chromatic
   aberration.
6. **Grain.** A visible, tasteful cinematic film-grain overlay as the final
   pass (hash-based, animated by `u_time`). This is an aesthetic layer (the
   grain is clearly present in both reference frames) and also eliminates
   banding on the near-black gradient.

Exact centers, radii, `scale`, fresnel `k`, light direction, palette
coefficients, and grain intensity are **tuned live in-browser against the
screenshots** — the spec fixes the recipe, not the magic numbers.

---

## ogl component lifecycle (`shader-orb.tsx`)

On mount (inside `useEffect`, client-only):

1. Create the ogl `Renderer` bound to a `<canvas>` positioned `inset-0`,
   `width/height: 100%`, behind the hero content.
2. Build the `Program` (vertex + fragment shader) and a `Triangle` mesh; set
   initial uniforms.
3. Start a `requestAnimationFrame` loop advancing `u_time` and rendering.
4. Observe size with `ResizeObserver` → update canvas drawing-buffer size and
   `u_resolution`, with device-pixel-ratio capped at `min(devicePixelRatio, 2)`.
5. **Fade-in:** the canvas starts at `opacity: 0` and transitions to `1` over
   ~800ms once the first frame has painted, eliminating the WebGL black-canvas
   flash. Independent of the headline entrance.

**Cleanup on unmount:** cancel the rAF, disconnect observers, remove the
visibility/intersection listeners, and release the GL context
(`loseContext`).

---

## Fallback & reduced motion

- **WebGL available** → `<ShaderOrb>`.
  - If `prefers-reduced-motion: reduce` → render **one static frame** (no rAF
    loop, no time advance), so the reduced-motion experience still shows the
    rich orb, just frozen.
- **No WebGL support** → `<GradientOrbFallback>` (static SVG). This branch is
  also what jsdom selects under test, since jsdom has no WebGL — so existing
  hero tests keep passing with no WebGL mocking.

---

## Performance

- Device-pixel-ratio capped at `min(devicePixelRatio, 2)`.
- Noise limited to 2 octaves to keep fragment cost low.
- The rAF loop **pauses** when:
  - the hero scrolls out of the viewport (`IntersectionObserver` on the hero /
    canvas), and
  - the tab is hidden (Page Visibility API `visibilitychange`).
- Loop resumes when the hero is visible and the tab is foregrounded again.

---

## Page integration

No change to `hero.tsx`, `page.tsx`, the loader, or the entrance orchestration.
The orb is purely a background swap behind the existing headline + scroll badge.
The canvas fade-in is decoupled from the loader/headline timing.

---

## Testing (TDD)

Unit-test the logic; confirm visuals in-browser (the project's established
pattern for the loader and the SVG hero).

**Dispatcher (`gradient-orb.tsx`):**
- Renders `<GradientOrbFallback>` when WebGL is unavailable (mock the WebGL
  detection / `canvas.getContext`).
- Renders `<ShaderOrb>` when WebGL is available.
- (Reduced-motion behavior lives inside `<ShaderOrb>`; assert via mocked
  `matchMedia` that the loop is not started when reduce is set, if the seam is
  testable without a real GL context — otherwise verify in-browser.)

**Fallback (`gradient-orb-fallback.tsx`):**
- Renders the static SVG (no `<animate>`/`<animateTransform>` elements).

**Visual fidelity** (volumetric form, fresnel rim, iridescent bands, grain,
drift, legibility of the headline over the orb, the 800ms fade-in, no edge NaN
artifacts) is confirmed by driving the running app in a browser against
`references/screenshots/`, not by unit tests.

---

## Out of scope (later steps)

- Scroll-linked orb growth (frame-01 → frame-03) — a framing/uniform change on
  this shader, deferred.
- Path B real-geometry vertex displacement.
- Header / navigation (step 4), custom cursor (step 12).

---

## Dependencies

- Add `ogl` to `dependencies`.
