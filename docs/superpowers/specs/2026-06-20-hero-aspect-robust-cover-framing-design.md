# Hero — Aspect-Robust "Cover-Fit" Field Framing

**Date:** 2026-06-20
**Milestone:** 1 (Hero) — refinement
**Status:** Approved (design), pending implementation plan

## Problem

On wide desktop windows the hero composition "looks off": the warm ribbon reads as a
thin diagonal slash, the circular lens feels jammed into the corner, and there's too
much empty near-black. The site *does* technically adapt (canvas resizes, no horizontal
overflow, headline scales/stacks) — verified live in Chromium from 280px to 2560px — so
this is a **framing** problem, not a resize bug.

Reported on Desktop Chrome/Edge. The user's own window (1512×712, aspect ≈ 2.12) already
sits well into the affected range.

## Root cause

In the fragment shader's `main()` (`src/components/hero/heroField.js`), the field is
mapped with an isotropic scale anchored to **height**:

```glsl
vec2 P  = vec2(uv.x*aspect, uv.y) * scale;   // == frag * (scale/uRes.y)
```

The vertical field extent shown is always `scale` (1.40); the horizontal extent is
`scale * aspect`. This is `background-size: cover` for tall/reference aspect ratios but
`background-size: contain` for **wide** ones — so widening the window simply reveals more
of the mostly-dark field with the single diagonal ribbon crossing it. The look was tuned
at aspect ≈ 1.6 (1440×900); everything wider just shows more emptiness.

The mapping is isotropic, so the ribbon's *thickness* actually tracks height — it only
*reads* as thin because it occupies a smaller fraction of an over-wide viewport.

## Goal

Make the field framing consistent across aspect ratios using `cover` semantics anchored
to the validated reference aspect, **without** redesigning the validated look and
**without** introducing any stretching/anisotropic distortion.

## Approach (chosen: A — Cover-fit)

Alternatives considered:

- **A — Cover-fit (chosen).** Reframe like `background-size: cover` around a reference
  aspect `A0`. Identity at/below `A0`; zoom in on wider windows to keep the ribbon
  framed and remove the empty dark, cropping a sliver of the (abstract) field. No
  stretching. Standard solution for art-directed full-bleed visuals.
- **B — Gentle aspect clamp/blend.** Smallest change, but compresses the field
  horizontally on wide screens → visible ribbon/noise stretch. Rejected: less principled,
  introduces distortion.
- **C — Per-aspect art direction via uniforms.** Hand-tune ribbon + lens per aspect band
  from JS. Rejected: many magic numbers, effectively re-tuning a locked visual, overkill.

## Design

The entire change lives inside the fragment shader's `main()` in
`src/components/hero/heroField.js`. **No JS, CSS, uniform, or `resize()` changes** —
`resize()` keeps passing `uRes / uCenter / uRadius / uMobile` as today.

Replace the height-anchored mapping (current lines ~104–106) with a single zoom factor
`m` and a vertical anchor `Oy` derived from aspect:

```glsl
const float A0       = 1.60;   // reference aspect the look was validated at (1440×900)
const float MAX_ZOOM = 1.55;   // cap zoom so super-ultrawide doesn't over-crop the ribbon
const float FOCAL_Y  = 0.54;   // anchor the crop on the headline row (matches the dark pocket)

float aspect = uRes.x / uRes.y;
float m   = clamp(A0 / aspect, 1.0 / MAX_ZOOM, 1.0); // 1.0 when aspect<=A0; <1 zooms in when wider
float fpp = (scale / uRes.y) * m;                    // isotropic field-units-per-pixel
float Oy  = FOCAL_Y * scale * (1.0 - m);             // shifts crop so the headline row stays fixed

vec2  P  = frag    * fpp + vec2(0.0, Oy);
vec2  cP = uCenter * fpp + vec2(0.0, Oy);
float fR = uRadius * fpp;
```

`scale` (1.40) is retained. All other uses of the old `P`, `cP`, `fR`, and `aspect`
downstream (refraction remap, `field()` sampling, lens contrast) stay as written and now
read the new values transparently.

### Derivation / invariants

- **Isotropic.** `fpp` is a single scalar applied to both axes → zero horizontal
  stretch/smear at any aspect.
- **Identity at/below A0.** For `aspect ≤ 1.6`: `m = 1`, `Oy = 0`, `fpp = scale/uRes.y`
  → byte-for-byte the current mapping. 1440×900 and **all** portrait/tall windows are
  unchanged. (Tall is already correct `cover`; the change only affects `aspect > 1.6`.)
- **Wide → zoom in.** For `aspect > A0`, `m = A0/aspect < 1` → the field zooms in,
  showing full width but cropping top/bottom. At 2560×1080: `m ≈ 0.68`, ~1.48× zoom,
  crops ~16% top / ~16% bottom of an abstract procedural field (invisible).
- **Headline pinned.** `Oy` is chosen so the field row under `FOCAL_Y` (the headline)
  maps to the same field coordinate at every aspect: the content behind the headline
  does not drift while resizing. Verified: headline field-row stays exactly `FOCAL_Y *
  scale * m + Oy = FOCAL_Y * scale` for all `m`.
- **X anchoring.** No horizontal offset (`Ox = 0`): full width is shown on wide screens,
  and the current tall composition (bottom-left anchored) is preserved exactly.
- **Continuous at the seam.** Both regimes agree at `aspect = A0` (`m = 1`, `Oy = 0`),
  so there is no visible jump when dragging across aspect 1.6.
- **Lens geometry untouched.** The circle is a screen-space region
  (`r = distance(frag, uCenter) / uRadius`); only the field sampled through it is reframed
  via the shared `fpp/Oy`, so it stays geometrically correct. The headline-darkening
  pocket and the vignette use `uv` directly → untouched.
- **MAX_ZOOM cap.** Prevents over-cropping the ribbon on 21:9/32:9 monitors; beyond the
  cap a little dark returns rather than clipping the ribbon. Reached at `aspect ≈ 2.48`.

## Out of scope (deliberate)

- **Circle px geometry** (`computeCircleLayout` in `src/lib/heroLayout.js`) is unchanged;
  its upper-right placement on ultrawide is per the locked spec. Expectation: the
  reframed, thicker field re-integrates the lens so it no longer reads as "jammed in a
  corner." If the visual sweep shows otherwise, raise as a separate optional follow-up —
  do not fold into this change.
- **Mobile composition** (`uMobile`, warm-band shift) is orthogonal and unchanged; it
  composes with the new framing automatically (mobile landscape benefits from the wide
  correction for free).
- `100svh` / dynamic-viewport behavior is not part of this change (the reported issue is
  desktop composition, not mobile fill).

## Verification

- **Visual sweep (Playwright):** 2560×1080, 1920×1080, 1512×712 (the user's window),
  1440×900, 768×1024, 390×844, 360×640. Before/after screenshots.
  - Assert ≤1.6-aspect sizes (1440×900, all portrait) are visually identical to current.
  - Assert wide sizes (2560, 1512×712) show a framed, thicker ribbon and reduced empty
    dark, with the headline visually pinned.
  - Assert no horizontal overflow at any size (`scrollWidth ≤ innerWidth`).
- **Shader compiles guard:** `npx playwright test e2e/hero.spec.ts -g "shader compiles"`.

## Risks

- Changing `A0` mis-tunes the reference; locked at 1.6 (validated). Low risk.
- Over-cropping on extreme ultrawide; mitigated by `MAX_ZOOM`. Low risk.
- Reduced-motion frozen frame uses the same `main()` path, so it inherits the fix with no
  extra work.
