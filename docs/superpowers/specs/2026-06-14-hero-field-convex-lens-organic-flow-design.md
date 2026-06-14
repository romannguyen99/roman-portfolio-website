# Hero Field: Convex Lens + Organic Flow

## Context

Milestone 1 (the WebGL hero) is built and validated per `CLAUDE.md`. This is a
follow-up revision to the shared-field shader only — no changes to layout,
typography, UI structure, composition, breakpoints, or JS plumbing.

**Scope:** `src/components/hero/heroField.js`, specifically the `field()`
function and the lens-distortion block in `main()`.

**Goal:** the upper-right circle should read as a convex glass lens / snow
globe (curvature + refraction, not a flat circular mask), and the shared
field's flow should feel layered, organic, and clearly alive — replacing the
current near-linear, slow drift — without changing the overall dark,
minimal, earth-toned, cinematic character.

**Constraints carried over from `CLAUDE.md` and confirmed during
brainstorming:**

- One shared procedural field. The circle remains a distortion region of that
  field, never a separate object.
- No glossy highlight, fake shine, rim, or reflection. All "glass" feel comes
  from UV remapping of the existing field.
- Seamless at `r = 1` (no visible boundary/outline).
- Dark pocket behind the headline, global vignette, dither, and palette
  mixing logic are unchanged.
- Reduced-motion: still a single frozen frame using the existing fixed
  `t = 20.0` convention. All formulas below are continuous functions of `t`,
  so this remains valid.
- Performance: "modest increase" — restructure the existing noise budget and
  add at most one extra single-octave noise layer (2 extra `vnoise` taps).
  No finite-difference curl noise, no doubling of fbm calls.
- Load choreography and cursor parallax are CSS/JS-level and untouched.

---

## 1. Convex lens distortion

### Technique: sphere-refraction (primary) + outer-band tangential flow (secondary)

