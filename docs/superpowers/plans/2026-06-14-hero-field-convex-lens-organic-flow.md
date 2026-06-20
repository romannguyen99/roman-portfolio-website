# Hero Field: Convex Lens + Organic Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the hero's shared-field shader read as a convex glass lens (sphere-refraction UV remap) and give the warm ribbon layered, organic, faster-evolving motion, per `docs/superpowers/specs/2026-06-14-hero-field-convex-lens-organic-flow-design.md`, without touching layout, typography, UI structure, breakpoints, load choreography, or cursor parallax.

**Architecture:** All changes are confined to the GLSL `FRAG` template string in `src/components/hero/heroField.js`. Two areas change:
1. `field()` — new shader-global ribbon-axis constants, a renamed/portable ribbon-coordinate variable, a second domain-warp noise layer, retimed drift/curve, and a centerline-undulation formula for the warm ribbon.
2. `main()` — the existing magnify/tangential-ring lens block (`prof`/`ring`/`k`/`Pt`) is replaced with a sphere-refraction UV remap (`N`/`Rf`/`radialOffset`/`edge`/`tangWeight`/`totalOffset`/`Pt`).

**Tech Stack:** Raw WebGL1 / GLSL ES 1.00 fragment shader, no Three.js. **Testing approach:** GLSL isn't unit-testable with Vitest. The existing Playwright test `e2e/hero.spec.ts` → `'canvas is sized and shader compiles without console errors'` is the regression guard — it fails if the shader fails to compile (the shader's `compile()` helper calls `console.error` on a compile failure, and the test asserts the console-error list is empty). Run this after every shader edit. Final visual verification happens at the breakpoints `CLAUDE.md` requires (1440, 1920, 768, 390, 360px).

---

### Task 1: Shader-global ribbon-axis constants + portable ribbon-coordinate rename

**Files:**
- Modify: `src/components/hero/heroField.js` (the `FRAG` template string — palette-constants block and the start of `field()`)

- [ ] **Step 1: Add `ribbonNormal` / `ribbonTangent` constants**

In the `FRAG` template string, find the `TEAL` palette constant followed by the `field()` doc comment:

```glsl
    const vec3 TEAL  = vec3(0.078,0.153,0.141); // #142724 smoky shadow tone

    // ===== ONE shared procedural field. p is in field space. =====
```

Replace with:

```glsl
    const vec3 TEAL  = vec3(0.078,0.153,0.141); // #142724 smoky shadow tone

    // ribbon axis: ribbonNormal measures ACROSS the ribbon, ribbonTangent runs ALONG it.
    // Precomputed literals (GLSL ES 1.00 does not guarantee normalize() in a const initializer).
    const vec2 ribbonNormal  = vec2(0.6247, 0.7809);  // normalize(vec2(0.80, 1.0))
    const vec2 ribbonTangent = vec2(-ribbonNormal.y, ribbonNormal.x);

    // ===== ONE shared procedural field. p is in field space. =====
```

- [ ] **Step 2: Rename `s` → `signedDistance` and apply the `olive` portability fix**

Find this block inside `field()`:

```glsl
      // directional ribbon coordinate (lower-left -> upper-right)
      float s = dot(q, normalize(vec2(0.80, 1.0)));

      // warm ribbon (its EDGE crosses the circle) and olive ribbon (lower-left) as smooth bands.
      // On portrait the cropped circle sits at a lower s, so shift/widen the warm band to read through it.
      float warmC = mix(1.78, 1.30, uMobile);
      float warmW = 0.46 + uMobile * 0.12;
      float warm  = smoothstep(warmW, 0.0, abs(s - warmC));
      float olive = smoothstep(0.55, 0.0, abs(s - 0.35));
```

Replace with:

```glsl
      // directional ribbon coordinate (lower-left -> upper-right)
      float signedDistance = dot(q, ribbonNormal);

      // warm ribbon (its EDGE crosses the circle) and olive ribbon (lower-left) as smooth bands.
      // On portrait the cropped circle sits at a lower signedDistance, so shift/widen the warm band to read through it.
      float warmC = mix(1.78, 1.30, uMobile);
      float warmW = 0.46 + uMobile * 0.12;
      float warm  = smoothstep(warmW, 0.0, abs(signedDistance - warmC));
      float olive = 1.0 - smoothstep(0.0, 0.55, abs(signedDistance - 0.35));
```

This is value-equivalent to the original — `olive` is rewritten in the portable `1.0 - smoothstep(0.0, edge1, x)` form (avoiding `smoothstep` with `edge0 >= edge1`, which is undefined per the GLSL spec). `warm`'s smoothstep is still in the old reversed form here; Task 4 rewrites it as part of the centerline-undulation change.

