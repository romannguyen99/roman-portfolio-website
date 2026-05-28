# Hero Shader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hero's static SVG orb with a real-time WebGL fragment shader rendering a volumetric, fresnel-rimmed, iridescent oil-on-water orb, with an SVG fallback for no-WebGL/test environments.

**Architecture:** `gradient-orb.tsx` becomes a runtime dispatcher — it renders `<ShaderOrb>` (ogl + GLSL) when WebGL is available, else the extracted static `<GradientOrbFallback>` SVG. The shader runs on a fullscreen triangle, drawing a fake-3D sphere imposter lit by fresnel + a fixed key light, colored by an iridescent palette driven by 3D simplex noise, finished with a film-grain overlay. `hero.tsx` is untouched (still imports `<GradientOrb />`).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, ogl (WebGL), GLSL ES 1.00, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-05-28-hero-shader-design.md`

---

## File Structure

| File | Responsibility | Tested? |
|---|---|---|
| `src/lib/webgl.ts` | `isWebGLAvailable()` — one-shot WebGL support probe. | Unit |
| `src/lib/color.ts` | `hexToRgb()` — CSS hex token → normalized `[r,g,b]`. | Unit |
| `src/components/gradient-orb-fallback.tsx` | Extracted static SVG orb (no SMIL). No-WebGL / jsdom path. | Unit |
| `src/components/gradient-orb.tsx` | Dispatcher: WebGL → `<ShaderOrb>`, else `<GradientOrbFallback>`. | Unit |
| `src/shaders/orb.ts` | `ORB_VERT` + `ORB_FRAG` GLSL strings. | In-browser |
| `src/components/shader-orb.tsx` | ogl renderer + program + rAF lifecycle, resize, DPR cap, fade-in, reduced-motion single frame, visibility/intersection pause, cleanup. | In-browser |

**Why these boundaries:** The dispatcher and the two pure utils are deterministic and unit-testable in jsdom. The GLSL and the ogl lifecycle cannot run in jsdom (no WebGL), so they live in their own files and are verified in the running browser against `references/screenshots/` — the project's established pattern. Keeping the GLSL in a plain string module makes it swappable and keeps `shader-orb.tsx` focused on lifecycle.

**TDD note:** Tasks 1–4 follow strict red-green TDD. Tasks 5–6 (GLSL + ogl lifecycle) are write-then-verify-in-browser because WebGL has no jsdom test seam. Task 7 is the integration/verification pass.

---

## Task 1: Add the ogl dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install ogl**

Run: `npm install ogl`

Expected: `ogl` appears under `dependencies` in `package.json`, `package-lock.json` updated, exit code 0.

- [ ] **Step 2: Verify it imports under the bundler**

Run: `node -e "import('ogl').then(m => console.log(Object.keys(m).slice(0,6)))"`

Expected: prints an array including `Renderer`, `Program`, `Mesh`, `Triangle` (order may vary). If this errors, do not proceed — resolve the install first.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add ogl for the hero WebGL shader"
```

---

## Task 2: `hexToRgb` color util

Reads CSS hex tokens (`--color-bg` etc.) so the shader uses the design palette rather than hardcoded colors.

**Files:**
- Create: `src/lib/color.ts`
- Test: `src/lib/color.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/color.test.ts
import { describe, expect, it } from "vitest";
import { hexToRgb } from "./color";

describe("hexToRgb", () => {
  it("converts a 6-digit hex to normalized rgb", () => {
    expect(hexToRgb("#ffffff")).toEqual([1, 1, 1]);
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
  });

  it("handles a leading/trailing whitespace and no-hash input", () => {
    expect(hexToRgb("  ff0000 ")).toEqual([1, 0, 0]);
  });

  it("expands 3-digit shorthand", () => {
    expect(hexToRgb("#0f0")).toEqual([0, 1, 0]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/color.test.ts`
