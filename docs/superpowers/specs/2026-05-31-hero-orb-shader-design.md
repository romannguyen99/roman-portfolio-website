# Step 3 — Hero Orb Shader (Rebuild on R3F)

**Status:** draft, awaiting user review
**Date:** 2026-05-31
**Build-order step:** 3 of 10 (CLAUDE.md §5)
**Replaces:** the prior implementation at commit `1274fd6` (OGL + fullscreen-quad sphere imposter), now revisited in favor of React Three Fiber + a real 3D icosphere mesh.

## Goal

Land the hero's anchoring visual: an iridescent, slowly-drifting oil-on-water orb that fills ~75% of the hero viewport, rendered by a real Three.js mesh + custom GLSL material, embedded via React Three Fiber. Server-render a static SVG fallback so hydration matches and clients without WebGL see something on-palette. Reduced-motion freezes the orb at frame 0. Camera and key-light direction are React props from day one so step 4/5 can tween them.

## Non-goals (step 3)

- Hero entrance animation, tagline cycle, nav, scroll-down badge — step 4.
- Lenis + GSAP ScrollTrigger wiring — step 5.
- Scroll-driven orb zoom/rotation — step 5 (but the props are already wired to React state, so the change is `useScroll` + `useFrame`, not shader edits).
- Orb leakage into other sections (design-note §9b) — later step.
- Page loader (design-note §6) — TBD step.

## Decisions

1. **Rebuild fresh, not port-forward.** The prior implementation at `1274fd6` ran an OGL fullscreen-quad fragment shader doing sphere imposter math. We're using R3F + a real `<mesh>` instead.
2. **Renderer: React Three Fiber.** Bundle cost (~120 KB gz for three + R3F) is accepted in exchange for idiomatic React, a real scene graph (camera + lights as React props), and a clean path to scroll-driven scene mutations in later steps. `@react-three/drei` is deliberately **not** installed at step 3 — nothing here needs its utilities; reintroduce in a later step if/when something does.
3. **Geometry: real 3D icosphere with vertex displacement** (not the imposter). True geometric silhouette ripple; sets up step 5's scroll-warp without a rewrite.
4. **Material: custom `<shaderMaterial>` with hand-written GLSL.** drei's `<MeshDistortMaterial>` and `<MeshWobbleMaterial>` cannot produce iridescent oil bands; we need our own fragment shader. We bring in the prior shader's algorithm (lifted from `1274fd6`, lightly adapted) for the color pipeline.
5. **Lighting hybrid.** A real `<directionalLight>` is in the scene to act as the source of truth for key-light direction (so step 5 can tween it from React). The fragment shader still does its own Lambert + fresnel using the light direction as a uniform — Three's stock lighting can't produce the look.
6. **Fallback: SVG + radial gradients, frozen.** Direct port of the prior `gradient-orb-fallback.tsx`. Served on the server (always), under jsdom (always), and when WebGL is unavailable on the client.
7. **Crossfade the hydration swap.** When the client detects WebGL and mounts the canvas, the SVG fallback stays in the DOM underneath. The canvas fades in from `opacity: 0` to `1` over 300 ms once it has painted its first frame; the SVG stays at `opacity: 1` and is occluded by the opaque canvas. We do **not** unmount the SVG — keeping it mounted means a WebGL context loss / recovery causes no flash. This costs ~1 KB of inactive DOM and removes any chance of catching the exact frame where the renderer changes.
8. **No shader unit tests.** GLSL renders are validated visually via Playwright screenshots against `references/screenshots/hero-frame-*`. Unit tests cover pure functions and React surfaces only.

## Files