- [ ] **Step 3: Run the compile check**

Run: `npx playwright test e2e/hero.spec.ts -g "shader compiles"`
Expected: `1 passed`

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/heroField.js
git commit -m "refactor: portable smoothstep edges + ribbon-axis constants in hero shader"
```

---

### Task 2: Retime macro drift and shape evolution

**Files:**
- Modify: `src/components/hero/heroField.js` (`field()`)

- [ ] **Step 1: Speed up `drift` and `curve`**

Find:

```glsl
      vec2 drift = vec2(t*0.010, -t*0.006);          // slow L->R, slightly up (~33s feel)
      float curve = sin(t*0.1208);                   // secondary curvature ~52s
```

Replace with:

```glsl
      vec2 drift = vec2(t*0.018, -t*0.011);          // L->R, slightly up (~18s sweep)
      float curve = sin(t*0.20);                     // secondary curvature ~31s
```

- [ ] **Step 2: Run the compile check**

Run: `npx playwright test e2e/hero.spec.ts -g "shader compiles"`
Expected: `1 passed`

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/heroField.js
git commit -m "feat: speed up hero field drift and shape-evolution cycle"
```

---

### Task 3: Add a second domain-warp noise layer

**Files:**
- Modify: `src/components/hero/heroField.js` (`field()`)

- [ ] **Step 1: Add `w2` and combine into `q`**

Find:

```glsl
      // ONE low-frequency warp layer bends the ribbons so they curve, not stripe
      vec2 w = vec2(fbm(p*0.55 + drift + curve*0.30),
                    fbm(p*0.55 + drift*0.6 + 9.0)) - 0.5;
      vec2 q = p + w * 0.95;
```

Replace with:

```glsl
      // Layer 1: low-frequency domain warp bends the ribbons so they curve, not stripe
      vec2 w1 = vec2(fbm(p*0.55 + drift + curve*0.30),
                     fbm(p*0.55 + drift*0.6 + 9.0)) - 0.5;
      // Layer 2: single-octave noise layer adds organic, irregular flow
      vec2 w2 = vec2(
        vnoise(p*1.6 - drift*0.6  + 5.0),
        vnoise(p*1.6 + drift*0.36 + 21.0)
      ) - 0.5;
      vec2 q = p + w1 * 0.95 + w2 * 0.35;
```

`w2` is read by Task 4's centerline-undulation formula (`waveAmp`, `warmW` modulation) — leaving it here, unused until Task 4, is fine (GLSL ES 1.00 doesn't error on unused locals), but Task 4 should follow immediately so the field stays internally consistent.

- [ ] **Step 2: Run the compile check**

Run: `npx playwright test e2e/hero.spec.ts -g "shader compiles"`
Expected: `1 passed`

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/heroField.js
git commit -m "feat: layer a second domain-warp noise pass into the hero field"
```

---

### Task 4: Centerline undulation for the warm ribbon

**Files:**
- Modify: `src/components/hero/heroField.js` (`field()`)

- [ ] **Step 1: Add `alongRibbon`, `wave`, `waveAmp`, and rewrite `warm`**

Find (this is the block left by Task 1, Step 2):

```glsl
      // directional ribbon coordinate (lower-left -> upper-right)
      float signedDistance = dot(q, ribbonNormal);

      // warm ribbon (its EDGE crosses the circle) and olive ribbon (lower-left) as smooth bands.
      // On portrait the cropped circle sits at a lower signedDistance, so shift/widen the warm band to read through it.
      float warmC = mix(1.78, 1.30, uMobile);
      float warmW = 0.46 + uMobile * 0.12;
      float warm  = smoothstep(warmW, 0.0, abs(signedDistance - warmC));
      float olive = 1.0 - smoothstep(0.0, 0.55, abs(signedDistance - 0.35));
```

Replace with:

```glsl
      // directional ribbon coordinate (lower-left -> upper-right)
      float signedDistance = dot(q, ribbonNormal);   // measures ACROSS the ribbon — compared against warmC
      float alongRibbon    = dot(q, ribbonTangent);  // position ALONG the ribbon — wave phase varies with this

      // warm ribbon (its centreline undulates) and olive ribbon (lower-left) as smooth bands.
      // On portrait the cropped circle sits at a lower signedDistance, so shift/widen the warm band to read through it.
      float warmC = mix(1.78, 1.30, uMobile);
      float warmW = 0.46 + uMobile * 0.12;

      // layered traveling waves perturb the warm ribbon's centreline — organic, never a single sine stripe
      float wave =
          sin(alongRibbon * 1.4 + t * 0.9) * 0.65 +
          sin(alongRibbon * 2.6 - t * 1.6 + 1.3) * 0.35;
      float waveAmp = 0.16 + 0.10 * w2.x;            // noise-modulated amplitude breaks regularity

      float warm = 1.0 - smoothstep(
          0.0,
          warmW * (1.0 + 0.15 * w2.y),                // width also wobbles with noise
          abs(signedDistance - warmC - wave * waveAmp)
      );
      float olive = 1.0 - smoothstep(0.0, 0.55, abs(signedDistance - 0.35));