Expected: FAIL — "Failed to resolve import ./color" / `hexToRgb is not a function`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/color.ts
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/color.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/color.ts src/lib/color.test.ts
git commit -m "feat: add hexToRgb color util for shader uniforms"
```

---

## Task 3: `isWebGLAvailable` detection util

**Files:**
- Create: `src/lib/webgl.ts`
- Test: `src/lib/webgl.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/webgl.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { isWebGLAvailable } from "./webgl";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isWebGLAvailable", () => {
  it("returns false when no WebGL context is available (jsdom default)", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(isWebGLAvailable()).toBe(false);
  });

  it("returns true when a webgl context is returned", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as RenderingContext,
    );
    expect(isWebGLAvailable()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/webgl.test.ts`
Expected: FAIL — cannot resolve `./webgl` / `isWebGLAvailable is not a function`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/webgl.ts
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/webgl.test.ts`
Expected: PASS (2 tests).

Note: the first test mocks `getContext` to return `null` for both calls; the second returns a truthy object for the first call (`webgl2`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/webgl.ts src/lib/webgl.test.ts
git commit -m "feat: add isWebGLAvailable detection util"
```

---

## Task 4: Extract the static SVG fallback

Moves the current orb SVG into `gradient-orb-fallback.tsx`, frozen (no SMIL `<animate>`), and renames the export to `GradientOrbFallback`. This is the no-WebGL path.

**Files:**
- Create: `src/components/gradient-orb-fallback.tsx`
- Test: `src/components/gradient-orb-fallback.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/gradient-orb-fallback.test.tsx
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { GradientOrbFallback } from "./gradient-orb-fallback";

describe("GradientOrbFallback", () => {
  it("renders the static svg with amber and green gradient defs", () => {
    const { container } = render(<GradientOrbFallback />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("#orb-amber")).toBeTruthy();
    expect(container.querySelector("#orb-green")).toBeTruthy();
  });

  it("contains no SMIL animation elements (frozen)", () => {
    const { container } = render(<GradientOrbFallback />);
    expect(container.querySelector("animate")).toBeNull();
    expect(container.querySelector("animateTransform")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/gradient-orb-fallback.test.tsx`
Expected: FAIL — cannot resolve `./gradient-orb-fallback`.

- [ ] **Step 3: Write the implementation (extracted, frozen)**

```tsx
// src/components/gradient-orb-fallback.tsx
/**
 * Static SVG orb (design-note Option B), frozen — no SMIL animation.
 * Rendered when WebGL is unavailable (also the path jsdom selects under test).
 */
export function GradientOrbFallback() {
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
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      <rect width="100" height="100" fill="var(--color-bg)" />
      <g filter="url(#orb-distort)">
        <ellipse cx="55" cy="50" rx="48" ry="44" fill="url(#orb-amber)" />
        <ellipse cx="42" cy="58" rx="40" ry="42" fill="url(#orb-green)" />
      </g>
    </svg>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/gradient-orb-fallback.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/gradient-orb-fallback.tsx src/components/gradient-orb-fallback.test.tsx
git commit -m "feat: extract static SVG orb as GradientOrbFallback"
```

---

## Task 5: GLSL shader source

A standalone module exporting the vertex + fragment shader strings. Not unit-tested (no jsdom WebGL); verified in-browser in Task 7. The numeric constants here are a working baseline — they get tuned live against the screenshots.

**Files:**
- Create: `src/shaders/orb.ts`

- [ ] **Step 1: Write the shader module**

```ts
// src/shaders/orb.ts
// Fullscreen-triangle vertex shader (ogl Triangle provides `position`/`uv`).
export const ORB_VERT = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Fragment shader: fake-3D sphere imposter, fresnel + key light, iridescent
// palette driven by 3D simplex noise, cinematic grain. GLSL ES 1.00.
export const ORB_FRAG = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_bg;       // near-black
  uniform vec3 u_accent;   // amber
  uniform vec3 u_accent2;  // green

  // --- Ashima 3D simplex noise (webgl-noise, MIT) ---
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // IQ cosine palette for iridescence.
  vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d){
    return a + b * cos(6.28318 * (c * t + d));
  }

  float hash(vec2 p){
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main(){
    // aspect-corrected, centered coords; orb biased toward upper-right.
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= u_resolution.x / max(u_resolution.y, 1.0);
    vec2 p = (uv - vec2(0.45, 0.15)) / 1.15;

    float t = u_time * 0.05;
    float scale = 1.6;
    float distSq = dot(p, p);

    // film grain (used in both branches)
    float grain = (hash(vUv + fract(u_time)) - 0.5) * 0.06;

    // 1. edge noise distorts the discard boundary ONLY.
    float edgeNoise = snoise(vec3(p * scale, t)) * 0.05;
    if (distSq > (1.0 + edgeNoise)) {
      gl_FragColor = vec4(u_bg + grain, 1.0);
      return;
    }

    // 2. normal from a SEPARATELY CLAMPED value — never sqrt of a negative.
    float safeDistSq = min(distSq, 0.999);
    vec3 normal = normalize(vec3(p, sqrt(1.0 - safeDistSq)));

    // perturb the surface normal with the noise field (undulating surface).
    float n1 = snoise(vec3(p * scale, t));
    float n2 = snoise(vec3(p * scale * 2.0 + 10.0, t * 1.3));
    vec3 nrm = normalize(normal + 0.35 * vec3(n1, n2, 0.0));

    // fresnel rim (glassy edge).
    float fres = pow(1.0 - max(nrm.z, 0.0), 3.0);

    // fixed key light, upper-right.
    vec3 lightDir = normalize(vec3(0.6, 0.7, 0.8));
    float diff = max(dot(nrm, lightDir), 0.0);
    float spec = pow(max(dot(reflect(-lightDir, nrm), vec3(0.0, 0.0, 1.0)), 0.0), 24.0);

    // brand-tinted base, amber where noise is high, green where low.
    vec3 brand = mix(u_accent2, u_accent, clamp(0.5 + 0.5 * n2, 0.0, 1.0));
    vec3 color = mix(u_bg, brand, 0.4 + 0.6 * diff);
    color = mix(color, brand, fres);             // rim takes the amber/brand tone
    color += spec * u_accent * 0.6;              // specular highlight

    // subtle iridescence (oil-on-water).
    vec3 irid = palette(0.5 + 0.5 * n1 + fres * 0.5,
      vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
    color = mix(color, color * irid * 1.6, 0.25);

    // chromatic aberration near the rim.
    float ca = fres * 0.04;
    color.r += ca;
    color.b -= ca;

    // soft silhouette: fade into bg near the edge.
    float edge = smoothstep(1.0, 0.75, distSq);
    color = mix(u_bg, color, edge);

    color += grain;
    gl_FragColor = vec4(color, 1.0);
  }
`;
```

- [ ] **Step 2: Lint the new file**

Run: `npm run lint`
Expected: no errors for `src/shaders/orb.ts` (the `/* glsl */` template strings are plain strings to ESLint).

- [ ] **Step 3: Commit**

```bash
git add src/shaders/orb.ts
git commit -m "feat: add orb WebGL shader source (vertex + fragment)"
```

---

## Task 6: `ShaderOrb` ogl component

The ogl lifecycle. Cannot be unit-tested in jsdom (no WebGL, and `ResizeObserver`/`IntersectionObserver` are unimplemented). Verified in-browser in Task 7.

**Files:**
- Create: `src/components/shader-orb.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/shader-orb.tsx
"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { hexToRgb } from "@/lib/color";
import { ORB_FRAG, ORB_VERT } from "@/shaders/orb";

/**
 * WebGL orb (design-note Option A). Fullscreen-triangle fragment shader driven
 * by ogl. Pauses when offscreen or the tab is hidden; renders a single static
 * frame under prefers-reduced-motion. Fades in to avoid a black-canvas flash.
 */
export function ShaderOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new Renderer({
      canvas,
      alpha: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    const gl = renderer.gl;

    const css = getComputedStyle(document.documentElement);
    const program = new Program(gl, {
      vertex: ORB_VERT,
      fragment: ORB_FRAG,
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: [1, 1] },
        u_bg: { value: hexToRgb(css.getPropertyValue("--color-bg")) },
        u_accent: { value: hexToRgb(css.getPropertyValue("--color-accent")) },
        u_accent2: { value: hexToRgb(css.getPropertyValue("--color-accent-2")) },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      program.uniforms.u_resolution.value = [
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
      ];
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const startedAt = performance.now();
    let raf = 0;
    let running = false;
    let inView = true;
    let pageVisible = !document.hidden;

    const frame = (now: number) => {
      program.uniforms.u_time.value = (now - startedAt) / 1000;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(frame);
    };
    const play = () => {
      if (running || reduce || !inView || !pageVisible) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Paint one frame immediately (also the only frame under reduced motion),
    // then reveal the canvas.
    renderer.render({ scene: mesh });
    canvas.style.opacity = "1";

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) play();
      else pause();
    });
    io.observe(canvas);

    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) play();
      else pause();
    };
    document.addEventListener("visibilitychange", onVisibility);

    play();

    return () => {
      pause();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0,
        transition: "opacity 800ms ease",
      }}
    />
  );
}
```

- [ ] **Step 2: Lint and type-check**

Run: `npm run lint`
Expected: no errors for `src/components/shader-orb.tsx`. If ogl types complain about uniform value shapes, the array literals (`[1, 1]`, `[r,g,b]`) are valid ogl uniform values — do not switch to `Color` unless the build fails.

- [ ] **Step 3: Verify the production build compiles**

Run: `npm run build`
Expected: build succeeds (this confirms the ogl import + `"use client"` boundary work under Next 16 / Turbopack). Visual correctness is checked in Task 7.

- [ ] **Step 4: Commit**

```bash
git add src/components/shader-orb.tsx
git commit -m "feat: add ShaderOrb ogl lifecycle component"
```

---

## Task 7: Rewrite the dispatcher + browser verification

Turn `gradient-orb.tsx` into the dispatcher and confirm the whole thing renders correctly in a real browser.

**Files:**
- Modify: `src/components/gradient-orb.tsx` (full rewrite)
- Modify: `src/components/gradient-orb.test.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the dispatcher test**

```tsx
// src/components/gradient-orb.test.tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";

// Stub ShaderOrb so the dispatcher test never touches real WebGL/ogl.
vi.mock("./shader-orb", () => ({
  ShaderOrb: () => <div data-testid="shader-orb" />,
}));

import * as webgl from "@/lib/webgl";
import { GradientOrb } from "./gradient-orb";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GradientOrb dispatcher", () => {
  it("renders the SVG fallback when WebGL is unavailable", async () => {
    vi.spyOn(webgl, "isWebGLAvailable").mockReturnValue(false);
    const { container } = render(<GradientOrb />);
    await waitFor(() => {
      expect(container.querySelector("#orb-amber")).toBeTruthy();
    });
    expect(container.querySelector("[data-testid='shader-orb']")).toBeNull();
  });

  it("renders the shader when WebGL is available", async () => {
    vi.spyOn(webgl, "isWebGLAvailable").mockReturnValue(true);
    const { getByTestId } = render(<GradientOrb />);
    await waitFor(() => {
      expect(getByTestId("shader-orb")).toBeInTheDocument();
    });
  });

  it("renders the fallback on first paint before detection runs", () => {
    vi.spyOn(webgl, "isWebGLAvailable").mockReturnValue(true);
    const { container } = render(<GradientOrb />);
    // Synchronous first render is the fallback (detection runs in useEffect).
    expect(container.querySelector("#orb-amber")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/gradient-orb.test.tsx`
Expected: FAIL — current `gradient-orb.tsx` still renders the old inline SVG (no `isWebGLAvailable` seam / no shader swap), so the "renders the shader" case fails.

- [ ] **Step 3: Rewrite the dispatcher**

```tsx
// src/components/gradient-orb.tsx
"use client";

import { useEffect, useState } from "react";
import { GradientOrbFallback } from "@/components/gradient-orb-fallback";
import { ShaderOrb } from "@/components/shader-orb";
import { isWebGLAvailable } from "@/lib/webgl";

/**
 * Picks the orb renderer at runtime: WebGL shader when supported, static SVG
 * fallback otherwise. Detection runs in an effect so SSR and the first client
 * render both produce the fallback (no hydration mismatch); the shader swaps in
 * on the client and fades itself in.
 */
export function GradientOrb() {
  const [useShader, setUseShader] = useState(false);

  useEffect(() => {
    setUseShader(isWebGLAvailable());
  }, []);

  return useShader ? <ShaderOrb /> : <GradientOrbFallback />;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/gradient-orb.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full suite + lint + build**

Run: `npm test`
Expected: all tests pass (including the existing `hero.test.tsx`, which now renders the fallback path since jsdom has no WebGL).

Run: `npm run lint`
Expected: clean.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Browser verification against the references**

Run: `npm run dev`, open the home page in a browser. Confirm:
- The orb renders as a volumetric, fresnel-rimmed, iridescent sphere (compare to `references/screenshots/frame-03-hero.jpg`).
- It drifts slowly and continuously; no flickering black-square artifacts at the silhouette edge (the NaN guardrail is working).
- `Roman Nguyen` stays legible over the orb with no drop-shadow (adjust the `vec2(0.45, 0.15)` orb center / `brand`/`diff` mix in `orb.ts` if the bright bands wash out the headline).
- The canvas fades in (~800ms) with no black flash.
- DevTools → emulate `prefers-reduced-motion: reduce`: the orb shows a single static frame (no drift).
- Scroll the hero out of view, then return: rAF pauses/resumes (check via a temporary `console.count` in `frame` if needed, then remove it).
- Tune the baseline constants in `src/shaders/orb.ts` live until it matches the reference, then commit any changes.

- [ ] **Step 7: Commit**

```bash
git add src/components/gradient-orb.tsx src/components/gradient-orb.test.tsx
git commit -m "feat: dispatch hero orb to WebGL shader with SVG fallback"
```

- [ ] **Step 8: Mark step 3's shader upgrade done in CLAUDE.md**

Update the "Hero — Implemented Summary" / Build Order note in `CLAUDE.md` to record that the WebGL shader (Option A) now backs the orb via the `gradient-orb.tsx` dispatcher, with the SVG as fallback; scroll-grow remains deferred. Commit:

```bash
git add CLAUDE.md
git commit -m "docs: note hero WebGL shader upgrade in CLAUDE.md"
```

---

## Self-Review

**Spec coverage:**
- Dispatcher (WebGL vs fallback) → Task 7. ✓
- Static SVG fallback, frozen, jsdom path → Task 4. ✓
- ShaderOrb ogl lifecycle (renderer/program/triangle, rAF, resize, DPR cap, fade-in, cleanup) → Task 6. ✓
- Reduced-motion single static frame → Task 6 (`reduce` guard in `play`). ✓
- Performance: DPR ≤ 2, 2 octaves, IntersectionObserver + Page Visibility pause → Task 6 + shader. ✓
- Shader material: imposter normal, NaN guardrail, simplex noise, fresnel, key light, iridescent palette, chromatic aberration, grain → Task 5. ✓
- Colors from design tokens (not hardcoded) → Task 2 (`hexToRgb`) + Task 6 uniforms. ✓
- ogl dependency → Task 1. ✓
- Tests: dispatcher logic + fallback static → Tasks 4, 7. ✓
- Visual fidelity in-browser → Task 7 Step 6. ✓
- `hero.tsx` unchanged → confirmed (not in any modify list). ✓

**Placeholder scan:** No TBD/TODO; all code blocks are complete; no "add error handling" hand-waves.

**Type consistency:** `isWebGLAvailable()`, `hexToRgb()`, `GradientOrbFallback`, `ShaderOrb`, `ORB_VERT`/`ORB_FRAG`, and uniform names (`u_time`, `u_resolution`, `u_bg`, `u_accent`, `u_accent2`) match across the shader, the component, and the dispatcher.