| Path | Action | Responsibility |
|------|--------|----------------|
| `src/sections/hero/index.tsx` | Modify | Replace `<h1>` stub with `<OrbStage />` mounted full-bleed inside the hero section. |
| `src/components/orb-stage.tsx` | Create | Client dispatcher. Always renders `<OrbFallback />` underneath. On WebGL-capable clients, additionally renders `<OrbCanvas />` overlaid on top, fading from opacity 0 to 1 over 300 ms once it has painted its first frame. |
| `src/components/orb-canvas.tsx` | Create | R3F `<Canvas>` host. Sets up perspective camera + directional light. Owns the `running` boolean (IntersectionObserver + visibilitychange + reduced-motion). Passes `running` into `<Orb />`. |
| `src/components/orb.tsx` | Create | The actual `<mesh>`: icosahedronGeometry + custom shaderMaterial bound to `u_time`, `u_resolution`, `u_bg`, `u_accent`, `u_accent2`, `u_lightDir`. `useFrame` advances `u_time` and calls `invalidate()`. |
| `src/components/orb-fallback.tsx` | Create | Static SVG, no SMIL. Ported from prior `gradient-orb-fallback.tsx` (see `git show 1274fd6:src/components/gradient-orb-fallback.tsx`). |
| `src/shaders/noise.glsl.ts` | Create | Ashima webgl-noise 3D simplex (MIT). Single source, included by both vert + frag. |
| `src/shaders/orb.vert.ts` | Create | Vertex shader: simplex displacement along normal, normal recomputed via central-difference, varyings out. |
| `src/shaders/orb.frag.ts` | Create | Fragment shader: oil iridescence + fresnel + key light + grain. |
| `src/lib/color.ts` | Create | `hexToRgb(hex: string): [number, number, number]` — port unchanged from `1274fd6:src/lib/color.ts`. |
| `src/lib/color.test.ts` | Create | Unit test for `hexToRgb` (`#rgb`, `#rrggbb`, with/without leading `#`, edge cases). |
| `src/lib/webgl.ts` | Create | `isWebGLAvailable(): boolean` — port unchanged from `1274fd6:src/lib/webgl.ts`. |
| `src/lib/webgl.test.ts` | Create | Verifies false under jsdom (no WebGL). |
| `src/hooks/use-reduced-motion.ts` | Create | `useReducedMotion(): boolean` via `useSyncExternalStore` for SSR-safe matchMedia. |
| `src/hooks/use-reduced-motion.test.tsx` | Create | matchMedia mock; SSR snapshot returns false; client respects the media query. |
| `src/components/orb-stage.test.tsx` | Create | Renders the fallback when `isWebGLAvailable` is mocked false; renders the canvas wrapper when true. No actual Three render under jsdom. |
| `package.json` | Modify | Add `three`, `@react-three/fiber`, `@types/three`. |

The prior files at commit `1274fd6` are not re-checked-out; they're treated as reference. New files are written fresh, lifting the proven sub-pieces (shader color pipeline, hexToRgb, WebGL detector, SVG fallback markup) directly.

## Architecture

### Dispatcher (`orb-stage.tsx`)

```tsx
"use client";
import { useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function OrbStage() {
  const useShader = useSyncExternalStore(
    subscribe,
    () => isWebGLAvailable(),
    () => false,
  );
  const [canvasReady, setCanvasReady] = useState(false);

  return (
    <div className="absolute inset-0">
      <OrbFallback /> {/* always mounted, always opacity 1, sits underneath */}
      {useShader ? (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: canvasReady ? 1 : 0 }}
        >
          <OrbCanvas onFirstFrame={() => setCanvasReady(true)} />
        </div>
      ) : null}
    </div>
  );
}
```

Server snapshot is always just the fallback. On the client, `useSyncExternalStore` returns `true` once WebGL is detected; the canvas overlay mounts at `opacity: 0`, and `<OrbCanvas>` calls `onFirstFrame` after its `useFrame` runs once. The 300 ms opacity transition then hides the exact moment the renderer changes — the eye sees a continuous oil-on-water surface, no flash. The fallback stays mounted forever so a future WebGL context loss/recovery cycle also has nothing to flash to.

### Canvas host (`orb-canvas.tsx`)

```tsx
<Canvas
  frameloop="demand"
  dpr={[1, 2]}
  camera={{ position: [0, 0, 2.4], fov: 45 }}
  gl={{ antialias: true, alpha: false }}
  style={{ position: "absolute", inset: 0 }}
>
  <color attach="background" args={[bg.r, bg.g, bg.b]} />
  <directionalLight ref={lightRef} position={[0.6, 0.7, 0.8]} intensity={1} />
  <Orb lightRef={lightRef} />
</Canvas>
```

