"use client";

import { useMemo, useSyncExternalStore } from "react";
import { GradientOrbFallback } from "@/components/gradient-orb-fallback";
import { ShaderOrb } from "@/components/shader-orb";
import { isWebGLAvailable } from "@/lib/webgl";

const subscribe = () => () => {};
const serverSnapshot = () => false;

/**
 * Picks the orb renderer at runtime: WebGL shader when supported, static SVG
 * fallback otherwise. The server snapshot is always the fallback, so SSR and the
 * first client (hydration) render match; the client then swaps in the shader,
 * which fades itself in.
 */
export function GradientOrb() {
  // Probe WebGL once per mount and cache it: useSyncExternalStore calls the
  // snapshot on every render, and the probe allocates a throwaway canvas.
  const getSnapshot = useMemo(() => {
    let cached: boolean | undefined;
    return () => (cached ??= isWebGLAvailable());
  }, []);

  const useShader = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);

  return useShader ? <ShaderOrb /> : <GradientOrbFallback />;
}
