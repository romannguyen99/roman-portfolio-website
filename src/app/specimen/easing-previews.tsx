"use client";

import { useState } from "react";

const EASINGS = [
  { name: "ease-out-expo", value: "var(--ease-out-expo)" },
  { name: "ease-in-out", value: "var(--ease-in-out)" },
  { name: "ease-linear", value: "var(--ease-linear)" },
] as const;

// translate() percentages reference the element's own size, not the container.
// Dot is 24px wide; this lands it ~336px right of its start, well inside the
// 448px (max-w-md) container with the label still visible on the right.
const DOT_TRAVEL = "calc(100% * 14)";

export function EasingPreviews() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {EASINGS.map(({ name, value }) => {
        const isActive = hovered === name;
        return (
          <button
            key={name}
            type="button"
            onMouseEnter={() => setHovered(name)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(name)}
            onBlur={() => setHovered(null)}
            className="relative h-12 w-full max-w-md overflow-hidden rounded border border-[var(--color-fg-dim)] text-left"
            aria-label={`Preview ${name}`}
          >
            <span
              className="absolute top-1/2 left-2 block h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--color-accent)]"
              style={{
                transform: `translate(${isActive ? DOT_TRAVEL : "0"}, -50%)`,
                transitionProperty: "transform",
                transitionDuration: "var(--duration-base)",
                transitionTimingFunction: value,
              }}
            />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 font-[var(--font-mono)] text-[var(--text-caption)] text-[var(--color-fg-muted)] uppercase">
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
