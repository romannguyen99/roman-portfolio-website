"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { GradientOrb } from "@/components/gradient-orb";
import { ScrollBadge } from "@/components/scroll-badge";
import { useHeroEntrance } from "@/hooks/use-hero-entrance";

const WORDS = ["Roman", "Nguyen"];
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const started = useHeroEntrance();
  const reduce = useReducedMotion();

  // Headline begins 600ms after the signal; 80ms between words.
  const container: Variants = reduce
    ? { hidden: {}, visible: { transition: { delayChildren: 0, staggerChildren: 0 } } }
    : { hidden: {}, visible: { transition: { delayChildren: 0.6, staggerChildren: 0.08 } } };

  const word: Variants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4 } } }
    : {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: EASE_OUT_EXPO } },
      };

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--color-bg)",
      }}
    >
      <GradientOrb />

      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          paddingInline: "clamp(2rem, 6vw, 8rem)",
        }}
      >
        <motion.h1
          variants={container}
          initial="hidden"
          animate={started ? "visible" : "hidden"}
          style={{
            margin: 0,
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-display)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: 1.0,
            color: "var(--color-fg)",
            maxWidth: "14ch",
          }}
        >
          {WORDS.map((w, i) => (
            <motion.span
              key={w}
              variants={word}
              style={{ display: "inline-block", marginRight: i === 0 ? "0.25em" : 0 }}
            >
              {w}
            </motion.span>
          ))}
        </motion.h1>
      </div>

      <ScrollBadge started={started} />
    </section>
  );
}