```

- [ ] **Step 2: Run the compile check**

Run: `npx playwright test e2e/hero.spec.ts -g "shader compiles"`
Expected: `1 passed`

- [ ] **Step 3: Visual sanity check**

Run: `npm run dev` (background, leave running for the rest of this plan)
Open `http://localhost:4321/` in a browser at 1440×900. Confirm the warm gold/ochre/bronze ribbon now visibly undulates and reshapes within a few seconds — not a single sliding band or a clean decorative sine stripe. This is expected even before Task 5 (lens) changes.

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/heroField.js
git commit -m "feat: animate the hero's warm ribbon with a traveling centerline wave"
```

---

### Task 5: Sphere-refraction lens distortion

**Files:**
- Modify: `src/components/hero/heroField.js` (`main()`)

- [ ] **Step 1: Replace the magnify/tangential-ring lens block with sphere-refraction**

Find:

```glsl
      // ===== circle = a region where the SHARED field's UVs are optically transformed =====
      float r    = distance(frag, uCenter) / uRadius; // 0 centre .. 1 edge .. >1 outside
      float prof = 1.0 - smoothstep(0.0, 1.0, r);     // 1 centre -> 0 at edge & beyond (magnify weight)
      float ring = smoothstep(0.12, 0.82, r) * (1.0 - smoothstep(0.82, 1.0, r)); // peaks near the edge
      float fR   = (uRadius / uRes.y) * scale;        // circle radius in field space
      vec2  rel  = P - cP;
      vec2  tang = normalize(vec2(-rel.y, rel.x) + 1e-6);
      float k    = 1.0 - 0.17 * prof;                 // magnify (sample smaller area inside)
      vec2  Pt   = cP + rel * k + tang * fR * 0.24 * ring;  // ribbons bend & travel AROUND the edge
                                                            // (==P outside: prof=ring=0, fully seamless)
      vec3 col = field(Pt);
```

Replace with:

```glsl
      // ===== circle = a region where the SHARED field's UVs are optically transformed =====
      const float IOR         = 1.42;          // glass index of refraction (range 1.3-1.5). Higher IOR = stronger bending.
      const float ETA         = 1.0 / IOR;      // refract() ratio, derived from IOR. Lower ETA = stronger bending.
      const float DEPTH_SCALE = 0.60;           // starting value; reduce first if a compressed annulus appears near the rim.

      float r    = distance(frag, uCenter) / uRadius; // 0 centre .. 1 edge .. >1 outside
      float fR   = (uRadius / uRes.y) * scale;        // circle radius in field space
      vec2  rel  = P - cP;
      vec2  tang = normalize(vec2(-rel.y, rel.x) + 1e-6);

      // sphere-refraction "glass ball" UV remap: central magnification, bending toward the edge
      vec3  N            = normalize(vec3(rel / fR, sqrt(max(1.0 - r*r, 0.0)))); // hemisphere normal
      vec3  Rf           = refract(vec3(0.0, 0.0, -1.0), N, ETA);
      vec2  radialOffset = Rf.xy * fR * DEPTH_SCALE;

      // edge falloff: seamless at r=1, but the lens still "hugs" the rim
      float edge = 1.0 - smoothstep(0.84, 1.0, r);

      // outer-band tangential flow: subtle "around the rim" accent only, refraction dominates
      float tangWeight  = smoothstep(0.45, 0.85, r);
      vec2  totalOffset = (radialOffset + tang * fR * 0.08 * tangWeight) * edge;

      vec2  Pt = cP + rel + totalOffset;  // ==P outside r=1: offset -> 0, fully seamless
      vec3 col = field(Pt);
```

- [ ] **Step 2: Run the compile check**

Run: `npx playwright test e2e/hero.spec.ts -g "shader compiles"`
Expected: `1 passed`

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/heroField.js
git commit -m "feat: replace hero lens distortion with sphere-refraction glass remap"
```

---

### Task 6: Lens verification and conditional tuning

This task is the spec's §1 "Implementation verification" — visual checks against the lens built in Task 5, with documented fallback edits to apply **only if** a check fails. With the dev server from Task 4 still running, view `http://localhost:4321/` at 1440×900 (the upper-right circle is the lens).