`frameloop="demand"` plus a `useFrame(() => invalidate())` inside `<Orb>` gates rendering to: in-view, tab-visible, not reduced-motion. `<OrbCanvas>` owns the `running` state (driven by `IntersectionObserver` on the canvas DOM node, a `visibilitychange` listener on `document`, and the reduced-motion hook) and passes it as a prop into `<Orb>`, which short-circuits its `useFrame` accordingly. Simpler than threading observers into R3F's internal scheduler.

### The mesh (`orb.tsx`)

```tsx
function Orb({ running }: { running: boolean }) {
  const matRef = useRef<ShaderMaterial>(null);
  const { invalidate, size } = useThree();
  useFrame(({ clock }) => {
    if (!running || !matRef.current) return;
    matRef.current.uniforms.u_time.value = clock.elapsedTime;
    invalidate();
  });
  // resolution sync
  useEffect(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.u_resolution.value.set(size.width, size.height);
  }, [size.width, size.height]);
  // ...uniforms initialized from CSS tokens on mount via hexToRgb
  return (
    <mesh>
      <icosahedronGeometry args={[1, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={ORB_VERT}
        fragmentShader={ORB_FRAG}
        uniforms={...}
      />
    </mesh>
  );
}
```

64-subdivision icosphere ≈ 40k triangles. Plenty for a smooth low-frequency vertex displacement silhouette. No dynamic topology.

### Shaders

**Vertex** (`orb.vert.ts`):

```glsl
precision highp float;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vDisp;

uniform float u_time;

// snoise inlined from noise.glsl.ts via template-literal interpolation

void main() {
  float t = u_time * 0.15;
  // primary low-frequency displacement
  float n1 = snoise(position * 1.4 + vec3(0.0, 0.0, t));
  // secondary higher-frequency detail
  float n2 = snoise(position * 3.1 + vec3(t * 0.7, 0.0, 0.0));
  float disp = n1 * 0.18 + n2 * 0.06;

  vec3 displaced = position + normal * disp;

  // central-difference normal recompute
  float eps = 0.01;
  vec3 dx = vec3(eps, 0.0, 0.0);
  vec3 dy = vec3(0.0, eps, 0.0);
  float dxN = snoise((position + dx) * 1.4 + vec3(0.0, 0.0, t)) * 0.18;
  float dyN = snoise((position + dy) * 1.4 + vec3(0.0, 0.0, t)) * 0.18;
  vec3 newNormal = normalize(
    normal
    + (normal - normalize(normal + dx + dx * dxN)) / eps * 0.01
    + (normal - normalize(normal + dy + dy * dyN)) / eps * 0.01
  );

  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = normalize(mat3(modelMatrix) * newNormal);
  vDisp = disp;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
```

The central-difference normal block is intentionally explicit so the implementer can swap to a true analytic gradient later if banding shows up. Acceptable for low-amplitude noise.

**Fragment** (`orb.frag.ts`):

```glsl
precision highp float;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vDisp;

uniform float u_time;
uniform vec3 u_bg;
uniform vec3 u_accent;
uniform vec3 u_accent2;
uniform vec3 u_lightDir;
uniform vec3 cameraPosition; // provided by Three

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// snoise inlined

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(u_lightDir);

  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 24.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.5);

  float t = u_time * 0.05;
  float f1 = 0.5 + 0.5 * snoise(vWorldPos * 1.2 + vec3(0.0, 0.0, t));
  float f2 = 0.5 + 0.5 * snoise(vWorldPos * 2.5 + vec3(t * 0.9, 10.0, 0.0));

  vec3 pale = mix(u_accent, vec3(1.0), 0.4);
  vec3 mat = mix(u_accent2, u_accent, smoothstep(0.3, 0.75, f1));
  mat = mix(mat, pale, smoothstep(0.6, 0.95, f2) * 0.5);

  vec3 color = mix(u_bg, mat, 0.22 + 0.6 * diff);
  color = mix(color, mix(u_accent, pale, 0.5), fres * 0.6);
  color += spec * pale * 0.35;

  // grain — screen-space, not surface-space, so it looks like film
  vec2 screenUv = gl_FragCoord.xy / 1000.0;
  float grain = (hash(screenUv + fract(u_time)) - 0.5) * 0.06;
  color += grain;

  gl_FragColor = vec4(color, 1.0);
}
```

