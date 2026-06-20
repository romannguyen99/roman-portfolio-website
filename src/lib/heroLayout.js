// Pure geometry for the hero circle, mirroring the validated reference.
// All values in CSS pixels. cyTop is measured from the TOP of the viewport.
export function computeCircleLayout(W, H) {
  let D, rightBeyond, topBeyond;
  if (W <= 640) {
    D = (W <= 360 ? 0.76 : 0.80) * W;
    rightBeyond = 0.10 * W;
    topBeyond = (W <= 360 ? 0.15 : 0.16) * H;
  } else {
    D = Math.min(Math.max(580, 0.44 * W), 760);
    rightBeyond = 0.07 * W;
    topBeyond = 0.08 * H;
  }
  const cx = W + rightBeyond - D / 2;   // centre x from left
  const cyTop = -topBeyond + D / 2;     // centre y from top
  return { D, cx, cyTop };
}

export function capDpr(dpr, W) {
  return Math.min(dpr || 1, W <= 640 ? 1.5 : 2);
}

export function isMobile(W) {
  return W <= 640;
}

// ---- Field framing (cover-fit across aspect ratios) ----
// Shared with the shader via the uFpp/uOy uniforms set in resize().
export const FIELD_SCALE = 1.40; // vertical field extent shown at the reference aspect

const A0 = 1.60;       // reference aspect the look was validated at (1440×900)
const MAX_ZOOM = 1.55; // m floor = 1/MAX_ZOOM; caps zoom-in so super-ultrawide doesn't over-crop the ribbon
export const FOCAL_Y = 0.54; // anchor the vertical crop on the headline row (matches the dark pocket)

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
