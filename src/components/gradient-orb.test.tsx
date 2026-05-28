// src/components/gradient-orb.test.tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

// Stub ShaderOrb so the dispatcher test never touches real WebGL/ogl.
vi.mock("./shader-orb", () => ({
  ShaderOrb: () => <div data-testid="shader-orb" />,
}));

import * as webgl from "@/lib/webgl";
import { GradientOrb } from "./gradient-orb";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GradientOrb dispatcher", () => {
  it("renders the SVG fallback when WebGL is unavailable", async () => {
    vi.spyOn(webgl, "isWebGLAvailable").mockReturnValue(false);
    const { container } = render(<GradientOrb />);
    await waitFor(() => {
      expect(container.querySelector("#orb-amber")).toBeTruthy();
    });
    expect(container.querySelector("[data-testid='shader-orb']")).toBeNull();
  });

  it("renders the shader when WebGL is available", async () => {
    vi.spyOn(webgl, "isWebGLAvailable").mockReturnValue(true);
    const { getByTestId } = render(<GradientOrb />);
    await waitFor(() => {
      expect(getByTestId("shader-orb")).toBeInTheDocument();
    });
  });

  it("renders the fallback in SSR output even when WebGL would be available (no hydration mismatch)", () => {
    vi.spyOn(webgl, "isWebGLAvailable").mockReturnValue(true);
    // Server render runs no effects, so detection hasn't happened yet — the
    // initial markup must be the fallback so SSR and first client render match.
    const html = renderToStaticMarkup(<GradientOrb />);
    expect(html).toContain("orb-amber");
    expect(html).not.toContain("shader-orb");
  });
});
