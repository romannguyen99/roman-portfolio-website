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
  // World-space normal. Three's normalMatrix produces a view-space normal,
  // but the fragment shader compares against cameraPosition which is in
  // world space. mat3(modelMatrix) is correct under uniform scale — the
  // orb mesh never scales non-uniformly, so this is safe. If a future step
  // introduces non-uniform scale, swap to transpose(inverse(mat3(modelMatrix))).
  vNormal = normalize(mat3(modelMatrix) * perturbed);
  vDisp = disp;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;