Color pipeline lifted from `1274fd6:src/shaders/orb.ts` lines 91–112 with the discard/edge-noise sphere imposter logic deleted (no longer needed — we have a real silhouette).

**Noise** (`noise.glsl.ts`): the Ashima webgl-noise `snoise(vec3)` implementation, MIT licensed. Lifted verbatim from `1274fd6:src/shaders/orb.ts` lines 21–73. Exported as a `const` string so vert + frag concatenate it via template literal:

```ts
export const ORB_FRAG = /* glsl */ `precision highp float;
${SNOISE_3D}
// ... rest of fragment shader
`;
```

### Lifecycle

| Concern | Mechanism |
|---|---|
| Frame loop | R3F `frameloop="demand"` + `useFrame` calls `invalidate()` each tick while running |
| Offscreen pause | `IntersectionObserver` on canvas DOM node → `running` state |
| Tab hidden pause | `document.visibilitychange` listener → `running` state |
| Reduced motion | `useReducedMotion()` → `running` is gated false; one initial frame still renders (so the SVG-like static look appears) |
| WebGL detection | `useSyncExternalStore` in dispatcher, server snapshot always false |
| Hydration swap | SVG fallback stays mounted; canvas overlays at `opacity: 0` and fades to 1 over 300 ms after `<Orb>`'s first `useFrame` fires (via `onFirstFrame` callback) |
| Context loss | Three's renderer handles `webglcontextlost` / `webglcontextrestored` internally; we do not call `forceContextLoss` (same lesson as the prior implementation). Because the SVG fallback never unmounts, a lost context is visually invisible — the SVG is just there underneath |
| Cleanup | R3F handles renderer disposal on `<Canvas>` unmount |

### Uniforms wiring

On `<Orb>` mount, read CSS tokens via `getComputedStyle(document.documentElement).getPropertyValue("--color-bg")` etc., pass through `hexToRgb` (returns `[r, g, b]` in 0..1), construct `THREE.Vector3` values for `u_bg`, `u_accent`, `u_accent2`.

`u_lightDir` reads the directional light's `position` ref each frame (cheap) — that keeps the lighting in sync if step 5 tweens the light. For step 3 the light is static so the value is constant.

`u_resolution` set on mount and on R3F's `useThree().size` change.

`u_time` advanced inside `useFrame`.

`cameraPosition` is provided automatically by Three for ShaderMaterial — we just declare the uniform; no JS plumbing.

## Reduced motion + fallback story

| Client | What renders |
|---|---|
| SSR | `<OrbFallback />` (SVG, frozen) — visible. |
| Client, no WebGL | `<OrbFallback />` — visible. No canvas overlay mounts. |
| Client, WebGL, reduced motion | `<OrbFallback />` underneath + `<OrbCanvas />` overlay, canvas renders one frame at `u_time = 0` then never again; canvas fades in over 300 ms (same crossfade path), then stays at opacity 1. |
| Client, WebGL, no reduced motion | `<OrbFallback />` underneath + `<OrbCanvas />` overlay, canvas drifts continuously while in-view + tab-visible; canvas fades in over 300 ms after first frame. |

The single-frame-then-freeze path means reduced-motion users still see the *richer* shader frame, not the SVG. This matches the prior implementation's choice and the spec note in CLAUDE.md §6 (reduced-motion → static gradient state, not necessarily the SVG fallback). The SVG fallback is always mounted as the underlay; the canvas is the overlay layer.

## Testing

Unit tests (Vitest):

- `src/lib/color.test.ts` — `hexToRgb("#000")`, `hexToRgb("#ffffff")`, `hexToRgb("0a0a0a")` (no `#`), invalid input handling.
- `src/lib/webgl.test.ts` — jsdom returns false (no canvas WebGL support).
- `src/hooks/use-reduced-motion.test.tsx` — mock `window.matchMedia`; assert SSR snapshot returns false; assert client value reflects the media query and updates on change event.
- `src/components/orb-stage.test.tsx` — mock `isWebGLAvailable`; assert fallback renders when false; assert canvas renders when true (we don't render the actual `<Canvas>` content — mock R3F's `<Canvas>` to a stub div, or just assert the dispatcher path).

