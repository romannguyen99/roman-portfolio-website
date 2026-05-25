"use client";

import { useEffect, useState } from "react";

const LOADER_SEEN_KEY = "loader-seen";

/**
 * True once the page loader has finished (`loader:complete`) or was skipped
 * this session (`loader-seen` already set at mount). All state updates happen
 * inside callbacks, never synchronously in the effect body.
 */
export function useHeroEntrance(): boolean {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (!cancelled) setStarted(true);
    };

    if (sessionStorage.getItem(LOADER_SEEN_KEY)) {
      const id = setTimeout(start, 0);
      return () => {
        cancelled = true;
        clearTimeout(id);
      };
    }

    window.addEventListener("loader:complete", start, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("loader:complete", start);
    };
  }, []);

  return started;
}
