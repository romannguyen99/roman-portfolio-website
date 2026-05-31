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
uniform vec2 u_resolution;
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

  // gl_FragCoord is in physical pixels; u_resolution is too. The grain
  // tile size stays consistent across DPRs and viewport sizes.
  vec2 screenUv = gl_FragCoord.xy / max(u_resolution.x, 1.0);
  float grain = (hash(screenUv + fract(u_time)) - 0.5) * 0.06;
  color += grain;

  gl_FragColor = vec4(color, 1.0);
}
`;
