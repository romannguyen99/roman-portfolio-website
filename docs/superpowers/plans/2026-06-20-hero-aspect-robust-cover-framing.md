# Hero Aspect-Robust Cover-Fit Framing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the hero's procedural field frame consistently across aspect ratios (no thin-ribbon / empty-dark on wide desktop windows) using `background-size: cover` semantics anchored to the validated reference aspect.

**Architecture:** The field mapping moves from a height-anchored isotropic scale to a cover-fit zoom (`uFpp`) + vertical crop anchor (`uOy`). Following the codebase's existing `computeCircleLayout` convention, the math lives in a **tested pure function** `computeFieldFraming(W, H)` in `src/lib/heroLayout.js`; `resize()` derives the two uniforms and the shader simply applies them. This refines the approved spec's "shader-only" detail into the established tested-JS→uniform pattern — identical math and visual result, but the invariants (identity at/below aspect 1.6, headline pinned, zoom cap) become unit-testable, and the shader holds no duplicate formula.

**Tech Stack:** Raw WebGL (GLSL ES 1.00) in Astro, Vitest (unit), Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-06-20-hero-aspect-robust-cover-framing-design.md`

---

## File structure

- **Modify** `src/lib/heroLayout.js` — add `FIELD_SCALE` const + `computeFieldFraming(W, H)` pure function.
- **Modify** `src/lib/heroLayout.test.js` — add `computeFieldFraming` unit tests.
- **Modify** `src/components/hero/heroField.js` — import the helper, add `uFpp`/`uOy` uniforms (JS locations + GLSL declarations), set them in `resize()`, replace the field mapping in `main()`, remove the now-unused `float scale`.
- **Modify** `e2e/hero.spec.ts` — add a no-horizontal-overflow sweep guard.

---

### Task 1: Pure cover-fit framing function (TDD)

**Files:**
- Modify: `src/lib/heroLayout.js`
- Test: `src/lib/heroLayout.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/heroLayout.test.js`. Also update the import on line 2 to include the new symbols:

Change line 2 from:
```js
import { computeCircleLayout, capDpr, isMobile } from './heroLayout.js';
```
to:
```js
import { computeCircleLayout, capDpr, isMobile, computeFieldFraming, FIELD_SCALE } from './heroLayout.js';
```

Append this describe block to the end of the file:
```js
describe('computeFieldFraming', () => {
  const FOCAL_Y = 0.54; // must match the constant in heroLayout.js / the dark pocket

  it('identity at the reference aspect 1.6 (1440x900): m=1, Oy=0', () => {
    const { m, Oy } = computeFieldFraming(1440, 900);
    expect(m).toBeCloseTo(1, 6);
    expect(Oy).toBeCloseTo(0, 6);
  });

  it('identity for any aspect <= 1.6 (portrait 768x1024): no zoom, no crop', () => {
    const { m, Oy } = computeFieldFraming(768, 1024);
    expect(m).toBe(1);
    expect(Oy).toBe(0);
  });

  it('zooms in on wide windows (2560x1080): m = A0/aspect, < 1', () => {
    const { m } = computeFieldFraming(2560, 1080);
    expect(m).toBeCloseTo(1.6 / (2560 / 1080), 6); // ≈ 0.675
    expect(m).toBeLessThan(1);
  });

  it("pins the headline field-row across aspects: FOCAL_Y*scale*m + Oy === FOCAL_Y*scale", () => {
    for (const [W, H] of [[1440, 900], [1920, 1080], [2560, 1080], [1512, 712]]) {
      const { m, Oy } = computeFieldFraming(W, H);
      expect(FOCAL_Y * FIELD_SCALE * m + Oy).toBeCloseTo(FOCAL_Y * FIELD_SCALE, 6);
    }
  });

  it('caps the zoom at 1/MAX_ZOOM on extreme ultrawide (3840x1080)', () => {
    const { m } = computeFieldFraming(3840, 1080); // aspect ≈ 3.56 > 2.48 cap threshold
    expect(m).toBeCloseTo(1 / 1.55, 6); // ≈ 0.645 floor
  });

  it('m is monotonic non-increasing as aspect grows', () => {
    const aspects = [1.0, 1.6, 1.78, 2.12, 2.37, 3.0];
    const ms = aspects.map((a) => computeFieldFraming(a * 1000, 1000).m);
    for (let i = 1; i < ms.length; i++) {
      expect(ms[i]).toBeLessThanOrEqual(ms[i - 1] + 1e-9);
    }
  });

  it('FIELD_SCALE is the validated 1.40', () => {
    expect(FIELD_SCALE).toBeCloseTo(1.40, 6);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/heroLayout.test.js`
Expected: FAIL — `computeFieldFraming` / `FIELD_SCALE` are not exported (import error or "is not a function").

- [ ] **Step 3: Write the implementation**

Append to `src/lib/heroLayout.js` (after `isMobile`):
```js
// ---- Field framing (cover-fit across aspect ratios) ----
// Shared with the shader via the uFpp/uOy uniforms set in resize().
export const FIELD_SCALE = 1.40; // vertical field extent shown at the reference aspect

const A0 = 1.60;       // reference aspect the look was validated at (1440×900)
const MAX_ZOOM = 1.55; // cap zoom so super-ultrawide doesn't over-crop the ribbon
const FOCAL_Y = 0.54;  // anchor the vertical crop on the headline row (matches the dark pocket)

// Cover-fit framing. Identity at/below A0 (m=1, Oy=0 -> current look unchanged); on wider
// windows m<1 zooms the field in so the ribbon stays framed instead of revealing empty dark,
// cropping a sliver of the abstract field top/bottom. Oy keeps the headline's field-row fixed.
// fpp itself is derived in resize() from device-pixel height: fpp = (FIELD_SCALE / heightPx) * m.
export function computeFieldFraming(W, H) {
  const aspect = W / H;
  const m = Math.min(Math.max(A0 / aspect, 1 / MAX_ZOOM), 1);
  const Oy = FOCAL_Y * FIELD_SCALE * (1 - m);
  return { m, Oy };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/heroLayout.test.js`
Expected: PASS — all `computeCircleLayout`, `capDpr`, `isMobile`, and `computeFieldFraming` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/heroLayout.js src/lib/heroLayout.test.js
git commit -m "feat: add cover-fit field framing math (computeFieldFraming)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Wire the framing into the shader

**Files:**
- Modify: `src/components/hero/heroField.js` (import line 1; FRAG uniforms ~lines 14-16; `main()` ~lines 100-106 and the `fR` line ~114; JS uniform locations ~lines 185-187; `resize()` ~lines 191-202)

- [ ] **Step 1: Add the GLSL uniform declarations**

In the `FRAG` template string, find:
```glsl
    uniform float uReduced;  // 1.0 = freeze motion
    uniform float uMobile;   // 1.0 = portrait/mobile composition
```
Replace with:
```glsl
    uniform float uReduced;  // 1.0 = freeze motion
    uniform float uMobile;   // 1.0 = portrait/mobile composition
    uniform float uFpp;      // field units per device px (cover-fit isotropic zoom)
    uniform float uOy;       // vertical field-space offset (cover-fit crop anchor)
```

- [ ] **Step 2: Replace the field mapping in main()**

Find:
```glsl
    void main(){
      vec2 frag = gl_FragCoord.xy;
      float aspect = uRes.x / uRes.y;
      vec2 uv = frag / uRes;                          // 0..1, y from bottom
      float scale = 1.40;
      vec2 P  = vec2(uv.x*aspect, uv.y) * scale;      // field space
      vec2 cP = vec2((uCenter.x/uRes.x)*aspect, uCenter.y/uRes.y) * scale;
```
Replace with:
```glsl
    void main(){
      vec2 frag = gl_FragCoord.xy;
      float aspect = uRes.x / uRes.y;
      vec2 uv = frag / uRes;                          // 0..1, y from bottom
      // cover-fit field framing — uFpp (isotropic zoom) & uOy (vertical crop anchor) come from
      // computeFieldFraming() in resize(); identity at aspect<=1.6, zooms in when wider.
      vec2 P  = frag * uFpp + vec2(0.0, uOy);         // field space
      vec2 cP = uCenter * uFpp + vec2(0.0, uOy);
```

- [ ] **Step 3: Replace the circle field-radius line**

Find:
```glsl
      float fR   = (uRadius / uRes.y) * scale;        // circle radius in field space
```
Replace with:
```glsl
      float fR   = uRadius * uFpp;                    // circle radius in field space
```

- [ ] **Step 4: Update the JS import**

Change line 1 from:
```js
import { computeCircleLayout, capDpr, isMobile } from '../../lib/heroLayout.js';
```
to:
```js
import { computeCircleLayout, capDpr, isMobile, computeFieldFraming, FIELD_SCALE } from '../../lib/heroLayout.js';
```

- [ ] **Step 5: Add the uniform locations**

Find:
```js
  const uRes = U('uRes'), uT = U('uT'), uCenter = U('uCenter'),
        uRadius = U('uRadius'), uReduced = U('uReduced'), uMobile = U('uMobile');
```
Replace with:
```js
  const uRes = U('uRes'), uT = U('uT'), uCenter = U('uCenter'),
        uRadius = U('uRadius'), uReduced = U('uReduced'), uMobile = U('uMobile'),
        uFpp = U('uFpp'), uOy = U('uOy');
```

- [ ] **Step 6: Set the framing uniforms in resize()**

Find:
```js
    gl.uniform1f(uRadius, (D / 2) * dpr);
    gl.uniform1f(uMobile, isMobile(W) ? 1.0 : 0.0);
  }
```
Replace with:
```js
    gl.uniform1f(uRadius, (D / 2) * dpr);
    gl.uniform1f(uMobile, isMobile(W) ? 1.0 : 0.0);
    const { m, Oy } = computeFieldFraming(W, H);
    gl.uniform1f(uFpp, (FIELD_SCALE / canvas.height) * m); // canvas.height is device px
    gl.uniform1f(uOy, Oy);
  }
```

- [ ] **Step 7: Verify unit tests still pass (no behavior change there)**

Run: `npx vitest run`
Expected: PASS — all unit tests green (heroLayout unaffected by this task).

- [ ] **Step 8: Verify the shader still compiles (no GLSL/runtime errors)**

Run: `npx playwright test e2e/hero.spec.ts -g "shader compiles"`
Expected: PASS — canvas sized > 0 and zero console errors (the `scale`-removal + new uniforms compile cleanly). If it fails, read the console output for the GLSL log before changing anything else.

- [ ] **Step 9: Commit**

```bash
git add src/components/hero/heroField.js
git commit -m "feat: apply cover-fit framing in the hero shader via uFpp/uOy

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Regression guard + visual verification

**Files:**
- Modify: `e2e/hero.spec.ts`

- [ ] **Step 1: Write the failing overflow-sweep test**

Append to `e2e/hero.spec.ts`:
```ts
test('no horizontal overflow across the size sweep', async ({ page }) => {
  const sizes: [number, number][] = [
    [2560, 1080], [1920, 1080], [1512, 712], [1440, 900],
    [768, 1024], [390, 844], [360, 640],
  ];
  for (const [w, h] of sizes) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, `horizontal overflow at ${w}x${h}`).toBe(false);
  }
});
```

- [ ] **Step 2: Run the new test**

Run: `npx playwright test e2e/hero.spec.ts -g "no horizontal overflow"`
Expected: PASS — the cover-fit change is vertical-crop only and adds no width; this guard should pass immediately and lock the behavior against future regressions.

- [ ] **Step 3: Run the full e2e suite**

Run: `npx playwright test e2e/hero.spec.ts`
Expected: PASS — all existing hero tests plus the new guard.

- [ ] **Step 4: Visual sweep (manual, via Playwright MCP)**

With `npm run dev` running, drive a browser to the running URL and screenshot each size:
2560×1080, 1920×1080, 1512×712, 1440×900, 768×1024, 390×844, 360×640.

Acceptance criteria (compare against the pre-change `sweep-*.jpeg` baselines in the repo root):
- **1440×900 and all portrait sizes look identical** to the baseline (identity at aspect ≤ 1.6).
- **2560×1080 and 1512×712**: warm ribbon reads thick and framed (not a thin slash), empty near-black markedly reduced, the lens reads as part of the field rather than isolated in the corner.
- **Headline stays pinned** — its position and the dark pocket behind it do not drift between sizes.
- No visible stretch/smear of the ribbon or noise at any width.

If the lens still reads as "jammed in the corner" on 2560 after reframing, STOP and report it as the separate optional follow-up named in the spec — do not adjust `computeCircleLayout` here.

- [ ] **Step 5: Commit**

```bash
git add e2e/hero.spec.ts
git commit -m "test: guard against horizontal overflow across the size sweep

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-review notes

- **Spec coverage:** cover-fit mapping (Task 2), identity-at-A0 + headline-pin + zoom-cap invariants (Task 1 tests), no-overflow / visual framing (Task 3). `computeCircleLayout` left untouched per spec out-of-scope. ✓
- **Type consistency:** `computeFieldFraming(W, H) -> { m, Oy }` and `FIELD_SCALE` used identically in tests, `heroLayout.js`, and `heroField.js` `resize()`. Uniforms `uFpp`/`uOy` declared in GLSL, located in JS, and set in `resize()`. ✓
- **No placeholders:** every code/step is concrete. ✓
- **Deviation noted:** math placed in tested JS + uniforms (vs spec's "shader-only"), aligned with the `computeCircleLayout` convention; behavior identical. ✓
