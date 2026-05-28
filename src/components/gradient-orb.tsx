"use client";

import { useSyncExternalStore } from "react";
import { GradientOrbFallback } from "@/components/gradient-orb-fallback";
import { ShaderOrb } from "@/components/shader-orb";
import { isWebGLAvailable } from "@/lib/webgl";

const subscribe = () => () => {};

/**
 * Picks the orb renderer at runtime: WebGL shader when supported, static SVG
 * fallback otherwise. The server snapshot is always the fallback, so SSR and the
 * first client (hydration) render match; the client then swaps in the shader,
 * which fades itself in.
 */
export function GradientOrb() {
  const useShader = useSyncExternalStore(
    subscribe,
    () => isWebGLAvailable(),
    () => false,
  );

  return useShader ? <ShaderOrb /> : <GradientOrbFallback />;
}
