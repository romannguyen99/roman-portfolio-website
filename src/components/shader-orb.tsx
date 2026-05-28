// src/components/shader-orb.tsx
"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { hexToRgb } from "@/lib/color";
import { ORB_FRAG, ORB_VERT } from "@/shaders/orb";

/**
 * WebGL orb (design-note Option A). Fullscreen-triangle fragment shader driven
 * by ogl. Pauses when offscreen or the tab is hidden; renders a single static
 * frame under prefers-reduced-motion. Fades in to avoid a black-canvas flash.
 */
export function ShaderOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new Renderer({
      canvas,
      alpha: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    const gl = renderer.gl;

    const css = getComputedStyle(document.documentElement);
    const program = new Program(gl, {
      vertex: ORB_VERT,
      fragment: ORB_FRAG,
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: [1, 1] },
        u_bg: { value: hexToRgb(css.getPropertyValue("--color-bg")) },
        u_accent: { value: hexToRgb(css.getPropertyValue("--color-accent")) },
        u_accent2: { value: hexToRgb(css.getPropertyValue("--color-accent-2")) },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    // Size to the parent section. We measure the parent (not the canvas)
    // because ogl's setSize writes explicit px into canvas.style, which would
    // otherwise feed back into the next measurement and lock the size; we reset
    // the canvas style to fill after each setSize.
    const sizeTarget = canvas.parentElement ?? canvas;
    const resize = () => {
      renderer.setSize(sizeTarget.clientWidth, sizeTarget.clientHeight);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      program.uniforms.u_resolution.value = [
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
      ];
    };
    const ro = new ResizeObserver(resize);
    ro.observe(sizeTarget);
    resize();

    const startedAt = performance.now();
    let raf = 0;
    let running = false;
    let inView = true;
    let pageVisible = !document.hidden;

    const frame = (now: number) => {
      program.uniforms.u_time.value = (now - startedAt) / 1000;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(frame);
    };
    const play = () => {
      if (running || reduce || !inView || !pageVisible) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Paint one frame immediately (also the only frame under reduced motion),
    // then reveal the canvas.
    renderer.render({ scene: mesh });
    canvas.style.opacity = "1";

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) play();
      else pause();
    });
    io.observe(canvas);

    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) play();
      else pause();
    };
    document.addEventListener("visibilitychange", onVisibility);

    play();

    return () => {
      pause();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      // Release the GL context on a real unmount so contexts don't accumulate
      // across route changes. Skipped in dev: React StrictMode re-runs this
      // effect on the same canvas, and a lost context can't be re-acquired from
      // it, so the second init would get a dead context.
      if (process.env.NODE_ENV === "production") {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0,
        transition: "opacity 800ms ease",
      }}
    />
  );
}
