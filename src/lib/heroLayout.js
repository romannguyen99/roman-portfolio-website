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