No tests for:
- The shader strings (no meaningful assertion beyond presence).
- The `<Orb>` mesh and `<Canvas>` interior (jsdom has no WebGL; mocking three is too much code for too little signal).
- Visual correctness — handled by Playwright + reference frames.

Browser verification (Task 6 of the eventual plan):
1. `npm run dev`, navigate to `/`
2. Confirm orb fills the hero, no headline yet (it's a stub), no console errors
3. Watch for ~10 seconds — orb drifts continuously, palette feels like `hero-frame-03.png`
4. DevTools Performance: average frame ≥ 16ms is fine (≥60 fps target, ≥55 acceptable)
5. DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce" → reload; orb is frozen
6. DevTools → Rendering → "Emulate hardware" off, just resize: 1440, 768, 375 — all render correctly, no overflow
7. Playwright screenshots at 1440 / 768 / 375, save to `references/screenshots/hero-orb-{w}.png`
8. Side-by-side compare `hero-orb-1440.png` vs `hero-frame-03.png` — palette, depth, fresnel rim, grain all read in family

## Acceptance criteria

- `npm run lint && npm run typecheck && npm run test && npm run build` all green.
- `<OrbStage />` renders the SVG fallback under SSR/jsdom; renders `<OrbCanvas />` on a WebGL-capable client.
- Orb visible at `/` at all three breakpoints, no horizontal overflow.
- No console errors or React hydration warnings.
- Initial page load: the SVG fallback is visible immediately; the canvas fades in over 300 ms once it paints its first frame. No flash, no visible cut at the swap point (verify with a screen recording at 60 fps if needed).
- Drift is continuous on a fresh viewport, pauses when the page is scrolled past the orb (verify by scrolling to bottom and observing the perf timeline shows no GPU work), pauses when the tab loses visibility.
- Reduced-motion emulation freezes the orb at frame 0.
- Visual side-by-side against `references/screenshots/hero-frame-03.png` reads as the same effect (mood, palette, fresnel rim, grain — not pixel-identical).
- Screenshots `hero-orb-1440.png`, `hero-orb-768.png`, `hero-orb-375.png` committed under `references/screenshots/`.
- Step 3 ticked in CLAUDE.md §5, commit pushed to `origin/main`.

## Risks

- **Bundle size.** three + R3F adds ~120 KB gzipped. Step 10 (polish + SEO) will need to confirm Lighthouse perf stays acceptable.
- **Hydration race.** Mitigated by Decision 7: the SVG fallback never unmounts. The canvas overlays it and fades in over 300 ms after first frame. Risk reduces to "the 300 ms crossfade reads cleanly" — verify in the browser that the SVG palette is close enough to the shader's first frame that the fade is visually continuous, not a hard cut.
- **R3F + StrictMode double-mount.** Dev runs `<Canvas>`'s effect twice. Confirm the second mount doesn't leak GL contexts or stack memory. The fix, if needed: a stable key on `<Canvas>` and lifting state up so re-mount is cheap.
- **Vertex normal recomputation.** The central-difference approach in the vertex shader is approximate. If banding artifacts show up at the silhouette under low displacement amplitudes, we switch to an analytic gradient (snoise has one, just more code). Spec a swap, not a debug session.
- **Tailwind v4 + R3F in the same `<Canvas>` parent.** The canvas is absolutely positioned (`inset-0`) inside the hero section. Confirm Tailwind's preflight doesn't override the canvas's intrinsic styles — should be fine because we're using inline style on the canvas (controlled by R3F).
- **`cameraPosition` in shader.** Three injects this uniform for `ShaderMaterial` only when the material is attached to a mesh. We rely on this. Verify the uniform is populated; if not, pass it manually via `useFrame` from `useThree().camera.position`.

## Out of scope recap

- All step 4 / 5 / later concerns above.
- Performance budget enforcement beyond a sanity FPS check (formal budget is step 10).
