# Hero Orb Shader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the hero's iridescent oil-on-water orb — a real Three.js icosphere with vertex displacement and a custom oil-iridescence fragment shader, hosted in React Three Fiber, with a server-rendered SVG fallback and a 300 ms canvas-over-SVG crossfade.

**Architecture:** Three-layer split — a server-safe SVG fallback (`<OrbFallback />`) always renders; a client dispatcher (`<OrbStage />`) detects WebGL and overlays a `<Canvas>` (`<OrbCanvas />`) which fades in over 300 ms after the orb mesh paints its first frame. The mesh is a 64-subdivision icosphere driven by a custom `<shaderMaterial>` whose uniforms are read from the Tailwind v4 design tokens (`--color-bg`, `--color-accent`, `--color-accent-2`) via `getComputedStyle` + `hexToRgb`. R3F runs in `frameloop="demand"` mode and pauses when offscreen, tab-hidden, or reduced-motion.

**Tech Stack:** Next.js 16 / React 19 / TypeScript strict, `three` + `@react-three/fiber` + `@react-three/drei`, Tailwind v4 design tokens (read at runtime via CSS custom properties), Vitest for pure functions + React surfaces, Playwright + reference frames for visual verification.

**Spec:** [docs/superpowers/specs/2026-05-31-hero-orb-shader-design.md](../specs/2026-05-31-hero-orb-shader-design.md)

---

## Pre-flight context

