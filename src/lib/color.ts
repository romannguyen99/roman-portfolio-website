/**
 * Convert a CSS hex string (e.g. "#0a0a0a", "#0f0") to normalized [r,g,b] in 0..1.
 * Returns [0,0,0] for any non-hex input (e.g. "rgb(...)", "oklch(...)") rather
 * than NaN — guards against future token-format changes silently breaking
 * shader color uniforms.
 */
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0];
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
