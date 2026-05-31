"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { DirectionalLight } from "three";
import { Orb } from "./orb";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type Props = {
  /** Called when the orb mesh paints its first frame. */
  onFirstFrame: () => void;
};

export function OrbCanvas({ onFirstFrame }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<DirectionalLight>(null);
  const reduce = useReducedMotion();
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(
    typeof document === "undefined" ? true : !document.hidden,
  );

  // Pause when the canvas leaves the viewport.
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const io = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // Pause when the tab loses visibility.
  useEffect(() => {
    const onChange = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  const running = inView && tabVisible && !reduce;

  return (
    <div
      ref={wrapperRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [0, 0, 2.4], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Source of truth for key-light direction. Orb reads its
            position into u_lightDir each frame; step 5 can tween. */}
        <directionalLight
          ref={lightRef}
          position={[0.6, 0.7, 0.8]}
          intensity={1}
        />
        <Orb running={running} onFirstFrame={onFirstFrame} lightRef={lightRef} />
      </Canvas>
    </div>
  );
}
