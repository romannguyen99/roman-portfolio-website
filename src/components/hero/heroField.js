import { computeCircleLayout, capDpr, isMobile } from '../../lib/heroLayout.js';

// VERT: copy of the <script id="vert"> element from docs/hero-reference.html, verbatim.
const VERT = `
    attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }
`;

// FRAG: copy of the <script id="frag"> element from docs/hero-reference.html, verbatim.
const FRAG = `
    precision highp float;
    uniform vec2  uRes;      // device px
    uniform float uT;        // seconds
    uniform vec2  uCenter;   // circle centre, device px, y from BOTTOM
    uniform float uRadius;   // device px
    uniform float uReduced;  // 1.0 = freeze motion
    uniform float uMobile;   // 1.0 = portrait/mobile composition

    // ---- low-frequency value noise ----
    float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
    float vnoise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      float a = hash(i), b = hash(i+vec2(1.,0.)), c = hash(i+vec2(0.,1.)), d = hash(i+vec2(1.,1.));
      vec2 u = f*f*(3.-2.*f);
      return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
    }
    // ONE or two very low-frequency layers only — used to bend ribbons, never as visible texture
    float fbm(vec2 p){ float v = 0.6*vnoise(p); v += 0.4*vnoise(p*2.0 + 4.0); return v; }

    // earth-tone palette
    const vec3 NB    = vec3(0.027,0.031,0.024); // #070806 near-black
    const vec3 WB    = vec3(0.063,0.051,0.031); // #100D08 warm-black base
    const vec3 OLIVE = vec3(0.176,0.188,0.110); // #2D301C
    const vec3 MOSS  = vec3(0.278,0.278,0.161); // #474729
    const vec3 OCHRE = vec3(0.596,0.439,0.196); // #987032
    const vec3 GOLD  = vec3(0.678,0.522,0.239); // #AD853D
    const vec3 BRONZE= vec3(0.439,0.290,0.133); // #704A22
    const vec3 AMBER = vec3(0.286,0.188,0.098); // #493019
    const vec3 TEAL  = vec3(0.078,0.153,0.141); // #142724 smoky shadow tone

    // ribbon axis: ribbonNormal measures ACROSS the ribbon, ribbonTangent runs ALONG it.
    // Precomputed literals (GLSL ES 1.00 does not guarantee normalize() in a const initializer).
    const vec2 ribbonNormal  = vec2(0.6247, 0.7809);  // normalize(vec2(0.80, 1.0))
    const vec2 ribbonTangent = vec2(-ribbonNormal.y, ribbonNormal.x);

    // ===== ONE shared procedural field. p is in field space. =====
    // The colour is built from 2–3 broad, smooth, directional RIBBONS over a
    // mostly near-black base. No radial blobs, no high-freq noise.
    vec3 field(vec2 p){
      float t = uReduced > 0.5 ? 20.0 : uT;
      vec2 drift = vec2(t*0.018, -t*0.011);          // L->R, slightly up (~18s sweep)
      float curve = sin(t*0.20);                     // secondary curvature ~31s
      // ONE low-frequency warp layer bends the ribbons so they curve, not stripe
      vec2 w = vec2(fbm(p*0.55 + drift + curve*0.30),
                    fbm(p*0.55 + drift*0.6 + 9.0)) - 0.5;
      vec2 q = p + w * 0.95;

      // directional ribbon coordinate (lower-left -> upper-right)
      float signedDistance = dot(q, ribbonNormal);

      // warm ribbon (its EDGE crosses the circle) and olive ribbon (lower-left) as smooth bands.
      // On portrait the cropped circle sits at a lower signedDistance, so shift/widen the warm band to read through it.
      float warmC = mix(1.78, 1.30, uMobile);
      float warmW = 0.46 + uMobile * 0.12;
      float warm  = smoothstep(warmW, 0.0, abs(signedDistance - warmC));
      float olive = 1.0 - smoothstep(0.0, 0.55, abs(signedDistance - 0.35));

      vec3 col = WB;                                  // warm-black canvas
      // olive / moss ribbon
      col = mix(col, OLIVE, olive);
      col = mix(col, MOSS,  smoothstep(0.45, 1.0, olive) * 0.55);
      // warm ribbon: amber edges -> bronze -> ochre -> thin gold core (light AND dark within it)
      col = mix(col, AMBER,  smoothstep(0.00, 0.55, warm) * 0.85);
      col = mix(col, BRONZE, smoothstep(0.30, 0.78, warm));
      col = mix(col, OCHRE,  smoothstep(0.62, 0.94, warm));
      col = mix(col, GOLD,   smoothstep(0.86, 1.00, warm) * 0.9);
      // gaps between ribbons: smoky-teal shadow tone, then crush toward near-black (mostly dark)
      float gap = (1.0 - warm) * (1.0 - olive);
      col = mix(col, TEAL, gap * 0.10);
      col = mix(col, NB,   gap * (0.55 - uMobile * 0.10));  // a touch more atmosphere on mobile
      return col;
    }

    void main(){
      vec2 frag = gl_FragCoord.xy;
      float aspect = uRes.x / uRes.y;
      vec2 uv = frag / uRes;                          // 0..1, y from bottom
      float scale = 1.40;
      vec2 P  = vec2(uv.x*aspect, uv.y) * scale;      // field space
      vec2 cP = vec2((uCenter.x/uRes.x)*aspect, uCenter.y/uRes.y) * scale;

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

      // a whisper more local contrast inside the lens (same field, no brightness halo)
      float inside = 1.0 - smoothstep(0.97, 1.0, r);
      col = mix(col, clamp((col - 0.5) * 1.12 + 0.5, 0.0, 1.0), inside * 0.20);

      // gentle dark calm behind the centred headline (soft, not an oval spotlight)
      float hd = distance(vec2(uv.x*aspect, uv.y), vec2(0.5*aspect, 0.54));
      col *= mix(0.74, 1.0, smoothstep(0.06, 0.46, hd));

      // soft global vignette
      col *= 1.0 - 0.30 * smoothstep(0.58, 1.15, distance(uv, vec2(0.5)) * 1.35);

      // dither to kill banding
      col += (hash(frag + uT) - 0.5) / 255.0;

      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
  }
  return s;
}

// Initialises the shared-field shader on the given canvas.
// Returns a cleanup function. Falls back to a static CSS gradient if WebGL is unavailable.
export function initHeroField(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) {
    canvas.style.background =
      'radial-gradient(60% 50% at 85% 10%, #5a3c0d 0%, transparent 55%), radial-gradient(70% 60% at 12% 105%, #2d301c 0%, transparent 55%), #070806';
    return () => {};
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = (n) => gl.getUniformLocation(prog, n);
  const uRes = U('uRes'), uT = U('uT'), uCenter = U('uCenter'),
        uRadius = U('uRadius'), uReduced = U('uReduced'), uMobile = U('uMobile');
  gl.uniform1f(uReduced, reduced ? 1.0 : 0.0);

  let dpr = 1;
  function resize() {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    dpr = capDpr(window.devicePixelRatio, W);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    const { D, cx, cyTop } = computeCircleLayout(W, H);
    gl.uniform2f(uCenter, cx * dpr, (H - cyTop) * dpr); // y flipped to bottom-origin
    gl.uniform1f(uRadius, (D / 2) * dpr);
    gl.uniform1f(uMobile, isMobile(W) ? 1.0 : 0.0);
  }
  window.addEventListener('resize', resize);
  resize();

  let raf = 0;
  const start = performance.now();
  function frame(now) {
    gl.uniform1f(uT, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduced) raf = requestAnimationFrame(frame);
  }
  if (reduced) { gl.uniform1f(uT, 18.0); gl.drawArrays(gl.TRIANGLES, 0, 3); }
  else raf = requestAnimationFrame(frame);

  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
}