- [ ] **Step 1: Direction check**

Confirm the field seen through the lens looks **magnified** near the lens center (content appears slightly larger/zoomed-in than the surrounding field), with bending increasing toward the rim.

If instead the lens appears to shrink/zoom out the field, invert the radial offset. In `main()`, change:

```glsl
      vec2  radialOffset = Rf.xy * fR * DEPTH_SCALE;
```

to:

```glsl
      vec2  radialOffset = -Rf.xy * fR * DEPTH_SCALE;
```

- [ ] **Step 2: Monotonicity / annulus check near the rim**

Zoom into the lens rim (the outer ~15% of the circle, `r ≈ 0.84–1.0`). Confirm the ribbons flow smoothly through this band with no visibly compressed or stretched ring of color.

If a compressed/stretched annulus is visible, first reduce `DEPTH_SCALE` in `main()` from `0.60` to `0.45`:

```glsl
      const float DEPTH_SCALE = 0.45;           // reduced from 0.60 to fix a compressed annulus near the rim
```

If the annulus persists after that, additionally widen the edge falloff band from `0.84` to `0.78`:

```glsl
      float edge = 1.0 - smoothstep(0.78, 1.0, r);
```

Do not fix this with blur or a decorative rim — only `DEPTH_SCALE` and the edge falloff band.

- [ ] **Step 3: Vortex / seam / highlight check**

Confirm: (a) no spin/swirl/vortex read anywhere in the lens, (b) no visible circular seam or outline at the lens boundary (`r = 1`), (c) no bright highlight, glow, or reflection.

If a spin/vortex read remains, replace the tangential term with the flow-aligned fallback. In `main()`, change:

```glsl
      // outer-band tangential flow: subtle "around the rim" accent only, refraction dominates
      float tangWeight  = smoothstep(0.45, 0.85, r);
      vec2  totalOffset = (radialOffset + tang * fR * 0.08 * tangWeight) * edge;
```

to:

```glsl
      // outer-band tangential flow, projected onto the ribbon's flow direction to avoid a rotational read
      float tangWeight       = smoothstep(0.45, 0.85, r);
      float tangentAlignment = dot(ribbonTangent, tang);
      vec2  tangentialOffset = tang * tangentAlignment * fR * 0.08 * tangWeight;
      vec2  totalOffset      = (radialOffset + tangentialOffset) * edge;
```

- [ ] **Step 4: Run the compile check (only if Steps 1-3 made any edits)**

Run: `npx playwright test e2e/hero.spec.ts -g "shader compiles"`
Expected: `1 passed`

- [ ] **Step 5: Commit (only if Steps 1-3 made any edits)**

```bash
git add src/components/hero/heroField.js
git commit -m "fix: tune hero lens refraction depth, edge falloff, and tangential flow"
```

If no edits were needed in Steps 1-3, skip Steps 4-5 and proceed to Task 7.

---

### Task 7: Full visual + e2e verification across breakpoints

**Files:** none (verification only)

- [ ] **Step 1: Verify at desktop and tablet sizes**

With the dev server still running, open `http://localhost:4321/` and check at viewport widths **1440** and **1920** (desktop) and **768** (tablet):
- Lens reads as convex glass: central magnification, bending toward the edge, no vortex/spin, no seam, no highlight/glow.
- Warm ribbon visibly undulates/reshapes within a few seconds — layered/organic, not a sliding band or sine stripe.
- The dark pocket behind the "Roman Nguyen" headline still reads calm/readable — the extra motion lives in the field/lens, not the center.

- [ ] **Step 2: Verify at mobile sizes**

Check at viewport widths **390** and **360**:
- Same lens and flow confirmations as Step 1, on the cropped/portrait circle layout (`uMobile = 1.0`).
- At 360px, confirm the headline still stacks to two lines (`Roman` / `Nguyen`) and remains readable over the field.

- [ ] **Step 3: Verify `prefers-reduced-motion`**

Enable "reduce motion" (OS-level or via browser devtools rendering emulation) and reload `http://localhost:4321/`. Confirm the hero renders a single attractive frozen frame (no animation) — this exercises the `uReduced > 0.5 ? 20.0 : uT` branch, which all of Tasks 1-6's formulas (drift, curve, `w1`, `w2`, `wave`, `N`/`Rf`/`radialOffset`) remain continuous functions of, so no extra shader changes are needed for this to hold.

- [ ] **Step 4: Run the full e2e suite**

Run: `npm run test:e2e`
Expected: all tests pass, including `hero renders core UI`, `canvas is sized and shader compiles without console errors`, and the load-choreography tests.

- [ ] **Step 5: Stop the dev server**

Stop the background `npm run dev` process started in Task 4.
