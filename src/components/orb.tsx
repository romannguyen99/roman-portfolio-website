"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { DirectionalLight, ShaderMaterial, Vector2, Vector3 } from "three";
import { hexToRgb } from "@/lib/color";
import { ORB_VERT } from "@/shaders/orb.vert";
import { ORB_FRAG } from "@/shaders/orb.frag";

type Props = {
  running: boolean;
  /** Called exactly once, after the orb's first render. */
  onFirstFrame: () => void;
  /** Source of truth for the key-light direction. Step 5 can tween this via R3F. */
  lightRef: RefObject<DirectionalLight | null>;
};

function readColorToken(name: string): Vector3 {
  if (typeof window === "undefined") {
    return new Vector3(0, 0, 0);
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const [r, g, b] = hexToRgb(value || "#000000");
  return new Vector3(r, g, b);
}

export function Orb({ running, onFirstFrame, lightRef }: Props) {
  const matRef = useRef<ShaderMaterial>(null);
  const { invalidate, size } = useThree();
  const firedRef = useRef(false);

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new Vector2(1, 1) },
      u_bg: { value: readColorToken("--color-bg") },
      u_accent: { value: readColorToken("--color-accent") },
      u_accent2: { value: readColorToken("--color-accent-2") },
      // Initialized to a sensible default; the per-frame update below pulls
      // the live position from the directional light in the scene.
      u_lightDir: { value: new Vector3(0.6, 0.7, 0.8) },
    }),
    [],
  );

  // Keep u_resolution in sync with the canvas size.
  useEffect(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.u_resolution.value.set(size.width, size.height);
  }, [size.width, size.height]);

  const framesSeenRef = useRef(0);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    // Only advance time while running — never write a "paused" value, or the
    // shader sees a discontinuous time jump when the orb resumes.
    if (running) {
      matRef.current.uniforms.u_time.value = clock.elapsedTime;
    }
    // Sync the key-light direction from the scene's <directionalLight>.
    // Cheap (~3 float copies) and means step 5 can tween the React prop on
    // <OrbCanvas> without touching shader code.
    const light = lightRef.current;
    if (light) {
      matRef.current.uniforms.u_lightDir.value
        .copy(light.position)
        .normalize();
    }
    // useFrame runs before the browser composites the canvas. Fire
    // onFirstFrame on the *second* useFrame so the caller's crossfade
    // doesn't race a still-blank canvas.
    if (!firedRef.current) {
      framesSeenRef.current += 1;
      if (framesSeenRef.current >= 2) {
        firedRef.current = true;
        onFirstFrame();
      } else {
        invalidate();
      }
    }
    if (running) invalidate();
  });

  return (
    <mesh>
      <icosahedronGeometry args={[1, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={ORB_VERT}
        fragmentShader={ORB_FRAG}
        uniforms={uniforms}
      />
    </mesh>
  );
}
