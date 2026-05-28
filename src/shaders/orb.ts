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

  float hash(vec2 p){
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main(){
    // aspect-corrected, centered coords; orb biased toward upper-right.
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= u_resolution.x / max(u_resolution.y, 1.0);
    vec2 p = (uv - vec2(0.45, 0.15)) / 1.15;

    float t = u_time * 0.05;
    float scale = 1.1;
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
    float n2 = snoise(vec3(p * scale * 1.7 + 10.0, t * 1.3));
    vec3 nrm = normalize(normal + 0.28 * vec3(n1, n2, 0.0));

    // fresnel rim (glassy edge).
    float fres = pow(1.0 - max(nrm.z, 0.0), 2.5);

    // fixed key light, upper-right.
    vec3 lightDir = normalize(vec3(0.6, 0.7, 0.8));
    float diff = max(dot(nrm, lightDir), 0.0);
    float spec = pow(max(dot(reflect(-lightDir, nrm), vec3(0.0, 0.0, 1.0)), 0.0), 24.0);

    // --- color: restrained amber/green oil-on-water over a dark core ---
    float f1 = 0.5 + 0.5 * n1;
    float f2 = 0.5 + 0.5 * n2;
    vec3 pale = mix(u_accent, vec3(1.0), 0.4);                   // cream highlight
    vec3 mat = mix(u_accent2, u_accent, smoothstep(0.3, 0.75, f1)); // green <-> amber bands
    mat = mix(mat, pale, smoothstep(0.6, 0.95, f2) * 0.5);      // bright streaks

    // volume: dark core lifted toward the light; fresnel rim glows amber/cream.
    vec3 color = mix(u_bg, mat, 0.22 + 0.6 * diff);
    color = mix(color, mix(u_accent, pale, 0.5), fres * 0.6);
    color += spec * pale * 0.35;

    // soft silhouette: fade into bg near the edge.
    float edge = smoothstep(1.0, 0.7, distSq);
    color = mix(u_bg, color, edge);

    color += grain;
    gl_FragColor = vec4(color, 1.0);
  }
`;
