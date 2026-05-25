"use client";

import { motion, useReducedMotion } from "framer-motion";
import { scrollToNext } from "@/lib/lenis";

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
const RING_LABEL = "SCROLL DOWN • SCROLL DOWN • ";

/** Bottom-left rotating badge. Fades in at 1800ms after the entrance signal. */
export function ScrollBadge({ started }: { started: boolean }) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-label="Scroll down"
      onClick={scrollToNext}
      initial={{ opacity: 0 }}
      animate={{ opacity: started ? 1 : 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: started ? 1.8 : 0 }}
      style={{
        position: "absolute",
        left: "clamp(1.5rem, 4vw, 4rem)",
        bottom: "clamp(1.5rem, 4vw, 4rem)",
        width: 90,
        height: 90,
        display: "grid",
        placeItems: "center",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "var(--color-fg-muted)",
      }}
    >
      <motion.svg
        width="90"
        height="90"
        viewBox="0 0 90 90"
        aria-hidden
        animate={reduce ? undefined : { rotate: 360 }}
        transition={reduce ? undefined : { duration: 20, ease: "linear", repeat: Infinity }}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <path
            id="badge-ring"
            d="M45,45 m-32,0 a32,32 0 1,1 64,0 a32,32 0 1,1 -64,0"
            fill="none"
          />
        </defs>
        <text
          fontSize="8"
          letterSpacing="2"
          fill="currentColor"
          style={{ textTransform: "uppercase", fontFamily: "var(--font-mono)" }}
        >
          <textPath href="#badge-ring">{RING_LABEL}</textPath>
        </text>
      </motion.svg>

      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden style={{ color: "var(--color-fg)" }}>
        <path d="M7 1 V12 M2.5 7.5 L7 12 L11.5 7.5" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>
    </motion.button>
  );
}
