import type Lenis from "lenis";

let instance: Lenis | null = null;

/** Register (or clear) the app's single Lenis smooth-scroll instance. */
export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}

/** The current global Lenis instance, or null if not mounted. */
export function getLenis(): Lenis | null {
  return instance;
}

/** Scroll down by one viewport, using Lenis when available. */
export function scrollToNext() {
  const target = typeof window !== "undefined" ? window.innerHeight : 0;
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target);
    return;
  }
  if (typeof window !== "undefined") {
    window.scrollTo({ top: target, behavior: "smooth" });
  }
}
