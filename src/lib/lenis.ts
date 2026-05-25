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

/** Scroll down one viewport from the current position, using Lenis when available. */
export function scrollToNext() {
  if (typeof window === "undefined") return;
  const target = window.scrollY + window.innerHeight;
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target);
    return;
  }
  window.scrollTo({ top: target, behavior: "smooth" });
}
