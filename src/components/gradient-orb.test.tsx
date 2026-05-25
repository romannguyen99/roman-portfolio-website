import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { GradientOrb } from "./gradient-orb";

describe("GradientOrb", () => {
  it("renders an svg with the amber and green gradient defs", () => {
    const { container } = render(<GradientOrb />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("#orb-amber")).toBeTruthy();
    expect(container.querySelector("#orb-green")).toBeTruthy();
  });
});