For a point inside the circle, with `r = dist(frag, uCenter) / uRadius ∈ [0,1]`
and `rel = P - cP` (field-space offset from the circle's field-space center):

```glsl
vec3 N  = normalize(vec3(rel / fR, sqrt(max(1.0 - r*r, 0.0))));  // hemisphere normal
vec3 Rf = refract(vec3(0.0, 0.0, -1.0), N, ETA);                  // ETA = 1.0/IOR, IOR ~1.45 (range 1.3–1.5)
vec2 radialOffset = Rf.xy * fR * DEPTH_SCALE;                     // DEPTH_SCALE starting ~0.9
```

This is the standard "glass sphere" UV-remap technique. Near `r = 0`, `N`
is close to `(0,0,1)` and the remap is close to a uniform scale change
("central magnification"). As `r` increases, `N` tilts and the refracted
ray's `xy` component grows and skews — i.e. **central magnification with
increasingly strong directional bending toward the outer region**. (Not
"strong magnification at center" — the magnification is the center's
character, the bending is the edge's character.)

### Edge falloff — seamless but "hugging"

```glsl
float edge = 1.0 - smoothstep(0.90, 1.0, r);   // narrower than the original 0.82–1.0 band
```

**`edge` must scale the entire offset (radial + tangential), not just the
tangential part.** At `r = 1`, `N` becomes purely in-plane and `Rf.xy` is
*not* zero — without `edge` applied to `radialOffset` too, there would be a
visible seam/discontinuity at the circle boundary. With `edge` applied to the
combined offset, the refraction term naturally grows right up to this band
before easing to zero, so the field hugs/wraps the rim in a tight ring while
remaining continuous with the undistorted field outside `r = 1`.

### Tangential term — secondary, outer-band only

```glsl
vec2  tang        = normalize(vec2(-rel.y, rel.x) + 1e-6);
float tangWeight  = smoothstep(0.45, 0.85, r);  // ~0 at center/mid, ramps up only in outer band
vec2  totalOffset = (radialOffset + tang * fR * 0.08 * tangWeight) * edge;
vec2  Pt = cP + rel + totalOffset;
```

`0.08` is ~3x smaller than the original `0.24`. Zero contribution below
`r ≈ 0.45` guarantees no vortex/spin artifact at the lens center — the
refraction term must dominate everywhere; the tangential term is a subtle
"flow travels around the rim" accent only.

### Implementation verification (do these explicitly, before tuning further)

1. **Direction check.** Confirm `radialOffset` bends sampling *inward*
   toward the lens center (i.e. produces magnification of the field seen
   through the lens). If the lens instead appears to shrink/push the field
   outward (zoom-out), **invert `radialOffset`** (negate `Rf.xy`, or flip the
   sign convention on the incident vector / `ETA`).
2. **Monotonicity check near the rim.** The mapping from screen radius `r` to
   sample radius must stay monotonic across `r ∈ [0,1]`. If a compressed or
   "pinched" ring appears near the edge, **reduce `DEPTH_SCALE` first**, and
   if needed **widen the edge falloff band** (e.g. `smoothstep(0.85, 1.0, r)`)
   to give the remap more room to ease back to identity. Do not paper over
   pinching with blur or a decorative rim.
3. Visually confirm: no vortex/spin read, no visible seam at `r = 1`, no
   highlight/glow anywhere in the lens.

---

## 2. Organic, layered flow

### Differential time scales

Speeding everything up uniformly reads as "busy" rather than cinematic.
Instead:

| Motion | Current | New | Notes |
|---|---|---|---|
| Macro drift | `vec2(t*0.010, -t*0.006)` (~33s sweep) | `vec2(t*0.018, -t*0.011)` (~18s sweep) | ~1.8x — moderately faster |
| Shape evolution (`curve`) | `sin(t*0.1208)` (~52s period) | `sin(t*0.20)` (~31s period) | ~1.7x — medium-fast |
| Local centerline undulation | none | periods ~7s and ~4s | clearly faster than macro |
| New small-scale noise layer | none | tied to `drift*0.6` | smooth/slow, not flickery |

### Layer 1 — existing domain warp, retimed

Same fbm-based warp as today (`w1`), just driven by the new `drift`/`curve`
values above. No structural change.

### Layer 2 — new single-octave noise layer (modest addition)

```glsl
vec2 w2 = vec2(
  vnoise(p*1.6 - drift*0.6  + 5.0),
  vnoise(p*1.6 + drift*0.36 + 21.0)
) - 0.5;

vec2 q = p + w1 * 0.95 + w2 * 0.35;
```

Single `vnoise` calls (not `fbm`) — 2 extra noise taps total, in line with
the "modest increase" budget.

### Centerline undulation

Geometry, named by role (so the wave is applied along the correct axis):

```glsl
vec2  ribbonNormal  = normalize(vec2(0.80, 1.0));            // same as today's ribbon axis
vec2  ribbonTangent = vec2(-ribbonNormal.y, ribbonNormal.x); // perpendicular — runs along the ribbon's length

float signedDistance = dot(q, ribbonNormal);   // measures ACROSS the ribbon — compared against warmC
float alongRibbon    = dot(q, ribbonTangent);  // position ALONG the ribbon — wave phase varies with this

float wave =
    sin(alongRibbon * 1.4 + t * 0.9) * 0.65 +
    sin(alongRibbon * 2.6 - t * 1.6 + 1.3) * 0.35;

float waveAmp = 0.16 + 0.10 * w2.x;   // noise-modulated amplitude — breaks regularity

float warm = smoothstep(
    warmW * (1.0 + 0.15 * w2.y),      // width also gets a subtle noise-modulated wobble
    0.0,
    abs(signedDistance - warmC - wave * waveAmp)
);
```

`signedDistance` (formerly `s`) is the threshold variable — it measures
position *across* the ribbon and is compared against `warmC`. `alongRibbon`
(formerly `across`) is purely a phase input for the waves — position *along*
the ribbon's length. The wave perturbs where the ribbon's centerline sits
(`signedDistance - warmC - wave*waveAmp`), not the color directly.

### Anti-"decorative stripe" constraints

- `wave` is two sine terms at different frequencies/phases/speeds, never one
  — avoids a single clean periodic band.
- `waveAmp` and the width modulation are driven by `w2` (noise), so amplitude
  and thickness vary irregularly along the ribbon and over time.
- `q` (used for both `signedDistance` and `alongRibbon`) is already warped by
  `w1` and `w2` — the undulation rides on top of an already-irregular field,
  not a straight line.
- The olive ribbon is left as-is (no undulation) — only the warm ribbon gets
  the centerline wave, per the brief's focus.

### S-bend through the lens

No lens-specific special-casing. The combination of (a) the stronger
refraction bend in §1 and (b) the centerline undulation above means the warm
ribbon's path is already non-straight as it crosses the circle region, and
the lens bends it further — producing the desired S-bend/warped-sweep read
as an emergent property of the shared field.

---

## 3. Unchanged

- Headline dark pocket (`hd` darkening), global vignette, dither.
- Palette constants and the warm/olive color-mixing logic (`AMBER → BRONZE →
  OCHRE → GOLD`, `OLIVE → MOSS`, gap crush to `TEAL`/`NB`).
- All uniforms (`uRes`, `uT`, `uCenter`, `uRadius`, `uReduced`, `uMobile`) and
  their JS-side wiring in `initHeroField`.
- `computeCircleLayout`, `capDpr`, `isMobile` (`heroLayout.js`).
- Load choreography (`.is-loaded` transitions), cursor parallax (CSS
  `--px`/`--py`), mobile menu, reduced-motion CSS — all in `Hero.astro`,
  none of this is touched.
- `uMobile`-driven warm-band shift/widen (`warmC`, `warmW` base values) stays
  as the base before the new wave/width modulation is layered on top.

---

## 4. Tuning starting points

| Constant | Starting value | Tune toward if... |
|---|---|---|
| `ETA` | `1.0/1.45` | range 1.3–1.5; higher = more bending |
| `DEPTH_SCALE` | `0.9` | reduce if pinching/non-monotonic near rim |
| Edge falloff band | `smoothstep(0.90, 1.0, r)` | widen toward `0.85` if pinching persists after reducing `DEPTH_SCALE` |
| Tangential weight band | `smoothstep(0.45, 0.85, r)` | narrow further if any spin read remains |
| Tangential magnitude | `0.08 * fR` | — |
| Macro drift | `vec2(0.018, -0.011)` | — |
| Shape evolution rate | `0.20` | — |
| `w2` scale / weight | `1.6` / `0.35` | — |
| Wave frequencies | `1.4`, `2.6` (space) / `0.9`, `1.6` (time) | — |
| `waveAmp` base | `0.16 + 0.10*w2.x` | — |
| `warmW` modulation | `±15%` via `w2.y` | — |

All values are starting points for visual tuning, not final.

---

## 5. Verification plan

- Run the dev server and check the hero at 1440, 1920, 768, 390, and 360px
  per `CLAUDE.md`'s standard.
- Confirm: lens reads as convex glass (magnify center, bend toward edge), no
  vortex/spin, no visible seam/ring, no highlight/glow.
- Confirm: warm ribbon visibly undulates and evolves within a few seconds,
  motion feels layered/organic rather than a sliding band or sine stripe.
- Confirm: dark pocket behind the headline still reads as calm/readable —
  increased motion happens in the field/lens, not flooding the center.
- Confirm: `prefers-reduced-motion` still renders a single attractive frozen
  frame (no RAF loop), using the existing `t = 20.0` convention.
