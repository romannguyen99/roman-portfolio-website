// Shared scroll-reveal: fades [data-reveal] elements in as they enter the viewport.
// Reused across content sections (Works now; Thoughts/About/Contact later).
// Graceful: with no JS or reduced motion, content is shown immediately (never gated).
export function initReveal(selector = '[data-reveal]') {
  const els = Array.from(document.querySelectorAll(selector));
  if (!els.length) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('revealed'));
    return;
  }

  // Opt into the hidden initial state only now that JS + motion are confirmed.
  // (Targets here are below the fold, so this snap-to-hidden is never visible.)
  document.documentElement.classList.add('js-reveal');

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );
  els.forEach((el) => io.observe(el));
}
