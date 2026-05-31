import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

/**
 * Display + body face. Attach `plusJakartaSans.variable` to `<html>` className
 * so `--font-plus-jakarta` resolves site-wide (consumed by `--font-display`).
 */
export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

/**
 * Mono face for captions, code, metadata. Normal-only on purpose — italic
 * mono would only matter inside code blocks, and we don't render italic
 * inside them anywhere. Add `style: ["normal", "italic"]` if that changes.
 */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: "variable",
  display: "swap",
  variable: "--font-jetbrains",
});
