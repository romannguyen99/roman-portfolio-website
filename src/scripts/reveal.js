// Shared scroll-reveal: fades [data-reveal] elements in as they enter the viewport.
// Reused across content sections (Works, Thoughts, and later About/Contact).
// Idempotent: safe to call once per section — each call observes only the new, unbound
// [data-reveal] elements, via a module-level singleton observer + bound set.
// Graceful: with no JS or reduced motion, content is shown immediately (never gated).
let observer = null;
const bound = new WeakSet();

export function initReveal(selector = '[data-reveal]') {
  const els = Array.from(document.querySelectorAll(selector)).filter((el) => !bound.has(el));
  if (!els.length) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((el) => {
      el.classList.add('revealed');
      bound.add(el);
    });
    return;
  }

  // Opt into the hidden initial state only now that JS + motion are confirmed.
  // (Targets here are below the fold, so this snap-to-hidden is never visible.)
  document.documentElement.classList.add('js-reveal');

  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
  }

  els.forEach((el) => {
    observer.observe(el);
    bound.add(el);
  });
}
