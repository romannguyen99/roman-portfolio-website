import { afterEach, describe, expect, it, vi } from "vitest";
import { isWebGLAvailable } from "./webgl";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isWebGLAvailable", () => {
  it("returns false when no WebGL context is available (jsdom default)", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(isWebGLAvailable()).toBe(false);
  });

  it("returns true when a webgl context is returned", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as RenderingContext,
    );
    expect(isWebGLAvailable()).toBe(true);
  });
});
