"use client";

import { useState, useSyncExternalStore } from "react";
import { isWebGLAvailable } from "@/lib/webgl";
import { OrbCanvas } from "./orb-canvas";
import { OrbFallback } from "./orb-fallback";

const subscribe = () => () => {};
const getServerSnapshot = () => false;

/**
 * Hero orb dispatcher. The SVG fallback is always mounted as the underlay.
 * On WebGL-capable clients, the canvas overlays on top at opacity 0 and
 * fades to 1 over 300 ms once the orb mesh paints its first frame, so the
 * eye never catches the SVG-to-canvas swap.
 */
export function OrbStage() {
  const useShader = useSyncExternalStore(
    subscribe,
    () => isWebGLAvailable(),
    getServerSnapshot,
  );
  const [canvasReady, setCanvasReady] = useState(false);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <OrbFallback />
      {useShader ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: canvasReady ? 1 : 0,
            transition: "opacity 300ms ease",
          }}
        >
          <OrbCanvas onFirstFrame={() => setCanvasReady(true)} />
        </div>
      ) : null}
    </div>
  );
}