- The prior shader work at commit `1274fd6` (`src/components/shader-orb.tsx`, `src/shaders/orb.ts`, `src/lib/color.ts`, `src/lib/webgl.ts`, `src/components/gradient-orb-fallback.tsx`) is the **reference**, not the source. We rebuild fresh on R3F. The plan lifts the shader color pipeline, the Ashima 3D simplex noise, the SVG fallback markup, `hexToRgb`, and `isWebGLAvailable` directly from that commit — but rewrites the React surfaces.
- Tailwind v4 design tokens (`--color-bg: #0a0a0a`, `--color-accent: #d4a574`, `--color-accent-2: #5c6b5e`) live in `src/app/globals.css`. The shader reads them at runtime via `getComputedStyle(document.documentElement).getPropertyValue("--color-bg")`.
- Vitest is configured with `globals: true` in `vitest.config.ts` (no need to import `describe`/`it`/`expect`). Path alias `@` → `src/` works in both `tsconfig.json` and `vitest.config.ts`. jsdom is the test environment.
- The current `src/sections/hero/index.tsx` has an `<h1>Hero</h1>` placeholder. The `<h1>` belongs to step 4 (hero entrance + headline). Step 3 removes it.
- Project commits on `main` directly. Conventional commit prefixes (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`).

## File structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` to dependencies. |
| `src/lib/color.ts` | Create | `hexToRgb(hex: string): [number, number, number]` — 0..1 normalized. |
| `src/lib/color.test.ts` | Create | Unit tests for `hexToRgb` (3-digit, 6-digit, with/without `#`). |
| `src/lib/webgl.ts` | Create | `isWebGLAvailable(): boolean` — false in non-browser; true if `getContext("webgl2")` or `"webgl"` returns a context. |
| `src/lib/webgl.test.ts` | Create | Verifies false under jsdom. |
| `src/hooks/use-reduced-motion.ts` | Create | `useReducedMotion(): boolean` — SSR-safe via `useSyncExternalStore`. |
| `src/hooks/use-reduced-motion.test.tsx` | Create | matchMedia mock; SSR snapshot false; client respects media query. |
| `src/shaders/noise.glsl.ts` | Create | `export const SNOISE_3D: string` — Ashima webgl-noise 3D simplex. |
| `src/shaders/orb.vert.ts` | Create | `export const ORB_VERT: string` — vertex shader with simplex displacement + central-difference normal. |
| `src/shaders/orb.frag.ts` | Create | `export const ORB_FRAG: string` — fragment shader: oil iridescence + fresnel + grain. |
| `src/components/orb-fallback.tsx` | Create | Static SVG (no SMIL), reads CSS tokens via `var(--...)`. |
| `src/components/orb.tsx` | Create | The `<mesh>`: icosphere geometry + custom `<shaderMaterial>`. Owns `useFrame` time advance + first-frame callback. |
| `src/components/orb-canvas.tsx` | Create | R3F `<Canvas>` host. Owns `running` state (in-view + tab-visible + reduced-motion). |
| `src/components/orb-canvas.test.tsx` | Create | Smoke: renders without crashing under mocked R3F. |
| `src/components/orb-stage.tsx` | Create | Dispatcher: SVG always; canvas overlaid on WebGL clients with 300 ms opacity crossfade after `onFirstFrame`. |
| `src/components/orb-stage.test.tsx` | Create | Renders fallback only when WebGL unavailable; renders fallback + canvas overlay when available. |
| `src/sections/hero/index.tsx` | Modify | Replace `<h1>` stub with `<OrbStage />` mounted full-bleed inside a `relative` hero section. |
| `src/sections/hero/index.test.tsx` | Modify | Drop the `<h1>` assertion (deferred to step 4); add an assertion that `<OrbStage />` mounts inside. |
| `references/screenshots/hero-orb-1440.png` | Create | Verification screenshot at 1440. |
| `references/screenshots/hero-orb-768.png` | Create | Verification screenshot at 768. |
| `references/screenshots/hero-orb-375.png` | Create | Verification screenshot at 375. |
| `CLAUDE.md` | Modify | Tick step 3 in §5 build-order checklist after verification passes. |

---

## Task 1: Install R3F dependencies

**Files:**
- Modify: `package.json` (and `package-lock.json` as a side effect)

- [ ] **Step 1: Install the runtime + types deps**

Run:
```bash
npm install three @react-three/fiber
npm install --save-dev @types/three
```

Expected: package.json gains three entries; lockfile updates; no errors.

(The spec mentions `@react-three/drei` as a possible utility source. Skipping it for now — nothing in step 3 actually imports it, and shipping unused code burns bundle weight. Reintroduce in a later step if something there needs it.)

- [ ] **Step 2: Verify install + existing tests still pass**

Run: `npm run typecheck && npm run lint && npm run test && npm run build`
Expected: all four green. (The new deps add nothing to the runtime bundle yet because nothing imports them.)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add three, @react-three/fiber, @types/three"
```

---

## Task 2: hexToRgb utility (TDD)

**Files:**
- Create: `src/lib/color.ts`
- Create: `src/lib/color.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/color.test.ts`:

```ts
import { hexToRgb } from "./color";

describe("hexToRgb", () => {
  it("parses 6-digit hex with leading #", () => {
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#ffffff")).toEqual([1, 1, 1]);
  });

  it("parses 6-digit hex without leading #", () => {
    expect(hexToRgb("0a0a0a")).toEqual([10 / 255, 10 / 255, 10 / 255]);
  });

  it("expands 3-digit hex", () => {
    expect(hexToRgb("#0f0")).toEqual([0, 1, 0]);
    expect(hexToRgb("#abc")).toEqual([
      0xaa / 255,
      0xbb / 255,
      0xcc / 255,
    ]);
  });

  it("trims surrounding whitespace (CSS values often have it)", () => {
    expect(hexToRgb("  #d4a574  ")).toEqual([
      0xd4 / 255,
      0xa5 / 255,
      0x74 / 255,
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/color.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/color.ts`:

```ts
/** Convert a CSS hex string (e.g. "#0a0a0a", "#0f0") to normalized [r,g,b] in 0..1. */
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm run test -- src/lib/color.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/color.ts src/lib/color.test.ts
git commit -m "feat: hexToRgb util for shader color uniform plumbing"
```

---

## Task 3: WebGL availability detector (TDD)

**Files:**
- Create: `src/lib/webgl.ts`
- Create: `src/lib/webgl.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/webgl.test.ts`:

```ts
import { isWebGLAvailable } from "./webgl";

describe("isWebGLAvailable", () => {
  it("returns false in jsdom (no WebGL context)", () => {
    expect(isWebGLAvailable()).toBe(false);
  });
});
```

(jsdom never provides a WebGL context, so the jsdom case is the meaningful one to assert. The browser-positive path is verified manually in Task 13.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/webgl.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/webgl.ts`:

```ts
/** Probe for a usable WebGL context. Safe to call only in the browser. */
export function isWebGLAvailable(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") || canvas.getContext("webgl"),
    );
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- src/lib/webgl.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/webgl.ts src/lib/webgl.test.ts
git commit -m "feat: isWebGLAvailable detector for orb dispatcher"
```

---

## Task 4: useReducedMotion hook (TDD)

**Files:**
- Create: `src/hooks/use-reduced-motion.ts`
- Create: `src/hooks/use-reduced-motion.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/use-reduced-motion.test.tsx`:

```tsx
import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "./use-reduced-motion";

describe("useReducedMotion", () => {
  type Listener = (e: { matches: boolean }) => void;
  let listeners: Listener[];
  let matches: boolean;

  beforeEach(() => {
    listeners = [];
    matches = false;
    vi.stubGlobal("matchMedia", (q: string) => ({
      media: q,
      get matches() {
        return matches;
      },
      addEventListener: (_t: string, cb: Listener) => listeners.push(cb),
      removeEventListener: (_t: string, cb: Listener) => {
        listeners = listeners.filter((l) => l !== cb);
      },
      addListener: (cb: Listener) => listeners.push(cb),
      removeListener: (cb: Listener) => {
        listeners = listeners.filter((l) => l !== cb);
      },
      dispatchEvent: () => true,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns current matchMedia value", () => {
    matches = true;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("updates when the media query change event fires", () => {
    matches = false;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      listeners.forEach((cb) => cb({ matches: true }));
    });
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/hooks/use-reduced-motion.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/hooks/use-reduced-motion.ts`:

```ts
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/** SSR-safe hook for `prefers-reduced-motion: reduce`. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm run test -- src/hooks/use-reduced-motion.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-reduced-motion.ts src/hooks/use-reduced-motion.test.tsx
git commit -m "feat: useReducedMotion hook (useSyncExternalStore, SSR-safe)"
```

---

## Task 5: Shared noise GLSL

**Files:**
- Create: `src/shaders/noise.glsl.ts`

No unit test — this is a verbatim port of Ashima webgl-noise (MIT). The shader is exercised end-to-end in browser verification.

- [ ] **Step 1: Create the noise module**

Create `src/shaders/noise.glsl.ts`:

```ts
/**
 * Ashima webgl-noise 3D simplex noise (MIT).
 * Source: https://github.com/ashima/webgl-noise
 * Exported as a const string so the vertex and fragment shaders can both
 * `${SNOISE_3D}` it in via template literal interpolation.
 */
export const SNOISE_3D = /* glsl */ `
vec4 _snoise_permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}
vec4 _snoise_taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = _snoise_permute(_snoise_permute(_snoise_permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = _snoise_taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;
```

- [ ] **Step 2: Verify type check**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/shaders/noise.glsl.ts
git commit -m "feat: shared Ashima 3D simplex noise GLSL module"
```

---

## Task 6: Vertex shader

**Files:**
- Create: `src/shaders/orb.vert.ts`

- [ ] **Step 1: Create the vertex shader**

Create `src/shaders/orb.vert.ts`:

```ts
import { SNOISE_3D } from "./noise.glsl";

/**
 * Vertex shader: displace position along normal with two octaves of 3D
 * simplex noise; recompute the surface normal via central differences so
 * the fragment shader's lighting reflects the deformed geometry, not the
 * original sphere normal.
 *
 * Three.js auto-injects: position, normal, modelMatrix, viewMatrix,
 * projectionMatrix, modelViewMatrix, normalMatrix.
 */
export const ORB_VERT = /* glsl */ `
precision highp float;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vDisp;

uniform float u_time;

${SNOISE_3D}

// Displacement field — combine two octaves for surface variety.
float orbDisplace(vec3 p, float t) {
  float n1 = snoise(p * 1.4 + vec3(0.0, 0.0, t));
  float n2 = snoise(p * 3.1 + vec3(t * 0.7, 0.0, 0.0));
  return n1 * 0.18 + n2 * 0.06;
}

void main() {
  float t = u_time * 0.15;
  float disp = orbDisplace(position, t);
  vec3 displaced = position + normal * disp;

  // Central-difference normal recompute: sample the displacement field
  // along two tangent directions to the original sphere and reconstruct
  // a perturbed surface normal. Tangents are derived from any vector not
  // parallel to the normal — here we use the world up.
  float eps = 0.01;
  vec3 up = abs(normal.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(up, normal));
  vec3 bitangent = normalize(cross(normal, tangent));

  float dT = orbDisplace(position + tangent * eps, t) - disp;
  float dB = orbDisplace(position + bitangent * eps, t) - disp;
  vec3 perturbed = normalize(normal - tangent * (dT / eps) - bitangent * (dB / eps));

  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = normalize(mat3(modelMatrix) * perturbed);
  vDisp = disp;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;
```

- [ ] **Step 2: Verify type check**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/shaders/orb.vert.ts
git commit -m "feat: orb vertex shader — simplex displacement + central-diff normal"
```

---

## Task 7: Fragment shader

**Files:**
- Create: `src/shaders/orb.frag.ts`

- [ ] **Step 1: Create the fragment shader**

Create `src/shaders/orb.frag.ts`:

```ts
import { SNOISE_3D } from "./noise.glsl";

/**
 * Fragment shader: oil-on-water iridescence over a dark core, lit by a key
 * directional light + fresnel rim glow + spec highlight. Screen-space film
 * grain at the end to break up gradient banding.
 *
 * Three.js auto-injects: cameraPosition (built-in uniform for shaders
 * attached to a mesh).
 */
export const ORB_FRAG = /* glsl */ `
precision highp float;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vDisp;

uniform float u_time;
uniform vec3 u_bg;
uniform vec3 u_accent;
uniform vec3 u_accent2;
uniform vec3 u_lightDir;

${SNOISE_3D}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

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

  vec2 screenUv = gl_FragCoord.xy / 1000.0;
  float grain = (hash(screenUv + fract(u_time)) - 0.5) * 0.06;
  color += grain;

  gl_FragColor = vec4(color, 1.0);
}
`;
```

- [ ] **Step 2: Verify type check**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/shaders/orb.frag.ts
git commit -m "feat: orb fragment shader — oil iridescence + fresnel + grain"
```

---

## Task 8: SVG fallback component

**Files:**
- Create: `src/components/orb-fallback.tsx`

- [ ] **Step 1: Create the fallback**

Create `src/components/orb-fallback.tsx`:

```tsx
/**
 * Static SVG orb. Server-rendered always (so SSR/CSR match before WebGL
 * detection runs), client-rendered when WebGL is unavailable, and used as
 * the underlay beneath the canvas otherwise so the hydration swap can
 * cross-fade. No SMIL animation — this is a still frame.
 */
export function OrbFallback() {
  return (
    <svg
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 100 100"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <defs>
        <radialGradient id="orb-amber" cx="62%" cy="45%" r="55%">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.85" />
          <stop offset="55%" stopColor="var(--color-accent)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orb-green" cx="40%" cy="62%" r="50%">
          <stop offset="0%" stopColor="var(--color-accent-2)" stopOpacity="0.7" />
          <stop offset="60%" stopColor="var(--color-accent-2)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--color-accent-2)" stopOpacity="0" />
        </radialGradient>
        <filter id="orb-distort" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves={2}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={18}
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation={2.2} />
        </filter>
      </defs>

      <rect width={100} height={100} fill="var(--color-bg)" />
      <g filter="url(#orb-distort)">
        <ellipse cx={55} cy={50} rx={48} ry={44} fill="url(#orb-amber)" />
        <ellipse cx={42} cy={58} rx={40} ry={42} fill="url(#orb-green)" />
      </g>
    </svg>
  );
}
```

- [ ] **Step 2: Verify type check**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/orb-fallback.tsx
git commit -m "feat: OrbFallback — static SVG, server-safe, always mounted as crossfade underlay"
```

---

## Task 9: Orb mesh component

**Files:**
- Create: `src/components/orb.tsx`

The mesh + shader material. `useFrame` advances time and fires `onFirstFrame` exactly once. No jsdom unit test — jsdom can't render the mesh; correctness is verified in the browser.

- [ ] **Step 1: Create the mesh**

Create `src/components/orb.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { DirectionalLight, ShaderMaterial, Vector2, Vector3 } from "three";
import { hexToRgb } from "@/lib/color";
import { ORB_VERT } from "@/shaders/orb.vert";
import { ORB_FRAG } from "@/shaders/orb.frag";

type Props = {
  running: boolean;
  /** Called exactly once, after the orb's first render. */
  onFirstFrame: () => void;
  /** Source of truth for the key-light direction. Step 5 can tween this via R3F. */
  lightRef: RefObject<DirectionalLight | null>;
};

function readColorToken(name: string): Vector3 {
  if (typeof window === "undefined") {
    return new Vector3(0, 0, 0);
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const [r, g, b] = hexToRgb(value || "#000000");
  return new Vector3(r, g, b);
}

export function Orb({ running, onFirstFrame, lightRef }: Props) {
  const matRef = useRef<ShaderMaterial>(null);
  const { invalidate, size } = useThree();
  const firedRef = useRef(false);

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new Vector2(1, 1) },
      u_bg: { value: readColorToken("--color-bg") },
      u_accent: { value: readColorToken("--color-accent") },
      u_accent2: { value: readColorToken("--color-accent-2") },
      // Initialized to a sensible default; the per-frame update below pulls
      // the live position from the directional light in the scene.
      u_lightDir: { value: new Vector3(0.6, 0.7, 0.8) },
    }),
    [],
  );

  // Keep u_resolution in sync with the canvas size.
  useEffect(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.u_resolution.value.set(size.width, size.height);
  }, [size.width, size.height]);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uniforms.u_time.value = running ? clock.elapsedTime : 0;
    // Sync the key-light direction from the scene's <directionalLight>.
    // Cheap (~3 float copies) and means step 5 can tween the React prop on
    // <OrbCanvas> without touching shader code.
    const light = lightRef.current;
    if (light) {
      matRef.current.uniforms.u_lightDir.value
        .copy(light.position)
        .normalize();
    }
    if (!firedRef.current) {
      firedRef.current = true;
      onFirstFrame();
    }
    if (running) invalidate();
  });

  return (
    <mesh>
      <icosahedronGeometry args={[1, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={ORB_VERT}
        fragmentShader={ORB_FRAG}
        uniforms={uniforms}
      />
    </mesh>
  );
}
```

- [ ] **Step 2: Verify type check**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/orb.tsx
git commit -m "feat: Orb mesh — icosphere + custom shader material + first-frame callback"
```

---

## Task 10: Canvas host + lifecycle

**Files:**
- Create: `src/components/orb-canvas.tsx`
- Create: `src/components/orb-canvas.test.tsx`

`<OrbCanvas>` owns the `running` state and feeds it down to `<Orb>`. The smoke test verifies it mounts a canvas with a mocked R3F.

- [ ] **Step 1: Write the smoke test**

Create `src/components/orb-canvas.test.tsx`:

```tsx
import { render } from "@testing-library/react";

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: () => {},
  useThree: () => ({ invalidate: () => {}, size: { width: 0, height: 0 } }),
}));

vi.mock("./orb", () => ({
  Orb: () => <div data-testid="orb-mesh" />,
}));

import { OrbCanvas } from "./orb-canvas";

describe("OrbCanvas", () => {
  it("renders a Canvas with the Orb mesh inside", () => {
    const { getByTestId } = render(<OrbCanvas onFirstFrame={() => {}} />);
    expect(getByTestId("r3f-canvas")).toBeInTheDocument();
    expect(getByTestId("orb-mesh")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/orb-canvas.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/orb-canvas.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { DirectionalLight } from "three";
import { Orb } from "./orb";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type Props = {
  /** Called when the orb mesh paints its first frame. */
  onFirstFrame: () => void;
};

export function OrbCanvas({ onFirstFrame }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<DirectionalLight>(null);
  const reduce = useReducedMotion();
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(
    typeof document === "undefined" ? true : !document.hidden,
  );

  // Pause when the canvas leaves the viewport.
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const io = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // Pause when the tab loses visibility.
  useEffect(() => {
    const onChange = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  const running = inView && tabVisible && !reduce;

  return (
    <div
      ref={wrapperRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [0, 0, 2.4], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Source of truth for key-light direction. Orb reads its
            position into u_lightDir each frame; step 5 can tween. */}
        <directionalLight
          ref={lightRef}
          position={[0.6, 0.7, 0.8]}
          intensity={1}
        />
        <Orb running={running} onFirstFrame={onFirstFrame} lightRef={lightRef} />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- src/components/orb-canvas.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/orb-canvas.tsx src/components/orb-canvas.test.tsx
git commit -m "feat: OrbCanvas host — R3F Canvas + lifecycle (in-view + tab + reduced-motion)"
```

---

## Task 11: Dispatcher with crossfade

**Files:**
- Create: `src/components/orb-stage.tsx`
- Create: `src/components/orb-stage.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/orb-stage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/webgl", () => ({
  isWebGLAvailable: vi.fn(),
}));

vi.mock("./orb-canvas", () => ({
  OrbCanvas: ({ onFirstFrame }: { onFirstFrame: () => void }) => {
    // Fire immediately so we can assert the post-firstFrame state.
    queueMicrotask(onFirstFrame);
    return <div data-testid="orb-canvas" />;
  },
}));

vi.mock("./orb-fallback", () => ({
  OrbFallback: () => <div data-testid="orb-fallback" />,
}));

import { isWebGLAvailable } from "@/lib/webgl";
import { OrbStage } from "./orb-stage";

describe("OrbStage", () => {
  afterEach(() => {
    vi.mocked(isWebGLAvailable).mockReset();
  });

  it("renders only the SVG fallback when WebGL is unavailable", () => {
    vi.mocked(isWebGLAvailable).mockReturnValue(false);
    render(<OrbStage />);
    expect(screen.getByTestId("orb-fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("orb-canvas")).not.toBeInTheDocument();
  });

  it("renders both the SVG fallback and the canvas overlay when WebGL is available", () => {
    vi.mocked(isWebGLAvailable).mockReturnValue(true);
    render(<OrbStage />);
    expect(screen.getByTestId("orb-fallback")).toBeInTheDocument();
    expect(screen.getByTestId("orb-canvas")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/components/orb-stage.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/orb-stage.tsx`:

```tsx
"use client";

import { useState, useSyncExternalStore } from "react";
import { isWebGLAvailable } from "@/lib/webgl";
import { OrbCanvas } from "./orb-canvas";
import { OrbFallback } from "./orb-fallback";

const subscribe = () => () => {};
const getServerSnapshot = () => false;

/**
 * Hero orb dispatcher. The SVG fallback is always mounted as the underlay.
 * On WebGL-capable clients, the canvas overlays on top at opacity 0 and
 * fades to 1 over 300 ms once the orb mesh paints its first frame, so the
 * eye never catches the SVG-to-canvas swap.
 */
export function OrbStage() {
  const useShader = useSyncExternalStore(
    subscribe,
    () => isWebGLAvailable(),
    getServerSnapshot,
  );
  const [canvasReady, setCanvasReady] = useState(false);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <OrbFallback />
      {useShader ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: canvasReady ? 1 : 0,
            transition: "opacity 300ms ease",
          }}
        >
          <OrbCanvas onFirstFrame={() => setCanvasReady(true)} />
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm run test -- src/components/orb-stage.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/orb-stage.tsx src/components/orb-stage.test.tsx
git commit -m "feat: OrbStage dispatcher with SVG underlay + 300ms canvas crossfade"
```

---

## Task 12: Wire OrbStage into the hero section

**Files:**
- Modify: `src/sections/hero/index.tsx`
- Modify: `src/sections/hero/index.test.tsx`

- [ ] **Step 1: Update the test**

Replace the entire contents of `src/sections/hero/index.test.tsx` with:

```tsx
import { render, screen } from "@testing-library/react";

vi.mock("@/components/orb-stage", () => ({
  OrbStage: () => <div data-testid="orb-stage" />,
}));

import { Hero } from "./index";

describe("Hero section", () => {
  it("renders a region with id='hero' and accessible name 'Hero'", () => {
    render(<Hero />);
    const region = screen.getByRole("region", { name: "Hero" });
    expect(region).toHaveAttribute("id", "hero");
  });

  it("mounts the OrbStage inside the section", () => {
    render(<Hero />);
    expect(screen.getByTestId("orb-stage")).toBeInTheDocument();
  });
});
```

(The `<h1>` assertion is removed — the headline is step 4. The hero needs an accessible name for the region role; we keep that via `aria-label="Hero"` on the section.)

- [ ] **Step 2: Run tests, verify the new ones fail**

Run: `npm run test -- src/sections/hero/index.test.tsx`
Expected: the `<h1>` test is gone; the new "mounts the OrbStage" test FAILS because the section still has the placeholder.

- [ ] **Step 3: Update the hero component**

Replace `src/sections/hero/index.tsx` with:

```tsx
import { OrbStage } from "@/components/orb-stage";

export function Hero() {
  return (
    <section
      id="hero"
      aria-label="Hero"
      className="relative min-h-screen overflow-hidden"
    >
      <OrbStage />
    </section>
  );
}
```

(`relative` anchors the absolutely-positioned `<OrbStage />` children. `min-h-screen` gives the orb a full-viewport canvas to fill. `overflow-hidden` clips the SVG/canvas if they bleed at any breakpoint. `aria-label="Hero"` preserves the accessible name now that the `<h1>` is gone.)

- [ ] **Step 4: Run tests, verify pass**

Run: `npm run test -- src/sections/hero/index.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Run the full check**

Run: `npm run lint && npm run typecheck && npm run test && npm run build`
Expected: all green. The build emits `/` and `/specimen` routes.

- [ ] **Step 6: Commit**

```bash
git add src/sections/hero/index.tsx src/sections/hero/index.test.tsx
git commit -m "feat: mount OrbStage in hero section (drops the h1 stub, headline lands in step 4)"
```

---

## Task 13: Browser verification

**Files:**
- Create: `references/screenshots/hero-orb-1440.png`
- Create: `references/screenshots/hero-orb-768.png`
- Create: `references/screenshots/hero-orb-375.png`

The real proof. The orb is GLSL — only the browser can tell us it looks right.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: `Ready in <Xms>` at `http://localhost:3000`.

- [ ] **Step 2: Open `/` at 1440 and check the console**

Open `http://localhost:3000/` at 1440×900. Open DevTools.
Expected:
- Orb fills the hero section
- It drifts continuously (you can see noise bands flowing across the surface)
- No console errors (the missing-favicon 404 is acceptable; everything else must be zero)
- No React hydration warnings

- [ ] **Step 3: Confirm the crossfade**

Hard-reload (Cmd-Shift-R). Watch the first 500 ms carefully — you should see the SVG (slightly softer, no noise grain) briefly, then a smooth 300 ms fade as the canvas takes over. No hard cut. If you see a flash of black or a snap, the crossfade isn't wired right.

- [ ] **Step 4: Confirm offscreen/tab pause**

In DevTools Performance, start recording. Scroll the page to the bottom (past the hero). Stop recording. Expected: GPU work drops to near-zero once the orb leaves the viewport.

Then start recording again, switch to another tab for 2 seconds, switch back. Expected: zero GPU work while the tab was hidden.

- [ ] **Step 5: Confirm reduced-motion freezes the orb**

In DevTools → Rendering panel → "Emulate CSS media feature prefers-reduced-motion" → set to `reduce`. Reload. Expected: the orb shows a single static frame (the canvas has rendered once and stopped); no surface drift. Reset emulation when done.

- [ ] **Step 6: Visual side-by-side against the reference**

Open `references/screenshots/hero-frame-03.png` next to a screenshot of the live `/`. Confirm:
- Palette mood (dark core, amber + green bands)
- Fresnel rim on the orb edge
- Cinematic grain texture
- Overall depth/volume

This is a vibe match, not pixel-perfect. If the palette feels wrong, the most likely cause is the CSS-token read returned the wrong value — inspect the `<shaderMaterial>` uniforms in React DevTools.

- [ ] **Step 7: Capture Playwright screenshots at three breakpoints**

Use the Playwright MCP tools:
1. Resize to 1440×900, navigate to `http://localhost:3000/`, wait ~1s for the orb to settle, full-page screenshot to `references/screenshots/hero-orb-1440.png`.
2. Resize to 768×1024, reload, screenshot to `references/screenshots/hero-orb-768.png`.
3. Resize to 375×812, reload, screenshot to `references/screenshots/hero-orb-375.png`.

For each: assert `document.documentElement.scrollWidth === clientWidth` (no horizontal overflow).

- [ ] **Step 8: Stop dev server, run full check**

Stop `npm run dev`. Run: `npm run lint && npm run typecheck && npm run test && npm run build`
Expected: all four green.

- [ ] **Step 9: Commit the screenshots**

```bash
git add references/screenshots/hero-orb-1440.png references/screenshots/hero-orb-768.png references/screenshots/hero-orb-375.png
git commit -m "chore: capture hero orb screenshots at 1440 / 768 / 375"
```

---

## Task 14: Tick step 3 in CLAUDE.md and push

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Mark step 3 complete**

In `CLAUDE.md` §5, change:

```markdown
- [ ] **3. Hero orb shader** — WebGL fragment shader; iridescent oil-slick palette; sphere-projected UVs + fresnel; cinematic grain; CSS-gradient fallback; reduced-motion path
```

to:

```markdown
- [x] **3. Hero orb shader** — WebGL fragment shader; iridescent oil-slick palette; sphere-projected UVs + fresnel; cinematic grain; CSS-gradient fallback; reduced-motion path
```

- [ ] **Step 2: Commit and push**

```bash
git add CLAUDE.md
git commit -m "docs: mark step 3 (hero orb shader) complete"
git push origin main
```

---

## Acceptance recap (mirrors spec)

- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` all green.
- [ ] `<OrbStage />` renders only the fallback under SSR/jsdom and when WebGL is unavailable; renders the fallback underlay + canvas overlay on a WebGL-capable client.
- [ ] Orb visible at `/` at 1440 / 768 / 375 with no horizontal overflow.
- [ ] No console errors or React hydration warnings.
- [ ] Initial page load: the SVG fallback is visible immediately; the canvas fades in over 300 ms after first frame — no flash, no visible cut.
- [ ] Continuous drift while in-view + tab-visible; pauses when offscreen, when tab is hidden, and when `prefers-reduced-motion: reduce`.
- [ ] Visual side-by-side against `references/screenshots/hero-frame-03.png` reads as the same effect.
- [ ] Three screenshots committed under `references/screenshots/hero-orb-*.png`.
- [ ] Step 3 ticked in CLAUDE.md, commits pushed to `origin/main`.
