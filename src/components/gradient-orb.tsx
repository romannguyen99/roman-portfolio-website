"use client";

import { useReducedMotion } from "framer-motion";

/**
 * Design-note Option B: two layered radial gradients (amber + green) over
 * near-black, warped by feTurbulence/feDisplacementMap into an oil-on-water
 * orb and softened with a gaussian blur. Drift is slow and continuous; frozen
 * under prefers-reduced-motion. Isolated so the WebGL shader can replace it.
 */
export function GradientOrb() {
  const reduce = useReducedMotion();

  return (
    <svg
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 100 100"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <defs>
        <radialGradient id="orb-amber" cx="62%" cy="45%" r="55%">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.85" />
          <stop offset="55%" stopColor="var(--color-accent)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orb-green" cx="40%" cy="62%" r="50%">
          <stop offset="0%" stopColor="var(--color-accent-2)" stopOpacity="0.7" />
          <stop offset="60%" stopColor="var(--color-accent-2)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--color-accent-2)" stopOpacity="0" />
        </radialGradient>
        <filter id="orb-distort" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves="2"
            seed="7"
            result="noise"
          >
            {!reduce && (
              <animate
                attributeName="baseFrequency"
                dur="24s"
                values="0.012;0.02;0.012"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      <rect width="100" height="100" fill="var(--color-bg)" />
      <g filter="url(#orb-distort)">
        {!reduce && (
          <animateTransform
            attributeName="transform"
            type="translate"
            dur="40s"
            values="-2 -1; 2 1; -2 -1"
            repeatCount="indefinite"
          />
        )}
        <ellipse cx="55" cy="50" rx="48" ry="44" fill="url(#orb-amber)" />
        <ellipse cx="42" cy="58" rx="40" ry="42" fill="url(#orb-green)" />
      </g>
    </svg>
  );
}
