"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LOADER_SEEN_KEY } from "@/lib/session-keys";

// Timeline (ms) — see docs/superpowers/specs/2026-05-25-page-loader-design.md
const FADE_IN_MS = 200;
const FILL_MS = 1500;
const FADE_OUT_MS = 400;

// --ease-out-expo, as a Framer Motion cubic-bezier array.
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

type Phase = "enter" | "fill" | "exit";

function fireComplete() {
  window.dispatchEvent(new CustomEvent("loader:complete"));
}

export function PageLoader() {
  // Default visible so SSR and the first client render match (the overlay's
  // initial opacity is 0, so returning visitors see no flash before the
  // session-skip effect dismisses it). All state updates happen inside timer
  // callbacks, never synchronously in the effect body.
  const [active, setActive] = useState(true);
  const [phase, setPhase] = useState<Phase>("enter");

  useEffect(() => {
    if (sessionStorage.getItem(LOADER_SEEN_KEY)) {
      const skip = setTimeout(() => {
        setActive(false);
        fireComplete();
      }, 0);
      return () => clearTimeout(skip);
    }

    const toFill = setTimeout(() => setPhase("fill"), FADE_IN_MS);
    const toExit = setTimeout(() => setPhase("exit"), FADE_IN_MS + FILL_MS);
    const toDone = setTimeout(() => {
      sessionStorage.setItem(LOADER_SEEN_KEY, "1");
      setActive(false);
      fireComplete();
    }, FADE_IN_MS + FILL_MS + FADE_OUT_MS);

    return () => {
      clearTimeout(toFill);
      clearTimeout(toExit);
      clearTimeout(toDone);
    };
  }, []);

  if (!active) return null;

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "exit" ? 0 : 1 }}
      transition={{
        duration: (phase === "exit" ? FADE_OUT_MS : FADE_IN_MS) / 1000,
        ease: EASE_OUT_EXPO,
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        backgroundColor: "var(--color-bg)",
      }}
    >
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: FADE_IN_MS / 1000, ease: EASE_OUT_EXPO }}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          fontWeight: 400,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--color-fg)",
        }}
      >
        HOLD UP ...
      </motion.span>

      <div style={{ width: "200px", height: "1px", backgroundColor: "#2a2a2a" }}>
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: phase === "enter" ? "0%" : "100%" }}
          transition={{ duration: FILL_MS / 1000, ease: EASE_OUT_EXPO }}
          style={{ height: "100%", backgroundColor: "var(--color-fg)" }}
        />
      </div>
    </motion.div>
  );
}
