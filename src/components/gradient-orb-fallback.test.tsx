import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { GradientOrbFallback } from "./gradient-orb-fallback";

describe("GradientOrbFallback", () => {
  it("renders the static svg with amber and green gradient defs", () => {
    const { container } = render(<GradientOrbFallback />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("#orb-amber")).toBeTruthy();
    expect(container.querySelector("#orb-green")).toBeTruthy();
  });

  it("contains no SMIL animation elements (frozen)", () => {
    const { container } = render(<GradientOrbFallback />);
    expect(container.querySelector("animate")).toBeNull();
    expect(container.querySelector("animateTransform")).toBeNull();
  });
});
